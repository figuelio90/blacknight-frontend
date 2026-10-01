"use client";

/**
 * useShoppingSession — BLA-87 lifecycle hook
 *
 * Manages the full ShoppingSession lifecycle:
 *
 *  BOOT
 *  ─────
 *  1. Checks localStorage for a "recoveryToken" UUID (written by payment flows
 *     when a RecoverySession is issued). If valid and active, it is forwarded
 *     to POST /shopping-sessions as `recoveryToken`.
 *  2. POST /shopping-sessions returns 200 (existing session) or 201 (new).
 *     The backend deduplicates: concurrent POSTs for the same user+functionId
 *     return the same session.
 *  3. Zustand cart is seeded from backend session.items so the UI is immediately
 *     accurate after a page refresh. Backend is the source of truth.
 *
 *  RUNTIME
 *  ────────
 *  4. Heartbeat interval: fires every `heartbeatSeconds` seconds (from backend
 *     config, default 30). Resets idleExpiresAt. 410 → expired state.
 *  5. Absolute-expiry countdown: tracks absoluteExpiresAt independently.
 *     When it reaches 0 → expired state.
 *  6. Cart sync: any change to Zustand cart.items is debounced 600 ms and
 *     pushed via PUT /shopping-sessions/:id/items. Sends the current `version`
 *     for optimistic locking. On 409, re-fetches the authoritative session.
 *
 *  COMMIT
 *  ───────
 *  7. commitToReservation() atomically converts the session to a Reservation
 *     via POST /api/reservations { shoppingSessionId, version }. The backend
 *     reads items directly from the session — no re-sending from the frontend.
 *     On 410 (expired) or 409 (conflict) the error propagates to the caller.
 *
 *  CONSTRAINTS
 *  ───────────
 *  • functionId must be a real EventFunction PK read from GET /api/events/:id
 *    response field `functionId`. The hook only starts when functionId != null.
 *  • The fallback legacy POST /api/reservations { eventId, items } is NOT used.
 *    BLA-87 requires ShoppingSession as the only path to Reservation.
 *  • Zustand/localStorage remain as transient UI cache only.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useCartStore } from "@/app/store/cartStore";
import {
  createOrResumeSession,
  getActiveSession,
  getShoppingSession,
  getFunctionAvailability,
  sendHeartbeat,
  updateSessionItems,
  commitToReservation as apiCommitToReservation,
  getRecoverySession,
  ShoppingSessionExpiredError,
  ShoppingSessionConflictError,
  AvailabilityConflictError,
  type FunctionAvailability,
  type ShoppingSession,
} from "@/app/lib/shoppingSessionApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SessionStatus =
  | "idle"      // Not yet initialised (waiting for auth or functionId).
  | "loading"   // Creating or recovering a session.
  | "active"    // Session is alive and heartbeating.
  | "syncing"   // Writing cart items to backend (non-blocking optimistic write).
  | "expired"   // 410 received, TTL hit, or user confirmed via onExpired.
  | "error";    // Unrecoverable fetch error (shown inline, does not block UX).

export interface UseShoppingSessionOptions {
  /** Numeric event id from the page params. */
  eventId: number | null;
  /**
   * Real EventFunction PK from GET /api/events/:id → `functionId` field.
   * The hook is a no-op until this is non-null.
   */
  functionId: number | null;
  /** Called once when the session transitions to `expired`. */
  onExpired?: () => void;
  /** Set true only once auth loading is complete and a user is present. */
  authenticated: boolean;
  /** Refresh the displayed ticket catalogue without changing event/function IDs. */
  onAvailabilityRefresh: () => Promise<void>;
}

