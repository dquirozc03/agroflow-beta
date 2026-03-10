"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type RegistroEstadoUI =
  | "PENDIENTE"
  | "PROCESADO"
  | "CERRADO"
  | "ANULADO"
  | "OBSERVADO"
  | "DESCONOCIDO";

/**
 * Normaliza estados provenientes del backend (p.ej. "borrador", "cerrado")
 * y/o estados UI de la sesión (p.ej. "PROCESADO").
 */
export function normalizeEstado(estadoRaw: unknown): RegistroEstadoUI {
  const s = String(estadoRaw ?? "").trim().toLowerCase();

  if (!s) return "DESCONOCIDO";

  // Backend actual
  if (s === "borrador") return "PENDIENTE";
  if (s === "cerrado") return "CERRADO";

  // Futuros (y/o UI)
  if (s === "pendiente") return "PENDIENTE";
  if (s === "procesado") return "PROCESADO";
  if (s === "anulado") return "ANULADO";
  if (s === "observado") return "OBSERVADO";

  return "DESCONOCIDO";
}

function estadoStyle(e: RegistroEstadoUI) {
  switch (e) {
    case "PENDIENTE":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400";
    case "PROCESADO":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400";
    case "CERRADO":
      return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400";
    case "ANULADO":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400";
    case "OBSERVADO":
      return "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/30 dark:bg-indigo-950/20 dark:text-indigo-400";
    default:
      return "border-border bg-muted/30 text-muted-foreground";
  }
}

export function EstadoBadge({
  estado,
  className,
}: {
  estado: unknown;
  className?: string;
}) {
  const e = normalizeEstado(estado);

  return (
    <Badge
      variant="outline"
      className={cn(
        "justify-center font-semibold tracking-wide",
        estadoStyle(e),
        className
      )}
    >
      {e}
    </Badge>
  );
}
