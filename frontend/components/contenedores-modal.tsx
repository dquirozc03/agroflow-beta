"use client";

import React, { useState, useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { 
  X, 
  Upload, 
  Loader2, 
  Package, 
  Sparkles, 
  Barcode, 
  FileText,
  Boxes,
  Zap,
  Search,
  ArrowRight,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";

interface ContenedoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingData?: any;
}

export function ContenedoresModal({ isOpen, onClose, onSuccess, editingData }: ContenedoresModalProps) {
  const [formData, setFormData] = useState({
    booking: "",
    dam: "",
    contenedor: ""
  });
  
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDropping, setIsDropping] = useState(false);

  // --- Estados para el Selector de Bookings ---
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [bookingsReal, setBookingsReal] = useState<any[]>([]);
  const [registeredBookings, setRegisteredBookings] = useState<Set<string>>(new Set());
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [bookingSearch, setBookingSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (editingData) {
        setFormData({
          booking: editingData.booking || "",
          dam: editingData.dam || "",
          contenedor: editingData.contenedor || ""
        });
      } else {
        setFormData({
           booking: "",
           dam: "",
           contenedor: ""
        });
      }
      fetchData();
    }
  }, [isOpen, editingData]);

  const fetchData = async () => {
    setIsLoadingBookings(true);
    try {
      // 1. Cargar bookings desde posicionamiento
      const resp = await fetch(`${API_BASE_URL}/api/v1/sync/posicionamiento/list`);
      let bookings = [];
      if (resp.ok) {
        bookings = await resp.json();
        setBookingsReal(bookings || []);
      }

      // 2. Cargar embarques registrados para validación
      const respEmbarques = await fetch(`${API_BASE_URL}/api/v1/maestros/embarques?size=1000`);
      if (respEmbarques.ok) {
        const data = await respEmbarques.json();
        const registered = new Set<string>(data.items.map((item: any) => item.booking));
        setRegisteredBookings(registered);
      }
    } catch (e) {
      console.error("Error al cargar datos:", e);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const getBookingStatus = (bId: string) => {
    // 1. Si es el que está escrito actualmente en el formulario
    if (bId === formData.booking) return "SELECTED";
    
    // 2. Si es el que tenía originalmente este registro (antes de cualquier cambio en esta sesión)
    if (editingData && bId === editingData.booking) return "AVAILABLE";
    
    // 3. Si está en la lista de ya registrados por otros registros
    if (registeredBookings.has(bId)) return "REGISTERED";
    
    return "AVAILABLE";
  };

  const handleSelectBooking = (b: any) => {
    const bId = b.BOOKING || b.booking || b.id;
    const status = getBookingStatus(bId);
    
    if (status === "REGISTERED") return;
    
    setFormData(prev => ({ ...prev, booking: bId }));
    setIsSelectorOpen(false);
  };

  const processOCR = async (file: File) => {
    setIsProcessingOCR(true);
    const apiData = new FormData();
    apiData.append("file", file);

    const ocrPromise = fetch(`${API_BASE_URL}/api/v1/maestros/ocr/embarque`, {
      method: "POST",
      body: apiData
    }).then(async (res) => {
      if (!res.ok) throw new Error("Error en servidor OCR");
      return res.json();
    });

    toast.promise(ocrPromise, {
      loading: "Escaneando Documento (DAM / Contenedor)...",
      success: (result: any) => {
        if (result.data) {
          const { dam, contenedor } = result.data;
          
          if (!dam && !contenedor) {
            return "No se detectaron patrones de DAM o Contenedor";
          }

          setFormData(prev => ({
            ...prev,
            dam: dam || prev.dam,
            contenedor: contenedor || prev.contenedor,
          }));
          
          return "Smart Scan: Datos de embarque extraídos";
        }
        return "No se detectaron datos legibles";
      },
      error: "Error al procesar documento",
      finally: () => setIsProcessingOCR(false)
    });
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (!isOpen || isProcessingOCR) return;
    const item = Array.from(e.clipboardData?.items || []).find(i => i.type.includes("image"));
    if (item) {
      const blob = item.getAsFile();
      if (blob) processOCR(blob);
    }
  }, [isOpen, isProcessingOCR]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDropping(false);
    if (isProcessingOCR) return;

    const file = e.dataTransfer.files[0];
    if (file && (file.type.includes("image") || file.type.includes("pdf"))) {
      processOCR(file);
    } else {
      toast.error("Por favor, arrastra una imagen o PDF válido");
    }
  }, [isProcessingOCR]);

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const url = editingData 
       ? `${API_BASE_URL}/api/v1/maestros/embarques/${editingData.id}`
       : `${API_BASE_URL}/api/v1/maestros/embarques`;
    
    const method = editingData ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsSuccess(true);
        onSuccess();
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
        }, 2000);
      } else {
        const err = await response.json();
        toast.error(err.detail || "Error al guardar");
      }
    } catch (e) {
      toast.error("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Regla de Oro: Sanitización Real-Time
  const cleanContainer = (val: string) => {
    return val.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-[2.5rem] p-8 shadow-2xl z-[110] animate-in zoom-in-95 focus:outline-none overflow-hidden h-fit">
           
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                 <Package className="h-6 w-6" />
              </div>
              <div>
                <Dialog.Title className="text-2xl font-extrabold tracking-tighter text-[#022c22]">
                  {editingData ? "Editar Despacho" : "Nuevo Contenedor / DAM"}
                </Dialog.Title>
                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em]">Logística de Exportación Agroflow</p>
              </div>
            </div>
            <Dialog.Close className="h-10 w-10 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-300 transition-all hover:rotate-90">
               <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="relative">
            {isSuccess && (
              <div className="absolute inset-0 bg-white z-[150] flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-300 rounded-3xl">
                <div className="h-24 w-24 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center shadow-sm">
                  <Zap className="h-12 w-12 fill-emerald-500/20" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    {editingData ? "¡Actualización Exitosa!" : "¡Registro Exitoso!"}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base de datos actualizada correctamente</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className={cn("space-y-6 transition-all duration-300", isSuccess && "opacity-0 scale-95 pointer-events-none")}>
              
              {/* OCR Scan Area con Drag & Drop */}
            <div 
              onDragOver={(e) => {
                 e.preventDefault();
                 setIsDropping(true);
              }}
              onDragLeave={() => setIsDropping(false)}
              onDrop={handleDrop}
              className={cn(
                "p-5 border-2 border-dashed rounded-[2rem] transition-all relative group",
                isDropping ? "border-emerald-500 bg-emerald-50/50 scale-[1.02]" : 
                isProcessingOCR ? "border-emerald-500 bg-emerald-50/20" : "border-slate-100 hover:border-emerald-200"
              )}
            >
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className={cn(
                       "h-11 w-11 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                       isProcessingOCR ? "bg-emerald-500 text-white animate-pulse" : "bg-white text-emerald-500"
                     )}>
                        {isProcessingOCR ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                     </div>
                     <div>
                        <p className="text-xs font-bold text-slate-800 tracking-tight uppercase">Smart Scan Aduanas</p>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Pegar Captura (DAM / ISO)</p>
                     </div>
                  </div>
                  <div className="relative">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) processOCR(file);
                    }} />
                    <button type="button" className="h-10 px-4 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">
                       Subir PDF/JPG
                    </button>
                  </div>
               </div>
            </div>

            <div className="space-y-5">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Booking Number (Seleccionar)</label>
                  <div className="relative group">
                     <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors z-10" />
                     <button
                       type="button"
                       onClick={() => setIsSelectorOpen(true)}
                       className={cn(
                         "w-full h-12 pl-11 pr-10 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm tracking-widest text-left flex items-center justify-between",
                         !formData.booking && "text-slate-400"
                       )}
                     >
                       <span>{formData.booking || "SELECCIONE BOOKING..."}</span>
                       <Search className="h-4 w-4 text-slate-300" />
                     </button>
                  </div>
               </div>

               {/* MODAL SECUNDARIO: SELECTOR DE BOOKINGS */}
               <Dialog.Root open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
                 <Dialog.Portal>
                   <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[120] animate-in fade-in" />
                   <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[2.5rem] p-0 shadow-2xl z-[130] animate-in zoom-in-95 focus:outline-none overflow-hidden h-[500px] flex flex-col">
                      <div className="bg-[#022c22] p-8 text-white relative shrink-0">
                        <button 
                          type="button"
                          onClick={() => setIsSelectorOpen(false)} 
                          className="absolute top-6 right-6 h-10 w-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
                        >
                          <X className="h-5 w-5 text-white/50" />
                        </button>
                        <div className="flex items-center gap-4 mb-6">
                          <div className="h-12 w-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Search className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <Dialog.Title className="text-xl font-black uppercase tracking-tight">Buscador de Bookings</Dialog.Title>
                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">Maestro de Posicionamiento</p>
                          </div>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <input
                            placeholder="Buscar booking..."
                            className="w-full pl-12 h-14 bg-white/10 border-white/10 text-white rounded-2xl focus:bg-white/20 transition-all font-bold placeholder:text-white/30"
                            value={bookingSearch}
                            onChange={(e) => setBookingSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 space-y-2 bg-slate-50/50 lc-scroll">
                        {isLoadingBookings ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Cargando datos...</p>
                          </div>
                        ) : (
                          bookingsReal
                            .filter(b => (b.BOOKING || b.booking || "").toLowerCase().includes(bookingSearch.toLowerCase()))
                            .map((b) => {
                              const bId = b.BOOKING || b.booking;
                              const status = getBookingStatus(bId);
                              const isBlocked = status === "REGISTERED";
                              const isCurrent = status === "SELECTED";
                              
                              return (
                                <button
                                  key={b.ID || b.id || bId}
                                  type="button"
                                  disabled={isBlocked}
                                  onClick={() => handleSelectBooking(b)}
                                  className={cn(
                                    "w-full p-4 rounded-2xl border transition-all flex items-center justify-between group shadow-sm",
                                    isBlocked 
                                      ? "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed" 
                                      : isCurrent
                                        ? "border-emerald-500 bg-emerald-50/30"
                                        : "border-white bg-white hover:border-emerald-500 hover:bg-emerald-50/10"
                                  )}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className={cn(
                                      "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                                      isBlocked ? "bg-slate-100 text-slate-300" : 
                                      isCurrent ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-400 group-hover:text-emerald-500"
                                    )}>
                                      <Barcode className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                      <p className={cn(
                                        "text-xs font-black uppercase tracking-widest",
                                        isBlocked ? "text-slate-400" : "text-slate-900"
                                      )}>{bId}</p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase">{b.NAVE || "SIN NAVE ASIGNADA"}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isBlocked && (
                                      <span className="text-[9px] font-black bg-slate-200 text-slate-500 px-3 py-1 rounded-full uppercase tracking-tighter">REGISTRADO</span>
                                    )}
                                    {isCurrent && (
                                      <span className="text-[9px] font-black bg-emerald-500 text-white px-3 py-1 rounded-full uppercase tracking-tighter">ACTUAL</span>
                                    )}
                                    {!isBlocked && !isCurrent && (
                                      <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                    )}
                                  </div>
                                </button>
                              );
                            })
                        )}
                        {!isLoadingBookings && bookingsReal.length === 0 && (
                           <div className="text-center py-10">
                              <Zap className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                              <p className="text-[10px] font-black text-slate-400 uppercase">No hay bookings disponibles</p>
                           </div>
                        )}
                      </div>
                   </Dialog.Content>
                 </Dialog.Portal>
               </Dialog.Root>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">N° de DAM</label>
                     <div className="relative group">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          autoComplete="off"
                          value={formData.dam}
                          onChange={e => setFormData({...formData, dam: e.target.value})}
                          placeholder="127-202X-..."
                          className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm"
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 text-xs">N° de Contenedor</label>
                     <div className="relative group">
                        <Boxes className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          required
                          autoComplete="off"
                          value={formData.contenedor}
                          onChange={e => setFormData({...formData, contenedor: cleanContainer(e.target.value)})}
                          placeholder="MSCU1234567"
                          className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm tracking-widest"
                          maxLength={11}
                        />
                     </div>
                  </div>
               </div>
            </div>

            <button
               type="submit"
               disabled={isSubmitting}
               className="w-full h-14 bg-[#022c22] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-900/10 active:scale-95 disabled:opacity-50 mt-4 outline-none"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : editingData ? "Actualizar Registro" : "Registrar Embarque"}
            </button>

            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
