"use client";

import { EventFormState } from "../page";

interface Props {
  form: EventFormState;
  onChange: <K extends keyof EventFormState>(
    field: K,
    value: EventFormState[K]
  ) => void;
}

export default function SectionLocation({ form, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-1">Ubicación</h2>
        <p className="text-xs text-gray-400">
          Datos del lugar donde se realizará el evento.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs mb-1 text-gray-300">
            Nombre del lugar
          </label>
          <input
            type="text"
            className="input"
            placeholder="Ej: Quality Arena"
            value={form.venueName}
            onChange={(e) => onChange("venueName", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs mb-1 text-gray-300">
            Dirección
          </label>
          <input
            type="text"
            className="input"
            placeholder="Calle, número, etc."
            value={form.venueAddress}
            onChange={(e) => onChange("venueAddress", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs mb-1 text-gray-300">
              Código postal
            </label>
            <input
              type="text"
              className="input"
              value={form.venuePostalCode}
              onChange={(e) =>
                onChange("venuePostalCode", e.target.value)
              }
            />
          </div>

          <div>
            <label className="block text-xs mb-1 text-gray-300">
              Ciudad
            </label>
            <input
              type="text"
              className="input"
              value={form.venueCity}
              onChange={(e) => onChange("venueCity", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs mb-1 text-gray-300">
              Provincia
            </label>
            <input
              type="text"
              className="input"
              value={form.venueProvince}
              onChange={(e) =>
                onChange("venueProvince", e.target.value)
              }
            />
          </div>
        </div>

        <div>
          <label className="block text-xs mb-1 text-gray-300">
            País
          </label>
          <input
            type="text"
            className="input"
            value={form.venueCountry}
            onChange={(e) => onChange("venueCountry", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs mb-1 text-gray-300">
            Link de Google Maps (opcional)
          </label>
          <input
            type="text"
            className="input"
            placeholder="https://maps.google.com/..."
            value={form.venueMapUrl}
            onChange={(e) => onChange("venueMapUrl", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
