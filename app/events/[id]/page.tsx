"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import useAuth from "@/app/hooks/useAuth";
import { motion } from "framer-motion";
import { FaMapMarkerAlt, FaCalendarAlt, FaClock, FaHeart } from "react-icons/fa";
import { FaFacebook, FaInstagram, FaXTwitter, FaWhatsapp } from "react-icons/fa6";
import {
  MdChevronRight,
  MdClose,
  MdConfirmationNumber,
  MdContentCopy,
  MdDirections,
  MdQrCode2,
  MdShare,
} from "react-icons/md";
import { useCartStore } from "@/app/store/cartStore";

interface TicketType {
  id: number;
  name: string;
  price: number;
  stock: number;
  color?: string;
  description?: string;
  active: boolean;
  order: number;
}

interface Event {
  id: number;
  title: string;
  startAt: string;
  description?: string;

  venueName?: string;
  venueAddress?: string;
  venuePostalCode?: string;
  venueCity?: string;
  venueProvince?: string;
  venueCountry?: string;
  venueMapUrl?: string;

  spotifyPlaylistUrl?: string;
  image?: string | null;

  capacity: number;
  maxTicketsPerUser?: number;
  status: string;

  sold?: number;
  available?: number;

  ticketTypes: TicketType[];
}
function getSpotifyEmbedUrl(url: string) {
  try {
    // Normaliza URLs tipo spotify:playlist:ID
    if (url.startsWith("spotify:")) {
      const parts = url.split(":");
      if (parts.length === 3) {
        return `https://open.spotify.com/embed/${parts[1]}/${parts[2]}`;
      }
    }

    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);

    // Espera algo como /playlist/{id}
    if (parts.length >= 2) {
      const type = parts[0]; // playlist | album | track
      const id = parts[1];
      return `https://open.spotify.com/embed/${type}/${id}`;
    }

    return url;
  } catch {
    return url;
  }
}
export default function EventDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const cart = useCartStore();

  useEffect(() => {
    console.log("🛒 Carrito actual:", cart.items);
  }, [cart.items]);

  const [event, setEvent] = useState<Event | null>(null);

  const [loadingEvent, setLoadingEvent] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFavorite, setIsFavorite] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [countdownNow, setCountdownNow] = useState(() => Date.now());

  // URL para compartir
  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, []);

  useEffect(() => {
    if (!showMapModal) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowMapModal(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showMapModal]);

  useEffect(() => {
    const updateCountdown = () => setCountdownNow(Date.now());
    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  // === FETCH DEL EVENTO ===
  useEffect(() => {
    async function loadData() {
      setLoadingEvent(true);
      setError(null);

      try {
        const res = await fetch(`/api/events/${id}`, {
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 404) setError("Evento no encontrado.");
          else if (res.status === 403)
            setError("Este evento no está disponible públicamente.");
          else setError("No se pudo cargar el evento.");

          setLoadingEvent(false);
          return;
        }

        const data = await res.json();

        const normalizedTickets: TicketType[] = (data.ticketTypes || []).map(
          (t: any, idx: number) => ({
            id: t.id,
            name: t.name,
            price: Number(t.price),
            stock: Number(t.stock),
            color: t.color || "#9333EA",
            description: t.description || "",
            active: t.active ?? true,
            order: t.order ?? idx + 1,
          })
        );

        setEvent({
          ...data,
          id: Number(data.id),
          ticketTypes: normalizedTickets,
        });
      } catch (err) {
        console.error("❌ Error al cargar evento:", err);
        setError("Error interno del servidor.");
      } finally {
        setLoadingEvent(false);
      }
    }

    loadData();
  }, [id]);

  const cartItemsForEvent = useMemo(() => {
    if (!event) return [];
    if (cart.eventId !== null && cart.eventId !== event.id) return [];

    const currentTicketTypeIds = new Set(
      event.ticketTypes.filter((ticket) => ticket.active).map((ticket) => ticket.id)
    );

    return cart.items.filter((item) =>
      currentTicketTypeIds.has(item.ticketTypeId)
    );
  }, [cart.eventId, cart.items, event]);

  const prepareCartForEvent = () => {
    if (!event || cart.items.length === 0 || cart.eventId === event.id) {
      return true;
    }

    const eventTicketTypeIds = new Set(
      event.ticketTypes.map((ticket) => ticket.id)
    );
    const activeTicketTypeIds = event.ticketTypes
      .filter((ticket) => ticket.active)
      .map((ticket) => ticket.id);

    if (
      cart.eventId === null &&
      cart.items.some((item) => eventTicketTypeIds.has(item.ticketTypeId))
    ) {
      cart.reconcileCart({ eventId: event.id, activeTicketTypeIds });
      return true;
    }

    const shouldReplace = window.confirm(
      "Tu carrito contiene entradas de otro evento. ¿Querés vaciarlo y continuar con este evento?"
    );

    if (!shouldReplace) return false;

    cart.clearCart();
    return true;
  };

  const setTicketQuantity = (ticketTypeId: number, quantity: number) => {
    if (!event || !prepareCartForEvent()) return;

    cart.setQuantity({
      eventId: event.id,
      ticketTypeId,
      quantity,
    });
  };

  const orderedTickets = useMemo(() => {
    if (!event?.ticketTypes) return [];
    return [...event.ticketTypes]
      .filter((t) => t.active && t.stock > 0)
      .sort((a, b) => a.order - b.order);
  }, [event?.ticketTypes]);

  const totalSelected = useMemo(() => {
    return cartItemsForEvent.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItemsForEvent]);

  const totalAmount = useMemo(() => {
    return cartItemsForEvent.reduce((acc, item) => {
      const ticket = event?.ticketTypes.find((t) => t.id === item.ticketTypeId);
      return acc + (ticket ? ticket.price * item.quantity : 0);
    }, 0);
  }, [cartItemsForEvent, event?.ticketTypes]);

  const maxPerUser = event?.maxTicketsPerUser ?? Infinity;

  const formattedFullDate = useMemo(() => {
    if (!event?.startAt) return "Sin fecha definida";
    const d = new Date(event.startAt);
    return d.toLocaleString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [event?.startAt]);

  const shortDate = useMemo(() => {
    if (!event?.startAt) return "Sin fecha";
    return new Date(event.startAt).toLocaleDateString("es-AR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }, [event?.startAt]);

  const eventYear = useMemo(() => {
    if (!event?.startAt) return "";
    return new Date(event.startAt).getFullYear().toString();
  }, [event?.startAt]);

  const timeOnly = useMemo(() => {
    if (!event?.startAt) return "";
    return new Date(event.startAt).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [event?.startAt]);

  const copyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // === ESTADOS DE CARGA ===
  if (loadingEvent || authLoading)
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-gray-400 text-sm animate-pulse">
          Cargando información del evento...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-red-400 text-lg">{error}</p>
      </div>
    );

  if (!event)
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-red-400">Evento no encontrado</p>
      </div>
    );

  const venueAddress = [
    event.venueAddress,
    event.venuePostalCode,
    event.venueCity,
    event.venueProvince,
    event.venueCountry,
  ]
    .filter(Boolean)
    .join(", ");
  const locationQuery = [event.venueName, venueAddress]
    .filter(Boolean)
    .join(", ");
  const hasSufficientLocation = Boolean(
    event.venueAddress ||
      (event.venueName &&
        (event.venueCity || event.venueProvince || event.venueCountry))
  );
  const mapEmbedUrl = hasSufficientLocation
    ? `https://www.google.com/maps?q=${encodeURIComponent(locationQuery)}&output=embed`
    : "";
  const directionsUrl =
    event.venueMapUrl?.trim() ||
    (hasSufficientLocation
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}`
      : "");
  const canShowMap = Boolean(mapEmbedUrl && directionsUrl);
  const venueArea = [event.venueCity, event.venueProvince]
    .filter(Boolean)
    .join(", ");
  const eventTimestamp = new Date(event.startAt).getTime();
  const hasValidEventDate = Number.isFinite(eventTimestamp);
  const countdownDifference = hasValidEventDate
    ? eventTimestamp - countdownNow
    : 0;
  const eventHasStarted = countdownDifference <= 0;
  const countdownDays = Math.floor(countdownDifference / 86_400_000);
  const countdownHours = Math.floor(
    (countdownDifference % 86_400_000) / 3_600_000
  );
  const countdownMinutes = Math.floor(
    (countdownDifference % 3_600_000) / 60_000
  );
  const countdownSeconds = Math.floor(
    (countdownDifference % 60_000) / 1000
  );
  const eventStartsToday =
    hasValidEventDate &&
    new Date(eventTimestamp).toDateString() ===
      new Date(countdownNow).toDateString();

  // === UI PRINCIPAL ===
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">

      {/* ========== HERO ========== */}
      <section
        className="relative w-full overflow-hidden -mt-[96px] flex items-end"
        style={{ height: "520px" }}
      >
        {/* Gradiente superior — fundido con el header */}
        <div className="absolute top-0 left-0 w-full h-36 bg-gradient-to-b from-black via-black/60 to-transparent z-10 pointer-events-none" />

        {/* Imagen de fondo */}
        <Image
          src={event.image || "/events/placeholder.jpg"}
          alt={event.title}
          fill
          className="object-cover brightness-[0.62]"
          priority
          unoptimized
        />

        {/* Gradiente inferior — legibilidad del texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10 pointer-events-none" />

        {/* Contenido del hero */}
        <div className="relative z-20 w-full max-w-[1440px] mx-auto px-6 lg:px-10 pb-8">

          {/* Título */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight drop-shadow-2xl mb-3 leading-none">
            {event.title}
          </h1>

          {/* Fila de info */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-200 mb-5">
            <span className="flex items-center gap-1.5">
              <FaCalendarAlt className="text-violet-400 flex-shrink-0" size={13} />
              {formattedFullDate}
            </span>
            <span className="text-gray-600 hidden sm:block">·</span>
            <span className="flex items-center gap-1.5">
              <FaClock className="text-violet-400 flex-shrink-0" size={13} />
              {timeOnly} hs
            </span>
            {event.venueName && (
              <>
                <span className="text-gray-600 hidden sm:block">·</span>
                <span className="flex items-center gap-1.5">
                  <FaMapMarkerAlt className="text-violet-400 flex-shrink-0" size={13} />
                  {event.venueName}
                  {event.venueCity ? ` – ${event.venueCity}` : ""}
                </span>
              </>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              id="btn-guardar-evento"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                isFavorite
                  ? "bg-red-600/20 border-red-500/50 text-red-400"
                  : "bg-black/50 border-neutral-600 text-white hover:border-violet-500/60 backdrop-blur-sm"
              }`}
            >
              <FaHeart
                className={isFavorite ? "text-red-400" : "text-violet-400"}
                size={13}
              />
              {isFavorite ? "Guardado" : "Guardar evento"}
            </button>

            <button
              id="btn-compartir-evento"
              onClick={copyLink}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-black/50 border border-neutral-600 text-white hover:border-violet-500/60 backdrop-blur-sm transition-all"
            >
              <MdShare size={15} />
              {copied ? "¡Enlace copiado!" : "Compartir"}
            </button>
          </div>
        </div>
      </section>

      {/* ========== CONTENIDO 2 COLUMNAS ========== */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mx-auto grid max-w-[1280px] grid-cols-1 items-start gap-6 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-8 lg:px-10"
      >
        {/* El orden del DOM define el flujo mobile: info → compra → contenido. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-start-1 lg:row-start-1">
          <div className="rounded-2xl border border-neutral-800/80 bg-[#111111] p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
              Fecha
            </p>
            <p className="text-sm font-bold capitalize text-white">{shortDate}</p>
            {eventYear && <p className="mt-1 text-xs text-gray-500">{eventYear}</p>}
          </div>

          <div className="rounded-2xl border border-neutral-800/80 bg-[#111111] p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
              Horario
            </p>
            <p className="text-sm font-bold text-white">{timeOnly} hs</p>
          </div>

          <div className="min-w-0 rounded-2xl border border-neutral-800/80 bg-[#111111] p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
              Lugar
            </p>
            <p className="truncate text-sm font-bold text-white">
              {event.venueName || event.venueAddress || "A confirmar"}
            </p>
            {venueArea && (
              <p className="mt-1 truncate text-xs text-gray-500">{venueArea}</p>
            )}
          </div>
        </div>

        {/* ===== COMPRA: segundo bloque en mobile, sidebar en desktop ===== */}
        <aside className="lg:col-start-2 lg:row-start-1 lg:row-span-2">
          <div className="space-y-4 lg:sticky lg:top-24">
            {hasValidEventDate && (
              <div className="rounded-2xl border border-neutral-800/80 bg-[#111111] p-4">
                {eventHasStarted ? (
                  <div className="flex items-center gap-3">
                    <FaClock className="text-violet-400" size={16} />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
                        Estado del evento
                      </p>
                      <p className="mt-1 text-sm font-bold text-white">
                        El evento ya comenzó
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-300">
                        Faltan
                      </p>
                      {eventStartsToday && (
                        <span className="rounded-full bg-violet-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-300">
                          Es hoy
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        [countdownDays, "Días"],
                        [countdownHours, "Hs"],
                        [countdownMinutes, "Min"],
                        [countdownSeconds, "Seg"],
                      ].map(([value, label]) => (
                        <div
                          key={label}
                          className="rounded-xl border border-neutral-800 bg-[#181818] px-2 py-2.5 text-center"
                        >
                          <p className="text-lg font-black tabular-nums text-white">
                            {String(value).padStart(2, "0")}
                          </p>
                          <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-600">
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-neutral-800/80 bg-[#111111]">
              <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white">
                    <MdConfirmationNumber size={19} />
                  </span>
                  <div>
                    <h2 className="font-bold text-white">Entradas</h2>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                      Seleccioná tu sector
                    </p>
                  </div>
                </div>
                {totalSelected > 0 && (
                  <span className="rounded-full bg-violet-500/15 px-2.5 py-1 text-xs font-bold text-violet-300">
                    {totalSelected}
                  </span>
                )}
              </div>

              <div className="space-y-2 p-4">
                {orderedTickets.length > 0 ? (
                  orderedTickets.map((t) => {
                    const currentQty =
                      cartItemsForEvent.find((i) => i.ticketTypeId === t.id)
                        ?.quantity || 0;
                    const reachedGlobalMax = totalSelected >= maxPerUser;
                    const reachedTypeMax = currentQty >= t.stock;
                    const isSelected = currentQty > 0;
                    const isLowStock = t.stock <= 10;

                    return (
                      <div
                        key={t.id}
                        className={`rounded-xl border p-3 transition-colors ${
                          isSelected
                            ? "border-violet-500/70 bg-violet-950/35"
                            : "border-neutral-800 bg-[#171717] hover:border-neutral-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`h-3 w-3 flex-shrink-0 rounded-full border-2 ${
                              isSelected
                                ? "border-violet-300 ring-4 ring-violet-500/15"
                                : "border-neutral-600"
                            }`}
                            style={
                              isSelected
                                ? { backgroundColor: t.color || "#7C3AED" }
                                : undefined
                            }
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-white">{t.name}</p>
                            <p
                              className={`mt-0.5 text-[11px] font-medium ${
                                isLowStock ? "text-amber-400" : "text-gray-500"
                              }`}
                            >
                              {isLowStock
                                ? `¡Quedan ${t.stock}!`
                                : `${t.stock} disponibles`}
                            </p>
                          </div>
                          <p className="flex-shrink-0 text-sm font-black text-white">
                            ${t.price.toLocaleString("es-AR")}
                          </p>
                        </div>

                        {t.description && (
                          <p className="mt-2 text-xs leading-relaxed text-gray-500">
                            {t.description}
                          </p>
                        )}

                        <div className="mt-3 flex items-center justify-end border-t border-neutral-800/80 pt-3">
                          {isSelected ? (
                            <div className="flex items-center gap-2">
                              <button
                                id={`btn-minus-ticket-${t.id}`}
                                type="button"
                                onClick={() =>
                                  setTicketQuantity(t.id, Math.max(0, currentQty - 1))
                                }
                                disabled={currentQty <= 0}
                                aria-label={`Quitar una entrada ${t.name}`}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800 font-bold text-gray-200 transition-colors hover:border-violet-500 hover:text-white disabled:opacity-30"
                              >
                                −
                              </button>
                              <span className="w-7 text-center text-sm font-black tabular-nums text-white">
                                {currentQty}
                              </span>
                              <button
                                id={`btn-plus-ticket-${t.id}`}
                                type="button"
                                onClick={() => {
                                  if (reachedGlobalMax) return;
                                  setTicketQuantity(t.id, currentQty + 1);
                                }}
                                disabled={reachedGlobalMax || reachedTypeMax}
                                aria-label={`Agregar una entrada ${t.name}`}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 font-bold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              id={`btn-plus-ticket-${t.id}`}
                              type="button"
                              onClick={() => {
                                if (reachedGlobalMax) return;
                                setTicketQuantity(t.id, 1);
                              }}
                              disabled={reachedGlobalMax || reachedTypeMax}
                              className="rounded-lg border border-violet-500/50 px-3 py-1.5 text-xs font-bold text-violet-300 transition-colors hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              Agregar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-4 text-center text-sm text-red-400">
                    Este evento aún no tiene tipos de entrada disponibles.
                  </p>
                )}
              </div>

              <div className="border-t border-neutral-800 px-5 py-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Resumen de compra</h3>
                  {totalSelected > 0 && (
                    <span className="text-xs text-gray-500">
                      {totalSelected} {totalSelected === 1 ? "entrada" : "entradas"}
                    </span>
                  )}
                </div>

                {totalSelected === 0 ? (
                  <p className="mb-4 rounded-xl bg-neutral-900/70 px-3 py-4 text-center text-xs leading-relaxed text-gray-600">
                    Seleccioná tus entradas para ver el resumen.
                  </p>
                ) : (
                  <div className="mb-4 space-y-3">
                    {cartItemsForEvent.map((item) => {
                      const ticket = event.ticketTypes.find(
                        (t) => t.id === item.ticketTypeId
                      );
                      if (!ticket) return null;
                      return (
                        <div
                          key={item.ticketTypeId}
                          className="flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {ticket.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.quantity} × ${ticket.price.toLocaleString("es-AR")}
                            </p>
                          </div>
                          <span className="flex-shrink-0 text-sm font-semibold text-white">
                            ${(item.quantity * ticket.price).toLocaleString("es-AR")}
                          </span>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between border-t border-neutral-800 pt-4">
                      <span className="text-sm font-bold text-white">Total</span>
                      <span className="text-xl font-black text-violet-300">
                        ${totalAmount.toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  id="btn-continuar-pago"
                  disabled={totalSelected === 0}
                  onClick={() => {
                    if (totalSelected > maxPerUser) {
                      alert(
                        `Solo podés comprar hasta ${maxPerUser} entradas por usuario`
                      );
                      return;
                    }
                    if (!prepareCartForEvent()) return;
                    router.push(`/cart?eventId=${event.id}`);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continuar al pago
                  {totalSelected > 0 && ` · $${totalAmount.toLocaleString("es-AR")}`}
                </button>
                <p className="mt-3 text-center text-[11px] text-gray-600">
                  Pago protegido y compra segura
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-neutral-800/80 bg-[#111111] p-4">
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                <MdQrCode2 size={27} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">Tu entrada, en tu bolsillo</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  Después de comprar vas a encontrar tu entrada y QR en tu perfil.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800/80 bg-[#111111] p-5">
              <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                ¿Por qué elegir BlackNight?
              </h3>
              <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                {[
                  "Entradas 100% oficiales",
                  "Pago protegido y seguro",
                  "Soporte antes, durante y después del evento",
                  "Tus entradas siempre disponibles en tu perfil",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-violet-900/60 text-[9px] font-bold text-violet-300">
                      ✓
                    </span>
                    <span className="text-xs leading-relaxed text-gray-400">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* ===== CONTENIDO PRINCIPAL: después de compra en mobile ===== */}
        <div className="min-w-0 space-y-8 lg:col-start-1 lg:row-start-2">
          <div>
            {event.description && (
              <section>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  Sobre el evento
                </h2>
                <div className="mb-5 mt-3 h-1 w-10 rounded-full bg-violet-500" />
                <div
                  className={`overflow-hidden whitespace-pre-line text-[15px] leading-7 text-gray-400 transition-all duration-300 ${
                    showFullDesc ? "max-h-[2000px]" : "max-h-[168px]"
                  }`}
                >
                  {event.description}
                </div>
                <button
                  type="button"
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  className="mt-3 text-sm font-semibold text-violet-400 transition-colors hover:text-violet-300"
                >
                  {showFullDesc ? "Ver menos" : "Ver más"}
                </button>
              </section>
            )}

            <div className={event.description ? "mt-6 border-t border-neutral-900 pt-5" : ""}>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-600">
                Compartir evento
              </p>
              <div className="flex flex-wrap items-center gap-5">
                <a
                  href={`https://www.instagram.com/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Compartir en Instagram"
                  className="text-gray-500 transition-colors hover:text-violet-400"
                >
                  <FaInstagram size={19} />
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Compartir en Facebook"
                  className="text-gray-500 transition-colors hover:text-violet-400"
                >
                  <FaFacebook size={19} />
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Compartir en X"
                  className="text-gray-500 transition-colors hover:text-violet-400"
                >
                  <FaXTwitter size={19} />
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Compartir en WhatsApp"
                  className="text-gray-500 transition-colors hover:text-violet-400"
                >
                  <FaWhatsapp size={19} />
                </a>
                <button
                  id="btn-copiar-enlace"
                  type="button"
                  onClick={copyLink}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-500 transition-colors hover:text-violet-400"
                >
                  <MdContentCopy size={18} />
                  {copied ? "¡Copiado!" : "Copiar enlace"}
                </button>
              </div>
            </div>
          </div>

          {event.spotifyPlaylistUrl && (
            <section>
              <div className="mb-3 flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#1DB954] shadow-[0_0_12px_rgba(29,185,84,0.45)]" />
                <h2 className="text-lg font-bold text-white">Escuchá el setlist</h2>
              </div>
              <div className="rounded-2xl border border-neutral-800/80 bg-[#111111] p-2">
                <iframe
                  title={`Spotify de ${event.title}`}
                  className="block w-full"
                  style={{ borderRadius: "12px" }}
                  src={getSpotifyEmbedUrl(event.spotifyPlaylistUrl)}
                  width="100%"
                  height="352"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
              </div>
            </section>
          )}

          {canShowMap && (
            <section>
              <div className="mb-4">
                <h2 className="text-2xl font-black tracking-tight text-white">
                  ¿Cómo llegar?
                </h2>
                <p className="mt-2 text-sm font-semibold text-gray-300">
                  {event.venueName || "Ubicación del evento"}
                </p>
                {venueAddress && (
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">
                    {venueAddress}
                  </p>
                )}
              </div>

              <div className="overflow-hidden rounded-2xl border border-neutral-800/80 bg-[#111111]">
                <div className="h-64 w-full bg-neutral-950 sm:h-80">
                  <iframe
                    title={`Vista previa del mapa de ${event.venueName || "la ubicación del evento"}`}
                    src={mapEmbedUrl}
                    className="h-full w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="p-4">
                  <button
                    type="button"
                    onClick={() => setShowMapModal(true)}
                    className="group flex w-full items-center justify-between rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm font-bold text-gray-100 transition-colors hover:border-violet-500/70 hover:bg-violet-950/40 hover:text-white sm:w-auto sm:min-w-48"
                  >
                    <span className="flex items-center gap-2.5">
                      <FaMapMarkerAlt className="text-violet-400" size={15} />
                      Ver mapa
                    </span>
                    <MdChevronRight
                      className="text-gray-300 transition-transform group-hover:translate-x-0.5"
                      size={20}
                    />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* TODO: sponsors, galería y reseñas cuando existan datos reales. */}
        </div>
      </motion.section>

      {showMapModal && canShowMap && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowMapModal(false);
          }}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-map-title"
            className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-y-auto rounded-2xl border border-violet-500/30 bg-[#111111] shadow-2xl shadow-violet-950/40 sm:max-h-[calc(100vh-3rem)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-neutral-800 px-5 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <p
                  id="event-map-title"
                  className="truncate text-lg font-bold text-white sm:text-xl"
                >
                  {event.venueName || "Ubicación del evento"}
                </p>
                {venueAddress && (
                  <p className="mt-1 text-sm leading-relaxed text-gray-400">
                    {venueAddress}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                aria-label="Cerrar mapa"
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 text-gray-300 transition-colors hover:border-violet-500/70 hover:bg-violet-950/50 hover:text-white"
              >
                <MdClose size={22} />
              </button>
            </div>

            <div className="h-[50vh] min-h-[280px] w-full bg-neutral-950 sm:h-[480px]">
              <iframe
                title={`Mapa de ${event.venueName || "la ubicación del evento"}`}
                src={mapEmbedUrl}
                className="h-full w-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="flex justify-end border-t border-neutral-800 px-5 py-4 sm:px-6">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-violet-500 sm:w-auto"
              >
                <MdDirections size={19} />
                Cómo llegar
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

