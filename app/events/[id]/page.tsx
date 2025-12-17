"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import useAuth from "@/app/hooks/useAuth";
import { motion } from "framer-motion";
import { FaMapMarkerAlt, FaCalendarAlt, FaClock, FaHeart } from "react-icons/fa";
import { FaFacebook, FaInstagram, FaXTwitter, FaWhatsapp } from "react-icons/fa6";
import { MdContentCopy } from "react-icons/md";
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

  // URL para compartir
  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
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

  const orderedTickets = useMemo(() => {
    if (!event?.ticketTypes) return [];
    return [...event.ticketTypes]
      .filter((t) => t.active && t.stock > 0)
      .sort((a, b) => a.order - b.order);
  }, [event?.ticketTypes]);

  const totalSelected = useMemo(() => {
    return cart.items.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart.items]);

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

  const dateOnly = useMemo(() => {
    if (!event?.startAt) return "";
    return new Date(event.startAt).toLocaleDateString("es-AR");
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
    alert("🔗 Enlace copiado");
  };

  // === ESTADOS ===
  if (loadingEvent || authLoading)
    return (
      <p className="text-center text-gray-400 mt-10">
        Cargando información del evento...
      </p>
    );

  if (error)
    return (
      <p className="text-center text-red-500 mt-10 text-lg">{error}</p>
    );

  if (!event)
    return (
      <p className="text-center text-red-500 mt-10">
        Evento no encontrado
      </p>
    );

  // === UI PRINCIPAL ===
  const available = event.available ?? event.capacity;

  return (
    <main className="min-h-screen bg-black text-white flex flex-col justify-start pt-0">

      {/* ========== HERO ========== */}
      <section className="relative h-[70vh] w-full flex items-end justify-start overflow-hidden -mt-[96px]">
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-black via-black/80 to-transparent z-30" />

        <Image
          src={event.image || "/placeholder.jpg"}
          alt={event.title}
          fill
          className="object-cover brightness-75"
          priority
          unoptimized
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#1a0026]/90 via-[#3b0060]/40 to-transparent" />

        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className={`absolute bottom-8 right-12 z-30 px-4 py-2 rounded-full flex items-center gap-2 text-sm transition-all ${
            isFavorite ? "bg-red-600" : "bg-neutral-800"
          }`}
        >
          <FaHeart className={isFavorite ? "text-white" : "text-violet-400"} />
          {isFavorite ? "Guardado" : "Guardar"}
        </button>

        <div className="absolute bottom-12 left-12 z-10">
          <h2 className="text-5xl md:text-6xl font-bold drop-shadow-lg">
            {event.title}
          </h2>

          <p className="text-violet-300 font-medium mt-2">
            {event.venueCity || "Ubicación no especificada"} • {formattedFullDate}
          </p>
        </div>
      </section>

      {/* ========== CONTENIDO ========== */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-[1750px] mx-auto grid grid-cols-1 lg:grid-cols-[320px_minmax(1050px,1150px)_320px] gap-10 py-20 lg:px-0 px-6"
      >

        {/* === COLUMNA IZQUIERDA === */}
        <div className="space-y-6">
          <div className="bg-[#111]/90 p-6 rounded-2xl border border-violet-800/40">
            <h3 className="text-xl font-semibold mb-4 text-violet-300">
              Información del lugar
            </h3>

            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-violet-400 mt-1" />
                <div>
                  <p className="font-semibold">{event.venueName || "Sin especificar"}</p>
                  <p className="text-sm text-gray-400">
                    {event.venueAddress ? `${event.venueAddress}, ` : ""}
                    {event.venueCity} {event.venueProvince && `— ${event.venueProvince}`}
                  </p>
                  {event.venueCountry && (
                    <p className="text-xs text-gray-500 mt-1">
                      {event.venueCountry} {event.venuePostalCode && `· CP ${event.venuePostalCode}`}
                    </p>
                  )}
                </div>
              </li>

              <li className="flex items-center gap-3">
                <FaCalendarAlt className="text-violet-400" />
                <span>{dateOnly}</span>
              </li>

              <li className="flex items-center gap-3">
                <FaClock className="text-violet-400" />
                <span>{timeOnly}</span>
              </li>

              <li className="flex items-center gap-3 text-sm text-gray-400">
                <span>Capacidad: {event.capacity} · Disponibles: {available}</span>
              </li>
            </ul>

            {event.venueMapUrl && (
              <a
                href={event.venueMapUrl}
                target="_blank"
                rel="noreferrer"
                className="block mt-5 bg-violet-700 hover:bg-violet-600 text-white py-2 px-4 rounded-lg text-center"
              >
                Ver en Google Maps
              </a>
            )}
          </div>
        </div>

        {/* === COLUMNA CENTRAL — ENTRADAS === */}
        <div>
          <div className="bg-[#111]/80 border border-neutral-700 rounded-2xl p-6 space-y-5">
            <h4 className="text-2xl font-semibold">Entradas</h4>

            {/* === ACORDEÓN MULTI-TIPO === */}
            {orderedTickets.length > 0 ? (
              <>
                <div className="space-y-4 mt-6">
                  {orderedTickets.map((t) => {
                    const currentQty =
                      cart.items.find((i) => i.ticketTypeId === t.id)?.quantity || 0;

                    const reachedGlobalMax = totalSelected >= maxPerUser;
                    const reachedTypeMax = currentQty >= t.stock;

                    return (
                      <div
                        key={t.id}
                        className="border border-neutral-700 bg-neutral-900 rounded-xl p-5"
                      >
                        <details className="group">
                          <summary className="cursor-pointer flex justify-between items-center text-lg font-semibold text-violet-300">
                            <span>
                              {t.name} — ${t.price.toLocaleString("es-AR")}
                            </span>
                            <span className="text-gray-400 text-sm">
                              Stock: {t.stock}
                            </span>
                          </summary>

                          <div className="mt-4 text-gray-300 space-y-3 pl-2">
                            {t.description && (
                              <p className="text-sm text-gray-400">{t.description}</p>
                            )}

                            <div className="flex items-center gap-4 bg-neutral-800 rounded-lg p-3 w-fit">
                              <button
                                onClick={() =>
                                  cart.setQuantity({
                                    ticketTypeId: t.id,
                                    name: t.name,
                                    price: t.price,
                                    quantity: Math.max(0, currentQty - 1),
                                  })
                                }
                                disabled={currentQty <= 0}
                                className="px-3 py-1 bg-neutral-700 rounded disabled:opacity-40"
                              >
                                −
                              </button>

                              <span className="text-xl font-semibold">
                                {currentQty}
                              </span>

                              <button
                                onClick={() => {
                                  if (reachedGlobalMax) return;

                                  cart.setQuantity({
                                    ticketTypeId: t.id,
                                    name: t.name,
                                    price: t.price,
                                    quantity: currentQty + 1,
                                  });
                                }}
                                disabled={reachedGlobalMax || reachedTypeMax}
                                className="px-3 py-1 bg-neutral-700 rounded disabled:opacity-40"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </details>
                      </div>
                    );
                  })}
                </div>

                {/* BOTÓN CONTINUAR */}
                <button
                  disabled={totalSelected === 0}
                  onClick={() => {
                    if (totalSelected > maxPerUser) {
                      alert(`Solo podés comprar hasta ${maxPerUser} entradas por usuario`);
                      return;
                    }

                    router.push(`/cart?eventId=${event.id}`);
                  }}
                  className="mt-8 w-full bg-gradient-to-r from-violet-700 to-purple-500 hover:opacity-90 transition rounded-xl py-4 text-xl font-semibold disabled:opacity-40"
                >
                  Continuar
                </button>
              </>
            ) : (
              <p className="text-red-400">
                Este evento aún no tiene tipos de entrada disponibles.
              </p>
            )}
          </div>
        </div>

        {/* === COLUMNA DERECHA === */}
        <div className="space-y-6">
          {event.spotifyPlaylistUrl && (
            <div className="rounded-2xl overflow-hidden border border-violet-800/50">
              <iframe
                style={{ borderRadius: "12px" }}
                src={event.spotifyPlaylistUrl}
                width="100%"
                height="380"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </div>
          )}

          <div className="bg-neutral-900 rounded-2xl p-4 flex justify-around items-center border border-violet-800/50">
            <a
              href={`https://www.instagram.com/?url=${encodeURIComponent(
                shareUrl
              )}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-violet-400 transition"
            >
              <FaInstagram size={22} />
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                shareUrl
              )}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-violet-400 transition"
            >
              <FaFacebook size={22} />
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                shareUrl
              )}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-violet-400 transition"
            >
              <FaXTwitter size={22} />
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-violet-400 transition"
            >
              <FaWhatsapp size={22} />
            </a>

            <button
              onClick={copyLink}
              className="hover:text-violet-300 transition"
            >
              <MdContentCopy size={20} />
            </button>
          </div>
        </div>
      </motion.section>

      <footer className="bg-neutral-950 text-center text-gray-500 py-10 border-t border-neutral-800">
        <p className="text-sm">
          Importante: BlackNight no se hace responsable de la calidad del evento.
        </p>
        <p className="mt-2 text-xs text-dorado">
          © 2025 BlackNight — Todos los derechos reservados
        </p>
      </footer>
    </main>
  );
}
