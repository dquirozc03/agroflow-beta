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
    return d.toLocaleDateString();
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

  if (e === "anulado") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">
        <span className="size-1.5 bg-red-600 rounded-full animate-pulse"></span>
        Anulado
      </span>
    );
  }

  if (e === "procesado") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
        <span className="size-1.5 bg-green-600 rounded-full animate-pulse"></span>
        Procesado
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
      <span className="size-1.5 bg-amber-600 rounded-full animate-pulse"></span>
      Pendiente
    </span>
  );
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
  marca: string;
  placas: string;
  dni: string;
  nombres: string;
  licencia: string;
  termografos: string;
  codigo_sap: string;
  transportista: string;
  ps_beta: string;
  ps_aduana: string;
  ps_operador: string;
  senasa_ps_linea: string;
  p_registral: string;
  cer_vehicular: string;
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
    marca: safeStr(getAny(row, "marca", "MARCA")),
    placas: safeStr(getAny(row, "placas", "PLACAS")),
    dni: safeStr(getAny(row, "dni", "DNI")),
    nombres: safeStr(getAny(row, "chofer", "CHOFER", "NOMBRES")),
    licencia: safeStr(getAny(row, "licencia", "LICENCIA")),
    termografos: safeStr(getAny(row, "termografos", "TERMOGRAFOS")),
    codigo_sap: safeStr(getAny(row, "codigo_sap", "CODIGO_SAP")),
    transportista: safeStr(getAny(row, "transportista", "TRANSPORTISTA")),
    ps_beta: safeStr(getAny(row, "ps_beta", "PS_BETA")),
    ps_aduana: safeStr(getAny(row, "ps_aduana", "PS_ADUANA")),
    ps_operador: safeStr(getAny(row, "ps_operador", "PS_OPERADOR")),
    senasa_ps_linea: safeStr(getAny(row, "senasa_ps_linea", "SENASA_PS_LINEA")),
    p_registral: safeStr(getAny(row, "p_registral", "P_REGISTRAL")),
    cer_vehicular: safeStr(getAny(row, "cer_vehicular", "CER_VEHICULAR")),
  };
}

// ===============================
// Detail Panel
// ===============================
// ✅ Componente Field extraído para evitar remounting al actualizar estado del padre
const Field = ({
  label,
  value,
  copiedField,
  onCopy,
}: {
  label: string;
  value: string;
  copiedField: string | null;
  onCopy: (label: string, value: string) => void;
}) => (
  <div
    className={cn(
      "rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3 transition-all",
      copiedField === label && "ring-2 ring-primary bg-primary/5 border-primary/30",
    )}
  >
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
          {label}
        </div>
        <div className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
          {value || "—"}
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "shrink-0 h-8 w-8 p-0 rounded-lg hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-all",
          copiedField === label
            ? "text-primary scale-110"
            : "text-slate-400 hover:text-primary",
        )}
        onClick={() => onCopy(label, value)}
        disabled={!value}
        title="Copiar dato"
      >
        {copiedField === label ? (
          <span className="material-symbols-outlined text-lg">check_circle</span>
        ) : (
          <span className="material-symbols-outlined text-lg">content_copy</span>
        )}
      </Button>
    </div>
  </div>
);

