"use client";

import { Plus, Trash2 } from "lucide-react";

interface Props {
  event: any;
  setEvent: (value: any) => void;
}

const COLORS = [
  "#9333EA",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#6366F1",
  "#EC4899",
  "#14B8A6",
];

export default function TicketTypesEditor({ event, setEvent }: Props) {
  const ticketTypes = event.ticketTypes || [];

  // ➕ Agregar nuevo tipo
  function addType() {
    const newType = {
      id: undefined,
      name: "",
      price: 1,
      stock: 1,
      color: "#9333EA",
      description: "",
      active: true,
      order: ticketTypes.length + 1,
    };

    setEvent({
      ...event,
      ticketTypes: [...ticketTypes, newType],
    });
  }

  // ✏️ Actualizar campo con validaciones
  function updateType(idx: number, field: string, value: any) {
    let updated = [...ticketTypes];

    // Normalizar datos numéricos
    if (field === "price" || field === "stock") {
      value = Math.max(1, Number(value) || 1); // valor mínimo = 1
    }

    updated[idx][field] = value;

    // Si se edita el order → reordenar lista
    if (field === "order") {
      updated[idx].order = Math.max(1, Number(value) || 1);

      updated = updated
        .map((t) => ({ ...t }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      // Corregir duplicados + reindexar
      updated = updated.map((t, i) => ({
        ...t,
        order: i + 1,
      }));
    }

    setEvent({ ...event, ticketTypes: updated });
  }

  // 🗑️ Eliminar tipo
  function removeType(idx: number) {
    let updated = ticketTypes.filter((t, i) => i !== idx);

    updated = updated.map((t, i) => ({
      ...t,
      order: i + 1, // Reindexación
    }));

    setEvent({ ...event, ticketTypes: updated });
  }

  return (
    <div className="space-y-6">

      {/* Botón Agregar */}
      <button
        onClick={addType}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 rounded-xl text-white shadow-md hover:bg-purple-700 transition"
      >
        <Plus size={18} />
        Agregar tipo de entrada
      </button>

      {/* Lista */}
      {ticketTypes.length === 0 && (
        <p className="text-neutral-400">No hay tipos de entrada aún.</p>
      )}

      {ticketTypes.map((t: any, idx: number) => (
        <div
          key={t.id ?? `new-${idx}`}
          className="border border-neutral-700 bg-neutral-900 rounded-2xl p-5 space-y-4"
        >
          {/* Header */}
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-white text-lg">
              Entrada #{idx + 1}
            </h3>

            <button
              onClick={() => removeType(idx)}
              className="p-2 rounded-lg hover:bg-red-900/40 transition"
            >
              <Trash2 size={18} className="text-red-400" />
            </button>
          </div>

          {/* Nombre */}
          <div>
            <label className="text-sm text-neutral-400">Nombre</label>
            <input
              className="input"
              placeholder="Ej: General, VIP..."
              value={t.name}
              onChange={(e) => updateType(idx, "name", e.target.value)}
            />
          </div>

          {/* Precio */}
          <div>
            <label className="text-sm text-neutral-400">Precio (ARS)</label>
            <input
              type="number"
              className="input"
              value={t.price}
              onChange={(e) => updateType(idx, "price", e.target.value)}
              min={1}
            />
          </div>

          {/* Stock */}
          <div>
            <label className="text-sm text-neutral-400">Stock</label>
            <input
              type="number"
              className="input"
              value={t.stock}
              onChange={(e) => updateType(idx, "stock", e.target.value)}
              min={1}
            />
          </div>

          {/* Orden */}
          <div>
            <label className="text-sm text-neutral-400">
              Orden de visualización
            </label>
            <input
              type="number"
              className="input"
              value={t.order}
              onChange={(e) => updateType(idx, "order", e.target.value)}
              min={1}
            />
          </div>

          {/* Activo */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={t.active}
              onChange={(e) => updateType(idx, "active", e.target.checked)}
            />
            <span>Activo</span>
          </label>

          {/* Descripción */}
          <div>
            <label className="text-sm text-neutral-400">
              Descripción (opcional)
            </label>
            <textarea
              className="input min-h-[80px]"
              value={t.description}
              onChange={(e) => updateType(idx, "description", e.target.value)}
            />
          </div>

          {/* Colores */}
          <div>
            <label className="text-sm text-neutral-400">Color</label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => updateType(idx, "color", c)}
                  className={`
                    w-8 h-8 rounded-full border-2 transition
                    ${t.color === c ? "border-white scale-110" : "border-neutral-700"}
                  `}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
