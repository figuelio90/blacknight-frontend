"use client";

interface EventInfoFormProps {
  event: any;
  setEvent: (value: any) => void;
}

export default function EventInfoForm({ event, setEvent }: EventInfoFormProps) {
  // Helper para actualizar propiedades del evento
  function update(field: string, value: any) {
    setEvent({ ...event, [field]: value });
  }

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <label className="text-sm text-neutral-400">Título del evento</label>
        <input
          className="w-full mt-1 p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white"
          value={event.title || ""}
          onChange={(e) => update("title", e.target.value)}
        />
      </div>

      {/* Fecha y hora */}
      <div>
        <label className="text-sm text-neutral-400">Fecha y hora</label>
        <input
          type="datetime-local"
          className="w-full mt-1 p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white"
          value={event.startAt || ""}
          onChange={(e) => update("startAt", e.target.value)}
        />
      </div>

      {/* Capacidad */}
      <div>
        <label className="text-sm text-neutral-400">Capacidad total</label>
        <input
          type="number"
          className="w-full mt-1 p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white"
          value={event.capacity || ""}
          min={1}
          onChange={(e) =>
            update("capacity", Math.max(1, Number(e.target.value)))
          }
        />
      </div>

      {/* Máximo por usuario */}
      <div>
        <label className="text-sm text-neutral-400">Máximo de entradas por usuario</label>
        <input
          type="number"
          className="w-full mt-1 p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white"
          value={event.maxTicketsPerUser || ""}
          min={1}
          onChange={(e) =>
            update("maxTicketsPerUser", Math.max(1, Number(e.target.value)))
          }
        />
      </div>

      {/* Descripción corta */}
      <div>
        <label className="text-sm text-neutral-400">Descripción corta</label>
        <input
          className="w-full mt-1 p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white"
          placeholder="Una frase breve para enganchar al público"
          value={event.shortDescription || ""}
          onChange={(e) =>
            update("shortDescription", e.target.value)
          }
        />
      </div>

      {/* Descripción larga */}
      <div>
        <label className="text-sm text-neutral-400">Descripción larga</label>
        <textarea
          className="w-full mt-1 p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white min-h-[130px]"
          placeholder="Contale a la gente qué pueden esperar del evento..."
          value={event.longDescription || ""}
          onChange={(e) =>
            update("longDescription", e.target.value)
          }
        />
      </div>

      {/* Imagen */}
      <div>
        <label className="text-sm text-neutral-400">Imagen principal (URL)</label>
        <input
          className="w-full mt-1 p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white"
          placeholder="https://example.com/mi-evento.jpg"
          value={event.image || ""}
          onChange={(e) => update("image", e.target.value)}
        />

        {/* Previsualización */}
        {event.image && (
          <img
            src={event.image}
            alt="preview"
            className="mt-3 w-full h-48 object-cover rounded-xl border border-neutral-700 shadow-md"
          />
        )}
      </div>

      {/* Destacado */}
      <div className="flex items-center gap-3 mt-2">
        <input
          type="checkbox"
          checked={Boolean(event.featured)}
          onChange={(e) => update("featured", e.target.checked)}
          className="w-4 h-4"
        />
        <span className="text-sm text-neutral-300">Evento destacado (se muestra primero en la home)</span>
      </div>

      {/* Playlist Spotify */}
      <div>
        <label className="text-sm text-neutral-400">Playlist de Spotify (opcional)</label>
        <input
          className="w-full mt-1 p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white"
          placeholder="https://open.spotify.com/playlist/xxxx"
          value={event.spotifyPlaylistUrl || ""}
          onChange={(e) =>
            update("spotifyPlaylistUrl", e.target.value)
          }
        />
      </div>
    </div>
  );
}
