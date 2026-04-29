"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  User,
  Trash2,
  Clock,
  LayoutDashboard,
  ArrowRight,
  ShieldCheck,
  Bell,
  Globe,
  FileText,
  Zap,
  AlertTriangle,
  Copy,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface NaveInfo {
  nave: string;
  fuente: "reporte_embarques" | "posicionamiento" | "consolidada";
  bookings: string[];
  cultivos: string[];
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
  usuario_anulacion: string | null;
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
  const [selectedCultivo, setSelectedCultivo] = useState<string>("");
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

  const { user } = useAuth();
  const userRole = user?.rol || "OPERADOR";

  const [activeTab, setActiveTab] = useState<"generar" | "historial">("generar");
  const [historial, setHistorial] = useState<EmisionHistorial[]>([]);
  const [isLoadingHistorial, setIsLoadingHistorial] = useState(false);
  const [searchTermHistorial, setSearchTermHistorial] = useState("");
  const [isAnulando, setIsAnulando] = useState(false);
  const [itemAnular, setItemAnular] = useState<EmisionHistorial | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("Error en datos de Excel de Confirmación");
  const [otroMotivo, setOtroMotivo] = useState("");
  const [isMotivoDropdownOpen, setIsMotivoDropdownOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<"TODOS" | "ACTIVO" | "ANULADO">("TODOS");

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
      const resp = await fetch(`${API_BASE_URL}/api/v1/packing-list/naves`);
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
      const resp = await fetch(`${API_BASE_URL}/api/v1/packing-list/bookings?nave=${encodeURIComponent(nave.nave)}`);
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

      const token = localStorage.getItem("nexo-token");
      const resp = await fetch(`${API_BASE_URL}/api/v1/packing-list/generate/${selectedCliente.endpoint}`, {
        method: "POST",
        headers: {
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: formData
      });

      if (resp.ok) {
        const blob = await resp.blob();
        
        // --- PROCESAR ALERTAS DE VALIDACIÓN (X-PL-Warnings) ---
        const warningsHeader = resp.headers.get("X-PL-Warnings");
        if (warningsHeader) {
          try {
            const warnings = JSON.parse(warningsHeader);
            warnings.forEach((msg: string) => {
              toast.warning(msg, {
                duration: 10000,
                icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
                style: { border: '2px solid #f59e0b', background: '#fffbeb' }
              });
            });
          } catch (e) {
            console.error("Error parseando warnings:", e);
          }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `PL_${selectedCliente.id}_${selectedNave.nave.replace(/ /g, "_")}.xlsx`;
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
      const resp = await fetch(`${API_BASE_URL}/api/v1/packing-list/historial`);
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
      const token = localStorage.getItem("nexo-token");
      const resp = await fetch(`${API_BASE_URL}/api/v1/packing-list/${itemAnular.id}/anular`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ motivo: motivoFinal })
      });

      if (resp.ok) {
        setItemAnular(null);
        setShowSuccessModal(true);
        fetchHistorial();
        fetchNaves(); 
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

  // Obtener lista única de cultivos de todas las naves
  const allCultivos = Array.from(new Set(naves.flatMap(n => n.cultivos))).sort();

  const filteredNaves = naves.filter((n) => {
    const matchesSearch = n.nave.toLowerCase().includes(searchNave.toLowerCase());
    const matchesCultivo = !selectedCultivo || n.cultivos.includes(selectedCultivo);
    return matchesSearch && matchesCultivo;
  });

  const filteredHistorial = historial.filter((h) => {
     const matchesEstado = filtroEstado === "TODOS" || h.estado === filtroEstado;
     const matchesSearch = searchTermHistorial.trim() === "" || h.nave.toLowerCase().includes(searchTermHistorial.toLowerCase().trim());
     return matchesEstado && matchesSearch;
  });

  return (
    <>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
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
             <div className="flex bg-emerald-900/50 rounded-2xl p-1 mb-2 border border-emerald-800/50">
                <button onClick={() => setActiveTab("generar")} className={cn("px-5 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest", activeTab === "generar" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-emerald-300/50 hover:text-white")}>Generación</button>
                <button onClick={() => setActiveTab("historial")} className={cn("px-5 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest", activeTab === "historial" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-emerald-300/50 hover:text-white")}>Historial</button>
             </div>
             {activeTab === "generar" ? (
               <div className="mt-4 animate-in slide-in-from-right-4 duration-500">
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{selectedNave ? "Nave Seleccionada" : "Esperando selección"}</p>
                 <p className="text-2xl font-black text-white truncate max-w-[250px] inline-block font-['Outfit'] tracking-tight">{selectedNave?.nave || "—"}</p>
               </div>
             ) : (
               <div className="mt-4 animate-in slide-in-from-right-4 duration-500">
                  <p className="text-2xl font-black text-white truncate max-w-[250px] inline-block font-['Outfit'] tracking-tight">Auditoría Packing List</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {activeTab === "generar" ? (
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-in fade-in duration-500">
        {/* ── COL 1: Naves ── */}
        <div className="xl:col-span-3 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex flex-col overflow-hidden h-[620px]">
          <div className="p-7 border-b border-slate-50 space-y-5">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5"><Anchor className="h-5 w-5 text-emerald-500" /><h2 className="text-xs font-black uppercase tracking-[0.15em] text-slate-700">Explorar Naves</h2></div>
                <button onClick={fetchNaves} className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-100"><RefreshCw className={cn("h-4 w-4", isLoadingNaves && "animate-spin")} /></button>
             </div>
             <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" /><input type="text" placeholder="Buscar nave..." value={searchNave} onChange={(e) => setSearchNave(e.target.value)} className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/50 transition-all" /></div>
             
             {allCultivos.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button 
                    onClick={() => setSelectedCultivo("")}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2",
                      selectedCultivo === "" ? "bg-[#022c22] border-[#022c22] text-white shadow-md shadow-emerald-900/20" : "bg-white border-slate-100 text-slate-400 hover:border-emerald-200"
                    )}
                  >
                    TODOS
                  </button>
                  {allCultivos.map((c) => (
                    <button 
                      key={c}
                      onClick={() => setSelectedCultivo(c)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2 uppercase",
                        selectedCultivo === c ? "bg-[#022c22] border-[#022c22] text-white shadow-md shadow-emerald-900/20" : "bg-white border-slate-100 text-slate-400 hover:border-emerald-200"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
             )}

          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 lc-scroll">
            {filteredNaves.map((n) => (
              <button key={n.nave} onClick={() => handleSelectNave(n)} className={cn("w-full p-5 rounded-3xl text-left transition-all border-2 group", selectedNave?.nave === n.nave ? "bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-500/20 scale-[1.02]" : "bg-slate-50/50 border-transparent hover:border-slate-200 text-slate-700 hover:bg-white")}>
                <div className="flex justify-between items-start">
                   <p className="text-xs font-black uppercase truncate max-w-[150px] font-['Outfit'] tracking-tight">{n.nave}</p>
                   {n.cultivos.length > 0 && (
                     <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest", selectedNave?.nave === n.nave ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700")}>
                        {n.cultivos.join(' / ')}
                     </span>
                   )}
                </div>
                <p className={cn("text-[10px] font-bold mt-2 flex items-center gap-1.5", selectedNave?.nave === n.nave ? "text-white/70" : "text-slate-400")}><Package className="h-3 w-3" />{n.bookings.length} Bookings OGL</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── COL 2: Bookings Informativos ── */}
        <div className="xl:col-span-4 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex flex-col overflow-hidden h-[620px]">
          <div className="p-7 border-b border-slate-50 space-y-5">
             <div className="flex items-center gap-2.5"><Package className="h-5 w-5 text-violet-500" /><h2 className="text-xs font-black uppercase tracking-[0.15em] text-slate-700">Contenido en Nave</h2></div>
             
             {/* Selector de Cliente Principal */}
             <div className="relative">
                <button onClick={() => setClienteDropdownOpen(!clienteDropdownOpen)} className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] group hover:border-emerald-300 transition-all">
                   <div className="flex items-center gap-3">
                      <div className={cn("h-7 w-7 rounded-xl flex items-center justify-center text-white text-[10px] font-black shadow-inner", selectedCliente.bgColor)}>{selectedCliente.label[0]}</div>
                      <p className="text-xs font-black text-slate-800 tracking-tight">{selectedCliente.label}</p>
                   </div>
                   <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform group-hover:text-emerald-500", clienteDropdownOpen && "rotate-180")} />
                </button>
                {clienteDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl z-20 py-2 animate-in fade-in slide-in-from-top-4 duration-300">
                    {CLIENTES_CONFIG.map((c) => (
                      <button key={c.id} onClick={() => { if(c.available) { setSelectedCliente(c); setClienteDropdownOpen(false); } else toast.info("No disponible"); }} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 text-left transition-colors border-b last:border-0 group">
                        <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center text-white text-[11px] font-black shadow-sm", c.available ? c.bgColor : "bg-slate-200")}>{c.available ? c.label[0] : <Lock className="h-3 w-3" />}</div>
                        <p className={cn("text-[11px] font-black uppercase tracking-widest transition-colors", c.available ? "text-slate-800 group-hover:text-emerald-600" : "text-slate-400")}>{c.label}</p>
                      </button>
                    ))}
                  </div>
                )}
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 lc-scroll bg-slate-50/20">
            {bookings.length === 0 ? (
              <div className="py-32 text-center opacity-20"><Ship className="h-16 w-16 mx-auto text-slate-400 mb-4 animate-pulse" /><p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">Selecciona una nave para explorar bookings</p></div>
            ) : bookings.filter(bk => !selectedRecibidor || bk.recibidor === selectedRecibidor).map((bk) => (
              <div key={bk.booking} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-50">
                   <p className="text-xs font-black text-slate-900 font-['Outfit'] tracking-tight">{bk.booking}</p>
                   <p className="text-[9px] font-black px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-slate-500 uppercase tracking-widest">{bk.contenedor || "S/N"}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                   <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Orden Beta</p>
                      <p className="text-[10px] font-black text-emerald-600 font-['Outfit']">{bk.orden_beta || "—"}</p>
                   </div>
                   <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Variedad</p>
                      <p className="text-[10px] font-black text-slate-700 font-['Outfit'] truncate">{bk.variedad || "—"}</p>
                   </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-violet-400" />
                   <p className="text-[9px] font-black text-slate-400 uppercase truncate">Recibidor: <span className="text-slate-600">{bk.recibidor || "Desconocido"}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── COL 3: Archivos y Acción ── */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm p-8 space-y-8">
             <div className="flex items-center gap-3 pb-4 border-b border-slate-50"><Upload className="h-5 w-5 text-emerald-500" /><h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-700">Múltiples Confirmaciones</h2></div>
             
             <MultiFileDropzone 
                label="Confirmaciones de Embarque" 
                sublabel="Sube archivos .xlsx · Se apilarán en el orden cargado" 
                icon={Files} accept=".xlsx,.xls" 
                files={filesConfirmacion} onFiles={setFilesConfirmacion} 
                color="emerald" 
             />

             <div className="grid grid-cols-2 gap-5">
                <SingleFileDropzone 
                  label="Archivo Termógrafos" sublabel=".xlsx obligatorio" icon={FileSpreadsheet} 
                  accept=".xlsx,.xls" file={fileTermografos} onFile={setFileTermografos} 
                  color="violet" 
                />
                <div className="p-7 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col justify-center items-center text-center group hover:bg-emerald-50 transition-colors">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Órdenes</p>
                   <p className="text-3xl font-black text-slate-800 font-['Outfit'] tracking-tighter">
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
                  "w-full h-20 rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all shadow-2xl active:scale-95 group overflow-hidden relative",
                  genStatus === "loading" ? "bg-slate-100 text-slate-400" : "bg-[#022c22] text-white hover:bg-emerald-700 shadow-emerald-900/30"
                )}
             >
                {genStatus === "loading" ? <><Loader2 className="h-6 w-6 animate-spin"/>Procesando Datos...</> : <><Download className="h-6 w-6 transition-transform group-hover:-translate-y-1" />Generar Packing List Consolidado</>}
                {genStatus !== "loading" && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />}
             </button>

          </div>
        </div>
      </div>
      ) : (
         /* ── HISTORIAL TAB (Sincronizado con DEV 💎) ── */
         <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col md:flex-row items-center gap-4 p-6 border-b border-slate-50">
               <div className="flex items-center gap-4 flex-1">
                  <div className="h-14 w-14 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center shadow-inner"><Clock className="h-7 w-7" /></div>
                  <div className="space-y-1">
                     <h3 className="text-2xl font-black text-slate-900 uppercase font-['Outfit'] tracking-tight">Historial de Emisiones</h3>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{filteredHistorial.length} Registros encontrados</p>
                  </div>
               </div>
               <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      placeholder="Buscar por Nave..." 
                      value={searchTermHistorial}
                      onChange={(e) => setSearchTermHistorial(e.target.value)}
                      className="w-full pl-11 h-12 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                  <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-100">
                     {(["TODOS", "ACTIVO", "ANULADO"] as const).map((f) => (
                        <button 
                          key={f} 
                          onClick={() => setFiltroEstado(f)}
                          className={cn(
                            "px-5 py-2.5 rounded-[0.85rem] text-[10px] font-black uppercase tracking-widest transition-all",
                            filtroEstado === f ? "bg-white text-slate-950 shadow-lg shadow-slate-200/50" : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          {f}
                        </button>
                     ))}
                  </div>
                  <button onClick={fetchHistorial} className="h-12 w-12 rounded-2xl hover:bg-slate-50 border border-slate-100 flex items-center justify-center transition-all group active:scale-95 shadow-sm">
                     <RefreshCw className={cn("h-5 w-5 text-slate-400 group-hover:text-emerald-500 group-hover:rotate-180 transition-all duration-500", isLoadingHistorial && "animate-spin")} />
                  </button>
               </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b border-slate-50">
                        <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Fecha / Hora</th>
                        <th className="px-6 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Usuario</th>
                        <th className="px-6 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Nave</th>
                        <th className="px-6 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Orden Beta</th>
                        <th className="px-6 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Cliente</th>
                        <th className="px-6 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Cultivo</th>
                        <th className="px-6 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Estado</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Acciones</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {filteredHistorial.map((h) => (
                        <tr key={h.id} className={cn(
                          "group hover:bg-slate-50/50 transition-all",
                          h.estado === "ANULADO" && "bg-slate-50/30"
                        )}>
                           <td className="px-8 py-7 text-center">
                              <div className="flex flex-col items-center">
                                 <span className="font-black text-slate-900 text-sm font-['Outfit'] tracking-tight">{new Date(h.fecha).toLocaleDateString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric' })}</span>
                                 <span className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-widest">{new Date(h.fecha).toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit', hour12: false })}</span>
                              </div>
                           </td>
                           <td className="px-6 py-7">
                              <div className="flex flex-col items-center gap-2">
                                 <div className="flex items-center gap-3">
                                    <div className={cn(
                                       "h-9 w-9 rounded-full flex items-center justify-center text-xs font-black text-white shadow-md uppercase",
                                       ["bg-emerald-500", "bg-indigo-500", "bg-violet-500", "bg-amber-500"][h.usuario.charCodeAt(0) % 4]
                                    )}>{h.usuario[0]}</div>
                                    <span className="font-black text-[11px] uppercase tracking-widest text-slate-700">{h.usuario}</span>
                                 </div>
                                 {h.estado === "ANULADO" && (
                                    <div className="flex flex-col items-center gap-1 animate-in slide-in-from-top-1">
                                       <span className="text-[8px] font-black uppercase text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 whitespace-nowrap">Anulado por: {h.usuario_anulacion || "SISTEMA"}</span>
                                       {h.motivo_anulacion && (
                                          <div className="relative group/motivo">
                                             <span className="text-[9px] font-bold text-slate-400 italic cursor-help hover:text-slate-600 transition-colors truncate max-w-[120px] block text-center">"{h.motivo_anulacion}"</span>
                                             <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-3 bg-slate-900 text-white rounded-2xl shadow-2xl opacity-0 group-hover/motivo:opacity-100 transition-all duration-200 pointer-events-none z-[100] scale-95 group-hover/motivo:scale-100 origin-bottom">
                                                <p className="font-black text-rose-400 uppercase tracking-widest text-[8px] mb-1.5 border-b border-white/10 pb-1.5 text-center">Motivo Completo</p>
                                                <p className="font-bold text-[10px] leading-tight text-slate-200 text-center uppercase">{h.motivo_anulacion}</p>
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900" />
                                             </div>
                                          </div>
                                       )}
                                    </div>
                                 )}
                              </div>
                           </td>
                           <td className="px-6 py-7 text-center">
                              <span className="font-black text-sm text-slate-900 font-['Outfit'] tracking-tight">{h.nave}</span>
                           </td>
                           <td className="px-6 py-7 text-center">
                              <div className="flex flex-wrap justify-center gap-1.5 max-w-[150px] mx-auto">
                                 {h.ordenes && h.ordenes.length > 0 ? (
                                    h.ordenes.slice(0, 2).map(ord => (
                                       <span key={ord} className="px-2 py-1 bg-white border border-slate-100 rounded-lg text-emerald-600 text-[10px] font-black shadow-sm">
                                          {ord}
                                       </span>
                                    ))
                                 ) : (
                                    <span className="text-[10px] font-bold text-slate-300 italic">—</span>
                                 )}
                                 {h.ordenes && h.ordenes.length > 2 && (
                                    <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-black rounded-lg">+{h.ordenes.length - 2}</span>
                                 )}
                              </div>
                           </td>
                           <td className="px-6 py-7 text-center">
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">OGL FOOD TRADE</span>
                           </td>
                           <td className="px-6 py-7 text-center">
                              <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-100 bg-white">PALTA</Badge>
                           </td>
                           <td className="px-6 py-7 text-center relative">
                              <Badge className={cn(
                                "text-[10px] font-black uppercase border-none shadow-sm px-4 py-1.5 rounded-full tracking-widest",
                                h.estado === "ACTIVO" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-600 text-white"
                              )}>{h.estado}</Badge>
                           </td>
                           <td className="px-8 py-7 text-center">
                              <div className="flex items-center justify-center gap-2">
                                 {h.archivo_disponible && (
                                    <a 
                                      href={`${API_BASE_URL}/api/v1/packing-list/${h.id}/descargar`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="h-10 w-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-transparent hover:border-emerald-100 transition-all shadow-sm hover:shadow-md"
                                      title="Descargar"
                                    >
                                       <DownloadIcon className="h-5 w-5" />
                                    </a>
                                 )}
                                 {h.estado === "ACTIVO" && (userRole === "SUPERVISOR DOCUMENTARIO" || userRole === "ADMIN") && (
                                    <button 
                                      onClick={() => {
                                        setItemAnular(h);
                                        setMotivoAnulacion(MOTIVOS_OPCIONES[0]);
                                        setOtroMotivo("");
                                        setIsMotivoDropdownOpen(false);
                                      }}
                                      className="h-10 w-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 transition-all shadow-sm hover:shadow-md"
                                      title="Anular"
                                    >
                                       <Trash2 className="h-5 w-5" />
                                    </button>
                                 )}
                              </div>
                           </td>
                        </tr>
                     ))}
                     {filteredHistorial.length === 0 && !isLoadingHistorial && (
                        <tr>
                           <td colSpan={8} className="py-24 text-center">
                              <div className="opacity-10 mb-4">
                                 <History className="h-20 w-20 mx-auto" />
                              </div>
                              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">No hay registros que coincidan con el filtro</p>
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
       )}
       </div>
      
       {/* ── MODAL ANULACIÓN ── */}
       {itemAnular && (
          <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
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
                   <button onClick={() => setItemAnular(null)} className="text-rose-400 hover:text-rose-600">
                      <X className="h-5 w-5" />
                   </button>
                </div>
                <div className="p-6 space-y-6">
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                         Al anular este documento, las <span className="font-black text-slate-800">{itemAnular.bookings.length} órdenes</span> que contiene se liberarán y volverán a estar disponibles.
                      </p>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Motivo de Anulación</label>
                      <div className="relative">
                        <button 
                          onClick={() => setIsMotivoDropdownOpen(!isMotivoDropdownOpen)}
                          className="w-full h-12 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 flex items-center justify-between hover:border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm"
                        >
                           <span>{motivoAnulacion}</span>
                           <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isMotivoDropdownOpen && "rotate-180 text-rose-500")} />
                        </button>
                        {isMotivoDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl z-[9999] py-1 animate-in fade-in slide-in-from-top-2 max-h-56 overflow-y-auto rounded-2xl lc-scroll">
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
                                   motivoAnulacion === opt ? "border-rose-500 bg-rose-50/50 text-rose-700" : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
                   <button onClick={handleAnular} disabled={isAnulando || (motivoAnulacion === "Otro" && !otroMotivo.trim())} className="flex-1 h-12 rounded-xl font-black text-xs uppercase tracking-widest bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {isAnulando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Anulación"}
                   </button>
                </div>
             </div>
          </div>
       )}

       {/* ── MODAL ÉXITO ── */}
       {showSuccessModal && (
          <div className="fixed inset-0 z-[10000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
             <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-10 flex flex-col items-center text-center">
                   <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 relative">
                      <div className="absolute inset-0 bg-emerald-200 rounded-full animate-ping opacity-20" />
                      <CheckCircle2 className="h-10 w-10 text-emerald-500 relative z-10" />
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 font-['Outfit'] mb-2">¡Anulado con Éxito!</h3>
                   <p className="text-sm font-bold text-slate-500 leading-relaxed">El Packing List ha sido invalidado y todas las órdenes asociadas ya están disponibles para un nuevo proceso.</p>
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100">
                   <button onClick={() => setShowSuccessModal(false)} className="w-full h-14 rounded-2xl bg-[#022c22] text-white font-black text-sm uppercase tracking-widest hover:bg-emerald-900 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-emerald-900/20">Entendido</button>
                </div>
             </div>
          </div>
       )}
    </>
  );
}
