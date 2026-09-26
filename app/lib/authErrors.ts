/**
 * Centralized auth error mapping.
 * Translates backend HTTP status codes and messages into user-friendly Spanish strings.
 * No internal error details are ever exposed directly to the user.
 */

/**
 * Sentinel value returned when the login error indicates an unverified email.
 * The UI component must check for this value and render a specific panel instead of
 * a generic error message.
 */
export const EMAIL_NOT_VERIFIED_SENTINEL =
  "__EMAIL_NOT_VERIFIED__" as const;

/**
 * Maps a login API response to a user-facing message.
 *
 * Returns EMAIL_NOT_VERIFIED_SENTINEL when the error indicates the account email
 * has not been verified yet — the caller must handle this case separately.
 */
export function mapLoginError(
  status: number,
  backendMessage?: string,
  isNetworkError = false
): string {
  if (isNetworkError) {
    return "No se pudo conectar con el servidor. Verificá tu conexión e intentá nuevamente.";
  }

  const msg = (backendMessage ?? "").toLowerCase();

  // Detect "email not verified" by common backend message patterns.
  // This covers both English and Spanish backends without hardcoding the exact string.
  if (
    msg.includes("not verified") ||
    msg.includes("no verificad") ||
    msg.includes("verify your email") ||
    msg.includes("email not confirmed") ||
    msg.includes("verificar email") ||
    (status === 403 && msg.includes("email"))
  ) {
    return EMAIL_NOT_VERIFIED_SENTINEL;
  }

  switch (status) {
    case 401:
      return "Email o contraseña incorrectos.";
    case 403:
      return "Acceso denegado.";
    case 429:
      return "Demasiados intentos. Esperá unos minutos e intentá nuevamente.";
    default:
      if (status >= 500) {
        return "Error del servidor. Intentá nuevamente en unos minutos.";
      }
      // 4xx not covered above → treat as credential error rather than exposing technical detail
      if (status >= 400) {
        return "Email o contraseña incorrectos.";
      }
      return "Ocurrió un error inesperado. Intentá nuevamente.";
  }
}

/**
 * Maps a register API response to a user-facing message.
 */
export function mapRegisterError(
  status: number,
  backendMessage?: string,
  isNetworkError = false
): string {
  if (isNetworkError) {
    return "No se pudo conectar con el servidor. Verificá tu conexión e intentá nuevamente.";
  }

  const msg = (backendMessage ?? "").toLowerCase();

  switch (status) {
    case 409:
      return "Ya existe una cuenta con ese email. ¿Querés iniciar sesión?";
    case 422:
      if (msg.includes("password") || msg.includes("contraseña")) {
        return "La contraseña no cumple los requisitos mínimos.";
      }
      if (msg.includes("email")) {
        return "El email ingresado no es válido.";
      }
      return "Algunos datos ingresados no son válidos. Revisalos e intentá nuevamente.";
    default:
      if (status >= 500) {
        return "Error del servidor. Intentá nuevamente en unos minutos.";
      }
      return "No se pudo crear la cuenta. Intentá nuevamente.";
  }
}

/**
 * Maps a set-new-password (reset-password/[token]) API response to a user-facing message.
 */
export function mapResetPasswordTokenError(
  status: number,
  backendMessage?: string,
  isNetworkError = false
): string {
  if (isNetworkError) {
    return "No se pudo conectar con el servidor. Verificá tu conexión e intentá nuevamente.";
  }

  const msg = (backendMessage ?? "").toLowerCase();

  if (
    status === 400 ||
    msg.includes("invalid") ||
    msg.includes("expired") ||
    msg.includes("token")
  ) {
    return "El enlace de recuperación es inválido o ya venció. Solicitá uno nuevo desde la pantalla de recuperación.";
  }
  if (status === 422) {
    return "La contraseña no cumple los requisitos mínimos (mínimo 8 caracteres).";
  }
  if (status >= 500) {
    return "Error del servidor. Intentá nuevamente en unos minutos.";
  }
  return "No se pudo restablecer la contraseña. Intentá nuevamente.";
}

/**
 * Validates that a callbackUrl is a safe internal path.
 *
 * Rules:
 * - Must be a non-empty string.
 * - Must start with "/" (not "//" which would be a protocol-relative external URL).
 * - Must not embed a scheme after the leading slash (e.g. "/javascript:" or "/data:").
 *
 * This prevents open-redirect attacks while still allowing any internal route.
 */
export function isSafeCallbackUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  if (!url.startsWith("/")) return false;
  if (url.startsWith("//")) return false;
  try {
    const decoded = decodeURIComponent(url);
    // Block embedded schemes like /javascript:alert(1) or /data:...
    if (/^\/[a-zA-Z][a-zA-Z0-9+.-]*:/i.test(decoded)) return false;
  } catch {
    // decodeURIComponent threw → malformed encoding → reject
    return false;
  }
  return true;
}
