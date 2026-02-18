"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Send, RefreshCw, Lock, CircleAlert, FilePlus2, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import type { FormState, SemaforoStatus, SapRow } from "@/lib/types";
import { createRegistro, getRegistroSap } from "@/lib/api";
import { cn } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  form: FormState;
  registroId: number | null;
  setRegistroId: (id: number | null) => void;
  onSapRow: (row: SapRow) => void;
  onNuevoRegistro: () => void;
}

function txt(v?: string | null) {
  return (v ?? "").trim();
}

function joinSlash(parts: Array<string | null | undefined>) {
  return parts.map((p) => txt(p)).filter(Boolean).join("/");
}

function computeSemaforo(form: FormState): {
  status: SemaforoStatus;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  if (!txt(form.booking)) missing.push("BOOKING");
  if (!txt(form.dni)) missing.push("DNI");

  // Placas: ambas obligatorias (tracto y carreta)
  if (!txt(form.placas_tracto) || !txt(form.placas_carreta)) missing.push("PLACAS (tracto y carreta obligatorios)");

  // Transportista: viene por placas (solo lectura)
  if (!form.transportista && !txt(form.codigo_sap)) missing.push("TRANSPORTISTA (ingrese placas)");

  // Unicidad
  if (!form.ps_beta_items?.length) missing.push("PS_BETA");
  if (!form.termografos_items?.length) missing.push("TERMÓGRAFOS");
  if (!txt(form.ps_aduana)) missing.push("PS_ADUANA");
  if (!txt(form.ps_operador)) missing.push("PS_OPERADOR");

  // Recomendados
  if (!txt(form.awb)) warnings.push("AWB");
  if (!txt(form.o_beta)) warnings.push("O/BETA");

  if (missing.length > 0) return { status: "rojo", missing, warnings };
  if (warnings.length > 0) return { status: "amarillo", missing, warnings };
  return { status: "verde", missing, warnings };
}

const semaforoColors: Record<
  SemaforoStatus,
  { bg: string; ring: string; text: string; label: string }
> = {
  rojo: {
    bg: "bg-destructive/10",
    ring: "ring-destructive/30",
    text: "text-destructive",
    label: "Faltan campos críticos",
  },
  amarillo: {
    bg: "bg-chart-3/10",
    ring: "ring-chart-3/30",
    text: "text-chart-3",
    label: "Faltan campos recomendados",
  },
  verde: {
    bg: "bg-accent/10",
    ring: "ring-accent/30",
    text: "text-accent",
    label: "Listo para crear",
  },
};

