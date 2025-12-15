"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { useCartStore } from "@/app/store/cartStore";
import useAuth from "@/app/hooks/useAuth";
import { FaTrash } from "react-icons/fa";

interface TicketType {
  id: number;
  name: string;
  price: number;
  stock: number;
  description?: string;
  active: boolean;
}

interface Event {
  id: number;
  title: string;
  image?: string | null;
  startAt: string;
  venueName?: string;
  maxTicketsPerUser?: number;
  serviceFeePercent?: number;
  ticketTypes: TicketType[];
}

export default function CartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("eventId");
  const { user, loading: authLoading } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const cart = useCartStore();

  const [event, setEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creatingReservation, setCreatingReservation] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);

  // =========================
  // Cargar evento por eventId
  // =========================
  useEffect(() => {
    if (!eventIdParam) {
      setError("Carrito inválido: falta el ID del evento.");
      setLoadingEvent(false);
      return;
    }

    async function loadEvent() {
      try {
        setLoadingEvent(true);
        setError(null);

        const res = await fetch(`${API_URL}/api/events/${eventIdParam}`, {
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 404) setError("Evento no encontrado.");
          else setError("No se pudo cargar la información del evento.");
          setLoadingEvent(false);
          return;
        }

        const data = await res.json();

        const normalizedTickets: TicketType[] = (data.ticketTypes || []).map(
          (t: any) => ({
            id: t.id,
            name: t.name,
            price: Number(t.price),
            stock: Number(t.stock),
            description: t.description || "",
            active: t.active ?? true,
          })
        );

        setEvent({
          id: data.id,
          title: data.title,
          image: data.image,
          startAt: data.startAt,
          venueName: data.venueName,
          maxTicketsPerUser: data.maxTicketsPerUser ?? undefined,
          serviceFeePercent: data.serviceFeePercent ?? 0,
          ticketTypes: normalizedTickets,
        });
      } catch (err) {
        console.error("❌ Error al cargar evento en /cart:", err);
        setError("Error interno del servidor.");
      } finally {
        setLoadingEvent(false);
      }
    }

    loadEvent();
  }, [eventIdParam, API_URL]);

  // =========================
  // Derivados del carrito
  // =========================
  const itemsWithDetails = useMemo(() => {
    if (!event) return [];

    return cart.items
      .map((item) => {
        const ticket = event.ticketTypes.find(
          (t) => t.id === item.ticketTypeId
        );
        if (!ticket) return null;
        return {
          ...item,
          stock: ticket.stock,
          description: ticket.description,
        };
      })
      .filter(Boolean) as (typeof cart.items[0] & {
      stock: number;
      description?: string;
    })[];
  }, [cart.items, event]);

  const totalQuantity = useMemo(
    () => itemsWithDetails.reduce((acc, i) => acc + i.quantity, 0),
    [itemsWithDetails]
  );

  const totalAmount = useMemo(
    () => itemsWithDetails.reduce((acc, i) => acc + i.quantity * i.price, 0),
    [itemsWithDetails]
  );
    // Comisión configurada por el organizador (o admin)
    const serviceFeePercent = event?.serviceFeePercent ?? 0;

    // Monto de la comisión
    const serviceFeeAmount = useMemo(() => {
    return Math.round(totalAmount * (serviceFeePercent / 100));
    }, [totalAmount, serviceFeePercent]);

    // Total final (entradas + comisión)
    const finalTotal = useMemo(() => {
    return totalAmount + serviceFeeAmount;
    }, [totalAmount, serviceFeeAmount]);


  const globalMax = event?.maxTicketsPerUser ?? Infinity;

  // =========================
  // Manejar cambios de cantidad
  // =========================
  const handleChangeQuantity = (
    ticketTypeId: number,
    direction: "inc" | "dec"
  ) => {
    const currentItem = cart.items.find((i) => i.ticketTypeId === ticketTypeId);
    if (!currentItem || !event) return;

    const ticket = event.ticketTypes.find((t) => t.id === ticketTypeId);
    if (!ticket) return;

    const currentQty = currentItem.quantity;
    const otherQty = totalQuantity - currentQty;

    const maxByStock = ticket.stock;
    const maxByGlobal =
      globalMax === Infinity ? maxByStock : Math.max(0, globalMax - otherQty);

    const maxAllowed = Math.min(maxByStock, maxByGlobal);

    if (direction === "dec") {
      const newQty = Math.max(0, currentQty - 1);
      cart.setQuantity({
        ticketTypeId,
        name: currentItem.name,
        price: currentItem.price,
        quantity: newQty,
      });
      return;
    }

    if (direction === "inc") {
      if (currentQty >= maxAllowed) {
        alert(
          `Alcanzaste el máximo permitido de entradas (${globalMax} por usuario) o el stock disponible.`
        );
        return;
      }

      const newQty = currentQty + 1;

      cart.setQuantity({
        ticketTypeId,
        name: currentItem.name,
        price: currentItem.price,
        quantity: newQty,
      });
    }
  };

  const handleRemoveItem = (ticketTypeId: number) => {
    const item = cart.items.find((i) => i.ticketTypeId === ticketTypeId);
    if (!item) return;

    cart.setQuantity({
      ticketTypeId,
      name: item.name,
      price: item.price,
      quantity: 0,
    });
  };

  // =========================
  // Continuar a checkout (CREAR RESERVA)
  // =========================
  const handleContinue = async () => {
    if (!event) return;

    if (itemsWithDetails.length === 0) {
      alert("Tu carrito está vacío.");
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    // Validación global extra por seguridad
    if (totalQuantity > globalMax) {
      alert(
        `Solo podés comprar hasta ${globalMax} entradas en total para este evento.`
      );
      return;
    }

    try {
      setReservationError(null);
      setCreatingReservation(true);

      const payload = {
        eventId: event.id,
        items: itemsWithDetails.map((i) => ({
          ticketTypeId: i.ticketTypeId,
          quantity: i.quantity,
        })),
      };

      const res = await fetch(`${API_URL}/api/reservations`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("❌ Error creando reserva:", data);
        const msg = data.error || "No se pudo crear la reserva.";
        setReservationError(msg);
        alert(msg);
        return;
      }

      const token = data.reservation?.token;
      if (!token) {
        console.error("❌ Respuesta sin token de reserva:", data);
        const msg =
          "Error en el servidor: no se recibió token de reserva.";
        setReservationError(msg);
        alert(msg);
        return;
      }

      // Guardar token para reintentos / F5
      localStorage.setItem("reservationToken", token);

      // Redirigir a checkout profesional
      router.push(`/checkout?token=${token}`);
    } catch (err) {
      console.error("❌ Error inesperado creando reserva:", err);
      const msg = "Error inesperado al crear la reserva.";
      setReservationError(msg);
      alert(msg);
    } finally {
      setCreatingReservation(false);
    }
  };

  // =========================
  // ESTADOS VISUALES
  // =========================
  if (loadingEvent || authLoading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400 text-lg">
          Cargando tu carrito...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-red-500 text-lg">{error}</p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-red-500 text-lg">
          No se pudo cargar el evento.
        </p>
      </main>
    );
  }

  // =========================
  // UI PRINCIPAL
  // =========================
  return (
    <main className="min-h-screen bg-black text-white">
      {/* BARRA DE PROGRESO */}
      <section className="max-w-5xl mx-auto pt-10 px-4">
        <div className="flex items-center justify-center gap-8 mb-10 text-sm text-gray-400">
          {/* Paso 1: Carrito */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">
              1
            </div>
            <span>Carrito</span>
          </div>

          <div className="h-px w-12 bg-neutral-700" />

          {/* Paso 2: Checkout */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full border border-neutral-600 flex items-center justify-center text-xs">
              2
            </div>
            <span>Checkout</span>
          </div>

          <div className="h-px w-12 bg-neutral-700" />

          {/* Paso 3: Pago */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full border border-neutral-600 flex items-center justify-center text-xs">
              3
            </div>
            <span>Pago</span>
          </div>
        </div>
      </section>

      {/* CONTENIDO PRINCIPAL */}
      <section className="max-w-6xl mx-auto pb-16 px-4 grid grid-cols-1 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.1fr)] gap-8">
        {/* COLUMNA IZQUIERDA: LISTA DE ITEMS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-5 space-y-4"
        >
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">
              Entradas seleccionadas ({totalQuantity})
            </h2>
            <button
              className="text-xs text-gray-400 hover:text-gray-200"
              onClick={() => cart.clear()}
            >
              Vaciar carrito
            </button>
          </div>

          {itemsWithDetails.length === 0 ? (
            <p className="text-gray-400 text-sm">
              No tenés entradas en tu carrito. Volvé al evento para seleccionar.
            </p>
          ) : (
            itemsWithDetails.map((item) => {
              const ticket = event.ticketTypes.find(
                (t) => t.id === item.ticketTypeId
              );
              const stock = ticket?.stock ?? 0;

              const otherQty = totalQuantity - item.quantity;
              const maxByStock = stock;
              const maxByGlobal =
                globalMax === Infinity
                  ? maxByStock
                  : Math.max(0, globalMax - otherQty);

              const maxAllowed = Math.min(maxByStock, maxByGlobal);
              const canIncrease = item.quantity < maxAllowed;

              return (
                <motion.div
                  key={item.ticketTypeId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 items-center bg-neutral-900/80 rounded-xl p-4 border border-neutral-800"
                >
                  {/* Imagen */}
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0">
                    <Image
                      src={event.image || "/placeholder.jpg"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-sm">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {event.title} {event.venueName && `· ${event.venueName}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      Stock disponible: {stock} — Máx. total:{" "}
                      {globalMax === Infinity ? "sin límite" : globalMax}
                    </p>
                  </div>

                  {/* Contador + subtotal */}
                  <div className="flex flex-col items-end gap-2">
                    {/* Contador */}
                    <div className="flex items-center gap-2 bg-neutral-800 rounded-full px-3 py-1">
                      <button
                        onClick={() =>
                          handleChangeQuantity(item.ticketTypeId, "dec")
                        }
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-neutral-700 text-sm disabled:opacity-40"
                        disabled={item.quantity <= 0}
                      >
                        −
                      </button>

                      <motion.span
                        key={item.quantity}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-sm font-semibold w-5 text-center"
                      >
                        {item.quantity}
                      </motion.span>

                      <button
                        onClick={() =>
                          handleChangeQuantity(item.ticketTypeId, "inc")
                        }
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-violet-700 text-sm disabled:opacity-40"
                        disabled={!canIncrease}
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal y eliminar */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">
                        $
                        {(item.price * item.quantity).toLocaleString("es-AR")}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(item.ticketTypeId)}
                        className="text-xs text-gray-500 hover:text-red-400"
                        title="Quitar del carrito"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>

        {/* COLUMNA DERECHA: RESUMEN */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {/* Resumen */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-5 space-y-3">
            <h2 className="text-lg font-semibold mb-2">
              Resumen de la compra
            </h2>

            {reservationError && (
              <p className="text-xs text-red-400 mb-2">
                {reservationError}
              </p>
            )}

            <div className="flex justify-between text-sm text-gray-400">
              <span>Entradas ({totalQuantity})</span>
              <span>${totalAmount.toLocaleString("es-AR")}</span>
            </div>

            <div className="flex justify-between text-sm text-gray-400">
                <span>Cargos de servicio ({serviceFeePercent}%)</span>
                <span>${serviceFeeAmount.toLocaleString("es-AR")}</span>
            </div>

            <div className="border-t border-neutral-800 my-3" />

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Total</span>
              <span className="text-xl font-semibold">
                ${finalTotal.toLocaleString("es-AR")}
              </span>
            </div>

            <button
              onClick={handleContinue}
              disabled={itemsWithDetails.length === 0 || creatingReservation}
              className="mt-4 w-full bg-violet-700 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-3 text-sm font-semibold"
            >
              {creatingReservation
                ? "Creando reserva..."
                : "Continuar a pago"}
            </button>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
