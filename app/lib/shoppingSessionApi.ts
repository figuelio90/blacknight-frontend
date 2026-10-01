/**
 * Client for the BLA-87 ShoppingSession backend endpoints.
 *
 * All functions communicate with the backend through the Next.js /api rewrite
 * (next.config.js: /api/* -> http://localhost:3001/api/*) and attach
 * credentials (session cookie) automatically.
 *
 * ─── Response shape (verified against src/routes/shoppingSession.ts) ──────────
 *
 *  POST   /api/shopping-sessions
 *  GET    /api/shopping-sessions/active?functionId=<id>
 *  GET    /api/shopping-sessions/:id
 *  POST   /api/shopping-sessions/:id/heartbeat
 *    → 200/201  { shoppingSession: ShoppingSession, heartbeatSeconds: number }
 *    → 410      { error: "SHOPPING_SESSION_EXPIRED" | "SHOPPING_SESSION_NOT_ACTIVE" | ... }
 *
 *  PUT    /api/shopping-sessions/:id/items
 *    → 200      { shoppingSession: ShoppingSession }         ← heartbeatSeconds omitted
 *    → 409      { error: "SHOPPING_SESSION_VERSION_CONFLICT" }
 *    → 410      { error: "SHOPPING_SESSION_EXPIRED" }
 *
 *  POST   /api/reservations  (with { shoppingSessionId, version })
 *    → 201      { reservation: { token: string, ... } }
 *    → 409      { error: "SHOPPING_SESSION_VERSION_CONFLICT" | "SHOPPING_SESSION_NOT_ACTIVE" }
 *    → 409      { code: "AVAILABILITY_CONFLICT", error: string }
 *    → 410      { error: "SHOPPING_SESSION_EXPIRED" }
 *
 * ─── Type notes ────────────────────────────────────────────────────────────────
 *
 *  • shoppingSession.id   → number (int) — validated by z.coerce.number().int()
 *  • functionId           → number (int) — a real EventFunction PK, obtained from
 *                           GET /api/events/:id response field `functionId`
 *  • recoveryToken        → string (UUID) — optional, passed to POST /shopping-sessions
 *                           when a RecoverySession token is available in localStorage
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ShoppingSessionItemData {
  ticketTypeId: number;
  quantity: number;
}

/** Raw Prisma-shaped item as returned inside shoppingSession.items */
export interface ShoppingSessionItemFull extends ShoppingSessionItemData {
  id: number;
  shoppingSessionId: number;
  ticketType: {
    id: number;
    name: string;
    price: number;
    stock: number;
    active: boolean;
    color: string | null;
    description: string | null;
  };
}

/** Shape of ShoppingSession as returned by the backend (shoppingSessionInclude). */
export interface ShoppingSession {
  /** Integer PK — NOT a UUID. */
  id: number;
  userId: number;
  eventId: number;
  functionId: number;
  status: "active" | "expired" | "converted";
  /** Increments on every successful PUT /items call. Used for optimistic locking. */
  version: number;
  lastActivityAt: string;
  /** ISO-8601 — resets on each heartbeat (within absoluteExpiresAt). */
  idleExpiresAt: string;
  /** ISO-8601 — never extended after creation (15 min max). */
  absoluteExpiresAt: string;
  createdAt: string;
  items: ShoppingSessionItemFull[];
  recoverySession: {
    id: number;
    reason: string;
    sourcePaymentId: number;
  } | null;
  reservation: {
    id: number;
    token: string;
    status: string;
    expiresAt: string;
  } | null;
}

export interface StartSessionPayload {
  eventId: number;
  /**
   * Real EventFunction PK — obtained from GET /api/events/:id response field
   * `functionId`. NEVER use eventId here; the backend validates that the
   * function exists and belongs to the event.
   */
  functionId: number;
  /**
   * UUID string — only provided when a RecoverySession token is available
   * (stored in localStorage under key "recoveryToken" after a payment flow).
   * Passing it extends the ShoppingSession TTL to match the RecoverySession
   * expiry and marks the RecoverySession as consumed.
   */
  recoveryToken?: string;
}

