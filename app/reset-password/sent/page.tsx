import Link from "next/link";

export default function ResetPasswordSentPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b0b14] via-[#120b2a] to-black text-white">
      <div className="w-full max-w-sm bg-zinc-900/80 rounded-xl p-6 shadow-xl border border-zinc-800 text-center">
        <div className="text-4xl mb-3">📧</div>

        <h1 className="text-xl font-semibold mb-2">
          Revisá tu correo
        </h1>

        <p className="text-sm text-zinc-400 mb-4">
          Si existe una cuenta asociada a ese email, vas a recibir un enlace
          para restablecer tu contraseña.
        </p>

        <p className="text-xs text-zinc-500 mb-6">
          Si no lo ves en unos minutos, revisá la carpeta de spam o correo no deseado.
        </p>

        <Link
          href="/login"
          className="inline-block px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 transition text-sm font-medium"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
