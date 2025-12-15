"use client";

import { EventFormState } from "../page";
import useAuth from "@/app/hooks/useAuth";

interface Props {
  form: EventFormState;
  onChange: <K extends keyof EventFormState>(
    field: K,
    value: EventFormState[K]
  ) => void;
}

export default function SectionSettings({ form, onChange }: Props) {
  const { user } = useAuth();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-1">
          Configuración adicional
        </h2>
        <p className="text-xs text-gray-400">
          Límites por usuario, comisiones y detalles complementarios del evento.
        </p>
      </div>

      <div className="space-y-4">

        {/* ================================================== */}
        {/* 🟣 MAX TICKETS PER USER */}
        {/* ================================================== */}
        <div>
          <label className="block text-xs mb-1 text-gray-300">
            Entradas máximas por usuario (opcional)
          </label>
          <input
            type="number"
            className="input"
            value={form.maxTicketsPerUser}
            onChange={(e) =>
              onChange("maxTicketsPerUser", e.target.value)
            }
            placeholder="Ej: 4"
            min={1}
          />
          <p className="text-[11px] text-gray-500 mt-1">
            Si lo dejás vacío, no se limitará la cantidad de entradas por usuario.
          </p>
        </div>

        {/* ================================================== */}
        {/* 🔥 SERVICE FEE — ONLY ADMIN */}
        {/* ================================================== */}
        {user?.role === "ADMIN" && (
          <div>
            <label className="block text-xs mb-1 text-gray-300">
              Comisión de servicio (%) — solo administrador
            </label>
            <input
              type="number"
              className="input"
              placeholder="Ej: 8"
              min={0}
              max={100}
              step="0.1"
              value={form.serviceFeePercent}
              onChange={(e) =>
                onChange("serviceFeePercent", e.target.value)
              }
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Este porcentaje se sumará al total del usuario como cargo por servicio.
              No afecta la ganancia del organizador.
            </p>
          </div>
        )}

        {/* ================================================== */}
        {/* 🎵 SPOTIFY FIELD */}
        {/* ================================================== */}
        <div>
          <label className="block text-xs mb-1 text-gray-300">
            Playlist de Spotify (opcional)
          </label>
          <input
            type="text"
            className="input"
            placeholder="https://open.spotify.com/playlist/..."
            value={form.spotifyPlaylistUrl}
            onChange={(e) =>
              onChange("spotifyPlaylistUrl", e.target.value)
            }
          />
          <p className="text-[11px] text-gray-500 mt-1">
            Podés asociar una playlist para ambientar la ficha del evento.
          </p>
        </div>
      </div>
    </div>
  );
}
