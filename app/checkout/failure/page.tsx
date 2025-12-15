"use client";

import { useEffect } from "react";
import Link from "next/link";
import { XCircle } from "lucide-react";

export default function FailurePage() {

  // Limpia token de reserva si quedó activo
  useEffect(() => {
    localStorage.removeItem("reservationToken");
  }, []);

  return (
    <main className="min-h-screen bg-black flex items-center justify-center text-center text-white px-6 py-16">
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-10 md:p-16 w-full max-w-4xl shadow-[0_0_25px_rgba(255,80,80,0.25)]">
        
        <XCircle className="text-red-500 w-24 h-24 md:w-28 md:h-28 mb-8 mx-auto animate-in fade-in zoom-in" />

        <h1 className="text-4xl md:text-5xl font-extrabold text-red-500 mb-6">
          Pago rechazado o cancelado
        </h1>

        <p className="text-gray-300 mb-10 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
          Tu pago no pudo completarse. Podés volver al evento e intentar nuevamente.
        </p>

        <Link
          href="/"
          className="inline-block bg-gradient-to-r from-violet-700 to-purple-500 hover:opacity-90 transition px-10 py-4 rounded-xl text-white font-semibold text-lg shadow-lg"
        >
          Volver al inicio
        </Link>

        <p className="text-base text-gray-500 mt-12 max-w-md mx-auto">
          Si el pago fue realizado, revisá tu correo o tu perfil para confirmar tus entradas.
        </p>
      </div>
    </main>
  );
}
