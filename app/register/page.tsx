"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { mapRegisterError } from "@/app/lib/authErrors";
import useAuth from "@/app/hooks/useAuth";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Guard: usuario ya autenticado no debería registrarse de nuevo
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

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
  const [registered, setRegistered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!acceptTerms) {
      setError("Debés aceptar los términos y condiciones para continuar.");
      return;
    }

    if (form.email !== form.confirmEmail) {
      setError("Los emails no coinciden.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);

      let res: Response;
      try {
        res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ...form,
            acceptTerms,
          }),
        });
      } catch {
        setError(
          "No se pudo conectar con el servidor. Verificá tu conexión e intentá nuevamente."
        );
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(mapRegisterError(res.status, data.error));
        return;
      }

      setRegistered(true);
    } finally {
      setLoading(false);
    }
  }

  // Pantalla de éxito post-registro
  if (registered) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="text-4xl" aria-hidden="true">
            📧
          </div>
          <h1 className="text-3xl font-bold">Verificá tu email</h1>
          <p className="text-gray-300">
            Te enviamos un correo para confirmar tu cuenta.
          </p>
          <p className="text-gray-400 text-sm">
            Debés verificar tu email antes de poder iniciar sesión. Revisá tu
            bandeja de entrada y carpeta de spam.
          </p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-violet-700 to-purple-500 hover:opacity-90 font-semibold"
          >
            Ir al inicio de sesión
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-black text-white">
      {/* COLUMNA IZQUIERDA */}
      <div className="flex items-center justify-center px-6 py-16">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-8 space-y-4"
          noValidate
        >
          <h1 className="text-3xl font-bold text-center mb-4">Crear cuenta</h1>

          {error && (
            <p
              role="alert"
              aria-live="assertive"
              className="text-red-400 bg-red-500/10 border border-red-500/30 text-sm text-center p-3 rounded-lg"
            >
              {error}
            </p>
          )}

          {/* Nombre y Apellido */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="reg-firstName"
                className="block text-xs text-gray-400 mb-1"
              >
                Nombre <span aria-hidden="true">*</span>
              </label>
              <input
                id="reg-firstName"
                name="firstName"
                autoComplete="given-name"
                placeholder="Juan"
                className="input"
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label
                htmlFor="reg-lastName"
                className="block text-xs text-gray-400 mb-1"
              >
                Apellido <span aria-hidden="true">*</span>
              </label>
              <input
                id="reg-lastName"
                name="lastName"
                autoComplete="family-name"
                placeholder="García"
                className="input"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Documento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="reg-documentType"
                className="block text-xs text-gray-400 mb-1"
              >
                Tipo de documento <span aria-hidden="true">*</span>
              </label>
              <select
                id="reg-documentType"
                name="documentType"
                className="input"
                onChange={handleChange}
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Seleccioná
                </option>
                <option value="DNI">DNI</option>
                <option value="PASSPORT">Pasaporte</option>
                <option value="CI">CI</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="reg-documentNumber"
                className="block text-xs text-gray-400 mb-1"
              >
                N° documento <span aria-hidden="true">*</span>
              </label>
              <input
                id="reg-documentNumber"
                name="documentNumber"
                autoComplete="off"
                placeholder="12345678"
                className="input"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Género */}
          <div>
            <label
              htmlFor="reg-gender"
              className="block text-xs text-gray-400 mb-1"
            >
              Género <span aria-hidden="true">*</span>
            </label>
            <select
              id="reg-gender"
              name="gender"
              className="input"
              onChange={handleChange}
              required
              defaultValue=""
            >
              <option value="" disabled>
                Seleccioná
              </option>
              <option value="FEMALE">Femenino</option>
              <option value="MALE">Masculino</option>
              <option value="OTHER">Otro</option>
              <option value="UNDISCLOSED">Prefiero no decir</option>
            </select>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="reg-email"
              className="block text-xs text-gray-400 mb-1"
            >
              Email <span aria-hidden="true">*</span>
            </label>
            <input
              id="reg-email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="tu@email.com"
              className="input"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label
              htmlFor="reg-confirmEmail"
              className="block text-xs text-gray-400 mb-1"
            >
              Confirmar email <span aria-hidden="true">*</span>
            </label>
            <input
              id="reg-confirmEmail"
              type="email"
              name="confirmEmail"
              autoComplete="off"
              placeholder="tu@email.com"
              className="input"
              onChange={handleChange}
              required
            />
          </div>

          {/* Contraseña */}
          <div>
            <label
              htmlFor="reg-password"
              className="block text-xs text-gray-400 mb-1"
            >
              Contraseña <span aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                className="input pr-10"
                onChange={handleChange}
                required
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

          <div>
            <label
              htmlFor="reg-confirmPassword"
              className="block text-xs text-gray-400 mb-1"
            >
              Confirmar contraseña <span aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <input
                id="reg-confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Repetí tu contraseña"
                className="input pr-10"
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Teléfono y Ciudad (opcionales) */}
          <div>
            <label
              htmlFor="reg-phone"
              className="block text-xs text-gray-400 mb-1"
            >
              Teléfono{" "}
              <span className="text-gray-600">(opcional)</span>
            </label>
            <input
              id="reg-phone"
              name="phone"
              autoComplete="tel"
              placeholder="+54 11 1234-5678"
              className="input"
              onChange={handleChange}
            />
          </div>

          <div>
            <label
              htmlFor="reg-city"
              className="block text-xs text-gray-400 mb-1"
            >
              Ciudad{" "}
              <span className="text-gray-600">(opcional)</span>
            </label>
            <input
              id="reg-city"
              name="city"
              autoComplete="address-level2"
              placeholder="Buenos Aires"
              className="input"
              onChange={handleChange}
            />
          </div>

          {/* Términos y Condiciones */}
          <label className="flex items-start gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              id="reg-acceptTerms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5"
            />
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
            <Link href="/login" className="text-violet-400 underline">
              Iniciar sesión
            </Link>
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="terms-modal-title"
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4"
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowTerms(false);
          }}
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <h2 id="terms-modal-title" className="text-2xl font-bold mb-4">
              Términos y Condiciones
            </h2>

            <div className="text-sm text-gray-400 space-y-4">
              <p>
                Al aceptar, declarás haber leído y comprendido los términos
                aplicables a la compra de entradas.
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowTerms(false)}
                className="px-4 py-2 bg-neutral-700 rounded-lg"
              >
                Cerrar
              </button>

              <button
                type="button"
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
