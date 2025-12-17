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
  login: (email: string, password: string) => Promise<boolean>;
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

    if (!res.ok) {
      setUser(null);
      setLoading(false);
      return false;
    }

    // 🔁 backend setea cookie → ahora traemos el usuario
    await fetchUser();
    return true;
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
