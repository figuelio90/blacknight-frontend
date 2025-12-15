"use client";

interface Props {
  event: any;
  setEvent: (value: any) => void;
}

export default function EventScheduleForm({ event, setEvent }: Props) {
  const update = (field: string, value: any) => {
    setEvent({ ...event, [field]: value });
  };

  return (
    <div className="space-y-6">

      {/* Fecha y hora del evento */}
      <div>
        <label className="text-sm text-neutral-400">Fecha y hora del evento</label>
        <input
          type="datetime-local"
          className="w-full mt-1 p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white"
          value={event.startAt || ""}
          onChange={(e) => update("startAt", e.target.value || undefined)}
        />
      </div>

      {/* Hora de apertura */}
      <div>
        <label className="text-sm text-neutral-400">Hora de apertura</label>
        <input
          type="time"
          className="w-full mt-1 p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white"
          value={event.openingTime || ""}
          onChange={(e) => update("openingTime", e.target.value || undefined)}
        />
      </div>

      {/* Hora de cierre */}
      <div>
        <label className="text-sm text-neutral-400">Hora de cierre</label>
        <input
          type="time"
          className="w-full mt-1 p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white"
          value={event.endingTime || ""}
          onChange={(e) => update("endingTime", e.target.value || undefined)}
        />
      </div>

      {/* Duración estimada */}
      {event.startAt && event.endingTime && (
        <div className="text-neutral-400 text-sm p-3 bg-neutral-900 rounded-xl border border-neutral-800">
          Duración aproximada:{" "}
          <span className="text-white">
            {calculateDuration(event.startAt, event.endingTime)}
          </span>
        </div>
      )}
    </div>
  );
}

// =====================================
// ✔ Función mejorada de duración
// =====================================
function calculateDuration(startAt: string, endTime: string) {
  try {
    const start = new Date(startAt);
    if (isNaN(start.getTime())) return "sin definir";

    const [endH, endM] = endTime.split(":").map(Number);
    if (isNaN(endH) || isNaN(endM)) return "sin definir";

    const end = new Date(start);
    end.setHours(endH, endM, 0, 0);

    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }

    const diffMs = end.getTime() - start.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    const hours = Math.floor(diffMin / 60);
    const minutes = diffMin % 60;

    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  } catch {
    return "sin definir";
  }
}
