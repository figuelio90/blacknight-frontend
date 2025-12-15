"use client";

import {
  Info,
  Ticket,
  MapPin,
  CalendarClock,
} from "lucide-react";

interface Props {
  selected: string;
  onSelect: (tab: string) => void;
}

export default function EventTabs({ selected, onSelect }: Props) {
  const tabs = [
    { id: "info", label: "Información", icon: Info },
    { id: "tickets", label: "Entradas", icon: Ticket },
    { id: "location", label: "Ubicación", icon: MapPin },
    { id: "schedule", label: "Horarios", icon: CalendarClock },
  ];

  return (
    <div className="w-64 bg-neutral-900/60 backdrop-blur-xl p-4 rounded-2xl border border-neutral-800 shadow-xl flex flex-col gap-2">
      <h2 className="text-neutral-400 text-xs font-semibold px-2 tracking-wider mb-2">
        CONFIGURACIÓN
      </h2>

      <div className="flex flex-col gap-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = selected === t.id;

          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`
                group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                transition-all duration-200 relative overflow-hidden
                ${
                  active
                    ? "bg-neutral-800 text-white border border-purple-600 shadow-lg shadow-purple-900/20"
                    : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                }
              `}
            >
              {/* Indicador lateral */}
              <span
                className={`
                  absolute left-0 top-0 h-full w-1 rounded-r-lg 
                  transition-all duration-300
                  ${active ? "bg-purple-500" : "group-hover:bg-neutral-500/40"}
                `}
              />

              {/* Icon */}
              <Icon size={18} className={active ? "text-purple-400" : "text-neutral-400"} />

              {/* Label */}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
