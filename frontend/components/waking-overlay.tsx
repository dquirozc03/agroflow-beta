"use client";

import { Loader2 } from "lucide-react";
import { useBackendStatus } from "@/contexts/backend-status-context";

export function WakingOverlay() {
  const { isWaking, retryCount } = useBackendStatus();

  if (!isWaking) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-label="Servidor despertando"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/95 px-8 py-12 shadow-2xl shadow-black/40">
        {/* Línea de acento superior */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />

        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" aria-hidden />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/80 ring-2 ring-primary/30">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
            </div>
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Levantando servidor
            </h2>
            <p className="text-sm text-slate-400">
              El backend está despertando. Esto puede tomar hasta un minuto.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="flex gap-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${(retryCount - 1) % 3 === i ? "bg-primary" : "bg-slate-600"
                      }`}
                    aria-hidden
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500">
                Intento {retryCount}
              </span>
            </div>

            {/* Manual Dismiss for Dev/Debug */}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-xs text-slate-500 underline hover:text-slate-300"
            >
              Recargar página
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
