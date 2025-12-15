"use client";

import { EventFormState } from "../page";

interface Props {
  form: EventFormState;
  onChange: <K extends keyof EventFormState>(
    field: K,
    value: EventFormState[K]
  ) => void;
}

export default function SectionInformation({ form, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">
          Información general
        </h2>
        <p className="text-xs text-gray-400">
          Definí el nombre del evento, la fecha y la capacidad.
        </p>
      </div>

      <div className="space-y-4">
        {/* Título */}
        <div>
          <label className="block text-xs mb-1 text-gray-300">
            Título del evento
          </label>
          <input
            type="text"
            className="input"
            value={form.title}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder="Ej: Hardcash - Fiesta electrónica"
            required
          />
        </div>

        {/* Fecha / capacidad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs mb-1 text-gray-300">
              Fecha y hora
            </label>
            <input
              type="datetime-local"
              className="input"
              value={form.startAt}
              onChange={(e) => onChange("startAt", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs mb-1 text-gray-300">
              Capacidad total
            </label>
            <input
              type="number"
              className="input"
              value={form.capacity}
              onChange={(e) => onChange("capacity", e.target.value)}
              placeholder="Ej: 500"
              min={1}
              required
            />
          </div>
        </div>

        {/* Horarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs mb-1 text-gray-300">
              Horario de apertura (opcional)
            </label>
            <input
              type="time"
              className="input"
              value={form.openingTime}
              onChange={(e) => onChange("openingTime", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-gray-300">
              Horario de cierre (opcional)
            </label>
            <input
              type="time"
              className="input"
              value={form.endingTime}
              onChange={(e) => onChange("endingTime", e.target.value)}
            />
          </div>
        </div>

        {/* Descripciones */}
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-xs mb-1 text-gray-300">
              Descripción corta
            </label>
            <textarea
              className="input h-20"
              placeholder="Texto breve para mostrar en la tarjeta del evento."
              value={form.shortDescription}
              onChange={(e) =>
                onChange("shortDescription", e.target.value)
              }
            />
          </div>

          <div>
            <label className="block text-xs mb-1 text-gray-300">
              Descripción larga
            </label>
            <textarea
              className="input h-28"
              placeholder="Detalle completo del evento, line up, dress code, etc."
              value={form.longDescription}
              onChange={(e) =>
                onChange("longDescription", e.target.value)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
