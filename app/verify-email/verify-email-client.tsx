"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type VerifyStatus = "loading" | "success" | "error";

export default function VerifyEmailClient() {
  const params = useSearchParams();
  const token = params.get("token");

  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [message, setMessage] = useState("Verificando tu email...");

  /*
   * Guard para evitar doble verificación.
   * Si el usuario recarga la página el useEffect se volvería a ejecutar,
   * enviando un segundo request con el mismo token. Si el backend invalida
   * el token al usarlo, el usuario vería un error aunque ya estuviera verificado.
   * Con hasVerified.current garantizamos que verify() se llama una sola vez
   * durante el ciclo de vida del componente.
   */
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;

    if (!token) {
      setStatus("error");
      setMessage(
        "El enlace de verificación no es válido. Revisá que el link del email esté completo."
      );
      return;
    }

    hasVerified.current = true;

    async function verify() {
      try {
        let res: Response;
        try {
          res = await fetch(`/api/verify-email?token=${token}`);
        } catch {
          // Error de red
          setStatus("error");
          setMessage(
            "No se pudo conectar con el servidor. Verificá tu conexión e intentá nuevamente."
          );
          return;
        }

        if (!res.ok) {
          /*
           * El backend devolvió un error. Mapeamos los casos más comunes
           * sin exponer el mensaje técnico interno.
           */
          let friendlyMessage: string;

          if (res.status === 400 || res.status === 404) {
            friendlyMessage =
              "El enlace de verificación es inválido o ya fue utilizado. Si ya verificaste tu email, podés iniciar sesión.";
          } else if (res.status === 410) {
            friendlyMessage =
              "El enlace de verificación venció. Por favor solicitá uno nuevo.";
          } else if (res.status >= 500) {
            friendlyMessage =
              "Error del servidor al verificar tu email. Intentá nuevamente en unos minutos.";
          } else {
            friendlyMessage =
              "No se pudo verificar tu email. El enlace puede ser inválido o estar vencido.";
          }

          setStatus("error");
          setMessage(friendlyMessage);
          return;
        }

        setStatus("success");
        setMessage("¡Tu email fue verificado correctamente!");

        /*
         * Redirigir al login después de 3 segundos para que el usuario
         * pueda leer el mensaje de éxito.
         */
        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
      } catch {
        setStatus("error");
        setMessage(
          "Ocurrió un error inesperado al verificar tu email. Intentá nuevamente."
        );
      }
    }

    verify();
  }, [token]); // solo depende del token, no del router

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-700 max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold">Verificación de email</h1>

        {status === "loading" && (
          <p
            role="status"
            aria-live="polite"
            className="text-gray-400 text-lg"
          >
            {message}
          </p>
        )}

        {status === "success" && (
          <>
            <p
              role="status"
              aria-live="polite"
              className="text-green-400 text-lg"
            >
              {message}
            </p>
            <p className="text-sm text-gray-400">
              Redirigiendo al inicio de sesión...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <p
              role="alert"
              aria-live="assertive"
              className="text-red-400 text-base"
            >
              {message}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 text-sm font-semibold transition"
              >
                Ir al inicio de sesión
              </Link>
              <Link
                href="/reset-password"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-neutral-600 hover:border-violet-500 text-sm text-gray-300 transition"
              >
                Recuperar contraseña
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