export interface UpdateItemsPayload {
  items: ShoppingSessionItemData[];
  /** Must match the current shoppingSession.version or the backend returns 409. */
  version: number;
}

export interface CommitPayload {
  /** Integer PK of the ShoppingSession to atomically convert to a Reservation. */
  shoppingSessionId: number;
  /** Must match the current shoppingSession.version to prevent double-commits. */
  version: number;
}

// ─── Custom Errors ───────────────────────────────────────────────────────────

/**
 * Thrown when the backend returns HTTP 410 with any of:
 *   SHOPPING_SESSION_EXPIRED, SHOPPING_SESSION_NOT_ACTIVE,
 *   RECOVERY_NOT_ACTIVE, RECOVERY_EXPIRED
 * The UI must show the SessionExpiredModal and redirect to the event page.
 */
export class ShoppingSessionExpiredError extends Error {
  readonly code = "SHOPPING_SESSION_EXPIRED";
  constructor(message = "La sesión de compra expiró.") {
    super(message);
    this.name = "ShoppingSessionExpiredError";
  }
}

/**
 * Thrown for HTTP 409 other than the stock-specific AVAILABILITY_CONFLICT.
 * Includes SHOPPING_SESSION_VERSION_CONFLICT and SHOPPING_SESSION_NOT_ACTIVE
 * from the reservations route (both map to 409 there).
 * The caller should re-fetch the active session and retry with the new version.
 */
export class ShoppingSessionConflictError extends Error {
  readonly code: string;
  constructor(code = "SHOPPING_SESSION_VERSION_CONFLICT") {
    super(code);
    this.name = "ShoppingSessionConflictError";
    this.code = code;
  }
}

/** A recoverable stock conflict; the ShoppingSession remains active. */
export class AvailabilityConflictError extends Error {
  readonly code = "AVAILABILITY_CONFLICT";
  constructor() {
    super("Algunas de las entradas seleccionadas ya no están disponibles.");
    this.name = "AvailabilityConflictError";
  }
}

export interface FunctionAvailability {
  eventId: number;
  functionId: number;
  capacity: number;
  sold: number;
  reserved: number;
  available: number;
}

