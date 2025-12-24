"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ResetPasswordTokenPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Token inválido");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          confirmPassword: confirm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");

      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
      setError(err.message || "Error al cambiar contraseña");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b0b14] via-[#120b2a] to-black text-white">
      <div className="w-full max-w-sm bg-zinc-900/80 rounded-xl p-6 shadow-xl border border-zinc-800">
        <h1 className="text-xl font-semibold mb-4 text-center">
          Set new password
        </h1>

        {done ? (
          <p className="text-sm text-zinc-300 text-center">
            ✅ Password updated successfully. <br />
            Redirecting to login…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="New password"
              required
              className="w-full rounded-md p-2 bg-zinc-800 text-white border border-zinc-700"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
            />

            <input
              type="password"
              placeholder="Confirm new password"
              required
              className="w-full rounded-md p-2 bg-zinc-800 text-white border border-zinc-700"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setError("");
              }}
            />

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 transition rounded-md p-2 font-medium disabled:opacity-50"
            >
              {loading ? "Saving..." : "Set new password"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full text-sm text-zinc-400 hover:underline"
            >
              Go to login page
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
