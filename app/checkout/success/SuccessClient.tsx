"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle, Ticket as TicketIcon, AlertCircle } from "lucide-react";


interface EventInfo {
  id: number;
  title: string;
  startAt: string;
  image?: string | null;
  venueCity?: string | null;
}

interface Ticket {
  id: number;
  code: string;
}

interface TicketWithQR extends Ticket {
  qrUrl: string;
}

export default function SuccessPage() {
  const params = useSearchParams();
  const router = useRouter();

  const paymentId = params.get("payment_id");

  const [tickets, setTickets] = useState<TicketWithQR[]>([]);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);

  const [loading, setLoading] = useState(true); // cargando todo
  const [processing, setProcessing] = useState(true); // esperando aprobación
  const [error, setError] = useState<string | null>(null);

  

  // =========================
  // 🔥 Polling del pago
  // =========================
  useEffect(() => {
    if (!paymentId) {
      setError("No se encontró el identificador de pago.");
      setLoading(false);
      setProcessing(false);
      return;
    }

    let interval: ReturnType<typeof setInterval>;
    let attempts = 0;

    async function startPolling() {
      interval = setInterval(async () => {
        attempts++;
        console.log("⏳ Consultando estado del pago… intento", attempts);

        try {
          const res = await fetch(`/api/payments/status/${paymentId}`, {
            credentials: "include",
          });
          const data = await res.json();

          if (!res.ok) {
            console.error("❌ Error consultando estado de pago:", data);
            setError(data.error || "No se pudo verificar el estado del pago.");
            setProcessing(false);
            setLoading(false);
            clearInterval(interval);
            return;
          }

          const status: string = data.status;

          // Pago aprobado pero inválido (reserva vencida / sin stock)
          if (status === "approved_invalid") {
            clearInterval(interval);
            setError(
              "El pago fue aprobado, pero la reserva expiró o no había disponibilidad. " +
              "Si el importe fue debitado, nuestro equipo revisará el caso y gestionará el reembolso."
            );
            setProcessing(false);
            setLoading(false);
            return;
          }

          // Pago aprobado → cargar tickets
          if (status === "approved") {
            console.log("🎉 Pago aprobado, cargando tickets…");
            clearInterval(interval);
            setProcessing(false);
            await loadTickets();
            return;
          }

          // Rechazado / cancelado
          if (["rejected", "cancelled"].includes(status)) {
            clearInterval(interval);
            setError("El pago fue rechazado o cancelado.");
            setProcessing(false);
            setLoading(false);
            return;
          }

          // pending / in_process → seguimos esperando un rato
          if (["pending", "in_process"].includes(status)) {
            if (attempts >= 20) {
              clearInterval(interval);
              setError(
                "El pago sigue en proceso. Podés revisar el estado en tu cuenta de Mercado Pago."
              );
              setProcessing(false);
              setLoading(false);
            }
            return;
          }

          // Estado raro/desconocido
          if (attempts >= 20) {
            clearInterval(interval);
            setError("No se pudo confirmar el estado del pago.");
            setProcessing(false);
            setLoading(false);
          }
        } catch (err) {
          console.error("❌ Error en polling de pago:", err);
          clearInterval(interval);
          setError("Error de conexión verificando el pago.");
          setProcessing(false);
          setLoading(false);
        }
      }, 2000);
    }

    async function loadTickets() {
      try {
        setLoading(true);
        setError(null);

        const reservationToken = localStorage.getItem("reservationToken");

        // 1️⃣ Intentar con confirm-by-token (flujo ideal)
        if (reservationToken) {
          const res = await fetch(
            `/api/reservations/confirm-by-token/${reservationToken}`,
            { credentials: "include" }
          );

          if (res.ok) {
            const data = await res.json();

            const event: EventInfo = {
              id: data.event.id,
              title: data.event.title,
              startAt: data.event.startAt,
              image: data.event.image ?? null,
              venueCity: data.event.venueCity ?? null,
            };

            const ticketsFromApi: Ticket[] = data.tickets || [];

            const ticketsWithQR: TicketWithQR[] = ticketsFromApi.map((t: Ticket) => ({
              ...t,
              qrUrl: `/api/tickets/${t.code}/qrcode`,
            }));
            

            setEventInfo(event);
            setTickets(ticketsWithQR);
            setLoading(false);
            localStorage.removeItem("reservationToken");
            return;
          }
        }

        // 2️⃣ Fallback: /api/tickets/mine (por si no hay token o falló arriba)
        const tRes = await fetch(`/api/tickets/mine`, {
          credentials: "include",
        });
        const tData = await tRes.json();

        if (!tRes.ok || !Array.isArray(tData)) {
          setError("No se pudieron recuperar tus tickets.");
          setLoading(false);
          return;
        }

        const ticketsWithQR: TicketWithQR[] = tData.map((ticket: any) => ({
          id: ticket.id,
          code: ticket.code,
          qrUrl: `/api/tickets/${ticket.code}/qrcode`,
        }))
        

        setTickets(ticketsWithQR);

        const firstEvent = tData[0]?.event;
        if (firstEvent) {
          setEventInfo({
            id: firstEvent.id,
            title: firstEvent.title,
            startAt: firstEvent.startAt,
            image: firstEvent.image ?? null,
            venueCity: firstEvent.venueCity ?? null,
          });
        }

        setLoading(false);
        localStorage.removeItem("reservationToken");
      } catch (err) {
        console.error("❌ Error cargando tickets:", err);
        setError("Error interno cargando tus tickets.");
        setLoading(false);
      }
    }

    startPolling();
    return () => clearInterval(interval);
  }, [paymentId, router]);

  // =========================
  //   ESTADOS INTERMEDIOS
  // =========================
  if (processing || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center space-y-4">
          <p className="text-gray-400 text-xl animate-pulse">
            Procesando tu compra, no cierres esta página…
          </p>
          {paymentId && (
            <p className="text-xs text-gray-600">
              ID de pago: <span className="font-mono">{paymentId}</span>
            </p>
          )}
        </div>
      </main>
    );
  }

  // =========================
  //   ERRORES
  // =========================
  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-black text-white flex items-center justify-center px-6 py-20">
        <div className="bg-neutral-900/90 border border-red-700/40 rounded-3xl p-10 w-full max-w-3xl shadow-[0_0_40px_rgba(248,113,113,0.25)] text-center">
          <AlertCircle className="w-20 h-20 text-red-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-3">No pudimos confirmar tu compra</h1>
          <p className="text-gray-300 mb-8">{error}</p>

          <button
            onClick={() => router.push("/")}
            className="bg-red-600 hover:bg-red-700 transition px-8 py-3 rounded-xl font-semibold"
          >
            Volver al inicio
          </button>

          <p className="text-xs text-gray-500 mt-6">
            Si el pago se debitó de tu cuenta, podrás ver el estado en tu perfil de
            Mercado Pago o en &quot;Mis entradas&quot; cuando se acrediten.
          </p>
        </div>
      </main>
    );
  }

  // =========================
  //   SIN TICKETS
  // =========================
  if (!tickets.length) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white text-center px-6">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6">
          ⏳ Estamos revisando tu compra
        </h2>
        <p className="text-gray-400 mb-6 max-w-md">
          Tu pago fue aprobado, pero la reserva no pudo confirmarse.
          No te preocupes: si el dinero fue debitado, el reembolso se gestiona automáticamente.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 bg-violet-700 hover:bg-violet-800 transition px-8 py-4 rounded-xl text-white font-semibold text-lg"
        >
          Volver al inicio
        </button>
      </main>
    );
  }

  // =========================
  //   🎉 TICKETS OK
  // =========================
  const formattedDate = eventInfo
    ? new Date(eventInfo.startAt).toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-black text-white flex items-center justify-center px-6 py-20">
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-10 w-full max-w-5xl shadow-[0_0_45px_rgba(34,197,94,0.25)] backdrop-blur-md">
        <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-start">
          {/* LEFT: Info + check */}
          <div className="flex-1 text-center lg:text-left">
            <CheckCircle className="text-green-500 w-20 h-20 mb-4 mx-auto lg:mx-0" />
            <h1 className="text-4xl lg:text-5xl font-extrabold text-green-500 mb-4">
              ¡Compra confirmada!
            </h1>

            {eventInfo && (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {eventInfo.title}
                </h2>
                {formattedDate && (
                  <p className="text-lg text-gray-300 mb-2">{formattedDate}</p>
                )}
                {eventInfo.venueCity && (
                  <p className="text-sm text-gray-400 mb-6">
                    {eventInfo.venueCity}
                  </p>
                )}
              </>
            )}

            <div className="inline-flex items-center gap-2 bg-neutral-800/70 border border-neutral-700 rounded-full px-4 py-2 text-sm text-gray-300 mb-6">
              <TicketIcon className="w-4 h-4 text-violet-400" />
              <span>{tickets.length} entrada(s) generadas a tu nombre</span>
            </div>

            <p className="text-gray-400 text-sm max-w-md">
              Presentá estos códigos QR en el ingreso al evento. También los vas a
              encontrar en la sección &quot;Mis entradas&quot; y en el correo de
              confirmación que te enviamos.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push("/profile")}
                className="flex-1 bg-gradient-to-r from-violet-700 to-yellow-500 hover:opacity-90 transition px-6 py-3 rounded-xl text-white font-semibold text-lg"
              >
                Ver mis entradas
              </button>
              {eventInfo && (
                <button
                  onClick={() => router.push(`/events/${eventInfo.id}`)}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 transition px-6 py-3 rounded-xl text-gray-200 font-semibold text-lg border border-neutral-700"
                >
                  Ver información del evento
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: QRs */}
          <div className="flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 justify-items-center">
              {tickets.map((ticket, index) => (
                <div
                  key={ticket.id}
                  className="bg-neutral-800/80 border border-neutral-700 p-4 rounded-2xl flex flex-col items-center w-[150px] hover:bg-neutral-700/80 transition"
                >
                  <Image
                    src={ticket.qrUrl}
                    alt={`QR ${index + 1}`}
                    width={130}
                    height={130}
                    unoptimized
                  />
                  <p className="text-xs text-gray-400">
                    Entrada #{index + 1}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1 font-mono break-all">
                    {ticket.code.slice(0, 10)}…
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-10">
          Si tenés algún problema con tu compra, contactá al soporte de BlackNight
          indicando el ID de pago:{" "}
          <span className="font-mono text-gray-300">{paymentId}</span>
        </p>
      </div>
    </main>
  );
}
