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
      return "border-chart-3/30 bg-chart-3/10 text-chart-3";
    case "PROCESADO":
      return "border-accent/30 bg-accent/10 text-accent";
    case "CERRADO":
      return "border-border bg-muted/40 text-foreground";
    case "ANULADO":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    case "OBSERVADO":
      return "border-primary/30 bg-primary/10 text-primary";
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
