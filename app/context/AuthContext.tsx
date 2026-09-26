"use client";

import { createContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  mapLoginError,
  EMAIL_NOT_VERIFIED_SENTINEL,
} from "@/app/lib/authErrors";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: "ADMIN" | "ORGANIZER" | "CUSTOMER";
}

/**
 * Discriminated union describing the reason a login attempt failed.
 * The login page uses this to decide what UI to show.
 */
export type LoginReason =
  | "email_not_verified"
  | "invalid_credentials"
  | "network_error"
  | "server_error";

export type LoginResult =
  | { ok: true }
  | { ok: false; reason: LoginReason; message: string };

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ======================================================
  // Obtener usuario desde la cookie (sin romper sesión)
  // ======================================================
  async function fetchUser() {
    try {
      const res = await fetch("/api/me", {
        method: "GET",
        credentials: "include",
      }).catch(() => null);

      // Error de red → NO invalidar sesión
      if (!res) {
        return;
      }

      // No hay sesión activa
      if (res.status === 401) {
        setUser(null);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        // Otro error del servidor → no tocar sesión
        return;
      }

      const data = await res.json();
      setUser(data || null);
    } catch {
      // Error inesperado → no romper sesión
    } finally {
      setLoading(false);
    }
  }

  // Inicializa estado una única vez al montar el provider
  useEffect(() => {
    fetchUser();
  }, []);

  // ======================================================
  // Login → backend setea la cookie → recargar contexto
  // ======================================================
  async function login(
    email: string,
    password: string
  ): Promise<LoginResult> {
    setLoading(true);

    let res: Response | null = null;

    try {
      res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
    } catch {
      // Error de red (sin conexión, servidor caído, etc.)
      setLoading(false);
      return {
        ok: false,
        reason: "network_error",
        message:
          "No se pudo conectar con el servidor. Verificá tu conexión e intentá nuevamente.",
      };
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setUser(null);
      setLoading(false);

      const mapped = mapLoginError(res.status, data.error);

      if (mapped === EMAIL_NOT_VERIFIED_SENTINEL) {
        return {
          ok: false,
          reason: "email_not_verified",
          message:
            "Tu email aún no fue verificado. Revisá tu casilla de correo.",
        };
      }

      return {
        ok: false,
        reason: res.status >= 500 ? "server_error" : "invalid_credentials",
        message: mapped,
      };
    }

    await fetchUser();
    return { ok: true };
  }

  // ======================================================
  // Logout → borra cookie + reset de contexto
  // ======================================================
  async function logout() {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Si el logout falla en red, igual limpiamos el estado local
    }

    setUser(null);
    setLoading(false);
    router.push("/");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refetchUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
