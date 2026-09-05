"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowUpRight, CalendarDays, MapPin, Ticket } from "lucide-react";
import { eventDate, eventLocationLabel, eventPrice, type HomeEvent } from "./home-data";

export function EventArtwork({ event, priority = false, sizes, hero = false }: {
  event: HomeEvent;
  priority?: boolean;
  sizes: string;
  hero?: boolean;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const [portraitSource, setPortraitSource] = useState<string | null>(null);
  const source = event.image;
  const supported = source && (
    (source.startsWith("/") && !source.startsWith("//")) ||
    source.startsWith("https://media.blacknight.click/")
  );
  const portrait = portraitSource === source;

  if (!supported || failedSource === source) {
    return (
      <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 bg-[radial-gradient(ellipse_at_top_right,#321448,transparent_70%)] px-5 text-violet-200">
        <Ticket size={40} strokeWidth={1.25} aria-hidden="true" />
        <span className="text-sm">Imagen no disponible</span>
      </div>
    );
  }

  return (
    <>
      {portrait && (
        <Image src={source} alt="" aria-hidden="true" fill sizes={sizes} className="scale-110 object-cover opacity-50 blur-xl" />
      )}
      <Image
        src={source}
        alt={"Afiche de " + event.title}
        fill
        sizes={sizes}
        priority={priority}
        className={portrait
          ? "object-contain " + (hero ? "lg:object-right" : "")
          : "object-cover " + (hero ? "object-center lg:object-[65%_center]" : "object-center motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.025]")}
        onLoad={(image) => {
          if (image.currentTarget.naturalHeight > image.currentTarget.naturalWidth) setPortraitSource(source);
        }}
        onError={() => setFailedSource(source)}
      />
    </>
  );
}

export default function FeaturedEventHero({ event, now, children }: {
  event: HomeEvent;
  now: number;
  children: ReactNode;
}) {
  const date = eventDate(event);
  const upcoming = Date.parse(event.startAt) >= now;
  const label = event.featured
    ? upcoming ? "Próximo evento destacado" : "Evento destacado"
    : upcoming ? "Próximo evento" : "En la agenda";

  return (
    <section id="home-featured-event" aria-labelledby="hero-event-title" className="relative isolate scroll-mt-20 bg-[#08070d]">
      <div className="relative h-[clamp(13rem,58vw,23rem)] overflow-hidden lg:absolute lg:inset-0 lg:h-auto">
        <EventArtwork event={event} priority hero sizes="100vw" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,#08070d,transparent_35%)] lg:bg-[linear-gradient(90deg,rgba(4,3,8,0.98)_0%,rgba(6,4,12,0.90)_28%,rgba(9,5,16,0.38)_48%,rgba(9,5,16,0.06)_72%,rgba(18,5,28,0.16)_100%)]" />
        <div aria-hidden="true" className="absolute inset-0 hidden bg-[linear-gradient(to_top,#08070d_0%,rgba(38,14,58,0.30)_18%,rgba(8,7,13,0.18)_40%,transparent_65%)] lg:block" />
      </div>

      <div className="relative mx-auto grid max-w-[1440px] min-w-0 gap-7 px-4 pb-5 sm:px-6 lg:min-h-[440px] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-end lg:gap-8 lg:px-[5%] lg:pb-6 lg:pt-10 xl:min-h-[460px]">
        <div className="min-w-0 lg:self-start lg:pb-6">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300 sm:text-xs">{label}</p>
          <h1 id="hero-event-title" className="max-w-[16ch] text-[clamp(2.5rem,4.8vw,4.75rem)] font-extrabold uppercase leading-[0.98] tracking-[-0.045em] text-white [overflow-wrap:anywhere] lg:max-w-[12ch]">{event.title}</h1>
          <div className="mb-5 mt-6 space-y-2.5 text-sm leading-relaxed text-neutral-100">
            <p className="flex items-start gap-2.5">
              <CalendarDays size={17} strokeWidth={1.6} className="mt-0.5 shrink-0 text-violet-300" aria-hidden="true" />
              {date.iso ? <time dateTime={date.iso}>{date.label}</time> : <span>{date.label}</span>}
            </p>
            <p className="flex items-start gap-2.5">
              <MapPin size={17} strokeWidth={1.6} className="mt-0.5 shrink-0 text-violet-300" aria-hidden="true" />
              <span className="[overflow-wrap:anywhere]">{eventLocationLabel(event)}</span>
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
            <Link href={"/events/" + event.id} className="inline-flex min-h-12 items-center justify-center gap-5 whitespace-nowrap rounded-lg border border-violet-500/60 bg-gradient-to-br from-violet-600 to-violet-800 px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_24px_-10px_#7c3aed] transition-colors hover:from-violet-500 hover:to-violet-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300 motion-safe:active:scale-[0.98]">Ver evento <ArrowUpRight size={18} strokeWidth={1.6} aria-hidden="true" /></Link>
            <p className="text-sm text-neutral-100">{eventPrice(event)}</p>
          </div>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}