export interface UseShoppingSessionReturn {
  status: SessionStatus;
  /** The backend session object. Null when idle, loading, or expired. */
  session: ShoppingSession | null;
  /** Seconds remaining before absolute expiry. Null while loading. */
  secondsRemaining: number | null;
  /**
   * Atomically converts the current session to a Reservation.
   * Returns the reservation token (UUID string) on success.
   * Refreshes availability on AvailabilityConflictError before propagating it.
   * Other conflicts and expiry keep their existing handling.
   */
  commitToReservation: () => Promise<string>;
  availability: FunctionAvailability | null;
  availabilityNotice: string | null;
  refreshingAvailability: boolean;
  availabilityRefreshFailed: boolean;
  refreshAvailability: () => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Fallback if backend doesn't specify heartbeatSeconds. */
const FALLBACK_HEARTBEAT_SECONDS = 30;

/** Debounce before pushing local cart changes to the backend. */
const SYNC_DEBOUNCE_MS = 600;

/** localStorage key where payment flows write RecoverySession tokens. */
const RECOVERY_TOKEN_KEY = "recoveryToken";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useShoppingSession({
  eventId,
  functionId,
  onExpired,
  authenticated,
  onAvailabilityRefresh,
}: UseShoppingSessionOptions): UseShoppingSessionReturn {
  const cart = useCartStore();

  const [session, setSession] = useState<ShoppingSession | null>(null);
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [availability, setAvailability] = useState<FunctionAvailability | null>(null);
  const [availabilityNotice, setAvailabilityNotice] = useState<string | null>(null);
  const [refreshingAvailability, setRefreshingAvailability] = useState(false);
  const [availabilityRefreshFailed, setAvailabilityRefreshFailed] = useState(false);
  const refreshingAvailabilityRef = useRef(false);
  // heartbeatSeconds is dynamic (from backend config); stored in a ref so the
  // heartbeat interval can be recreated without stale closure issues.
  const [heartbeatSeconds, setHeartbeatSeconds] = useState(FALLBACK_HEARTBEAT_SECONDS);

  // Mutable refs so interval callbacks always read the latest values.
  const sessionRef = useRef<ShoppingSession | null>(null);
  const statusRef = useRef<SessionStatus>("idle");
  const onExpiredRef = useRef(onExpired);
  // Monotonic counter: each debounced cart sync increments it. A sync that was
  // scheduled before the latest increment is a no-op (stale).
  const syncSeq = useRef(0);

  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { onExpiredRef.current = onExpired; }, [onExpired]);

  // ─── Unified expiry handler ─────────────────────────────────────────────

  const handleExpired = useCallback(() => {
    setStatus("expired");
    setSession(null);
    setSecondsRemaining(0);
    sessionRef.current = null;
    onExpiredRef.current?.();
  }, []);

  // ─── Session initialisation ────────────────────────────────────────────

