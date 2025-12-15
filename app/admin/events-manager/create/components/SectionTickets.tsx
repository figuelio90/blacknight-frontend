"use client";

import { TicketTypeForm } from "../page";

interface Props {
  ticketTypes: TicketTypeForm[];
  updateTicketType: (
    index: number,
    field: keyof TicketTypeForm,
    value: string | number | boolean
  ) => void;
  addTicketType: () => void;
  removeTicketType: (index: number) => void;
}

export default function SectionTickets({
  ticketTypes,
  updateTicketType,
  addTicketType,
  removeTicketType,
}: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-1">Tipos de entrada</h2>
        <p className="text-xs text-gray-400">
          Configurá las entradas que se podrán comprar para este evento.
        </p>
      </div>

      <div className="space-y-5">
        {ticketTypes.map((t, index) => (
          <div
            key={index}
            className="bg-neutral-900/80 border border-neutral-700 rounded-xl p-4 space-y-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border border-neutral-600"
                  style={{ backgroundColor: t.color ?? "#9333EA" }}
                />
                <input
                  type="text"
                  className="input h-9"
                  placeholder="Nombre de la entrada (Ej: General, VIP)"
                  value={t.name}
                  onChange={(e) =>
                    updateTicketType(index, "name", e.target.value)
                  }
                  required
                />
              </div>

              <button
                type="button"
                onClick={() => removeTicketType(index)}
                className="text-xs text-red-400 hover:text-red-300"
                disabled={ticketTypes.length === 1}
              >
                Eliminar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs mb-1 text-gray-300">
                  Precio (ARS)
                </label>
                <input
                  type="number"
                  className="input"
                  value={t.price}
                  onChange={(e) =>
                    updateTicketType(index, "price", e.target.value)
                  }
                  min={1}
                  required
                />
              </div>

              <div>
                <label className="block text-xs mb-1 text-gray-300">
                  Stock
                </label>
                <input
                  type="number"
                  className="input"
                  value={t.maxQuantity}
                  onChange={(e) =>
                    updateTicketType(index, "maxQuantity", e.target.value)
                  }
                  min={1}
                  required
                />
              </div>

              <div>
                <label className="block text-xs mb-1 text-gray-300">
                  Orden
                </label>
                <input
                  type="number"
                  className="input"
                  value={t.order ?? index + 1}
                  onChange={(e) =>
                    updateTicketType(
                      index,
                      "order",
                      Number(e.target.value)
                    )
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-[auto,1fr] gap-3 items-center">
              <div>
                <label className="block text-xs mb-1 text-gray-300">
                  Color
                </label>
                <input
                  type="color"
                  className="w-12 h-9 rounded cursor-pointer"
                  value={t.color ?? "#9333EA"}
                  onChange={(e) =>
                    updateTicketType(index, "color", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-300">
                  Descripción (opcional)
                </label>
                <textarea
                  className="input h-16"
                  value={t.description ?? ""}
                  onChange={(e) =>
                    updateTicketType(
                      index,
                      "description",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-gray-300">
              <input
                type="checkbox"
                checked={t.active ?? true}
                onChange={(e) =>
                  updateTicketType(index, "active", e.target.checked)
                }
              />
              Entrada activa
            </label>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addTicketType}
        className="mt-2 px-4 py-2 rounded-lg bg-neutral-900 border border-dashed border-neutral-600 text-xs hover:border-purple-500 hover:bg-neutral-900/80"
      >
        + Agregar tipo de entrada
      </button>
    </div>
  );
}
