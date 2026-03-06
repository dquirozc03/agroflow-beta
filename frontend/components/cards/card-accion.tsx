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
  isHeaderVariant?: boolean;
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
  if (!form.ps_beta_items?.length) missing.push("PS_BETA (Exportador)");
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
  isHeaderVariant,
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
        ps_operador: txt(form.ps_operador) || "**",

        senasa: txt(form.senasa) || "**",
        ps_linea: txt(form.ps_linea) || null,
      };

      const res = await createRegistro(payload);
      setRegistroId(res.id);

      try {
        const sap = await getRegistroSap(res.id);
        onSapRow({ registro_id: res.id, ...sap } as SapRow);
        toast.success(`Registro agregado a Bandeja SAP (ID #${res.id})`);
      } catch {
        toast.info(`Registro creado (ID #${res.id}).`);
      }
    } catch (err: unknown) {
      const error = err as any;
      if (error?.status === 409) {
        const dups = (error?.body?.detail?.duplicados ?? []) as Array<{ tipo: string; valor: string }>;
        setDuplicates(dups.length ? dups : null);
        toast.error("Conflicto de unicidad (duplicados)");
        return;
      }
      toast.error("Error al crear registro");
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

  if (isHeaderVariant) {
    return (
      <div className="flex items-center gap-3">
        {registroId ? (
          <Button
            className="bg-primary hover:bg-green-600 text-white font-bold h-10 px-6 rounded-xl shadow-lg transition-all"
            onClick={() => setConfirmNuevoOpen(true)}
          >
            <span className="material-symbols-outlined mr-2 notranslate">add_circle</span>
            Siguiente Registro
          </Button>
        ) : (
          <Button
            className="bg-primary hover:bg-green-600 text-white font-bold h-10 px-6 rounded-xl shadow-lg transition-all"
            onClick={handleCreate}
            disabled={status === "rojo" || loadingCreate}
          >
            {loadingCreate ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <span className="material-symbols-outlined mr-2 notranslate">save</span>
            )}
            Finalizar Registro
          </Button>
        )}
        <AlertDialog open={confirmNuevoOpen} onOpenChange={setConfirmNuevoOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Iniciar un nuevo registro?</AlertDialogTitle>
              <AlertDialogDescription>
                Se limpiará el formulario para una nueva captura.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => { setConfirmNuevoOpen(false); onNuevoRegistro(); }}>
                Sí, nuevo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">Estado de Validación</h4>
      </div>

      {/* Semáforo */}
      <div className={cn("flex items-start gap-4 rounded-xl p-4 border", status === "rojo" ? "border-red-100 bg-red-50 dark:bg-red-950/20" : status === "amarillo" ? "border-amber-100 bg-amber-50 dark:bg-amber-950/20" : "border-green-100 bg-green-50 dark:bg-green-950/20")}>
        <div className="flex flex-col gap-1.5">
          <span className={cn("h-2.5 w-2.5 rounded-full", status === "rojo" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-red-200 dark:bg-red-900/40")} />
          <span className={cn("h-2.5 w-2.5 rounded-full", status === "amarillo" ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-amber-200 dark:bg-amber-900/40")} />
          <span className={cn("h-2.5 w-2.5 rounded-full", status === "verde" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-green-200 dark:bg-green-900/40")} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-bold", status === "rojo" ? "text-red-700 dark:text-red-400" : status === "amarillo" ? "text-amber-700 dark:text-amber-400" : "text-green-700 dark:text-green-400")}>{colors.label}</p>
          {missing.length > 0 && <p className="text-[11px] text-slate-500 mt-1 truncate">Pendiente: {missing[0]}...</p>}
        </div>
      </div>

      {/* Duplicados Info */}
      {duplicates && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg">
          <p className="text-xs text-red-600 font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm notranslate">error</span>
            Existen duplicados en la base de datos
          </p>
        </div>
      )}

      {registroId && (
        <div className="mt-6 flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-green-500 notranslate">check_circle</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">ID #{registroId}</span>
          </div>
          <button onClick={handleRetrieveSap} className="text-[10px] font-bold text-primary hover:underline">ACTUALIZAR BANDEJA</button>
        </div>
      )}
    </section>
  );
}
