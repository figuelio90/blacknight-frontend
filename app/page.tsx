"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import EventDiscovery from "./components/home/EventDiscovery";
import { normalizeEvents, type HomeEvent } from "./components/home/home-data";

export default function HomePage() {
  const [events, setEvents] = useState<HomeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadEvents() {
      try {
        const response = await fetch("/api/events", {
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("No se pudieron cargar los eventos.");
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error("La respuesta de eventos no es válida.");
        if (!controller.signal.aborted) setEvents(normalizeEvents(data));
      } catch {
        if (!controller.signal.aborted) setError("No pudimos cargar los eventos. Intentá nuevamente en unos instantes.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadEvents();
    return () => controller.abort();
  }, [request]);

  function retry() {
    setError(null);
    setLoading(true);
    setRequest((value) => value + 1);
  }

  return (
    <div className="-mt-8 min-w-0 bg-[#060609] font-sans text-neutral-100 selection:bg-violet-700 selection:text-white">
      <EventDiscovery events={events} loading={loading} error={error} onRetry={retry} />
    </div>
  );
}
