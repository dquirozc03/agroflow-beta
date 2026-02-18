"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  RefreshCw,
  Loader2,
  Download,
  CheckCircle2,
  Pencil,
  Ban,
  Copy,
  X,
} from "lucide-react";

import type { SapRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  cerrarRegistro,
  getRegistroSap,
  editarRegistro,
  anularRegistro,
  listProcesados,
  puedeEditarRegistros,
  type ProcesadoSapItem,
  type EditCampoRegistro,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { canAnularRegistros } from "@/lib/constants";
import { toast } from "sonner";

// ===============================
// Helpers
// ===============================
function safeStr(v: any): string {
  if (v === undefined || v === null) return "";
  return String(v);
}

function getAny(row: any, ...keys: string[]) {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return "";
}

function getId(row: any) {
  return row?.registro_id ?? row?.id ?? "";
}

function fmtTime(v?: any) {
  if (!v) return "";
  try {
    const d = new Date(String(v));
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString();
  } catch {
    return String(v);
  }
}

function getFecha(row: any) {
  return getAny(
    row,
    "fecha_registro",
    "FECHA_REGISTRO",
    "FECHA",
    "fecha",
    "created_at",
    "CREATED_AT",
  );
}

// YYYY-MM-DD local (browser)
function localYYYYMMDD(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function copyToClipboard(label: string, value: string) {
  const text = value ?? "";
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  } catch {
    toast.error("No se pudo copiar");
  }
}

function EstadoBadge({ estado }: { estado: string }) {
  const e = (estado || "").toLowerCase();
  if (e === "anulado") return <Badge variant="secondary">ANULADO</Badge>;
  if (e === "procesado") return <Badge variant="default">PROCESADO</Badge>;
  return <Badge variant="outline">PENDIENTE</Badge>;
}

type ProcessedRow = SapRow & {
  registro_id?: number; // viene del backend
  processed_at?: string;
  estado?: string;
};

interface Props {
  rows: SapRow[];
  setRows: React.Dispatch<React.SetStateAction<SapRow[]>>;
  className?: string;
}

type DetailRow = {
  id: string;
  fecha: string;
  o_beta: string;
  booking: string;
  awb: string;
  dam: string;
  dni: string;
  transportista: string;
  termografos: string;
  ps_beta: string;
  ps_aduana: string;
  ps_operador: string;
  senasa_ps_linea: string;
};

function toDetail(row: any): DetailRow {
  const id = safeStr(getId(row));
  return {
    id,
    fecha: fmtTime(getFecha(row)),
    o_beta: safeStr(getAny(row, "o_beta", "O_BETA")),
    booking: safeStr(getAny(row, "booking", "BOOKING")),
    awb: safeStr(getAny(row, "awb", "AWB")),
    dam: safeStr(getAny(row, "dam", "N_DAM", "DAM")),
    dni: safeStr(getAny(row, "dni", "DNI")),
    transportista: safeStr(getAny(row, "transportista", "TRANSPORTISTA")),
    termografos: safeStr(getAny(row, "termografos", "TERMOGRAFOS")),
    ps_beta: safeStr(getAny(row, "ps_beta", "PS_BETA")),
    ps_aduana: safeStr(getAny(row, "ps_aduana", "PS_ADUANA")),
    ps_operador: safeStr(getAny(row, "ps_operador", "PS_OPERADOR")),
    senasa_ps_linea: safeStr(getAny(row, "senasa_ps_linea", "SENASA_PS_LINEA")),
  };
}

// ===============================
// Detail Panel
// ===============================
function DetailPanel({
  title,
  row,
  onClose,
}: {
  title: string;
  row: DetailRow;
  onClose: () => void;
}) {
  const Field = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-xl border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
            {value || "—"}
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => copyToClipboard(label, value)}
          disabled={!value}
          title="Copiar"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden h-full max-h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className="text-base font-semibold">
            ID <span className="font-mono">{row.id}</span>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={onClose} title="Cerrar panel">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 space-y-3 flex-1 min-h-0 overflow-y-auto overscroll-contain pr-2">
        <div className="grid grid-cols-2 gap-3">
          <Field label="FECHA" value={row.fecha} />
          <Field label="O_BETA" value={row.o_beta} />
        </div>

        <Field label="BOOKING" value={row.booking} />
        <Field label="AWB" value={row.awb} />
        <Field label="DAM" value={row.dam} />

        <div className="grid grid-cols-2 gap-3">
          <Field label="DNI" value={row.dni} />
          <Field label="TRANSPORTISTA" value={row.transportista} />
        </div>

        <Field label="TERMÓGRAFOS" value={row.termografos} />

        <div className="grid grid-cols-2 gap-3">
          <Field label="PS_BETA" value={row.ps_beta} />
          <Field label="PS_ADUANA" value={row.ps_aduana} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="PS_OPERADOR" value={row.ps_operador} />
          <Field label="SENASA/PS LÍNEA" value={row.senasa_ps_linea} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex w-full items-center justify-center py-16">
      <div className="rounded-2xl border border-border bg-muted/20 px-8 py-10 text-center shadow-sm">
        <div className="text-sm font-medium text-foreground">{text}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Cuando generes registros, aparecerán aquí.
        </div>
      </div>
    </div>
  );
}