export function CardAccion({
  form,
  registroId,
  setRegistroId,
  onSapRow,
  onNuevoRegistro,
}: Props) {
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingSap, setLoadingSap] = useState(false);

  const [confirmNuevoOpen, setConfirmNuevoOpen] = useState(false);
  const [duplicates, setDuplicates] = useState<Array<{ tipo: string; valor: string }> | null>(null);

  const { status, missing, warnings } = useMemo(() => computeSemaforo(form), [form]);
  const colors = semaforoColors[status];

  const handleCreate = async () => {
    setLoadingCreate(true);
    setDuplicates(null);

    try {
      const placas = joinSlash([form.placas_tracto, form.placas_carreta]);
      const termografos = (form.termografos_items || []).map(txt).filter(Boolean).join("/");
      const ps_beta = (form.ps_beta_items || []).map(txt).filter(Boolean).join("/");

      const payload = {
        o_beta: txt(form.o_beta) || null,
        booking: txt(form.booking) || null,
        awb: txt(form.awb) || null,

        dni: txt(form.dni),
        placas,

        ruc: null,
        codigo_sap: null,

        termografos: termografos || null,
        ps_beta: ps_beta || null,
        ps_aduana: txt(form.ps_aduana) || null,
        ps_operador: txt(form.ps_operador) || "***",

        senasa: txt(form.senasa) || "***",
        ps_linea: txt(form.ps_linea) || null,
      };

      const res = await createRegistro(payload);
      setRegistroId(res.id);

      // Bandeja SAP = vista para copiar/pegar (NO integración con SAP)
      try {
        const sap = await getRegistroSap(res.id);
        onSapRow({ registro_id: res.id, ...sap } as SapRow);
        toast.success(`Registro agregado a Bandeja SAP (ID #${res.id}) — listo para copiar/pegar`);
      } catch {
        toast.info(
          `Registro creado (ID #${res.id}). No se pudo armar la fila para la Bandeja. Usa “Actualizar” en la Bandeja SAP.`
        );
      }
    } catch (err: unknown) {
      const error = err as any;

      if (error?.status === 409) {
        const dups = (error?.body?.detail?.duplicados ?? []) as Array<{ tipo: string; valor: string }>;
        setDuplicates(dups.length ? dups : null);
        toast.error("Conflicto de unicidad (duplicados)");
        return;
      }

      const detail = error?.body?.detail;
      if (typeof detail === "string" && detail.trim()) toast.error(detail);
      else toast.error("Error al crear registro");
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleRetrieveSap = async () => {
    if (!registroId) return;
    setLoadingSap(true);

    try {
      const sap = await getRegistroSap(registroId);
      onSapRow({ registro_id: registroId, ...sap } as SapRow);
      toast.success("Datos de bandeja actualizados");
    } catch {
      toast.error("Error al actualizar datos de bandeja");
    } finally {
      setLoadingSap(false);
    }
  };



  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-card-foreground">Acción</CardTitle>
      </CardHeader>

      <CardContent className="grid gap-4">
        {/* Semáforo */}
        <div className={cn("flex items-start gap-3 rounded-lg p-3 ring-1", colors.bg, colors.ring)}>
          <div className="mt-0.5 flex gap-1.5">
            <span className={cn("h-3 w-3 rounded-full", status === "rojo" ? "bg-destructive" : "bg-destructive/20")} />
            <span className={cn("h-3 w-3 rounded-full", status === "amarillo" ? "bg-chart-3" : "bg-chart-3/20")} />
            <span className={cn("h-3 w-3 rounded-full", status === "verde" ? "bg-accent" : "bg-accent/20")} />
          </div>

          <div className="flex-1">
            <p className={cn("text-sm font-medium", colors.text)}>{colors.label}</p>

            {missing.length > 0 && (
              <p className="mt-0.5 text-xs text-muted-foreground">Críticos: {missing.join(", ")}</p>
            )}

            {warnings.length > 0 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Recomendados: {warnings.join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* Duplicados */}
        {duplicates && duplicates.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-destructive">
              <CircleAlert className="h-4 w-4" />
              Duplicados encontrados
            </div>
            <ul className="space-y-0.5">
              {duplicates.map((d) => (
                <li key={`${d.tipo}-${d.valor}`} className="font-mono text-xs text-destructive/80">
                  {d.tipo}: {d.valor}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Botones — mismo tamaño cuando hay registro activo */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleCreate}
            disabled={status === "rojo" || loadingCreate || !!registroId}
            className="min-h-9 flex-1 min-w-[180px]"
          >
            {loadingCreate ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
            Crear registro
          </Button>

          {registroId && (
            <>
              <Button
                variant="default"
                onClick={() => setConfirmNuevoOpen(true)}
                disabled={loadingCreate || loadingSap || loadingClose}
                className="min-h-9 flex-1 min-w-[140px]"
              >
                <FilePlus2 className="mr-1.5 h-4 w-4" />
                Nuevo registro
              </Button>
              <Button
                variant="secondary"
                onClick={handleRetrieveSap}
                disabled={loadingSap}
                className="min-h-9 flex-1 min-w-[140px]"
              >
                {loadingSap ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                )}
                Actualizar bandeja
              </Button>
            </>
          )}
        </div>

        {registroId && (
          <p className="text-xs text-muted-foreground">
            Registro activo:{" "}
            <span className="font-mono font-semibold text-card-foreground">#{registroId}</span>
          </p>
        )}
      </CardContent>

      {/* Confirmación: Nuevo registro */}
      <AlertDialog open={confirmNuevoOpen} onOpenChange={setConfirmNuevoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Iniciar un nuevo registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto limpiará todos los campos del formulario (incluye campos de solo lectura) para capturar un nuevo
              embarque. La Bandeja SAP no se borrará.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmNuevoOpen(false);
                setDuplicates(null);
                onNuevoRegistro();
              }}
            >
              Sí, nuevo registro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
