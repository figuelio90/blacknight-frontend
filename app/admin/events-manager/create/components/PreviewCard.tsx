"use client";

import { EventFormState, TicketTypeForm } from "../page";

interface PreviewCardProps {
  form: EventFormState;
  ticketTypes: TicketTypeForm[];
  previewImage: string;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "Fecha sin definir";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Fecha inválida";
  return date.toLocaleString("es-AR", {
    dateStyle: "full",
    timeStyle: "short",
  });
}

export default function PreviewCard({
  form,
  ticketTypes,
  previewImage,
}: PreviewCardProps) {
  const imageUrl = previewImage || form.image;
  const cheapestTicket = [...ticketTypes]
    .filter((t) => t.price && !isNaN(Number(t.price)))
    .sort((a, b) => Number(a.price) - Number(b.price))[0];

  return (
    <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl overflow-hidden shadow-md shadow-black/40">
      {/* IMAGE */}
      <div className="relative h-40 w-full bg-neutral-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Previsualización del evento"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
            Sin imagen aún
          </div>
        )}

        {form.featured && (
          <span className="absolute top-3 left-3 bg-purple-600/90 text-[11px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide">
            Destacado
          </span>
        )}
      </div>

      {/* BODY */}
      <div className="p-4 space-y-3 text-sm">
        {/* Title + date */}
        <div>
          <h3 className="text-base font-semibold line-clamp-2">
            {form.title || "Nuevo evento sin título"}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDate(form.startAt)}
          </p>
        </div>

        {/* Location */}
        <div className="text-xs text-gray-300 space-y-0.5">
          {form.venueName && (
            <p className="font-medium">{form.venueName}</p>
          )}
          {(form.venueCity || form.venueProvince || form.venueCountry) && (
            <p className="text-gray-400">
              {[form.venueCity, form.venueProvince, form.venueCountry]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
          {form.venueAddress && (
            <p className="text-gray-500">{form.venueAddress}</p>
          )}
        </div>

        {/* Capacity & limits */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
          {form.capacity && (
            <span className="px-2 py-1 rounded-full bg-neutral-800/80 border border-neutral-700">
              Capacidad: {form.capacity} personas
            </span>
          )}

          {form.maxTicketsPerUser && (
            <span className="px-2 py-1 rounded-full bg-neutral-800/80 border border-neutral-700">
              Máx. {form.maxTicketsPerUser} tickets por usuario
            </span>
          )}
        </div>

        {/* Tickets */}
        <div className="border-t border-neutral-800 pt-3 space-y-1">
          <p className="text-xs font-semibold text-gray-200">
            Tipos de entrada
          </p>

          {ticketTypes.length === 0 ? (
            <p className="text-xs text-gray-500">
              Todavía no agregaste entradas.
            </p>
          ) : (
            <ul className="space-y-1 max-h-24 overflow-y-auto pr-1">
              {ticketTypes.map((t, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between text-xs bg-neutral-900/80 border border-neutral-700/70 rounded-lg px-2 py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full border border-neutral-700"
                      style={{ backgroundColor: t.color ?? "#9333EA" }}
                    />
                    <span className="font-medium">{t.name || "Sin nombre"}</span>
                  </div>
                  <div className="text-right text-[11px] text-gray-300">
                    {t.price
                      ? `$ ${Number(t.price).toLocaleString("es-AR")}`
                      : "Sin precio"}
                    {t.maxQuantity && (
                      <p className="text-[10px] text-gray-500">
                        Stock: {t.maxQuantity}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {cheapestTicket && (
            <p className="text-[11px] text-gray-400 mt-1">
              Desde{" "}
              <span className="font-semibold text-gray-200">
                ${" "}
                {Number(cheapestTicket.price).toLocaleString("es-AR", {
                  maximumFractionDigits: 0,
                })}
              </span>
            </p>
          )}
        </div>

        {/* Descriptions */}
        {(form.shortDescription || form.longDescription) && (
          <div className="border-t border-neutral-800 pt-3 space-y-1">
            <p className="text-xs font-semibold text-gray-200">
              Descripción
            </p>
            {form.shortDescription && (
              <p className="text-xs text-gray-300 line-clamp-2">
                {form.shortDescription}
              </p>
            )}
            {form.longDescription && (
              <p className="text-[11px] text-gray-500 line-clamp-3">
                {form.longDescription}
              </p>
            )}
          </div>
        )}

        {/* Extras */}
        <div className="border-t border-neutral-800 pt-3 space-y-1">
          <p className="text-xs font-semibold text-gray-200">Extras</p>
          <ul className="text-[11px] text-gray-400 space-y-0.5">
            {(form.openingTime || form.endingTime) && (
              <li>
                Horarios:{" "}
                {form.openingTime
                  ? `apertura ${form.openingTime}`
                  : "sin horario de apertura"}{" "}
                {form.endingTime && `· fin ${form.endingTime}`}
              </li>
            )}

            {form.spotifyPlaylistUrl && (
              <li className="text-emerald-300">
                Playlist de Spotify configurada
              </li>
            )}

            {form.venueMapUrl && (
              <li className="text-blue-300">
                Link de mapa agregado
              </li>
            )}
          </ul>
        </div>

        <button
          type="button"
          className="w-full mt-2 text-xs px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-gray-300 cursor-default"
        >
          Vista previa de público (simulada)
        </button>
      </div>
    </div>
  );
}
