"use client";

import { createContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

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
  login: () => Promise<boolean>;
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
      const res = await fetch(`${API_BASE_URL}/api/me`, {
        method: "GET",
        credentials: "include",
      }).catch(() => null);

      // ⛔ Error de red → NO invalidar sesión
      if (!res) {
        return;
      }

      // ⛔ No hay sesión
      if (res.status === 401) {
        setUser(null);
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
  async function login() {
    setLoading(true);
    return true;
  }

  // ======================================================
  // 🔥 Logout → borra cookie + reset de contexto
  // ======================================================
  async function logout() {
    try {
      await fetch(`${API_BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}

    setUser(null);
    setLoading(false);
    router.refresh();
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
