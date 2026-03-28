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
  ShieldCheck,
  RefreshCw,
  Edit3,
  Trash2,
  Eye,
  Copy,
  X
} from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`, {
      description: "Listo para pegar en SAP",
      duration: 2000
    });
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
      toast.error("Error al sincronizar con el Oráculo");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistros();
  }, [activeTab, filterPlanta, filterCultivo]);

  const handleExportExcel = async () => {
    toast.promise(
      fetch(`${API_BASE_URL}/api/v1/logicapture/export/excel`)
        .then(async res => {
          if (!res.ok) throw new Error();
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `LogiCapture_Reporte_${new Date().toISOString().split('T')[0]}.xlsx`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        }),
      {
        loading: 'Generando Reporte Premium...',
        success: 'Reporte Excel generado correctamente 💎',
        error: 'Error al generar reporte'
      }
    );
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
                    className="rounded-2xl border-slate-200 font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all gap-2"
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
                     <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                        <SelectItem value="all">Todas las Plantas</SelectItem>
                        <SelectItem value="BETA">Planta BETA</SelectItem>
                        <SelectItem value="TERCEROS">Planta TERCEROS</SelectItem>
                     </SelectContent>
                  </Select>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cultivo</label>
                  <Select value={filterCultivo} onValueChange={setFilterCultivo}>
                     <SelectTrigger className="rounded-2xl border-slate-100 bg-slate-50/50 h-11 transition-all">
                        <SelectValue placeholder="Todos los Cultivos" />
                     </SelectTrigger>
                     <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                        <SelectItem value="all">Todos los Cultivos</SelectItem>
                        <SelectItem value="ARANDANO">Arándano</SelectItem>
                        <SelectItem value="PALTA">Palta</SelectItem>
                        <SelectItem value="UVA">Uva</SelectItem>
                        <SelectItem value="ESPARRAGO">Espárrago</SelectItem>
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
                      <TableRow className="hover:bg-transparent border-slate-100 px-6">
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
                              <TableCell colSpan={6} className="p-10 text-center text-slate-300">Cargando datos del oráculo...</TableCell>
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
                          className="group hover:bg-emerald-50/30 transition-colors border-slate-100 border-b last:border-0 px-6 cursor-pointer"
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
                                      <DropdownMenuItem className="rounded-xl p-3 text-sm font-bold gap-3 focus:bg-emerald-50 focus:text-emerald-700 cursor-pointer">
                                        <Edit3 className="h-4 w-4" /> Editar Auditoría
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator className="bg-slate-50 mx-1 my-2" />
                                      <DropdownMenuItem className="rounded-xl p-3 text-sm font-bold gap-3 focus:bg-rose-50 focus:text-rose-700 cursor-pointer">
                                        <Trash2 className="h-4 w-4" /> Anular Registro
                                      </DropdownMenuItem>
                                   </>
                                )}
                                
                                {activeTab === "PENDIENTE" && (
                                   <DropdownMenuItem className="rounded-xl p-3 text-sm font-bold gap-3 bg-emerald-950 text-white focus:bg-emerald-900 focus:text-white cursor-pointer mt-1">
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
                         { label: "ID REGISTRO", value: selectedReg.id, key: "id" },
                         { label: "FECHA EMBARQUE", value: new Date(selectedReg.fecha_registro).toLocaleDateString(), key: "fecha" },
                         { label: "PLANTA LLENADO", value: selectedReg.planta, key: "planta" },
                         { label: "CULTIVO", value: selectedReg.cultivo, key: "cultivo" },
                         { label: "ORDEN BETA", value: selectedReg.orden_beta, key: "orden" },
                         { label: "BOOKING", value: selectedReg.booking, key: "booking" },
                         { label: "CONTENEDOR", value: selectedReg.contenedor, key: "cnt" },
                         { label: "DAM / DUA", value: selectedReg.dam, key: "dam" },
                         { label: "CODIGO SAP TRANSP.", value: selectedReg.codigo_sap, key: "sap_t" },
                         { label: "RUC TRANSPORTISTA", value: selectedReg.ruc_transportista, key: "ruc_t" },
                         { label: "TRANSPORTISTA", value: selectedReg.empresa_transporte, key: "trans" },
                         { label: "PLACA TRACTO", value: selectedReg.placa_tracto, key: "tracto" },
                         { label: "MARCA TRACTO", value: selectedReg.marca_tracto, key: "marca" },
                         { label: "CERT. TRACTO", value: selectedReg.cert_tracto, key: "cert_t" },
                         { label: "PLACA CARRETA", value: selectedReg.placa_carreta, key: "carreta" },
                         { label: "CERT. CARRETA", value: selectedReg.cert_carreta, key: "cert_c" },
                         { label: "CHOFER (DNI)", value: selectedReg.dni_chofer, key: "chofer" },
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
                                  onClick={() => copyToClipboard(String(item.value), item.label)}
                                >
                                   <Copy className="h-4 w-4" />
                                </Button>
                             </div>
                          </div>
                       ))}
                    </div>

                    {/* Sección de Precintos */}
                    <div className="space-y-4 mt-8">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <ShieldCheck className="h-3 w-3" /> PRECINTOS RESTRICCIÓN
                       </p>
                       {Object.entries({
                          "P. ADUANA": selectedReg.precinto_aduana,
                          "P. OPERADOR": selectedReg.precinto_operador,
                          "P. SENASA": selectedReg.precinto_senasa,
                          "P. LINEA": selectedReg.precinto_linea,
                          "P. BETA": selectedReg.precintos_beta
                       }).map(([label, codes]: [string, any]) => (
                          <div key={label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group hover:border-emerald-200 transition-all">
                             <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                   <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</label>
                                   <p className="text-xs font-bold text-emerald-700 tracking-widest">
                                      {Array.isArray(codes) ? codes.join(" • ") : "-"}
                                   </p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="rounded-xl opacity-0 group-hover:opacity-100 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
                                  onClick={() => copyToClipboard(Array.isArray(codes) ? codes.join(", ") : "-", label)}
                                >
                                   <Copy className="h-4 w-4" />
                                </Button>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 <div className="p-8 bg-white border-t border-slate-100 sticky bottom-0 z-10 flex gap-4">
                    {selectedReg.status === "PENDIENTE" ? (
                       <Button className="flex-1 rounded-2xl bg-emerald-950 hover:bg-emerald-900 font-bold uppercase tracking-widest text-xs h-12 shadow-xl shadow-emerald-950/20">
                          Procesar Registro
                       </Button>
                    ) : (
                       <Button variant="outline" className="flex-1 rounded-2xl border-slate-200 font-bold uppercase tracking-widest text-xs h-12">
                          Descargar PDF
                       </Button>
                    )}
                 </div>
              </div>
           )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
