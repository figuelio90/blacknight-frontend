"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Verificando email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token inválido");
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`/api/verify-email?token=${token}`);

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Error al verificar");
        }

        setStatus("success");
        setMessage("✅ Email verificado correctamente");

        setTimeout(() => {
          router.push("/login");
        }, 2500);
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Error al verificar email");
      }
    }

    verify();
  }, [token, router]);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-700 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Verificación de Email</h1>

        <p
          className={`text-lg ${
            status === "success"
              ? "text-green-400"
              : status === "error"
              ? "text-red-400"
              : "text-gray-400"
          }`}
        >
          {message}
        </p>

        {status === "success" && (
          <p className="text-sm text-gray-400 mt-3">
            Redirigiendo al login...
          </p>
        )}
      </div>
    </main>
  );
}
