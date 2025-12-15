"use client";

import Sidebar from "./Sidebar";
import { ReactNode } from "react";

export type CreateEventTab =
  | "info"
  | "tickets"
  | "location"
  | "images"
  | "settings";

interface Props {
  activeTab: CreateEventTab;
  onTabChange: (tab: CreateEventTab) => void;
  children: ReactNode;
  preview: ReactNode;
  error?: string;
  loading?: boolean;
}

export default function CreateEventLayout({
  activeTab,
  onTabChange,
  children,
  preview,
  error,
  loading,
}: Props) {
  return (
    <div className="w-full max-w-[1400px] mx-auto mt-6 mb-12">

      {/* 💥 Layout idéntico al de Editar Evento */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_350px] gap-8">

        {/* Sidebar */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
          <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
        </div>

        {/* Formulario */}
        <div className="space-y-6 bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
          {error && (
            <div className="text-sm text-red-400 bg-red-950/30 border border-red-700/50 rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
          )}

          {children}

          {loading && (
            <p className="text-xs text-gray-400 mt-2">
              Guardando cambios...
            </p>
          )}
        </div>

        {/* Preview */}
        <aside className="hidden lg:block bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">
            Vista previa
          </h2>
          {preview}
        </aside>

      </div>
    </div>
  );
}
