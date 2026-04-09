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
    const bookingId = b.BOOKING || b.booking || b.id;
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
          booking: bookingId,
          cliente_nombre: b.CLIENTE || b.cliente || "POR DEFINIR",
          cultivo: b.CULTIVO || b.cultivo || "PENDIENTE",
          orden_beta: b.ORDEN_BETA || b.orden_beta || "PENDIENTE",
          warning: "BOOKING_NO_ENCONTRADO_EN_SISTEMA"
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLookup(false);
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

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  },
                  {
                    label: "PO No.",
                    val: lookupData?.po || "NO APLICA",
                    icon: FileText
                  }
                ].map((f, i) => (
                  <div key={i} className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      {f.label}
                    </label>
                    <div 
                      title={f.val}
                      className={cn(
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
              </div>
            </div>



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
