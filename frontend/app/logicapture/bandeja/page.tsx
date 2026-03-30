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
  ShieldCheck,
  User,
  Layers,
  Zap,
  Thermometer,
  Info,
  Inbox
} from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("PENDIENTE");
  const [filterPlanta, setFilterPlanta] = useState("all");
  const [filterCultivo, setFilterCultivo] = useState("all");
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
  const [anularReason, setAnularReason] = useState("");
  const [otherReason, setOtherReason] = useState("");

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
                // Buscar coincidencia exacta por DNI (puede ser 8 u 9 dígitos)
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
      const resp = await fetch(`${API_BASE_URL}/api/v1/logicapture/tracto/${editData.placa_tracto}`);
      if (resp.ok) {
        const data = await resp.json();
        setEditData((prev: any) => ({
          ...prev,
          empresa_transporte: data.transportista,
          codigoSap: data.codigo_sap,
          partidaRegistral: data.partida_registral
        }));
        toast.success("Sincronizado con maestros oficiales 💎");
      }
    } catch (e) {}
  };

  const syncAllMasters = async () => {
    setIsLoading(true);
    try {
      const recordsToSync = registros.filter(r => r.status === 'PROCESADO' && (!r.codigo_sap || !r.partida_registral));
      
      if (recordsToSync.length === 0) {
        toast.info("Sin Pendientes", { description: "Todos los registros ya están sincronizados." });
        setIsLoading(false);
        return;
      }

      toast.info("Sincronizando...", { description: `Procesando ${recordsToSync.length} registros...` });

      let count = 0;
      for (const reg of recordsToSync) {
        try {
          const resp = await fetch(`${API_BASE_URL}/api/v1/logicapture/tracto/${reg.placa_tracto}`);
          if (resp.ok) {
            const master = await resp.json();
            await fetch(`${API_BASE_URL}/api/v1/logicapture/registros/${reg.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                codigoSap: master.codigo_sap,
                partidaRegistral: master.partida_registral,
                empresa: master.transportista
              })
            });
            count++;
          }
        } catch (inner) {}
      }
      
      toast.success("Sincronización Completada 💎", { 
        description: `Se actualizaron ${count} registros satisfactoriamente.`
      });
      fetchRegistros();
    } catch (e) {
      toast.error("Error en la sincronización masiva");
    } finally {
      setIsLoading(false);
    }
  };

   const [isEditOpen, setIsEditOpen] = useState(false);

  const copyToClipboard = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    
    toast.success(`${label} copiado`, {
      description: "Listo para pegar en SAP",
      duration: 1500
    });

    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    if (newStatus === "ANULADO") {
       setIsAnularOpen(true);
       return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/logicapture/registros/${id}/status?status=${newStatus}`, {
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
    if (!anularReason) {
      toast.error("Seleccione un motivo de anulación");
      return;
    }
    
    const finalReason = anularReason === "Otros" ? otherReason : anularReason;
    if (anularReason === "Otros" && !otherReason) {
      toast.error("Especifique el motivo 'Otros'");
      return;
    }

    try {
       const response = await fetch(`${API_BASE_URL}/api/v1/logicapture/registros/${selectedReg.id}/status?status=ANULADO&motivo=${encodeURIComponent(finalReason)}`, {
         method: 'PATCH'
       });
       if (!response.ok) throw new Error();
       
       setIsAnularSuccessOpen(true);
       setTimeout(() => setIsAnularSuccessOpen(false), 2500);
       
       setIsAnularOpen(false);
       setAnularReason("");
       setOtherReason("");
       fetchRegistros();
       setIsPanelOpen(false);
    } catch (error) {
       toast.error("Error al anular el registro");
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
    setEditSector(""); // Reiniciar selección
    setIsEditOpen(true);
  };

  const handleEditSave = async () => {
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
             // Campos maestros si se editaron
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

       if (!response.ok) throw new Error();
       
       toast.success("Cambios aplicados correctamente 💎");
       setIsEditOpen(false);
       fetchRegistros();
    } catch (error) {
       setErrorMessage("No se pudieron guardar los cambios de auditoría.");
       setIsErrorOpen(true);
    }
  };

  const fetchRegistros = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("status", activeTab);
      if (filterPlanta !== "all") params.append("planta", filterPlanta);
      if (filterCultivo !== "all") params.append("cultivo", filterCultivo);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/logicapture/registros?${params.toString()}`);
      if (!response.ok) throw new Error("Error al obtener registros");
      
      const data = await response.json();
      setRegistros(data.items || []);
    } catch (error) {
      setErrorMessage("No se pudo sincronizar la bandeja con el sistema central.");
      setIsErrorOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistros();
  }, [activeTab, filterPlanta, filterCultivo]);

  // Filtros dinámicos basados en la data real
  const plantasUnicas = Array.from(new Set(registros.map(r => r.planta).filter(Boolean)));
  const cultivosUnicos = Array.from(new Set(registros.map(r => r.cultivo).filter(Boolean)));

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/logicapture/export/excel`);
      if (!response.ok) throw new Error();
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LogiCapture_Auditoria_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      toast.success('Reporte Excel generado correctamente 💎');
    } catch (error) {
      setErrorTitle("ERROR DE EXPORTACIÓN");
      setErrorMessage("No se pudo generar el reporte premium. Verifique que existan datos en el periodo seleccionado o contacte a soporte TI.");
      setIsErrorOpen(true);
    } finally {
      setTimeout(() => setIsExporting(false), 2500);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDIENTE":
        return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 animate-pulse">Pendiente</Badge>;
      case "PROCESADO":
        return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">Procesado</Badge>;
      case "ANULADO":
        return <Badge variant="secondary" className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-black">ANULADO</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Búsqueda Rápida</label>
                  <div className="relative group">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                     <Input 
                        placeholder="Booking, Contenedor..." 
                        className="pl-10 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all h-11"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Planta Llenado</label>
                  <Select value={filterPlanta} onValueChange={setFilterPlanta}>
                     <SelectTrigger className="rounded-2xl border-slate-100 bg-slate-50/50 h-11 transition-all">
                        <SelectValue placeholder="Todas las Plantas" />
                     </SelectTrigger>
                     <SelectContent className="rounded-2xl border-slate-200 shadow-2xl bg-white border">
                        <SelectItem value="all" className="focus:bg-emerald-600 focus:text-white text-slate-700 rounded-xl cursor-pointer font-bold">Todas las Plantas</SelectItem>
                        {plantasUnicas.map(p => (
                           <SelectItem key={p} value={p} className="focus:bg-emerald-600 focus:text-white text-slate-700 rounded-xl cursor-pointer uppercase font-bold text-[10px]">{p}</SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cultivo</label>
                  <Select value={filterCultivo} onValueChange={setFilterCultivo}>
                     <SelectTrigger className="rounded-2xl border-slate-100 bg-slate-50/50 h-11 transition-all">
                        <SelectValue placeholder="Todos los Cultivos" />
                     </SelectTrigger>
                     <SelectContent className="rounded-2xl border-slate-200 shadow-2xl bg-white border">
                        <SelectItem value="all" className="focus:bg-emerald-600 focus:text-white text-slate-700 rounded-xl cursor-pointer font-bold">Todos los Cultivos</SelectItem>
                        {cultivosUnicos.map(c => (
                           <SelectItem key={c} value={c} className="focus:bg-emerald-600 focus:text-white text-slate-700 rounded-xl cursor-pointer uppercase font-bold text-[10px]">{c}</SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               <div className="flex items-end pb-0.5">
                  <Button 
                    variant="ghost" 
                    className="h-10 text-slate-400 hover:text-emerald-700 gap-2 font-bold px-4"
                    onClick={() => { setFilterPlanta("all"); setFilterCultivo("all"); setSearchTerm(""); }}
                  >
                     <RefreshCw className="h-4 w-4" />
                     Limpiar Filtros
                  </Button>
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
                           variant="outline"
                           onClick={syncAllMasters}
                           disabled={isLoading}
                           className="rounded-2xl px-6 py-2.5 font-black uppercase tracking-widest text-[10px] bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-50 transition-all hover:scale-105 active:scale-95 shadow-sm h-auto flex items-center gap-2"
                        >
                           <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
                           Sincronizar Maestros
                        </Button>
                     )}
                     <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-6 py-2.5 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <CircleDot className="h-3 w-3 text-emerald-500 animate-pulse" />
                        {registros.length} Registros encontrados
                     </div>
                  </div>
              </div>

              <TabsContent value={activeTab} className="p-0 border-none outline-none">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden lc-table-clean">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="hover:bg-transparent border-none px-6 [&_th]:border-none">
                        <TableHead className="w-[120px] font-black text-[10px] uppercase tracking-widest p-6 border-none">Fecha/Hora</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest border-none">Embarque (B / D / C)</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest border-none">Planta / Cultivo</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest border-none">Transporte (T / C)</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest w-[140px] border-none">Estatus</TableHead>
                        <TableHead className="text-right p-6 font-black text-[10px] uppercase tracking-widest w-[100px] border-none">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                         Array.from({length: 5}).map((_, i) => (
                           <TableRow key={i} className="animate-pulse">
                              <TableCell colSpan={6} className="p-10 text-center text-slate-300">Cargando datos del sistema...</TableCell>
                           </TableRow>
                         ))
                      ) : registros.length === 0 ? (
                        <TableRow>
                           <TableCell colSpan={6} className="p-20 text-center">
                              <div className="flex flex-col items-center gap-4 text-slate-300">
                                 <AlertCircle className="h-12 w-12 opacity-20" />
                                 <p className="font-black uppercase tracking-widest text-xs">No hay registros para este estatus</p>
                              </div>
                           </TableCell>
                        </TableRow>
                      ) : registros.filter(r => 
                         r.booking.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         r.contenedor.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map((reg) => (
                        <TableRow 
                          key={reg.id} 
                          className="group hover:bg-emerald-50/10 transition-colors border-none px-6 cursor-pointer [&_td]:border-none"
                          onClick={() => { setSelectedReg(reg); setIsPanelOpen(true); }}
                        >
                          <TableCell className="p-6 font-medium text-slate-600">
                             <div className="flex flex-col">
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
                                <div className="flex items-center gap-3"><span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase border border-emerald-100/50 shadow-sm">{reg.booking}</span></div>
                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 ml-1 italic capitalize">
                                   {reg.dam} • {formatContainerId(reg.contenedor)}
                                </div>
                             </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex flex-col gap-1">
                                <span className="text-xs font-black text-slate-900 tracking-tight">{reg.planta || "SIN PLANTA"}</span>
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{reg.cultivo || "SIN CULTIVO"}</span>
                             </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                   <Truck className="h-3 w-3 text-emerald-500" />
                                   {reg.placa_tracto}
                                   <span className="text-slate-300 mx-1">/</span>
                                   {reg.placa_carreta}
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{reg.empresa_transporte}</span>
                             </div>
                          </TableCell>
                          <TableCell>
                             {getStatusBadge(reg.status)}
                          </TableCell>
                          <TableCell className="text-right p-6" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-10 w-10 p-0 rounded-2xl hover:bg-white hover:shadow-sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 shadow-2xl p-2 min-w-[160px]">
                                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-3">Gestión</DropdownMenuLabel>
                                
                                <DropdownMenuItem 
                                  className="rounded-xl p-3 text-sm font-bold gap-3 focus:bg-emerald-50 focus:text-emerald-700 cursor-pointer"
                                  onClick={() => { setSelectedReg(reg); setIsPanelOpen(true); }}
                                >
                                  <Eye className="h-4 w-4" /> Ver Detalle (SAP)
                                </DropdownMenuItem>

                                {activeTab === "PROCESADO" && (
                                   <>
                                      <DropdownMenuItem className="rounded-xl p-3 text-sm font-bold gap-3 focus:bg-emerald-50 focus:text-emerald-700 cursor-pointer" onClick={() => handleEditOpen(reg)}>
                                        <Edit3 className="h-4 w-4" /> Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator className="bg-slate-50 mx-1 my-2" />
                                      <DropdownMenuItem className="rounded-xl p-3 text-sm font-bold gap-3 focus:bg-rose-50 focus:text-rose-700 cursor-pointer" onClick={() => handleStatusChange(reg.id, 'ANULADO')}>
                                        <Trash2 className="h-4 w-4" /> Anular Registro
                                      </DropdownMenuItem>
                                   </>
                                )}
                                
                                {activeTab === "PENDIENTE" && (
                                   <>
                                      <DropdownMenuItem 
                                        className="rounded-xl p-3 text-sm font-bold gap-3 bg-emerald-950 text-white focus:bg-emerald-900 focus:text-white cursor-pointer mt-1"
                                        onClick={() => handleStatusChange(reg.id, 'PROCESADO')}
                                      >
                                         <Zap className="h-4 w-4" /> Procesar Registro
                                      </DropdownMenuItem>
                                   </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
                         { label: "PLACAS", value: `${selectedReg.placa_tracto} / ${selectedReg.placa_carreta}`, key: "placas" },
                         { label: "CHOFER", value: selectedReg.nombre_chofer, key: "chofer_n" },
                         { label: "DNI", value: selectedReg.dni_chofer, key: "dni" },
                         { label: "LICENCIA", value: selectedReg.licencia_chofer, key: "lic" },
                         { label: "TERMOGRAFOS", value: selectedReg.termografos?.join(" / "), key: "term" },
                         { label: "CODIGO SAP", value: selectedReg.codigo_sap, key: "sap" },
                         { label: "TRANSPORTISTA", value: selectedReg.empresa_transporte, key: "trans" },
                         { label: "NUMERO DE DAM", value: selectedReg.dam, key: "dam" },
                         { label: "PRECINTOS BETA", value: selectedReg.precintos_beta?.join(" / "), key: "beta" },
                         { label: "PRECINTO ADUANA", value: selectedReg.precinto_aduana?.join(" / "), key: "aduana" },
                         { label: "PRECINTO OPERADOR", value: selectedReg.precinto_operador?.join(" / "), key: "ope" },
                         { 
                            label: "SENASA/PS LÍNEA", 
                            value: `${selectedReg.precinto_senasa?.join(" / ") || "**"} / PS.LIN: ${selectedReg.precinto_linea?.join(" / ") || "**"}`, 
                            key: "senasa_linea" 
                         },
                         { label: "PARTIDA REGISTRAL", value: selectedReg.partida_registral, key: "partida" },
                         { 
                            label: "TARJETA UNICA DE CIRCULACION", 
                            value: `${selectedReg.cert_tracto || "**"} / ${selectedReg.cert_carreta || "**"}`, 
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
                         onClick={() => handleStatusChange(selectedReg.id, 'PROCESADO')}
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
                  Sincronizando con el Sistema de Datos
               </p>
            </div>
         </DialogContent>
      </Dialog>

      {/* Modal de Anulación Premium */}
      <Dialog open={isAnularOpen} onOpenChange={setIsAnularOpen}>
         <DialogContent className="sm:max-w-md bg-white border-none p-0 overflow-hidden rounded-[3rem] shadow-2xl">
            <div className="relative p-10 flex flex-col gap-6">
               <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                     <AlertTriangle className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                     <h2 className="text-2xl font-black text-slate-950 tracking-tight uppercase">Anular Operación</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Se marcará como error administrativo</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Motivo de Anulación</label>
                     <Select value={anularReason} onValueChange={setAnularReason}>
                        <SelectTrigger className="rounded-2xl border-slate-100 bg-slate-50/50 h-14 font-bold text-slate-700">
                           <SelectValue placeholder="Seleccione un motivo..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-[2rem] border-slate-200 shadow-2xl bg-white p-2">
                           <SelectItem value="Error de precinto" className="p-4 rounded-2xl font-bold text-slate-700 focus:bg-rose-50 focus:text-rose-700 cursor-pointer mb-1 border-b border-slate-50 last:border-none">Error de precinto</SelectItem>
                           <SelectItem value="Error de precintado" className="p-4 rounded-2xl font-bold text-slate-700 focus:bg-rose-50 focus:text-rose-700 cursor-pointer mb-1 border-b border-slate-50 last:border-none">Error de precintado</SelectItem>
                           <SelectItem value="Error de guia" className="p-4 rounded-2xl font-bold text-slate-700 focus:bg-rose-50 focus:text-rose-700 cursor-pointer mb-1 border-b border-slate-50 last:border-none">Error de guía</SelectItem>
                           <SelectItem value="Error de booking" className="p-4 rounded-2xl font-bold text-slate-700 focus:bg-rose-50 focus:text-rose-700 cursor-pointer mb-1 border-b border-slate-50 last:border-none">Error de booking</SelectItem>
                           <SelectItem value="Otros" className="p-4 rounded-2xl font-bold text-rose-600 focus:bg-rose-600 focus:text-white cursor-pointer border-none mt-2">Otros (Especificar)</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>

                  {anularReason === "Otros" && (
                     <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Detalle del Motivo</label>
                        <Input 
                           value={otherReason}
                           onChange={(e) => setOtherReason(e.target.value)}
                           placeholder="Escriba el motivo aquí..."
                           className="rounded-2xl border-slate-100 bg-white h-14 font-bold text-slate-700"
                        />
                     </div>
                  )}
               </div>

               <div className="flex gap-4 mt-4">
                  <Button 
                    variant="ghost" 
                    className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] text-slate-400 hover:bg-slate-100"
                    onClick={() => setIsAnularOpen(false)}
                  >
                     Cancelar
                  </Button>
                  <Button 
                    className="flex-1 rounded-2xl h-14 bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-600/20 text-white"
                    onClick={handleAnularConfirm}
                  >
                     Confirmar Anulación
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
       {/* Modal de Error Premium Carlos Style ðŸ’Ž */}
       <Dialog open={isErrorOpen} onOpenChange={setIsErrorOpen}>
          <DialogContent className="sm:max-w-md bg-white border-none p-0 overflow-hidden rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300">
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
       {/* Modal de Edición Directa Carlos Style ðŸ’Ž */}
       <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-4xl bg-white border-none p-0 overflow-hidden rounded-[4rem] shadow-2xl h-[90vh] flex flex-col">
             <DialogHeader className="sr-only">
                <DialogTitle>Editar Auditoría</DialogTitle>
                <DialogDescription>Corrección de datos operativos LogiCapture</DialogDescription>
             </DialogHeader>

             <div className="p-10 bg-emerald-950 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                   <div className="h-16 w-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-emerald-500/50">
                      <Edit3 className="h-8 w-8" />
                   </div>
                   <div className="space-y-1">
                      <h2 className="text-3xl font-black text-white tracking-tighter uppercase font-['Outfit']">Auditoría <span className="text-emerald-400">Dirigida</span></h2>
                      <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.3em]">Corrección Selectiva de Registro #{selectedReg?.id}</p>
                   </div>
                </div>
                <button onClick={() => setIsEditOpen(false)} className="h-12 w-12 bg-white/10 hover:bg-emerald-500 text-white rounded-2xl transition-all flex items-center justify-center group">
                   <X className="h-6 w-6 group-hover:scale-110 transition-transform" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-12 space-y-10 lc-scroll bg-slate-50/30 pb-24">
                {/* Modal Transitorio de Éxito Anulación */}
      <Dialog open={isAnularSuccessOpen} onOpenChange={setIsAnularSuccessOpen}>
          <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-md border border-emerald-100 p-10 overflow-hidden rounded-[3.5rem] shadow-2xl shadow-emerald-500/10 text-center flex flex-col items-center gap-6 animate-in zoom-in duration-300">
             <div className="h-24 w-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-xl shadow-emerald-200 animate-bounce">
                <CheckCircle2 className="h-12 w-12" />
             </div>
             <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase font-['Outfit']">Registro <span className="text-emerald-600">Actualizado</span></h2>
                <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Operación modificada correctamente</p>
             </div>
             <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
                <div className="absolute inset-x-0 h-full bg-emerald-500 animate-pulse" />
             </div>
          </DialogContent>
      </Dialog>
                <div className="space-y-6">
                   <div className="flex items-center gap-3 ml-2">
                      <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                      <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Paso 1: ¿Qué campo desea corregir?</h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'maestros', label: 'DATOS DE TRANSPORTE', desc: 'Chofer, Transportista, Unidades', icon: Truck },
                        { id: 'precintos', label: 'DATOS DE SEGURIDAD', desc: 'Aduana, Beta, Sellos, Termos', icon: ShieldCheck },
                        { id: 'embarque', label: 'DATOS DE EMBARQUE', desc: 'Booking, Contenedor, Orden, Cronos', icon: Inbox }
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
                      <div className="flex items-center gap-3 ml-2 border-t border-slate-100 pt-10">
                         <div className="h-3 w-3 rounded-full bg-amber-500 animate-pulse" />
                         <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest uppercase">Paso 2: Formulario de Corrección</h3>
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
                     className="px-12 py-7 bg-emerald-950 hover:bg-emerald-900 rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] text-white shadow-2xl shadow-emerald-950/20 active:scale-95 transition-all"
                   >
                      Aplicar Corrección
                   </Button>
                </div>
             </div>
          </DialogContent>
       </Dialog>
    </div>
  );
}

