"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useAuth from "@/app/hooks/useAuth";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { isSafeCallbackUrl } from "@/app/lib/authErrors";

export default function LoginClient() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, loading: authLoading } = useAuth();

  // Validar callbackUrl para bloquear open redirects
  const rawCallback = searchParams.get("callbackUrl") ?? "";
  const callbackUrl = isSafeCallbackUrl(rawCallback) ? rawCallback : "/";

  // Guard: si el usuario ya está autenticado, redirigir al destino
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(callbackUrl);
    }
  }, [authLoading, user, callbackUrl, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEmailNotVerified(false);
    setLoading(true);

    try {
      const result = await login(form.email, form.password);

      if (!result.ok) {
        if (result.reason === "email_not_verified") {
          setEmailNotVerified(true);
        } else {
          setError(result.message);
        }
        return;
      }

      // Login exitoso: volver al destino original o al home
      router.push(callbackUrl);
    } catch {
      setError("Error del servidor. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  // Pantalla específica para email no verificado
  if (emailNotVerified) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="text-4xl" aria-hidden="true">
            📧
          </div>
          <h1 className="text-2xl font-bold">Verificá tu email</h1>
          <p className="text-gray-300">
            Tu cuenta todavía no fue verificada. Te enviamos un correo de
            confirmación cuando te registraste.
          </p>
          <p className="text-gray-400 text-sm">
            Revisá tu bandeja de entrada y carpeta de spam.
          </p>
          {/*
           * El endpoint de reenvío de email de verificación no está
           * disponible todavía en el backend.
           * TODO: agregar botón "Reenviar email" cuando exista POST /api/resend-verification
           */}
          <p className="text-xs text-gray-500">
            ¿No recibiste el correo? Contactanos en{" "}
            <a
              href="mailto:hola@blacknight.com"
              className="text-violet-400 underline"
            >
              hola@blacknight.com
            </a>
          </p>
          <button
            type="button"
            onClick={() => setEmailNotVerified(false)}
            className="mt-2 text-sm text-violet-400 hover:underline"
          >
            ← Volver al inicio de sesión
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-black text-white">
      {/* COLUMNA IZQUIERDA – LOGIN */}
      <div className="flex items-center justify-center px-6">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md space-y-6"
          noValidate
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <span className="text-3xl font-extrabold text-violet-500">
              BlackNight
            </span>
          </div>

          <h1 className="text-2xl font-bold text-center">Iniciar sesión</h1>

          <p className="text-center text-gray-400 text-sm">
            Accedé a tus eventos y entradas
          </p>

          {error && (
            <p
              role="alert"
              aria-live="assertive"
              className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg"
            >
              {error}
            </p>
          )}

          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm text-gray-300 mb-1"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@email.com"
              className="w-full p-3 rounded-lg bg-neutral-900 border border-neutral-700 focus:outline-none focus:border-violet-500"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          {/* Contraseña */}
          <div>
            <label
              htmlFor="login-password"
              className="block text-sm text-gray-300 mb-1"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full p-3 rounded-lg bg-neutral-900 border border-neutral-700 focus:outline-none focus:border-violet-500 pr-10"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              href="/reset-password"
              className="text-sm text-violet-400 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-lg bg-gradient-to-r from-violet-700 to-purple-500 hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>

          <p className="text-center text-gray-400 text-sm">
            ¿No tenés cuenta?{" "}
            <Link href="/register" className="text-violet-400 hover:underline">
              Registrate
            </Link>
          </p>
        </form>
      </div>

      {/* COLUMNA DERECHA – VISUAL */}
      <div className="hidden lg:flex relative items-center justify-center">
        <Image
          src="/login-bg.jpg"
          alt="BlackNight"
          fill
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-black via-black/60 to-transparent" />
        <div className="relative z-10 max-w-md px-10">
          <h2 className="text-3xl font-bold mb-4">Viví la noche.</h2>
          <p className="text-gray-300 text-lg">
            Accedé a tus eventos, entradas y experiencias en un solo lugar.
          </p>
        </div>
      </div>
    </main>
  );
}
