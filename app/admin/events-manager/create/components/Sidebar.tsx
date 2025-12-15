"use client";

import { CreateEventTab } from "./CreateEventLayout";

interface SidebarProps {
  activeTab: CreateEventTab;
  onTabChange: (tab: CreateEventTab) => void;
}

const items: { id: CreateEventTab; label: string; description: string }[] = [
  {
    id: "info",
    label: "Información",
    description: "Título, fecha, capacidad y descripción",
  },
  {
    id: "tickets",
    label: "Entradas",
    description: "Tipos de tickets, precios y stock",
  },
  {
    id: "location",
    label: "Ubicación",
    description: "Lugar, dirección y mapa",
  },
  {
    id: "images",
    label: "Imágenes",
    description: "Portada y elementos visuales",
  },
  {
    id: "settings",
    label: "Configuración",
    description: "Límites por usuario, playlist, destacado",
  },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <nav className="bg-neutral-950/90 border-b lg:border-b-0 lg:border-r border-neutral-800 p-4 space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
        Crear evento
      </h2>

      <div className="space-y-1">
        {items.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`w-full text-left rounded-xl px-3 py-2.5 text-sm transition border ${
                active
                  ? "bg-purple-600/15 border-purple-500/70 text-purple-100 shadow-sm"
                  : "bg-transparent border-transparent hover:bg-neutral-900 hover:border-neutral-700 text-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{item.label}</span>
                {active && (
                  <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {item.description}
              </p>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
