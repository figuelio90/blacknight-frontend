export interface HomeEvent {
  id: number;
  title: string;
  startAt: string;
  image: string | null;
  featured: boolean;
  venueName: string;
  venueCity: string;
  venueProvince: string;
  status: "published";
  ticketTypes: { price: number; active: boolean }[];
}

export interface EventLocation {
  key: string;
  label: string;
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-AR").trim().replace(/\s+/g, " ");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parsePrice(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const price = Number(value);
  // The API stores whole ARS, not cents. Never scale these values.
  return Number.isSafeInteger(price) && price >= 0 ? price : null;
}

export function normalizeEvents(data: unknown[]): HomeEvent[] {
  const seen = new Set<number>();
  return data.flatMap((item) => {
    if (!isRecord(item) || item.status !== "published") return [];
    const id = Number(item.id);
    const title = cleanText(item.title);
    if (!Number.isSafeInteger(id) || id <= 0 || !title || seen.has(id)) return [];
    seen.add(id);
    const ticketTypes = Array.isArray(item.ticketTypes)
      ? item.ticketTypes.flatMap((ticket) => {
          if (!isRecord(ticket)) return [];
          const price = parsePrice(ticket.price);
          return price === null ? [] : [{ price, active: ticket.active !== false }];
        })
      : [];
    return [{
      id, title,
      startAt: cleanText(item.startAt),
      image: cleanText(item.image) || null,
      featured: item.featured === true,
      venueName: cleanText(item.venueName),
      venueCity: cleanText(item.venueCity),
      venueProvince: cleanText(item.venueProvince),
      status: "published" as const,
      ticketTypes,
    }];
  });
}

export function eventLocationKey(event: HomeEvent): string {
  // Use the actual province, falling back to city. Never infer geographic aliases.
  return normalizeText(event.venueProvince || event.venueCity);
}

export function getLocations(events: HomeEvent[]): EventLocation[] {
  const locations = new Map<string, string>();
  for (const event of events) {
    const key = eventLocationKey(event);
    if (key && !locations.has(key)) locations.set(key, event.venueProvince || event.venueCity);
  }
  return Array.from(locations, ([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "es-AR"));
}

export function filterEvents(events: HomeEvent[], search: string, location: string): HomeEvent[] {
  const terms = normalizeText(search).split(" ").filter(Boolean);
  return events.filter((event) => {
    const text = normalizeText([event.title, event.venueName, event.venueCity, event.venueProvince].join(" "));
    return (!location || eventLocationKey(event) === location) && terms.every((term) => text.includes(term));
  });
}

export function selectHeroEvent(events: HomeEvent[], now: number): HomeEvent | null {
  // GET /api/events exposes Event.featured. Image availability never changes priority.
  const published = events.filter((event) => event.status === "published");
  const featured = published.filter((event) => event.featured);
  const candidates = featured.length ? featured : published;
  const upcoming = candidates.filter((event) => Date.parse(event.startAt) >= now);
  if (upcoming.length) {
    return [...upcoming].sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt) || a.id - b.id)[0];
  }
  // Keep past and undated events accessible without labeling them as upcoming.
  return [...candidates].sort((a, b) => {
    const aDate = Date.parse(a.startAt);
    const bDate = Date.parse(b.startAt);
    return (Number.isFinite(bDate) ? bDate : -Infinity) - (Number.isFinite(aDate) ? aDate : -Infinity) || a.id - b.id;
  })[0] ?? null;
}

export function eventLocationLabel(event: HomeEvent): string {
  const seen = new Set<string>();
  return [event.venueName, event.venueCity, event.venueProvince].filter((part) => {
    const key = normalizeText(part);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).join(", ") || "Lugar a confirmar";
}

export function eventDate(event: HomeEvent): { label: string; iso: string | null } {
  const timestamp = Date.parse(event.startAt);
  if (!Number.isFinite(timestamp)) return { label: "Fecha a confirmar", iso: null };
  const date = new Date(timestamp);
  return {
    label: new Intl.DateTimeFormat("es-AR", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
      timeZone: "America/Argentina/Buenos_Aires", hourCycle: "h23",
    }).format(date) + " h",
    iso: date.toISOString(),
  };
}

export function eventPrice(event: HomeEvent): string {
  const prices = event.ticketTypes.filter((ticket) => ticket.active).map((ticket) => ticket.price);
  if (!prices.length) return "Consultá las entradas";
  const amount = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.min(...prices));
  return `Desde $${amount}`;
}

export function eventDateBadge(event: HomeEvent): { day: string; month: string } | null {
  const timestamp = Date.parse(event.startAt);
  if (!Number.isFinite(timestamp)) return null;
  const parts = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit", month: "short", timeZone: "America/Argentina/Buenos_Aires",
  }).formatToParts(new Date(timestamp));
  return {
    day: parts.find((part) => part.type === "day")?.value ?? "",
    month: (parts.find((part) => part.type === "month")?.value ?? "").replace(".", "").toLocaleUpperCase("es-AR"),
  };
}
