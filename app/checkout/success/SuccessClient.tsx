import { Suspense } from "react";
import SuccessClient from "./SuccessClient";

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          <p className="text-gray-400 text-lg">
            Confirmando tu compra…
          </p>
        </main>
      }
    >
      <SuccessClient />
    </Suspense>
  );
}
