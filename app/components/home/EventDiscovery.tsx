"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { ArrowUpRight, ChevronDown, MapPin, RotateCcw, Search, X } from "lucide-react";
import FeaturedEventHero, { EventArtwork } from "./FeaturedEventHero";
import HomeTrust from "./HomeTrust";
import { eventDate, eventDateBadge, eventLocationLabel, eventPrice, filterEvents, getLocations, selectHeroEvent, type HomeEvent } from "./home-data";

interface Props {
  events: HomeEvent[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function EventArticle({ event }: { event: HomeEvent }) {
  const date = eventDate(event);
  const badge = eventDateBadge(event);
  return (
    <article className="min-w-0">
      <Link href={"/events/" + event.id} className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-violet-300/20 bg-[#0b0a10] shadow-[0_10px_35px_-25px_#6d28d9] transition-[border-color,box-shadow] hover:border-violet-400/70 hover:shadow-[0_10px_30px_-20px_#8b5cf6] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300">
        <div className="relative aspect-[1.65/1] shrink-0 overflow-hidden bg-[#100c17] lg:aspect-[1.8/1]">
          <EventArtwork event={event} sizes="(min-width: 1440px) 420px, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,#0b0a10,transparent_24%)]" />
        </div>
        {badge && date.iso && (
          <time dateTime={date.iso} aria-label={date.label} title={date.label} className="absolute left-4 top-0 flex w-12 flex-col items-center bg-gradient-to-b from-violet-600 to-violet-800 pb-5 pt-2.5 text-white [clip-path:polygon(0_0,100%_0,100%_100%,50%_85%,0_100%)]">
            <span aria-hidden="true" className="text-2xl font-bold leading-none tracking-tight">{badge.day}</span>
            <span aria-hidden="true" className="mt-1 text-xs font-semibold">{badge.month}</span>
          </time>
        )}
        <div className="relative flex flex-1 flex-col px-4 pb-3 pt-1">
          <h3 className="text-xl font-bold uppercase leading-tight tracking-tight text-white [overflow-wrap:anywhere]">{event.title}</h3>
          {!badge && <p className="mt-2 text-xs text-violet-200">{date.label}</p>}
          <p className="mb-3 mt-1.5 flex items-start gap-2 text-xs leading-relaxed text-neutral-300">
            <MapPin size={16} strokeWidth={1.6} className="mt-0.5 shrink-0 text-violet-200" aria-hidden="true" />
            <span className="[overflow-wrap:anywhere]">{eventLocationLabel(event)}</span>
          </p>
          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 text-sm">
            <p className="pb-3 text-neutral-100">{eventPrice(event)}</p>
            <span className="inline-flex min-h-11 items-center justify-center gap-3 whitespace-nowrap rounded-lg border border-violet-500 bg-violet-500/5 px-4 text-xs font-semibold text-white transition-colors group-hover:bg-violet-500/15">Ver evento <ArrowUpRight size={15} strokeWidth={1.6} aria-hidden="true" /></span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function EventDiscovery({ events, loading, error, onRetry }: Props) {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [now] = useState(() => Date.now());
  const locations = useMemo(() => getLocations(events), [events]);
  // The editorial hero stays independent of search and location selection.
  const hero = useMemo(() => selectHeroEvent(events, now), [events, now]);
  const matches = useMemo(() => filterEvents(events, search, location), [events, search, location]);
  const remaining = matches.filter((event) => event.id !== hero?.id);
  const heroMatches = Boolean(hero && matches.some((event) => event.id === hero.id));
  const hasFilters = Boolean(search.trim() || location);
  const disabled = loading || Boolean(error) || events.length === 0;

  function clearFilters() {
    setSearch("");
    setLocation("");
  }

  function showResults(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const results = document.getElementById("home-event-results");
    if (results) {
      results.scrollIntoView({ block: "start" });
      results.focus({ preventScroll: true });
    } else {
      document.getElementById("home-featured-event")?.scrollIntoView({ block: "start" });
    }
  }

  const searchControls = (
    <div className="min-w-0">
      <form role="search" aria-label="Buscar eventos" onSubmit={showResults} className="grid min-w-0 gap-1 rounded-xl border border-violet-200/30 bg-[#101018]/95 p-1.5 shadow-[0_0_24px_-14px_#a78bfa] sm:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_auto] lg:border-violet-200/25 lg:bg-[#100c18]/85 lg:shadow-[0_8px_28px_-18px_#08070d] lg:backdrop-blur-md">
        <div className="relative min-w-0">
          <label htmlFor="event-search" className="sr-only">Buscar por evento, lugar, ciudad o provincia</label>
          <Search size={17} strokeWidth={1.6} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300" aria-hidden="true" />
          <input id="event-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} disabled={disabled} placeholder="Buscá eventos, ciudades o lugares…" className="min-h-12 w-full min-w-0 rounded-lg bg-transparent py-3 pl-10 pr-10 text-sm text-white placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-violet-300 disabled:opacity-50 sm:text-xs [&::-webkit-search-cancel-button]:appearance-none" />
          {search && <button type="button" onClick={() => setSearch("")} aria-label="Borrar búsqueda" className="absolute right-0 top-1/2 flex h-11 w-9 -translate-y-1/2 items-center justify-center rounded text-neutral-300 hover:text-white focus-visible:outline-2 focus-visible:outline-violet-300"><X size={16} aria-hidden="true" /></button>}
        </div>
        <div className="relative min-w-0 border-t border-white/15 sm:my-1 sm:border-l sm:border-t-0">
          <label htmlFor="event-location" className="sr-only">Ubicación del evento</label>
          <MapPin size={17} strokeWidth={1.6} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-200" aria-hidden="true" />
          <select id="event-location" value={location} onChange={(event) => setLocation(event.target.value)} disabled={disabled} className="min-h-12 w-full min-w-0 appearance-none rounded-lg bg-transparent py-3 pl-10 pr-7 text-sm text-neutral-200 [color-scheme:dark] focus-visible:outline-2 focus-visible:outline-violet-300 disabled:opacity-50 sm:min-h-10 sm:py-2 sm:text-xs">
            <option value="">Todas las ubicaciones</option>
            {locations.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-300" aria-hidden="true" />
        </div>
        <button type="submit" disabled={disabled} className="min-h-12 whitespace-nowrap rounded-lg border border-violet-500/70 bg-gradient-to-br from-violet-600 to-violet-800 px-5 text-sm font-semibold text-white hover:from-violet-500 hover:to-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 disabled:opacity-50">Buscar</button>
      </form>
      <div role="group" aria-label="Filtrar por ubicación" className="mt-2 flex min-w-0 max-w-full gap-2 overflow-x-auto overscroll-x-contain px-1 py-1 [scrollbar-width:thin]">
        {[{ key: "", label: "Todos" }, ...locations].map((option) => (
          <button key={option.key} type="button" aria-pressed={location === option.key} onClick={() => setLocation(option.key)} disabled={disabled} className={"min-h-11 shrink-0 whitespace-nowrap rounded-full border px-4 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 disabled:opacity-50 " + (location === option.key ? "border-violet-500 bg-violet-600/15 text-violet-200 shadow-[0_0_14px_-7px_#a855f7]" : "border-white/20 bg-black/35 text-neutral-300 hover:border-violet-400/60 hover:text-white")}>
            {option.label}
          </button>
        ))}
      </div>
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {loading ? "Cargando agenda" : error ? "Agenda no disponible" : matches.length + (matches.length === 1 ? " evento encontrado" : " eventos encontrados") + (hasFilters && heroMatches ? ". Incluye el evento principal." : "")}
      </p>
    </div>
  );

  return (
    <div className="min-w-0" aria-busy={loading}>
      {loading ? (
        <section role="status" className="bg-[radial-gradient(ellipse_at_top_right,#281334,transparent_70%)]">
          <h1 className="sr-only">Eventos BlackNight</h1>
          <span className="sr-only">Cargando eventos</span>
          <div className="mx-auto grid max-w-[1440px] min-w-0 gap-7 px-4 pb-5 sm:px-6 lg:min-h-[460px] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-end lg:gap-8 lg:px-[5%] lg:pb-6 lg:pt-10">
            <div aria-hidden="true" className="space-y-5 pb-6 motion-safe:animate-pulse">
              <div className="-mx-4 h-[clamp(13rem,58vw,23rem)] bg-violet-200/5 sm:-mx-6 lg:hidden" />
              <div className="h-3 w-40 rounded bg-violet-200/15" /><div className="h-20 w-4/5 rounded bg-violet-200/10" /><div className="h-20 w-3/5 rounded bg-violet-200/10" /><div className="h-4 w-4/5 rounded bg-white/10" /><div className="h-12 w-40 rounded-lg bg-violet-500/20" />
            </div>
            {searchControls}
          </div>
        </section>
      ) : error ? (
        <section role="alert" className="bg-[radial-gradient(ellipse_at_top_right,#281334,transparent_70%)]">
          <div className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6 lg:px-10">
            <h1 className="text-3xl font-semibold tracking-tight">La agenda no pudo cargar.</h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-neutral-300">{error}</p>
            <button type="button" onClick={onRetry} className="mt-6 inline-flex min-h-12 items-center gap-3 rounded-lg bg-violet-700 px-5 text-sm font-semibold text-white hover:bg-violet-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300"><RotateCcw size={16} aria-hidden="true" />Reintentar</button>
          </div>
        </section>
      ) : hero ? (
        <FeaturedEventHero key={hero.id} event={hero} now={now}>{searchControls}</FeaturedEventHero>
      ) : (
        <section className="bg-[radial-gradient(ellipse_at_top_right,#281334,transparent_70%)]">
          <div className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6 sm:py-24 lg:px-10">
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">La próxima salida está por llegar.</h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-neutral-300">Todavía no hay eventos publicados. Volvé pronto para descubrir la agenda.</p>
          </div>
        </section>
      )}

      <HomeTrust />

      {!loading && !error && (remaining.length > 0 || hasFilters) && (
        <section id="home-event-results" tabIndex={-1} aria-labelledby="more-events-title" className="scroll-mt-20 bg-[radial-gradient(ellipse_at_bottom,rgba(76,29,149,0.12),transparent_75%)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet-300">
          <div className="mx-auto max-w-[1440px] px-4 pb-8 pt-6 sm:px-6 sm:pb-10 lg:px-[5%]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 id="more-events-title" className="text-2xl font-bold tracking-tight">{hasFilters ? "Resultados de tu búsqueda" : "Más para descubrir"}</h2>
              {hasFilters && <button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center gap-2 rounded text-sm text-violet-300 hover:text-violet-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300">Ver todos los eventos <ArrowUpRight size={16} aria-hidden="true" /></button>}
            </div>
            {hasFilters && heroMatches && (
              <p className="mb-5 text-sm leading-relaxed text-neutral-300">{remaining.length === 0 ? "El evento que buscás está al inicio de la página." : "Tu búsqueda también incluye el evento principal."}{" "}<a href="#home-featured-event" className="inline-flex min-h-11 items-center rounded text-violet-300 underline underline-offset-4 hover:text-violet-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300">Ver {hero?.title}</a></p>
            )}
            {remaining.length > 0 ? (
              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {remaining.map((event) => <EventArticle key={event.id} event={event} />)}
              </div>
            ) : !heroMatches ? (
              <div className="py-8 sm:py-12">
                <p className="text-xl font-medium">No encontramos eventos con esa búsqueda.</p>
                <p className="mt-3 text-sm leading-relaxed text-neutral-300">Probá otro nombre o ampliá la ubicación para ver más opciones.</p>
                <button type="button" onClick={clearFilters} className="mt-5 min-h-12 rounded-lg bg-violet-700 px-5 text-sm font-semibold text-white hover:bg-violet-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300">Limpiar filtros</button>
              </div>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
