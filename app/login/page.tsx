import { Suspense } from "react";
import LoginClient from "./LoginClient";

/**
 * LoginPage es un Server Component que envuelve LoginClient en Suspense.
 * Esto es obligatorio porque LoginClient usa useSearchParams(), que requiere
 * un boundary de Suspense en Next.js para el Static Rendering.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          <p className="text-gray-400">Cargando...</p>
        </main>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
