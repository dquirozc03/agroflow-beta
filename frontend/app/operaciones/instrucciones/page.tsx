"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  RefreshCw,
  Zap,
  Inbox,
  LayoutDashboard,
  FileText,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Globe,
  Bell,
  ShieldCheck,
  ChevronRight,
  X,
  Truck,
  Ship,
  MapPin,
  Thermometer,
  Wind,
  Droplets,
  Package,
  Scale,
  Edit3,
  Save,
  FileEdit,
  DollarSign,
  History,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  ChevronLeft,
  Copy,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/constants";

export default function InstruccionesEmbarque() {
  const { user } = useAuth();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [lookupData, setLookupData] = useState<any>(null);
  const [isLoadingLookup, setIsLoadingLookup] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [bookingsReal, setBookingsReal] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [emisionSWB, setEmisionSWB] = useState(true);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [isLoadingHistorial, setIsLoadingHistorial] = useState(false);

  // --- Estado para Filtros y Paginación ---
  const [filtroEstado, setFiltroEstado] = useState<"TODOS" | "ACTIVO" | "ANULADO">("TODOS");
  const [searchTermHistorial, setSearchTermHistorial] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const [isAnularDialogOpen, setIsAnularDialogOpen] = useState(false);
  const [itemToAnular, setItemToAnular] = useState<number | null>(null);
  const [isAnulando, setIsAnulando] = useState(false);
  const [showSuccessAnular, setShowSuccessAnular] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState("CAMBIO DE BOOKING");

  // --- Estado para Edición Avanzada ---
  const [overrideData, setOverrideData] = useState<any>({
    booking: "",
    orden_beta: "",
    cliente_nombre: "",
    consignatario_bl: "",
    direccion_consignatario: "",
    notify_bl: "",
    direccion_notify: "",
    eori_consignatario: "",
    eori_notify: "",
    motonave: "",
    naviera: "",
    puerto_embarque: "CALLAO",
    puerto_destino: "",
    eta: "",
    cultivo: "",
    variedad: "WONDERFUL",
    temperatura: "0.5 \u00b0C",
    ventilacion: "15 CBM",
    humedad: "OFF",
    atm: "NO APLICA",
    oxigeno: "----",
    co2: "----",
    filtros: "NO",
    cold_treatment: "NO",
    cajas: 0,
    pallets: 0,
    peso_neto: "0.000 KG",
    peso_bruto: "0.000 KG",
    fob: "0.00",
    freight: "PREPAID",
    consignatario_fito: "",
    direccion_fito: "",
    pais_destino: "",
    presentacion: "",
    etiquetas: "",
    observaciones: "",
    po: "",
    planta_llenado: "",
    direccion_planta: "",
    ubigeo_planta: "",
    region_planta: "",
    desc_en: "",
    desc_es: "",
    usuario: user?.usuario || "SISTEMA"
  });

  useEffect(() => {
    if (user?.usuario) {
      setOverrideData((prev: any) => ({ ...prev, usuario: user.usuario }));
    }
  }, [user]);

  useEffect(() => {
    loadBookings();
    loadHistorial();
  }, []);

  const loadBookings = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/sync/posicionamiento/list`);
      if (resp.ok) {
        const data = await resp.json();
        setBookingsReal(data || []);
      }
    } catch (e) {
      console.error("Error cargando:", e);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const loadHistorial = async () => {
    setIsLoadingHistorial(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/instrucciones/historial`);
      if (resp.ok) {
        const data = await resp.json();
        setHistorial(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingHistorial(false);
    }
  };

  const isAlreadyEmitted = (bookingId: string) => {
    return historial.some(h => h.booking === bookingId && h.status === "ACTIVO");
  };

  const { filteredHistory, totalPages, paginatedHistory } = useMemo(() => {
    let filtered = historial;
    if (filtroEstado !== "TODOS") {
      filtered = filtered.filter(item => item.status === filtroEstado);
    }
    if (searchTermHistorial.trim() !== "") {
      const term = searchTermHistorial.toLowerCase().trim();
      filtered = filtered.filter(item => 
        (item.booking || "").toLowerCase().includes(term) || 
        (item.orden_beta || "").toLowerCase().includes(term)
      );
    }
    const total = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    
    return { filteredHistory: filtered, totalPages: total, paginatedHistory: paginated };
  }, [historial, filtroEstado, searchTermHistorial, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filtroEstado]);

  const handleGeneratePdf = async (isOverride: boolean = false) => {
    const bookingId = selectedBooking?.BOOKING || selectedBooking?.booking || selectedBooking?.id;
    if (!bookingId && !isOverride) return;

    if (lookupData?.emision_activa) {
      alert("Ya existe una Instrucci\u00f3n activa. Debe anularla en el Historial para generar una nueva.");
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const endpoint = isOverride ? "/api/v1/instrucciones/generate-pdf-override" : "/api/v1/instrucciones/generate-pdf";
      const body = isOverride ? overrideData : {
        booking: bookingId,
        observaciones: observaciones,
        emision_bl: emisionSWB ? "SWB" : "EMISI\u00d3N EN ORIGEN",
        usuario: user?.usuario || "SISTEMA"
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const fname = isOverride ? overrideData.orden_beta : (lookupData?.orden_beta || bookingId);
        a.download = `IE_${fname}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        loadHistorial();
        handleBookingSelect(selectedBooking);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const confirmAnular = async () => {
    if (!itemToAnular) return;
    setIsAnulando(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/instrucciones/anular/${itemToAnular}?usuario=${user?.usuario || "SISTEMA"}&motivo=${encodeURIComponent(motivoAnulacion)}`, {
        method: "POST"
      });
      if (resp.ok) {
        setShowSuccessAnular(true);
        await loadHistorial();
        if (selectedBooking) await handleBookingSelect(selectedBooking);
        
        // Esperamos un momento para que el usuario vea el \u00e9xito en el modal
        setTimeout(() => {
          setIsAnularDialogOpen(false);
          setShowSuccessAnular(false);
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnulando(false);
    }
  };

  const handleDownloadHistory = async (id: number, orden: string) => {
    setDownloadingId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/instrucciones/download/${id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `IE_${orden}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleBookingSelect = async (b: any) => {
    const bookingId = b.BOOKING || b.booking || b.id;
    setSelectedBooking(b);
    setLookupData(null);
    setIsLoadingLookup(true);
    setIsSelectorOpen(false);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/instrucciones/lookup/${bookingId}`);
      if (resp.ok) {
        const data = await resp.json();
        setLookupData(data);
        
        setOverrideData({
          ...overrideData,
          booking: data.booking || "",
          orden_beta: data.orden_beta || "",
          cliente_nombre: data.cliente_nombre || "",
          consignatario_bl: data.maestro?.consignatario_bl || data.cliente_nombre || "",
          direccion_consignatario: data.maestro?.direccion_consignatario || "",
          notify_bl: data.maestro?.notify_bl || "SAME AS CONSIGNEE",
          direccion_notify: data.maestro?.direccion_notify || "",
          eori_consignatario: data.maestro?.eori_consignatario || "",
          eori_notify: data.maestro?.eori_notify || "",
          motonave: data.motonave || "",
          naviera: data.naviera || "",
          puerto_embarque: data.puerto_embarque || "CALLAO",
          puerto_destino: data.puerto_destino || "",
          eta: data.eta || "",
          cultivo: data.cultivo || "",
          variedad: data.variedad || "WONDERFUL",
          temperatura: data.temperatura || "0.5 \u00b0C",
          ventilacion: data.ventilacion || "15 CBM",
          humedad: data.humedad || "OFF",
          atm: data.atm || "NO APLICA",
          oxigeno: "----",
          co2: "----",
          filtros: data.filtros || "NO",
          cold_treatment: data.cold_treatment || "NO",
          cajas: data.cajas || 0,
          pallets: data.pallets || 0,
          peso_neto: data.peso_neto || "0.000 KG",
          peso_bruto: data.peso_bruto || "0.000 KG",
          fob: data.fob || "0.00",
          freight: data.incoterm?.includes("CIF") ? "PREPAID" : "COLLECT",
          po: data.maestro?.po || "",
          pais_destino: data.maestro?.pais || "",
          consignatario_fito: data.maestro?.fitosanitario?.consignatario_fito || "",
          direccion_fito: data.maestro?.fitosanitario?.direccion_fito || "",
          presentacion: data.presentacion || "CAJA 3.8 KG",
          etiquetas: data.etiquetas || "GENERICA",
          planta_llenado: data.planta_llenado || "",
          direccion_planta: data.direccion_planta || "",
          ubigeo_planta: data.ubigeo_planta || "",
          region_planta: data.region_planta || "",
          desc_en: data.desc_en || "",
          desc_es: data.desc_es || ""
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLookup(false);
    }
  };

  const handleOverrideChange = (field: string, value: any) => {
    setOverrideData((prev: any) => {
      const newData = { ...prev, [field]: value };
      
      // Sincronizaci\u00f3n inteligente de Descripciones B/L
      if (field === 'cajas' || field === 'pallets' || field === 'cultivo' || field === 'variedad') {
        const cajas = field === 'cajas' ? value : prev.cajas;
        const pallets = field === 'pallets' ? value : prev.pallets;
        const cultivo = field === 'cultivo' ? value : prev.cultivo;
        const variedad = field === 'variedad' ? value : prev.variedad;
        
        newData.desc_en = `${cajas} BOXES WITH FRESH ${cultivo.toUpperCase()} ${variedad.toUpperCase()} ON ${pallets} PALLETS`;
        newData.desc_es = `${cajas} CAJAS CON ${cultivo.toUpperCase()} FRESCO ${variedad.toUpperCase()} EN ${pallets} PALLETAS`;
      }
      
      return newData;
    });
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <AppSidebar className="hidden lg:block shrink-0" />

      <main className="flex-1 flex flex-col min-w-0 h-full relative z-10 overflow-hidden">
        <AppHeader />
        
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* DIALOG: SELECTOR DE BOOKINGS */}
          <Dialog open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white group">
              <div className="bg-slate-900 p-8 text-white relative">
                <button onClick={() => setIsSelectorOpen(false)} className="absolute top-6 right-6 h-10 w-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all group/close">
                  <X className="h-5 w-5 text-white/50 group-hover/close:text-white transition-all" />
                </button>
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Search className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Buscador de Bookings</h2>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">Seleccione un booking</p>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <Input
                    placeholder="Escriba el N\u00b0 del Booking..."
                    className="pl-12 h-14 bg-white/10 border-white/10 text-white rounded-2xl focus:bg-white/20 transition-all font-bold"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto p-6 space-y-3 bg-white lc-scroll">
                {isLoadingBookings ? (
                  <div className="p-10 text-center animate-pulse font-black uppercase text-[10px] text-slate-400">Cargando...</div>
                ) : (
                  (() => {
                    const filtered = bookingsReal.filter(b => (b.BOOKING || b.booking || "").toLowerCase().includes(searchTerm.toLowerCase()));
                    if (filtered.length === 0) {
                      return (
                        <div className="py-20 text-center opacity-30 animate-in fade-in zoom-in duration-300">
                          <Inbox className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                          <p className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-500">No se encontraron resultados</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Intente con otro n\u00famero de booking</p>
                        </div>
                      );
                    }
                    return filtered.map((b) => {
                      const bookingId = b.BOOKING || b.booking;
                      const emitted = isAlreadyEmitted(bookingId);
                      return (
                        <button
                          key={b.ID || b.id || bookingId}
                          onClick={() => handleBookingSelect(b)}
                          className="w-full p-4 rounded-2xl border border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/10 transition-all flex items-center justify-between group text-left shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{bookingId}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[9px] font-bold text-slate-400 uppercase">{b.NAVE || "NAVE PENDIENTE"}</p>
                                <span className="text-slate-200">\u2022</span>
                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">{b.CULTIVO || "CULTIVO N/A"}</p>
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary" className={cn("text-[9px] font-black border-none uppercase px-3 py-1", emitted ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600")}>
                            {emitted ? "EMITIDO" : "PENDIENTE"}
                          </Badge>
                        </button>
                      );
                    });
                  })()
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAnularDialogOpen} onOpenChange={setIsAnularDialogOpen}>
            <DialogContent className="sm:max-w-[420px] p-6 rounded-[2.5rem] bg-white border-none shadow-2xl overflow-hidden">
                {!showSuccessAnular ? (
                  <div className="text-center space-y-4">
                    <div className="h-14 w-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                      {isAnulando ? <Loader2 className="h-7 w-7 animate-spin" /> : <AlertTriangle className="h-7 w-7" />}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                        {isAnulando ? "Procesando..." : "\u00bfConfirmar Anulaci\u00f3n?"}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-tight px-4">
                        Esta acci\u00f3n marcar\u00e1 el documento como inv\u00e1lido.
                      </p>
                    </div>

                    {!isAnulando && (
                      <div className="space-y-3 text-left pt-2">
                        <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Seleccione el Motivo</Label>
                        <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1 lc-scroll">
                          {[
                            { id: "CAMBIO DE BOOKING", icon: RefreshCw, color: "text-blue-500", bg: "bg-blue-50" },
                            { id: "ERROR EN DATOS", icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" },
                            { id: "CAMBIO DE NAVE", icon: Ship, color: "text-indigo-500", bg: "bg-indigo-50" },
                            { id: "DUPLICADO", icon: Copy, color: "text-purple-500", bg: "bg-purple-50" },
                            { id: "RE-EMISI\u00d3N", icon: FileText, color: "text-emerald-500", bg: "bg-emerald-50" },
                            { id: "OTRO", icon: MessageSquare, color: "text-slate-500", bg: "bg-slate-50" }
                          ].map((motivo) => (
                            <button
                              key={motivo.id}
                              onClick={() => setMotivoAnulacion(motivo.id)}
                              className={cn(
                                "w-full flex items-center p-2.5 rounded-xl border-2 transition-all gap-3 group text-left",
                                motivoAnulacion === motivo.id 
                                  ? "border-red-500 bg-red-50/20" 
                                  : "border-slate-50 bg-white hover:border-slate-200 hover:bg-slate-50"
                              )}
                            >
                              <div className={cn("h-8 w-8 shrink-0 rounded-lg flex items-center justify-center", motivo.bg, motivo.color)}>
                                <motivo.icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <span className={cn("text-[9px] font-black uppercase tracking-tight", motivoAnulacion === motivo.id ? "text-red-600" : "text-slate-700")}>
                                  {motivo.id}
                                </span>
                              </div>
                              <div className={cn(
                                "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all",
                                motivoAnulacion === motivo.id ? "border-red-500 bg-red-500" : "border-slate-200"
                              )}>
                                {motivoAnulacion === motivo.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                              </div>
                            </button>
                          ))}
                        </div>
                        
                        {motivoAnulacion.includes("OTRO") && (
                          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center justify-between ml-1">
                              <Label className="text-[9px] font-black uppercase text-slate-400">Especifique el motivo</Label>
                              <span className="text-[8px] font-bold text-slate-300 uppercase" />
                            </div>
                            <Input 
                              placeholder="Especifique el motivo..."
                              maxLength={100}
                              className="h-10 rounded-xl border-slate-100 font-bold text-[10px] focus:ring-red-500/20 focus:border-red-500 transition-all shadow-sm"
                              onChange={(e) => setMotivoAnulacion("OTRO: " + e.target.value.toUpperCase())}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col gap-2 pt-2">
                      <Button 
                        onClick={confirmAnular} 
                        disabled={isAnulando}
                        className="h-12 rounded-2xl bg-red-500 hover:bg-red-600 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 disabled:opacity-50"
                      >
                        {isAnulando ? "ANULANDO..." : "S\u00cd, ANULAR DOCUMENTO"}
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => setIsAnularDialogOpen(false)} 
                        disabled={isAnulando}
                        className="h-10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
                      >
                        CANCELAR
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-6 animate-in zoom-in duration-500">
                    <div className="h-24 w-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle2 className="h-12 w-12 animate-bounce" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">\u00a1Anulaci\u00f3n Exitosa!</h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">El historial ha sido actualizado</p>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

          <section className="flex-1 overflow-y-auto p-10 pt-2 space-y-6 lc-scroll bg-slate-50/30">
            <div className="bg-emerald-950 rounded-[3.5rem] p-8 text-white flex items-center justify-between shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <FileText className="h-40 w-40 rotate-12" />
              </div>
              <div className="space-y-2 relative z-10">
                <h1 className="text-4xl font-black tracking-tighter uppercase font-['Outfit']">
                  Instrucciones de <span className="text-emerald-400">Embarque</span>
                </h1>
                <p className="text-[11px] font-black text-emerald-500/60 uppercase tracking-[0.4em]">Generaci\u00f3n de documentaci\u00f3n operativa</p>
              </div>
              <div className="flex items-center gap-6 relative z-10">
                {selectedBooking && (
                  <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-4 cursor-pointer hover:bg-white/20 transition-all" onClick={() => setIsSelectorOpen(true)}>
                    <div className="text-left">
                      <span className="block text-[8px] font-black uppercase text-emerald-400">Booking</span>
                      <span className="block text-sm font-black uppercase">{selectedBooking.booking || selectedBooking.BOOKING}</span>
                    </div>
                    <Search className="h-4 w-4 text-emerald-400" />
                  </div>
                )}
                <div className="h-14 w-px bg-white/10 mx-2" />
                <div className="text-right">
                  <span className="block text-[10px] font-black uppercase text-emerald-400/80">Estado</span>
                  <span className="block text-sm font-black uppercase">M\u00f3dulo Activo</span>
                </div>
              </div>
            </div>

            <Tabs defaultValue="generar" className="w-full">
              <div className="flex justify-center mb-6">
                <TabsList className="bg-white border border-slate-100 p-1 rounded-2xl h-14 shadow-sm">
                  <TabsTrigger value="generar" className="px-8 rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Generaci\u00f3n
                  </TabsTrigger>
                  <TabsTrigger value="avanzada" className="px-8 rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest">
                    <FileEdit className="h-4 w-4 mr-2" />
                    Edici\u00f3n Avanzada
                  </TabsTrigger>
                  <TabsTrigger value="historial" className="px-8 rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest">
                    <History className="h-4 w-4 mr-2" />
                    Historial
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="generar" className="space-y-10 focus-visible:outline-none">
                {!selectedBooking ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-20 text-center animate-in fade-in zoom-in duration-500">
                    <div className="h-40 w-40 bg-white rounded-[3rem] shadow-2xl flex items-center justify-center mb-10">
                      <Zap className="h-20 w-20 text-emerald-500 animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase mb-4">\u00a1Listo para comenzar!</h2>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mb-10 max-w-sm">Seleccione un despacho maestro para generar su instrucci\u00f3n de embarque.</p>
                    <Button onClick={() => setIsSelectorOpen(true)} className="h-16 px-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 group">
                      <Search className="h-5 w-5 mr-3" />
                      Seleccionar Booking
                      <ArrowRight className="h-4 w-4 ml-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                ) : (
                  <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-12 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                          <LayoutDashboard className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase">Resumen del Despacho</h3>
                      </div>
                      {lookupData?.emision_activa && (
                        <Badge className="bg-amber-100 text-amber-700 border-none px-6 py-2 rounded-full font-black uppercase text-[10px] flex items-center gap-2">
                          <AlertCircle className="h-3 w-3" />
                          Este booking ya tiene una IE activa
                        </Badge>
                      )}
                    </div>
                    <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                          { label: "Booking ID", val: lookupData?.booking || selectedBooking?.booking || selectedBooking?.BOOKING || "N/A", icon: Inbox },
                          { label: "Cliente", val: lookupData?.cliente_nombre || selectedBooking?.cliente || "SELECCIONE...", icon: RefreshCw },
                          { label: "Orden Beta", val: lookupData?.orden_beta || "PENDIENTE", icon: ShieldCheck },
                          { label: "PO / Orden Compra", val: (lookupData?.maestro?.po || lookupData?.po) === "0" || !(lookupData?.maestro?.po || lookupData?.po) ? "-" : (lookupData?.maestro?.po || lookupData?.po), icon: FileText },
                          { label: "Cultivo", val: lookupData?.cultivo || selectedBooking?.cultivo || "PENDIENTE", icon: Zap },
                          { label: "Notify", val: lookupData?.maestro?.notify_bl || "SAME AS CONSIGNEE", icon: Bell }
                        ].map((f, i) => (
                          <div key={i} className="flex items-start gap-5 p-4 rounded-3xl bg-white/50 hover:bg-white transition-all shadow-sm">
                            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-600">
                              <f.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase text-slate-400">{f.label}</span>
                              <p className="text-sm font-black uppercase text-slate-900">{f.val}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-8 bg-emerald-50/30 rounded-[2.5rem] border border-emerald-100/50">
                      <div className="flex items-center gap-5">
                        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm", emisionSWB ? "bg-emerald-500 text-white" : "bg-white text-slate-400")}>
                          <Globe className="h-6 w-6" />
                        </div>
                        <div>
                          <Label htmlFor="swb-toggle" className="text-sm font-black uppercase text-slate-900">Emisi\u00f3n de SWB</Label>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{emisionSWB ? "Sea Waybill" : "Emisi\u00f3n en origen"}</p>
                        </div>
                      </div>
                      <Switch id="swb-toggle" checked={emisionSWB} onCheckedChange={setEmisionSWB} className="data-[state=checked]:bg-emerald-500 scale-125" />
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Observaciones</label>
                      <Textarea
                        placeholder="Notas adicionales..."
                        className="rounded-[2.5rem] border-slate-100 bg-white p-8 min-h-[160px] text-sm focus:border-emerald-500 transition-all lc-scroll"
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                      />
                      <Button 
                        onClick={() => handleGeneratePdf(false)} 
                        disabled={isGeneratingPdf || !selectedBooking || lookupData?.emision_activa} 
                        className={cn(
                          "h-16 px-10 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl group transition-all",
                          lookupData?.emision_activa ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-black text-white"
                        )}
                      >
                        {isGeneratingPdf ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : <FileText className="h-5 w-5 mr-3" />}
                        {lookupData?.emision_activa ? "Emisi\u00f3n Bloqueada" : isGeneratingPdf ? "Generando..." : "Generar IE"}
                        {!isGeneratingPdf && !lookupData?.emision_activa && <ArrowRight className="h-4 w-4 ml-4 group-hover:translate-x-1 transition-transform" />}
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="avanzada" className="space-y-8 focus-visible:outline-none">
                <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-12 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                        <Edit3 className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-slate-900 uppercase">Edici\u00f3n de Contingencia</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sobreescriba cualquier dato manualmente</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      {lookupData?.emision_activa && (
                        <Badge className="bg-amber-100 text-amber-700 border-none px-4 py-2 rounded-full font-black uppercase text-[9px] tracking-widest flex gap-2 items-center">
                          <AlertTriangle className="h-3 w-3" />
                          YA EMITIDO
                        </Badge>
                      )}
                      <Badge className="bg-emerald-100 text-emerald-700 border-none px-4 py-2 rounded-full font-black uppercase text-[9px] tracking-widest">
                        Modo Edici\u00f3n Forzada
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* SECCI\u00d3N 1: LOG\u00cdSTICA */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Ship className="h-4 w-4 text-emerald-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Log\u00edstica y Transporte</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase ml-2">Booking ID</Label>
                          <Input value={overrideData.booking} onChange={(e) => handleOverrideChange('booking', e.target.value)} className="rounded-xl border-slate-100 font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase ml-2">Orden Beta</Label>
                          <Input value={overrideData.orden_beta} onChange={(e) => handleOverrideChange('orden_beta', e.target.value)} className="rounded-xl border-slate-100 font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase ml-2">Motonave</Label>
                          <Input value={overrideData.motonave} onChange={(e) => handleOverrideChange('motonave', e.target.value)} className="rounded-xl border-slate-100 font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase ml-2">Naviera</Label>
                          <Input value={overrideData.naviera} onChange={(e) => handleOverrideChange('naviera', e.target.value)} className="rounded-xl border-slate-100 font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase ml-2">Puerto Carga</Label>
                          <Input value={overrideData.puerto_embarque} onChange={(e) => handleOverrideChange('puerto_embarque', e.target.value)} className="rounded-xl border-slate-100 font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase ml-2">Puerto Destino</Label>
                          <Input value={overrideData.puerto_destino} onChange={(e) => handleOverrideChange('puerto_destino', e.target.value)} className="rounded-xl border-slate-100 font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase ml-2">ETA (Llegada)</Label>
                          <Input value={overrideData.eta} onChange={(e) => handleOverrideChange('eta', e.target.value)} className="rounded-xl border-slate-100 font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase ml-2">Freight (Flete)</Label>
                          <Input value={overrideData.freight} onChange={(e) => handleOverrideChange('freight', e.target.value)} className="rounded-xl border-slate-100 font-bold" placeholder="Ej: PREPAID BY..." />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase ml-2">Cultivo</Label>
                          <Input value={overrideData.cultivo} onChange={(e) => handleOverrideChange('cultivo', e.target.value)} className="rounded-xl border-slate-100 font-bold" placeholder="Ej: PALTA, ARANDANO..." />
                        </div>
                      </div>
                    </div>

                    {/* SECCI\u00d3N 2: DOCUMENTACI\u00d3N */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <FileText className="h-4 w-4 text-emerald-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Partes del BL y Referencias</h4>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase ml-2">PO / Orden Compra</Label>
                            <Input value={overrideData.po} onChange={(e) => handleOverrideChange('po', e.target.value)} className="rounded-xl border-slate-100 font-bold" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase ml-2">Valor FOB Aprox.</Label>
                            <Input value={overrideData.fob} onChange={(e) => handleOverrideChange('fob', e.target.value)} className="rounded-xl border-slate-100 font-bold" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase ml-2">Consignatario (Nombre BL)</Label>
                          <Input value={overrideData.consignatario_bl} onChange={(e) => handleOverrideChange('consignatario_bl', e.target.value)} className="rounded-xl border-slate-100 font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase ml-2">EORI Consignatario</Label>
                          <Input value={overrideData.eori_consignatario} onChange={(e) => handleOverrideChange('eori_consignatario', e.target.value)} className="rounded-xl border-slate-100 font-bold" placeholder="EORI N\u00b0..." />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase ml-2">Direcci\u00f3n Consignatario</Label>
                          <Textarea value={overrideData.direccion_consignatario} onChange={(e) => handleOverrideChange('direccion_consignatario', e.target.value)} className="rounded-xl border-slate-100 min-h-[60px]" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase ml-2">Notify Party</Label>
                            <Input value={overrideData.notify_bl} onChange={(e) => handleOverrideChange('notify_bl', e.target.value)} className="rounded-xl border-slate-100 font-bold" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase ml-2">EORI Notify</Label>
                            <Input value={overrideData.eori_notify} onChange={(e) => handleOverrideChange('eori_notify', e.target.value)} className="rounded-xl border-slate-100 font-bold" placeholder="EORI N\u00b0..." />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase ml-2">Direcci\u00f3n Notify</Label>
                          <Textarea value={overrideData.direccion_notify} onChange={(e) => handleOverrideChange('direccion_notify', e.target.value)} className="rounded-xl border-slate-100 min-h-[60px]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8">
                    {/* SECCI\u00d3N 3: DETALLES DE CARGA */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Zap className="h-4 w-4 text-emerald-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detalles de Carga y Pesos</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase ml-2">N\u00b0 Cajas</Label>
                          <Input value={overrideData.cajas} type="number" onChange={(e) => handleOverrideChange('cajas', parseInt(e.target.value))} className="rounded-xl border-slate-100 font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase ml-2">N\u00b0 Pallets</Label>
                          <Input value={overrideData.pallets} type="number" onChange={(e) => handleOverrideChange('pallets', parseInt(e.target.value))} className="rounded-xl border-slate-100 font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase ml-2">Peso Neto</Label>
                          <Input value={overrideData.peso_neto} onChange={(e) => handleOverrideChange('peso_neto', e.target.value)} className="rounded-xl border-slate-100 font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase ml-2">Peso Bruto</Label>
                          <Input value={overrideData.peso_bruto} onChange={(e) => handleOverrideChange('peso_bruto', e.target.value)} className="rounded-xl border-slate-100 font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase ml-2">Presentaci\u00f3n</Label>
                          <Input value={overrideData.presentacion} onChange={(e) => handleOverrideChange('presentacion', e.target.value)} className="rounded-xl border-slate-100 font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase ml-2">Etiquetas</Label>
                          <Input value={overrideData.etiquetas} onChange={(e) => handleOverrideChange('etiquetas', e.target.value)} className="rounded-xl border-slate-100 font-bold" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase ml-2 text-slate-400">Vista Previa Descripci\u00f3n BL (EN)</Label>
                        <Textarea 
                          value={overrideData.desc_en} 
                          readOnly 
                          className="rounded-xl border-slate-100 bg-slate-50/50 min-h-[60px] text-slate-500 cursor-not-allowed border-dashed" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase ml-2 text-slate-400">Vista Previa Descripci\u00f3n BL (ES)</Label>
                        <Textarea 
                          value={overrideData.desc_es} 
                          readOnly 
                          className="rounded-xl border-slate-100 bg-slate-50/50 min-h-[60px] text-slate-500 cursor-not-allowed border-dashed" 
                        />
                      </div>
                    </div>

                    {/* SECCI\u00d3N 4: FITOSANITARIO */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Datos Fitosanitarios</h4>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase ml-2">Consignatario Fito</Label>
                          <Input value={overrideData.consignatario_fito} onChange={(e) => handleOverrideChange('consignatario_fito', e.target.value)} className="rounded-xl border-slate-100 font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase ml-2">Direcci\u00f3n Fito</Label>
                          <Textarea value={overrideData.direccion_fito} onChange={(e) => handleOverrideChange('direccion_fito', e.target.value)} className="rounded-xl border-slate-100 min-h-[80px]" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase ml-2">Pa\u00eds Destino</Label>
                            <Input value={overrideData.pais_destino} onChange={(e) => handleOverrideChange('pais_destino', e.target.value)} className="rounded-xl border-slate-100 font-bold" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase ml-2">Variedad</Label>
                            <Input value={overrideData.variedad} onChange={(e) => handleOverrideChange('variedad', e.target.value)} className="rounded-xl border-slate-100 font-bold" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase italic">Nota: Los cambios realizados aqu\u00ed solo afectan al PDF actual.</p>
                    <Button 
                      onClick={() => handleGeneratePdf(true)} 
                      disabled={isGeneratingPdf || lookupData?.emision_activa} 
                      className={cn(
                        "h-16 px-10 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all group",
                        lookupData?.emision_activa ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                      )}
                    >
                      {isGeneratingPdf ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : <Save className="h-5 w-5 mr-3" />}
                      {lookupData?.emision_activa ? "Emisi\u00f3n Bloqueada" : isGeneratingPdf ? "Generando..." : "Generar con Cambios Manuales"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="historial" className="space-y-6 focus-visible:outline-none">
                <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden p-8">
                  <div className="flex items-center justify-between p-6 border-b border-slate-50">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center">
                        <Clock className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-slate-900 uppercase leading-none">Historial de Emisiones</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {filteredHistory.length} Registros encontrados
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="relative w-full md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          placeholder="Buscar por Booking u Orden..." 
                          value={searchTermHistorial}
                          onChange={(e) => setSearchTermHistorial(e.target.value)}
                          className="pl-11 h-12 bg-slate-50 border-slate-100 rounded-2xl text-xs font-bold focus:bg-white transition-all"
                        />
                      </div>
                      <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-100">
                        {(["TODOS", "ACTIVO", "ANULADO"] as const).map((f) => (
                          <button key={f} onClick={() => setFiltroEstado(f)} className={cn("px-5 py-2.5 rounded-[0.85rem] text-[10px] font-black uppercase tracking-widest transition-all", filtroEstado === f ? "bg-white text-slate-950 shadow-lg shadow-slate-200/50" : "text-slate-400 hover:text-slate-600")}>{f}</button>
                        ))}
                      </div>
                      <button onClick={loadHistorial} className="h-12 w-12 rounded-2xl hover:bg-slate-50 border border-slate-100 flex items-center justify-center transition-all group active:scale-95 shadow-sm">
                        <RefreshCw className={cn("h-5 w-5 text-slate-400 group-hover:text-emerald-500 group-hover:rotate-180 transition-all duration-500", isLoadingHistorial && "animate-spin")} />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-6 text-center">Fecha / Hora</TableHead>
                          <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-6 text-center">Usuario</TableHead>
                          <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-6 text-center">Booking</TableHead>
                          <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-6 text-center">Orden Beta</TableHead>
                          <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-6 text-center">Cliente</TableHead>
                          <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-6 text-center">Cultivo</TableHead>
                          <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-6 text-center">Estado</TableHead>
                          <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-6 text-center">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingHistorial ? (
                          <TableRow>
                            <TableCell colSpan={8} className="py-20 text-center animate-pulse font-black uppercase text-[10px] text-slate-400">Cargando historial...</TableCell>
                          </TableRow>
                        ) : paginatedHistory.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="py-20 text-center opacity-30">
                              <Inbox className="h-12 w-12 mx-auto mb-4" />
                              <p className="font-black uppercase tracking-widest text-[10px]">No hay registros con este filtro</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedHistory.map((item) => (
                            <TableRow key={item.id} className={cn("hover:bg-slate-50/50 transition-colors", item.status === "ANULADO" && "bg-slate-50/30")}>
                              <TableCell className="py-6 text-center">
                                <div className="space-y-1">
                                  <p className="text-xs font-black text-slate-900">{item.fecha}</p>
                                  <p className="text-[10px] font-bold text-slate-400">{item.hora}</p>
                                </div>
                              </TableCell>
                              <TableCell className="py-6 text-center">
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-emerald-50 flex items-center justify-center text-[10px] font-black text-emerald-600">
                                      {item.usuario?.charAt(0)}
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-slate-600">{item.usuario}</span>
                                  </div>
                                  {item.status === "ANULADO" && (
                                    <div className="flex flex-col items-center gap-1">
                                       <span className="text-[8px] font-black uppercase text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 whitespace-nowrap">
                                          Anulado por: {item.usuario_anulacion || "SISTEMA"}
                                       </span>
                                       {item.motivo_anulacion && (
                                          <div className="relative group/motivo">
                                             <span className="text-[9px] font-bold text-slate-400 italic cursor-help hover:text-slate-600 transition-colors truncate max-w-[120px] block text-center">
                                                "{item.motivo_anulacion}"
                                             </span>
                                             <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-3 bg-slate-900 text-white rounded-2xl shadow-2xl opacity-0 group-hover/motivo:opacity-100 transition-all duration-200 pointer-events-none z-[100] scale-95 group-hover/motivo:scale-100 origin-bottom">
                                                <p className="font-black text-rose-400 uppercase tracking-widest text-[8px] mb-1.5 border-b border-white/10 pb-1.5 text-center">Motivo Completo</p>
                                                <p className="font-bold text-[10px] leading-tight text-slate-200 text-center uppercase">
                                                   {item.motivo_anulacion}
                                                </p>
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900" />
                                             </div>
                                          </div>
                                       )}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-6 font-black text-xs uppercase text-slate-900 text-center">{item.booking}</TableCell>
                              <TableCell className="py-6 font-black text-xs uppercase text-emerald-600 text-center">{item.orden_beta}</TableCell>
                              <TableCell className="py-6 font-black text-[10px] uppercase text-slate-500 max-w-[150px] truncate text-center">{item.cliente}</TableCell>
                              <TableCell className="py-6 text-center">
                                <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-100">{item.cultivo}</Badge>
                              </TableCell>
                              <TableCell className="py-6 text-center">
                                <Badge className={cn(
                                  "text-[9px] font-black uppercase border-none shadow-sm px-3 py-1", 
                                  item.status === "ACTIVO" ? "bg-emerald-50 text-emerald-600" : "bg-red-600 text-white"
                                )}>
                                  {item.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-6 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleDownloadHistory(item.id, item.orden_beta)}
                                    disabled={downloadingId === item.id}
                                    className="h-9 w-9 rounded-full text-slate-400 hover:text-emerald-500 hover:bg-emerald-50"
                                  >
                                    {downloadingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                  </Button>
                                  {item.status === "ACTIVO" && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => {
                                        setItemToAnular(item.id);
                                        setIsAnularDialogOpen(true);
                                      }} 
                                      className="h-9 w-9 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginaci\u00f3n AgroFlow Premium */}
                  {totalPages > 1 && (
                    <div className="px-8 py-5 border-t border-slate-50 bg-slate-50/20 flex items-center justify-between font-['Outfit']">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">P\u00e1gina</span>
                          <div className="h-8 px-3 bg-white border border-slate-100 rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-sm font-bold text-emerald-700">{currentPage} <span className="text-slate-300 mx-1">/</span> {totalPages}</span>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                            Mostrando {paginatedHistory.length} de {filteredHistory.length} Instrucciones
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-10 px-4 bg-white border border-slate-100 rounded-xl flex items-center gap-2 text-slate-600 font-bold text-xs hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed group"
                          >
                            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Anterior
                          </button>
                          <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="h-10 px-4 bg-[#022c22] text-white rounded-xl flex items-center gap-2 font-bold text-xs hover:bg-emerald-600 transition-all shadow-md disabled:opacity-30 disabled:cursor-not-allowed group"
                          >
                            Siguiente
                            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </button>
                        </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </main>
    </div>
  );
}
