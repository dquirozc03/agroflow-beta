"use client";

import React, { useState, useEffect } from "react";
import { 
  History, 
  Search, 
  FileDown, 
  CircleDot, 
  MoreHorizontal, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Filter,
  ArrowUpDown,
  Calendar,
  Truck,
  RefreshCw,
  Edit3,
  Trash2,
  Eye,
  Copy,
  AlertTriangle,
  X,
  Loader2,
  ShieldCheck, ShieldAlert,
  User,
  Layers,
  Zap,
  Thermometer,
  Info,
  Inbox,
  Scale,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { PesosMedidasModal } from "@/components/pesos-medidas-modal";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Calendar as UICalendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/constants";
import { SearchableField } from "@/components/ui/searchable-field";

// --- Formateador de Contenedor Carlos Style 💎 ---
const formatContainerId = (id: string) => {
  if (!id) return "-";
  const clean = id.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length === 11) {
    return `${clean.substring(0, 4)} ${clean.substring(4, 10)}-${clean.substring(10)}`;
  }
  return id;
};

// --- Tooltip Minimalista Carlos Style 💎 ---
function NiceTooltip({ children, text }: { children: React.ReactNode, text: string }) {
  const [show, setShow] = useState(false);
  if (!text) return <>{children}</>;
  return (
    <div className="relative inline-block w-full" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-[110%] left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl z-[1000] whitespace-nowrap animate-in fade-in zoom-in duration-200 border border-white/10">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/90" />
        </div>
      )}
    </div>
  );
}

// --- Componentes UX Premium Carlos Style (Duplicados para Bandeja) ---
function MultiInput({ label, placeholder, values, onChange, icon: Icon, duplicatedValues = [] }: any) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addValue = () => {
    const val = inputValue.trim().toUpperCase();
    if (val && !values.includes(val)) {
      onChange([...values, val]);
      setInputValue("");
    }
  };

  const removeValue = (index: number) => {
    onChange(values.filter((_: any, i: number) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addValue();
    }
  };

  return (
    <div className="space-y-3 group/field">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-100 rounded-2xl min-h-[56px] focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all cursor-text group-hover/field:border-emerald-100" onClick={() => inputRef.current?.focus()}>
        <div className="h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 mt-1 ml-1">
          <Icon className="h-4 w-4" />
        </div>
        {values.map((v: string, i: number) => (
          <div key={i} className={cn(
             "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black animate-in zoom-in-95 duration-200 border",
             duplicatedValues.includes(v) ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"
          )}>
             {v}
             <button onClick={() => removeValue(i)} className="hover:text-emerald-900 transition-colors"><X className="h-3 w-3" /></button>
          </div>
        ))}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addValue}
          placeholder={values.length === 0 ? placeholder : "Añadir..."}
          className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-900 placeholder:text-slate-300 min-w-[80px] px-2"
        />
      </div>
    </div>
  );
}

