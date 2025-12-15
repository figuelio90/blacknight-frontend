"use client";

import { FormEvent, useState } from "react";

export default function OrganizadoresPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const data = {
        name: formData.get("name"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        confirmEmail: formData.get("confirmEmail"),
        company: formData.get("company"),
        cuit: formData.get("cuit"),
        message: formData.get("message"),
      };

      console.log("📨 Enviando datos al backend:", data);

      const res = await fetch("http://localhost:3001/api/organizers/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Error en el servidor");

      setSuccess("Solicitud enviada correctamente ✔ Te contactaremos pronto.");
    } catch (err) {
      console.error("❌ Error enviando formulario:", err);
      setError("No se pudo enviar. Intentalo nuevamente.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HERO estilo EntradaUno */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Tecnología e innovación para tus eventos.
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mb-8">
          Trabajá con BlackNight para potenciar la venta de tus entradas con
          seguridad, estadísticas en tiempo real y una experiencia moderna para tus clientes.
        </p>

        {/* BOTÓN BLACKNIGHT */}
        <a
          href="#contacto"
          className="inline-block bg-[#8B5CF6] hover:bg-[#A78BFA] transition text-black 
          font-semibold px-6 py-3 rounded-lg shadow-lg"
        >
          Contactanos ahora
        </a>
      </section>

      {/* FORMULARIO */}
      <section id="contacto" className="px-6 pb-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">
          Comenzá a potenciar tu negocio
        </h2>
        <p className="text-gray-300 mb-6">
          Envíanos tus datos y te contactamos a la brevedad.
        </p>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 md:grid-cols-2 bg-neutral-900 p-6 rounded-xl"
        >
          <input
            name="name"
            required
            placeholder="Tu Nombre*"
            className="bg-black border border-gray-700 rounded px-3 py-2"
          />

          <input
            name="phone"
            required
            placeholder="Tu Teléfono*"
            className="bg-black border border-gray-700 rounded px-3 py-2"
          />

          <input
            name="email"
            type="email"
            required
            placeholder="Tu Email*"
            className="bg-black border border-gray-700 rounded px-3 py-2"
          />

          <input
            name="confirmEmail"
            type="email"
            required
            placeholder="Confirmar Tu Email*"
            className="bg-black border border-gray-700 rounded px-3 py-2"
          />

          <input
            name="company"
            placeholder="Empresa"
            className="bg-black border border-gray-700 rounded px-3 py-2"
          />

          <input
            name="cuit"
            placeholder="CUIT"
            className="bg-black border border-gray-700 rounded px-3 py-2"
          />

          <textarea
            name="message"
            required
            placeholder="Mensaje"
            className="bg-black border border-gray-700 rounded px-3 py-2 md:col-span-2 min-h-[120px]"
          />

          {/* BOTÓN BLACKNIGHT */}
          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 bg-[#8B5CF6] hover:bg-[#A78BFA] transition 
            text-black font-semibold px-6 py-3 rounded-lg disabled:opacity-60 shadow-lg"
          >
            {loading ? "Enviando..." : "Enviar"}
          </button>
        </form>

        {success && <p className="text-green-400 mt-4">{success}</p>}
        {error && <p className="text-red-400 mt-4">{error}</p>}
      </section>
    </div>
  );
}
