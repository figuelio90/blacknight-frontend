"use client";

import { EventFormState } from "../page";

interface Props {
  form: EventFormState;
  onChange: <K extends keyof EventFormState>(
    field: K,
    value: EventFormState[K]
  ) => void;
  onPreview: (url: string) => void;
}

export default function SectionImages({ form, onChange, onPreview }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-1">Imágenes</h2>
        <p className="text-xs text-gray-400">
          Definí la imagen principal del evento que se mostrará en el
          listado y la ficha.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs mb-1 text-gray-300">
            URL de la imagen principal
          </label>
          <input
            type="text"
            className="input"
            placeholder="https://..."
            value={form.image}
            onChange={(e) => {
              onChange("image", e.target.value);
              onPreview(e.target.value);
            }}
          />
          <p className="text-[11px] text-gray-500 mt-1">
            Idealmente, imágenes horizontales de buena resolución.
          </p>
        </div>

        <label className="flex items-center gap-2 text-xs text-gray-300 pt-2 border-t border-neutral-800">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => onChange("featured", e.target.checked)}
          />
          Marcar este evento como destacado en el home.
        </label>
      </div>
    </div>
  );
}
