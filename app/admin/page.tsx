export default function AdminHome() {
  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold mb-4">
        Panel Admin — BlackNight
      </h1>

      <p className="text-gray-400">
        Bienvenido Lionel 👑  
        Gestioná eventos, ventas y tickets desde un solo lugar.
      </p>

      <div className="mt-8">
        <a
          href="/admin/events-manager"
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold"
        >
          Administrar Eventos
        </a>
      </div>
    </div>
  );
}
