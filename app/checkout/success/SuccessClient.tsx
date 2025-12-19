"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";

type PaymentStatus = "processing" | "approved" | "error";

export default function SuccessPage() {
  const params = useSearchParams();
  const router = useRouter();

  const paymentId = params.get("paymentId");

  const [status, setStatus] = useState<PaymentStatus>("processing");

  // ======================================================
  // 🔄 POLLING SOLO DEL ESTADO DEL PAGO
  // (NO tickets, NO reserva, NO lógica pesada)
  // ======================================================
  useEffect(() => {
    if (!paymentId) {
      setStatus("error");
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status/${paymentId}`, {
          credentials: "include",
        });

        if (!res.ok) {
          setStatus("error");
          clearInterval(interval);
          return;
        }

        const data = await res.json();

        if (data.status === "approved") {
          setStatus("approved");
          clearInterval(interval);
        }

        if (data.status === "approved_invalid") {
          setStatus("error");
          clearInterval(interval);
        }

        // status === "processing" → seguimos esperando
      } catch {
        setStatus("error");
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [paymentId]);

  // ======================================================
  // ⏳ PROCESANDO
  // ======================================================
  if (status === "processing") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center space-y-4">
          <p className="text-gray-400 text-xl animate-pulse">
            Pago confirmado. Estamos generando tus entradas…
          </p>
          <p className="text-sm text-gray-600">
            Podés cerrar esta página con tranquilidad.
          </p>
          {paymentId && (
            <p className="text-xs text-gray-700">
              ID de pago: <span className="font-mono">{paymentId}</span>
            </p>
          )}
        </div>
      </main>
    );
  }

  // ======================================================
  // ❌ ERROR
  // ======================================================
  if (status === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center space-y-6 max-w-md">
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto" />
          <h1 className="text-3xl font-bold text-red-500">
            No pudimos confirmar la compra
          </h1>
          <p className="text-gray-400">
            Si el pago fue debitado, se procesará automáticamente o se
            gestionará el reembolso.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold"
          >
            Volver al inicio
          </button>
        </div>
      </main>
    );
  }

  // ======================================================
  // ✅ PAGO APROBADO
  // ======================================================
  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center space-y-6 max-w-md">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
        <h1 className="text-4xl font-bold text-green-500">
          ¡Pago confirmado!
        </h1>
        <p className="text-gray-400">
          Tus entradas se están generando y estarán disponibles en
          <strong> Mis entradas</strong>.
        </p>

        <button
          onClick={() => router.push("/profile")}
          className="bg-violet-600 hover:bg-violet-700 px-8 py-4 rounded-xl text-white font-semibold text-lg"
        >
          Ir a mis entradas
        </button>

        {paymentId && (
          <p className="text-xs text-gray-600 mt-4">
            ID de pago: <span className="font-mono">{paymentId}</span>
          </p>
        )}
      </div>
    </main>
  );
}
