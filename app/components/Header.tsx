"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { ChevronDown, LayoutDashboard, LogOut, ShoppingCart, Ticket, UserRound } from "lucide-react";
import useAuth from "@/app/hooks/useAuth";
import { useCartStore } from "@/app/store/cartStore";
import HeaderMobileMenu from "./header/HeaderMobileMenu";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300";
const subscribeToMount = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function Brand({ compact = false, menu = false }: { compact?: boolean; menu?: boolean }) {
  return (
    <Link href="/" aria-label="BlackNight, inicio" className={"inline-flex min-h-11 min-w-0 shrink-0 items-center gap-1.5 rounded sm:gap-2 " + focusRing}>
      <Image src="/brand/blacknight-moon-purple.png" alt="" aria-hidden="true" width={40} height={40} priority className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9 lg:h-10 lg:w-10" />
      <span className="min-w-0">
        <span className="block whitespace-nowrap text-[21px] font-bold leading-none tracking-[-0.045em] sm:text-2xl lg:text-[27px]">
          <span className="text-white">Black</span><span className="text-violet-500">Night</span>
        </span>
        <span className={(compact ? "hidden" : menu ? "block" : "hidden lg:block") + " mt-1.5 whitespace-nowrap text-[7px] font-medium uppercase leading-none tracking-[0.29em] text-violet-200/80 lg:text-[8px]"}>Más que entradas</span>
      </span>
    </Link>
  );
}

export default function Header() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const cartCount = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
  // Keep the server and first hydrated render consistent with persisted carts.
  const mounted = useSyncExternalStore(subscribeToMount, clientSnapshot, serverSnapshot);
  const totalCartItems = mounted ? cartCount : 0;
  const [scrolled, setScrolled] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const accountRef = useRef<HTMLDetailsElement>(null);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (position) => setScrolled(position > 24));

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !accountRef.current?.contains(event.target)) {
        accountRef.current?.removeAttribute("open");
      }
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    accountRef.current?.removeAttribute("open");
    try {
      await logout();
    } finally {
      setSigningOut(false);
    }
  }

  const initials = [user?.firstName, user?.lastName].map((name) => name?.trim().charAt(0) ?? "").join("").toLocaleUpperCase("es-AR") || "BN";
  const accountLink = "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-200 transition-colors hover:bg-violet-500/10 hover:text-white " + focusRing;

  return (
    <header data-scrolled={scrolled} className="fixed inset-x-0 top-0 z-50 h-16 px-2 font-sans text-white sm:px-4 lg:px-6">
      <div className={"relative mx-auto mt-1 grid h-14 max-w-[1440px] grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-1 rounded-xl border px-2 motion-safe:transition-[background-color,border-color,box-shadow] motion-safe:duration-200 sm:px-4 lg:flex lg:gap-8 lg:px-5 " + (scrolled ? "border-violet-300/30 bg-[#08070c]/95 shadow-[0_8px_24px_-16px_#000] backdrop-blur-xl" : "border-violet-300/20 bg-[#09070e]/85 shadow-[inset_0_-1px_0_rgba(139,92,246,0.12)] backdrop-blur-md")}>
        <HeaderMobileMenu key={pathname} brand={<Brand menu />} pathname={pathname} user={user} loading={loading} signingOut={signingOut} onLogout={signOut} />

        <div className="min-w-0 justify-self-center lg:shrink-0">
          <Brand compact={scrolled} />
        </div>

        <nav aria-label="Navegación principal" className="hidden h-full min-w-0 flex-1 items-center gap-7 pl-2 lg:flex">
          <Link href="/" aria-current={pathname === "/" ? "page" : undefined} className={"relative inline-flex min-h-11 items-center rounded text-sm font-medium transition-colors hover:text-violet-200 " + focusRing + (pathname === "/" ? " text-violet-200 after:absolute after:inset-x-0 after:bottom-0.5 after:h-px after:bg-violet-500" : " text-neutral-200")}>Eventos</Link>
          <a href="mailto:hola@blacknight.com" className={"inline-flex min-h-11 items-center rounded text-sm font-medium text-neutral-200 transition-colors hover:text-violet-200 " + focusRing}>Ayuda</a>
        </nav>

        <div className="hidden shrink-0 items-center gap-5 border-l border-white/20 pl-6 lg:flex">
          {loading ? (
            <span role="status" className="inline-flex min-h-11 items-center text-xs text-neutral-300">Verificando sesión…</span>
          ) : user ? (
            <details
              key={pathname}
              ref={accountRef}
              className="group relative"
              onKeyDown={(event) => {
                if (event.key === "Escape" && accountRef.current?.open) {
                  event.preventDefault();
                  accountRef.current.open = false;
                  accountRef.current.querySelector("summary")?.focus();
                }
              }}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
              }}
            >
              <summary aria-label={"Cuenta de " + (user.firstName || "usuario")} className={"flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-lg text-sm marker:content-none [&::-webkit-details-marker]:hidden " + focusRing}>
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-violet-200/60 bg-violet-200/10 text-xs font-medium text-white">{initials}</span>
                <span className="max-w-36 truncate">Hola, {user.firstName || "mi cuenta"}</span>
                <ChevronDown size={15} strokeWidth={1.6} aria-hidden="true" className="shrink-0 text-neutral-300 motion-safe:transition-transform group-open:rotate-180" />
              </summary>
              <nav aria-label="Mi cuenta" className="absolute right-0 top-[calc(100%+0.75rem)] w-60 rounded-xl border border-violet-300/25 bg-[#0c0a11] p-2 shadow-[0_16px_40px_-18px_#000]">
                <Link href="/profile" className={accountLink}><UserRound size={18} strokeWidth={1.6} aria-hidden="true" />Mi cuenta</Link>
                <Link href="/profile" className={accountLink}><Ticket size={18} strokeWidth={1.6} aria-hidden="true" />Mis entradas</Link>
                {user.role === "ADMIN" && <Link href="/admin/events-manager" className={accountLink}><LayoutDashboard size={18} strokeWidth={1.6} aria-hidden="true" />Panel Admin</Link>}
                <div className="my-2 border-t border-white/10" />
                <button type="button" disabled={signingOut} onClick={() => void signOut()} className={accountLink + " w-full text-left disabled:opacity-50"}><LogOut size={18} strokeWidth={1.6} aria-hidden="true" />{signingOut ? "Cerrando sesión…" : "Cerrar sesión"}</button>
              </nav>
            </details>
          ) : (
            <>
              <Link href="/login" className={"inline-flex min-h-11 items-center whitespace-nowrap rounded text-sm font-medium text-neutral-200 transition-colors hover:text-white " + focusRing}>Iniciar sesión</Link>
              <Link href="/register" className={"inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg border border-violet-500/60 bg-gradient-to-br from-violet-600 to-violet-800 px-5 text-sm font-semibold text-white hover:from-violet-500 hover:to-violet-700 " + focusRing}>Crear cuenta</Link>
            </>
          )}
        </div>

        <Link href="/cart" aria-label={totalCartItems ? "Ver carrito, " + totalCartItems + (totalCartItems === 1 ? " entrada" : " entradas") : "Ver carrito, vacío"} className={"relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-violet-300/40 bg-white/[0.025] text-neutral-100 transition-colors hover:border-violet-400 hover:bg-violet-500/10 " + focusRing}>
          <ShoppingCart size={23} strokeWidth={1.4} aria-hidden="true" />
          {totalCartItems > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">{totalCartItems > 9 ? "9+" : totalCartItems}</span>}
        </Link>
      </div>
    </header>
  );
}
