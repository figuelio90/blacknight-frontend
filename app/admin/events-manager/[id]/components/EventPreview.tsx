"use client";

interface EventPreviewProps {
  event: any;
}

export default function EventPreview({ event }: EventPreviewProps) {
  if (!event) return null;

  // Precio mínimo real
  const minPrice = event.ticketTypes?.length
    ? Math.min(...event.ticketTypes.map((t: any) => Number(t.price) || 0))
    : null;

  // Fecha formateada
  let formattedDate = "Sin fecha";
  if (event.startAt) {
    try {
      formattedDate = new Date(event.startAt).toLocaleString("es-AR", {
        dateStyle: "full",
        timeStyle: "short",
      });
    } catch {}
  }

  // Ubicación elegante
  const locationParts = [
    event.venueName,
    event.venueAddress,
    event.venueCity,
    event.venueProvince,
  ].filter(Boolean);

  const locationText =
    locationParts.length > 0 ? locationParts.join(", ") : "Ubicación no definida";

  return (
    <div className="w-full bg-neutral-900 rounded-2xl border border-neutral-800 p-4 h-fit sticky top-6">
      <h2 className="text-xl font-semibold mb-4 text-white">Vista previa</h2>

      {/* Imagen */}
      <div className="w-full h-56 rounded-xl overflow-hidden border border-neutral-700 mb-4">
        {event.image ? (
          <img
            src={event.image}
            alt="preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-500">
            Sin imagen
          </div>
        )}
      </div>

      <div className="space-y-4 text-neutral-300">

        {/* Título */}
        <div>
          <p className="text-sm text-neutral-500">Título</p>
          <p className="text-lg font-medium text-white">
            {event.title || "Sin título"}
          </p>
        </div>

        {/* Fecha */}
        <div>
          <p className="text-sm text-neutral-500">Fecha y hora</p>
          <p className="text-white">{formattedDate}</p>
        </div>

        {/* Horarios */}
        {(event.openingTime || event.endingTime) && (
          <div>
            <p className="text-sm text-neutral-500">Horarios</p>
            <p className="text-white">
              {event.openingTime && `Apertura: ${event.openingTime}`}{" "}
              {event.endingTime && ` · Cierre: ${event.endingTime}`}
            </p>
          </div>
        )}

        {/* Ubicación */}
        <div>
          <p className="text-sm text-neutral-500">Ubicación</p>
          <p className="text-white">{locationText}</p>

          {event.venueMapUrl && (
            <a
              href={event.venueMapUrl}
              target="_blank"
              className="text-purple-400 text-sm underline mt-1 inline-block"
            >
              Ver en Google Maps
            </a>
          )}
        </div>

        {/* Descripción corta */}
        {event.shortDescription && (
          <div>
            <p className="text-sm text-neutral-500">Descripción corta</p>
            <p className="text-white">{event.shortDescription}</p>
          </div>
        )}

        {/* Precio mínimo */}
        <div>
          <p className="text-sm text-neutral-500">Precio mínimo</p>
          <p className="text-white">
            {minPrice !== null ? `$${minPrice}` : "A definir"}
          </p>
        </div>

        {/* Máx. por usuario */}
        {event.maxTicketsPerUser && (
          <div>
            <p className="text-sm text-neutral-500">Máximo por usuario</p>
            <p className="text-white">{event.maxTicketsPerUser}</p>
          </div>
        )}

        {/* Tipos de entrada */}
        <div>
          <p className="text-sm text-neutral-500 mb-1">Tipos de entrada</p>

          {event.ticketTypes?.length ? (
            <div className="space-y-2">
              {event.ticketTypes
                .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
                .map((t: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-neutral-800 p-2 rounded-lg border border-neutral-700"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="text-white">{t.name}</span>
                    </div>

                    <span className="text-neutral-400 text-sm">
                      ${t.price} · Stock: {t.stock}
                      {!t.active && " (inactiva)"}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm">Sin tipos de entrada</p>
          )}
        </div>

        {/* Playlist */}
        {event.spotifyPlaylistUrl && (
          <div>
            <p className="text-sm text-neutral-500">Playlist</p>
            <a
              href={event.spotifyPlaylistUrl}
              target="_blank"
              className="text-purple-400 text-sm underline"
            >
              Abrir playlist
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
