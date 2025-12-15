"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CreateEventLayout, {
  CreateEventTab, } from "./components/CreateEventLayout";
import SectionInformation from "./components/SectionInformation";
import SectionTickets from "./components/SectionTickets";
import SectionLocation from "./components/SectionLocation";
import SectionImages from "./components/SectionImages";
import SectionSettings from "./components/SectionSettings";
import PreviewCard from "./components/PreviewCard";

export interface TicketTypeForm {
  name: string;
  price: string;
  maxQuantity: string;
  color?: string;
  description?: string;
  active?: boolean;
  order?: number;
}

export interface EventFormState {
  title: string;
  startAt: string;
  capacity: string;
  image: string;
  featured: boolean;

  shortDescription: string;
  longDescription: string;

  openingTime: string;
  endingTime: string;

  venueName: string;
  venueAddress: string;
  venuePostalCode: string;
  venueCity: string;
  venueProvince: string;
  venueCountry: string;
  venueMapUrl: string;

  serviceFeePercent: string;

  spotifyPlaylistUrl: string;
  maxTicketsPerUser: string;
}

export default function CreateEventPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<CreateEventTab>("info");

  // ================================
  // EVENT FORM STATE
  // ================================
  const [form, setForm] = useState<EventFormState>({
    title: "",
    startAt: "",
    capacity: "",
    image: "",
    featured: false,

    shortDescription: "",
    longDescription: "",

    openingTime: "",
    endingTime: "",

    venueName: "",
    venueAddress: "",
    venuePostalCode: "",
    venueCity: "",
    venueProvince: "",
    venueCountry: "",
    venueMapUrl: "",
    serviceFeePercent: "",

    spotifyPlaylistUrl: "",
    maxTicketsPerUser: "",
  });

  const [ticketTypes, setTicketTypes] = useState<TicketTypeForm[]>([
    {
      name: "General",
      price: "",
      maxQuantity: "",
      color: "#9333EA",
      description: "",
      active: true,
      order: 1,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [error, setError] = useState("");

  // ================================
  // HELPERS
  // ================================
  function updateForm<K extends keyof EventFormState>(
    field: K,
    value: EventFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleImagePreview(url: string) {
    updateForm("image", url);
    setPreviewImage(url);
  }

  // ================================
  // TICKET TYPE OPERATIONS
  // ================================
  function updateTicketType(
    index: number,
    field: keyof TicketTypeForm,
    value: string | number | boolean
  ) {
    setTicketTypes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value as any };
      return copy;
    });
  }

  function addTicketType() {
    setTicketTypes((prev) => [
      ...prev,
      {
        name: "",
        price: "",
        maxQuantity: "",
        color: "#9333EA",
        description: "",
        active: true,
        order: prev.length + 1,
      },
    ]);
  }

  function removeTicketType(index: number) {
    setTicketTypes((prev) => {
      if (prev.length === 1) return prev;
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((t, i) => ({ ...t, order: i + 1 }));
    });
  }

  // ================================
  // SUBMIT
  // ================================
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validación de ticket types
    const invalidType = ticketTypes.some(
      (t) =>
        !String(t.name).trim() ||
        !String(t.price).trim() ||
        isNaN(Number(t.price)) ||
        Number(t.price) <= 0 ||
        !String(t.maxQuantity).trim() ||
        isNaN(Number(t.maxQuantity)) ||
        Number(t.maxQuantity) <= 0
    );

    if (invalidType) {
      setError("Revisá los tipos de entrada: nombre, precio y stock válidos.");
      setLoading(false);
      return;
    }

    // Validación de fecha
    if (!form.startAt || isNaN(Date.parse(form.startAt))) {
      setError("La fecha y hora del evento no es válida.");
      setLoading(false);
      return;
    }

    try {
      const mappedTicketTypes = ticketTypes.map((t, index) => ({
        name: t.name.trim(),
        price: Number(t.price),
        stock: Number(t.maxQuantity),
        color: t.color ?? "#9333EA",
        description: t.description ?? "",
        active: t.active ?? true,
        order: t.order ?? index + 1,
      }));

      const payload = {
        title: form.title,
        startAt: form.startAt,
        capacity: Number(form.capacity),

        image: form.image.trim() || undefined,
        featured: form.featured,

        maxTicketsPerUser: form.maxTicketsPerUser
          ? Number(form.maxTicketsPerUser)
          : undefined,

        shortDescription: form.shortDescription.trim() || undefined,
        longDescription: form.longDescription.trim() || undefined,

        openingTime: form.openingTime.trim() || undefined,
        endingTime: form.endingTime.trim() || undefined,

        venueName: form.venueName.trim() || undefined,
        venueAddress: form.venueAddress.trim() || undefined,
        venuePostalCode: form.venuePostalCode.trim() || undefined,
        venueCity: form.venueCity.trim() || undefined,
        venueProvince: form.venueProvince.trim() || undefined,
        venueCountry: form.venueCountry.trim() || undefined,
        venueMapUrl: form.venueMapUrl.trim() || "",

         serviceFeePercent: form.serviceFeePercent
          ? Number(form.serviceFeePercent)
          : undefined,

        spotifyPlaylistUrl: form.spotifyPlaylistUrl.trim() || "",

        ticketTypes: mappedTicketTypes,
      };

      const res = await fetch("http://localhost:3001/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al crear el evento");
        setLoading(false);
        return;
      }

      router.push("/admin/events-manager");
    } catch (err) {
      console.error(err);
      setError("Error en el servidor");
    } finally {
      setLoading(false);
    }
  }

  // ================================
  // UI
  // ================================
  return (
    <main className="min-h-screen bg-black text-white pt-24 px-6 md:px-10 pb-10">
      <h1 className="text-3xl font-bold mb-6">Crear nuevo evento</h1>

      <form onSubmit={handleSubmit}>
        <CreateEventLayout
          activeTab={activeTab}
          onTabChange={setActiveTab}
          error={error}
          loading={loading}
          preview={
            <PreviewCard
              form={form}
              ticketTypes={ticketTypes}
              previewImage={previewImage}
            />
          }
        >
          {activeTab === "info" && (
            <SectionInformation form={form} onChange={updateForm} />
          )}

          {activeTab === "tickets" && (
            <SectionTickets
              ticketTypes={ticketTypes}
              updateTicketType={updateTicketType}
              addTicketType={addTicketType}
              removeTicketType={removeTicketType}
            />
          )}

          {activeTab === "location" && (
            <SectionLocation form={form} onChange={updateForm} />
          )}

          {activeTab === "images" && (
            <SectionImages
              form={form}
              onChange={updateForm}
              onPreview={handleImagePreview}
            />
          )}

          {activeTab === "settings" && (
            <SectionSettings form={form} onChange={updateForm} />
          )}
        </CreateEventLayout>

        {/* Error global + botón submit */}
        <div className="max-w-6xl mx-auto mt-6 space-y-3">
          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            disabled={loading}
            className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 disabled:opacity-60 px-8 py-3 rounded-lg text-lg font-semibold transition"
          >
            {loading ? "Creando..." : "Crear evento"}
          </button>
        </div>
      </form>
    </main>
  );
}
