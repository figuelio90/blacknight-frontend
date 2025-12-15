"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/app/hooks/useAuth";
import Image from "next/image";

interface ReservationItem {
  ticketTypeId: number;
  quantity: number;
  price: number;
  subtotal: number;
  ticketType?: { name: string };
}

interface Reservation {
  id: number;
  token: string;
  expiresAt: string;
  event: {
    id: number;
    title: string;
    venueCity?: string;
    startAt: string;
    image?: string;
    serviceFeePercent?: number;
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [items, setItems] = useState<ReservationItem[]>([]);
  const [backendTotal, setBackendTotal] = useState(0);

  const [loadingReservation, setLoadingReservation] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [expired, setExpired] = useState(false);
  const [paying, setPaying] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // ================================
  // FETCH RESERVATION
  // ================================
  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    async function loadReservation() {
      try {
        const token = localStorage.getItem("reservationToken");

        if (!token) {
          alert("No hay una reserva activa.");
          router.push("/");
          return;
        }

        const res = await fetch(`${API_URL}/api/reservations/${token}`, {
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          setExpired(true);
          localStorage.removeItem("reservationToken");
          return;
        }

        setReservation(data.reservation);
        setItems(data.items);
        setBackendTotal(data.total);

        const expiresAt = new Date(data.reservation.expiresAt).getTime();
        const remaining = Math.floor((expiresAt - Date.now()) / 1000);
        setTimeLeft(remaining > 0 ? remaining : 0);
      } catch (err) {
        console.error("❌ Error cargando reserva:", err);
        router.push("/");
      } finally {
        setLoadingReservation(false);
      }
    }

    loadReservation();
  }, [loading, user, router, API_URL]);

  // ================================
  // TIMER
  // ================================
  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setExpired(true);
          localStorage.removeItem("reservationToken");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // ================================
  // PAY
  // ================================
  async function handlePay() {
    if (paying) return; // ⛔ CLAVE: evita doble ejecución

    setPaying(true);

    try {
      const res = await fetch(`${API_URL}/api/payments/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationToken: reservation?.token }),
      });

      const data = await res.json();

      if (!res.ok) {
        // ⚠️ NO liberar el botón acá
        alert(
          data.error ||
            "Ya estamos procesando tu pago. Por favor, aguardá un momento."
        );
        return;
      }

      if (!data.init_point) {
        alert("Error iniciando el pago con Mercado Pago");
        return;
      }

      window.location.href = data.init_point;
    } catch (error) {
      console.error(error);
      alert("Error iniciando el pago.");
    }
  }

  if (loadingReservation)
    return <p className="text-center text-gray-400 mt-10">Cargando reserva...</p>;

  if (!reservation)
    return <p className="text-center text-red-500 mt-10">Reserva no encontrada.</p>;

  const event = reservation.event;

  const feePercent = event.serviceFeePercent ?? 0;
  const serviceFee = Math.round(backendTotal * (feePercent / 100));
  const finalTotal = backendTotal + serviceFee;

  // ================================
  // UI
  // ================================
  return (
    <main className="min-h-screen bg-black py-10 px-4">
      <div className="w-full flex justify-center py-8 mb-10">
        <div className="flex items-center gap-8 text-sm text-gray-400">

          {/* Paso 1 */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full border border-neutral-600 flex items-center justify-center text-xs">
              1
            </div>
            <span>Carrito</span>
          </div>

          <div className="h-px w-12 bg-neutral-700" />

          {/* Paso 2 ACTIVO */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">
              2
            </div>
            <span className="text-white">Checkout</span>
          </div>

          <div className="h-px w-12 bg-neutral-700" />

          {/* Paso 3 */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full border border-neutral-600 flex items-center justify-center text-xs">
              3
            </div>
            <span>Pago</span>
          </div>

        </div>
      </div>
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">

        {/* LEFT — DARK EVENT PANEL */}
        <div className="w-full bg-black text-white rounded-3xl p-8 shadow-xl border border-neutral-800">
          <button
            className="text-gray-400 mb-4 hover:text-white"
            onClick={() => router.back()}
          >
            ← Volver
          </button>

          <h2 className="text-4xl font-bold mb-6">{event.title}</h2>

          {event.image && (
            <div className="relative w-full h-48 rounded-xl overflow-hidden mb-6 border border-neutral-700">
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <p className="text-gray-300">{event.venueCity}</p>
          <p className="text-gray-400 mb-6">
            {new Date(event.startAt).toLocaleString("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>

          <h3 className="text-xl text-violet-400 font-semibold mb-3">
            Entradas seleccionadas
          </h3>

          <div className="space-y-2">
            {items.map((i) => (
              <div
                key={i.ticketTypeId}
                className="flex justify-between text-gray-300 bg-neutral-900 p-3 rounded-lg"
              >
                <span>
                  {i.ticketType?.name} × {i.quantity}
                </span>
                <strong>${i.subtotal.toLocaleString("es-AR")}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — SUMMARY */}
        <div className="w-full bg-white rounded-3xl p-8 shadow-xl border border-neutral-200 flex flex-col justify-between">

          {/* TIMER */}
          <div className="text-center mb-6">
            <p className="text-gray-700 font-medium">Tu reserva expira en</p>
            <p
              className={`text-4xl font-mono font-bold ${
                timeLeft <= 60 ? "text-red-500" : "text-neutral-800"
              }`}
            >
              {minutes}:{seconds.toString().padStart(2, "0")}
            </p>
          </div>

          {/* PRICE SUMMARY */}
          <div className="space-y-2 text-gray-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <strong>${backendTotal.toLocaleString("es-AR")}</strong>
            </div>

            <div className="flex justify-between">
              <span>Cargos de servicio ({feePercent}%)</span>
              <strong>${serviceFee.toLocaleString("es-AR")}</strong>
            </div>

            <hr className="my-3" />

            <div className="flex justify-between text-xl font-bold text-violet-700">
              <span>Total</span>
              <span>${finalTotal.toLocaleString("es-AR")}</span>
            </div>
          </div>

          {/* PAY BUTTON */}
          <button
            onClick={handlePay}
            disabled={paying || timeLeft <= 0}
            className={`
              w-full py-4 mt-8 rounded-xl font-semibold text-lg
              flex items-center justify-center gap-3
              transition-all
              ${
                timeLeft > 0
                  ? "bg-black text-white hover:bg-neutral-900"
                  : "bg-neutral-400 text-neutral-700 cursor-not-allowed"
              }
            `}
          >
            {paying ? "Procesando..." : "Pagar con Mercado Pago"}
          </button>

          <p className="text-center text-gray-500 text-sm mt-3">
            Pagá de forma segura
          </p>
        </div>
      </div>

      {/* EXPIRED OVERLAY */}
      {expired && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-neutral-900 p-8 rounded-2xl text-center text-white max-w-sm">
            <h2 className="text-2xl font-bold mb-2">⏰ Tu reserva expiró</h2>
            <p className="text-gray-300 mb-6">
              Las entradas fueron liberadas. Volvé al evento para intentar nuevamente.
            </p>

            <button
              onClick={() => {
                localStorage.removeItem("reservationToken");
                router.push(`/events/${event.id}`);
              }}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg font-semibold"
            >
              Volver al evento
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
