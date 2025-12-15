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
      updated[idx].order = Math.max(1, Number(value) || 1);

      updated = updated
        .map((t) => ({ ...t }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((t, i) => ({ ...t, order: i + 1 }));
    }

    setEvent({ ...event, ticketTypes: updated });
  }

  function removeType(idx: number) {
    let updated = ticketTypes.filter(
      (_: TicketType, i: number) => i !== idx
    );

    updated = updated.map((t: TicketType, i: number) => ({
      ...t,
      order: i + 1,
    }));

    setEvent({ ...event, ticketTypes: updated });
  }

  return (
    <div className="space-y-6">
      <button
        onClick={addType}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 rounded-xl text-white hover:bg-purple-700"
      >
        <Plus size={18} />
        Agregar tipo de entrada
      </button>

      {ticketTypes.map((t: TicketType, idx: number) => (
        <div key={t.id ?? `new-${idx}`}>
          {/* resto sin cambios */}
        </div>
      ))}
    </div>
  );
}
