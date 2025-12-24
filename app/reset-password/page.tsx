"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (loading) return;
    setLoading(true);

    try {
      await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // ⛔ No mostramos error para no filtrar información
    } finally {
      router.push("/reset-password/sent");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b0b14] via-[#120b2a] to-black text-white">
      <div className="w-full max-w-sm bg-zinc-900/80 rounded-xl p-6 shadow-xl border border-zinc-800">
        <h1 className="text-xl font-semibold mb-2 text-center">
          Password recovery
        </h1>
        <p className="text-sm text-zinc-400 text-center mb-4">
          Enter your email address to reset your password
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Enter your email"
            className="w-full rounded-md p-2 bg-zinc-800 text-white border border-zinc-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 transition rounded-md p-2 font-medium disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
