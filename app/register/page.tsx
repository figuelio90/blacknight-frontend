"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    documentType: "",
    documentNumber: "",
    gender: "",
    email: "",
    confirmEmail: "",
    password: "",
    confirmPassword: "",
    phone: "",
    city: "",
  });

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!acceptTerms) {
      setError("Debés aceptar los términos y condiciones");
      return;
    }

    if (form.email !== form.confirmEmail) {
      setError("Los emails no coinciden");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ...form,
            acceptTerms,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al registrarse");
        return;
      }

      router.push("/login");
    } catch (err) {
      setError("Error del servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-black text-white">
      {/* COLUMNA IZQUIERDA */}
      <div className="flex items-center justify-center px-6 py-16">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-8 space-y-4"
        >
          <h1 className="text-3xl font-bold text-center mb-4">
            Crear cuenta
          </h1>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <input
              name="firstName"
              placeholder="Nombre *"
              className="input"
              onChange={handleChange}
              required
            />
            <input
              name="lastName"
              placeholder="Apellido *"
              className="input"
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              name="documentType"
              className="input"
              onChange={handleChange}
              required
            >
              <option value="">Tipo doc *</option>
              <option value="DNI">DNI</option>
              <option value="PASSPORT">Pasaporte</option>
              <option value="CI">CI</option>
              <option value="OTHER">Otro</option>
            </select>

            <input
              name="documentNumber"
              placeholder="N° documento *"
              className="input"
              onChange={handleChange}
              required
            />
          </div>

          <select
            name="gender"
            className="input"
            onChange={handleChange}
            required
          >
            <option value="">Género *</option>
            <option value="FEMALE">Femenino</option>
            <option value="MALE">Masculino</option>
            <option value="OTHER">Otro</option>
            <option value="UNDISCLOSED">Prefiero no decir</option>
          </select>

          <input
            type="email"
            name="email"
            placeholder="Email *"
            className="input"
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="confirmEmail"
            placeholder="Confirmar email *"
            className="input"
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Contraseña *"
            className="input"
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirmar contraseña *"
            className="input"
            onChange={handleChange}
            required
          />

          <input
            name="phone"
            placeholder="Teléfono"
            className="input"
            onChange={handleChange}
          />

          <input
            name="city"
            placeholder="Ciudad"
            className="input"
            onChange={handleChange}
          />

          {/* TÉRMINOS */}
          <label className="flex items-start gap-2 text-sm text-gray-400">
            <input type="checkbox" checked={acceptTerms} readOnly />
            <span>
              Acepto los{" "}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="text-violet-400 underline"
              >
                Términos y Condiciones
              </button>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-700 to-purple-500 hover:opacity-90 font-semibold disabled:opacity-50"
          >
            {loading ? "Creando cuenta..." : "Registrarme"}
          </button>

          <p className="text-sm text-center text-gray-400">
            ¿Ya tenés cuenta?{" "}
            <a href="/login" className="text-violet-400 underline">
              Iniciar sesión
            </a>
          </p>
        </form>
      </div>

      {/* COLUMNA DERECHA */}
      <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-violet-900/40 to-black">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-4xl font-bold">Viví la experiencia</h2>
          <p className="text-gray-400">
            Comprá tus entradas de forma segura y accedé a tus tickets desde
            cualquier dispositivo.
          </p>
        </div>
      </div>

      {/* MODAL TÉRMINOS */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              Términos y Condiciones
            </h2>

            <div className="text-sm text-gray-400 space-y-4">
              {/* PEGÁ ACÁ EL TEXTO LEGAL */}
              <p>
                Al aceptar, declarás haber leído y comprendido los términos
                aplicables a la compra de entradas.
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowTerms(false)}
                className="px-4 py-2 bg-neutral-700 rounded-lg"
              >
                Cerrar
              </button>

              <button
                onClick={() => {
                  setAcceptTerms(true);
                  setShowTerms(false);
                }}
                className="px-5 py-2 bg-violet-700 rounded-lg font-semibold"
              >
                Acepto los términos
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
