"use client";

import React, { useState } from "react";
import {
  Search,
  FileDown,
  CircleDot,
  Calendar,
  RefreshCw,
  Eye,
  Download,
  Ban,
  X,
  ShieldCheck,
  Zap,
  Inbox,
  LayoutDashboard,
  FileText,
  ChevronRight,
  MoreVertical,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Settings2,
  Lock,
  Edit3,
  Save,
  Truck
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/constants";

// --- Data Real Binding (Eliminado Mocks Carlos Style) ---

export default function InstruccionesEmbarque() {
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [lookupData, setLookupData] = useState<any>(null);
  const [isLoadingLookup, setIsLoadingLookup] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [bookingsReal, setBookingsReal] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  
  // Estados para Modo Admin (Override)
  const [isAdminModeOpen, setIsAdminModeOpen] = useState(false);
  const [overrideForm, setOverrideForm] = useState<any>({
    booking: "",
    orden_beta: "",
    cliente_nombre: "",
    consignatario_bl: "",
    direccion_consignatario: "",
    notify_bl: "",
    direccion_notify: "",
    motonave: "",
    naviera: "",
    puerto_embarque: "CALLAO",
    puerto_destino: "",
    eta: "",
    cultivo: "",
    variedad: "",
    temperatura: "6.0°C",
    ventilacion: "15CBM",
    humedad: "OFF",
    atm: "NO APLICA",
    oxigeno: "NO APLICA",
    co2: "NO APLICA",
    filtros: "NO",
    cold_treatment: "NO",
    cajas: 0,
    pallets: 0,
    peso_neto: "0.000 KG",
    peso_bruto: "0.000 KG",
    fob: "USD 34,560.00",
    consignatario_fito: "",
    direccion_fito: "",
    pais_destino: "",
    presentacion: "CAJA 3.8 KG",
    etiquetas: "GENERICA",
    observaciones: "",
    embarcador: "COMPLEJO AGROINDUSTRIAL BETA S.A.",
    direccion_embarcador: "CAL. LEOPOLDO CARRILLO NRO. 160 ICA - CHINCHA - CHINCHA ALTA – PERU"
  });

  // Carga inicial de bookings desde el Plan Maestro (Posicionamiento)
  React.useEffect(() => {
    const loadBookings = async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/api/v1/sync/posicionamiento/list`);
        if (resp.ok) {
          const data = await resp.json();
          setBookingsReal(data || []);
        }
      } catch (e) {
        console.error("Error cargando Plan Maestro:", e);
      } finally {
        setIsLoadingBookings(false);
      }
    };
    loadBookings();
  }, []);

  const handleGeneratePdf = async () => {
    const bookingId = selectedBooking?.BOOKING || selectedBooking?.booking || selectedBooking?.id;
    if (!bookingId) return;

    setIsGeneratingPdf(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/instrucciones/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking: bookingId,
          observaciones: observaciones
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        
        // Extraer nombre del archivo del header Content-Disposition si existe, priorizando ORDEN BETA
        const disposition = response.headers.get('Content-Disposition');
        let filename = lookupData?.orden_beta ? `IE_${lookupData.orden_beta}.pdf` : `IE_${bookingId}.pdf`;
        
        if (disposition && disposition.indexOf('filename=') !== -1) {
            const matches = /filename="?([^";]+)"?/g.exec(disposition);
            if (matches && matches[1]) {
                filename = matches[1];
            }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        console.error("Error al generar PDF");
      }
    } catch (e) {
      console.error("Fallo de conexión:", e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleBookingSelect = async (b: any) => {
    // b puede ser el objeto del booking real de la lista
    const bookingId = b.booking || b.id;
    setSelectedBooking(b);
    setLookupData(null);
    setIsLoadingLookup(true);

    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/instrucciones/lookup/${bookingId}`);
      if (resp.ok) {
        const data = await resp.json();
        setLookupData(data);
      } else {
        // Si no está en el buscador master todavía, al menos mostramos lo del mock
        setLookupData({
          booking: b.id,
          cliente_nombre: b.cliente,
          cultivo: b.cultivo,
          orden_beta: "PENDIENTE",
          warning: "BOOKING_NO_ENCONTRADO_EN_SISTEMA"
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLookup(false);
    }
  };

  const openAdminEditor = () => {
    // Pre-poblar el formulario con TODO lo que tenemos disponible en el sistema
    setOverrideForm({
      ...overrideForm,
      booking: lookupData?.booking || selectedBooking?.BOOKING || selectedBooking?.id || "",
      orden_beta: lookupData?.orden_beta || selectedBooking?.ORDEN_BETA || "PENDIENTE",
      cliente_nombre: lookupData?.cliente_nombre || selectedBooking?.CLIENTE || "",
      consignatario_bl: lookupData?.maestro?.consignatario_bl || lookupData?.cliente_nombre || "",
      direccion_consignatario: lookupData?.maestro?.direccion_consignatario || "",
      notify_bl: lookupData?.maestro?.notify_bl || "SAME AS CONSIGNEE",
      direccion_notify: lookupData?.maestro?.direccion_notify || "",
      
      // Datos de Logística Precargados
      motonave: selectedBooking?.NAVE || selectedBooking?.nave || "",
      naviera: selectedBooking?.NAVIERA || selectedBooking?.naviera || "",
      puerto_embarque: selectedBooking?.POL || selectedBooking?.pol || "CALLAO",
      puerto_destino: lookupData?.maestro?.destino || selectedBooking?.POD || selectedBooking?.pod || "",
      eta: selectedBooking?.ETA || selectedBooking?.eta || "",
      operador_logistico: selectedBooking?.OPERADOR_LOGISTICO || "DP WORLD LOGISTICS S.R.L.",
      
      // Productos
      cultivo: lookupData?.cultivo || selectedBooking?.CULTIVO || "",
      variedad: selectedBooking?.VARIEDAD || "WONDERFUL",
      
      // Fito
      consignatario_fito: lookupData?.maestro?.fitosanitario?.consignatario_fito || "",
      direccion_fito: lookupData?.maestro?.fitosanitario?.direccion_fito || "",
      pais_destino: lookupData?.maestro?.pais || "",
      
      // Flete y Observaciones
      fob: lookupData?.incoterm?.includes("CIF") ? "PREPAID" : "COLLECT",
      observaciones: observaciones
    });
    setIsAdminModeOpen(true);
  };

  const handleGenerateOverridePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/instrucciones/generate-pdf-override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overrideForm),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `IE_CUSTOM_${overrideForm.booking}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        setIsAdminModeOpen(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <AppSidebar className="hidden lg:block shrink-0" />

      <main className="flex-1 flex flex-col min-w-0 h-full">
        <AppHeader />

        <div className="flex-1 flex overflow-hidden">
          {/* PANEL IZQUIERDO: BUSCADOR (350px) */}
          <aside className="w-[400px] border-r border-slate-200 bg-white flex flex-col shrink-0 animate-in slide-in-from-left duration-500">
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase font-['Outfit']">
                  Buscador de <span className="text-emerald-500">Bookings</span>
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Seleccione un despacho maestro</p>
              </div>

              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  placeholder="Buscar por ID o Cliente..."
                  className="pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all h-14 font-bold"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchTerm.length > 5) {
                      handleBookingSelect({ booking: searchTerm.toUpperCase(), id: searchTerm.toUpperCase() });
                    }
                  }}
                />
                {searchTerm.length > 5 && (
                  <button
                    onClick={() => handleBookingSelect({ booking: searchTerm.toUpperCase(), id: searchTerm.toUpperCase() })}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-emerald-500 text-white p-2 rounded-xl hover:bg-emerald-600 transition-all animate-in fade-in"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-4 lc-scroll">
              {isLoadingBookings ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 w-full bg-slate-50 border border-slate-100 rounded-[2.5rem] animate-pulse" />
                ))
              ) : bookingsReal.length === 0 ? (
                <div className="p-10 text-center space-y-4 opacity-30">
                  <Inbox className="h-10 w-10 mx-auto" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No hay bookings pendientes</p>
                </div>
              ) : bookingsReal.filter(b =>
                (b.BOOKING || b.booking || "").toLowerCase().includes(searchTerm.toLowerCase())
              ).map((b) => {
                const bId = b.BOOKING || b.booking || "";
                return (
                  <button
                    key={b.ID || b.id || bId}
                    onClick={() => handleBookingSelect({ booking: bId, ID: b.ID || b.id, id: b.ID || b.id, CULTIVO: b.CULTIVO })}
                    className={cn(
                      "w-full p-6 rounded-[2.5rem] border-2 text-left transition-all duration-300 group relative overflow-hidden",
                      (selectedBooking?.booking || selectedBooking?.BOOKING || selectedBooking?.id) === bId
                        ? "border-emerald-500 bg-emerald-50/10 shadow-xl shadow-emerald-500/10"
                        : "border-slate-50 bg-white hover:border-slate-200 shadow-sm"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            (selectedBooking?.booking || selectedBooking?.BOOKING || selectedBooking?.id) === bId ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                          )} />
                          <span className="text-xs font-black text-slate-950 uppercase tracking-widest">{bId}</span>
                        </div>
                        <h4 className="text-[10px] font-black text-emerald-600/60 uppercase tracking-tighter truncate max-w-[220px]">
                          NAVE: {b.NAVE || "POR DEFINIR"}
                        </h4>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-tighter px-3 h-6 border-none">
                          {b.CULTIVO}
                        </Badge>
                      </div>
                      <ChevronRight className={cn(
                        "h-5 w-5 transition-transform duration-300",
                        (selectedBooking?.booking || selectedBooking?.BOOKING || selectedBooking?.id) === bId ? "text-emerald-500 translate-x-1" : "text-slate-200"
                      )} />
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>

          {/* PANEL DERECHO: FORMULARIO Y TABLA */}
          <section className="flex-1 overflow-y-auto p-12 space-y-10 lc-scroll bg-slate-50/30">
            {/* Cabecera Dinámica */}
            <div className="bg-emerald-950 rounded-[3.5rem] p-10 text-white flex items-center justify-between shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <FileText className="h-40 w-40 rotate-12" />
              </div>

              <div className="space-y-2 relative z-10">
                <h1 className="text-4xl font-black tracking-tighter uppercase font-['Outfit']">
                  Instrucciones de <span className="text-emerald-400">Embarque</span>
                </h1>
                <p className="text-[11px] font-black text-emerald-500/60 uppercase tracking-[0.4em]">Generación de documentación operativa para transporte</p>
              </div>

              <div className="flex items-center gap-4 relative z-10">
                <div className="h-14 w-0.5 bg-white/10 mx-4" />
                <div className="text-right">
                  <span className="block text-[10px] font-black uppercase text-emerald-400/80 tracking-widest">Estado</span>
                  <span className="block text-sm font-black uppercase tracking-tight">Módulo Activo</span>
                </div>
              </div>
            </div>

            {/* Formulario de Emisión */}
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-12 space-y-10 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <LayoutDashboard className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Resumen del Despacho</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Complete los datos de instrucción</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  {
                    label: "Booking",
                    val: lookupData?.booking || selectedBooking?.booking || selectedBooking?.id || "N/A",
                    icon: Inbox
                  },
                  {
                    label: "Cliente",
                    val: lookupData?.maestro?.nombre_legal || lookupData?.cliente_nombre || selectedBooking?.cliente || "SELECCIONE...",
                    icon: RefreshCw,
                    isWarning: lookupData?.warning === "CLIENTE_NO_MAESTRO"
                  },
                  {
                    label: "Orden Beta",
                    val: lookupData?.orden_beta || "PENDIENTE",
                    icon: ShieldCheck
                  },
                  {
                    label: "Cultivo",
                    val: lookupData?.cultivo || selectedBooking?.cultivo || "PENDIENTE",
                    icon: Zap
                  }
                ].map((f, i) => (
                  <div key={i} className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      {f.label}
                    </label>
                    <div className={cn(
                      "bg-slate-50/80 border rounded-2xl h-14 px-5 flex items-center gap-3 transition-all overflow-hidden relative group",
                      f.isWarning ? "border-rose-500 bg-rose-50/30 ring-4 ring-rose-500/5" : "border-slate-100 opacity-80"
                    )}>
                      {isLoadingLookup && i === 0 ? (
                        <Loader2 className="h-4 w-4 text-emerald-500 animate-spin" />
                      ) : (
                        <f.icon className={cn("h-4 w-4 shrink-0 transition-colors", f.isWarning ? "text-rose-500" : "text-slate-300")} />
                      )}

                      <span className={cn(
                        "text-xs font-black uppercase truncate",
                        f.isWarning ? "text-rose-600" : "text-slate-950"
                      )}>
                        {f.val}
                      </span>

                      {f.isWarning && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <AlertTriangle className="h-4 w-4 text-rose-500 animate-pulse" />
                        </div>
                      )}
                    </div>
                    {f.isWarning && (
                      <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1 animate-in fade-in slide-in-from-top-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        EL CLIENTE NO EXISTE EN MAESTROS
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Observaciones / Notas Adicionales</label>
                <Textarea
                  placeholder="Escribe alguna observación técnica o comercial para la IE..."
                  className="rounded-[2.5rem] border-slate-100 bg-white p-8 min-h-[160px] text-sm focus:border-emerald-500 transition-all lc-scroll"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
                <Button 
                  onClick={handleGeneratePdf}
                  disabled={isGeneratingPdf || !selectedBooking}
                  className="h-16 px-10 rounded-full bg-slate-900 hover:bg-black text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/40 group relative overflow-hidden flex items-center"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="h-5 w-5 mr-3 animate-spin text-emerald-500" />
                  ) : (
                    <FileText className="h-5 w-5 mr-3 group-hover:rotate-12 transition-transform" />
                  )}
                  {isGeneratingPdf ? "Generando..." : "Generar IE"}
                  {!isGeneratingPdf && <ArrowRight className="h-4 w-4 ml-4 group-hover:translate-x-1 transition-transform" />}
                </Button>

                {/* BOTÓN ADMIN EXCLUSIVO 💎 */}
                <Button 
                  onClick={openAdminEditor}
                  disabled={!selectedBooking}
                  variant="outline"
                  className="h-16 px-10 rounded-full border-2 border-slate-900 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all flex items-center gap-3"
                >
                  <Settings2 className="h-5 w-5 text-emerald-500" />
                  Modo Admin (Editar Todo)
                  <Lock className="h-3 w-3 opacity-30" />
                </Button>
              </div>
            </div>

            {/* MODAL EDITOR MAESTRO ADMIN 💎 */}
            <Dialog open={isAdminModeOpen} onOpenChange={setIsAdminModeOpen}>
              <DialogContent className="max-w-[95vw] w-[1300px] h-[92vh] p-0 overflow-hidden bg-slate-50 border-none rounded-[3rem] shadow-2xl flex flex-col">
                <div className="flex h-full overflow-hidden">
                  {/* Sidebar Modal */}
                  <div className="w-80 bg-emerald-950 p-12 text-white flex flex-col justify-between shrink-0 relative overflow-hidden">
                    <div className="absolute top-[-10%] right-[-20%] opacity-20 rotate-12">
                      <ShieldCheck className="h-64 w-64 text-emerald-500" />
                    </div>
                    
                    <div className="space-y-8 relative z-10">
                      <div className="h-20 w-20 bg-emerald-500/20 rounded-[2rem] flex items-center justify-center border border-emerald-500/30 backdrop-blur-xl">
                        <Settings2 className="h-10 w-10 text-emerald-400" />
                      </div>
                      <div className="space-y-3">
                        <h2 className="text-3xl font-black uppercase tracking-tighter leading-none font-['Outfit']">
                          Editor <br/><span className="text-emerald-400 text-4xl">Maestro</span>
                        </h2>
                        <p className="text-[10px] font-black text-emerald-500/50 uppercase tracking-[0.3em]">Ambiente de sobreescritura</p>
                      </div>
                      <div className="pt-12 space-y-5">
                        <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest opacity-70 group cursor-default">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" /> Formulario Vivo
                        </div>
                        <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest opacity-70 group cursor-default">
                          <div className="h-2 w-2 rounded-full bg-emerald-500/30" /> Inyección de Datos
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-sm">
                      <p className="text-[11px] font-medium text-emerald-100/60 leading-relaxed italic">
                        "Cualquier cambio aquí sobreescribirá la data del Plan Maestro solo para este PDF."
                      </p>
                    </div>
                  </div>

                  {/* Formulario con Scroll Corregido */}
                  <div className="flex-1 flex flex-col bg-white overflow-hidden">
                    <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                      <div>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight text-slate-900 font-['Outfit']">Configuración Manual de IE</DialogTitle>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Ajuste de imprevistos para impresión</p>
                      </div>
                      {/* Eliminamos el botón manual para dejar solo el del DialogContent que sale en la esquina */}
                    </div>

                    <ScrollArea className="flex-1 p-12 bg-slate-50/50 overflow-y-auto">
                      <div className="max-w-5xl mx-auto space-y-16 pb-20">
                        {/* SECCION 0: EMBARCADOR */}
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                           <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                              <ShieldCheck className="h-5 w-5" />
                            </div>
                            <h4 className="text-base font-black uppercase tracking-[0.2em] text-slate-900 font-['Outfit']">Datos Legales del Embarcador</h4>
                          </div>
                          <div className="grid grid-cols-1 gap-6 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Nombre del Embarcador (Empresa)</label>
                              <Input className="h-14 rounded-2xl font-bold border-slate-100 bg-slate-50/50 focus:bg-white focus:border-emerald-500 transition-all" value={overrideForm.embarcador} onChange={(e) => setOverrideForm({...overrideForm, embarcador: e.target.value})} />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Dirección Legal</label>
                              <Input className="h-14 rounded-2xl font-bold border-slate-100 bg-slate-50/50 focus:bg-white focus:border-emerald-500 transition-all" value={overrideForm.direccion_embarcador} onChange={(e) => setOverrideForm({...overrideForm, direccion_embarcador: e.target.value})} />
                            </div>
                          </div>
                        </div>

                        {/* SECCION 1: EMBARQUE Y LOGISTICA */}
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                              <Truck className="h-5 w-5" />
                            </div>
                            <h4 className="text-base font-black uppercase tracking-[0.2em] text-slate-900 font-['Outfit']">Logística y Travesía Real</h4>
                          </div>
                          
                          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
                            {/* FILA 1: Identificación y Flete */}
                            <div className="grid grid-cols-3 gap-8">
                              <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Cód. Booking</label>
                                <Input className="h-14 rounded-2xl font-bold bg-slate-50 border-none" value={overrideForm.booking} onChange={(e) => setOverrideForm({...overrideForm, booking: e.target.value})} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Orden Beta</label>
                                <Input className="h-14 rounded-2xl font-bold bg-slate-50 border-none" value={overrideForm.orden_beta} onChange={(e) => setOverrideForm({...overrideForm, orden_beta: e.target.value})} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-emerald-600 ml-1">CONDICIÓN DE FLETE (FREIGHT)</label>
                                <Input 
                                  placeholder="PREPAID / COLLECT"
                                  className="h-14 rounded-2xl font-black bg-emerald-50 border-2 border-emerald-100 text-emerald-700 placeholder:text-emerald-200" 
                                  value={overrideForm.fob} 
                                  onChange={(e) => setOverrideForm({...overrideForm, fob: e.target.value.toUpperCase()})} 
                                />
                                <p className="text-[8px] font-bold text-emerald-500/50 uppercase tracking-widest ml-1 mt-1">Escriba PREPAID o COLLECT</p>
                              </div>
                            </div>

                            {/* FILA 2: Travesía */}
                            <div className="grid grid-cols-4 gap-6">
                              <div className="col-span-2 space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Nave / Embarcación y Naviera</label>
                                <div className="flex gap-3">
                                  <Input placeholder="Nave" className="h-12 rounded-xl font-bold bg-slate-50 border-none flex-1" value={overrideForm.motonave} onChange={(e) => setOverrideForm({...overrideForm, motonave: e.target.value})} />
                                  <Input placeholder="Naviera" className="h-12 rounded-xl font-bold bg-slate-50 border-none flex-1" value={overrideForm.naviera} onChange={(e) => setOverrideForm({...overrideForm, naviera: e.target.value})} />
                                </div>
                              </div>
                              <div className="col-span-2 space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">POL (Origen) / POD (Destino) / ETA</label>
                                <div className="flex gap-2">
                                  <Input placeholder="POL" className="h-12 rounded-xl font-bold bg-slate-50 border-none flex-1" value={overrideForm.puerto_embarque} onChange={(e) => setOverrideForm({...overrideForm, puerto_embarque: e.target.value})} />
                                  <Input placeholder="POD" className="h-12 rounded-xl font-bold bg-slate-50 border-none flex-1" value={overrideForm.puerto_destino} onChange={(e) => setOverrideForm({...overrideForm, puerto_destino: e.target.value})} />
                                  <Input placeholder="ETA" className="h-12 rounded-xl font-bold bg-slate-50 border-none flex-1" value={overrideForm.eta} onChange={(e) => setOverrideForm({...overrideForm, eta: e.target.value})} />
                                </div>
                              </div>
                            </div>

                            {/* FILA 3: Producto y Operador */}
                            <div className="grid grid-cols-2 gap-8">
                               <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Cultivo y Variedad del Producto</label>
                                <div className="flex gap-3">
                                  <Input placeholder="Cultivo" className="h-14 rounded-2xl font-bold bg-slate-50 border-none flex-1" value={overrideForm.cultivo} onChange={(e) => setOverrideForm({...overrideForm, cultivo: e.target.value})} />
                                  <Input placeholder="Variedad" className="h-14 rounded-2xl font-bold bg-slate-50 border-none flex-1" value={overrideForm.variedad} onChange={(e) => setOverrideForm({...overrideForm, variedad: e.target.value})} />
                                </div>
                              </div>
                               <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Operador Logístico Responsable</label>
                                <Input className="h-14 rounded-2xl font-bold bg-slate-50 border-none" value={overrideForm.operador_logistico} onChange={(e) => setOverrideForm({...overrideForm, operador_logistico: e.target.value})} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* SECCION 2: CONSIGNATARIO */}
                        <div className="space-y-8">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                              <LayoutDashboard className="h-5 w-5" />
                            </div>
                            <h4 className="text-base font-black uppercase tracking-[0.2em] text-slate-900 font-['Outfit']">DATOS BL (Consignatario / Notify)</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-8 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                             <div className="space-y-6">
                               <div className="space-y-2">
                                 <label className="text-[9px] font-black uppercase tracking-widest text-emerald-600 ml-1">Nombre Legal / BL</label>
                                 <Input className="h-14 rounded-2xl font-bold border-emerald-100" value={overrideForm.consignatario_bl} onChange={(e) => setOverrideForm({...overrideForm, consignatario_bl: e.target.value})} />
                               </div>
                               <div className="space-y-2">
                                 <label className="text-[9px] font-black uppercase tracking-widest text-emerald-600 ml-1">Dirección BL</label>
                                 <Textarea className="rounded-2xl font-medium border-emerald-50 min-h-[120px] bg-slate-50/30" value={overrideForm.direccion_consignatario} onChange={(e) => setOverrideForm({...overrideForm, direccion_consignatario: e.target.value})} />
                               </div>
                             </div>
                             <div className="space-y-6">
                               <div className="space-y-2">
                                 <label className="text-[9px] font-black uppercase tracking-widest ml-1 text-slate-400">Notify BL</label>
                                 <Input className="h-14 rounded-2xl font-bold bg-slate-50 border-none" value={overrideForm.notify_bl} onChange={(e) => setOverrideForm({...overrideForm, notify_bl: e.target.value})} />
                               </div>
                               <div className="space-y-2">
                                 <label className="text-[9px] font-black uppercase tracking-widest ml-1 text-slate-400">Dirección Notify</label>
                                 <Textarea className="rounded-2xl font-medium bg-slate-50 border-none min-h-[120px]" value={overrideForm.direccion_notify} onChange={(e) => setOverrideForm({...overrideForm, direccion_notify: e.target.value})} />
                               </div>
                             </div>
                          </div>
                        </div>

                        {/* SECCION 3: PESOS Y CONDICIONES */}
                        <div className="space-y-8">
                           <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                              <Zap className="h-5 w-5" />
                            </div>
                            <h4 className="text-base font-black uppercase tracking-[0.2em] text-slate-900 font-['Outfit']">Carga y Condiciones</h4>
                          </div>
                          
                          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-10">
                            <div className="grid grid-cols-4 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Cajas</label>
                                 <Input type="number" className="h-12 rounded-xl font-bold bg-slate-50 border-none" value={overrideForm.cajas} onChange={(e) => setOverrideForm({...overrideForm, cajas: parseInt(e.target.value)})} />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Pallets</label>
                                 <Input type="number" className="h-12 rounded-xl font-bold bg-slate-50 border-none" value={overrideForm.pallets} onChange={(e) => setOverrideForm({...overrideForm, pallets: parseInt(e.target.value)})} />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Peso Neto</label>
                                 <Input className="h-12 rounded-xl font-bold bg-slate-50 border-none" value={overrideForm.peso_neto} onChange={(e) => setOverrideForm({...overrideForm, peso_neto: e.target.value})} />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Peso Bruto</label>
                                 <Input className="h-12 rounded-xl font-bold bg-slate-50 border-none" value={overrideForm.peso_bruto} onChange={(e) => setOverrideForm({...overrideForm, peso_bruto: e.target.value})} />
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                               {['temperatura', 'ventilacion', 'humedad', 'atm', 'oxigeno', 'co2', 'filtros', 'cold_treatment'].map((field) => (
                                 <div key={field} className="space-y-2">
                                   <label className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 pl-1">{field.replace('_', ' ')}</label>
                                   <Input className="h-10 rounded-lg font-black text-[10px] bg-white border-slate-100 uppercase" value={overrideForm[field]} onChange={(e) => setOverrideForm({...overrideForm, [field]: e.target.value})} />
                                 </div>
                               ))}
                            </div>
                          </div>
                        </div>

                        {/* SECCION 4: FITOSANITARIO */}
                        <div className="space-y-8">
                           <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                              <ShieldCheck className="h-5 w-5" />
                            </div>
                            <h4 className="text-base font-black uppercase tracking-[0.2em] text-slate-900 font-['Outfit']">Especializados (Fito / Otros)</h4>
                          </div>
                          
                          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-10">
                            <div className="grid grid-cols-2 gap-8">
                              <div className="space-y-6">
                                <div className="space-y-2">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Consignatario Fito</label>
                                  <Input className="h-12 rounded-xl font-bold bg-slate-50 border-none" value={overrideForm.consignatario_fito} onChange={(e) => setOverrideForm({...overrideForm, consignatario_fito: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Dirección Fito</label>
                                  <Input className="h-12 rounded-xl font-bold bg-slate-50 border-none" value={overrideForm.direccion_fito} onChange={(e) => setOverrideForm({...overrideForm, direccion_fito: e.target.value})} />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">País Destino</label>
                                  <Input className="h-12 rounded-xl font-bold bg-slate-50 border-none" value={overrideForm.pais_destino} onChange={(e) => setOverrideForm({...overrideForm, pais_destino: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Presentación</label>
                                  <Input className="h-12 rounded-xl font-bold bg-slate-50 border-none" value={overrideForm.presentacion} onChange={(e) => setOverrideForm({...overrideForm, presentacion: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Etiquetas</label>
                                  <Input className="h-12 rounded-xl font-bold bg-slate-50 border-none" value={overrideForm.etiquetas} onChange={(e) => setOverrideForm({...overrideForm, etiquetas: e.target.value})} />
                                </div>
                                 <div className="space-y-2">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">VALOR FOB</label>
                                  <Input className="h-12 rounded-xl font-bold bg-emerald-50 border-emerald-200 text-emerald-700" value={overrideForm.fob} onChange={(e) => setOverrideForm({...overrideForm, fob: e.target.value})} />
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Observaciones Finales</label>
                              <Textarea className="rounded-[2.5rem] font-medium bg-slate-50 border-none min-h-[140px] p-8" value={overrideForm.observaciones} onChange={(e) => setOverrideForm({...overrideForm, observaciones: e.target.value})} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>

                    <DialogFooter className="p-10 border-t border-slate-100 flex items-center justify-between sm:justify-between">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
                           <AlertTriangle className="h-5 w-5" />
                         </div>
                         <div className="space-y-0.5">
                           <p className="text-[10px] font-black uppercase tracking-tight text-slate-900">Modo de Alta Prioridad</p>
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Estos cambios no son permanentes en BD</p>
                         </div>
                      </div>
                      <div className="flex gap-4">
                        <Button variant="ghost" onClick={() => setIsAdminModeOpen(false)} className="h-14 px-8 rounded-full font-black uppercase text-[10px] tracking-widest">
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleGenerateOverridePdf}
                          disabled={isGeneratingPdf}
                          className="h-14 px-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-emerald-500/20"
                        >
                          {isGeneratingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                          Generar IE con Cambios
                        </Button>
                      </div>
                    </DialogFooter>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Historial de Emisión */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 tracking-widest uppercase mb-1">Historial de Emisiones</h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado: Módulo Activo</div>
                </div>
              </div>

              <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="p-8 font-black text-[10px] uppercase tracking-widest border-none">Fecha / Hora</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest border-none">Booking / Orden</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest border-none">Cliente / Cultivo</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest border-none">Estado</TableHead>
                      <TableHead className="text-right pr-12 font-black text-[10px] uppercase tracking-widest border-none">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={5} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-4 text-slate-300 opacity-20 capitalize">
                          <FileText className="h-12 w-12" />
                          <p className="font-black uppercase tracking-widest text-[10px]">Las emisiones reales aparecerán aquí cuando se guarden en el sistema.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
