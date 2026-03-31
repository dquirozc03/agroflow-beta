"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Ship,
  ClipboardList,
  Search,
  Upload,
  FileSpreadsheet,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Package,
  Anchor,
  X,
  Info,
  ChevronRight,
  FileCheck2,
  Inbox
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface NaveInfo {
  nave: string;
  fuente: "reporte_embarques" | "posicionamiento";
  bookings: string[];
}

interface BookingOGL {
  booking: string;
  orden_beta: string | null;
  contenedor: string | null;
  dam: string | null;
  port_id_orig: string | null;
  port_id_dest: string | null;
  variedad: string | null;
  total_cajas: number | null;
  presentacion: string | null;
  pod: string | null;
  consignatario: string | null;
}

type GenerationStatus = "idle" | "loading" | "success" | "error";

// ─────────────────────────────────────────────────────────────
// COMPONENT: Drag-and-drop file uploader premium
// ─────────────────────────────────────────────────────────────
function FileDropzone({
  label,
  sublabel,
  icon: Icon,
  accept,
  onFile,
  file,
  color = "emerald",
}: {
  label: string;
  sublabel: string;
  icon: React.ElementType;
  accept: string;
  onFile: (f: File | null) => void;
  file: File | null;
  color?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) onFile(dropped);
    },
    [onFile]
  );

  const colorMap: Record<string, string> = {
    emerald: "border-emerald-300 bg-emerald-50/60 text-emerald-600",
    violet: "border-violet-300 bg-violet-50/60 text-violet-600",
  };
  const activeColor = colorMap[color] || colorMap.emerald;

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !file && inputRef.current?.click()}
      className={cn(
        "group relative border-2 border-dashed rounded-3xl p-8 transition-all duration-300 cursor-pointer select-none",
        isDragging
          ? activeColor + " scale-[1.02] shadow-xl"
          : file
          ? "border-slate-200 bg-white shadow-sm"
          : "border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-white hover:shadow-md"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] || null)}
      />

      {file ? (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
              <FileCheck2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{file.name}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {(file.size / 1024).toFixed(1)} KB · Listo para procesar
              </p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onFile(null); }}
            className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-rose-100 hover:text-rose-500 flex items-center justify-center transition-all text-slate-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
            `bg-${color}-50 text-${color}-500`
          )}>
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">{label}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{sublabel}</p>
          </div>
          <div className={cn(
            "text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest",
            `bg-${color}-50 text-${color}-600`
          )}>
            Arrastra o haz clic
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function PackingListOGLPage() {
  // Estado principal
  const [naves, setNaves] = useState<NaveInfo[]>([]);
  const [isLoadingNaves, setIsLoadingNaves] = useState(true);
  const [searchNave, setSearchNave] = useState("");

  const [selectedNave, setSelectedNave] = useState<NaveInfo | null>(null);
  const [bookings, setBookings] = useState<BookingOGL[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState<BookingOGL | null>(null);

  // Archivos
  const [fileConfirmacion, setFileConfirmacion] = useState<File | null>(null);
  const [fileTermografos, setFileTermografos] = useState<File | null>(null);

  // Generación
  const [genStatus, setGenStatus] = useState<GenerationStatus>("idle");

  // ─── Cargar naves al montar ───────────────────────────────
  const fetchNaves = async () => {
    setIsLoadingNaves(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/packing-list/naves`);
      if (resp.ok) {
        const data: NaveInfo[] = await resp.json();
        setNaves(data);
      } else {
        toast.error("Error al cargar naves OGL");
      }
    } catch {
      toast.error("Error de conexión al cargar naves");
    } finally {
      setIsLoadingNaves(false);
    }
  };

  useEffect(() => { fetchNaves(); }, []);

  // ─── Seleccionar nave y cargar sus bookings OGL ───────────
  const handleSelectNave = async (nave: NaveInfo) => {
    setSelectedNave(nave);
    setSelectedBooking(null);
    setBookings([]);
    setFileConfirmacion(null);
    setFileTermografos(null);
    setGenStatus("idle");
    setIsLoadingBookings(true);

    try {
      const resp = await fetch(
        `${API_BASE_URL}/api/v1/packing-list/bookings?nave=${encodeURIComponent(nave.nave)}`
      );
      if (resp.ok) {
        const data: BookingOGL[] = await resp.json();
        setBookings(data);
      } else {
        toast.error("No se encontraron bookings OGL para esta nave");
      }
    } catch {
      toast.error("Error al cargar bookings");
    } finally {
      setIsLoadingBookings(false);
    }
  };

  // ─── Generar el Packing List ──────────────────────────────
  const handleGenerate = async () => {
    if (!selectedBooking || !fileConfirmacion || !selectedNave) {
      toast.error("Selecciona una Nave, un Booking y el archivo de Confirmación");
      return;
    }

    setGenStatus("loading");

    try {
      const formData = new FormData();
      formData.append("nave", selectedNave.nave);
      formData.append("booking", selectedBooking.booking);
      formData.append("confirmacion", fileConfirmacion);
      if (fileTermografos) {
        formData.append("termografos", fileTermografos);
      }

      const resp = await fetch(`${API_BASE_URL}/api/v1/packing-list/generate/ogl`, {
        method: "POST",
        body: formData,
      });

      if (resp.ok) {
        const blob = await resp.blob();
        const disposition = resp.headers.get("Content-Disposition");
        let filename = `PackingList_OGL_${selectedBooking.booking}.xlsx`;
        if (disposition) {
          const match = /filename=([^\s;]+)/.exec(disposition);
          if (match) filename = match[1];
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setGenStatus("success");
        toast.success(`✅ Packing List generado: ${filename}`);
      } else {
        const err = await resp.json().catch(() => ({ detail: "Error desconocido" }));
        toast.error(`Error: ${err.detail}`);
        setGenStatus("error");
      }
    } catch {
      toast.error("Error de conexión al generar Packing List");
      setGenStatus("error");
    }
  };

  // ─── Filtro de naves ──────────────────────────────────────
  const filteredNaves = naves.filter((n) =>
    n.nave.toLowerCase().includes(searchNave.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* ══════════════════════════════════════════
          HEADER HERO
      ══════════════════════════════════════════ */}
      <div className="relative bg-[#022c22] rounded-[2.5rem] p-10 overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
          <ClipboardList className="h-72 w-72 translate-x-16 -translate-y-8 text-emerald-300" />
        </div>
        <div className="absolute bottom-0 left-0 opacity-[0.03] pointer-events-none">
          <Ship className="h-64 w-64 -translate-x-10 translate-y-8" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/60">
                Gestión Operativa
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tighter text-white font-['Outfit']">
              Packing List <span className="text-emerald-400">OGL</span>
            </h1>
            <p className="text-sm text-emerald-100/40 font-medium max-w-md">
              Generación automática del Packing List oficial para el cliente OGL, cruzando datos maestros con la Confirmación de embarque.
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/40">Naves disponibles</p>
              <p className="text-4xl font-black text-white">{naves.length}</p>
            </div>
            <div className="h-16 w-px bg-emerald-900" />
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/40">Bookings OGL</p>
              <p className="text-4xl font-black text-white">
                {naves.reduce((acc, n) => acc + n.bookings.length, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          CUERPO PRINCIPAL: Layout 3 columnas
      ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* ─────────────────────────────────────
            COLUMNA 1: Selector de Nave  (3 cols)
        ───────────────────────────────────── */}
        <div className="xl:col-span-3 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Anchor className="h-4 w-4 text-emerald-500" />
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Naves</h2>
              </div>
              <button
                onClick={fetchNaves}
                className="h-8 w-8 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center text-slate-400 transition-all"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isLoadingNaves && "animate-spin")} />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input
                type="text"
                placeholder="Buscar nave..."
                value={searchNave}
                onChange={(e) => setSearchNave(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
              />
            </div>
          </div>

          {/* Lista de naves */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 lc-scroll">
            {isLoadingNaves ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-slate-50 animate-pulse" />
              ))
            ) : filteredNaves.length === 0 ? (
              <div className="py-16 text-center space-y-3 opacity-30">
                <Inbox className="h-8 w-8 mx-auto text-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Sin naves OGL activas
                </p>
              </div>
            ) : (
              filteredNaves.map((nave) => {
                const isActive = selectedNave?.nave === nave.nave;
                return (
                  <button
                    key={nave.nave}
                    onClick={() => handleSelectNave(nave)}
                    className={cn(
                      "w-full p-4 rounded-2xl text-left transition-all duration-200 border-2 group",
                      isActive
                        ? "bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20 text-white"
                        : "bg-slate-50/50 border-transparent hover:border-slate-200 hover:bg-white text-slate-700"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className={cn(
                          "text-xs font-black uppercase tracking-tight truncate",
                          isActive ? "text-white" : "text-slate-800"
                        )}>
                          {nave.nave}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                            isActive
                              ? "bg-white/20 text-white"
                              : nave.fuente === "reporte_embarques"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-amber-50 text-amber-600"
                          )}>
                            {nave.fuente === "reporte_embarques" ? "Reporte" : "Pos."}
                          </span>
                          <span className={cn(
                            "text-[9px] font-bold",
                            isActive ? "text-white/70" : "text-slate-400"
                          )}>
                            {nave.bookings.length} booking{nave.bookings.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 shrink-0 transition-transform mt-0.5",
                        isActive ? "text-white rotate-90" : "text-slate-300 group-hover:translate-x-0.5"
                      )} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────
            COLUMNA 2: Órdenes OGL de la nave (4 cols)
        ───────────────────────────────────── */}
        <div className="xl:col-span-4 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-violet-500" />
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">
                Bookings OGL
              </h2>
              {selectedNave && (
                <span className="ml-auto text-[9px] font-black px-2 py-1 rounded-full bg-violet-50 text-violet-600 uppercase tracking-widest">
                  {selectedNave.nave}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 lc-scroll">
            {!selectedNave ? (
              <div className="py-20 text-center space-y-3 opacity-20">
                <Ship className="h-10 w-10 mx-auto text-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Selecciona una nave
                </p>
              </div>
            ) : isLoadingBookings ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-50 animate-pulse" />
              ))
            ) : bookings.length === 0 ? (
              <div className="py-16 text-center space-y-3 opacity-30">
                <AlertCircle className="h-8 w-8 mx-auto text-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Sin Bookings OGL para esta nave
                </p>
              </div>
            ) : (
              bookings.map((bk) => {
                const isActive = selectedBooking?.booking === bk.booking;
                return (
                  <button
                    key={bk.booking}
                    onClick={() => { setSelectedBooking(bk); setGenStatus("idle"); }}
                    className={cn(
                      "w-full p-5 rounded-2xl text-left transition-all duration-200 border-2 group",
                      isActive
                        ? "bg-violet-500 border-violet-500 shadow-lg shadow-violet-500/20"
                        : "border-transparent bg-slate-50/50 hover:border-slate-200 hover:bg-white"
                    )}
                  >
                    {/* Booking ID */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={cn(
                        "text-xs font-black uppercase tracking-widest",
                        isActive ? "text-white" : "text-slate-900"
                      )}>
                        {bk.booking}
                      </span>
                      {bk.contenedor && (
                        <span className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight",
                          isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                        )}>
                          {bk.contenedor.length > 4
                            ? `${bk.contenedor.slice(0, 4)} ${bk.contenedor.slice(4)}`
                            : bk.contenedor}
                        </span>
                      )}
                    </div>

                    {/* Detalles */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Orden", val: bk.orden_beta || "—" },
                        { label: "Variedad", val: bk.variedad || "—" },
                        { label: "Origen", val: bk.port_id_orig || "—" },
                        { label: "Destino", val: bk.port_id_dest || "—" },
                      ].map((item) => (
                        <div key={item.label}>
                          <p className={cn(
                            "text-[8px] font-black uppercase tracking-widest mb-0.5",
                            isActive ? "text-white/60" : "text-slate-400"
                          )}>
                            {item.label}
                          </p>
                          <p className={cn(
                            "text-[10px] font-bold truncate",
                            isActive ? "text-white" : "text-slate-700"
                          )}>
                            {item.val}
                          </p>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────
            COLUMNA 3: Carga de archivos + Acción (5 cols)
        ───────────────────────────────────── */}
        <div className="xl:col-span-5 flex flex-col gap-5">
          {/* Panel de archivos */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-7 space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
              <Upload className="h-4 w-4 text-slate-500" />
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">
                Archivos de Soporte
              </h2>
            </div>

            {/* Uploader Confirmación (requerido) */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                Confirmación de Embarque
                <span className="text-rose-400">*</span>
              </label>
              <FileDropzone
                label="Confirmación de Embarque"
                sublabel="Archivo .xlsx · ID Pallet, Calibre, Kilos, Cosecha, Proceso, Lote"
                icon={FileSpreadsheet}
                accept=".xlsx,.xls"
                file={fileConfirmacion}
                onFile={setFileConfirmacion}
                color="emerald"
              />
            </div>

            {/* Uploader Termógrafos (opcional) */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                Cuadro de Termógrafos
                <span className="text-slate-400 font-medium">(Opcional)</span>
              </label>
              <FileDropzone
                label="Cuadro de Termógrafos"
                sublabel="Archivo .xlsx · Códigos de equipos de monitoreo"
                icon={FileSpreadsheet}
                accept=".xlsx,.xls"
                file={fileTermografos}
                onFile={setFileTermografos}
                color="violet"
              />
            </div>
          </div>

          {/* Panel de resumen + botón acción */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-7 space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
              <Info className="h-4 w-4 text-slate-400" />
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">
                Resumen del Despacho
              </h2>
            </div>

            {/* Grid de datos del booking seleccionado */}
            {selectedBooking ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Booking", val: selectedBooking.booking },
                  { label: "Nave", val: selectedNave?.nave || "—" },
                  { label: "Consignatario", val: selectedBooking.consignatario || "—" },
                  { label: "Contenedor", val: selectedBooking.contenedor
                    ? `${selectedBooking.contenedor.slice(0,4)} ${selectedBooking.contenedor.slice(4)}`
                    : "PENDIENTE"
                  },
                  { label: "Puerto Origen", val: selectedBooking.port_id_orig || "—" },
                  { label: "Puerto Destino", val: selectedBooking.port_id_dest || "—" },
                  { label: "Variedad", val: selectedBooking.variedad || "—" },
                  { label: "Total Cajas", val: selectedBooking.total_cajas?.toString() || "—" },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-2xl p-3">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{item.label}</p>
                    <p className="text-[11px] font-bold text-slate-800 truncate" title={item.val}>{item.val}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center opacity-20 space-y-3">
                <ClipboardList className="h-8 w-8 mx-auto text-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Selecciona un booking
                </p>
              </div>
            )}

            {/* Botón de generación */}
            <button
              onClick={handleGenerate}
              disabled={genStatus === "loading" || !selectedBooking || !fileConfirmacion}
              className={cn(
                "w-full h-16 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-300 shadow-xl active:scale-95",
                genStatus === "success"
                  ? "bg-emerald-500 text-white shadow-emerald-500/30"
                  : genStatus === "error"
                  ? "bg-rose-500 text-white shadow-rose-500/30"
                  : genStatus === "loading"
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : !selectedBooking || !fileConfirmacion
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-[#022c22] text-white hover:bg-emerald-600 shadow-emerald-900/20"
              )}
            >
              {genStatus === "loading" ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generando Packing List...
                </>
              ) : genStatus === "success" ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  ¡Packing List Generado!
                </>
              ) : genStatus === "error" ? (
                <>
                  <AlertCircle className="h-5 w-5" />
                  Error · Intentar de nuevo
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Generar Packing List OGL
                </>
              )}
            </button>

            {/* Checklist de prerrequisitos */}
            <div className="space-y-1.5">
              {[
                { label: "Nave seleccionada", ok: !!selectedNave },
                { label: "Booking OGL activo", ok: !!selectedBooking },
                { label: "Archivo Confirmación cargado", ok: !!fileConfirmacion },
              ].map((req) => (
                <div key={req.label} className="flex items-center gap-2">
                  {req.ok
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    : <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-200 shrink-0" />
                  }
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wide",
                    req.ok ? "text-emerald-600" : "text-slate-400"
                  )}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
