"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import useAuth from "../hooks/useAuth";
import { useEffect, useState } from "react";

interface Registration {
  id: number;
  quantity: number;
  event: {
    id: number;
    title: string;
    city: string;
    startAt: string;
  };
}

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  useEffect(() => {
    if (loading) return; // ✅ Esperar
    if (!user) {
      router.push("/login");
      return;
    }

    async function fetchRegs() {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/api/registrations/mine", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setRegistrations(Array.isArray(data) ? data : []);
    }

    fetchRegs();
  }, [loading, user, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>⏳ Cargando perfil...</p>
      </main>
    );
  }

  if (!user) return null; // ✅ No redirigir 2 veces

  return (
    <main className="min-h-screen bg-black text-white px-6 py-28">
      <div className="max-w-2xl mx-auto bg-neutral-900 rounded-2xl p-6 border border-neutral-800 shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <Image
            src={user.avatar || "/placeholder.jpg"}
            width={70}
            height={70}
            alt="avatar"
            className="rounded-full"
          />
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-blue-400">{user.email}</p>
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-4">🎟️ Tus Entradas</h3>

        {registrations.length === 0 ? (
          <p className="text-gray-400 text-sm">No tenés entradas aún 😢</p>
        ) : (
          <ul className="space-y-4">
            {registrations.map((reg) => (
              <li
                key={reg.id}
                className="bg-neutral-800 rounded-lg p-4 border border-neutral-700"
              >
                <p className="font-medium">{reg.event.title}</p>
                <p className="text-gray-400 text-sm">
                  {reg.event.city} —{" "}
                  {new Date(reg.event.startAt).toLocaleDateString("es-AR")}
                </p>
                <p className="text-blue-400 font-semibold mt-1">
                  Cantidad: {reg.quantity}
                </p>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={logout}
          className="mt-6 w-full bg-red-600 hover:bg-red-700 py-3 rounded-xl font-semibold"
        >
          🚪 Cerrar sesión
        </button>
      </div>
    </main>
  );
}
