"use client";

import { EventFormState } from "../page";
import { formatFileSize } from "../../coverUpload";

interface Props {
  form: EventFormState;
  onChange: <K extends keyof EventFormState>(
    field: K,
    value: EventFormState[K]
  ) => void;
  coverFile: File | null;
  coverError: string;
  submitStatus: "idle" | "uploading" | "saving";
  onCoverSelect: (file: File) => void;
}

export default function SectionImages({
  form,
  onChange,
  coverFile,
  coverError,
  submitStatus,
  onCoverSelect,
}: Props) {
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
            Portada del evento
          </label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            className="block w-full text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-purple-700"
            disabled={submitStatus !== "idle"}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onCoverSelect(file);
              e.currentTarget.value = "";
            }}
          />
          <p className="text-[11px] text-gray-500 mt-1">
            JPEG, PNG o WebP. Máximo 5 MiB. Podés elegir otra imagen antes de guardar.
          </p>

          {coverFile && (
            <div className="mt-3 rounded-lg border border-green-800/60 bg-green-950/30 px-3 py-2 text-xs text-green-300">
              <p className="font-semibold">Imagen seleccionada</p>
              <p className="mt-1 break-all">
                {coverFile.name} · {formatFileSize(coverFile.size)}
              </p>
            </div>
          )}

          {submitStatus === "uploading" && (
            <p className="mt-2 text-xs text-purple-300">Subiendo imagen...</p>
          )}

          {submitStatus === "saving" && (
            <p className="mt-2 text-xs text-gray-300">Guardando evento...</p>
          )}

          {coverError && (
            <p className="mt-2 text-xs text-red-400">
              Error de subida: {coverError}
            </p>
          )}
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