  const initialise = useCallback(async () => {
    if (!eventId || !functionId) return;
    if (statusRef.current === "loading") return;

    setStatus("loading");
    setSecondsRemaining(null);
    setAvailability(null);
    setAvailabilityNotice(null);
    setAvailabilityRefreshFailed(false);

    try {
      // 1. Check for a RecoverySession token written by the payment flow.
      //    GET /api/recovery-sessions/:token tells us if it is still active.
      let recoveryToken: string | undefined;
      const savedRecoveryToken = localStorage.getItem(RECOVERY_TOKEN_KEY);
      if (savedRecoveryToken) {
        const recovery = await getRecoverySession(savedRecoveryToken).catch(() => null);
        if (
          recovery &&
          recovery.status === "active" &&
          recovery.eventId === eventId &&
          recovery.functionId === functionId
        ) {
          recoveryToken = savedRecoveryToken;
        }
        // Consume regardless (if invalid, stale, or wrong function — discard).
        if (!recovery || recovery.status !== "active") {
          localStorage.removeItem(RECOVERY_TOKEN_KEY);
        }
      }

      // 2. POST /shopping-sessions — backend returns existing session (200) or
      //    creates a new one (201). The recoveryToken is consumed server-side.
      const { session: newSession, heartbeatSeconds: hb } =
        await createOrResumeSession({ eventId, functionId, recoveryToken });

      // After successful consumption, clean up localStorage.
      if (recoveryToken) localStorage.removeItem(RECOVERY_TOKEN_KEY);

      // 3. Seed Zustand from the backend session so a post-refresh load is instant.
      // Always reconcile, including an empty backend session. Otherwise a new
      // session created after expiry can inherit stale localStorage items that
      // no longer exist server-side.
      const backendIds = newSession.items.map((i) => i.ticketTypeId);
      cart.reconcileCart({ eventId, activeTicketTypeIds: backendIds });
      for (const item of newSession.items) {
        cart.setQuantity({ eventId, ticketTypeId: item.ticketTypeId, quantity: item.quantity });
      }

      const absMs = new Date(newSession.absoluteExpiresAt).getTime();
      const remaining = Math.max(0, Math.floor((absMs - Date.now()) / 1000));

      setSession(newSession);
      sessionRef.current = newSession;
      setHeartbeatSeconds(hb);
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

  // ─── Boot: trigger once auth + functionId are ready ───────────────────

  useEffect(() => {
    if (!authenticated || !eventId || !functionId) return;
    initialise();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, eventId, functionId]);

  // ─── Heartbeat ────────────────────────────────────────────────────────

  useEffect(() => {
    if (status !== "active" || !session) return;

    const intervalMs = heartbeatSeconds * 1_000;
    const id = window.setInterval(async () => {
      const s = sessionRef.current;
      if (!s || statusRef.current !== "active") return;

      try {
        const updated = await sendHeartbeat(s.id);
        // Update only the TTL fields; don't replace the full session to avoid
        // triggering the cart-sync useEffect unnecessarily.
        setSession((prev) => {
          if (!prev) return prev;
          const next = {
            ...prev,
            idleExpiresAt: updated.idleExpiresAt,
            lastActivityAt: updated.lastActivityAt,
          };
          sessionRef.current = next;
          return next;
        });
      } catch (err) {
        if (err instanceof ShoppingSessionExpiredError) {
          handleExpired();
        }
        // Transient network errors are silently ignored; next tick will retry.
      }
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [status, session, heartbeatSeconds, handleExpired]);

  // ─── Absolute-expiry countdown ────────────────────────────────────────

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
    }, 1_000);

    return () => window.clearInterval(id);
  }, [status, session, handleExpired]);

  // ─── Debounced cart → backend sync ────────────────────────────────────

  useEffect(() => {
    if (status !== "active" && status !== "syncing") return;
    const s = sessionRef.current;
    if (!s) return;

    const thisSeq = ++syncSeq.current;
    const itemsSnapshot = cart.items
      .filter((i) => i.quantity > 0)
      .map((i) => ({ ticketTypeId: i.ticketTypeId, quantity: i.quantity }));

    const timerId = window.setTimeout(async () => {
      if (syncSeq.current !== thisSeq) return; // Superseded by a newer write.
      const current = sessionRef.current;
      if (!current || statusRef.current !== "active" || refreshingAvailabilityRef.current) return;

      try {
        setStatus("syncing");
        const updated = await updateSessionItems(current.id, {
          items: itemsSnapshot,
          version: current.version,
        });
        sessionRef.current = updated;
        setSession(updated);
        setStatus("active");
      } catch (err) {
        if (err instanceof ShoppingSessionExpiredError) {
          handleExpired();
        } else if (err instanceof ShoppingSessionConflictError) {
          // Version conflict: fetch the authoritative version, then retry the
          // user's pending selection once. Merely replacing local session
          // metadata would leave Zustand and the backend out of sync.
          console.warn("[ShoppingSession] version conflict — re-fetching and retrying");
          try {
            const fresh = await getActiveSession(current.functionId);
            if (fresh) {
              const retried = await updateSessionItems(fresh.session.id, {
                items: itemsSnapshot,
                version: fresh.session.version,
              });
              sessionRef.current = retried;
              setSession(retried);
              setStatus("active");
            } else {
              handleExpired();
            }
          } catch (retryError) {
            if (retryError instanceof ShoppingSessionExpiredError) {
              handleExpired();
            } else {
              console.error("[ShoppingSession] conflict recovery failed:", retryError);
              setStatus("active");
            }
          }
        } else {
          // Non-fatal: keep the session alive; the user can still continue.
          console.error("[ShoppingSession] sync error:", err);
          setStatus("active");
        }
      }
    }, SYNC_DEBOUNCE_MS);

    return () => window.clearTimeout(timerId);
    // ONLY re-run when cart.items changes — not when session state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.items]);

  // ─── commitToReservation ──────────────────────────────────────────────

  const refreshAvailability = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || refreshingAvailabilityRef.current) return;
    refreshingAvailabilityRef.current = true;
    ++syncSeq.current;
    setRefreshingAvailability(true);
    setAvailabilityRefreshFailed(false);
    setAvailabilityNotice(
      "Algunas de las entradas seleccionadas ya no están disponibles. Estamos actualizando la disponibilidad."
    );

    // Independent reads: a failed catalogue request must not prevent refreshing
    // the same session's version/TTL, and must never become a raw UI error.
    const [sessionResult, availabilityResult, catalogueResult] = await Promise.allSettled([
      getShoppingSession(current.id),
      getFunctionAvailability(current.functionId),
      onAvailabilityRefresh(),
    ]);
    const fresh = sessionResult.status === "fulfilled" ? sessionResult.value : null;
    const sameSession = fresh?.id === current.id &&
      fresh.eventId === current.eventId && fresh.functionId === current.functionId &&
      fresh.status === "active";
    if (sameSession && sessionRef.current?.id === current.id) {
      sessionRef.current = fresh;
      setSession(fresh);
      // Keep the local selection intact; Continue flushes any user corrections
      // with this refreshed version. Heartbeats and expiry remain in force.
    }
    const freshAvailability = availabilityResult.status === "fulfilled"
      ? availabilityResult.value : null;
    const sameFunction = freshAvailability?.functionId === current.functionId &&
      freshAvailability.eventId === current.eventId;
    if (sameFunction) setAvailability(freshAvailability);

    const refreshed = sameSession && sameFunction && catalogueResult.status === "fulfilled";
    setAvailabilityRefreshFailed(!refreshed);
    setAvailabilityNotice(refreshed
      ? "Algunas de las entradas seleccionadas ya no están disponibles. Actualizamos la disponibilidad para que puedas elegir nuevamente."
      : "Algunas de las entradas seleccionadas ya no están disponibles. No pudimos actualizar toda la información. Volvé a actualizar la disponibilidad para continuar; conservamos tu selección."
    );
    refreshingAvailabilityRef.current = false;
    setRefreshingAvailability(false);
  }, [onAvailabilityRefresh]);

  const commitToReservation = useCallback(async (): Promise<string> => {
    let current = sessionRef.current;
    if (!current) throw new Error("No hay sesión de compra activa.");

    // Cancel a pending debounced write and flush the latest cart snapshot now.
    // This closes the window where Continue could run before the 600 ms sync.
    ++syncSeq.current;
    const cartState = useCartStore.getState();
    const items = cartState.eventId === eventId
      ? cartState.items
          .filter((item) => item.quantity > 0)
          .map((item) => ({ ticketTypeId: item.ticketTypeId, quantity: item.quantity }))
      : [];

    try {
      current = await updateSessionItems(current.id, {
        items,
        version: current.version,
      });
    } catch (err) {
      if (err instanceof ShoppingSessionExpiredError) {
        handleExpired();
        throw err;
      }
      if (!(err instanceof ShoppingSessionConflictError)) throw err;

      const fresh = await getActiveSession(current.functionId);
      if (!fresh) {
        handleExpired();
        throw new ShoppingSessionExpiredError();
      }
      current = await updateSessionItems(fresh.session.id, {
        items,
        version: fresh.session.version,
      });
    }

    sessionRef.current = current;
    setSession(current);

    let token: string;
    try {
      // The backend reads the already-persisted items atomically from the
      // ShoppingSession; its optimistic-lock field is named `version`.
      token = await apiCommitToReservation({
        shoppingSessionId: current.id,
        version: current.version,
      });
    } catch (err) {
      if (err instanceof AvailabilityConflictError) {
        await refreshAvailability();
        throw err;
      }
      if (err instanceof ShoppingSessionExpiredError) handleExpired();
      throw err;
    }

    // Session promoted to Reservation — clear local state.
    setSession(null);
    setStatus("idle");
    setSecondsRemaining(null);
    sessionRef.current = null;

    return token;
  }, [eventId, handleExpired, refreshAvailability]);

  return {
    status, session, secondsRemaining, commitToReservation,
    availability, availabilityNotice, refreshingAvailability,
    availabilityRefreshFailed, refreshAvailability,
  };
}
