const MAX_COVER_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_COVER_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

interface CoverUploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  objectKey: string;
  requiredHeaders: Record<string, string>;
  expiresIn: number;
}

async function getErrorMessage(response: Response, fallback: string) {
  const data = await response.json().catch(() => null);
  return data?.error || fallback;
}

export function validateCoverFile(file: File) {
  if (!ALLOWED_COVER_TYPES.has(file.type)) {
    return "La portada debe ser un archivo JPEG, PNG o WebP.";
  }

  if (file.size > MAX_COVER_SIZE_BYTES) {
    return "La portada no puede superar los 5 MiB.";
  }

  return null;
}

export function formatFileSize(sizeBytes: number) {
  return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MiB`;
}

export async function uploadEventCover(
  file: File
): Promise<CoverUploadUrlResponse> {
  const presignResponse = await fetch("/api/admin/events/cover-upload-url", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contentType: file.type,
      sizeBytes: file.size,
    }),
  });

  if (!presignResponse.ok) {
    throw new Error(
      await getErrorMessage(
        presignResponse,
        "No se pudo preparar la subida de la portada."
      )
    );
  }

  const uploadData = (await presignResponse.json()) as CoverUploadUrlResponse;

  if (
    !uploadData.uploadUrl ||
    !uploadData.publicUrl ||
    !uploadData.objectKey ||
    !uploadData.requiredHeaders
  ) {
    throw new Error("La respuesta para subir la portada no es válida.");
  }

  const uploadResponse = await fetch(uploadData.uploadUrl, {
    method: "PUT",
    headers: uploadData.requiredHeaders,
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("No se pudo subir la portada seleccionada.");
  }

  return uploadData;
}
