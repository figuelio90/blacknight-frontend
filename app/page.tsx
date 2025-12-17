"use client";
export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

interface Event {
  id: number;
  title: string;
  startAt: string;
  image?: string | null;
  featured?: boolean;
  venueCity?: string | null;
  ticketTypes?: { price: number }[];
  status: string;
}

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // API base correcta
  
  // ======================
  // 🔥 Cargar eventos publicados
  // ======================
  useEffect(() => {
  async function loadEvents() {
    try {
      const res = await fetch("/api/events", {
        credentials: "include",
      });

      if (!res.ok) {
        setEvents([]);
        return;
      }

      const data = await res.json();

      const publishedEvents = Array.isArray(data)
        ? data.filter((ev) => ev.status === "published")
        : [];

      setEvents(publishedEvents);
    } catch (err) {
      console.error("❌ Error cargando eventos:", err);
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }

  loadEvents();
}, []);

  // ======================
  // ⭐ Destacados
  // ======================
  const featuredEvents = useMemo(() => {
    return Array.isArray(events)
      ? events.filter((ev) => ev.featured === true)
      : [];
  }, [events]);

  // ======================
  // 🔍 Filtrado de búsqueda + ciudad
  // ======================
  const filteredEvents = useMemo(() => {
    const s = search.toLowerCase();

    return events.filter((ev) => {
      const titleMatch = ev.title.toLowerCase().includes(s);
      const cityMatch = (ev.venueCity || "").toLowerCase().includes(s);

      const filterMatch =
        filter === "Todos" ||
        (ev.venueCity || "").toLowerCase() === filter.toLowerCase();

      return (titleMatch || cityMatch) && filterMatch;
    });
  }, [events, search, filter]);

  const getMinPrice = (event: Event) =>
    event.ticketTypes?.length
      ? Math.min(...event.ticketTypes.map((t) => t.price)) / 100
      : null;

  // ==========================================
  // 🔥 UI PRINCIPAL
  // ==========================================
  return (
    <main className="min-h-screen bg-black text-white">

      {/* HERO */}
      <section className="text-center py-28 px-4 mt-20 relative">
        <div className="absolute inset-0 bg-[url('/events/logo_black_night.jpeg')] bg-cover opacity-10"></div>

        <h2 className="text-4xl font-bold mb-4">
          Los mejores eventos, en un solo lugar.
        </h2>

        <p className="text-gray-400 text-lg">
          Descubrí, reservá y disfrutá 🎫
        </p>
      </section>

      {/* DESTACADOS */}
      {featuredEvents.length > 0 && (
        <section className="px-10 mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">
            ⭐ Eventos Destacados
          </h2>

          <Swiper
            spaceBetween={30}
            slidesPerView={1}
            loop
            autoplay={{ delay: 3000 }}
            pagination={{ clickable: true }}
            modules={[Autoplay, Pagination]}
            speed={900}
          >
            {featuredEvents.map((ev) => (
              <SwiperSlide key={ev.id}>
                <Image
                  src={ev.image || "/placeholder.jpg"}
                  alt={ev.title}
                  width={1200}
                  height={500}
                  className="rounded-xl object-cover w-full h-[500px]"
                  onError={(e) => (e.currentTarget.src = "/placeholder.jpg")}
                />

                <div className="text-center mt-2">
                  <Link href={`/events/${ev.id}`} className="text-blue-400 underline">
                    Ver más
                  </Link>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      )}

      {/* BUSCADOR */}
      <section className="flex flex-col md:flex-row justify-between px-10 gap-4 mb-10">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar evento..."
          className="bg-neutral-900 border border-neutral-700 px-4 py-2 rounded-lg w-full md:w-1/3"
        />

        <div className="flex gap-2">
          {["Todos", "Córdoba", "Buenos Aires", "Jujuy"].map((city) => (
            <button
              key={city}
              onClick={() => setFilter(city)}
              className={`px-4 py-2 border rounded-lg ${
                filter === city ? "bg-blue-600" : "border-neutral-700"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </section>

      {/* LISTADO */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 px-10 pb-20 gap-10">
        {loadingEvents ? (
          <p className="col-span-full text-center text-gray-400">
            Cargando eventos...
          </p>
        ) : filteredEvents.length ? (
          filteredEvents.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-neutral-900 rounded-2xl p-4 hover:scale-[1.02] transition"
            >
              <Image
                src={event.image || "/placeholder.jpg"}
                alt={event.title}
                width={400}
                height={200}
                className="rounded-lg object-cover w-full h-[200px]"
                onError={(e) => (e.currentTarget.src = "/placeholder.jpg")}
              />

              <p className="text-lg mt-2 font-semibold">{event.title}</p>

              {getMinPrice(event) ? (
                <p className="text-purple-400 text-sm">
                  Desde ${getMinPrice(event)}
                </p>
              ) : (
                <p className="text-gray-400 text-sm">Entradas próximamente</p>
              )}

              <p className="text-gray-400 text-sm">
                {event.venueCity || "Sin ciudad"}
              </p>

              <Link
                href={`/events/${event.id}`}
                className="text-blue-400 text-sm underline"
              >
                Ver más
              </Link>
            </motion.div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">
            No se encontraron eventos
          </p>
        )}
      </section>
    </main>
  );
}
