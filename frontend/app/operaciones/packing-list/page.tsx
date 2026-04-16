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
  Package,
  Anchor,
  X,
  Info,
  ChevronRight,
  FileCheck2,
  Inbox,
  Lock,
  ChevronDown,
  Files,
  History,
  FileX,
  FileWarning,
  Download as DownloadIcon,
  User
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
  recibidor: string | null;
  cliente: string | null;
}

type GenerationStatus = "idle" | "loading" | "success" | "error";

interface ClienteConfig {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  endpoint: string | null;
  available: boolean;
}

const CLIENTES_CONFIG: ClienteConfig[] = [
  { id: "OGL", label: "OGL", color: "emerald", bgColor: "bg-emerald-500", endpoint: "ogl", available: true },
  { id: "CLIENTE_2", label: "Cliente 2", color: "violet", bgColor: "bg-violet-400", endpoint: null, available: false },
  { id: "CLIENTE_3", label: "Cliente 3", color: "blue", bgColor: "bg-blue-400", endpoint: null, available: false },
];

interface EmisionHistorial {
  id: number;
  fecha: string;
  nave: string;
  estado: string;
  archivo: string;
  archivo_disponible: boolean;
  usuario: string;
  motivo_anulacion: string | null;
  bookings: string[];
  ordenes: string[];
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Multi-file Dropzone
// ─────────────────────────────────────────────────────────────
function MultiFileDropzone({
  label, sublabel, icon: Icon, accept, onFiles, files, color = "emerald",
}: {
  label: string; sublabel: string; icon: React.ElementType;
  accept: string; onFiles: (f: File[]) => void; files: File[]; color?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) onFiles([...files, ...dropped]);
  }, [onFiles, files]);

  const removeFile = (idx: number) => {
    const newFiles = [...files];
    newFiles.splice(idx, 1);
    onFiles(newFiles);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group relative border-2 border-dashed rounded-3xl p-6 transition-all duration-300 cursor-pointer select-none",
          isDragging ? `border-${color}-300 bg-${color}-50/60 scale-[1.01] shadow-lg`
            : "border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-white hover:shadow-md"
        )}
      >
        <input ref={inputRef} type="file" accept={accept} multiple className="hidden"
          onChange={(e) => onFiles([...files, ...Array.from(e.target.files || [])])} />

        <div className="flex flex-col items-center gap-2 text-center">
          <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
            `bg-${color}-50 text-${color}-500`)}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-700">{label}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{sublabel}</p>
          </div>
        </div>
      </div>

      {/* Lista de archivos seleccionados */}
      {files.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-2 space-y-1">
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 p-2 bg-slate-50 rounded-xl group/item">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-800 truncate max-w-[200px]">{f.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">{(f.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="h-7 w-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all opacity-0 group-hover/item:opacity-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="pt-1 px-2">
             <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.1em]">
                {files.length} archivo{files.length !== 1 ? 's' : ''} cargado{files.length !== 1 ? 's' : ''} · Se apilarán en este orden
             </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Single file dropzone (for Thermographs)
// ─────────────────────────────────────────────────────────────
function SingleFileDropzone({
  label, sublabel, icon: Icon, accept, onFile, file, color = "emerald",
}: {
  label: string; sublabel: string; icon: React.ElementType;
  accept: string; onFile: (f: File | null) => void; file: File | null; color?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFile(dropped);
  }, [onFile]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => !file && inputRef.current?.click()}
      className={cn(
        "group relative border-2 border-dashed rounded-3xl p-6 transition-all duration-300 cursor-pointer select-none",
        file ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50/60 hover:bg-white"
      )}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] || null)} />

      {file ? (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
             <div className="h-10 w-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0"><FileCheck2 className="h-5 w-5 text-violet-600" /></div>
             <div className="min-w-0">
                <p className="text-[11px] font-black text-slate-800 truncate">{file.name}</p>
                <p className="text-[9px] font-black text-violet-500 uppercase tracking-widest leading-none mt-1">Dato Cargado</p>
             </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onFile(null); }} 
            className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center py-1">
          <FileSpreadsheet className="h-5 w-5 text-violet-400" />
          <div>
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{label}</p>
            <p className="text-[9px] font-bold text-violet-500 uppercase tracking-[0.15em] mt-0.5">Archivo Requerido</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function PackingListCustomizadosPage() {
  const [naves, setNaves] = useState<NaveInfo[]>([]);
  const [isLoadingNaves, setIsLoadingNaves] = useState(true);
  const [searchNave, setSearchNave] = useState("");
  const [selectedNave, setSelectedNave] = useState<NaveInfo | null>(null);
  const [bookings, setBookings] = useState<BookingOGL[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<ClienteConfig>(CLIENTES_CONFIG[0]);
  const [clienteDropdownOpen, setClienteDropdownOpen] = useState(false);
  const [selectedRecibidor, setSelectedRecibidor] = useState<string>("");

  // Múltiples archivos para Confirmación
  const [filesConfirmacion, setFilesConfirmacion] = useState<File[]>([]);
  const [fileTermografos, setFileTermografos] = useState<File | null>(null);
  const [genStatus, setGenStatus] = useState<GenerationStatus>("idle");

  // ROLE MANAGEMENT (SIMULADO HASTA CONECTAR CON TU AUTH/JWT)
  const [userRole, setUserRole] = useState<"ADMIN" | "SUPERVISOR DOCUMENTARIO" | "OPERADOR">("SUPERVISOR DOCUMENTARIO");

  const [activeTab, setActiveTab] = useState<"generar" | "historial">("generar");
  const [historial, setHistorial] = useState<EmisionHistorial[]>([]);
  const [isLoadingHistorial, setIsLoadingHistorial] = useState(false);
  const [isAnulando, setIsAnulando] = useState(false);
  const [itemAnular, setItemAnular] = useState<EmisionHistorial | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("Error en datos de Excel de Confirmación");
  const [otroMotivo, setOtroMotivo] = useState("");
  const [isMotivoDropdownOpen, setIsMotivoDropdownOpen] = useState(false);

  const MOTIVOS_OPCIONES = [
    "Error en datos de Excel de Confirmación",
    "Cambio de Nave por Naviera",
    "Reproceso Interno de Beta",
    "Asignación errónea de termógrafos",
    "Otro"
  ];

  const fetchNaves = async () => {
    setIsLoadingNaves(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("nexo-token") : null;
      const resp = await fetch(`${API_BASE_URL}/api/v1/packing-list/naves`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resp.ok) setNaves(await resp.json());
      else toast.error("Error al cargar naves");
    } catch { toast.error("Error de conexión"); }
    finally { setIsLoadingNaves(false); }
  };

  useEffect(() => { fetchNaves(); }, []);

  const handleSelectNave = async (nave: NaveInfo) => {
    setSelectedNave(nave);
    setBookings([]);
    setSelectedRecibidor("");
    setFilesConfirmacion([]);
    setFileTermografos(null);
    setGenStatus("idle");
    setIsLoadingBookings(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("nexo-token") : null;
      const resp = await fetch(`${API_BASE_URL}/api/v1/packing-list/bookings?nave=${encodeURIComponent(nave.nave)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resp.ok) setBookings(await resp.json());
      else toast.error("No se encontraron bookings");
    } catch { toast.error("Error al cargar bookings"); }
    finally { setIsLoadingBookings(false); }
  };

  const handleGenerate = async () => {
    if (!selectedNave || filesConfirmacion.length === 0) {
      toast.error("Selecciona una Nave y sube al menos una Confirmación");
      return;
    }
    if (!fileTermografos) {
      toast.error("El archivo de Termógrafos es REQUERIDO para OGL");
      return;
    }
    setGenStatus("loading");
    try {
      const formData = new FormData();
      formData.append("nave", selectedNave.nave);
      if (selectedRecibidor) formData.append("recibidor", selectedRecibidor);
      // Adjuntar TODOS los archivos de confirmación
      filesConfirmacion.forEach((f) => formData.append("confirmaciones", f));
      if (fileTermografos) formData.append("termografos", fileTermografos);

      const token = typeof window !== "undefined" ? localStorage.getItem("nexo-token") : null;
      const resp = await fetch(`${API_BASE_URL}/api/v1/packing-list/generate/${selectedCliente.endpoint}`, {
        method: "POST", 
        body: formData,
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (resp.ok) {
        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const safeNaveName = selectedNave.nave.replace(/[/\\?%*:|"<>]/g, '_').replace(/ /g, "_");
        a.download = `PL_${selectedCliente.id}_${safeNaveName}.xlsx`;
        document.body.appendChild(a); a.click();
        window.URL.revokeObjectURL(url); document.body.removeChild(a);
        setGenStatus("success");
        // Refrescar naves para actualizar bloqueos
        fetchNaves();
        setSelectedNave(null);
        setBookings([]);
        setFilesConfirmacion([]);
        setFileTermografos(null);
      } else {
        const err = await resp.json();
        toast.error(`Error: ${err.detail}`);
        setGenStatus("error");
      }
    } catch { toast.error("Error al generar"); setGenStatus("error"); }
  };

  const fetchHistorial = async () => {
    setIsLoadingHistorial(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("nexo-token") : null;
      const resp = await fetch(`${API_BASE_URL}/api/v1/packing-list/historial`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setHistorial(data.items);
      }
    } catch { toast.error("Error al cargar historial"); }
    finally { setIsLoadingHistorial(false); }
  };

  useEffect(() => {
    if (activeTab === "historial") {
      fetchHistorial();
    }
  }, [activeTab]);

  const handleAnular = async () => {
    if (!itemAnular) return;
    const motivoFinal = motivoAnulacion === "Otro" ? otroMotivo : motivoAnulacion;
    if (!motivoFinal.trim()) {
      toast.error("Por favor ingresa un motivo");
      return;
    }

    setIsAnulando(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("nexo-token") : null;
      const resp = await fetch(`${API_BASE_URL}/api/v1/packing-list/${itemAnular.id}/anular`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ motivo: motivoFinal })
      });

      if (resp.ok) {
        toast.success("Packing List anulado exitosamente");
        setItemAnular(null);
        fetchHistorial();
        fetchNaves(); // Refresh naves list now that orders are free
      } else {
        const err = await resp.json();
        toast.error(`Error: ${err.detail}`);
      }
    } catch {
      toast.error("Error de conexión al anular");
    } finally {
      setIsAnulando(false);
    }
  };

  const filteredNaves = naves.filter((n) => n.nave.toLowerCase().includes(searchNave.toLowerCase()));

  return (
    <div className="space-y-8">
      {/* ══ HERO ══════════════════════════════════════════ */}
      <div className="relative bg-[#022c22] rounded-[2.5rem] p-10 overflow-hidden">
        <div className="absolute top-0 right-0 opacity-5 pointer-events-none"><ClipboardList className="h-72 w-72 translate-x-16 -translate-y-8 text-emerald-300" /></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold tracking-tighter text-white font-['Outfit']">
              Packing List <span className="text-emerald-400">Customizados</span>
            </h1>
            <p className="text-sm text-emerald-100/40 font-medium max-w-md">Apila múltiples confirmaciones en un solo documento consolidado por nave.</p>
          </div>
          <div className="hidden lg:block text-right">
             <div className="flex bg-emerald-900/50 rounded-2xl p-1 mb-2">
                <button onClick={() => setActiveTab("generar")} className={cn("px-4 py-2 rounded-xl text-xs font-black transition-all", activeTab === "generar" ? "bg-emerald-500 text-white shadow-lg" : "text-emerald-300/70 hover:text-white")}>Generar Nuevo</button>
                <button onClick={() => setActiveTab("historial")} className={cn("px-4 py-2 rounded-xl text-xs font-black transition-all", activeTab === "historial" ? "bg-emerald-500 text-white shadow-lg" : "text-emerald-300/70 hover:text-white")}>Historial de Emisiones</button>
             </div>
             {activeTab === "generar" ? (
               <>
                 <p className="text-xs font-black text-white/40 uppercase tracking-widest">{selectedNave ? "Nave Seleccionada" : "Esperando selección"}</p>
                 <p className="text-2xl font-black text-white truncate max-w-[200px] inline-block">{selectedNave?.nave || "—"}</p>
               </>
             ) : (
               <p className="text-2xl font-black text-white truncate max-w-[200px] inline-block mt-4">Auditoría OGL</p>
             )}
          </div>
        </div>
        
        {/* Toggle de Roles para prueba (Deberás quitarlo cuando lo vincules a tu login) */}
        <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-md p-2 rounded-xl flex items-center justify-center gap-2 border border-white/20">
           <span className="text-[10px] text-white font-black opacity-50 uppercase">Rol Actual (Prueba):</span>
           <button onClick={() => setUserRole("SUPERVISOR DOCUMENTARIO")} className={cn("px-2 py-1 rounded-lg text-[10px] font-black transition-all max-w-[100px] truncate", userRole === "SUPERVISOR DOCUMENTARIO" ? "bg-white text-[#022c22]" : "text-white hover:bg-white/20")} title="Supervisor Documentario">Sup. Doc.</button>
           <button onClick={() => setUserRole("ADMIN")} className={cn("px-2 py-1 rounded-lg text-[10px] font-black transition-all", userRole === "ADMIN" ? "bg-white text-[#022c22]" : "text-white hover:bg-white/20")}>Admin</button>
           <button onClick={() => setUserRole("OPERADOR")} className={cn("px-2 py-1 rounded-lg text-[10px] font-black transition-all", userRole === "OPERADOR" ? "bg-white text-[#022c22]" : "text-white hover:bg-white/20")}>Operador</button>
        </div>
      </div>

      {activeTab === "generar" ? (
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* ── COL 1: Naves ── */}
        <div className="xl:col-span-3 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col overflow-hidden h-[600px]">
          <div className="p-6 border-b border-slate-50 space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Anchor className="h-4 w-4 text-emerald-500" /><h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Naves</h2></div>
                <button onClick={fetchNaves} className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-all"><RefreshCw className={cn("h-3.5 w-3.5", isLoadingNaves && "animate-spin")} /></button>
             </div>
             <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" /><input type="text" placeholder="Buscar nave..." value={searchNave} onChange={(e) => setSearchNave(e.target.value)} className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" /></div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 lc-scroll">
            {filteredNaves.map((n) => (
              <button key={n.nave} onClick={() => handleSelectNave(n)} className={cn("w-full p-4 rounded-2xl text-left transition-all border-2", selectedNave?.nave === n.nave ? "bg-emerald-500 border-emerald-500 text-white shadow-lg" : "bg-slate-50/50 border-transparent hover:border-slate-200 text-slate-700")}>
                <p className="text-xs font-black uppercase truncate">{n.nave}</p>
                <p className={cn("text-[9px] font-bold mt-1", selectedNave?.nave === n.nave ? "text-white/70" : "text-slate-400")}>{n.bookings.length} Bookings OGL</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── COL 2: Bookings Informativos ── */}
        <div className="xl:col-span-4 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col overflow-hidden h-[600px]">
          <div className="p-5 border-b border-slate-50 space-y-4">
             <div className="flex items-center gap-2"><Package className="h-4 w-4 text-violet-500" /><h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Contenido en Nave</h2></div>
             
             {/* Selector de Cliente Principal */}
             <div className="relative">
                <button onClick={() => setClienteDropdownOpen(!clienteDropdownOpen)} className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
                   <div className="flex items-center gap-2.5">
                      <div className={cn("h-6 w-6 rounded-lg flex items-center justify-center text-white text-[9px] font-black", selectedCliente.bgColor)}>{selectedCliente.label[0]}</div>
                      <p className="text-xs font-black text-slate-800">{selectedCliente.label}</p>
                   </div>
                   <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", clienteDropdownOpen && "rotate-180")} />
                </button>
                {clienteDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-20">
                    {CLIENTES_CONFIG.map((c) => (
                      <button key={c.id} onClick={() => { if(c.available) { setSelectedCliente(c); setClienteDropdownOpen(false); } else toast.info("No disponible"); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left border-b last:border-0">
                        <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black", c.available ? c.bgColor : "bg-slate-200")}>{c.available ? c.label[0] : <Lock className="h-3 w-3" />}</div>
                        <p className={cn("text-xs font-black", c.available ? "text-slate-800" : "text-slate-400")}>{c.label}</p>
                      </button>
                    ))}
                  </div>
                )}
             </div>

             {/* FILTRO POR RECIBIDOR (Dinámico) 🕵️‍♂️ */}
             {bookings.length > 0 && (
               <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtrar por Recibidor</label>
                 <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setSelectedRecibidor("")}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2",
                        selectedRecibidor === "" ? "bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-200" : "bg-white border-slate-100 text-slate-400 hover:border-violet-200"
                      )}
                    >
                      TODOS
                    </button>
                    {Array.from(new Set(bookings.map(b => b.recibidor).filter(Boolean))).map((rec) => (
                      <button 
                        key={rec as string}
                        onClick={() => setSelectedRecibidor(rec as string)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2 truncate max-w-[200px]",
                          selectedRecibidor === rec ? "bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-200" : "bg-white border-slate-100 text-slate-400 hover:border-violet-200"
                        )}
                      >
                        {(rec as string).toUpperCase()}
                      </button>
                    ))}
                 </div>
               </div>
             )}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 lc-scroll">
            {bookings.length === 0 ? (
              <div className="py-20 text-center opacity-20"><Ship className="h-10 w-10 mx-auto text-slate-400" /><p className="text-[10px] font-black uppercase mt-2">Selecciona una nave</p></div>
            ) : bookings
                .filter(bk => !selectedRecibidor || bk.recibidor === selectedRecibidor)
                .map((bk) => (
              <div key={bk.booking} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-black text-slate-900">{bk.booking}</p>
                  <p className="text-[9px] font-bold px-2 py-0.5 bg-white border border-slate-100 rounded-full text-slate-500">{bk.contenedor || "Sin contenedor"}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                   <p className="text-[8px] font-black text-slate-400 uppercase">Orden: <span className="text-slate-700">{bk.orden_beta}</span></p>
                   <p className="text-[8px] font-black text-slate-400 uppercase truncate">Variedad: <span className="text-slate-700">{bk.variedad}</span></p>
                </div>
                <div className="mt-2 text-[8px] font-bold text-violet-500 uppercase truncate opacity-70">
                   RECIBIDOR: {bk.recibidor || "DESCONOCIDO"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── COL 3: Archivos y Acción ── */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 space-y-6">
             <div className="flex items-center gap-2 pb-2 border-b"><Upload className="h-4 w-4 text-slate-500" /><h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Múltiples Confirmaciones</h2></div>
             
             <MultiFileDropzone 
                label="Confirmaciones de Embarque" 
                sublabel="Sube uno o varios archivos .xlsx · El orden de apilado se respeta" 
                icon={Files} accept=".xlsx,.xls" 
                files={filesConfirmacion} onFiles={setFilesConfirmacion} 
                color="emerald" 
             />

             <div className="grid grid-cols-2 gap-4">
                <SingleFileDropzone 
                  label="Termógrafos" sublabel=".xlsx opcional" icon={FileSpreadsheet} 
                  accept=".xlsx,.xls" file={fileTermografos} onFile={setFileTermografos} 
                  color="violet" 
                />
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-center items-center text-center opacity-60">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Órdenes</p>
                   <p className="text-2xl font-black text-slate-800">
                      {selectedNave ? (
                        selectedRecibidor 
                          ? bookings.filter(b => b.recibidor === selectedRecibidor).length
                          : bookings.length
                      ) : "—"}
                    </p>
                </div>
             </div>

             <button 
                onClick={handleGenerate} 
                disabled={genStatus === "loading" || !selectedNave || filesConfirmacion.length === 0}
                className={cn(
                  "w-full h-16 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95",
                  genStatus === "loading" ? "bg-slate-200 text-slate-400" : "bg-[#022c22] text-white hover:bg-emerald-600 shadow-emerald-900/20"
                )}
             >
                {genStatus === "loading" ? <><Loader2 className="h-5 w-5 animate-spin"/>Procesando...</> : <><Download className="h-5 w-5" />Generar Packing List Consolidado</>}
             </button>

          </div>
        </div>
      </div>
      ) : (
         /* ── HISTORIAL TAB ── */
         <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm p-8 pb-12 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-50 rounded-2xl flex items-center justify-center"><History className="h-5 w-5 text-indigo-500" /></div>
                  <div>
                     <h2 className="text-xl font-black font-['Outfit'] text-slate-800 tracking-tight">Historial de Emisiones</h2>
                     <p className="text-xs text-slate-500 font-medium">Registro de Packing Lists generados y anulaciones</p>
                  </div>
               </div>
               <button onClick={fetchHistorial} className="h-10 px-4 rounded-xl font-black bg-slate-50 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all text-xs tracking-widest uppercase">
                  <RefreshCw className={cn("h-4 w-4 mr-2", isLoadingHistorial && "animate-spin")} /> Refrescar
               </button>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm whitespace-nowrap border-spacing-y-2 border-separate">
                 <thead>
                   <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                     <th className="pb-3 px-4 w-[80px]"># ID</th>
                     <th className="pb-3 px-4 w-[160px]">Fecha & Hora</th>
                     <th className="pb-3 px-4 w-[180px]">Nave Asignada</th>
                     <th className="pb-3 px-4 min-w-[200px]">Archivo / Auditoría</th>
                     <th className="pb-3 px-4 text-center w-[200px]">Órdenes (Beta)</th>
                     <th className="pb-3 px-4 text-center w-[120px]">Estado</th>
                     <th className="pb-3 px-4 text-right w-[120px]">Acción</th>
                   </tr>
                 </thead>
                 <tbody>
                   {historial.map((h) => (
                     <tr key={h.id} className={cn("bg-slate-50/50 hover:bg-slate-50 transition-colors group", h.estado === "ANULADO" ? "opacity-60" : "")}>
                       <td className="p-4 rounded-l-2xl font-black text-slate-800">PL-{String(h.id).padStart(4, '0')}</td>
                       <td className="p-4 text-slate-600 font-medium">
                          {new Date(h.fecha).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                       </td>
                       <td className="p-4 font-black tracking-tight text-slate-700">{h.nave}</td>
                       <td className="p-4">
                          <div className="flex flex-col gap-2 min-w-0">
                             {/* Fila Usuario */}
                             <div className="flex items-center gap-1.5 overflow-hidden">
                                <div className="h-5 w-5 bg-slate-100 rounded-md flex items-center justify-center shrink-0">
                                   <User className="h-3 w-3 text-slate-500" />
                                </div>
                                <span className="font-bold text-[10px] text-slate-500 truncate" title={`Generador: ${h.usuario}`}>{h.usuario}</span>
                             </div>

                             {/* Fila Archivo / Descarga */}
                             <div className="flex items-center gap-2 min-w-0">
                                {h.archivo_disponible ? (
                                  <a
                                    href={`${API_BASE_URL}/api/v1/packing-list/${h.id}/descargar`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                                    title={h.archivo}
                                  >
                                    <DownloadIcon className="h-3 w-3" />
                                    Descargar PL
                                  </a>
                                ) : (
                                  <div className="flex items-center gap-2 min-w-0 opacity-50">
                                    <FileSpreadsheet className="h-4 w-4 shrink-0 text-slate-400" />
                                    <p className="font-bold text-[10px] text-slate-400 truncate max-w-[150px]" title={h.archivo}>{h.archivo}</p>
                                  </div>
                                )}
                             </div>
                          </div>
                       </td>
                        <td className="p-4 text-center">
                           <div className="flex justify-center max-w-[200px] mx-auto">
                              <span className="font-black px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-emerald-700 text-[10px] break-all line-clamp-2 leading-tight shadow-sm" title={h.ordenes?.join(' / ')}>
                                 {h.ordenes && h.ordenes.length > 0 ? h.ordenes.join(' / ') : h.bookings.join(' / ')}
                              </span>
                           </div>
                        </td>
                       <td className="p-4 text-center">
                          {h.estado === "ACTIVO" ? (
                             <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-extrabold text-[10px] uppercase rounded-xl tracking-widest">Activo</span>
                          ) : (
                             <div className="flex flex-col items-center gap-1">
                               <span className="px-3 py-1 bg-rose-100 text-rose-700 font-extrabold text-[10px] uppercase rounded-xl tracking-widest">Anulado</span>
                               {h.motivo_anulacion && <span className="text-[9px] font-bold text-slate-400 max-w-[100px] truncate" title={h.motivo_anulacion}>"{h.motivo_anulacion}"</span>}
                             </div>
                          )}
                       </td>
                       <td className="p-4 rounded-r-2xl text-right">
                          {h.estado === "ACTIVO" && (userRole === "SUPERVISOR DOCUMENTARIO" || userRole === "ADMIN") && (
                             <button
                               onClick={() => {
                                 setItemAnular(h);
                                 setMotivoAnulacion(MOTIVOS_OPCIONES[0]);
                                 setOtroMotivo("");
                                 setIsMotivoDropdownOpen(false);
                               }}
                               className="px-3 py-2 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 hover:shadow-lg hover:shadow-rose-500/20 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-1.5 ml-auto"
                             >
                                <FileX className="h-3.5 w-3.5" /> Anular
                             </button>
                          )}
                          {h.estado === "ACTIVO" && userRole !== "SUPERVISOR DOCUMENTARIO" && userRole !== "ADMIN" && (
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Solo Sup. Doc. o Admin</span>
                          )}
                       </td>
                     </tr>
                   ))}
                   {historial.length === 0 && !isLoadingHistorial && (
                     <tr>
                        <td colSpan={7} className="p-16 text-center text-slate-400">
                           <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
                           <p className="font-black text-sm">No hay registros de generación en el historial</p>
                        </td>
                     </tr>
                   )}
                 </tbody>
               </table>
            </div>
         </div>
       )}

       {/* MODAL DE ANULACIÓN */}
       {itemAnular && (
          <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
             <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                <div className="p-6 bg-rose-50 border-b border-rose-100 flex justify-between items-start">
                   <div className="flex gap-4">
                      <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                         <FileWarning className="h-6 w-6 text-rose-500" />
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-rose-950 font-['Outfit']">Anular Packing List</h3>
                         <p className="text-xs font-bold text-rose-600/70 mt-1 uppercase tracking-widest">{itemAnular.nave}</p>
                      </div>
                   </div>
                   <button onClick={() => setItemAnular(null)} className="text-rose-400 hover:text-rose-600"><X className="h-5 w-5" /></button>
                </div>
                <div className="p-6 space-y-6">
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                         Al anular este documento, las <span className="font-black text-slate-800">{(itemAnular.ordenes?.length || itemAnular.bookings.length)} órdenes</span> que contiene se liberarán y volverán a estar disponibles para procesarse en otro Packing List.
                      </p>
                   </div>
                   
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Motivo de Anulación</label>
                      
                      {/* DROPDOWN CUSTOMIZADO */}
                      <div className="relative">
                        <button 
                           onClick={() => setIsMotivoDropdownOpen(!isMotivoDropdownOpen)}
                           className="w-full h-12 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 flex items-center justify-between hover:border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm"
                        >
                           <span>{motivoAnulacion}</span>
                           <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isMotivoDropdownOpen && "rotate-180 text-rose-500")} />
                        </button>

                        {isMotivoDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl z-[9999] py-1 animate-in fade-in slide-in-from-top-2 max-h-56 overflow-y-auto rounded-2xl">
                             {MOTIVOS_OPCIONES.map((opt) => (
                               <button 
                                 key={opt}
                                 onClick={() => {
                                   setMotivoAnulacion(opt);
                                   setIsMotivoDropdownOpen(false);
                                   if(opt !== "Otro") setOtroMotivo("");
                                 }}
                                 className={cn(
                                   "w-full text-left px-4 py-3 text-sm font-bold transition-all border-l-2",
                                   motivoAnulacion === opt 
                                     ? "border-rose-500 bg-rose-50/50 text-rose-700" 
                                     : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                 )}
                               >
                                 {opt}
                               </button>
                             ))}
                          </div>
                        )}
                      </div>
                   </div>

                   {motivoAnulacion === "Otro" && (
                      <div className="space-y-2 animate-in slide-in-from-top-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Especificar Motivo</label>
                         <input 
                            type="text" 
                            placeholder="Escribe el motivo..."
                            value={otroMotivo}
                            onChange={(e) => setOtroMotivo(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                         />
                      </div>
                   )}
                </div>
                <div className="p-4 border-t border-slate-100 flex gap-3 bg-slate-50/50 rounded-b-3xl">
                   <button onClick={() => setItemAnular(null)} className="flex-1 h-12 rounded-xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-200/50 transition-all">Cancelar</button>
                   <button 
                      onClick={handleAnular}
                      disabled={isAnulando || (motivoAnulacion === "Otro" && !otroMotivo.trim())}
                      className="flex-1 h-12 rounded-xl font-black text-xs uppercase tracking-widest bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                   >
                      {isAnulando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Anulación"}
                   </button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
}
