"use client";

import { createContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";



interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: "ADMIN" | "ORGANIZER" | "CUSTOMER";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  

  // ======================================================
  // 🔥 Obtener usuario desde la cookie (sin romper sesión)
  // ======================================================
  async function fetchUser() {
    try {
      const res = await fetch("/api/me", {
        method: "GET",
        credentials: "include", // 🔑 CLAVE
      }).catch(() => null);

      // ⛔ Error de red → NO invalidar sesión
      if (!res) {
        return;
      }

      // ⛔ No hay sesión
      if (res.status === 401) {
        setUser(null);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      setUser(data || null);

    } catch {
      // ⛔ Error inesperado → no romper sesión
    } finally {
      setLoading(false);
    }
  }

  // Inicializa estado una única vez
  useEffect(() => {
    fetchUser();
  }, []);


  // ======================================================
  // 🔥 Login → backend setea la cookie → recargar contexto
  // ======================================================
  async function login(email: string, password: string) {
    setLoading(true);

    const res = await fetch(`/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setUser(null);
      setLoading(false);
      return {
        ok: false,
        message: data.error || "Credenciales incorrectas",
      };
    }

    await fetchUser();
    return { ok: true };
  }

  // ======================================================
  // 🔥 Logout → borra cookie + reset de contexto
  // ======================================================
  async function logout() {
    try {
      await fetch(`/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}

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
        refetchUser: fetchUser, // 👈 AGREGAR
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
