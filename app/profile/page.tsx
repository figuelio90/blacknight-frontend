"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";

interface TicketEvent {
  id: number;
  title: string;
  startAt: string;
  venueName?: string | null;
  venueAddress?: string | null;
  venueCity?: string | null;
}

interface Ticket {
  id: number;
  code: string;
  used: boolean;
  validatedAt?: string | null;
  ticketType?: string | null;
  event: TicketEvent;
}

interface QrResponse {
  code: string;
  qr: string;
}

function ticketStatus(ticket: Ticket) {
  return ticket.used ? "Utilizada" : "Disponible";
}

function eventLocation(event: TicketEvent) {
  return [event.venueName, event.venueAddress, event.venueCity]
    .filter(Boolean)
    .join(" · ");
}

function eventDate(startAt: string) {
  return new Date(startAt).toLocaleString("es-AR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [qrCache, setQrCache] = useState<Record<number, string>>({});
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setTicketsLoading(false);
      router.push("/login");
      return;
    }

    const controller = new AbortController();

    async function fetchTickets() {
      setTicketsLoading(true);
      setTicketsError(null);

      try {
        const response = await fetch("/api/tickets/mine", {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || "No se pudieron cargar tus entradas."
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("La respuesta de entradas no es válida.");
        }

        setTickets(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setTicketsError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar tus entradas."
        );
      } finally {
        if (!controller.signal.aborted) {
          setTicketsLoading(false);
        }
      }
    }

    fetchTickets();

    return () => controller.abort();
  }, [loading, user, router]);

  useEffect(() => {
    if (!selectedTicket) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedTicket(null);
        setQrError(null);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedTicket]);

  async function showQr(ticket: Ticket) {
    setSelectedTicket(ticket);
    setQrError(null);

    if (qrCache[ticket.id]) return;

    setQrLoading(true);

    try {
      const response = await fetch(
        `/api/tickets/${encodeURIComponent(ticket.code)}/qrcode`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "No se pudo cargar el código QR.");
      }

      const data = (await response.json()) as QrResponse;

      if (typeof data.qr !== "string" || !data.qr.startsWith("data:image/")) {
        throw new Error("El código QR recibido no es válido.");
      }

      setQrCache((current) => ({
        ...current,
        [ticket.id]: data.qr,
      }));
    } catch (error) {
      setQrError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el código QR."
      );
    } finally {
      setQrLoading(false);
    }
  }

  function closeModal() {
    setSelectedTicket(null);
    setQrError(null);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>⏳ Cargando perfil...</p>
      </main>
    );
  }

  if (!user) return null;

  const selectedQr = selectedTicket ? qrCache[selectedTicket.id] : undefined;

  return (
    <main className="min-h-screen bg-black text-white px-6 py-28">
      <div className="max-w-4xl mx-auto bg-neutral-900 rounded-2xl p-6 border border-neutral-800 shadow-lg">
        <div className="flex items-center gap-4 mb-8">
          <Image
            src={user.avatar || "/placeholder.jpg"}
            width={70}
            height={70}
            alt="Avatar del usuario"
            className="rounded-full"
          />
          <div>
            <h2 className="text-2xl font-bold">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-blue-400">{user.email}</p>
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-4">🎟️ Mis Entradas</h3>

        {ticketsLoading ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-6 text-center text-gray-400">
            Cargando tus entradas...
          </div>
        ) : ticketsError ? (
          <div
            role="alert"
            className="rounded-lg border border-red-900 bg-red-950/40 p-4 text-red-300"
          >
            {ticketsError}
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-6 text-center">
            <p className="text-gray-400">No tenés entradas todavía.</p>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {tickets.map((ticket) => {
              const location = eventLocation(ticket.event);

              return (
                <li
                  key={ticket.id}
                  className={`rounded-xl border p-5 ${
                    ticket.used
                      ? "border-neutral-700 bg-neutral-800/60"
                      : "border-blue-900/70 bg-neutral-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-lg">
                        {ticket.event.title}
                      </p>
                      <p className="mt-1 text-sm font-medium text-blue-400">
                        {ticket.ticketType || "Entrada"}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                        ticket.used
                          ? "bg-red-950 text-red-300"
                          : "bg-emerald-950 text-emerald-300"
                      }`}
                    >
                      {ticketStatus(ticket)}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-gray-300">
                    <p>📅 {eventDate(ticket.event.startAt)}</p>
                    {location && <p>📍 {location}</p>}
                    <p className="font-mono text-gray-400">
                      Código: <span className="text-white">{ticket.code}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => showQr(ticket)}
                    className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold transition hover:bg-blue-500"
                  >
                    Mostrar QR
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <button
          onClick={logout}
          className="mt-6 w-full rounded-xl bg-red-600 py-3 font-semibold hover:bg-red-700"
        >
          🚪 Cerrar sesión
        </button>
      </div>

      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-qr-title"
            className="w-full max-w-md rounded-2xl border border-neutral-700 bg-neutral-900 p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 id="ticket-qr-title" className="text-xl font-bold">
                  {selectedTicket.event.title}
                </h4>
                <p className="mt-1 text-blue-400">
                  {selectedTicket.ticketType || "Entrada"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Cerrar modal"
                className="rounded-lg px-3 py-1 text-2xl text-gray-400 hover:bg-neutral-800 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <p className="font-mono text-gray-300">{selectedTicket.code}</p>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  selectedTicket.used
                    ? "bg-red-950 text-red-300"
                    : "bg-emerald-950 text-emerald-300"
                }`}
              >
                {ticketStatus(selectedTicket)}
              </span>
            </div>

            <div className="mt-6 flex min-h-72 items-center justify-center rounded-xl bg-white p-4">
              {qrLoading && !selectedQr ? (
                <p className="text-neutral-600">Cargando QR...</p>
              ) : qrError ? (
                <p role="alert" className="text-center text-red-700">
                  {qrError}
                </p>
              ) : selectedQr ? (
                <Image
                  src={selectedQr}
                  alt={`QR del ticket ${selectedTicket.code}`}
                  width={280}
                  height={280}
                  unoptimized
                  priority
                />
              ) : null}
            </div>

            <button
              type="button"
              onClick={closeModal}
              className="mt-5 w-full rounded-lg bg-neutral-700 px-4 py-2.5 font-semibold hover:bg-neutral-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
