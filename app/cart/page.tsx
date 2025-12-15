import { Suspense } from "react";
import CartClient from "./CartClient";

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          <p className="text-gray-400 text-lg">Cargando carrito…</p>
        </main>
      }
    >
      <CartClient />
    </Suspense>
  );
}
