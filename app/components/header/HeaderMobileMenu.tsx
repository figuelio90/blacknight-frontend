"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { CalendarDays, CircleHelp, LayoutDashboard, LogOut, Menu, Ticket, UserRound, X } from "lucide-react";

interface Props {
  brand: ReactNode;
  pathname: string;
  user: { firstName: string; lastName: string; role: string } | null;
  loading: boolean;
  signingOut: boolean;
  onLogout: () => Promise<void>;
}

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300";

export default function HeaderMobileMenu({ brand, pathname, user, loading, signingOut, onLogout }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const restoreScrollRef = useRef<(() => void) | null>(null);

  function closeMenu() {
    dialogRef.current?.close();
  }

  function openMenu() {
    if (!dialogRef.current || dialogRef.current.open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    restoreScrollRef.current = () => { document.body.style.overflow = previousOverflow; };
    dialogRef.current.showModal();
    triggerRef.current?.setAttribute("aria-expanded", "true");
  }

  function afterClose() {
    restoreScrollRef.current?.();
    restoreScrollRef.current = null;
    triggerRef.current?.setAttribute("aria-expanded", "false");
    triggerRef.current?.focus({ preventScroll: true });
  }

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    function closeOnDesktop() {
      if (desktop.matches) dialogRef.current?.close();
    }
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      restoreScrollRef.current?.();
    };
  }, []);

  const itemClass = "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-200 transition-colors hover:bg-violet-500/10 hover:text-white " + focusRing;

  return (
    <div className="lg:hidden">
      <button ref={triggerRef} type="button" onClick={openMenu} aria-label="Abrir menú" aria-expanded="false" aria-controls="header-mobile-menu" className={"flex h-11 w-11 items-center justify-center rounded-lg text-neutral-200 hover:bg-violet-500/10 hover:text-white " + focusRing}>
        <Menu size={26} strokeWidth={1.5} aria-hidden="true" />
      </button>
      <dialog
        ref={dialogRef}
        id="header-mobile-menu"
        aria-label="Menú principal"
        onClose={afterClose}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("a[href], button:not(:disabled), [tabindex='0']"))
            .filter((element) => element.getClientRects().length > 0);
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget || (event.target instanceof Element && event.target.closest("a"))) closeMenu();
        }}
        className="fixed inset-y-0 left-0 right-auto m-0 h-dvh max-h-none w-[min(22rem,calc(100%-1rem))] max-w-none overflow-y-auto overscroll-contain rounded-r-2xl border-y-0 border-l-0 border-r border-violet-300/25 bg-[#09080e] p-0 font-sans text-white shadow-[12px_0_60px_-24px_#000] backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <div className="flex min-h-full flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between gap-3">
            {brand}
            <button type="button" onClick={closeMenu} aria-label="Cerrar menú" className={"flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-neutral-300 hover:bg-white/5 hover:text-white " + focusRing}><X size={22} strokeWidth={1.5} aria-hidden="true" /></button>
          </div>

          <nav aria-label="Navegación mobile" className="mt-7 space-y-1">
            <Link href="/" aria-current={pathname === "/" ? "page" : undefined} className={itemClass + (pathname === "/" ? " bg-violet-600/25 text-violet-100" : "")}><CalendarDays size={19} strokeWidth={1.6} aria-hidden="true" />Eventos</Link>
            <a href="mailto:hola@blacknight.com" className={itemClass}><CircleHelp size={19} strokeWidth={1.6} aria-hidden="true" />Ayuda</a>
          </nav>

          <div className="my-5 border-t border-white/10" />
          {loading ? (
            <p role="status" className="px-3 py-3 text-sm text-neutral-300">Verificando sesión…</p>
          ) : user ? (
            <>
              <p className="mb-3 px-3 text-sm font-medium text-violet-200 [overflow-wrap:anywhere]">Hola, {user.firstName || "mi cuenta"}</p>
              <nav aria-label="Mi cuenta mobile" className="space-y-1">
                <Link href="/profile" className={itemClass}><UserRound size={19} strokeWidth={1.6} aria-hidden="true" />Mi cuenta</Link>
                <Link href="/profile" className={itemClass}><Ticket size={19} strokeWidth={1.6} aria-hidden="true" />Mis entradas</Link>
                {user.role === "ADMIN" && <Link href="/admin/events-manager" className={itemClass}><LayoutDashboard size={19} strokeWidth={1.6} aria-hidden="true" />Panel Admin</Link>}
              </nav>
              <button type="button" disabled={signingOut} onClick={() => { closeMenu(); void onLogout(); }} className={itemClass + " mt-4 w-full border border-violet-400/40 text-left disabled:opacity-50"}><LogOut size={19} strokeWidth={1.6} aria-hidden="true" />{signingOut ? "Cerrando sesión…" : "Cerrar sesión"}</button>
            </>
          ) : (
            <div className="space-y-3">
              <Link href="/register" className={"flex min-h-12 items-center justify-center rounded-lg border border-violet-500/60 bg-gradient-to-br from-violet-600 to-violet-800 px-5 text-sm font-semibold text-white hover:from-violet-500 hover:to-violet-700 " + focusRing}>Crear cuenta</Link>
              <Link href="/login" className={"flex min-h-12 items-center justify-center rounded-lg border border-violet-500 px-5 text-sm font-medium text-violet-200 hover:bg-violet-500/10 " + focusRing}>Iniciar sesión</Link>
            </div>
          )}
        </div>
      </dialog>
    </div>
  );
}
