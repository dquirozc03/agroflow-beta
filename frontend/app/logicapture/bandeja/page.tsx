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
  X
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
} from "@/components/ui/dialog";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
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
import { Button } from "@/components/ui/button";
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://agroflow-okkt.onrender.com";

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
  const [isAnularOpen, setIsAnularOpen] = useState(false);
  const [anularReason, setAnularReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
      }
      
      toast.success(`Registro marcado como ${newStatus} correctamente 💎`);
      fetchRegistros();
      setIsPanelOpen(false);
    } catch (error) {
      toast.error("Error al actualizar el sistema");
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
       
       toast.warning("Registro Anulado Correctamente");
       setIsAnularOpen(false);
       setAnularReason("");
       setOtherReason("");
       fetchRegistros();
       setIsPanelOpen(false);
    } catch (error) {
       toast.error("Error al anular el registro");
    }
  };

  const handleAuditar = (id: number) => {
    window.location.href = `/logicapture?edit=${id}`;
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
      toast.error("Error al sincronizar con el Sistema");
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
      toast.error('No se pudo generar el reporte premium');
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
                  <Button 
                    onClick={handleExportExcel}
                    variant="outline" 
                    className="rounded-2xl bg-white border-slate-200 font-bold text-emerald-800 hover:bg-emerald-50 hover:border-emerald-300 transition-all gap-2 shadow-sm"
                  >
                     <FileDown className="h-4 w-4" />
                     Exportar Excel
                  </Button>
                  <Button 
                    variant="default" 
                    className="rounded-2xl bg-emerald-950 hover:bg-emerald-900 shadow-xl shadow-emerald-950/20 font-bold uppercase tracking-widest text-xs h-10 px-6"
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
                     <SelectContent className="rounded-2xl border-slate-100 shadow-2xl bg-white focus:ring-emerald-500">
                        <SelectItem value="all" className="focus:bg-emerald-50 focus:text-emerald-900 rounded-xl cursor-pointer">Todas las Plantas</SelectItem>
                        {plantasUnicas.map(p => (
                           <SelectItem key={p} value={p} className="focus:bg-emerald-50 focus:text-emerald-900 rounded-xl cursor-pointer uppercase font-bold text-[10px]">{p}</SelectItem>
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
                     <SelectContent className="rounded-2xl border-slate-100 shadow-2xl bg-white focus:ring-emerald-500">
                        <SelectItem value="all" className="focus:bg-emerald-50 focus:text-emerald-900 rounded-xl cursor-pointer">Todos los Cultivos</SelectItem>
                        {cultivosUnicos.map(c => (
                           <SelectItem key={c} value={c} className="focus:bg-emerald-50 focus:text-emerald-900 rounded-xl cursor-pointer uppercase font-bold text-[10px]">{c}</SelectItem>
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
                 
                 <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-6 py-2.5 rounded-2xl border border-slate-100 flex items-center gap-3">
                    <CircleDot className="h-3 w-3 text-emerald-500 animate-pulse" />
                    {registros.length} Registros encontrados
                 </div>
              </div>

              <TabsContent value={activeTab} className="p-0 border-none outline-none">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="hover:bg-transparent border-none px-6">
                        <TableHead className="w-[120px] font-black text-[10px] uppercase tracking-widest p-6">Fecha/Hora</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest">Embarque (B / D / C)</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest">Planta / Cultivo</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest">Transporte (T / C)</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest w-[140px]">Estatus</TableHead>
                        <TableHead className="text-right p-6 font-black text-[10px] uppercase tracking-widest w-[100px]">Acciones</TableHead>
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
                          className="group hover:bg-emerald-50/10 transition-colors border-none px-6 cursor-pointer"
                          onClick={() => { setSelectedReg(reg); setIsPanelOpen(true); }}
                        >
                          <TableCell className="p-6 font-medium text-slate-600">
                             <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900 leading-none mb-1">
                                   {new Date(reg.fecha_registro).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                   {new Date(reg.fecha_registro).toLocaleDateString()}
                                </span>
                             </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex flex-col gap-1.5 py-4">
                                <div className="flex items-center gap-3">
                                   <Badge variant="outline" className="rounded-lg bg-emerald-50 text-emerald-800 border-emerald-100 font-black text-[10px]">{reg.booking}</Badge>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 ml-1 italic capitalize">
                                   {reg.dam} • {reg.contenedor}
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
                                      <DropdownMenuItem className="rounded-xl p-3 text-sm font-bold gap-3 focus:bg-emerald-50 focus:text-emerald-700 cursor-pointer" onClick={() => handleAuditar(reg.id)}>
                                        <Edit3 className="h-4 w-4" /> Auditar
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator className="bg-slate-50 mx-1 my-2" />
                                      <DropdownMenuItem className="rounded-xl p-3 text-sm font-bold gap-3 focus:bg-rose-50 focus:text-rose-700 cursor-pointer" onClick={() => handleStatusChange(reg.id, 'ANULADO')}>
                                        <Trash2 className="h-4 w-4" /> Anular Registro
                                      </DropdownMenuItem>
                                   </>
                                )}
                                
                                {activeTab === "PENDIENTE" && (
                                   <DropdownMenuItem 
                                     className="rounded-xl p-3 text-sm font-bold gap-3 bg-emerald-950 text-white focus:bg-emerald-900 focus:text-white cursor-pointer mt-1"
                                     onClick={() => handleStatusChange(reg.id, 'PROCESADO')}
                                   >
                                      <CheckCircle2 className="h-4 w-4" /> Cerrar Operación
                                   </DropdownMenuItem>
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
                         { label: "CONTENEDOR", value: selectedReg.contenedor, key: "cnt" },
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
                            value: `SENASA: ${selectedReg.precinto_senasa?.join(" / ") || "**"} / PS.LIN: ${selectedReg.precinto_linea?.join(" / ") || "**"}`, 
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
                         className="flex-1 rounded-2xl bg-emerald-950 hover:bg-emerald-900 font-bold uppercase tracking-widest text-xs h-12 shadow-xl shadow-emerald-950/20"
                         onClick={() => handleStatusChange(selectedReg.id, 'PROCESADO')}
                       >
                          Cerrar Operación (Enviar a Procesados)
                       </Button>
                    ) : (
                       <Button 
                         variant="outline" 
                         className="flex-1 rounded-2xl border-slate-200 font-bold uppercase tracking-widest text-xs h-12 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
                         onClick={() => handleAuditar(selectedReg.id)}
                       >
                          <Edit3 className="h-4 w-4 mr-2" /> Auditar Registro
                       </Button>
                    )}
                 </div>
              </div>
           )}
        </SheetContent>
      </Sheet>

      {/* Modal de Éxito Premium - ELIMINACIÓN DE TOAST FEO */}
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
                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                           <SelectItem value="Error de precinto" className="font-bold text-slate-600 focus:bg-emerald-50 focus:text-emerald-700">Error de precinto</SelectItem>
                           <SelectItem value="Error de precintado" className="font-bold text-slate-600 focus:bg-emerald-50 focus:text-emerald-700">Error de precintado</SelectItem>
                           <SelectItem value="Error de guia" className="font-bold text-slate-600 focus:bg-emerald-50 focus:text-emerald-700">Error de guía</SelectItem>
                           <SelectItem value="Error de booking" className="font-bold text-slate-600 focus:bg-emerald-50 focus:text-emerald-700">Error de booking</SelectItem>
                           <SelectItem value="Otros" className="font-bold text-slate-600 focus:bg-emerald-50 focus:text-emerald-700 text-rose-600">Otros (Especificar)</SelectItem>
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
                    className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] text-slate-400"
                    onClick={() => setIsAnularOpen(false)}
                  >
                     Cancelar
                  </Button>
                  <Button 
                    className="flex-1 rounded-2xl h-14 bg-rose-600 hover:bg-rose-700 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-rose-600/20"
                    onClick={handleAnularConfirm}
                  >
                     Confirmar Anulación
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
