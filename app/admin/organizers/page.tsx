"use client";

import { useEffect, useState } from "react";

export default function AdminOrganizersPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      const res = await fetch("http://localhost:3001/api/organizers/all", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <p className="text-center mt-10">Cargando...</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-6">Solicitudes de Organizadores</h1>

      <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-700 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-700 text-neutral-400">
              <th className="py-2">Nombre</th>
              <th className="py-2">Email</th>
              <th className="py-2">Teléfono</th>
              <th className="py-2">Empresa</th>
              <th className="py-2">Fecha</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item: any) => (
              <tr
                key={item.id}
                className="border-b border-neutral-800 hover:bg-neutral-800/40 transition"
              >
                <td className="py-3">{item.name}</td>
                <td>{item.email}</td>
                <td>{item.phone}</td>
                <td>{item.company || "-"}</td>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
