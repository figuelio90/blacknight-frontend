"use client";

import Link from "next/link";
import EventsList from "./EventsList";   // 👈 IMPORTANTE
import { useState } from "react";

export default function EventsManagerPage() {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold">Gestor de eventos</h1>

        <Link
          href="/admin/events-manager/create"
          className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition"
        >
          + Crear nuevo evento
        </Link>
      </div>

      {/* 🔍 Buscador */}
      <input
        type="text"
        placeholder="Buscar eventos..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="bg-neutral-900 border border-neutral-700 px-4 py-2 rounded-lg mb-6 w-full max-w-md"
      />

      {/* ⭐ LISTA DE EVENTOS */}
      <EventsList filter={filter} query={query} />
    </main>
  );
}
