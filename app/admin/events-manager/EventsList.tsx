"use client";

import { useEffect, useState } from "react";
import Link from "next/link";


interface Props {
  filter: string;
  query: string;
}

export default function EventsList({ filter, query }: Props) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/events`, {
          credentials: "include",
        });

        // 🔒 No autorizado / no admin
        if (res.status === 401 || res.status === 403) {
          setEvents([]);
          return;
        }

        if (!res.ok) {
          return;
        }

        const data = await res.json();
        setEvents(data || []);
      } catch {
        // error de red → no romper UI
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <p className="text-gray-400">Cargando eventos...</p>;

  // ============================================================
  // ⭐ FILTRO POR TEXTO
  // ============================================================
  let filtered = events.filter((ev) =>
    ev.title.toLowerCase().includes(query.toLowerCase())
  );

  // ============================================================
  // ⭐ FILTRO POR ESTADO / FEATURED
  // ============================================================
  if (filter !== "all") {
    filtered = filtered.filter((ev) => {
      if (filter === "featured") return ev.featured === true;
      if (filter === "published") return ev.status === "published";
      if (filter === "draft") return ev.status === "draft";
      if (filter === "cancelled") return ev.status === "cancelled";
      return true;
    });
  }

  if (filtered.length === 0)
    return (
      <p className="text-gray-500 text-sm">
        No hay eventos que coincidan con el filtro.
      </p>
    );

  // ============================================================
  // ⭐ RENDER DE CARDS
  // ============================================================
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filtered.map((ev) => {
        const minPrice =
          ev.ticketTypes?.length > 0
            ? Math.min(...ev.ticketTypes.map((t: any) => t.price)) / 100
            : null;

        return (
          <Link
            key={ev.id}
            href={`/admin/events-manager/${ev.id}`}
            className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-purple-600 transition group"
          >
            {/* Imagen */}
            <div className="w-full h-40 bg-neutral-800 border-b border-neutral-700 overflow-hidden">
              {ev.image ? (
                <img
                  src={ev.image}
                  alt={ev.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-500">
                  Sin imagen
                </div>
              )}
            </div>

            {/* Contenido */}
            <div className="p-4 space-y-2">
              <h3 className="text-xl font-bold text-white">{ev.title}</h3>

              <p className="text-gray-400 text-sm">
                {new Date(ev.startAt).toLocaleString("es-AR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>

              <p className="text-gray-500 text-sm">
                {ev.venueCity || "Ciudad no definida"}
              </p>

              {minPrice !== null && (
                <p className="text-purple-400 text-sm font-semibold">
                  Desde ${minPrice}
                </p>
              )}

              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  ev.status === "published"
                    ? "bg-green-700 text-white"
                    : ev.status === "draft"
                    ? "bg-yellow-700 text-white"
                    : "bg-red-700 text-white"
                }`}
              >
                {ev.status}
              </span>

              {ev.featured && (
                <span className="ml-2 px-2 py-1 text-xs bg-purple-700 text-white rounded">
                  ★ Destacado
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
