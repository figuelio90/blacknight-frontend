import Link from "next/link";
import { QrCode, ShieldCheck, Ticket, UserRound } from "lucide-react";

const benefits = [
  { icon: ShieldCheck, title: "Compra segura", detail: "Pagá con Mercado Pago" },
  { icon: Ticket, title: "Entrada digital", detail: "Tus entradas en BlackNight" },
  { icon: QrCode, title: "Tu QR, a mano", detail: "Mostralo en el ingreso" },
  { icon: UserRound, title: "Siempre en tu perfil", detail: "Accedé a tus entradas", href: "/profile" },
];

export default function HomeTrust() {
  return (
    <section aria-label="Tu compra en BlackNight" className="border-y border-white/15 bg-[linear-gradient(110deg,#0c0a11,#08090d_50%,#100a18)]">
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 px-4 py-2 min-[380px]:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-10 lg:py-4">
        {benefits.map(({ icon: Icon, title, detail, href }) => {
          const className = "flex min-h-11 min-w-0 items-center gap-3 py-3 min-[380px]:px-2 lg:justify-center lg:border-r lg:border-white/20 lg:px-4 lg:py-0 lg:last:border-0";
          const content = <>
            <Icon size={34} strokeWidth={1.5} className="shrink-0 text-violet-400" aria-hidden="true" />
            <div className="min-w-0">
              <h2 className="text-sm font-medium leading-snug text-white">{title}</h2>
              <p className={"mt-1 text-xs leading-relaxed text-neutral-300 " + (href ? "underline decoration-violet-400/50 underline-offset-4 group-hover:text-violet-200" : "")}>{detail}</p>
            </div>
          </>;
          return href
            ? <Link key={title} href={href} className={className + " group rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"}>{content}</Link>
            : <div key={title} className={className}>{content}</div>;
        })}
      </div>
    </section>
  );
}
