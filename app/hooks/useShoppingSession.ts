"use client";

/**
 * useShoppingSession
 *
 * Manages the full BLA-87 ShoppingSession lifecycle for a given event:
 *
 *  1. On mount (user authenticated): GET active session or POST create one.
 *  2. Seeds Zustand cart from backend items so the UI is immediately accurate
 *     after a page refresh (backend is the source of truth).
 *  3. Syncs Zustand → backend via PUT /items with optimistic locking every
 *     time the cart changes (debounced 600 ms).
 *  4. Sends heartbeat every `heartbeatSeconds` seconds (default 30).
 *  5. Tracks absolute expiry (`absoluteExpiresAt`) independently of heartbeats.
 *  6. On 410 from any call, transitions to `expired` state and calls onExpired.
 *  7. Exposes `commitToReservation()` that does the atomic ShoppingSession →
 *     Reservation transition with the current version tag.
 *
 * Zustand/localStorage remains the local UI cache; this hook ensures the
 * remote session is always the source of truth on load.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useCartStore } from "@/app/store/cartStore";
import {
  createShoppingSession,
  getActiveShoppingSession,
  sendHeartbeat,
  updateSessionItems,
  commitSessionToReservation,
  ShoppingSessionExpiredError,
  ShoppingSessionConflictError,
  type ShoppingSession,
} from "@/app/lib/shoppingSessionApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SessionStatus =
  | "idle"       // Not yet initialised (no user or event yet).
  | "loading"    // Fetching / creating a session.
  | "active"     // Session exists and is alive.
  | "syncing"    // Writing items to the backend (non-blocking optimistic).
  | "expired"    // 410 received or absolute TTL hit.
  | "error";     // Unrecoverable fetch error.

export interface UseShoppingSessionOptions {
  /** Numeric event id from the page params. */
  eventId: number | null;
  /**
   * FunctionId for the EventFunction.
   * Until the frontend exposes function selection this mirrors eventId.
   * Pass the real functionId once multi-function support is available.
   */
  functionId: number | null;
  /** Called when the session expires (410 or TTL). */
  onExpired?: () => void;
  /**
   * Set to true only while the user is authenticated.
   * The hook does nothing until this is true to avoid anonymous API calls.
   */
  authenticated: boolean;
}

export interface UseShoppingSessionReturn {
  status: SessionStatus;
  session: ShoppingSession | null;
  /** Seconds remaining until absolute expiry. Null while loading. */
  secondsRemaining: number | null;
  /**
   * Commits the current session to a Reservation.
   * Returns the reservation token on success, throws on failure.
   */
  commitToReservation: () => Promise<string>;
  /** Manual retry after an error or expiry (creates a fresh session). */
  reset: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Fallback heartbeat interval if the backend doesn't supply heartbeatSeconds. */
const DEFAULT_HEARTBEAT_SECONDS = 30;

/** Debounce delay (ms) before pushing cart changes to the backend. */
const SYNC_DEBOUNCE_MS = 600;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useShoppingSession({
  eventId,
  functionId,
  onExpired,
  authenticated,
}: UseShoppingSessionOptions): UseShoppingSessionReturn {
  const cart = useCartStore();

  const [session, setSession] = useState<ShoppingSession | null>(null);
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  // Refs so interval callbacks always see up-to-date values without
  // re-registering the intervals.
  const sessionRef = useRef<ShoppingSession | null>(null);
  const statusRef = useRef<SessionStatus>("idle");
  const onExpiredRef = useRef(onExpired);

  // Keep refs in sync with state.
  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { onExpiredRef.current = onExpired; }, [onExpired]);

  // Sync counter — used to abort stale debounced pushes.
  const syncVersion = useRef(0);

  // ─── Handle expiry uniformly ─────────────────────────────────────────────

  const handleExpired = useCallback(() => {
    setStatus("expired");
    setSession(null);
    setSecondsRemaining(0);
    onExpiredRef.current?.();
  }, []);

  // ─── Initialise session (create or recover) ───────────────────────────────

