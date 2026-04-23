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
  ChevronLeft
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // --- Estado para Confirmación de Anulación ---
  const [isAnularDialogOpen, setIsAnularDialogOpen] = useState(false);
  const [itemToAnular, setItemToAnular] = useState<number | null>(null);
  const [isAnulando, setIsAnulando] = useState(false);

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
    temperatura: "0.5 °C",
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
    usuario: user?.usuario || "DQUIROZ"
  });

  useEffect(() => {
    if (user?.usuario) {
      setOverrideData(prev => ({ ...prev, usuario: user.usuario }));
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
    const total = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    
    return { filteredHistory: filtered, totalPages: total, paginatedHistory: paginated };
  }, [historial, filtroEstado, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filtroEstado]);

  const handleGeneratePdf = async (isOverride: boolean = false) => {
    const bookingId = selectedBooking?.BOOKING || selectedBooking?.booking || selectedBooking?.id;
    if (!bookingId && !isOverride) return;

    if (lookupData?.emision_activa) {
      alert("Ya existe una Instrucción activa. Debe anularla en el Historial para generar una nueva.");
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const endpoint = isOverride ? "/api/v1/instrucciones/generate-pdf-override" : "/api/v1/instrucciones/generate-pdf";
      const body = isOverride ? overrideData : {
        booking: bookingId,
        observaciones: observaciones,
        emision_bl: emisionSWB ? "SWB" : "EMISIÓN EN ORIGEN",
        usuario: user?.usuario || "DQUIROZ"
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
      const resp = await fetch(`${API_BASE_URL}/api/v1/instrucciones/anular/${itemToAnular}`, {
        method: "POST"
      });
      if (resp.ok) {
        await loadHistorial();
        if (selectedBooking) await handleBookingSelect(selectedBooking);
        setIsAnularDialogOpen(false);
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
          temperatura: data.temperatura || "0.5 °C",
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
          region_planta: data.region_planta || ""
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLookup(false);
    }
  };

  const handleOverrideChange = (field: string, value: any) => {
    setOverrideData((prev: any) => ({ ...prev, [field]: value }));
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
                    placeholder="Escriba el N° del Booking..."
                    className="pl-12 h-14 bg-white/10 border-white/10 text-white rounded-2xl focus:bg-white/20 transition-all font-bold"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto p-6 space-y-3 bg-white lc-scroll">
                {isLoadingBookings ? (
                  <div className="p-10 text-center animate-pulse">Cargando...</div>
                ) : (
                  bookingsReal.filter(b => (b.BOOKING || b.booking || "").toLowerCase().includes(searchTerm.toLowerCase())).map((b) => {
                    const bookingId = b.BOOKING || b.booking;
                    const emitted = isAlreadyEmitted(bookingId);
                    return (
                      <button
                        key={b.ID || b.id || bookingId}
                        onClick={() => handleBookingSelect(b)}
                        className="w-full p-4 rounded-2xl border border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/10 transition-all flex items-center justify-between group text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-emerald-500">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{bookingId}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{b.NAVE || "NAVE PENDIENTE"}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className={cn("text-[9px] font-black border-none uppercase", emitted ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600")}>
                          {emitted ? "EMITIDO" : "PENDIENTE"}
                        </Badge>
                      </button>
                    );
                  })
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* DIALOG: CONFIRMACIÓN DE ANULACIÓN */}
          <Dialog open={isAnularDialogOpen} onOpenChange={setIsAnularDialogOpen}>
            <DialogContent className="sm:max-w-[400px] p-8 rounded-[2.5rem] bg-white border-none shadow-2xl">
              <div className="text-center space-y-6">
                <div className="h-20 w-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm">
                  {isAnulando ? <Loader2 className="h-10 w-10 animate-spin" /> : <AlertTriangle className="h-10 w-10" />}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    {isAnulando ? "Procesando Anulación..." : "¿Confirmar Anulación?"}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase leading-relaxed px-4">
                    {isAnulando 
                      ? "Espere un momento mientras actualizamos los registros de seguridad." 
                      : "Esta acción marcará el documento como inválido y permitirá generar uno nuevo para este booking."}
                  </p>
                </div>
                <div className="flex flex-col gap-3 pt-4">
                  <Button 
                    onClick={confirmAnular} 
                    disabled={isAnulando}
                    className="h-14 rounded-2xl bg-red-500 hover:bg-red-600 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 disabled:opacity-50"
                  >
                    {isAnulando ? "ANULANDO..." : "SÍ, ANULAR DOCUMENTO"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsAnularDialogOpen(false)} 
                    disabled={isAnulando}
                    className="h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
                  >
                    CANCELAR
                  </Button>
                </div>
              </div>
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
                <p className="text-[11px] font-black text-emerald-500/60 uppercase tracking-[0.4em]">Generación de documentación operativa</p>
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
                  <span className="block text-sm font-black uppercase">Módulo Activo</span>
                </div>
              </div>
            </div>

            <Tabs defaultValue="generar" className="w-full">
              <div className="flex justify-center mb-6">
                <TabsList className="bg-white border border-slate-100 p-1 rounded-2xl h-14 shadow-sm">
                  <TabsTrigger value="generar" className="px-8 rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Generación
                  </TabsTrigger>
                  <TabsTrigger value="avanzada" className="px-8 rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest">
                    <FileEdit className="h-4 w-4 mr-2" />
                    Edición Avanzada
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
                    <h2 className="text-3xl font-black text-slate-900 uppercase mb-4">¡Listo para comenzar!</h2>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mb-10 max-w-sm">Seleccione un despacho maestro para generar su instrucción de embarque.</p>
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
                          <Label htmlFor="swb-toggle" className="text-sm font-black uppercase text-slate-900">Emisión de SWB</Label>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{emisionSWB ? "Sea Waybill" : "Emisión en origen"}</p>
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
                        {lookupData?.emision_activa ? "Emisión Bloqueada" : isGeneratingPdf ? "Generando..." : "Generar IE"}
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
                        <h3 className="text-xl font-black text-slate-900 uppercase">Edición de Contingencia</h3>
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
                        Modo Edición Forzada
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* SECCIÓN 1: LOGÍSTICA */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Ship className="h-4 w-4 text-emerald-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logística y Transporte</h4>
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
                      </div>
                    </div>

                    {/* SECCIÓN 2: DOCUMENTACIÓN */}
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
                          <Input value={overrideData.eori_consignatario} onChange={(e) => handleOverrideChange('eori_consignatario', e.target.value)} className="rounded-xl border-slate-100 font-bold" placeholder="EORI N°..." />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase ml-2">Dirección Consignatario</Label>
                          <Textarea value={overrideData.direccion_consignatario} onChange={(e) => handleOverrideChange('direccion_consignatario', e.target.value)} className="rounded-xl border-slate-100 min-h-[60px]" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase ml-2">Notify Party</Label>
                            <Input value={overrideData.notify_bl} onChange={(e) => handleOverrideChange('notify_bl', e.target.value)} className="rounded-xl border-slate-100 font-bold" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase ml-2">EORI Notify</Label>
                            <Input value={overrideData.eori_notify} onChange={(e) => handleOverrideChange('eori_notify', e.target.value)} className="rounded-xl border-slate-100 font-bold" placeholder="EORI N°..." />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase ml-2">Dirección Notify</Label>
                          <Textarea value={overrideData.direccion_notify} onChange={(e) => handleOverrideChange('direccion_notify', e.target.value)} className="rounded-xl border-slate-100 min-h-[60px]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase italic">Nota: Los cambios realizados aquí solo afectan al PDF actual.</p>
                    <Button 
                      onClick={() => handleGeneratePdf(true)} 
                      disabled={isGeneratingPdf || lookupData?.emision_activa} 
                      className={cn(
                        "h-16 px-10 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all group",
                        lookupData?.emision_activa ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                      )}
                    >
                      {isGeneratingPdf ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : <Save className="h-5 w-5 mr-3" />}
                      {lookupData?.emision_activa ? "Emisión Bloqueada" : isGeneratingPdf ? "Generando..." : "Generar con Cambios Manuales"}
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
                    <div className="flex items-center gap-3">
                      <div className="flex bg-slate-50 p-1 rounded-xl mr-4 border border-slate-100">
                        {(["TODOS", "ACTIVO", "ANULADO"] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => setFiltroEstado(f)}
                            className={cn(
                              "px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all",
                              filtroEstado === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                      <Button variant="ghost" onClick={loadHistorial} className="h-10 w-10 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100">
                        <RefreshCw className={cn("h-4 w-4 text-slate-400", isLoadingHistorial && "animate-spin")} />
                      </Button>
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
                                <div className="flex items-center justify-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-[10px] font-black text-emerald-600">
                                    {item.usuario?.charAt(0)}
                                  </div>
                                  <span className="text-[10px] font-black uppercase text-slate-600">{item.usuario}</span>
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

                  {/* Paginación AgroFlow Premium */}
                  {totalPages > 1 && (
                    <div className="px-8 py-5 border-t border-slate-50 bg-slate-50/20 flex items-center justify-between font-['Outfit']">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Página</span>
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
