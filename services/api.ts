export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const res = await fetch(endpoint, {
    ...options,
    credentials: "include", // 🔑 cookies SIEMPRE
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Error en la API");
  }

  return res.json();
}
