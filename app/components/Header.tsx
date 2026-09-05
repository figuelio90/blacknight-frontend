"use client";

import Link from "next/link";
import useAuth from "@/app/hooks/useAuth";
import { useCartStore } from "@/app/store/cartStore";

export default function Header() {
  const { user, loading, logout } = useAuth();
  const cart = useCartStore();

  const totalCartItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="fixed top-0 w-full bg-black/90 backdrop-blur-md border-b border-neutral-900 z-50">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 lg:px-10 h-16">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xl leading-none">🌙</span>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-white">Black</span>
            <span className="text-violet-500">Night</span>
          </span>
        </Link>

        {/* Nav central */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-sm font-medium text-gray-300 hover:text-violet-400 transition-colors"
          >
            Eventos
          </Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* 🔥 SOLO ADMIN VE ESTE BOTÓN */}
          {!loading && user?.role === "ADMIN" && (
            <Link
              href="/admin/events-manager"
              className="hidden sm:inline-flex bg-violet-700 hover:bg-violet-600 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-colors"
            >
              Panel Admin
            </Link>
          )}

          {loading ? (
            <span className="text-gray-500 text-xs">Verificando...</span>
          ) : !user ? (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors"
              >
                Crear cuenta
              </Link>
            </>
          ) : (
            <>
              <span className="text-gray-400 text-sm hidden md:block">
                Hola, {user.firstName}
              </span>
              <Link
                href="/profile"
                className="text-sm text-gray-400 hover:text-violet-400 transition-colors"
              >
                Mi cuenta
              </Link>
              <button
                onClick={logout}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Salir
              </button>
            </>
          )}

          {/* Carrito */}
          <Link
            href="/cart"
            aria-label="Ver carrito"
            className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-violet-700/50 transition-all"
          >
            <span className="text-base leading-none">🛒</span>
            {totalCartItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-violet-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {totalCartItems > 9 ? "9+" : totalCartItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
