"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      /*
       * Redirigimos a /sent SOLO cuando el request completó (sin importar si
       * el email existe o no, para no revelar qué cuentas están registradas).
       * El redirect está en el bloque try/success, no en finally, así un error
       * de red no lleva al usuario a una pantalla de "revisá tu correo" falsa.
       */
      router.push("/reset-password/sent");
    } catch {
      /*
       * Error de red o servidor caído: mostramos un mensaje de error claro
       * sin revelar si el email existe o no.
       */
      setError(
        "No se pudo enviar el correo. Verificá tu conexión e intentá nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b0b14] via-[#120b2a] to-black text-white">
      <div className="w-full max-w-sm bg-zinc-900/80 rounded-xl p-6 shadow-xl border border-zinc-800">
        <h1 className="text-xl font-semibold mb-2 text-center">
          Recuperar contraseña
        </h1>
        <p className="text-sm text-zinc-400 text-center mb-4">
          Ingresá tu email y te enviamos un enlace para restablecer tu
          contraseña.
        </p>

        {error && (
          <p
            role="alert"
            aria-live="assertive"
            className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded-lg text-center"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="forgot-email"
              className="block text-sm text-zinc-300 mb-1"
            >
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@email.com"
              className="w-full rounded-md p-2 bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:border-violet-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 transition rounded-md p-2 font-medium disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="text-sm text-zinc-400 hover:text-violet-400 transition"
          >
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
