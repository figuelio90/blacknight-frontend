import Link from "next/link";

export default function ResetPasswordSentPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b0b14] via-[#120b2a] to-black text-white">
      <div className="w-full max-w-sm bg-zinc-900/80 rounded-xl p-6 shadow-xl border border-zinc-800 text-center">
        <div className="text-4xl mb-3">📧</div>

        <h1 className="text-xl font-semibold mb-2">
          Check your email
        </h1>

        <p className="text-sm text-zinc-400 mb-6">
          If an account exists for that email, you’ll receive a password
          reset link.
        </p>

        <Link
          href="/login"
          className="text-violet-400 hover:underline text-sm"
        >
          Return to login
        </Link>
      </div>
    </div>
  );
}
