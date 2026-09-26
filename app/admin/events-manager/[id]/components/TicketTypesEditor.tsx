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

type TicketType = {
  id?: number;
  name: string;
  price: number;
  stock: number;
  color?: string;
  description?: string;
  active: boolean;
  order?: number;
};

export default function TicketTypesEditor({ event, setEvent }: Props) {
  const ticketTypes: TicketType[] = event.ticketTypes || [];

  function addType() {
    const newType: TicketType = {
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

  function updateType(idx: number, field: string, value: any) {
    let updated = [...ticketTypes];

    if (field === "price" || field === "stock") {
      value = Math.max(1, Number(value) || 1);
    }

    (updated[idx] as any)[field] = value;

    if (field === "order") {
      const destination = Math.min(
        ticketTypes.length,
        Math.max(1, Number(value) || 1)
      );
      const [moved] = updated.splice(idx, 1);
      updated.splice(destination - 1, 0, moved);
      updated = updated.map((type, index) => ({ ...type, order: index + 1 }));
    }

    setEvent({ ...event, ticketTypes: updated });
  }

  function removeType(idx: number) {
    const selected = ticketTypes[idx];
    let updated = selected.id
      ? ticketTypes.map((type, index) =>
          index === idx ? { ...type, active: false } : type
        )
      : ticketTypes.filter((_: TicketType, index: number) => index !== idx);

    updated = updated.map((t: TicketType, i: number) => ({
      ...t,
      order: i + 1,
    }));

    setEvent({ ...event, ticketTypes: updated });
  }

  const assignedStock = ticketTypes.reduce(
    (sum, type) => sum + (type.active ? type.stock : 0),
    0
  );

  return (
    <div className="space-y-6">
      <button
        onClick={addType}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 rounded-xl text-white hover:bg-purple-700"
      >
        <Plus size={18} />
        Agregar tipo de entrada
      </button>

      <p
        className={`text-sm ${
          assignedStock > event.capacity ? "text-red-400" : "text-neutral-400"
        }`}
      >
        Stock activo asignado: {assignedStock} / {event.capacity}
      </p>

      {ticketTypes.map((t: TicketType, idx: number) => (
        <div
          key={t.id ?? `new-${idx}`}
          className="space-y-4 rounded-xl border border-neutral-700 bg-neutral-900 p-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm text-neutral-300">
              Nombre
              <input
                value={t.name}
                onChange={(event) => updateType(idx, "name", event.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 p-2 text-white"
              />
            </label>

            <label className="text-sm text-neutral-300">
              Precio (ARS)
              <input
                type="number"
                min={1}
                step={1}
                value={t.price}
                onChange={(event) => updateType(idx, "price", event.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 p-2 text-white"
              />
            </label>

            <label className="text-sm text-neutral-300">
              Stock
              <input
                type="number"
                min={1}
                step={1}
                value={t.stock}
                onChange={(event) => updateType(idx, "stock", event.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 p-2 text-white"
              />
            </label>

            <label className="text-sm text-neutral-300">
              Orden
              <input
                type="number"
                min={1}
                max={ticketTypes.length}
                step={1}
                value={t.order ?? idx + 1}
                onChange={(event) => updateType(idx, "order", event.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 p-2 text-white"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-sm text-neutral-300">
              Color
              <input
                type="color"
                value={t.color ?? "#9333EA"}
                onChange={(event) => updateType(idx, "color", event.target.value)}
                className="h-9 w-12 rounded border border-neutral-700 bg-neutral-800"
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-neutral-300">
              <input
                type="checkbox"
                checked={t.active}
                onChange={(event) => updateType(idx, "active", event.target.checked)}
              />
              Activa
            </label>

            <button
              type="button"
              onClick={() => removeType(idx)}
              className="flex items-center gap-2 rounded-lg bg-red-900/60 px-3 py-2 text-sm text-red-200 hover:bg-red-900"
            >
              <Trash2 size={16} />
              {t.id ? "Desactivar" : "Quitar"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