function mapProcesadoToRow(item: ProcesadoSapItem): ProcessedRow {
  // Tu UI trabaja con getAny(...,"BOOKING", etc). El backend ya te manda claves en mayúsculas.
  return {
    ...(item as any),
    registro_id: item.registro_id,
    estado: item.estado ?? "procesado",
    processed_at: item.processed_at ?? undefined,
  } as any;
}

export function BandejaSap({ rows, setRows, className }: Props) {
  const { user } = useAuth();
  const role = user?.rol;
  const [tab, setTab] = useState<"pendientes" | "procesados">("pendientes");

  // ✅ Procesados viene de backend
  const [processedRows, setProcessedRows] = useState<ProcessedRow[]>([]);
  const [procesadosDate, setProcesadosDate] = useState<string>(localYYYYMMDD());
  const [procesadosLoading, setProcesadosLoading] = useState(false);

  // ✅ Filtro de fecha para Pendientes (por defecto: hoy)
  const [pendientesDate, setPendientesDate] = useState<string>(localYYYYMMDD());

  const [busyId, setBusyId] = useState<number | string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [selected, setSelected] = useState<any | null>(null);
  const [detailMobileOpen, setDetailMobileOpen] = useState(false);

  // dialogs editar/anular
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProcessedRow | null>(null);
  const [editCampo, setEditCampo] = useState<EditCampoRegistro>("booking");
  const [editMotivo, setEditMotivo] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const [anularOpen, setAnularOpen] = useState(false);
  const [anularTarget, setAnularTarget] = useState<ProcessedRow | null>(null);
  const [anularMotivoSelect, setAnularMotivoSelect] = useState("");
  const [anularMotivoOtro, setAnularMotivoOtro] = useState("");
  const [anularSaving, setAnularSaving] = useState(false);

  const MOTIVOS_ANULAR = [
    "Contenedor no salió",
    "Error de facturación",
    "Registro duplicado",
    "Cambio de operación",
    "Otro",
  ] as const;

  const columns = useMemo(
    () => [
      { key: "ID", label: "ID", w: "w-[80px]" },
      { key: "FECHA", label: "FECHA", w: "w-[120px]" },
      { key: "O_BETA", label: "O_BETA", w: "w-[130px]" },
      { key: "BOOKING", label: "BOOKING", w: "w-[150px]" },
      { key: "AWB", label: "AWB", w: "w-[210px]" },
      { key: "MARCA", label: "MARCA", w: "w-[130px]" },
      { key: "PLACAS", label: "PLACAS", w: "w-[130px]" },
      { key: "DNI", label: "DNI", w: "w-[130px]" },
      { key: "NOMBRES", label: "NOMBRES", w: "w-[220px]" },
      { key: "LICENCIA", label: "LICENCIA", w: "w-[140px]" },
      { key: "TERMOGRAFOS", label: "TERMÓGRAFOS", w: "w-[220px]" },
      { key: "CODIGO_SAP", label: "CÓDIGO SAP", w: "w-[150px]" },
      { key: "TRANSPORTISTA", label: "TRANSPORTISTA", w: "w-[260px]" },
      { key: "PS_BETA", label: "PRECINTOS BETA", w: "w-[200px]" },
      { key: "PS_ADUANA", label: "PRECINTO ADUANA", w: "w-[180px]" },
      { key: "PS_OPERADOR", label: "PRECINTO OPERADOR", w: "w-[190px]" },
      { key: "SENASA_PS_LINEA", label: "PRECINTO SENASA/LINEA", w: "w-[210px]" },
      { key: "P_REGISTRAL", label: "PARTIDA REGISTRAL", w: "w-[190px]" },
      { key: "CER_VEHICULAR", label: "CERTIFICADO VEHICULAR", w: "w-[210px]" },
    ],
    [],
  );

  const headBase =
    "px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40 backdrop-blur-sm border-b border-border text-center whitespace-nowrap";
  const cellBase =
    "px-3 py-2 align-middle text-sm text-foreground/90 whitespace-nowrap border-b border-border/40 transition-colors group-hover:bg-muted/50";
  const cellCenter = "text-center";
  const cellLeft = "text-left";
  const cellMono = "font-mono text-xs text-foreground";

  const selectedDetail = selected ? toDetail(selected) : null;
  const showDetailDesktop = Boolean(selectedDetail);

  const scrollAreaClass =
    "relative flex-1 min-h-0 w-full min-w-0 overflow-x-auto overflow-y-auto overscroll-contain";

  // ✅ Filtrar pendientes por fecha (solo muestra los del día seleccionado)
  const filteredPendientes = useMemo(() => {
    if (!pendientesDate) return rows;
    const targetDate = pendientesDate;
    return rows.filter((row) => {
      const fechaReg = getFecha(row);
      if (!fechaReg) return false;
      try {
        const fechaStr = String(fechaReg).slice(0, 10); // YYYY-MM-DD
        return fechaStr === targetDate;
      } catch {
        return false;
      }
    });
  }, [rows, pendientesDate]);

  const refreshProcesados = useCallback(
    async (fecha: string) => {
      const f = (fecha || "").trim() || localYYYYMMDD();
      try {
        setProcesadosLoading(true);
        const resp = await listProcesados({ fecha: f, limit: 300, offset: 0 });
        const mapped = (resp.items || []).map(mapProcesadoToRow);
        setProcessedRows(mapped);
      } catch (e: any) {
        toast.error(e?.message || "No se pudo cargar procesados.");
        setProcessedRows([]);
      } finally {
        setProcesadosLoading(false);
      }
    },
    [],
  );

  // ✅ Cuando el usuario cambia la fecha de procesados O cambia de pestaña, refrescamos.
  useEffect(() => {
    if (tab === "procesados") {
      refreshProcesados(procesadosDate);
    }
  }, [procesadosDate, tab, refreshProcesados]);

  async function handleRefreshRow(row: SapRow, where: "pendientes" | "procesados") {
    const id = getId(row);
    if (!id) return toast.error("No se pudo determinar el ID del registro.");

    try {
      setBusyId(id);
      const updated = await getRegistroSap(Number(id));

      if (where === "pendientes") {
        setRows((prev) =>
          prev.map((r) =>
            String(getId(r)) === String(id) ? ({ ...r, ...updated } as any) : r,
          ),
        );
      } else {
        // Nota: getRegistroSap devuelve la fila SAP (sin estado/processed_at).
        // Lo mergeamos, pero mantenemos estado/processed_at existentes.
        setProcessedRows((prev) =>
          prev.map((r) =>
            String(getId(r)) === String(id)
              ? ({ ...(r as any), ...(updated as any) } as any)
              : r,
          ),
        );
      }

      toast.success("Datos actualizados.");
    } catch (e: any) {
      if (e?.status === 404) {
        if (where === "pendientes") {
          setRows((prev) => prev.filter((r) => String(getId(r)) !== String(id)));
        } else {
          setProcessedRows((prev) =>
            prev.filter((r) => String(getId(r)) !== String(id)),
          );
        }
        toast.info(`El registro #${id} ya no existe en backend. Se quitó de la bandeja.`);
      } else {
        toast.error(e?.message || "No se pudo actualizar la fila.");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleProcesar(row: SapRow) {
    const id = getId(row);
    if (!id) return toast.error("No se pudo determinar el ID del registro.");

    try {
      setBusyId(id);

      await cerrarRegistro(Number(id));

      // Quitamos de pendientes
      setRows((prev) => prev.filter((r) => String(getId(r)) !== String(id)));

      // UX: vamos a Procesados y refrescamos HOY desde backend
      const hoy = localYYYYMMDD();
      setProcesadosDate(hoy);
      setTab("procesados");
      await refreshProcesados(hoy);

      toast.success("Registro procesado.");
    } catch (e: any) {
      toast.error(e?.message || "No se pudo procesar el registro.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRefreshAll() {
    try {
      setRefreshing(true);
      for (const r of filteredPendientes) {
        // eslint-disable-next-line no-await-in-loop
        await handleRefreshRow(r, "pendientes");
      }
      toast.success("Pendientes visibles refrescados.");
    } catch {
      toast.error("No se pudo refrescar todo.");
    } finally {
      setRefreshing(false);
    }
  }

  function onRowSelect(row: any) {
    setSelected(row);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setDetailMobileOpen(true);
    }
  }

  function cellProps(label: string, value: string) {
    return {
      title: "Doble click para copiar",
      onDoubleClick: (e: any) => {
        e.stopPropagation();
        copyToClipboard(label, value);
      },
    };
  }

  function exportCsv(rowsToExport: any[], filename: string) {
    const headers = columns.map((c) => c.label);
    const lines = [
      headers.join(","),
      ...rowsToExport.map((r) => {
        const vals = [
          safeStr(getId(r)),
          safeStr(getFecha(r)),
          safeStr(getAny(r, "o_beta", "O_BETA")),
          safeStr(getAny(r, "booking", "BOOKING")),
          safeStr(getAny(r, "awb", "AWB")),
          safeStr(getAny(r, "marca", "MARCA")),
          safeStr(getAny(r, "placas", "PLACAS")),
          safeStr(getAny(r, "dni", "DNI")),
          safeStr(getAny(r, "chofer", "CHOFER")),
          safeStr(getAny(r, "licencia", "LICENCIA")),
          safeStr(getAny(r, "transportista", "TRANSPORTISTA")),
          safeStr(getAny(r, "termografos", "TERMOGRAFOS")),
          safeStr(getAny(r, "ps_beta", "PS_BETA")),
          safeStr(getAny(r, "ps_aduana", "PS_ADUANA")),
          safeStr(getAny(r, "ps_operador", "PS_OPERADOR")),
          safeStr(getAny(r, "senasa_ps_linea", "SENASA_PS_LINEA")),
          safeStr(getAny(r, "p_registral", "P_REGISTRAL")),
          safeStr(getAny(r, "cer_vehicular", "CER_VEHICULAR")),
        ];
        return vals
          .map((x) => {
            const s = String(x ?? "");
            if (s.includes(",") || s.includes('"') || s.includes("\n")) {
              return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
          })
          .join(",");
      }),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ========== Edit / Anular ==========
  function openEditar(row: ProcessedRow) {
    const estado = String((row as any).estado ?? "procesado").toLowerCase();
    if (estado === "anulado") return;

    setEditTarget(row);
    setEditCampo("booking");
    setEditMotivo("");
    setEditValues({
      booking: safeStr(getAny(row, "booking", "BOOKING")),
      awb: safeStr(getAny(row, "awb", "AWB")),
      dni: safeStr(getAny(row, "dni", "DNI")),
      needle: safeStr(getAny(row, "transportista", "TRANSPORTISTA")),
      termografos: safeStr(getAny(row, "termografos", "TERMOGRAFOS")),
      ps_beta: safeStr(getAny(row, "ps_beta", "PS_BETA")),
      ps_aduana: safeStr(getAny(row, "ps_aduana", "PS_ADUANA")),
      ps_operador: safeStr(getAny(row, "ps_operador", "PS_OPERADOR")),
      senasa: safeStr(getAny(row, "senasa", "SENASA")),
      ps_linea: safeStr(getAny(row, "ps_linea", "PS_LINEA")),
    });
    setEditOpen(true);
  }

  async function submitEditar() {
    if (!editTarget) return;
    const id = getId(editTarget);
    if (!id) return;

    try {
      setEditSaving(true);

      const data: Record<string, unknown> = {};

      if (editCampo === "booking") data.booking = (editValues.booking || "").trim();
      if (editCampo === "awb") data.awb = (editValues.awb || "").trim();
      if (editCampo === "dni_chofer") data.dni = (editValues.dni || "").trim();
      if (editCampo === "transportista") data.needle = (editValues.needle || "").trim();
      if (editCampo === "termografos") data.termografos = (editValues.termografos || "").trim();

      if (editCampo === "precintos") {
        data.ps_beta = (editValues.ps_beta || "").trim();
        data.ps_aduana = (editValues.ps_aduana || "").trim();
        data.ps_operador = (editValues.ps_operador || "").trim();
        data.senasa = (editValues.senasa || "").trim();
        data.ps_linea = (editValues.ps_linea || "").trim();
      }

      await editarRegistro(Number(id), editCampo, data, editMotivo?.trim() || undefined, role);

      // refrescamos toda la lista de procesados para la fecha actual (evita inconsistencias)
      await refreshProcesados(procesadosDate);

      toast.success("Edición aplicada.");
      setEditOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "No se pudo editar.");
    } finally {
      setEditSaving(false);
    }
  }

  function openAnular(row: ProcessedRow) {
    const estado = String((row as any).estado ?? "procesado").toLowerCase();
    if (estado === "anulado") return;

    setAnularTarget(row);
    setAnularMotivoSelect("");
    setAnularMotivoOtro("");
    setAnularOpen(true);
  }

  async function submitAnular() {
    if (!anularTarget) return;
    const id = getId(anularTarget);
    if (!id) return;

    const motivo =
      anularMotivoSelect === "Otro"
        ? (anularMotivoOtro || "").trim()
        : (anularMotivoSelect || "").trim();
    if (!motivo) {
      if (anularMotivoSelect === "Otro") {
        return toast.error("Escribe el motivo en el campo «Otro».");
      }
      return toast.error("Selecciona un motivo de anulación.");
    }

    try {
      setAnularSaving(true);
      await anularRegistro(Number(id), motivo);

      await refreshProcesados(procesadosDate);

      toast.success("Registro anulado.");
      setAnularOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "No se pudo anular.");
    } finally {
      setAnularSaving(false);
    }
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Bandeja SAP</h2>
          <span className="text-xs text-muted-foreground">
            Pendientes ({pendientesDate}): {filteredPendientes.length}/{rows.length} · Procesados ({procesadosDate}): {processedRows.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefreshAll}
            disabled={refreshing || filteredPendientes.length === 0}
            title="Actualizar todos los pendientes visibles"
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Actualizar visibles
          </Button>

          <Button
            variant="secondary"
            onClick={() => exportCsv(filteredPendientes, `bandeja_sap_pendientes_${pendientesDate || localYYYYMMDD()}.csv`)}
            disabled={filteredPendientes.length === 0}
            title="Exportar pendientes filtrados"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <div
        className={[
          "grid grid-cols-1 gap-3 min-h-0 items-stretch",
          showDetailDesktop ? "lg:grid-cols-[minmax(0,1fr)_420px]" : "lg:grid-cols-1",
        ].join(" ")}
      >
        <div className="min-w-0 min-h-0">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="min-h-0">
            <TabsList>
              <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
              <TabsTrigger value="procesados">Procesados</TabsTrigger>
            </TabsList>

            {/* Pendientes */}
            <TabsContent value="pendientes" className="min-h-0">
              <div
                className={cn(
                  "rounded-2xl border bg-card shadow-sm w-full min-w-0 overflow-hidden flex min-h-0 flex-col",
                  filteredPendientes.length === 0 ? "max-h-[320px]" : "h-full",
                )}
              >
                {/* ✅ Filtros dentro de la tarjeta */}
                <div className="border-b border-border bg-muted/30 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                        Filtrar por fecha:
                      </Label>
                      <Input
                        type="date"
                        value={pendientesDate}
                        onChange={(e) => setPendientesDate(e.target.value)}
                        className="w-[160px] h-8"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendientesDate(localYYYYMMDD())}
                        className="h-8 text-xs"
                        title="Ver hoy"
                      >
                        Hoy
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Mostrando: {filteredPendientes.length} de {rows.length} pendientes
                    </div>
                  </div>
                </div>

                <div className={filteredPendientes.length === 0 ? "min-h-0 overflow-visible" : scrollAreaClass}>
                  {filteredPendientes.length === 0 ? (
                    <EmptyState text={`No hay pendientes para ${pendientesDate === localYYYYMMDD() ? "hoy" : `la fecha ${pendientesDate}`}.`} />
                  ) : (
                    <Table className="table-fixed min-w-[1900px]">
                      <TableHeader className="sticky top-0 z-20">
                        <TableRow className="border-b">
                          {columns.map((c) => (
                            <TableHead key={c.key} className={[headBase, c.w].join(" ")}>
                              {c.label}
                            </TableHead>
                          ))}
                          <TableHead className={[headBase, "w-[220px] text-center"].join(" ")}>
                            Acciones
                          </TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {filteredPendientes.map((row, idx) => {
                          const id = safeStr(getId(row));
                          const isBusy = String(busyId) === String(id);

                          const fecha = fmtTime(getFecha(row));
                          const o_beta = safeStr(getAny(row, "o_beta", "O_BETA"));
                          const booking = safeStr(getAny(row, "booking", "BOOKING"));
                          const awb = safeStr(getAny(row, "awb", "AWB"));
                          const marca = safeStr(getAny(row, "marca", "MARCA"));
                          const placas = safeStr(getAny(row, "placas", "PLACAS"));
                          const dni = safeStr(getAny(row, "dni", "DNI"));
                          const nombres = safeStr(getAny(row, "chofer", "CHOFER"));
                          const licencia = safeStr(getAny(row, "licencia", "LICENCIA"));
                          const termografos = safeStr(getAny(row, "termografos", "TERMOGRAFOS"));
                          const codigoSap = safeStr(getAny(row, "codigo_sap", "CODIGO_SAP"));
                          const transportista = safeStr(getAny(row, "transportista", "TRANSPORTISTA"));
                          const ps_beta = safeStr(getAny(row, "ps_beta", "PS_BETA"));
                          const ps_aduana = safeStr(getAny(row, "ps_aduana", "PS_ADUANA"));
                          const ps_operador = safeStr(getAny(row, "ps_operador", "PS_OPERADOR"));
                          const senasa_ps_linea = safeStr(getAny(row, "senasa_ps_linea", "SENASA_PS_LINEA"));
                          const partidaRegistral = safeStr(getAny(row, "p_registral", "P_REGISTRAL"));
                          const certificadoVehicular = safeStr(getAny(row, "cer_vehicular", "CER_VEHICULAR"));

                          return (
                            <TableRow
                              key={id || idx}
                              onClick={() => onRowSelect(row)}
                              className={[
                                "border-b last:border-b-0 cursor-pointer",
                                idx % 2 === 0 ? "bg-background" : "bg-muted/20",
                                "hover:bg-muted/40 transition-colors",
                              ].join(" ")}
                            >
                              <TableCell className={cn(cellBase, cellCenter, cellMono)} {...cellProps("ID", id)}>
                                {id}
                              </TableCell>

                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("FECHA", fecha)}>
                                {fecha}
                              </TableCell>

                              <TableCell
                                className={cn(cellBase, cellCenter, "font-semibold")}
                                {...cellProps("O_BETA", o_beta)}
                              >
                                {o_beta}
                              </TableCell>

                              <TableCell className={cn(cellBase, cellLeft)} {...cellProps("BOOKING", booking)}>
                                {booking}
                              </TableCell>

                              <TableCell className={cn(cellBase, cellLeft)} {...cellProps("AWB", awb)}>
                                {awb}
                              </TableCell>

                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("MARCA", marca)}>
                                {marca}
                              </TableCell>

                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("PLACAS", placas)}>
                                {placas}
                              </TableCell>

                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("DNI", dni)}>
                                {dni}
                              </TableCell>

                              <TableCell className={cn(cellBase, cellLeft)} {...cellProps("NOMBRES", nombres)}>
                                {nombres}
                              </TableCell>

                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("LICENCIA", licencia)}>
                                {licencia}
                              </TableCell>

                              <TableCell className={cn(cellBase, cellLeft)} {...cellProps("TERMÓGRAFOS", termografos)}>
                                {termografos}
                              </TableCell>

                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("CÓDIGO SAP", codigoSap)}>
                                {codigoSap}
                              </TableCell>

                              <TableCell
                                className={cn(cellBase, cellLeft)}
                                {...cellProps("TRANSPORTISTA", transportista)}
                              >
                                {transportista}
                              </TableCell>

                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("PRECINTOS BETA", ps_beta)}>
                                {ps_beta}
                              </TableCell>

                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("PRECINTO ADUANA", ps_aduana)}>
                                {ps_aduana}
                              </TableCell>

                              <TableCell
                                className={cn(cellBase, cellCenter)}
                                {...cellProps("PRECINTO OPERADOR", ps_operador)}
                              >
                                {ps_operador}
                              </TableCell>

                              <TableCell
                                className={cn(cellBase, cellCenter)}
                                {...cellProps("PRECINTO SENASA/LINEA", senasa_ps_linea)}
                              >
                                {senasa_ps_linea}
                              </TableCell>

                              <TableCell
                                className={cn(cellBase, cellLeft)}
                                {...cellProps("PARTIDA REGISTRAL", partidaRegistral)}
                              >
                                {partidaRegistral}
                              </TableCell>

                              <TableCell
                                className={cn(cellBase, cellLeft)}
                                {...cellProps("CERTIFICADO VEHICULAR", certificadoVehicular)}
                              >
                                {certificadoVehicular}
                              </TableCell>

                              <TableCell className={cn(cellBase, cellCenter)}>
                                <div className="inline-flex flex-wrap items-center justify-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRefreshRow(row, "pendientes");
                                    }}
                                    disabled={isBusy}
                                    title="Actualizar fila"
                                  >
                                    {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                  </Button>

                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleProcesar(row);
                                    }}
                                    disabled={isBusy}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    title="Procesar"
                                  >
                                    {isBusy ? (
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="mr-1 h-3 w-3" />
                                    )}
                                    Procesar
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Procesados */}
            <TabsContent value="procesados" className="min-h-0">
              <div
                className={cn(
                  "rounded-2xl border bg-card shadow-sm w-full min-w-0 overflow-hidden flex min-h-0 flex-col",
                  processedRows.length === 0 ? "max-h-[320px]" : "h-full",
                )}
              >
                {/* ✅ Filtros dentro de la tarjeta */}
                <div className="border-b border-border bg-muted/30 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                        Filtrar por fecha:
                      </Label>
                      <Input
                        type="date"
                        value={procesadosDate}
                        onChange={(e) => setProcesadosDate(e.target.value)}
                        className="w-[160px] h-8"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const hoy = localYYYYMMDD();
                          setProcesadosDate(hoy);
                          refreshProcesados(hoy);
                        }}
                        className="h-8 text-xs"
                        title="Ver hoy"
                      >
                        Hoy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refreshProcesados(procesadosDate)}
                        disabled={procesadosLoading}
                        title="Refrescar"
                        className="h-8"
                      >
                        {procesadosLoading ? (
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-3 w-3" />
                        )}
                        Refrescar
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Mostrando: {processedRows.length} procesados
                    </div>
                  </div>
                </div>
                <div className={processedRows.length === 0 ? "min-h-0 overflow-visible" : scrollAreaClass}>
                  {processedRows.length === 0 ? (
                    <EmptyState text="No hay procesados para esa fecha." />
                  ) : (
                    <Table className="table-fixed min-w-[1550px]">
                      <TableHeader className="sticky top-0 z-20">
                        <TableRow className="border-b">
                          <TableHead className={[headBase, "w-[90px]"].join(" ")}>ID</TableHead>
                          <TableHead className={[headBase, "w-[180px]"].join(" ")}>Procesado</TableHead>
                          <TableHead className={[headBase, "w-[150px]"].join(" ")}>O_BETA</TableHead>
                          <TableHead className={[headBase, "w-[120px]"].join(" ")}>Estado</TableHead>
                          <TableHead className={[headBase, "w-[180px]"].join(" ")}>BOOKING</TableHead>
                          <TableHead className={[headBase, "w-[260px]"].join(" ")}>AWB</TableHead>
                          <TableHead className={[headBase, "w-[160px]"].join(" ")}>DAM</TableHead>
                          <TableHead className={[headBase, "w-[140px]"].join(" ")}>DNI</TableHead>
                          <TableHead className={[headBase, "w-[280px]"].join(" ")}>TRANSPORTISTA</TableHead>
                          <TableHead className={[headBase, "w-[360px] text-center"].join(" ")}>
                            Acciones
                          </TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {processedRows.map((row, idx) => {
                          const id = safeStr(getId(row));
                          const isBusy = String(busyId) === String(id);
                          const estado = String((row as any).estado ?? "procesado").toLowerCase();

                          const processedAt = fmtTime((row as any).processed_at);
                          const o_beta = safeStr(getAny(row, "o_beta", "O_BETA"));
                          const booking = safeStr(getAny(row, "booking", "BOOKING"));
                          const awb = safeStr(getAny(row, "awb", "AWB"));
                          const dam = safeStr(getAny(row, "dam", "N_DAM", "DAM"));
                          const dni = safeStr(getAny(row, "dni", "DNI"));
                          const transportista = safeStr(getAny(row, "transportista", "TRANSPORTISTA"));

                          return (
                            <TableRow
                              key={id || idx}
                              onClick={() => onRowSelect(row)}
                              className={[
                                "border-b last:border-b-0 cursor-pointer",
                                idx % 2 === 0 ? "bg-background" : "bg-muted/20",
                                "hover:bg-muted/40 transition-colors",
                              ].join(" ")}
                            >
                              <TableCell className={cn(cellBase, cellCenter, cellMono)} {...cellProps("ID", id)}>
                                {id}
                              </TableCell>

                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("Procesado", processedAt)}>
                                {processedAt}
                              </TableCell>

                              <TableCell
                                className={cn(cellBase, cellCenter, "font-semibold")}
                                {...cellProps("O_BETA", o_beta)}
                              >
                                {o_beta}
                              </TableCell>

                              <TableCell className={cn(cellBase, cellCenter)}>
                                <EstadoBadge estado={estado} />
                              </TableCell>

                              <TableCell className={cn(cellBase, cellLeft)} {...cellProps("BOOKING", booking)}>
                                {booking}
                              </TableCell>

                              <TableCell className={cn(cellBase, cellLeft)} {...cellProps("AWB", awb)}>
                                {awb}
                              </TableCell>

                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("DAM", dam)}>
                                {dam}
                              </TableCell>

                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("DNI", dni)}>
                                {dni}
                              </TableCell>

                              <TableCell className={cn(cellBase, cellLeft)} {...cellProps("TRANSPORTISTA", transportista)}>
                                {transportista}
                              </TableCell>

                              <TableCell className={cn(cellBase, cellCenter)}>
                                <div className="inline-flex flex-wrap items-center justify-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRefreshRow(row, "procesados");
                                    }}
                                    disabled={isBusy}
                                    title="Actualizar fila"
                                  >
                                    {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                  </Button>

                                  {puedeEditarRegistros(role) && (
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditar(row);
                                      }}
                                      disabled={estado === "anulado"}
                                      className="bg-amber-500 hover:bg-amber-600 text-white"
                                      title="Editar (solo roles admin/editor)"
                                    >
                                      <Pencil className="mr-1 h-3 w-3" />
                                      Editar
                                    </Button>
                                  )}

                                  {canAnularRegistros(role ?? "documentaria") && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openAnular(row);
                                      }}
                                      disabled={estado === "anulado"}
                                      title="Anular"
                                    >
                                      <Ban className="mr-1 h-3 w-3" />
                                      Anular
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Panel desktop solo con selección */}
        {showDetailDesktop && selectedDetail ? (
          <div className="hidden lg:block min-h-0 h-full max-h-[calc(100vh-260px)]">
            <DetailPanel
              title={tab === "pendientes" ? "Detalle · Pendiente" : "Detalle · Procesado"}
              row={selectedDetail}
              onClose={() => setSelected(null)}
            />
          </div>
        ) : null}
      </div>

      {/* Móvil: dialog de detalle */}
      <Dialog open={detailMobileOpen} onOpenChange={setDetailMobileOpen}>
        <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del registro</DialogTitle>
          </DialogHeader>

          {selectedDetail ? (
            <DetailPanel
              title={tab === "pendientes" ? "Detalle · Pendiente" : "Detalle · Procesado"}
              row={selectedDetail}
              onClose={() => setDetailMobileOpen(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* EDIT */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Editar registro procesado</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Campo a editar</Label>
              <Select value={editCampo} onValueChange={(v) => setEditCampo(v as EditCampoRegistro)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un campo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="booking">BOOKING (recalcula refs)</SelectItem>
                  <SelectItem value="awb">AWB (contenedor)</SelectItem>
                  <SelectItem value="dni_chofer">DNI chofer</SelectItem>
                  <SelectItem value="transportista">Transportista</SelectItem>
                  <SelectItem value="termografos">Termógrafos</SelectItem>
                  <SelectItem value="precintos">Precintos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editCampo === "booking" && (
              <div className="grid gap-2">
                <Label>BOOKING</Label>
                <Input
                  value={editValues.booking || ""}
                  onChange={(e) => setEditValues((p) => ({ ...p, booking: e.target.value }))}
                />
              </div>
            )}

            {editCampo === "awb" && (
              <div className="grid gap-2">
                <Label>AWB (contenedor)</Label>
                <Input
                  value={editValues.awb || ""}
                  onChange={(e) => setEditValues((p) => ({ ...p, awb: e.target.value }))}
                />
              </div>
            )}

            {editCampo === "dni_chofer" && (
              <div className="grid gap-2">
                <Label>DNI chofer</Label>
                <Input
                  value={editValues.dni || ""}
                  onChange={(e) => setEditValues((p) => ({ ...p, dni: e.target.value }))}
                />
              </div>
            )}

            {editCampo === "transportista" && (
              <div className="grid gap-2">
                <Label>Transportista</Label>
                <Input
                  value={editValues.needle || ""}
                  onChange={(e) => setEditValues((p) => ({ ...p, needle: e.target.value }))}
                />
              </div>
            )}

            {editCampo === "termografos" && (
              <div className="grid gap-2">
                <Label>Termógrafos</Label>
                <Input
                  value={editValues.termografos || ""}
                  onChange={(e) => setEditValues((p) => ({ ...p, termografos: e.target.value }))}
                />
              </div>
            )}

            {editCampo === "precintos" && (
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label>Precintos BETA</Label>
                  <Input
                    value={editValues.ps_beta || ""}
                    onChange={(e) => setEditValues((p) => ({ ...p, ps_beta: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Precinto Aduana</Label>
                  <Input
                    value={editValues.ps_aduana || ""}
                    onChange={(e) => setEditValues((p) => ({ ...p, ps_aduana: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Precinto Operador</Label>
                  <Input
                    value={editValues.ps_operador || ""}
                    onChange={(e) => setEditValues((p) => ({ ...p, ps_operador: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>SENASA</Label>
                  <Input
                    value={editValues.senasa || ""}
                    onChange={(e) => setEditValues((p) => ({ ...p, senasa: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>PS Línea</Label>
                  <Input
                    value={editValues.ps_linea || ""}
                    onChange={(e) => setEditValues((p) => ({ ...p, ps_linea: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Motivo (opcional)</Label>
              <Textarea value={editMotivo} onChange={(e) => setEditMotivo(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editSaving}>
                Cancelar
              </Button>
              <Button onClick={submitEditar} disabled={editSaving}>
                {editSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ANULAR */}
      <Dialog open={anularOpen} onOpenChange={setAnularOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Anular registro</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>Motivo de anulación</Label>
              <Select
                value={anularMotivoSelect}
                onValueChange={(v) => {
                  setAnularMotivoSelect(v);
                  if (v !== "Otro") setAnularMotivoOtro("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un motivo" />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS_ANULAR.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {anularMotivoSelect === "Otro" && (
              <div className="grid gap-2">
                <Label>Especificar motivo</Label>
                <Textarea
                  value={anularMotivoOtro}
                  onChange={(e) => setAnularMotivoOtro(e.target.value)}
                  placeholder="Escribe el motivo..."
                  rows={3}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAnularOpen(false)} disabled={anularSaving}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={submitAnular} disabled={anularSaving}>
              {anularSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Anular
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * IMPORTANTE:
 * Si esta "Bandeja SAP" vive dentro de Tabs en tu page.tsx/layout,
 * pon `forceMount` en el TabsContent padre o React desmonta el componente.
 */
