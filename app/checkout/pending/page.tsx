"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";

export default function PendingPage() {

  // Si hay reserva previa, la eliminamos para evitar inconsistencias
  useEffect(() => {
    localStorage.removeItem("reservationToken");
  }, []);

  return (
    <main className="min-h-screen bg-black flex items-center justify-center text-center text-white px-6 py-16">
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-10 md:p-16 w-full max-w-4xl shadow-[0_0_30px_rgba(250,204,21,0.15)] backdrop-blur-md">
        
        {/* Icono animado */}
        <Clock className="text-yellow-400 w-24 h-24 md:w-28 md:h-28 mb-8 mx-auto animate-spin-slow" />

        {/* Título */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-400 mb-6">
          Pago en proceso
        </h1>

        {/* Mensaje principal */}
        <p className="text-gray-300 mb-10 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
          Tu pago está siendo revisado por Mercado Pago.  
          <br className="hidden md:block" />
          Este proceso puede demorar unos minutos.
        </p>

        {/* Botón volver al perfil */}
        <Link
          href="/profile"
          className="inline-block bg-gradient-to-r from-yellow-600 to-violet-600 hover:opacity-90 transition px-10 py-4 rounded-xl text-white font-semibold text-lg shadow-lg"
        >
          Ver mis compras
        </Link>

        {/* Mensaje secundario */}
        <p className="text-base text-gray-500 mt-12 max-w-lg mx-auto">
          Te avisaremos por correo apenas el pago sea aprobado.  
          También podés volver más tarde para revisar el estado de tus tickets.
        </p>
      </div>

      {/* Animación personalizada */}
      <style jsx>{`
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
