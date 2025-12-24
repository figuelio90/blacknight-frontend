"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/app/hooks/useAuth";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(form.email, form.password);

      if (!result.ok) {
        setError(result.message || "Credenciales incorrectas");
        return;
      }

      router.push("/");
    } catch {
      setError("Error del servidor. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-black text-white">
      {/* COLUMNA IZQUIERDA – LOGIN */}
      <div className="flex items-center justify-center px-6">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md space-y-6"
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <h1 className="text-3xl font-extrabold text-violet-500">
              BlackNight
            </h1>
          </div>

          <h2 className="text-2xl font-bold text-center">
            Iniciar sesión
          </h2>

          <p className="text-center text-gray-400 text-sm">
            Accedé a tus eventos y entradas
          </p>

          {error && (
            <p className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">
              {error}
            </p>
          )}

          {/* Email */}
          <div>
            <label className="text-sm text-gray-300">Email</label>
            <input
              type="email"
              required
              placeholder="tu@email.com"
              className="mt-1 w-full p-3 rounded-lg bg-neutral-900 border border-neutral-700 focus:outline-none focus:border-violet-500"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm text-gray-300">Contraseña</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                required
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
          <h3 className="text-3xl font-bold mb-4">
            Viví la noche.
          </h3>
          <p className="text-gray-300 text-lg">
            Accedé a tus eventos, entradas y experiencias en un solo lugar.
          </p>
        </div>
      </div>
    </main>
  );
}
