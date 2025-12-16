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
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ======================================================
  // 🔥 Obtener usuario desde la cookie (sin spamear error 401)
  // ======================================================
  async function fetchUser() {
  try {
    const res = await fetch(`${API_BASE_URL}/me`, {
      method: "GET",
      credentials: "include",
    }).catch(() => null); // 👈 evita que Chrome loguee el error

    // Si la request falló (res = null)
    if (!res) {
      setUser(null);
      return;
    }

    // Si no hay sesión → no mostrar 401 en consola
    if (res.status === 401) {
      setUser(null);
      return;
    }

    if (!res.ok) {
      setUser(null);
      return;
    }

    const data = await res.json();
    setUser(data || null);

  } catch {
    setUser(null);
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
    await fetchUser();
    return true;
  }

  // ======================================================
  // 🔥 Logout → borra cookie + reset de contexto
  // ======================================================
  async function logout() {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}

    setUser(null);
    router.refresh(); // fuerza actualización de UI
    router.push("/");
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
