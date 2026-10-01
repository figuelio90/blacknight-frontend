/** Uses the existing cart notice banner styles. */
export default function AvailabilityNotice({
  message,
  refreshing,
  onRetry,
}: {
  message: string | null;
  refreshing: boolean;
  onRetry?: () => void;
}) {
  if (!message) return null;
  return (
    <div role="status" aria-live="polite" className="rounded-lg border border-amber-700/60 bg-amber-950/40 p-3 text-sm text-amber-200">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} disabled={refreshing} className="mt-2 underline disabled:opacity-40">
          Actualizar disponibilidad
        </button>
      )}
    </div>
  );
}
