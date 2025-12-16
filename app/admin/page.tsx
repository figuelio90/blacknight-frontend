"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/app/hooks/useAuth";

export default function AdminHome() {
  const { user, loading } = useAuth();
  const router = useRouter();

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

  if (loading) {
    return <div className="p-10 text-white">Verificando acceso…</div>;
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold mb-4">
        Panel Admin — BlackNight
      </h1>

      <p className="text-gray-400">
        Bienvenido {user.firstName} 👑  
        Gestioná eventos, ventas y tickets desde un solo lugar.
      </p>

      <div className="mt-8">
        <Link
          href="/admin/events-manager"
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold inline-block"
        >
          Administrar Eventos
        </Link>
      </div>
    </div>
  );
}
