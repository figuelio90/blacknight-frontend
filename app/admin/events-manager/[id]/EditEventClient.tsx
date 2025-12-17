"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import useAuth from "@/app/hooks/useAuth";
import EventTabs from "./components/EventTabs";
import EventPreview from "./components/EventPreview";
import EventInfoForm from "./components/EventInfoForm";
import EventScheduleForm from "./components/EventScheduleForm";
import EventLocationForm from "./components/EventLocationForm";
import TicketTypesEditor from "./components/TicketTypesEditor";

interface TicketType {
  id?: number;
  name: string;
  price: number;
  stock: number;
  color?: string;
  description?: string;
  active: boolean;
  order?: number;
}

interface EventData {
  id: number;
  title: string;
  startAt: string;
  capacity: number;
  image?: string;
  featured: boolean;
  status: string;

  venueName?: string;
  venueAddress?: string;
  venuePostalCode?: string;
  venueCity?: string;
  venueProvince?: string;
  venueCountry?: string;
  venueMapUrl?: string;

  shortDescription?: string;
  longDescription?: string;

  openingTime?: string;
  endingTime?: string;

  spotifyPlaylistUrl?: string;
  maxTicketsPerUser?: number;

  ticketTypes: TicketType[];
}

export default function EditEventClient({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [event, setEvent] = useState<EventData | null>(null);
  const [selectedTab, setSelectedTab] = useState("info");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== "ADMIN") {
      router.push("/");
    }
  }, [user, authLoading, router]);
  // ======================================================
  // 🔥 Cargar evento
  // ======================================================
  useEffect(() => {
    if (authLoading || !user || user.role !== "ADMIN") return;
    async function loadEvent() {
      try {
        console.log("EVENT ID:", eventId);
        const res = await fetch(`/api/events/${eventId}`, {
          method: "GET",
          credentials: "include",
        });
        if (res.status === 403) {
          setError("No tenés permiso para ver este evento.");
          return;
        }

        if (res.status === 404) {
          setError("Evento no encontrado.");
          setLoading(false);
          return;
        }

        if (!res.ok) {
          setError("Error al cargar el evento.");
          setLoading(false);
          return;
        }

        const data = await res.json();

        // Normalizar fecha para input datetime-local
        const startAt = new Date(data.startAt).toISOString().slice(0, 16);

        const normalizedTypes = (data.ticketTypes || []).map(
          (tt: any, idx: number) => ({
            id: tt.id,
            name: tt.name,
            price: tt.price,
            stock: tt.stock,
            color: tt.color || "#9333EA",
            description: tt.description || "",
            active: tt.active ?? true,
            order: tt.order ?? idx + 1,
          })
        );

        setEvent({
          ...data,
          startAt,
          ticketTypes: normalizedTypes,
        });
      } catch (e) {
        console.error(e);
        setError("Error de servidor.");
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [eventId, authLoading, user]);

  // ======================================================
  // 🔥 Guardar evento (PUT)
  // ======================================================
  async function updateEvent() {
    if (!event) return;

    setSaving(true);
    setError("");

    const clean = (v: any) =>
      v === "" || v === null || v === undefined ? undefined : v;

    const payload: any = {
      title: clean(event.title),
      startAt: event.startAt, // <-- FIX: NO cortar ni transformar
      capacity: clean(event.capacity),
      image: clean(event.image),
      featured: clean(event.featured),
      status: clean(event.status),

      shortDescription: clean(event.shortDescription),
      longDescription: clean(event.longDescription),

      // Horarios sin slice()
      openingTime: clean(event.openingTime),
      endingTime: clean(event.endingTime),

      venueName: clean(event.venueName),
      venueAddress: clean(event.venueAddress),
      venuePostalCode: clean(event.venuePostalCode),
      venueCity: clean(event.venueCity),
      venueProvince: clean(event.venueProvince),
      venueCountry: clean(event.venueCountry),
      venueMapUrl: clean(event.venueMapUrl),

      spotifyPlaylistUrl: clean(event.spotifyPlaylistUrl),
      maxTicketsPerUser: clean(event.maxTicketsPerUser),

      ticketTypes: event.ticketTypes.map((t, index) => ({
        id: t.id,
        name: t.name.trim(),
        price: Number(t.price),
        stock: Number(t.stock),
        color: t.color ?? "#9333EA",
        description: t.description ?? "",
        active: t.active ?? true,
        order: t.order ?? index + 1,
      })),
    };

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 403) {
        setError("No tenés permiso para modificar este evento.");
        setSaving(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "No se pudo guardar los cambios.");
        setSaving(false);
        return;
      }
    } catch (err) {
      console.error(err);
      setError("Error interno al guardar.");
      setSaving(false);
      return;
    }

    setSaving(false);
  }

  // ======================================================
  // 🔥 Cambiar estado
  // ======================================================
  async function changeStatus(status: string) {
    setSaving(true);

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.status === 403) {
        setError("No tenés permiso para cambiar el estado.");
        setSaving(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al cambiar estado");
        setSaving(false);
        return;
      }

      setEvent((prev) => (prev ? { ...prev, status } : prev));
    } catch (err) {
      setError("Error al cambiar estado del evento.");
    }

    setSaving(false);
  }

  // ======================================================
  // 🔥 Eliminar evento
  // ======================================================
  async function deleteEvent() {
    if (!confirm("¿Seguro que querés eliminar este evento?")) return;

    const res = await fetch(`/api/events/${eventId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.status === 403) {
      setError("No tenés permiso para eliminar este evento.");
      return;
    }

    router.push("/admin/events-manager");
  }

  // ======================================================
  // UI
  // ======================================================
  if (authLoading || loading) {
    return <p className="text-white p-10">Verificando acceso...</p>;
  }
  if (!event) return <p className="text-white p-10">Evento no encontrado.</p>;

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-3xl font-bold mb-6">Editar Evento — #{event.id}</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_350px] gap-8">
        <EventTabs selected={selectedTab} onSelect={setSelectedTab} />

        <div className="space-y-6 bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
          {selectedTab === "info" && (
            <EventInfoForm event={event} setEvent={setEvent} />
          )}

          {selectedTab === "tickets" && (
            <TicketTypesEditor event={event} setEvent={setEvent} />
          )}

          {selectedTab === "location" && (
            <EventLocationForm event={event} setEvent={setEvent} />
          )}

          {selectedTab === "schedule" && (
            <EventScheduleForm event={event} setEvent={setEvent} />
          )}

          {/* BOTONERA */}
          <div className="pt-6 border-t border-neutral-800 space-y-3">
            <div className="flex gap-3">
              {event.status !== "published" && (
                <button
                  onClick={() => changeStatus("published")}
                  className="px-4 py-2 bg-green-600 rounded-lg"
                >
                  Publicar
                </button>
              )}

              {event.status !== "draft" && (
                <button
                  onClick={() => changeStatus("draft")}
                  className="px-4 py-2 bg-yellow-600 rounded-lg"
                >
                  Pasar a borrador
                </button>
              )}

              {event.status !== "cancelled" && (
                <button
                  onClick={() => changeStatus("cancelled")}
                  className="px-4 py-2 bg-red-600 rounded-lg"
                >
                  Cancelar evento
                </button>
              )}
            </div>

            <button
              onClick={updateEvent}
              className="w-full bg-purple-600 py-3 rounded-lg"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>

            <button
              onClick={deleteEvent}
              className="w-full bg-red-700 py-3 rounded-lg"
            >
              Eliminar evento
            </button>
          </div>
        </div>

        <EventPreview event={event} />
      </div>
    </main>
  );
}
