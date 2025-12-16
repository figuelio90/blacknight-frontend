"use client";

import Link from "next/link";
import useAuth from "@/app/hooks/useAuth";

export default function Header() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="fixed top-0 w-full bg-black/80 backdrop-blur-md border-b border-neutral-800 z-50">
      <div className="flex items-center justify-between px-10 py-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl">🌙</span>
          <h1 className="text-2xl font-bold">BlackNight</h1>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-blue-400">
            Eventos
          </Link>

          {/* 🔥 SOLO ADMIN VE ESTE BOTÓN */}
          {!loading && user?.role === "ADMIN" && (
            <Link
              href="/admin/events-manager"
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white font-semibold"
            >
              Panel Admin
            </Link>
          )}

          {loading ? (
            <span className="text-gray-400 text-xs">Verificando...</span>
          ) : !user ? (
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
            >
              Iniciar sesión
            </Link>
          ) : (
            <>
              <span className="text-gray-300">
                Hola, {user.firstName}  
              </span>

              <Link href="/profile" className="hover:text-blue-400">
                Mi cuenta
              </Link>

              <button
                onClick={logout}
                className="text-red-400 hover:text-red-500"
              >
                Cerrar sesión
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
