import { Suspense } from "react";
import VerifyEmailClient from "./verify-email-client";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          <p className="text-gray-400">Verificando email…</p>
        </main>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}
