"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { mapResetPasswordTokenError } from "@/app/lib/authErrors";

export default function ResetPasswordTokenPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError(
        "El enlace de recuperación es inválido. Solicitá uno nuevo desde la pantalla de recuperación."
      );
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (loading) return;
    setLoading(true);

    let res: Response;

    try {
      res = await fetch(`/api/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          confirmPassword: confirm,
        }),
      });
    } catch {
      setError(
        "No se pudo conectar con el servidor. Verificá tu conexión e intentá nuevamente."
      );
      setLoading(false);
      return;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(mapResetPasswordTokenError(res.status, data.error));
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
    setTimeout(() => router.push("/login"), 2500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b0b14] via-[#120b2a] to-black text-white">
      <div className="w-full max-w-sm bg-zinc-900/80 rounded-xl p-6 shadow-xl border border-zinc-800">
        <h1 className="text-xl font-semibold mb-4 text-center">
          Crear nueva contraseña
        </h1>

        {done ? (
          <div className="text-center space-y-3">
            <p className="text-sm text-zinc-300">
              ✅ Contraseña actualizada correctamente.
            </p>
            <p className="text-xs text-zinc-500">
              Redirigiendo al inicio de sesión...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <p
                role="alert"
                aria-live="assertive"
                className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded-lg"
              >
                {error}
              </p>
            )}

            <div>
              <label
                htmlFor="reset-password"
                className="block text-sm text-zinc-300 mb-1"
              >
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  required
                  autoComplete="new-password"
                  className="w-full rounded-md p-2 pr-10 bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:border-violet-500"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="reset-confirm"
                className="block text-sm text-zinc-300 mb-1"
              >
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  id="reset-confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repetí tu contraseña"
                  required
                  autoComplete="new-password"
                  className="w-full rounded-md p-2 pr-10 bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:border-violet-500"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setError("");
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={
                    showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 transition rounded-md p-2 font-medium disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar nueva contraseña"}
            </button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-zinc-400 hover:text-violet-400 transition"
              >
                Ir al inicio de sesión
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
