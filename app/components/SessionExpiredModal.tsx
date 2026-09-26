"use client";

/**
 * SessionExpiredModal
 *
 * Displayed as a full-screen overlay when the ShoppingSession expires
 * (idle TTL of 5 min, absolute TTL of 15 min, or 410 from the backend).
 *
 * Gives the user two options:
 *  - "Intentar nuevamente" → navigates back to the event detail page so
 *    a fresh ShoppingSession can be created.
 *  - "Volver al inicio" → goes to the home page.
 */

import { motion, AnimatePresence } from "framer-motion";

interface SessionExpiredModalProps {
  open: boolean;
  eventId?: number | null;
  onGoToEvent: () => void;
  onGoHome: () => void;
}

export default function SessionExpiredModal({
  open,
  onGoToEvent,
  onGoHome,
}: SessionExpiredModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-expired-title"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-950 p-8 text-center shadow-2xl"
          >
            {/* Icon */}
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-3xl">
              ⏰
            </div>

            <h2
              id="session-expired-title"
              className="mb-2 text-xl font-bold text-white"
            >
              Tu sesión expiró
            </h2>

            <p className="mb-6 text-sm leading-relaxed text-gray-400">
              Las entradas reservadas temporalmente fueron liberadas por
              inactividad. Podés intentarlo nuevamente desde la página del
              evento.
            </p>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={onGoToEvent}
                className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
              >
                Intentar nuevamente
              </button>

              <button
                type="button"
                onClick={onGoHome}
                className="w-full rounded-xl border border-neutral-700 py-3 text-sm font-semibold text-gray-300 transition-colors hover:border-neutral-600 hover:text-white"
              >
                Volver al inicio
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
