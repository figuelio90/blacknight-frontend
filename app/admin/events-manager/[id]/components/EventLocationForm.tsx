"use client";

interface Props {
  event: any;
  setEvent: (value: any) => void;
}

export default function EventLocationForm({ event, setEvent }: Props) {

  // Normaliza: "" → undefined
  const clean = (val: string) =>
    val?.trim() === "" ? undefined : val;

  // Helper
  const update = (field: string, value: any) => {
    setEvent({ ...event, [field]: value });
  };

  // Validación suave URL
  const isValidUrl = (url: string) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-6">

      {/* Nombre del venue */}
      <div>
        <label className="text-sm text-neutral-400">Nombre del venue / lugar</label>
        <input
          className="w-full mt-1 p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white"
          placeholder="Ej: Estadio Municipal, Teatro del Sol"
          value={event.venueName || ""}
          onChange={(e) => update("venueName", clean(e.target.value))}
        />
      </div>

      {/* Dirección */}
      <div>
        <label className="text-sm text-neutral-400">Dirección</label>
        <input
          className="w-full mt-1 p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white"
          placeholder="Calle y número"
          value={event.venueAddress || ""}
          onChange={(e) => update("venueAddress", clean(e.target.value))}
        />
      </div>

      {/* Ciudad */}
      <div>
        <label className="text-sm text-neutral-400">Ciudad</label>
        <input
          className="w-full mt-1 p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white"
          placeholder="Ej: Jujuy, Córdoba, Tucumán"
          value={event.venueCity || ""}
          onChange={(e) => update("venueCity", clean(e.target.value))}
        />
      </div>

      {/* Provincia */}
      <div>
        <label className="text-sm text-neutral-400">Provincia</label>
        <input
          className="w-full mt-1 p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white"
          placeholder="Ej: Jujuy, Córdoba..."
          value={event.venueProvince || ""}
          onChange={(e) => update("venueProvince", clean(e.target.value))}
        />
      </div>

      {/* País */}
      <div>
        <label className="text-sm text-neutral-400">País</label>
        <input
          className="w-full mt-1 p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white"
          placeholder="Ej: Argentina"
          value={event.venueCountry || ""}
          onChange={(e) => update("venueCountry", clean(e.target.value))}
        />
      </div>

      {/* Código postal */}
      <div>
        <label className="text-sm text-neutral-400">Código postal</label>
        <input
          className="w-full mt-1 p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white"
          placeholder="Ej: 4600"
          value={event.venuePostalCode || ""}
          onChange={(e) => update("venuePostalCode", clean(e.target.value))}
        />
      </div>

      {/* Google Maps URL */}
      <div>
        <label className="text-sm text-neutral-400">URL de Google Maps</label>
        <input
          className={`w-full mt-1 p-3 rounded-xl bg-neutral-800 border ${
            isValidUrl(event.venueMapUrl || "")
              ? "border-neutral-700"
              : "border-red-500"
          } text-white`}
          placeholder="https://maps.google.com/..."
          value={event.venueMapUrl || ""}
          onChange={(e) => update("venueMapUrl", clean(e.target.value))}
        />
        {!isValidUrl(event.venueMapUrl || "") && (
          <p className="text-red-500 text-xs mt-1">
            URL inválida. Debe comenzar con https://
          </p>
        )}
      </div>

    </div>
  );
}