export async function getFunctionAvailability(
  functionId: number
): Promise<FunctionAvailability> {
  const res = await fetch(`/api/event-functions/${functionId}/availability`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("No se pudo actualizar la disponibilidad.");
  return res.json() as Promise<FunctionAvailability>;
}

interface EventTicketType {
  id: number;
  name: string;
  price: number;
  stock: number;
  active: boolean;
  color?: string;
  description?: string;
  order: number;
}

/** The public catalogue exposes configured stock, not remaining stock by type. */
export async function getFunctionTicketTypes(
  eventId: number,
  functionId: number
): Promise<EventTicketType[]> {
  const res = await fetch(`/api/events/${eventId}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("No se pudieron actualizar las entradas.");
  const event = await res.json() as {
    id: number;
    functionId: number;
    ticketTypes: EventTicketType[];
  };
  if (Number(event.id) !== eventId || Number(event.functionId) !== functionId) {
    throw new Error("No se pudieron actualizar las entradas de esta función.");
  }
  return event.ticketTypes.map((ticket, index) => ({
    ...ticket,
    price: Number(ticket.price),
    stock: Number(ticket.stock),
    active: ticket.active ?? true,
    order: ticket.order ?? index + 1,
  }));
}

/** Refresh this exact session without creating or switching sessions. */
export async function getShoppingSession(sessionId: number): Promise<ShoppingSession> {
  const res = await fetch(`/api/shopping-sessions/${sessionId}`, {
    credentials: "include",
    cache: "no-store",
  });
  return (await parseSessionEnvelope(res)).shoppingSession;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

interface BackendSessionEnvelope {
  shoppingSession: ShoppingSession;
  heartbeatSeconds?: number;
}

async function parseSessionEnvelope(res: Response): Promise<BackendSessionEnvelope> {
  if (res.status === 410) throw new ShoppingSessionExpiredError();
  if (res.status === 409) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new ShoppingSessionConflictError(body?.error);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      (body as { error?: string })?.error ??
        `ShoppingSession request failed (${res.status})`
    );
  }
  return body as BackendSessionEnvelope;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * POST /api/shopping-sessions
 * Returns 201 on creation or 200 when an existing active session is returned.
 * Optionally accepts a recoveryToken UUID to link to a RecoverySession.
 */
export async function createOrResumeSession(
  payload: StartSessionPayload
): Promise<{ session: ShoppingSession; heartbeatSeconds: number }> {
  const res = await fetch("/api/shopping-sessions", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const envelope = await parseSessionEnvelope(res);
  return {
    session: envelope.shoppingSession,
    heartbeatSeconds: envelope.heartbeatSeconds ?? 30,
  };
}

/**
 * GET /api/shopping-sessions/active?functionId=<id>
 * Returns null when no active session exists (404) or when it has expired (410).
 */
export async function getActiveSession(
  functionId: number
): Promise<{ session: ShoppingSession; heartbeatSeconds: number } | null> {
  const res = await fetch(
    `/api/shopping-sessions/active?functionId=${functionId}`,
    { credentials: "include", cache: "no-store" }
  );
  if (res.status === 404) return null;
  if (res.status === 410) return null;
  const envelope = await parseSessionEnvelope(res);
  return {
    session: envelope.shoppingSession,
    heartbeatSeconds: envelope.heartbeatSeconds ?? 30,
  };
}

/**
 * POST /api/shopping-sessions/:id/heartbeat
 * Resets idleExpiresAt. Throws ShoppingSessionExpiredError on 410.
 * Returns the updated session.
 */
export async function sendHeartbeat(
  sessionId: number
): Promise<ShoppingSession> {
  const res = await fetch(`/api/shopping-sessions/${sessionId}/heartbeat`, {
    method: "POST",
    credentials: "include",
  });
  const envelope = await parseSessionEnvelope(res);
  return envelope.shoppingSession;
}

/**
 * PUT /api/shopping-sessions/:id/items
 * Persists the current item selection. Requires the current version for
 * optimistic locking. Returns { shoppingSession } only (no heartbeatSeconds).
 * Throws ShoppingSessionConflictError on 409 and ShoppingSessionExpiredError on 410.
 */
export async function updateSessionItems(
  sessionId: number,
  payload: UpdateItemsPayload
): Promise<ShoppingSession> {
  const res = await fetch(`/api/shopping-sessions/${sessionId}/items`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const envelope = await parseSessionEnvelope(res);
  return envelope.shoppingSession;
}

/**
 * POST /api/reservations  { shoppingSessionId, version }
 * Atomically converts the ShoppingSession to a Reservation.
 * Items are taken from the backend session (not re-sent from the frontend).
 * Throws AvailabilityConflictError for the stock-specific 409, otherwise
 * ShoppingSessionConflictError on 409 or ShoppingSessionExpiredError on 410.
 * Returns the reservation token on 201.
 */
export async function commitToReservation(
  payload: CommitPayload
): Promise<string> {
  const res = await fetch("/api/reservations", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.status === 410) throw new ShoppingSessionExpiredError();
  if (res.status === 409) {
    const body = await res.json().catch(() => ({})) as { code?: string; error?: string };
    if (body?.code === "AVAILABILITY_CONFLICT") throw new AvailabilityConflictError();
    throw new ShoppingSessionConflictError(body?.error);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      (body as { error?: string })?.error ?? `Reservation commit failed (${res.status})`
    );
  }

  const token = (body as { reservation?: { token?: string } })?.reservation?.token;
  if (!token) throw new Error("El backend no devolvió un token de reserva.");
  return token;
}

/**
 * GET /api/recovery-sessions/:token
 * Fetches a RecoverySession by its UUID token.
 * Used to check if the user has a pending recovery after a failed payment.
 * Returns null if the token is invalid, not found, or not active.
 */
export interface RecoverySession {
  token: string;
  status: "active" | "expired" | "consumed";
  reason: string;
  eventId: number;
  functionId: number;
  expiresAt: string;
  consumedAt: string | null;
}

export async function getRecoverySession(
  token: string
): Promise<RecoverySession | null> {
  const res = await fetch(`/api/recovery-sessions/${token}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json() as Promise<RecoverySession>;
}