  const initialiseSession = useCallback(async () => {
    if (!eventId || !functionId) return;
    if (statusRef.current === "loading") return;

    setStatus("loading");
    setSecondsRemaining(null);

    try {
      // 1. Try to recover an existing active session.
      let active = await getActiveShoppingSession(functionId);

      if (!active) {
        // 2. No active session — create a fresh one.
        active = await createShoppingSession({ eventId, functionId });
      }

      // 3. Seed Zustand from the remote session so the cart reflects the
      //    server state immediately (critical after refresh / tab open).
      if (active.items.length > 0) {
        // Reconcile: set each quantity from the backend, reconcile removes
        // any Zustand items that don't exist in backend items.
        const backendIds = active.items.map((i) => i.ticketTypeId);
        cart.reconcileCart({ eventId, activeTicketTypeIds: backendIds });
        for (const item of active.items) {
          cart.setQuantity({ eventId, ticketTypeId: item.ticketTypeId, quantity: item.quantity });
        }
      } else {
        // Backend has no items; don't clobber local Zustand selection.
        // The next sync write will push Zustand → backend.
      }

      const now = Date.now();
      const absMs = new Date(active.absoluteExpiresAt).getTime();
      const remaining = Math.max(0, Math.floor((absMs - now) / 1000));

      setSession(active);
      setSecondsRemaining(remaining);
      setStatus("active");
    } catch (err) {
      if (err instanceof ShoppingSessionExpiredError) {
        handleExpired();
      } else {
        console.error("[ShoppingSession] init error:", err);
        setStatus("error");
      }
    }
  }, [eventId, functionId, cart, handleExpired]);

  // ─── Boot on auth + event ready ───────────────────────────────────────────

  useEffect(() => {
    if (!authenticated || !eventId || !functionId) return;
    initialiseSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, eventId, functionId]);

  // ─── Heartbeat interval ────────────────────────────────────────────────────

  useEffect(() => {
    if (status !== "active" || !session) return;

    const intervalMs = (session.heartbeatSeconds ?? DEFAULT_HEARTBEAT_SECONDS) * 1000;

    const id = window.setInterval(async () => {
      const s = sessionRef.current;
      if (!s || statusRef.current !== "active") return;

      try {
        await sendHeartbeat(s.id);
      } catch (err) {
        if (err instanceof ShoppingSessionExpiredError) {
          handleExpired();
        }
        // Network blip — silently ignore; the next tick will retry.
      }
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [status, session, handleExpired]);

  // ─── Absolute-expiry countdown ────────────────────────────────────────────

  useEffect(() => {
    if (status !== "active" || !session) return;

    const absMs = new Date(session.absoluteExpiresAt).getTime();

    const id = window.setInterval(() => {
      const remaining = Math.max(0, Math.floor((absMs - Date.now()) / 1000));
      setSecondsRemaining(remaining);

      if (remaining === 0) {
        window.clearInterval(id);
        handleExpired();
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [status, session, handleExpired]);

  // ─── Sync cart → backend (debounced) ─────────────────────────────────────

  useEffect(() => {
    if (status !== "active" || !session) return;

    // Snapshot of what we intend to push.
    const itemsToSync = cart.items
      .filter((i) => i.quantity > 0)
      .map((i) => ({ ticketTypeId: i.ticketTypeId, quantity: i.quantity }));

    const thisVersion = ++syncVersion.current;

    const timerId = window.setTimeout(async () => {
      // Abort if a newer sync was scheduled before us.
      if (syncVersion.current !== thisVersion) return;

      const s = sessionRef.current;
      if (!s || statusRef.current !== "active") return;

      try {
        setStatus("syncing");
        const updated = await updateSessionItems(s.id, {
          items: itemsToSync,
          version: s.version,
        });

        // Update the local session with the new version from backend.
        setSession(updated);
        setStatus("active");
      } catch (err) {
        if (err instanceof ShoppingSessionExpiredError) {
          handleExpired();
        } else if (err instanceof ShoppingSessionConflictError) {
          // Version conflict: re-fetch the authoritative session state.
          console.warn("[ShoppingSession] version conflict — re-syncing from backend");
          const fresh = await getActiveShoppingSession(s.functionId).catch(() => null);
          if (fresh) {
            setSession(fresh);
            setStatus("active");
          } else {
            handleExpired();
          }
        } else {
          // Non-fatal sync error — revert to active so the user isn't blocked.
          console.error("[ShoppingSession] sync error:", err);
          setStatus("active");
        }
      }
    }, SYNC_DEBOUNCE_MS);

    return () => window.clearTimeout(timerId);
    // Only re-run when cart.items changes — not on session state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.items]);

  // ─── commitToReservation ──────────────────────────────────────────────────

  const commitToReservation = useCallback(async (): Promise<string> => {
    const s = sessionRef.current;
    if (!s) throw new Error("No hay sesión activa para confirmar.");

    const result = await commitSessionToReservation({
      shoppingSessionId: s.id,
      version: s.version,
    });

    const token = result.reservation?.token;
    if (!token) throw new Error("El backend no devolvió un token de reserva.");

    // Session promoted — clear local session state.
    setSession(null);
    setStatus("idle");
    setSecondsRemaining(null);

    return token;
  }, []);

  // ─── Manual reset ─────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setSession(null);
    setStatus("idle");
    setSecondsRemaining(null);
    // Re-initialise on next tick to avoid re-running in the same render cycle.
    setTimeout(() => initialiseSession(), 0);
  }, [initialiseSession]);

  return {
    status,
    session,
    secondsRemaining,
    commitToReservation,
    reset,
  };
}
