"use client";

import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Truck, Loader2, Info } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";

import type { FormState } from "@/lib/types";
import { getVehiculoPorTractoCarreta } from "@/lib/api";
import type { Transportista } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Props {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  justScannedId?: string | null;
}

function prettyEstado(v?: string | null) {
  const s = (v || "").toString().trim();
  if (!s) return "—";
  return s.toUpperCase();
}

function TransportistaDetail({ t }: { t: Transportista }) {
  return (
    <div className="grid gap-2">
      <div className="text-sm font-semibold leading-snug break-words">
        {t.nombre_transportista}
      </div>
      <div className="grid gap-1 text-xs text-muted-foreground">
        <div className="flex items-center justify-between gap-3">
          <span>RUC</span>
          <span className="font-mono text-foreground">{t.ruc}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Código SAP</span>
          <span className="font-mono text-foreground">{t.codigo_sap}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Partida</span>
          <span className="font-mono text-foreground">
            {t.partida_registral ?? "—"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Estado</span>
          <span className="font-mono text-foreground">{prettyEstado(t.estado)}</span>
        </div>
      </div>
    </div>
  );
}

function buildPlacas(tracto: string, carreta: string): string {
  const t = (tracto || "").trim().toUpperCase();
  const c = (carreta || "").trim().toUpperCase();
  if (!t) return "";
  if (!c) return t;
  return `${t}/${c}`;
}

export const CardOperacion = React.memo(function CardOperacion({ form, setForm, justScannedId }: Props) {
  const [placasLoading, setPlacasLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [carretaAlerta, setCarretaAlerta] = useState<{
    distinto: boolean;
    otroNombre: string | null;
  }>({ distinto: false, otroNombre: null });
  const placasDebounceRef = useRef<number | null>(null);

  const transportista = form.transportista;

  // Lookup por placa TRACTO (obligatoria); carreta opcional. Si la carreta es de otro transportista, se alerta.
  useEffect(() => {
    const tracto = (form.placas_tracto || "").trim().toUpperCase();
    if (!tracto) {
      setForm((prev) => ({ ...prev, transportista: null, codigo_sap: "" }));
      setCarretaAlerta({ distinto: false, otroNombre: null });
      setPlacasLoading(false);
      return;
    }

    if (placasDebounceRef.current) window.clearTimeout(placasDebounceRef.current);
    setPlacasLoading(true);

    const carreta = (form.placas_carreta || "").trim() ? form.placas_carreta : undefined;

    placasDebounceRef.current = window.setTimeout(async () => {
      try {
        const data = await getVehiculoPorTractoCarreta(tracto, carreta);
        setForm((prev) => ({
          ...prev,
          transportista: data.transportista ?? null,
          codigo_sap: data.transportista?.codigo_sap ?? "",
        }));
        setCarretaAlerta({
          distinto: data.carreta_distinto_transportista ?? false,
          otroNombre: data.carreta_transportista_nombre ?? null,
        });
        if (data.transportista) {
          toast.success("Transportista cargado por placa tracto");
        } else {
          toast.warning("Vehículo sin transportista asociado");
        }
      } catch {
        setForm((prev) => ({ ...prev, transportista: null, codigo_sap: "" }));
        setCarretaAlerta({ distinto: false, otroNombre: null });
        toast.error("Vehículo no encontrado o sin transportista");
      } finally {
        setPlacasLoading(false);
      }
    }, 400);

    return () => {
      if (placasDebounceRef.current) window.clearTimeout(placasDebounceRef.current);
    };
  }, [form.placas_tracto, form.placas_carreta, setForm]);

  return (
    <Card className="min-w-0 max-w-full">
      <CardHeader className="pb-3 min-w-0 max-w-full">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-card-foreground min-w-0 max-w-full">
          <Truck className="h-4 w-4 text-primary" />
          Operación
        </CardTitle>
      </CardHeader>

      <CardContent className="grid gap-4 min-w-0 max-w-full">
        {/* DNI */}
        <div className="grid gap-1.5 min-w-0 max-w-full">
          <Label htmlFor="dni" className="text-xs text-muted-foreground">
            DNI (Scanner)
          </Label>
          <Input
            id="dni"
            value={form.dni}
            onChange={(e) => setForm((prev) => ({ ...prev, dni: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                document.getElementById("placas_tracto")?.focus();
              }
            }}
            placeholder="Escanear DNI"
            className={cn("h-9 font-mono", justScannedId === "dni" && "animate-scan-flash")}
          />
        </div>

        {/* Placas */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-w-0 max-w-full">
          <div className="min-w-0 max-w-full">
            <Label htmlFor="placas_tracto" className="text-xs text-muted-foreground">
              Placa TRACTO (obligatorio)
            </Label>
            <Input
              id="placas_tracto"
              value={form.placas_tracto}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, placas_tracto: e.target.value.toUpperCase() }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  document.getElementById("placas_carreta")?.focus();
                }
              }}
              placeholder="Placa tracto"
              className={cn("mt-1 h-9 font-mono", justScannedId === "placas_tracto" && "animate-scan-flash")}
            />
          </div>
          <div className="min-w-0 max-w-full">
            <Label htmlFor="placas_carreta" className="text-xs text-muted-foreground">
              Placa CARRETA (obligatorio)
            </Label>
            <Input
              id="placas_carreta"
              value={form.placas_carreta}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, placas_carreta: e.target.value.toUpperCase() }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  // Siguiente: PS_ADUANA en la siguiente tarjeta (CardUnicidad)
                  document.getElementById("ps_aduana")?.focus();
                }
              }}
              placeholder="Placa carreta"
              className={cn("mt-1 h-9 font-mono", justScannedId === "placas_carreta" && "animate-scan-flash")}
            />
          </div>
        </div>

        {/* Transportista (solo lectura, según placas) */}
        <div className="min-w-0 max-w-full">
          <div className="flex items-center justify-between min-w-0 max-w-full">
            <Label className="text-xs text-muted-foreground">
              Transportista (según placas)
            </Label>
            {transportista && (
              <Popover open={detailOpen} onOpenChange={setDetailOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                    <Info className="mr-1 h-3 w-3" />
                    Ver detalle
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80">
                  <TransportistaDetail t={transportista} />
                </PopoverContent>
              </Popover>
            )}
          </div>

          <div
            className={cn(
              "mt-1 flex min-h-9 items-center rounded-md border border-input bg-muted/30 px-3 py-2 text-sm",
              !transportista && "text-muted-foreground",
            )}
          >
            {placasLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />
                Buscando vehículo y transportista…
              </>
            ) : transportista ? (
              <>
                <span className="font-medium text-foreground">{transportista.nombre_transportista}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  RUC: <span className="font-mono">{transportista.ruc}</span> · SAP:{" "}
                  <span className="font-mono">{transportista.codigo_sap}</span>
                </span>
              </>
            ) : (
              "Ingrese placas para cargar el transportista asociado al vehículo"
            )}
          </div>

          {carretaAlerta.distinto && transportista && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>
                La placa carreta corresponde a otro transportista
                {carretaAlerta.otroNombre ? ` (${carretaAlerta.otroNombre})` : ""}. Se usará el del
                tracto ({transportista.nombre_transportista}). Corrija la placa carreta si
                corresponde.
              </AlertDescription>
            </Alert>
          )}

          <p className="mt-1.5 text-[11px] text-muted-foreground">
            El transportista se determina por la placa tracto. Si la carreta es de otro
            transportista, se mostrará alerta; debe corregirse la placa carreta.
          </p>
        </div>
      </CardContent>
    </Card>
  );
});