export default function BandejaLogiCapture() {
  const [registros, setRegistros] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPesosModalOpen, setIsPesosModalOpen] = useState(false);
  const [selectedRegForPesos, setSelectedRegForPesos] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("PENDIENTE");
  const [filterPlanta, setFilterPlanta] = useState("all");
  const [filterCultivo, setFilterCultivo] = useState("all");
  const [filterMotivo, setFilterMotivo] = useState("all");
  const [filterFechaInicio, setFilterFechaInicio] = useState("");
  const [filterFechaFin, setFilterFechaFin] = useState("");
  const [plantasUnicas, setPlantasUnicas] = useState<string[]>([]);
  const [cultivosUnicos, setCultivosUnicos] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReg, setSelectedReg] = useState<any>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorTitle, setErrorTitle] = useState("ERROR DE SISTEMA");
  const [isAnularOpen, setIsAnularOpen] = useState(false);
  const [isAnularSuccessOpen, setIsAnularSuccessOpen] = useState(false);
  const [isEditSuccessOpen, setIsEditSuccessOpen] = useState(false);
  const [anularReason, setAnularReason] = useState("");
  const [otherReason, setOtherReason] = useState("");

  // --- Estados de Sincronización Premium 💎 ---
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnulando, setIsAnulando] = useState(false);
  const [isSyncResultOpen, setIsSyncResultOpen] = useState(false);

  const [syncResult, setSyncResult] = useState({ updated: 0, total: 0 });

  const [editSector, setEditSector] = useState<string>(""); // 'maestros' | 'precintos' | 'fecha'
  const [editData, setEditData] = useState<any>({
     nombre_chofer: "",
     dni_chofer: "",
     licencia_chofer: "",
     placa_tracto: "",
     placa_carreta: "",
     empresa_transporte: "",
     precinto_aduana: [],
     precinto_operador: [],
     precinto_senasa: [],
     precinto_linea: [],
     precintos_beta: [],
     termografos: [],
     booking: "",
     dam: "",
     contenedor: "",
     orden_beta: "",
     planta: "",
     cultivo: "",
     fecha_embarque: new Date(),
     codigoSap: "",
     partidaRegistral: ""
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  // --- Auto-búsqueda de Chofer por DNI Inteligente 💎 ---
  useEffect(() => {
    const dni = editData.dni_chofer;
    if (dni && dni.length >= 8 && dni.length <= 10 && !editData.nombre_chofer) {
       const timer = setTimeout(async () => {
          try {
             const resp = await fetch(`${API_BASE_URL}/api/v1/logicapture/drivers/search?q=${dni}`);
             if (resp.ok) {
                const data = await resp.json();
                const match = data.find((d: any) => d.dni === dni);
                if (match) {
                   setEditData((prev: any) => ({
                      ...prev,
                      nombre_chofer: match.nombre,
                      licencia_chofer: match.licencia
                   }));
                }
             }
          } catch (e) {}
       }, 500);
       return () => clearTimeout(timer);
    }
  }, [editData.dni_chofer, editData.nombre_chofer]);

  const refreshTractoData = async () => {
    if (!editData.placa_tracto) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/logicapture/vehicle/${editData.placa_tracto}`);
      if (resp.ok) {
        const data = await resp.json();
        setEditData((prev: any) => ({
          ...prev,
          empresa_transporte: data.transportista,
          codigoSap: data.codigo_sap,
          partidaRegistral: data.partida_registral
        }));
      }
    } catch (e) {}
  };

  const syncAllMasters = async () => {
    setIsSyncing(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/logicapture/bulk_sync`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error("Fallo en sincronización central");

      const data = await response.json();
      
      setSyncResult({ 
        updated: data.updated, 
        total: data.total_eligible 
      });
      
      setIsSyncResultOpen(true);
      fetchRegistros();
    } catch (e) {
      setErrorTitle("ERROR DE SINCRONIZACIÓN");
      setErrorMessage("No se pudo completar el proceso masivo con los servidores de maestros.");
      setIsErrorOpen(true);
    } finally {
      setIsSyncing(false);
    }
  };

  const [isEditOpen, setIsEditOpen] = useState(false);

  const copyToClipboard = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleStatusChange = async (reg: any, newStatus: string) => {
    if (newStatus === "ANULADO") {
       setSelectedReg(reg);
       setIsAnularOpen(true);
       return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/logicapture/registros/${reg.id}/status?status=${newStatus}`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error();
      
      if (newStatus === "PROCESADO") {
        setIsSuccessOpen(true);
        setTimeout(() => setIsSuccessOpen(false), 2500);
      } else {
        toast.success(`Registro marcado como ${newStatus} correctamente 💎`);
      }
      fetchRegistros();
      setIsPanelOpen(false);
    } catch (error) {
      setErrorMessage("No se pudo actualizar el estado del registro. Verifique su conexión.");
      setIsErrorOpen(true);
    }
  };

  const handleAnularConfirm = async () => {
    if (!selectedReg || !anularReason) return;
    
    const finalReason = anularReason === "Otros" ? otherReason : anularReason;
    if (anularReason === "Otros" && !otherReason) return;

    setIsAnulando(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/logicapture/registros/${selectedReg.id}/status?status=ANULADO&motivo=${encodeURIComponent(finalReason)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Error al anular" }));
        throw new Error(error.detail || "Error al anular");
      }

      setIsAnularOpen(false);
      setIsAnularSuccessOpen(true);
      fetchRegistros();
      
      // Limpieza de estados
      setAnularReason("");
      setOtherReason("");
      setTimeout(() => setIsAnularSuccessOpen(false), 4000);
    } catch (error: any) {
      setErrorTitle("ERROR DE SISTEMA");
      setErrorMessage(error.message);
      setIsErrorOpen(true);
    } finally {
      setIsAnulando(false);
    }
  };

  const handleEditOpen = (reg: any) => {
    setSelectedReg(reg);
    setEditData({
       ...reg,
       fecha_embarque: reg.fecha_embarque || reg.fecha_registro,
       booking: reg.booking,
       orden_beta: reg.orden_beta,
       dam: reg.dam,
       contenedor: reg.contenedor
    });
    setEditSector(""); 
    setIsEditOpen(true);
  };

  const handleEditSave = async () => {
    setIsSaving(true);
    try {
       const response = await fetch(`${API_BASE_URL}/api/v1/logicapture/registros/${selectedReg.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             precintoAduana: editData.precinto_aduana,
             precintoOperador: editData.precinto_operador,
             precintoSenasa: editData.precinto_senasa,
             precintoLinea: editData.precinto_linea,
             precintosBeta: editData.precintos_beta,
             termografos: editData.termografos,
             fecha_embarque: editData.fecha_embarque,
             nombreChofer: editData.nombre_chofer,
             dni: editData.dni_chofer,
             licenciaChofer: editData.licencia_chofer,
             placaTracto: editData.placa_tracto,
             placaCarreta: editData.placa_carreta,
             empresa: editData.empresa_transporte,
             codigoSap: editData.codigoSap,
             partidaRegistral: editData.partidaRegistral,
             booking: editData.booking,
             ordenBeta: editData.orden_beta,
             dam: editData.dam,
             contenedor: editData.contenedor,
             isAudit: true
          })
       });

       if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || "No se pudieron guardar los cambios de auditoría.");
       }
       
        setIsEditOpen(false);
        setIsEditSuccessOpen(true);
        
        // Actualizar el registro seleccionado en memoria para que el Panel SAP refleje los cambios
        setSelectedReg((prev: any) => ({
          ...prev,
          ...editData,
          placa_tracto: editData.placa_tracto,
          placa_carreta: editData.placa_carreta,
          empresa_transporte: editData.empresa_transporte,
          nombre_chofer: editData.nombre_chofer,
          dni_chofer: editData.dni_chofer,
          licencia_chofer: editData.licencia_chofer,
          orden_beta: editData.orden_beta,
          fecha_embarque: editData.fecha_embarque
        }));

        setTimeout(() => setIsEditSuccessOpen(false), 4000);
        fetchRegistros();
    } catch (error: any) {
       setErrorTitle("CONFLICTO DE VALIDACIÓN");
       setErrorMessage(error.message);
       setIsErrorOpen(true);
    } finally {
       setIsSaving(false);
    }
  };

  const fetchRegistros = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("status", activeTab);
      params.append("page", page.toString());
      if (filterPlanta !== "all") params.append("planta", filterPlanta);
      if (filterCultivo !== "all") params.append("cultivo", filterCultivo);
      if (filterMotivo !== "all") params.append("motivo", filterMotivo);
      if (searchTerm) params.append("q", searchTerm);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/logicapture/registros?${params.toString()}`);
      if (!response.ok) throw new Error("Error al obtener registros");
      
      const data = await response.json();
      setRegistros(data.items || []);
      setTotalPages(data.total_pages || 1);
      setTotalRegistros(data.total || 0);
      setPlantasUnicas(data.available_plantas || []);
      setCultivosUnicos(data.available_cultivos || []);
    } catch (error) {
      setErrorMessage("No se pudo sincronizar la bandeja con el sistema central.");
      setIsErrorOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRegistros();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [activeTab, filterPlanta, filterCultivo, filterMotivo, searchTerm]);

  // Las opciones del dropdown ahora provienen del backend (plantasUnicas y cultivosUnicos) para evitar que desaparezcan al filtrar.

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (filterFechaInicio) params.append("start_date", filterFechaInicio);
      if (filterFechaFin) params.append("end_date", filterFechaFin);
      params.append("status", activeTab);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/logicapture/export/excel?${params.toString()}`);
      if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         throw new Error(errorData.detail || "No se pudo generar el reporte premium.");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LogiCapture_Auditoria_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      

    } catch (error) {
      setErrorTitle("ERROR DE EXPORTACIÓN");
      setErrorMessage("No se pudo generar el reporte premium. Verifique que existan datos en el periodo seleccionado o contacte a soporte TI.");
      setIsErrorOpen(true);
    } finally {
      setTimeout(() => setIsExporting(false), 2500);
    }
  };

  // Antigüedad calculada inline en cada fila del map
  const getStatusBadge = (_status: string) => null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f6f8fa]">
      <AppSidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader />

        <main className="flex-1 overflow-y-auto p-10 lc-scroll pt-2">
          <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Header Bandeja */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
               <div className="space-y-1">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-emerald-950 rounded-2xl flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950/20">
                       <History className="h-5 w-5" />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tighter text-emerald-950 font-['Outfit']">
                       Bandeja de <span className="text-emerald-500">Datos</span>
                    </h1>
                 </div>
                 <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-13">
                   Auditoría y Gestión Operativa LogiCapture
                 </p>
               </div>

               <div className="flex items-center gap-4">
                  <Button onClick={handleExportExcel} className="rounded-2xl bg-emerald-950 text-white h-12 px-6 font-black uppercase tracking-[0.2em] shadow-xl text-[10px] hover:bg-emerald-800 transition-all border-none">
                     <FileDown className="h-4 w-4 mr-2" />
                     {isExporting ? "Generando..." : "Exportar Excel"}
                  </Button>
                  <Button 
                    variant="default" 
                    className="rounded-2xl bg-emerald-950 hover:bg-emerald-900 shadow-xl shadow-emerald-950/20 font-bold uppercase tracking-widest text-xs h-12 px-6"
                  >
                     Sincronizar SAP
                  </Button>
               </div>
            </div>

            {/* Filtros Inteligentes */}
            <div className={cn(
               "grid grid-cols-1 gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm items-end justify-items-center transition-all duration-500",
               activeTab === "ANULADO" ? "md:grid-cols-7" : "md:grid-cols-6"
            )}>
               <div className="space-y-2 w-full">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Búsqueda Rápida</label>
                  <div className="relative group">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                     <Input 
                        placeholder="Booking, Contenedor, Orden Beta..." 
                        className="pl-10 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all h-11"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                     />
                  </div>
               </div>

               <div className="space-y-2 w-full">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Planta Llenado</label>
                  <Select value={filterPlanta} onValueChange={setFilterPlanta}>
                     <SelectTrigger className="rounded-2xl border-slate-100 bg-white h-11 transition-all shadow-sm hover:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-700">
                        <SelectValue placeholder="Todas las Plantas" />
                     </SelectTrigger>
                     <SelectContent className="rounded-3xl border-0 shadow-[0_20px_60px_rgba(0,0,0,0.15)] bg-[#022c22]/95 backdrop-blur-xl p-2 overflow-hidden">
                        <div className="px-3 py-2 mb-1">
                          <p className="text-[9px] font-black text-emerald-400/70 uppercase tracking-[0.3em]">Planta Llenado</p>
                        </div>
                        <SelectItem value="all" className="rounded-xl cursor-pointer font-black text-[11px] text-white/70 focus:bg-white/10 focus:text-white tracking-widest uppercase py-3 pl-4 pr-4 transition-all [&>span:first-child]:hidden data-[state=checked]:text-emerald-300 data-[state=checked]:bg-emerald-500/20 data-[state=checked]:border-l-2 data-[state=checked]:border-emerald-400">Todas las Plantas</SelectItem>
                        <div className="h-px bg-white/10 my-1 mx-2" />
                        {plantasUnicas.map(p => (
                           <SelectItem key={p} value={p} className="rounded-xl cursor-pointer font-black text-[11px] text-white focus:bg-emerald-500/30 focus:text-emerald-300 tracking-widest uppercase py-3 pl-4 pr-4 transition-all [&>span:first-child]:hidden data-[state=checked]:text-emerald-300 data-[state=checked]:bg-emerald-500/20 data-[state=checked]:border-l-2 data-[state=checked]:border-emerald-400">
                             {p}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               <div className="space-y-2 w-full">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cultivo</label>
                  <Select value={filterCultivo} onValueChange={setFilterCultivo}>
                     <SelectTrigger className="rounded-2xl border-slate-100 bg-white h-11 transition-all shadow-sm hover:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-700">
                        <SelectValue placeholder="Todos los Cultivos" />
                     </SelectTrigger>
                     <SelectContent className="rounded-3xl border-0 shadow-[0_20px_60px_rgba(0,0,0,0.15)] bg-[#022c22]/95 backdrop-blur-xl p-2 overflow-hidden">
                        <div className="px-3 py-2 mb-1">
                          <p className="text-[9px] font-black text-emerald-400/70 uppercase tracking-[0.3em]">Cultivo</p>
                        </div>
                        <SelectItem value="all" className="rounded-xl cursor-pointer font-black text-[11px] text-white/70 focus:bg-white/10 focus:text-white tracking-widest uppercase py-3 pl-4 pr-4 transition-all [&>span:first-child]:hidden data-[state=checked]:text-emerald-300 data-[state=checked]:bg-emerald-500/20 data-[state=checked]:border-l-2 data-[state=checked]:border-emerald-400">Todos los Cultivos</SelectItem>
                        <div className="h-px bg-white/10 my-1 mx-2" />
                        {cultivosUnicos.map(c => (
                           <SelectItem key={c} value={c} className="rounded-xl cursor-pointer font-black text-[11px] text-white focus:bg-emerald-500/30 focus:text-emerald-300 tracking-widest uppercase py-3 pl-4 pr-4 transition-all [&>span:first-child]:hidden data-[state=checked]:text-emerald-300 data-[state=checked]:bg-emerald-500/20 data-[state=checked]:border-l-2 data-[state=checked]:border-emerald-400">
                             {c}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               {activeTab === "ANULADO" && (
                  <div className="space-y-2 w-full animate-in slide-in-from-top-2 duration-500">
                     <label className="text-[10px] font-black uppercase tracking-widest text-rose-500/60 ml-1">Motivo Incidente</label>
                     <Select value={filterMotivo} onValueChange={setFilterMotivo}>
                        <SelectTrigger className="rounded-2xl border-rose-100 bg-white h-11 transition-all shadow-sm hover:border-rose-300 focus:ring-2 focus:ring-rose-500/20 font-bold text-slate-700">
                           <SelectValue placeholder="Todos los Motivos" />
                        </SelectTrigger>
                        <SelectContent className="rounded-3xl border-0 shadow-[0_20px_60px_rgba(244,63,94,0.15)] bg-slate-900/95 backdrop-blur-xl p-2 overflow-hidden border border-white/10">
                           <div className="px-3 py-2 mb-1">
                             <p className="text-[9px] font-black text-rose-400/70 uppercase tracking-[0.3em]">Filtrar por Causa</p>
                           </div>
                           <SelectItem value="all" className="rounded-xl cursor-pointer font-black text-[11px] text-white/70 focus:bg-rose-500/20 focus:text-white tracking-widest uppercase py-3 pl-4 pr-4 transition-all [&>span:first-child]:hidden data-[state=checked]:text-rose-300 data-[state=checked]:bg-rose-500/20 data-[state=checked]:border-l-2 data-[state=checked]:border-rose-400">Todos los Motivos</SelectItem>
                           <div className="h-px bg-white/10 my-1 mx-2" />
                           {[
                             "Error de precinto",
                             "Error de precintado",
                             "Error de guia",
                             "Error de booking",
                             "Otros"
                           ].map(m => (
                              <SelectItem key={m} value={m} className="rounded-xl cursor-pointer font-black text-[11px] text-white focus:bg-rose-500/30 focus:text-rose-300 tracking-widest uppercase py-3 pl-4 pr-4 transition-all [&>span:first-child]:hidden data-[state=checked]:text-rose-300 data-[state=checked]:bg-rose-500/20 data-[state=checked]:border-l-2 data-[state=checked]:border-rose-400">
                                {m}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
               )}
               <div className="space-y-2 w-full">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Desde</label>
                  <Input 
                     type="date" 
                     value={filterFechaInicio}
                     onChange={(e) => setFilterFechaInicio(e.target.value)}
                     className="rounded-2xl border-slate-100 bg-white h-11 transition-all shadow-sm focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-700"
                  />
               </div>
               <div className="space-y-2 w-full">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Hasta</label>
                  <Input 
                     type="date" 
                     value={filterFechaFin}
                     onChange={(e) => setFilterFechaFin(e.target.value)}
                     className="rounded-2xl border-slate-100 bg-white h-11 transition-all shadow-sm focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-700"
                  />
               </div>

               <div className="flex items-end pb-0.5 w-full">
                  <button 
                    onClick={() => { setFilterPlanta("all"); setFilterCultivo("all"); setFilterMotivo("all");
    setFilterFechaInicio("");
    setFilterFechaFin(""); setSearchTerm(""); }}
                    className="h-11 w-full flex items-center justify-center gap-2 px-6 bg-white border border-slate-200 hover:border-emerald-400 text-slate-500 hover:text-emerald-700 rounded-2xl shadow-sm text-[11px] font-black uppercase tracking-widest transition-all duration-500 active:scale-95 group overflow-hidden relative"
                  >
                     <RefreshCw className="h-4 w-4 transition-transform group-hover:rotate-180 duration-700 relative z-10" />
                     <span className="relative z-10">Limpiar Filtros</span>
                  </button>
               </div>
            </div>

            {/* Tabla de Registros */}
            <Tabs defaultValue="PENDIENTE" className="w-full space-y-6" onValueChange={setActiveTab}>
              <div className="flex items-center justify-between">
                 <TabsList className="bg-slate-100/50 p-1.5 rounded-[1.5rem] h-auto border border-slate-100">
                   <TabsTrigger value="PENDIENTE" className="rounded-2xl px-8 py-2.5 font-bold uppercase tracking-widest text-[11px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-950 transition-all">
                      Pendientes
                   </TabsTrigger>
                   <TabsTrigger value="PROCESADO" className="rounded-2xl px-8 py-2.5 font-bold uppercase tracking-widest text-[11px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-950 transition-all">
                      Procesados
                   </TabsTrigger>
                   <TabsTrigger value="ANULADO" className="rounded-2xl px-8 py-2.5 font-bold uppercase tracking-widest text-[11px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-rose-600 transition-all">
                      Anulados
                   </TabsTrigger>
                 </TabsList>
                 
                 <div className="flex items-center gap-3">
                     {activeTab === "PROCESADO" && (
                        <Button
                           onClick={syncAllMasters}
                           disabled={isLoading}
                           className="rounded-2xl px-6 py-2.5 font-black uppercase tracking-widest text-[10px] bg-emerald-600 text-white hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95 shadow-md h-auto flex items-center gap-2 border-none"
                        >
                           <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
                           Sincronizar Maestros
                        </Button>
                     )}
                     <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-6 py-2.5 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <CircleDot className="h-3 w-3 text-emerald-500 animate-pulse" />
                        {totalRegistros} total de registros
                     </div>
                 </div>
              </div>
              
              <TabsContent value={activeTab} className="p-0 border-none outline-none">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden lc-table-clean">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="hover:bg-transparent border-none px-6 [&_th]:border-none">
                        <TableHead className="w-[120px] font-black text-[10px] uppercase tracking-widest p-6 border-none text-center">Fecha/Hora</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest border-none">Embarque (BK / Orden / Cont.)</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest border-none text-center">Planta / Cultivo</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest border-none text-center">Transporte (T / C)</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest w-[160px] border-none text-center">
                           {activeTab === "PENDIENTE" ? "Antigüedad" : activeTab === "ANULADO" ? "Motivo Incidente" : "T. Atención"}
                        </TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest border-none text-center">Usuario</TableHead>
                        {activeTab !== "ANULADO" && <TableHead className="text-center p-6 font-black text-[10px] uppercase tracking-widest w-[100px] border-none">Acciones</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                         Array.from({length: 5}).map((_, i) => (
                           <TableRow key={i} className="animate-pulse">
                              <TableCell colSpan={7} className="p-10 text-center text-slate-300">Cargando datos del sistema...</TableCell>
                           </TableRow>
                         ))
                      ) : registros.length === 0 ? (
                        <TableRow>
                           <TableCell colSpan={7} className="p-20 text-center">
                              <div className="flex flex-col items-center gap-4 text-slate-300">
                                 <AlertCircle className="h-12 w-12 opacity-20" />
                                 <p className="font-black uppercase tracking-widest text-xs">No hay registros para este estatus</p>
                              </div>
                           </TableCell>
                        </TableRow>
                      ) : registros.map((reg) => (
                        <TableRow 
                          key={reg.id} 
                          className="group hover:bg-emerald-50/10 transition-colors border-none px-6 cursor-pointer [&_td]:border-none"
                          onClick={() => { setSelectedReg(reg); setIsPanelOpen(true); }}
                        >
                          <TableCell className="p-6 font-medium text-slate-600 text-center">
                             <div className="flex flex-col items-center">
                                <span className="text-sm font-bold text-slate-900 leading-none mb-1">
                                   {(reg.fecha_embarque ? new Date(reg.fecha_embarque) : new Date(reg.fecha_registro)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                   {(reg.fecha_embarque ? new Date(reg.fecha_embarque) : new Date(reg.fecha_registro)).toLocaleDateString()}
                                </span>
                             </div>
                          </TableCell>
                          <TableCell>
                              <div className="flex flex-col gap-1.5 py-4">
                                 <div className="flex items-center gap-3">
                                    <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase border border-emerald-100/50 shadow-sm">{reg.booking}</span>
                                 </div>
                                 <div className="flex items-center gap-2 text-[11px] font-bold ml-1">
                                    {reg.orden_beta && <span className="text-slate-600 font-black">{reg.orden_beta}</span>}
                                    {reg.orden_beta && reg.contenedor && <span className="text-slate-300 mx-0.5">·</span>}
                                    <span className="italic text-slate-400">{formatContainerId(reg.contenedor)}</span>
                                 </div>
                              </div>
                           </TableCell>
                          <TableCell className="text-center">
                             <div className="flex flex-col gap-1 items-center">
                                <span className="text-xs font-black text-slate-900 tracking-tight">{reg.planta || "SIN PLANTA"}</span>
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{reg.cultivo || "SIN CULTIVO"}</span>
                             </div>
                          </TableCell>
                          <TableCell className="text-center">
                             <div className="flex flex-col gap-1.5 items-center">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                   <Truck className="h-3 w-3 text-emerald-500" />
                                   {reg.placa_tracto}
                                   <span className="text-slate-300 mx-1">/</span>
                                   {reg.placa_carreta}
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{reg.empresa_transporte}</span>
                             </div>
                          </TableCell>
                          <TableCell className="text-center">
                              {activeTab === "ANULADO" ? (
                                 <NiceTooltip text={reg.motivo_anulacion || "Sin Detalle Técnico Registrado"}>
                                    <div className="inline-flex items-center gap-2 px-3 py-2 bg-rose-50/50 border border-rose-100/50 rounded-xl animate-in fade-in zoom-in duration-500 shadow-sm group/motivo relative overflow-hidden max-w-[140px] cursor-help">
                                       <ShieldAlert className="h-3.5 w-3.5 text-rose-600 shrink-0 relative z-10" />
                                       <span className="text-[9px] font-black text-rose-700 uppercase tracking-widest truncate relative z-10">
                                          {reg.motivo_anulacion || "Sin Detalle"}
                                       </span>
                                       <div className="absolute inset-0 bg-gradient-to-r from-rose-100/0 via-rose-100/20 to-rose-100/0 translate-x-[-100%] group-hover/motivo:translate-x-[100%] transition-transform duration-1000" />
                                    </div>
                                 </NiceTooltip>
                              ) : (
                                 <div className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-500",
                                    reg.antiguedad_color === "danger" 
                                      ? "bg-rose-50 border-rose-100 text-rose-600 shadow-sm shadow-rose-100 animate-pulse" 
                                      : reg.antiguedad_color === "warning"
                                        ? "bg-amber-50 border-amber-100 text-amber-600 shadow-sm shadow-amber-100"
                                        : reg.antiguedad_color === "success"
                                          ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm shadow-emerald-100"
                                          : "bg-slate-50 border-slate-100 text-slate-500"
                                  )}>
                                     <Clock className={cn("h-3 w-3", reg.antiguedad_color === "danger" && "animate-spin-slow")} />
                                     {reg.antiguedad_humanizada || "---"}
                                  </div>
                              )}
                          </TableCell>
                          <TableCell className="p-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                               <div className="h-6 w-6 bg-emerald-50 rounded-lg flex items-center justify-center">
                                  <User className="h-3.5 w-3.5 text-emerald-600" />
                               </div>
                               <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                                  {reg.usuario_registro ? `@${reg.usuario_registro.replace('@', '')}` : '---'}
                                </span>
                            </div>
                          </TableCell>
                          {activeTab !== "ANULADO" && <TableCell className="text-center p-6" onClick={(e) => e.stopPropagation()}>
                            {activeTab === "PENDIENTE" ? (
                              <Button
                                onClick={() => handleStatusChange(reg, 'PROCESADO')}
                                className="h-10 px-5 bg-emerald-950 hover:bg-emerald-800 text-white rounded-2xl flex items-center gap-2.5 transition-all duration-300 shadow-lg shadow-emerald-950/10 active:scale-95 group/btn border-none"
                              >
                                <div className="h-5 w-5 bg-emerald-500/10 rounded-lg flex items-center justify-center group-hover/btn:bg-emerald-500/20 transition-colors">
                                  <Zap className="h-3.5 w-3.5 text-emerald-400 group-hover/btn:scale-110 transition-transform" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.15em]">Procesar</span>
                              </Button>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-10 w-10 p-0 rounded-2xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                                    <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 shadow-2xl p-2 min-w-[160px]">
                                  <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-3">Gestión</DropdownMenuLabel>
                                  
                                  {activeTab === "PROCESADO" && (
                                     <>
                                        <DropdownMenuItem 
                                          className="rounded-xl p-3 text-sm font-bold gap-3 focus:bg-emerald-50 focus:text-emerald-700 cursor-pointer"
                                          onClick={() => { setSelectedRegForPesos(reg.id); setIsPesosModalOpen(true); }}
                                        >
                                          <Scale className="h-4 w-4 text-emerald-600" />
                                          <div className="flex flex-col">
                                             <span className="text-[11px] uppercase tracking-tighter">Pesos y Medidas</span>
                                             <span className="text-[9px] text-emerald-500/70 font-black uppercase tracking-widest">DOCUMENTO OFICIAL</span>
                                          </div>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem className="rounded-xl p-3 text-sm font-bold gap-3 focus:bg-emerald-50 focus:text-emerald-700 cursor-pointer" onClick={() => handleEditOpen(reg)}>
                                          <Edit3 className="h-4 w-4" /> Editar
                                        </DropdownMenuItem>
                                        
                                        <DropdownMenuSeparator className="bg-slate-50 mx-1 my-2" />
                                        
                                        <DropdownMenuItem className="rounded-xl p-3 text-sm font-bold gap-3 focus:bg-rose-50 focus:text-rose-700 cursor-pointer" onClick={() => handleStatusChange(reg, 'ANULADO')}>
                                          <Trash2 className="h-4 w-4" /> Anular Registro
                                        </DropdownMenuItem>
                                     </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginación AgroFlow Premium 💎 */}
                {!isLoading && totalPages > 1 && (
                  <div className="flex items-center justify-between mt-8 font-['Outfit'] shadow-sm bg-white/50 p-6 rounded-[2rem] border border-slate-50">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Página</span>
                       <div className="h-10 px-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm">
                          <span className="text-sm font-bold text-emerald-700">{page} <span className="text-slate-300 mx-1">/</span> {totalPages}</span>
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">
                          Mostrando {registros.length} de {totalRegistros} registros operativos
                       </span>
                    </div>

                    <div className="flex items-center gap-3">
                       <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="h-12 px-6 bg-white border border-slate-100 rounded-2xl flex items-center gap-2 text-slate-600 font-bold text-xs hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed group"
                       >
                          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                          Anterior
                       </button>
                       <button
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="h-12 px-8 bg-emerald-950 text-white rounded-2xl flex items-center gap-2 font-bold text-xs hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-950/10 disabled:opacity-30 disabled:cursor-not-allowed group"
                       >
                          Siguiente
                          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                       </button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

          </div>
        </main>
      </div>

      {/* Panel SAP Lateral Carlos Style */}
      <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
        <SheetContent className="w-[450px] sm:w-[550px] bg-slate-50 p-0 border-l border-white shadow-2xl rounded-l-[3rem]">
           {selectedReg && (
              <div className="flex flex-col h-full overflow-hidden">
                 <div className="p-8 bg-white border-b border-slate-100 sticky top-0 z-10 rounded-tl-[3rem]">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
                          <CircleDot className="h-3 w-3 animate-pulse" />
                          PANEL SAP • {selectedReg.status}
                       </span>
                       <Button variant="ghost" size="icon" onClick={() => setIsPanelOpen(false)} className="rounded-full hover:bg-rose-50 hover:text-rose-600 transition-all">
                          <X className="h-5 w-5" />
                       </Button>
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tighter text-emerald-950 font-['Outfit']">
                       REGISTRO <span className="text-emerald-500">#{selectedReg.id}</span>
                    </h2>
                 </div>

                 <div className="flex-1 overflow-y-auto p-8 space-y-6 lc-scroll pb-20">
                    <div className="space-y-4">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3" /> DATOS PARA COPIADO SAP
                       </p>
                       
                       {[
                         { label: "FECHA DE EMBARQUE", value: new Date(selectedReg.fecha_registro).toLocaleDateString(), key: "fecha" },
                         { label: "ORDEN BETA", value: selectedReg.orden_beta, key: "orden" },
                         { label: "BOOKING", value: selectedReg.booking, key: "booking" },
                         { label: "CONTENEDOR", value: formatContainerId(selectedReg.contenedor), key: "cnt" },
                         { label: "MARCA", value: selectedReg.marca_tracto, key: "marca" },
                         { label: "PLACAS", value: `${selectedReg.placa_tracto}/${selectedReg.placa_carreta}`, key: "placas" },
                         { label: "CHOFER", value: selectedReg.nombre_chofer, key: "chofer_n" },
                         { label: "DNI", value: selectedReg.dni_chofer, key: "dni" },
                         { label: "LICENCIA", value: selectedReg.licencia_chofer, key: "lic" },
                         { label: "TERMOGRAFOS", value: selectedReg.termografos?.join("/"), key: "term" },
                         { label: "CODIGO SAP", value: selectedReg.codigo_sap, key: "sap" },
                         { label: "TRANSPORTISTA", value: selectedReg.empresa_transporte, key: "trans" },
                         { label: "NUMERO DE DAM", value: selectedReg.dam, key: "dam" },
                         { label: "PRECINTOS BETA", value: selectedReg.precintos_beta?.join("/"), key: "beta" },
                         { label: "PRECINTO ADUANA", value: selectedReg.precinto_aduana?.join("/"), key: "aduana" },
                         { label: "PRECINTO OPERADOR", value: selectedReg.precinto_operador?.join("/"), key: "ope" },
                         { 
                            label: "SENASA/PS LÍNEA", 
                            value: `${selectedReg.precinto_senasa?.join("/") || "**"}/PS.LIN:${selectedReg.precinto_linea?.join("/") || "**"}`, 
                            key: "senasa_linea" 
                         },
                         { label: "PARTIDA REGISTRAL", value: selectedReg.partida_registral, key: "partida" },
                         { 
                            label: "TARJETA UNICA DE CIRCULACION", 
                            value: `${selectedReg.cert_tracto || "**"}/${selectedReg.cert_carreta || "**"}`, 
                            key: "tuc" 
                         },
                       ].map((item) => (
                          <div key={item.key} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group hover:border-emerald-200 transition-all">
                             <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                   <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.label}</label>
                                   <p className="text-sm font-bold text-slate-600 tracking-tight">{item.value || "-"}</p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="rounded-xl opacity-0 group-hover:opacity-100 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
                                  onClick={() => copyToClipboard(String(item.value), item.label, item.key)}
                                >
                                   {copiedField === item.key ? (
                                      <CheckCircle2 className="h-4 w-4 text-emerald-500 animate-in zoom-in" />
                                   ) : (
                                      <Copy className="h-4 w-4" />
                                   )}
                                </Button>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 <div className="p-8 bg-white border-t border-slate-100 sticky bottom-0 z-10 flex gap-4">
                    {selectedReg.status === "PENDIENTE" ? (
                       <Button 
                         className="flex-1 rounded-2xl bg-emerald-950 hover:bg-emerald-900 font-bold uppercase tracking-[0.2em] text-[10px] h-14 shadow-xl shadow-emerald-950/40"
                         onClick={() => handleStatusChange(selectedReg, 'PROCESADO')}
                       >
                          <Zap className="h-5 w-5 mr-3 animate-pulse text-emerald-400" /> Procesar Registro
                       </Button>
                    ) : (
                       <Button className="flex-1 rounded-2xl bg-emerald-950 text-white h-14 font-black uppercase tracking-[0.2em] shadow-xl text-[10px] hover:bg-emerald-800 transition-all border-none" onClick={() => handleEditOpen(selectedReg)}
                       >
                          <Edit3 className="h-4 w-4 mr-2" /> Editar Registro
                       </Button>
                    )}
                 </div>
              </div>
           )}
        </SheetContent>
      </Sheet>

      {/* Modal de Éxito Premium - ELIMINACIÃ“N DE TOAST FEO */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
         <DialogContent className="sm:max-w-md bg-emerald-950 border-none p-0 overflow-hidden rounded-[3rem] shadow-2xl shadow-emerald-500/20 pointer-events-auto">
            <DialogHeader className="sr-only">
               <DialogTitle>Registro Procesado</DialogTitle>
               <DialogDescription>Confirmación de operación exitosa</DialogDescription>
            </DialogHeader>
            <div className="relative p-12 flex flex-col items-center text-center gap-6">
               <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-emerald-950 opacity-50 pointer-events-none" />
               
               <div className="h-24 w-24 bg-emerald-500/20 rounded-full flex items-center justify-center animate-in zoom-in spin-in duration-700">
                  <div className="h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                     <CheckCircle2 className="h-8 w-8 text-white font-black" />
                  </div>
               </div>

               <div className="space-y-2 relative z-10">
                  <h2 className="text-4xl font-black tracking-tighter text-white font-['Outfit'] animate-in slide-in-from-bottom-4 duration-500">
                     PROCESADO
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
                     Operación cerrada con éxito en el sistema
                  </p>
               </div>

               <Button 
                  onClick={() => setIsSuccessOpen(false)}
                  className="mt-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest text-[10px] h-10 px-8 border border-white/10 transition-all z-10"
               >
                  Entendido
               </Button>
            </div>
         </DialogContent>
      </Dialog>

      {/* Modal de Generación Excel Premium */}
      <Dialog open={isExporting} onOpenChange={setIsExporting}>
         <DialogContent className="sm:max-w-md bg-white border-none p-0 overflow-hidden rounded-[3rem] shadow-2xl">
            <DialogHeader className="sr-only">
               <DialogTitle>Exportando Excel</DialogTitle>
               <DialogDescription>Procesando descarga de reporte</DialogDescription>
            </DialogHeader>
            <div className="relative p-12 flex flex-col items-center text-center gap-6">
               <div className="h-24 w-24 bg-emerald-50 rounded-full flex items-center justify-center">
                  <FileDown className="h-10 w-10 text-emerald-600 animate-bounce" />
               </div>

               <div className="space-y-2">
                  <h2 className="text-3xl font-black tracking-tighter text-emerald-950 font-['Outfit'] animate-pulse">
                     GENERANDO EXCEL
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                     Procesando datos maestros y auditoría
                  </p>
               </div>

               <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden relative">
                  <div className="absolute inset-x-0 h-full bg-emerald-500 animate-pulse bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500" />
               </div>
               
               <p className="text-[9px] font-bold text-emerald-600/60 uppercase tracking-widest">
                  Generando Reporte de Auditoría
               </p>
            </div>
         </DialogContent>
      </Dialog>

      {/* Modal de Anulación Premium 💎 */}
      <Dialog open={isAnularOpen} onOpenChange={setIsAnularOpen}>
         <DialogContent className="sm:max-w-md bg-white border-none p-0 overflow-hidden rounded-[3.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.15)] animate-in zoom-in-95 duration-500">
            <div className="relative p-10 flex flex-col gap-8">
               <div className="flex flex-col items-center text-center gap-4">
                  <div className="h-20 w-20 bg-rose-50 rounded-[2rem] flex items-center justify-center animate-pulse">
                     <AlertCircle className="h-10 w-10 text-rose-600" />
                  </div>
                  <div className="space-y-1">
                     <h2 className="text-3xl font-black text-rose-600 tracking-tighter uppercase font-['Outfit']">
                        Anular <span className="text-slate-900">Operación</span>
                     </h2>
                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-tight px-4">
                        Esta acción es irreversible y quedará registrada en su historial de auditoría.
                     </p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="space-y-3">
                     <div className="flex items-center justify-between px-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Motivo del Incidente</label>
                        <ShieldAlert className="h-4 w-4 text-rose-200" />
                     </div>
                     <Select value={anularReason} onValueChange={setAnularReason}>
                        <SelectTrigger className="rounded-[1.5rem] border-slate-100 bg-slate-50/80 h-16 px-6 font-black text-[12px] text-slate-700 hover:border-rose-200 transition-all focus:ring-rose-500/20">
                           <SelectValue placeholder="Seleccione el motivo técnico..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-[2.5rem] border-slate-100 shadow-2xl bg-white/95 backdrop-blur-xl p-3">
                           {[
                             { v: "Error de precinto", l: "Error en código de precinto" },
                             { v: "Error de precintado", l: "Error físico de precintado" },
                             { v: "Error de guia", l: "Error en guía de remisión" },
                             { v: "Error de booking", l: "Cancelación de Booking" },
                             { v: "Otros", l: "Otros motivos (Especificar)" }
                           ].map((opt) => (
                             <SelectItem 
                               key={opt.v} 
                               value={opt.v} 
                               className="py-4 px-10 rounded-2xl font-black text-[11px] uppercase tracking-wider text-slate-600 focus:bg-rose-50 focus:text-rose-600 cursor-pointer mb-1 last:mb-0 transition-all"
                             >
                                {opt.l}
                             </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>

                  {anularReason === "Otros" && (
                     <div className="space-y-3 animate-in slide-in-from-top-4 duration-500">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 ml-2">Especificación Técnica</label>
                        <Input 
                           value={otherReason}
                           onChange={(e) => setOtherReason(e.target.value)}
                           placeholder="Escriba el detalle de la anulación..."
                           className="rounded-[1.5rem] border-rose-100 bg-rose-50/30 h-16 px-6 font-bold text-slate-800 placeholder:text-rose-200 focus:border-rose-500 focus:ring-rose-500/10"
                        />
                     </div>
                  )}
               </div>

               <div className="flex flex-col gap-3 mt-4">
                  <Button 
                    onClick={handleAnularConfirm}
                    disabled={isAnulando || !anularReason || (anularReason === "Otros" && !otherReason)}
                    className="w-full h-16 bg-rose-600 hover:bg-rose-700 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                     {isAnulando ? <><Loader2 className="h-5 w-5 animate-spin" /> Anulando...</> : "Confirmar Anulación"}
                  </Button>
                  <button 
                    onClick={() => setIsAnularOpen(false)}
                    className="w-full py-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-[1.5rem] transition-all"
                  >
                     CANCELAR OPERACIÓN
                  </button>
               </div>
            </div>
         </DialogContent>
      </Dialog>

       {/* Modal de Error Premium Carlos Style 💎 */}
       <Dialog open={isErrorOpen} onOpenChange={setIsErrorOpen}>
          <DialogContent className="sm:max-w-md bg-white border-none p-0 overflow-hidden rounded-[3.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.15)] animate-in zoom-in-95 duration-300">
             <DialogHeader className="sr-only">
                <DialogTitle>Error del Sistema</DialogTitle>
                <DialogDescription>{errorMessage}</DialogDescription>
             </DialogHeader>
             <div className="relative p-12 flex flex-col items-center text-center gap-6">
                <div className="h-24 w-24 bg-rose-50 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                   <div className="h-16 w-16 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.4)]">
                      <AlertTriangle className="h-8 w-8 text-white" />
                   </div>
                </div>

                <div className="space-y-2">
                   <h2 className="text-3xl font-black tracking-tighter text-slate-900 font-['Outfit'] uppercase">
                      {errorTitle}
                   </h2>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 leading-relaxed px-4">
                      {errorMessage}
                   </p>
                </div>

                <Button 
                  onClick={() => setIsErrorOpen(false)}
                  className="w-full py-7 bg-slate-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 mt-4"
                >
                   Entendido
                </Button>
             </div>
          </DialogContent>
       </Dialog>

       <Dialog open={isAnularSuccessOpen} onOpenChange={setIsAnularSuccessOpen}>
          <DialogContent className="sm:max-w-md bg-white border-none p-0 overflow-hidden rounded-[3.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.15)] animate-in zoom-in-95 duration-500">
             <div className="relative p-12 flex flex-col items-center text-center gap-8">
                <div className="h-24 w-24 bg-emerald-50 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                   <div className="h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                      <CheckCircle2 className="h-8 w-8 text-white" />
                   </div>
                </div>
                <div className="space-y-3">
                   <h2 className="text-3xl font-black tracking-tighter text-slate-900 font-['Outfit'] uppercase">Operación <span className="text-emerald-600">Anulada</span></h2>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-relaxed px-4">El registro ha sido invalidado correctamente y se ha notificado al sistema central.</p>
                </div>
                <Button 
                  onClick={() => setIsAnularSuccessOpen(false)}
                  className="w-full py-8 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 mt-4"
                >
                   Cerrar y Volver
                </Button>
             </div>
          </DialogContent>
       </Dialog>

        {/* MODAL DE RESULTADO DE SINCRONIZACIÓN PREMIUM 💎 */}
        <Dialog open={isSyncResultOpen} onOpenChange={setIsSyncResultOpen}>
           <DialogContent className="sm:max-w-lg bg-white border-none p-0 overflow-hidden rounded-[4rem] shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="relative p-12 flex flex-col items-center text-center gap-8">
                 <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-emerald-50 to-transparent pointer-events-none" />
                 
                 <div className="relative h-28 w-28 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center animate-in slide-in-from-top-8 duration-700">
                    <div className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                       <RefreshCw className={cn("h-10 w-10 text-white", syncResult.updated > 0 && "animate-spin-slow")} />
                    </div>
                    {syncResult.updated > 0 && (
                       <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg border-4 border-white animate-bounce">
                          <Zap className="h-5 w-5 text-amber-900" />
                       </div>
                    )}
                 </div>

                 <div className="space-y-3 relative z-10">
                    <h2 className="text-4xl font-black tracking-tighter text-slate-900 font-['Outfit'] uppercase">
                       {syncResult.updated > 0 ? "Sincronización" : "Sin Cambios"} <br/>
                       <span className="text-emerald-600">{syncResult.updated > 0 ? "Completada" : "Detectados"}</span>
                    </h2>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 leading-relaxed px-8">
                       {syncResult.updated > 0 
                         ? `Se han actualizado ${syncResult.updated} registros con información oficial de datos maestros.` 
                         : "Todos los registros analizados ya se encuentran alineados con los datos maestros oficiales."}
                    </p>
                 </div>

                 {syncResult.updated > 0 && (
                    <div className="w-full grid grid-cols-2 gap-4 mt-2">
                       <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Registros</p>
                          <p className="text-2xl font-black text-emerald-950">{syncResult.total}</p>
                       </div>
                       <div className="p-6 bg-emerald-950 rounded-[2rem] border border-emerald-900">
                          <p className="text-[9px] font-black text-emerald-400/60 uppercase tracking-widest mb-1">Actualizados</p>
                          <p className="text-2xl font-black text-white">{syncResult.updated}</p>
                       </div>
                    </div>
                 )}

                 <Button 
                   onClick={() => setIsSyncResultOpen(false)}
                   className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.3em] hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/20 active:scale-95"
                 >
                    Entendido
                 </Button>
              </div>
           </DialogContent>
        </Dialog>

        {/* OVERLAY DE CARGA DE SINCRONIZACIÓN (BLOCKER) 💎 */}
        <Dialog open={isSyncing} onOpenChange={() => {}}>
           <DialogContent className="sm:max-w-[280px] bg-emerald-950/90 backdrop-blur-xl border-none p-10 overflow-hidden rounded-[3rem] shadow-2xl pointer-events-auto flex flex-col items-center gap-6 [&>button]:hidden">
              <div className="h-20 w-20 relative">
                 <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full" />
                 <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <RefreshCw className="h-8 w-8 text-emerald-400 animate-pulse" />
                 </div>
              </div>
              <div className="space-y-1 text-center">
                 <p className="text-white font-black text-sm tracking-tighter uppercase font-['Outfit']">Sincronizando</p>
                 <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest animate-pulse">Datos Maestros</p>
              </div>
           </DialogContent>
        </Dialog>
       {/* Modal de Edición Directa Carlos Style 💎 */}
       <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-[70vw] min-h-[85vh] h-[85vh] bg-emerald-950/40 backdrop-blur-3xl border-none p-0 overflow-hidden rounded-[4rem] shadow-2xl pointer-events-auto flex flex-col scale-in flex-col [&>button]:hidden">
             <DialogHeader className="sr-only">
                <DialogTitle>Panel de Auditoría</DialogTitle>
                <DialogDescription>Edición técnica de campos operativos</DialogDescription>
             </DialogHeader>

             <div className="p-10 bg-emerald-950 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                   <div className="h-16 w-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-emerald-500/50">
                      <Edit3 className="h-8 w-8" />
                   </div>
                   <div className="space-y-1">
                      <h2 className="text-3xl font-black text-white tracking-tighter uppercase font-['Outfit']">Edición de <span className="text-emerald-400">Datos</span></h2>
                      <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.3em]">Gestión Técnica de Registro #{selectedReg?.id}</p>
                   </div>
                </div>
                 {/* Botón de Cierre Rediseñado Premium 💎 */}
                 <button 
                   onClick={() => setIsEditOpen(false)} 
                   className="absolute top-8 right-10 h-14 w-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all flex items-center justify-center group shadow-xl backdrop-blur-sm active:scale-90"
                 >
                    <X className="h-6 w-6 text-white/50 group-hover:text-white group-hover:rotate-90 transition-all duration-500" />
                    <div className="absolute inset-0 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500/10 blur-xl transition-all" />
                 </button>
             </div>

             <div className="flex-1 overflow-y-auto p-12 space-y-10 lc-scroll bg-gradient-to-b from-[#022c22] to-slate-900 pb-24">
                
                <div className="space-y-6">
                   <div className="flex items-center gap-3 ml-2">
                      <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                      <h3 className="text-[12px] font-black text-emerald-100 uppercase tracking-widest">Paso 1: ¿Qué sección desea editar?</h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'maestros', label: 'DATOS DE TRANSPORTE', desc: 'Chofer, Transportista, Unidades', icon: Truck },
                        { id: 'precintos', label: 'DATOS DE SEGURIDAD', desc: 'Aduana, Beta, Sellos, Termos', icon: ShieldCheck },
                        { id: 'embarque', label: 'DATOS DE EMBARQUE', desc: 'Booking, Contenedor, Orden, Fechas', icon: Inbox }
                      ].map((item) => (
                         <button 
                           key={item.id}
                           onClick={() => setEditSector(item.id)}
                           className={cn(
                              "relative overflow-hidden p-6 rounded-[2.5rem] border-2 text-left transition-all duration-500 group",
                              editSector === item.id 
                                ? "border-emerald-500 bg-white shadow-xl shadow-emerald-500/10 scale-[1.02]" 
                                : "border-slate-100 bg-white hover:border-emerald-200"
                           )}
                         >
                            <div className={cn(
                               "h-12 w-12 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500",
                               editSector === item.id ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                            )}>
                               <item.icon className="h-6 w-6" />
                            </div>
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-1">{item.label}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-tight">{item.desc}</p>
                            {editSector === item.id && (
                               <div className="absolute top-6 right-6 h-6 w-6 bg-emerald-500 rounded-full flex items-center justify-center animate-in zoom-in">
                                  <CheckCircle2 className="h-3 w-3 text-white" />
                               </div>
                            )}
                         </button>
                      ))}
                   </div>
                </div>

                {/* Paso 2: Edición Dinámica */}
                {editSector && (
                   <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
                      <div className="flex items-center gap-3 ml-2 border-t border-white/5 pt-10">
                         <div className="h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse" />
                         <h3 className="text-[12px] font-black text-amber-100 uppercase tracking-widest uppercase">Paso 2: Formulario de Edición</h3>
                      </div>

                      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8 relative">
                         <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none text-emerald-950">
                            <Edit3 className="h-32 w-32 rotate-12" />
                         </div>

                         {editSector === 'maestros' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <div className="space-y-6">
                                  <SearchableField 
                                     label="BUSCAR CHOFER (DNI / CARNET)"
                                     icon={Search}
                                     value={editData.dni_chofer}
                                     onChange={(v: string) => setEditData({...editData, dni_chofer: v, nombre_chofer: "", licencia_chofer: ""})}
                                     searchUrl={`${API_BASE_URL}/api/v1/logicapture/drivers/search`}
                                     onSelect={(res: any) => setEditData({
                                        ...editData, 
                                        nombre_chofer: res.nombre,
                                        dni_chofer: res.dni,
                                        licencia_chofer: res.licencia
                                     })}
                                     placeholder="INGRESE DNI O CARNET..."
                                     error={editData.dni_chofer?.length >= 6 && !editData.nombre_chofer}
                                     errorMsg="Chofer no registrado en maestros oficiales"
                                     hideResults={true}
                                  />
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-3 group/field">
                                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CHOFER (LECTURA)</label>
                                     <NiceTooltip text={editData.nombre_chofer}>
                                       <div className="relative flex items-center bg-slate-100/50 border border-slate-100 rounded-2xl h-14 opacity-80 cursor-help px-4 overflow-hidden">
                                          <ShieldCheck className="h-4 w-4 mr-3 text-emerald-500 min-w-[16px]" />
                                          <input value={editData.nombre_chofer} readOnly className="flex-1 bg-transparent border-none outline-none text-xs font-black text-slate-900 truncate" />
                                       </div>
                                     </NiceTooltip>
                                  </div>
                                  <div className="space-y-3 group/field">
                                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">LICENCIA (LECTURA)</label>
                                     <NiceTooltip text={editData.licencia_chofer}>
                                       <div className="relative flex items-center bg-slate-100/50 border border-slate-100 rounded-2xl h-14 opacity-80 cursor-help px-4 overflow-hidden">
                                          <Truck className="h-4 w-4 mr-3 text-emerald-500 min-w-[16px]" />
                                          <input value={editData.licencia_chofer} readOnly className="flex-1 bg-transparent border-none outline-none text-xs font-black text-slate-900 truncate" />
                                       </div>
                                     </NiceTooltip>
                                  </div>
                               </div>
                               <div className="relative group/tracto">
                                   <SearchableField 
                                      label="PLACA TRACTO"
                                      icon={Truck}
                                      value={editData.placa_tracto}
                                      onChange={(v: string) => setEditData({...editData, placa_tracto: v})}
                                      searchUrl={`${API_BASE_URL}/api/v1/logicapture/vehicles/tracto/search`}
                                      onSelect={(res: any) => setEditData({
                                         ...editData, 
                                         placa_tracto: res.placa,
                                         empresa_transporte: res.transportista,
                                         codigoSap: res.codigo_sap,
                                         partidaRegistral: res.partida_registral
                                      })}
                                      placeholder="ABC-123"
                                   />
                                   {editData.placa_tracto && (
                                     <Button 
                                       variant="ghost" 
                                       size="icon" 
                                       onClick={refreshTractoData}
                                       className="absolute bottom-3 right-3 h-8 w-8 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all opacity-0 group-hover/tracto:opacity-100"
                                     >
                                        <RefreshCw className="h-3 w-3" />
                                     </Button>
                                   )}
                                </div>
                               <SearchableField 
                                  label="PLACA CARRETA"
                                  icon={Truck}
                                  value={editData.placa_carreta}
                                  onChange={(v: string) => setEditData({...editData, placa_carreta: v})}
                                  searchUrl={`${API_BASE_URL}/api/v1/logicapture/vehicles/carreta/search`}
                                  onSelect={(res: any) => setEditData({...editData, placa_carreta: res.placa})}
                                  placeholder="XYZ-456"
                                  hideResults={true}
                               />
                            </div>
                         )}

                         {editSector === 'precintos' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                               <MultiInput label="ADUANA" icon={ShieldCheck} values={editData.precinto_aduana} onChange={(v:any)=>setEditData({...editData, precinto_aduana: v})} placeholder="Ej: AD123" />
                               <MultiInput label="OPERADOR" icon={ShieldCheck} values={editData.precinto_operador} onChange={(v:any)=>setEditData({...editData, precinto_operador: v})} placeholder="Ej: OP123" />
                               <MultiInput label="SENASA" icon={ShieldCheck} values={editData.precinto_senasa} onChange={(v:any)=>setEditData({...editData, precinto_senasa: v})} placeholder="Ej: SE123" />
                               <MultiInput label="LÍNEA" icon={Layers} values={editData.precinto_linea} onChange={(v:any)=>setEditData({...editData, precinto_linea: v})} placeholder="Ej: LN123" />
                               <MultiInput label="BETA" icon={Zap} values={editData.precintos_beta} onChange={(v:any)=>setEditData({...editData, precintos_beta: v})} placeholder="Ej: BT123" />
                               <MultiInput label="TERMOGRÁFOS" icon={Thermometer} values={editData.termografos} onChange={(v:any)=>setEditData({...editData, termografos: v})} placeholder="Ej: T-999" />
                            </div>
                         )}

                         {editSector === 'embarque' && (
                            <div className="space-y-10">
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-10 bg-emerald-50/10 rounded-[3rem] border border-emerald-100/50 shadow-inner">
                                  {/* Buscador de Booking Carlos Style 💎 */}
                                  <div className="space-y-6">
                                     <div className="flex items-center gap-3 ml-2">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buscador de Despacho Master</span>
                                     </div>
                                     <SearchableField 
                                        label="NRO DE BOOKING"
                                        icon={Inbox}
                                        value={editData.booking}
                                        onChange={(v: string) => setEditData({...editData, booking: v})}
                                        searchUrl={`${API_BASE_URL}/api/v1/logicapture/bookings/search`}
                                        onSelect={(res: any) => setEditData({
                                           ...editData, 
                                           booking: res.booking,
                                           dam: res.dam,
                                           contenedor: res.contenedor,
                                           orden_beta: res.orden_beta,
                                           planta: res.planta || editData.planta,
                                           cultivo: res.cultivo || editData.cultivo
                                        })}
                                        placeholder="Ej: EBKG123456"
                                     />
                                  </div>

                                  {/* Resumen de Trazabilidad Cruzada 💎 */}
                                  <div className="grid grid-cols-1 gap-4">
                                     <div className="flex flex-col gap-1 px-6 py-4 bg-white border border-slate-100 rounded-3xl shadow-sm">
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">ORDEN BETA</span>
                                        <span className="text-sm font-black text-emerald-950 uppercase">{editData.orden_beta || "PENDIENTE"}</span>
                                     </div>
                                     <div className="flex gap-4">
                                        <div className="flex-1 flex flex-col gap-1 px-6 py-4 bg-white border border-slate-100 rounded-3xl shadow-sm">
                                           <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">DAM</span>
                                           <span className="text-sm font-black text-emerald-950 uppercase">{editData.dam || "PENDIENTE"}</span>
                                        </div>
                                        <div className="flex-1 flex flex-col gap-1 px-6 py-4 bg-white border border-slate-100 rounded-3xl shadow-sm">
                                           <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">CONTENEDOR</span>
                                           <span className="text-sm font-black text-emerald-950 uppercase">{editData.contenedor || "PENDIENTE"}</span>
                                        </div>
                                     </div>
                                  </div>
                               </div>

                               <div className="flex flex-col items-center gap-10 p-12 bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 max-w-2xl mx-auto">
                                  <div className="flex gap-8 w-full">
                                     {/* Selector de Fecha Carlos Style 💎 */}
                                     <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-2 ml-2">
                                           <Calendar className="h-3 w-3 text-emerald-500" />
                                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FECHA OFICIAL</span>
                                        </div>
                                        <Popover>
                                           <PopoverTrigger asChild>
                                              <button className="w-full h-24 bg-white border-2 border-slate-100 rounded-[2rem] flex flex-col items-center justify-center gap-1 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 transition-all group outline-none">
                                                 <span className="text-3xl font-black text-emerald-950 font-['Outfit'] group-hover:scale-110 transition-transform">
                                                    {editData.fecha_embarque ? format(new Date(editData.fecha_embarque), "dd") : "--"}
                                                 </span>
                                                 <span className="text-[10px] font-black text-emerald-600/60 uppercase tracking-[0.2em]">
                                                    {editData.fecha_embarque ? format(new Date(editData.fecha_embarque), "MMMM", { locale: es }) : "Seleccionar"}
                                                 </span>
                                              </button>
                                           </PopoverTrigger>
                                           <PopoverContent className="w-auto p-0 rounded-[2rem] border-none shadow-2xl" align="center">
                                              <UICalendar
                                                 mode="single"
                                                 selected={editData.fecha_embarque ? new Date(editData.fecha_embarque) : undefined}
                                                 onSelect={(date) => {
                                                    if (date) {
                                                       const current = editData.fecha_embarque ? new Date(editData.fecha_embarque) : new Date();
                                                       date.setHours(current.getHours());
                                                       date.setMinutes(current.getMinutes());
                                                       setEditData({...editData, fecha_embarque: date.toISOString()});
                                                    }
                                                 }}
                                                 className="bg-white"
                                                 classNames={{
                                                    day: cn(
                                                      buttonVariants({ variant: "ghost" }),
                                                      "h-9 w-9 p-0 font-bold aria-selected:opacity-100 text-slate-900 hover:bg-emerald-100 hover:text-emerald-950"
                                                    ),
                                                    day_today: "bg-slate-100 text-slate-900",
                                                    day_selected: "bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white focus:bg-emerald-600 focus:text-white",
                                                    caption_label: "text-sm font-black text-slate-900 uppercase tracking-widest",
                                                    head_cell: "text-slate-400 rounded-md w-9 font-black text-[10px] uppercase",
                                                    nav_button: "text-slate-900 hover:text-emerald-600",
                                                 }}
                                              />
                                           </PopoverContent>
                                        </Popover>
                                     </div>

                                     {/* Selector de Hora Carlos Style 💎 */}
                                     <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-2 ml-2">
                                           <Clock className="h-3 w-3 text-amber-500" />
                                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hora de Salida</span>
                                        </div>
                                        <div className="flex gap-4 h-24 bg-white border-2 border-slate-100 rounded-[2rem] p-6 items-center justify-center hover:border-amber-500 transition-all shadow-inner">
                                           <input 
                                              type="time"
                                              value={editData.fecha_embarque ? format(new Date(editData.fecha_embarque), "HH:mm") : "00:00"}
                                              onChange={(e) => {
                                                 if (!e.target.value) return;
                                                 const [h, m] = e.target.value.split(':');
                                                 const date = editData.fecha_embarque ? new Date(editData.fecha_embarque) : new Date();
                                                 date.setHours(parseInt(h));
                                                 date.setMinutes(parseInt(m));
                                                 setEditData({...editData, fecha_embarque: date.toISOString()});
                                              }}
                                              className="bg-transparent text-4xl font-black text-emerald-950 outline-none w-full text-center font-['Outfit'] cursor-pointer"
                                              style={{ colorScheme: 'light' }}
                                           />
                                        </div>
                                     </div>
                                  </div>

                                  <div className="bg-emerald-950 p-6 rounded-[2rem] border border-emerald-900 w-full text-center shadow-2xl shadow-emerald-950/20">
                                     <p className="text-[11px] font-bold text-emerald-500/80">
                                        Embarque programado para el <span className="font-black text-white">{editData.fecha_embarque ? format(new Date(editData.fecha_embarque), "PPPP", { locale: es }) : "---"}</span>
                                     </p>
                                  </div>
                               </div>
                            </div>
                         )}
                      </div>
                   </div>
                )}
             </div>

             <div className="p-10 bg-white border-t border-slate-100 shrink-0 flex items-center justify-between gap-8 z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-4 text-slate-400">
                   <Info className="h-5 w-5" />
                   <p className="text-[10px] font-black uppercase tracking-widest leading-none">Los cambios serán auditados y registrados bajo su usuario corporativo.</p>
                </div>
                <div className="flex gap-4">
                   <button onClick={() => setIsEditOpen(false)} className="px-10 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-all">Cancelar</button>
                   <Button 
                      onClick={handleEditSave}
                      disabled={isSaving}
                      className="px-12 py-7 bg-emerald-950 hover:bg-emerald-900 rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] text-white shadow-2xl shadow-emerald-950/20 active:scale-95 transition-all disabled:opacity-50 min-w-[240px]"
                   >
                      {isSaving ? (
                         <div className="flex items-center gap-3">
                            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                            <span>Procesando...</span>
                         </div>
                       ) : (
                         "Aplicar Corrección"
                       )}
                   </Button>
                </div>
             </div>
          </DialogContent>
       </Dialog>

       {/* MODAL PESOS Y MEDIDAS (ANEXO 1) ⚖️ */}
       <PesosMedidasModal 
         isOpen={isPesosModalOpen}
         onClose={() => setIsPesosModalOpen(false)}
         registroId={selectedRegForPesos}
       />

       {/* --- MODALES DE ÉXITO GLOBALES CARLOS STYLE 💎 --- */}
       
       {/* Éxito Anulación */}
        {/* Éxito Anulación Carlos Style 💎 */}
        <Dialog open={isAnularSuccessOpen} onOpenChange={setIsAnularSuccessOpen}>
           <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-md border border-rose-100 p-12 overflow-hidden rounded-[4rem] shadow-2xl shadow-rose-500/10 text-center flex flex-col items-center gap-8 animate-in zoom-in duration-500">
              <DialogHeader className="sr-only">
                 <DialogTitle>Operación Anulada</DialogTitle>
                 <DialogDescription>El registro ha sido invalidado correctamente</DialogDescription>
              </DialogHeader>
              
              <div className="relative">
                 <div className="absolute -inset-4 bg-rose-500/20 rounded-full blur-2xl animate-pulse" />
                 <div className="h-28 w-28 bg-gradient-to-br from-rose-500 to-rose-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-rose-200 relative animate-in zoom-in duration-700">
                    <ShieldAlert className="h-14 w-14 drop-shadow-lg" />
                 </div>
              </div>

              <div className="space-y-3">
                 <h2 className="text-4xl font-black text-slate-950 tracking-tighter uppercase font-['Outfit']">Operación <span className="text-rose-600">Anulada</span></h2>
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] leading-relaxed">Registro invalidado por incidencia técnica correctamente.</p>
              </div>

              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                 <div className="absolute inset-x-0 h-full bg-gradient-to-r from-rose-400 via-rose-500 to-rose-400 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
              </div>
              
              <Button 
                onClick={() => setIsAnularSuccessOpen(false)}
                className="w-full py-8 bg-rose-600 hover:bg-rose-700 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-rose-600/20 active:scale-95"
              >
                 Entendido
              </Button>
           </DialogContent>
        </Dialog>

       {/* Éxito Edición Directa */}
       <Dialog open={isEditSuccessOpen} onOpenChange={setIsEditSuccessOpen}>
          <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-md border border-emerald-100 p-10 overflow-hidden rounded-[3.5rem] shadow-2xl shadow-emerald-500/10 text-center flex flex-col items-center gap-6 animate-in zoom-in duration-300">
             <DialogHeader className="sr-only">
                <DialogTitle>Edición Guardada</DialogTitle>
                <DialogDescription>Los cambios técnicos han sido aplicados</DialogDescription>
             </DialogHeader>
             <div className="h-24 w-24 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-xl shadow-emerald-200 animate-bounce">
                <CheckCircle2 className="h-12 w-12" />
             </div>
             <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase font-['Outfit']">Edición <span className="text-emerald-600">Completada</span></h2>
                <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Los datos maestros han sido actualizados</p>
             </div>
             <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
                <div className="absolute inset-x-0 h-full bg-emerald-600 animate-pulse" />
             </div>
          </DialogContent>
       </Dialog>
    </div>
  );
}
// Sync Test