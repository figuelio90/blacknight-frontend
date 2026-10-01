"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { useCartStore } from "@/app/store/cartStore";
import useAuth from "@/app/hooks/useAuth";
import { FaTrash } from "react-icons/fa";
import { useShoppingSession } from "@/app/hooks/useShoppingSession";
import SessionExpiredModal from "@/app/components/SessionExpiredModal";
import AvailabilityNotice from "@/app/components/AvailabilityNotice";
import { AvailabilityConflictError, getFunctionTicketTypes } from "@/app/lib/shoppingSessionApi";

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
  /** Real EventFunction PK from GET /api/events/:id → functionId field. */
  functionId: number | null;
  ticketTypes: TicketType[];
}


export default function CartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("eventId");
  const { user, loading: authLoading } = useAuth();
  const cart = useCartStore();
  const [resolvedEventId] = useState(
    () => cart.eventId?.toString() ?? eventIdParam
  );

  const numericEventId = resolvedEventId ? Number(resolvedEventId) : null;

  const [event, setEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartNotice, setCartNotice] = useState<string | null>(null);

  const [creatingReservation, setCreatingReservation] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [sessionExpiredOpen, setSessionExpiredOpen] = useState(false);

  // ─── ShoppingSession (BLA-87) ───────────────────────────────────────────
  const onSessionExpired = useCallback(() => {
    setSessionExpiredOpen(true);
  }, []);

  const refreshTicketTypes = useCallback(async () => {
    if (!numericEventId || !event?.functionId) return;
    const ticketTypes = await getFunctionTicketTypes(numericEventId, event.functionId);
    setEvent((previous) => previous ? { ...previous, ticketTypes } : previous);
  }, [numericEventId, event?.functionId]);

  const {
    status: sessionStatus,
    session,
    secondsRemaining,
    commitToReservation,
    availability,
    availabilityNotice,
    refreshingAvailability,
    availabilityRefreshFailed,
    refreshAvailability,
  } = useShoppingSession({
    eventId: numericEventId,
    // Pass the real EventFunction PK from GET /api/events/:id.
    // The hook stays idle until event is loaded and functionId is non-null.
    functionId: event?.functionId ?? null,
    authenticated: !authLoading && !!user,
    onExpired: onSessionExpired,
    onAvailabilityRefresh: refreshTicketTypes,
  });

  // =========================
  // Cargar evento por eventId
  // =========================
  useEffect(() => {
    if (!resolvedEventId) {
      setError("Carrito inválido: falta el ID del evento.");
      setLoadingEvent(false);
      return;
    }

    async function loadEvent() {
      try {
        setLoadingEvent(true);
        setError(null);

        const res = await fetch(`/api/events/${resolvedEventId}`, {
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
          id: Number(data.id),
          title: data.title,
          image: data.image,
          startAt: data.startAt,
          venueName: data.venueName,
          maxTicketsPerUser: data.maxTicketsPerUser ?? undefined,
          serviceFeePercent: data.serviceFeePercent ?? 0,
          // Real EventFunction PK — never assumed, always read from backend.
          functionId: data.functionId != null ? Number(data.functionId) : null,
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
  }, [resolvedEventId]);

  // Elimina tipos ausentes/inactivos y asocia de forma segura el carrito legado.
  useEffect(() => {
    if (!event) return;

    const currentCart = useCartStore.getState();
    if (
      currentCart.eventId !== null &&
      currentCart.eventId !== event.id
    ) {
      setError("El carrito pertenece a otro evento.");
      return;
    }

    const activeTicketTypeIds = event.ticketTypes
      .filter((ticket) => ticket.active)
      .map((ticket) => ticket.id);
    const activeIds = new Set(activeTicketTypeIds);
    const removedItems = currentCart.items.filter(
      (item) => !activeIds.has(item.ticketTypeId)
    );

    if (removedItems.length > 0) {
      setCartNotice(
        removedItems.length === 1
          ? "Se quitó una entrada porque ese tipo ya no está disponible."
          : `Se quitaron ${removedItems.length} tipos de entrada porque ya no están disponibles.`
      );
    }

    currentCart.reconcileCart({
      eventId: event.id,
      activeTicketTypeIds,
    });
  }, [event]);

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
        if (!ticket || !ticket.active) return null;
        return {
          ticketTypeId: item.ticketTypeId,
          quantity: item.quantity,
          name: ticket.name,
          price: ticket.price,
          stock: ticket.stock,
          description: ticket.description,
        };
      })
      .filter(Boolean) as Array<{
      ticketTypeId: number;
      quantity: number;
      name: string;
      price: number;
      stock: number;
      description?: string;
    }>;
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
  const itemsOverStock = useMemo(
    () => itemsWithDetails.filter((item) => item.quantity > item.stock),
    [itemsWithDetails]
  );
  const exceedsGlobalMax = totalQuantity > globalMax;
  const functionAvailable = availability ? Math.max(0, availability.available) : Infinity;
  const exceedsAvailability = totalQuantity > functionAvailable;
  const hasQuantityIssues = itemsOverStock.length > 0 || exceedsGlobalMax || exceedsAvailability;
  const selectionLocked = creatingReservation || refreshingAvailability;

  // =========================
  // Manejar cambios de cantidad
  // =========================
  const handleChangeQuantity = (
    ticketTypeId: number,
    direction: "inc" | "dec"
  ) => {
    const currentItem = cart.items.find((i) => i.ticketTypeId === ticketTypeId);
    if (!currentItem || !event || selectionLocked) return;

    const ticket = event.ticketTypes.find((t) => t.id === ticketTypeId);
    if (!ticket) return;

    const currentQty = currentItem.quantity;
    const otherQty = totalQuantity - currentQty;

    const maxByStock = ticket.stock;
    const maxByGlobal =
      globalMax === Infinity ? maxByStock : Math.max(0, globalMax - otherQty);

    const maxAllowed = Math.min(maxByStock, maxByGlobal, Math.max(0, functionAvailable - otherQty));

    if (direction === "dec") {
      const newQty = Math.max(0, currentQty - 1);
      cart.setQuantity({
        eventId: event.id,
        ticketTypeId,
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
        eventId: event.id,
        ticketTypeId,
        quantity: newQty,
      });
    }
  };

  const handleRemoveItem = (ticketTypeId: number) => {
    const item = cart.items.find((i) => i.ticketTypeId === ticketTypeId);
    if (!item || !event || selectionLocked) return;

    cart.setQuantity({
      eventId: event.id,
      ticketTypeId,
      quantity: 0,
    });
  };

  // =========================
  // Continuar a checkout (BLA-87: ShoppingSession → Reservation)
  // =========================
  const handleContinue = async () => {
    if (!event || selectionLocked || availabilityRefreshFailed) return;

    if (itemsWithDetails.length === 0) {
      alert("Tu carrito está vacío.");
      return;
    }

    if (hasQuantityIssues) {
      const msg =
        "Corregí las cantidades marcadas antes de continuar: superan el stock disponible o el máximo permitido por usuario.";
      setReservationError(msg);
      alert(msg);
      return;
    }

    if (!user) {
      const callbackUrl = resolvedEventId
        ? `/cart?eventId=${resolvedEventId}`
        : "/cart";
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    // ShoppingSession path (BLA-87) — the ONLY reservation path.
    // The legacy direct POST /api/reservations { eventId, items } is NOT used.
    if (!session) {
      // Session still loading or not ready (e.g., user not yet authenticated,
      // or functionId not yet resolved). Show a transient message.
      setReservationError(
        "La sesión de compra aún no está lista. Esperá un momento e intentá nuevamente."
      );
      return;
    }

    try {
      setReservationError(null);
      setCreatingReservation(true);

      const token = await commitToReservation();

      // Persist token for checkout recovery on F5 / tab close.
      localStorage.setItem("reservationToken", token);
      cart.clearCart();
      router.push(`/checkout?token=${token}`);
    } catch (err) {
      if (err instanceof AvailabilityConflictError) return;
      console.error("❌ Error al confirmar sesión de compra:", err);
      const msg =
        err instanceof Error ? err.message : "No se pudo crear la reserva.";
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
              onClick={() => cart.clearCart()}
              disabled={selectionLocked}
            >
              Vaciar carrito
            </button>
          </div>

          {cartNotice && (
            <p className="rounded-lg border border-amber-700/60 bg-amber-950/40 p-3 text-sm text-amber-200">
              {cartNotice}
            </p>
          )}

          {exceedsGlobalMax && (
            <p className="rounded-lg border border-red-700/60 bg-red-950/40 p-3 text-sm text-red-300">
              Seleccionaste {totalQuantity} entradas, pero el máximo permitido
              para este evento es {globalMax}. Reducí la cantidad para continuar.
            </p>
          )}

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

              const maxAllowed = Math.min(maxByStock, maxByGlobal, Math.max(0, functionAvailable - otherQty));
              const canIncrease = item.quantity < maxAllowed;
              const exceedsStock = item.quantity > stock;

              return (
                <motion.div
                  key={item.ticketTypeId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 items-center bg-neutral-900/80 rounded-xl p-4 border ${
                    exceedsStock ? "border-red-700" : "border-neutral-800"
                  }`}
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
                    {exceedsStock && (
                      <p className="text-xs font-medium text-red-400">
                        La cantidad seleccionada supera el stock actual. Reducila
                        a {stock} o menos para continuar.
                      </p>
                    )}
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
                        disabled={selectionLocked || item.quantity <= 0}
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
                        disabled={selectionLocked || !canIncrease}
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
                        disabled={selectionLocked}
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

            {/* Session status */}
            {user && sessionStatus === "loading" && (
              <p className="text-xs text-gray-500 animate-pulse">
                Preparando tu sesión de compra...
              </p>
            )}
            {user && sessionStatus === "active" && secondsRemaining !== null && (
              <p className={`text-xs font-medium ${
                secondsRemaining < 120 ? "text-amber-400" : "text-gray-500"
              }`}>
                ⏱ Sesión activa —{" "}
                {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, "0")} restante
              </p>
            )}
            {user && sessionStatus === "syncing" && (
              <p className="text-xs text-violet-400 animate-pulse">
                Guardando selección...
              </p>
            )}
            {user && sessionStatus === "error" && (
              <p className="text-xs text-red-400">
                No se pudo conectar con la sesión de compra. Podés continuar de
                todas formas.
              </p>
            )}

            {reservationError && (
              <p className="text-xs text-red-400 mb-2">
                {reservationError}
              </p>
            )}

            <AvailabilityNotice
              message={availabilityNotice}
              refreshing={refreshingAvailability}
              onRetry={() => { void refreshAvailability(); }}
            />
            {availability && (
              <p className={`text-xs ${exceedsAvailability ? "text-red-400" : "text-gray-400"}`}>
                Disponibles en esta función: {functionAvailable}.
                {exceedsAvailability && " Reducí la selección para continuar."}
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
              disabled={
                itemsWithDetails.length === 0 ||
                selectionLocked ||
                availabilityRefreshFailed ||
                hasQuantityIssues ||
                (!!user && sessionStatus !== "active")
              }
              className="mt-4 w-full bg-violet-700 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-3 text-sm font-semibold"
            >
              {creatingReservation
                ? "Creando reserva..."
                : "Continuar a pago"}
            </button>
          </div>
        </motion.div>
      </section>

      {/* Session expired overlay (BLA-87) */}
      <SessionExpiredModal
        open={sessionExpiredOpen}
        eventId={numericEventId}
        onGoToEvent={() => {
          setSessionExpiredOpen(false);
          if (numericEventId) router.push(`/events/${numericEventId}`);
          else router.push("/");
        }}
        onGoHome={() => {
          setSessionExpiredOpen(false);
          router.push("/");
        }}
      />
    </main>
  );
}
