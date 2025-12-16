"use client";

import Link from "next/link";
import EventsList from "./EventsList";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/app/hooks/useAuth";

export default function EventsManagerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  // 🔐 Protección ADMIN (SIN romper nada)
  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== "ADMIN") {
      router.push("/");
    }
  }, [user, loading, router]);

  // ⏳ Mientras valida sesión
  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white p-10">
        Verificando acceso…
      </main>
    );
  }

  // 🧱 Evita render mientras redirige
  if (!user || user.role !== "ADMIN") {
    return null;
  }

  // ✅ CONTENIDO ORIGINAL (SIN CAMBIOS)
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
