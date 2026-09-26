/**
 * Client for the BLA-87 ShoppingSession backend endpoints.
 *
 * All functions communicate with the backend through the Next.js /api rewrite
 * (next.config.js: /api/* -> http://localhost:3001/api/*) and attach
 * credentials (session cookie) automatically.
 *
 * Responses that include a 410 status indicate that the shopping session has
 * expired (idle TTL or absolute TTL hit). Callers should catch and handle
 * the ShoppingSessionExpiredError thrown in that case.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ShoppingSessionItem {
  ticketTypeId: number;
  quantity: number;
}

export interface ShoppingSession {
  id: string;
  eventId: number;
  functionId: number;
  items: ShoppingSessionItem[];
  /**
   * Optimistic-locking version. Must be sent back on every mutating request
   * to detect mid-flight conflicts. The backend increments this on each
   * successful write.
   */
  version: number;
  /** ISO-8601 timestamp — absolute expiry (15 min after creation, never extended). */
  absoluteExpiresAt: string;
  /** ISO-8601 timestamp — idle expiry (resets on each heartbeat; 5 min window). */
  idleExpiresAt: string;
  /** Seconds between required heartbeats, as configured by the backend. */
  heartbeatSeconds: number;
  /** If present, the session has been promoted to a reservation. */
  reservationToken?: string;
}

export interface CreateSessionPayload {
  eventId: number;
  /**
   * The backend ties each ShoppingSession to a specific EventFunction.
   * Until the frontend exposes function selection, we pass the eventId as a
   * proxy. The backend will resolve the default function for the event.
   * Update this field once multi-function support lands in the UI.
   */
  functionId: number;
}

export interface UpdateSessionItemsPayload {
  items: ShoppingSessionItem[];
  /** Current version of the session — required for optimistic locking. */
  version: number;
}

export interface CommitToReservationPayload {
  /** The ShoppingSession id to atomically transition. */
  shoppingSessionId: string;
  version: number;
}

// ─── Custom Errors ───────────────────────────────────────────────────────────

/**
 * Thrown when the backend returns 410 SHOPPING_SESSION_EXPIRED.
 * The UI should display an expiration modal and guide the user back to the
 * event page to start a fresh session.
 */
export class ShoppingSessionExpiredError extends Error {
  readonly code = "SHOPPING_SESSION_EXPIRED";
  constructor(message = "La sesión de compra expiró.") {
    super(message);
    this.name = "ShoppingSessionExpiredError";
  }
}

/**
 * Thrown when the backend returns 409 (optimistic lock conflict).
 * The caller should re-fetch the active session and retry the operation.
 */
export class ShoppingSessionConflictError extends Error {
  readonly code = "SHOPPING_SESSION_CONFLICT";
  constructor(message = "Conflicto de versión en la sesión de compra.") {
    super(message);
    this.name = "ShoppingSessionConflictError";
  }
}

// ─── Internal helper ─────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 410) {
    throw new ShoppingSessionExpiredError();
  }
  if (res.status === 409) {
    throw new ShoppingSessionConflictError();
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      (body as { error?: string })?.error ??
        `Shopping session request failed (${res.status})`
    );
  }

  return body as T;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Creates a new ShoppingSession for the given event + function combination.
 * POST /api/shopping-sessions
 */
export async function createShoppingSession(
  payload: CreateSessionPayload
): Promise<ShoppingSession> {
  const res = await fetch("/api/shopping-sessions", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse<ShoppingSession>(res);
}

/**
 * Fetches the currently active ShoppingSession for this user + functionId.
 * Returns null when no active session exists (404).
 * GET /api/shopping-sessions/active?functionId=<id>
 */
export async function getActiveShoppingSession(
  functionId: number
): Promise<ShoppingSession | null> {
  const res = await fetch(
    `/api/shopping-sessions/active?functionId=${functionId}`,
    {
      credentials: "include",
      cache: "no-store",
    }
  );

  if (res.status === 404) return null;
  if (res.status === 410) {
    // Session existed but expired — treat as no active session.
    return null;
  }

  return handleResponse<ShoppingSession>(res);
}

/**
 * Sends a heartbeat to keep the session alive past the idle TTL.
 * The backend resets `idleExpiresAt` but does NOT extend `absoluteExpiresAt`.
 * POST /api/shopping-sessions/:id/heartbeat
 */
export async function sendHeartbeat(sessionId: string): Promise<void> {
  const res = await fetch(`/api/shopping-sessions/${sessionId}/heartbeat`, {
    method: "POST",
    credentials: "include",
  });

  if (res.status === 410) {
    throw new ShoppingSessionExpiredError();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string })?.error ?? `Heartbeat failed (${res.status})`
    );
  }
}

/**
 * Persists the current item selection to the backend session.
 * Uses optimistic locking via the `version` field.
 * PUT /api/shopping-sessions/:id/items
 */
export async function updateSessionItems(
  sessionId: string,
  payload: UpdateSessionItemsPayload
): Promise<ShoppingSession> {
  const res = await fetch(`/api/shopping-sessions/${sessionId}/items`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse<ShoppingSession>(res);
}

/**
 * Atomically transitions the ShoppingSession to a Reservation.
 * POST /api/reservations (with shoppingSessionId in body)
 */
export async function commitSessionToReservation(
  payload: CommitToReservationPayload
): Promise<{ reservation: { token: string } }> {
  const res = await fetch("/api/reservations", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse<{ reservation: { token: string } }>(res);
}