function DetailPanel({
  title,
  row,
  onClose,
}: {
  title: string;
  row: DetailRow;
  onClose: () => void;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (label: string, value: string) => {
    copyToClipboard(label, value);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl overflow-hidden h-full max-h-full flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-900/30">
        <div>
          <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-0.5">
            {title}
          </div>
          <div className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            REGISTRO <span className="font-mono text-primary">#{row.id}</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Cerrar detalles"
        >
          <span className="material-symbols-outlined text-slate-500">close</span>
        </Button>
      </div>

      <div className="p-5 space-y-3 flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar border-t border-slate-100 dark:border-slate-800">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="size-1.5 bg-primary rounded-full"></span>
          Datos para Copiado SAP
        </div>

        {/* ORDEN ESTRICTO SAP */}
        <Field label="ID" value={row.id} copiedField={copiedField} onCopy={handleCopy} />
        <Field label="FECHA" value={row.fecha} copiedField={copiedField} onCopy={handleCopy} />
        <Field label="O_BETA" value={row.o_beta} copiedField={copiedField} onCopy={handleCopy} />
        <Field label="BOOKING" value={row.booking} copiedField={copiedField} onCopy={handleCopy} />
        <Field label="AWB" value={row.awb} copiedField={copiedField} onCopy={handleCopy} />
        <Field label="DAM" value={row.dam} copiedField={copiedField} onCopy={handleCopy} />
        <Field label="MARCA" value={row.marca} copiedField={copiedField} onCopy={handleCopy} />
        <Field label="PLACAS" value={row.placas} copiedField={copiedField} onCopy={handleCopy} />
        <Field label="DNI" value={row.dni} copiedField={copiedField} onCopy={handleCopy} />
        <Field label="NOMBRES" value={row.nombres} copiedField={copiedField} onCopy={handleCopy} />
        <Field label="LICENCIA" value={row.licencia} copiedField={copiedField} onCopy={handleCopy} />
        <Field label="TERMÓGRAFOS" value={row.termografos} copiedField={copiedField} onCopy={handleCopy} />
        <Field label="CÓDIGO SAP" value={row.codigo_sap} copiedField={copiedField} onCopy={handleCopy} />
        <Field label="TRANSPORTISTA" value={row.transportista} copiedField={copiedField} onCopy={handleCopy} />
        <Field label="PRECINTOS BETA" value={row.ps_beta} copiedField={copiedField} onCopy={handleCopy} />
        <Field label="PRECINTO ADUANA" value={row.ps_aduana} copiedField={copiedField} onCopy={handleCopy} />
        <Field label="PRECINTO OPERADOR" value={row.ps_operador} copiedField={copiedField} onCopy={handleCopy} />
        <Field label="SENASA/PS LÍNEA" value={row.senasa_ps_linea} copiedField={copiedField} onCopy={handleCopy} />
        <Field label="PARTIDA REGISTRAL" value={row.p_registral} copiedField={copiedField} onCopy={handleCopy} />
        <Field label="CERTIFICADO VEHICULAR" value={row.cer_vehicular} copiedField={copiedField} onCopy={handleCopy} />
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[10px] text-slate-400 text-center font-medium italic">
          Haz clic en el icono para copiar el dato directamente a SAP.
        </p>
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
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ Filtro de fecha para Pendientes (por defecto: vacío para mostrar todos)
  const [pendientesDate, setPendientesDate] = useState<string>("");

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
    "FALLA DE CONTENEDOR",
    "ERROR DE FACTURACION",
    "CAMBIO DE OPERADOR",
    "OTRO",
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
    "px-3 py-3 align-middle text-[13px] text-foreground/90 border-b border-border/40 transition-colors group-hover:bg-muted/50 leading-tight whitespace-normal break-words";
  const cellCenter = "text-center";
  const cellLeft = "text-left";
  const cellMono = "font-mono text-xs text-foreground";

  // ✅ Memorizamos el detalle para mantener la referencia estable y evitar scroll jumps
  const selectedDetail = useMemo(() => (selected ? toDetail(selected) : null), [selected]);
  const showDetailDesktop = Boolean(selectedDetail);

  const scrollAreaClass =
    "relative flex-1 min-h-0 w-full min-w-0 overflow-x-auto overflow-y-auto overscroll-contain";

  // ✅ Filtrar pendientes por fecha y búsqueda
  const filteredPendientes = useMemo(() => {
    let result = rows;

    if (pendientesDate) {
      result = result.filter(row => String(getFecha(row)).slice(0, 10) === pendientesDate);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(row => {
        const id = String(getId(row)).toLowerCase();
        const booking = safeStr(getAny(row, "booking", "BOOKING")).toLowerCase();
        const awb = safeStr(getAny(row, "awb", "AWB")).toLowerCase();
        const placas = safeStr(getAny(row, "placas", "PLACAS")).toLowerCase();
        const transportista = safeStr(getAny(row, "transportista", "TRANSPORTISTA")).toLowerCase();
        return id.includes(q) || booking.includes(q) || awb.includes(q) || placas.includes(q) || transportista.includes(q);
      });
    }

    return result;
  }, [rows, pendientesDate, searchQuery]);

  // ✅ Filtrar procesados por búsqueda
  const filteredProcesados = useMemo(() => {
    if (!searchQuery) return processedRows;
    const q = searchQuery.toLowerCase();
    return processedRows.filter(row => {
      const id = String(getId(row)).toLowerCase();
      const booking = safeStr(getAny(row, "booking", "BOOKING")).toLowerCase();
      const awb = safeStr(getAny(row, "awb", "AWB")).toLowerCase();
      const placas = safeStr(getAny(row, "placas", "PLACAS")).toLowerCase();
      const transportista = safeStr(getAny(row, "transportista", "TRANSPORTISTA")).toLowerCase();
      return id.includes(q) || booking.includes(q) || awb.includes(q) || placas.includes(q) || transportista.includes(q);
    });
  }, [processedRows, searchQuery]);

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
    <div className={cn("flex min-h-0 flex-1 flex-col gap-6", className)}>
      {/* 🚀 Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Bandeja de Gestión <span className="text-primary italic">AgroFlow</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base mt-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">sync_alt</span>
            Sincronización y monitoreo de registros para carga en SAP
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => exportCsv(tab === "pendientes" ? filteredPendientes : processedRows, `bandeja_sap_${tab}_${localYYYYMMDD()}.csv`)}
            disabled={tab === "pendientes" ? filteredPendientes.length === 0 : processedRows.length === 0}
            className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Exportar Excel
          </Button>

          <Button
            onClick={tab === "pendientes" ? handleRefreshAll : () => refreshProcesados(procesadosDate)}
            disabled={refreshing || procesadosLoading}
            className="rounded-xl bg-primary text-primary-dark font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 border-none"
          >
            {refreshing || procesadosLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary-dark" />
            ) : (
              <span className="material-symbols-outlined text-lg">sync</span>
            )}
            Sincronizar
          </Button>
        </div>
      </div>

      {/* 🔍 Premium Filters Bar */}
      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex-1 min-w-[300px]">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
            <input
              type="text"
              placeholder="Buscar registros (ID, Booking, AWB, Placas...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="material-symbols-outlined text-slate-400 text-sm leading-none">calendar_month</span>
            <input
              type="date"
              value={tab === "pendientes" ? pendientesDate : procesadosDate}
              onChange={(e) => tab === "pendientes" ? setPendientesDate(e.target.value) : setProcesadosDate(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-0 py-0 cursor-pointer outline-none"
              placeholder="Todas las fechas"
            />
            {tab === "pendientes" && pendientesDate && (
              <button
                onClick={() => setPendientesDate("")}
                className="hover:text-primary transition-colors"
                title="Mostrar todos los pendientes"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="material-symbols-outlined text-slate-400 text-sm leading-none">filter_list</span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Estado: <span className="text-primary capitalize">{tab}</span>
            </span>
          </div>
        </div>
      </div>

      <div
        className={[
          "grid grid-cols-1 gap-6 min-h-0 items-stretch",
          showDetailDesktop ? "lg:grid-cols-[minmax(0,1fr)_400px]" : "lg:grid-cols-1",
        ].join(" ")}
      >
        <div className="min-w-0 min-h-0 flex flex-col gap-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                <TabsTrigger
                  value="pendientes"
                  className="rounded-lg px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all"
                >
                  Pendientes
                </TabsTrigger>
                <TabsTrigger
                  value="procesados"
                  className="rounded-lg px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all"
                >
                  Procesados
                </TabsTrigger>
              </TabsList>

              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                Total Registros: <span className="text-slate-900 dark:text-white">{tab === "pendientes" ? filteredPendientes.length : filteredProcesados.length}</span>
              </div>
            </div>

            {/* Pendientes Table Content */}
            <TabsContent value="pendientes" className="mt-0 flex-1 min-h-0">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
                <div className={cn(scrollAreaClass, "custom-scrollbar")}>
                  {filteredPendientes.length === 0 ? (
                    <EmptyState text={`No hay pendientes para ${pendientesDate === localYYYYMMDD() ? "hoy" : `la fecha ${pendientesDate}`}.`} />
                  ) : (
                    <Table className="table-fixed min-w-[2200px]">
                      <TableHeader className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
                        <TableRow className="border-b border-slate-100 dark:border-slate-800 hover:bg-transparent">
                          {columns.map((c) => (
                            <TableHead key={c.key} className={cn(headBase, c.w, "border-none py-4 text-slate-900 dark:text-slate-100")}>
                              {c.label}
                            </TableHead>
                          ))}
                          <TableHead className={cn(headBase, "w-[240px] text-center border-none py-4 text-slate-900 dark:text-slate-100")}>
                            Acciones
                          </TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {filteredPendientes.map((row, idx) => {
                          const id = safeStr(getId(row));
                          const isBusy = String(busyId) === String(id);
                          const isSelected = selected && String(getId(selected)) === id;

                          const fecha = fmtTime(getFecha(row));
                          const o_beta = safeStr(getAny(row, "o_beta", "O_BETA"));
                          const booking = safeStr(getAny(row, "booking", "BOOKING"));
                          const awb = safeStr(getAny(row, "awb", "AWB"));
                          const marca = safeStr(getAny(row, "marca", "MARCA"));
                          const placas = safeStr(getAny(row, "placas", "PLACAS"));
                          const dni = safeStr(getAny(row, "dni", "DNI"));
                          const nombres = safeStr(getAny(row, "chofer", "CHOFER", "NOMBRES"));
                          const licencia = safeStr(getAny(row, "licencia", "LICENCIA"));
                          const termografos = safeStr(getAny(row, "termografos", "TERMOGRAFOS"));
                          const codigoSap = safeStr(getAny(row, "codigo_sap", "CODIGO_SAP"));
                          const transportista = safeStr(getAny(row, "transportista", "TRANSPORTISTA"));
                          const ps_beta = safeStr(getAny(row, "ps_beta", "PS_BETA"));
                          const ps_aduana = safeStr(getAny(row, "ps_aduana", "PS_ADUANA"));
                          const ps_operador = safeStr(getAny(row, "ps_operador", "PS_OPERADOR"));
                          const senasa_ps_linea = safeStr(getAny(row, "senasa_ps_linea", "SENASA_PS_LINEA"));
                          const p_registral = safeStr(getAny(row, "p_registral", "P_REGISTRAL"));
                          const cer_vehicular = safeStr(getAny(row, "cer_vehicular", "CER_VEHICULAR"));

                          return (
                            <TableRow
                              key={id || idx}
                              onClick={() => onRowSelect(row)}
                              className={cn(
                                "border-b border-slate-50 dark:border-slate-900 last:border-0 cursor-pointer transition-all duration-200 group",
                                isSelected ? "bg-primary/10" : idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/30 dark:bg-slate-900/20",
                                "hover:bg-primary/5 dark:hover:bg-primary/10"
                              )}
                            >
                              <TableCell className={cn(cellBase, cellCenter, cellMono, "font-bold text-primary group-hover:scale-110 transition-transform")} {...cellProps("ID", id)}>
                                {id}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("FECHA", fecha)}>
                                {fecha}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter, "font-black text-slate-900 dark:text-white")} {...cellProps("O_BETA", o_beta)}>
                                {o_beta}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter, "font-medium")} {...cellProps("BOOKING", booking)}>
                                {booking}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("AWB", awb)}>
                                {awb}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("MARCA", marca)}>
                                {marca}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter, "font-mono font-bold")} {...cellProps("PLACAS", placas)}>
                                {placas}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("DNI", dni)}>
                                {dni}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("NOMBRES", nombres)}>
                                {nombres}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("LICENCIA", licencia)}>
                                {licencia}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("TERMÓGRAFOS", termografos)}>
                                {termografos}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("CÓDIGO SAP", codigoSap)}>
                                {codigoSap}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter, "text-[11px] font-medium opacity-80 uppercase whitespace-normal break-words")} {...cellProps("TRANSPORTISTA", transportista)}>
                                {transportista}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter, "whitespace-normal break-words")} {...cellProps("PRECINTOS BETA", ps_beta)}>
                                {ps_beta}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter, "whitespace-normal break-words")} {...cellProps("PRECINTO ADUANA", ps_aduana)}>
                                {ps_aduana}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter, "whitespace-normal break-words")} {...cellProps("PRECINTO OPERADOR", ps_operador)}>
                                {ps_operador}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter, "whitespace-normal break-words")} {...cellProps("SENASA/PS LÍNEA", senasa_ps_linea)}>
                                {senasa_ps_linea}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("PARTIDA REGISTRAL", p_registral)}>
                                {p_registral}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("CERTIFICADO VEHICULAR", cer_vehicular)}>
                                {cer_vehicular}
                              </TableCell>

                              <TableCell className={cn(cellBase, cellCenter)}>
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => { e.stopPropagation(); handleRefreshRow(row, "pendientes"); }}
                                    disabled={isBusy}
                                    className="h-8 w-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                                  >
                                    {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="material-symbols-outlined text-xl">refresh</span>}
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); handleProcesar(row); }}
                                    disabled={isBusy}
                                    className="h-8 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold px-3 transition-all"
                                  >
                                    <span className="material-symbols-outlined text-sm mr-1">task_alt</span>
                                    Listo
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

            {/* Procesados Table Content */}
            <TabsContent value="procesados" className="mt-0 flex-1 min-h-0">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
                <div className={cn(scrollAreaClass, "custom-scrollbar")}>
                  {filteredProcesados.length === 0 ? (
                    <EmptyState text="No hay registros procesados para mostrar." />
                  ) : (
                    <Table className="table-fixed min-w-[1600px]">
                      <TableHeader className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
                        <TableRow className="border-b border-slate-100 dark:border-slate-800 hover:bg-transparent">
                          <TableHead className={cn(headBase, "w-[90px] border-none py-4 text-slate-900 dark:text-slate-100")}>ID</TableHead>
                          <TableHead className={cn(headBase, "w-[180px] border-none py-4 text-slate-900 dark:text-slate-100")}>Fecha Sync</TableHead>
                          <TableHead className={cn(headBase, "w-[150px] border-none py-4 text-slate-900 dark:text-slate-100")}>O_BETA</TableHead>
                          <TableHead className={cn(headBase, "w-[140px] border-none py-4 text-slate-900 dark:text-slate-100")}>Estado</TableHead>
                          <TableHead className={cn(headBase, "w-[180px] border-none py-4 text-slate-900 dark:text-slate-100")}>Booking</TableHead>
                          <TableHead className={cn(headBase, "w-[240px] border-none py-4 text-slate-900 dark:text-slate-100")}>AWB</TableHead>
                          <TableHead className={cn(headBase, "w-[160px] border-none py-4 text-slate-900 dark:text-slate-100")}>DAM</TableHead>
                          <TableHead className={cn(headBase, "w-[160px] border-none py-4 text-slate-900 dark:text-slate-100")}>DNI</TableHead>
                          <TableHead className={cn(headBase, "w-[280px] border-none py-4 text-slate-900 dark:text-slate-100")}>Transportista</TableHead>
                          <TableHead className={cn(headBase, "w-[280px] text-center border-none py-4 text-slate-900 dark:text-slate-100")}>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {filteredProcesados.map((row, idx) => {
                          const id = safeStr(getId(row));
                          const isBusy = String(busyId) === String(id);
                          const isSelected = selected && String(getId(selected)) === id;
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
                              className={cn(
                                "border-b border-slate-50 dark:border-slate-900 last:border-0 cursor-pointer transition-all duration-200 group",
                                isSelected ? "bg-primary/10" : idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/30 dark:bg-slate-900/20",
                                "hover:bg-primary/5 dark:hover:bg-primary/10"
                              )}
                            >
                              <TableCell className={cn(cellBase, cellCenter, cellMono, "font-bold text-primary")} {...cellProps("ID", id)}>
                                {id}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("Fecha Sync", processedAt)}>
                                {processedAt}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter, "font-black text-slate-900 dark:text-white")} {...cellProps("O_BETA", o_beta)}>
                                {o_beta}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter)}>
                                <EstadoBadge estado={estado} />
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter, "font-medium")} {...cellProps("Booking", booking)}>
                                {booking}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("AWB", awb)}>
                                {awb}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("DAM", dam)}>
                                {dam}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter)} {...cellProps("DNI", dni)}>
                                {dni}
                              </TableCell>
                              <TableCell className={cn(cellBase, cellCenter, "text-[11px] font-medium opacity-80 uppercase whitespace-normal break-words")} {...cellProps("Transportista", transportista)}>
                                {transportista}
                              </TableCell>

                              <TableCell className={cn(cellBase, cellCenter)}>
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => { e.stopPropagation(); handleRefreshRow(row, "procesados"); }}
                                    disabled={isBusy}
                                    className="h-8 w-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-xl">refresh</span>
                                  </Button>

                                  {puedeEditarRegistros(role) && (
                                    <Button
                                      size="sm"
                                      onClick={(e) => { e.stopPropagation(); openEditar(row); }}
                                      disabled={estado === "anulado"}
                                      className="h-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 transition-all"
                                    >
                                      <span className="material-symbols-outlined text-sm mr-1">edit</span>
                                      Editar
                                    </Button>
                                  )}

                                  {canAnularRegistros(role ?? "documentaria") && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => { e.stopPropagation(); openAnular(row); }}
                                      disabled={estado === "anulado"}
                                      className="h-8 rounded-lg text-red-500 hover:bg-red-50 font-bold px-3 transition-all"
                                    >
                                      <span className="material-symbols-outlined text-sm mr-1">block</span>
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

          {/* 📊 Stats Footer Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:scale-[1.02] transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sincronizados Hoy</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">{processedRows.length}</h3>
                </div>
                <div className="size-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 group-hover:rotate-12 transition-transform">
                  <span className="material-symbols-outlined italic">verified</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:scale-[1.02] transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pendientes SAP</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">{filteredPendientes.length}</h3>
                </div>
                <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 group-hover:rotate-12 transition-transform">
                  <span className="material-symbols-outlined italic">pending</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:scale-[1.02] transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Errores Sync</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">0</h3>
                </div>
                <div className="size-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 group-hover:rotate-12 transition-transform">
                  <span className="material-symbols-outlined italic">report</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel desktop solo con selección */}
        {showDetailDesktop && selectedDetail ? (
          <div className="hidden lg:block min-h-0 h-full max-h-[calc(100vh-260px)] sticky top-0">
            <DetailPanel
              title={tab === "pendientes" ? "Panel SAP · Pendiente" : "Panel SAP · Procesado"}
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
                  <SelectItem value="booking">BOOKING</SelectItem>
                  <SelectItem value="awb">Contenedor</SelectItem>
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
                <Label>Contenedor</Label>
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
