"use client";

import React, { useState, KeyboardEvent, useEffect, useRef } from "react";
import { 
  Scan, 
  Container, 
  BookOpen, 
  Truck, 
  ShieldCheck, 
  Thermometer, 
  Hash, 
  Plus,
  FileText,
  BadgeCheck,
  Zap,
  Target,
  Layers,
  Search,
  CheckCircle2,
  X,
  CreditCard,
  User,
  ArrowRight,
  Maximize2,
  Sparkles,
  RefreshCw,
  Camera,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Info,
  Ship,
  Plane,
  ShieldAlert,
  Calendar as CalendarIcon,
  MousePointer2,
  Image as ImageIcon,
  Copy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";

// --- Componentes UX Premium Fase 3 ---

interface MultiInputProps {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (newValues: string[]) => void;
  icon: any;
  autoFocus?: boolean;
  duplicatedValues?: string[];
  readOnly?: boolean;
}

function MultiInput({ label, placeholder, values, onChange, icon: Icon, autoFocus, duplicatedValues = [], readOnly }: MultiInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (readOnly) return;
    if (e.key === "Enter") {
      const cleanValue = inputValue.trim().toUpperCase();
      if (!cleanValue) return;

      e.preventDefault();
      if (!values.includes(cleanValue)) {
        onChange([...values, cleanValue]);
      }
      setInputValue("");
      setTimeout(() => inputRef.current?.focus(), 10);
    } else if (e.key === "Backspace" && !inputValue && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  const removeValue = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 group">
      <div className="flex items-center gap-2 ml-1">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-focus-within:text-emerald-500 transition-colors">
          {label}
        </label>
      </div>
      <div className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-[1.5rem] p-2 min-h-[64px] flex flex-wrap gap-2 items-center transition-all duration-300 focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 hover:border-emerald-200 shadow-sm hover:shadow-md">
        <div className="pl-3 pr-1 text-slate-300">
          <Icon className="h-4 w-4" />
        </div>
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-700 animate-in zoom-in-95">
             {v}
             <button onClick={() => removeValue(i)} className="hover:text-emerald-900 transition-colors">
                <X className="h-3 w-3" />
             </button>
          </div>
        ))}
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={values.length === 0 ? placeholder : "..."}
          className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-900 placeholder:text-slate-300 min-w-[80px] px-2"
        />
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  placeholder: string;
  icon: any;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  success?: boolean;
  loading?: boolean;
  error?: boolean;
  errorMsg?: string;
  onBlur?: () => void;
  helperText?: string;
  highlightError?: boolean;
}

function FormField({ label, placeholder, icon: Icon, value, onChange, readOnly, success, loading, error, errorMsg, onBlur, helperText, highlightError }: FormFieldProps) {
  return (
    <div className="space-y-3 group/field">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-emerald-500 transition-colors">
        {label}
      </label>
      <div className="relative group/input">
        <div className={cn(
          "absolute left-5 top-1/2 -translate-y-1/2 transition-colors z-10",
          success ? "text-emerald-500" : (error || highlightError ? "text-rose-400" : "text-slate-300 group-focus-within:text-emerald-500")
        )}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
        </div>
        <input
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={cn(
            "w-full border rounded-[1.5rem] py-5 pl-13 pr-12 text-sm font-bold transition-all duration-300 shadow-sm outline-none",
            readOnly ? "bg-slate-50/50 text-slate-500 cursor-not-allowed border-slate-100" : "bg-white border-slate-100 text-slate-900 placeholder:text-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 hover:shadow-md",
            success && "border-emerald-500 bg-emerald-50/10 text-emerald-700",
            (error || highlightError) && "border-rose-500 bg-rose-50/10 text-rose-800"
          )}
        />
        {success && !error && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-500 animate-in zoom-in-50">
             <CheckCircle2 className="h-5 w-5" />
          </div>
        )}
        {(error || highlightError) && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-rose-500 animate-pulse">
             <AlertTriangle className="h-5 w-5" />
          </div>
        )}

        {/* --- Leyenda Premium (Tooltip) al Hover --- */}
        {helperText && (
          <div className="absolute bottom-full left-5 mb-3 px-4 py-3 bg-[#022c22] border border-emerald-500/30 text-white rounded-2xl shadow-2xl opacity-0 scale-90 -translate-y-2 group-hover/input:opacity-100 group-hover/input:scale-100 group-hover/input:translate-y-0 pointer-events-none transition-all duration-300 z-[100] whitespace-nowrap origin-bottom-left">
             <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-400">Dato Validado:</span>
             </div>
             <p className="text-xs font-bold mt-1 text-white/90">{helperText}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Modals y UI Terminal ---

function SuccessModal({ isOpen, onClose, title }: { isOpen: boolean, onClose: () => void, title: string }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg" onClick={onClose} />
        <div className="relative bg-white rounded-[3.5rem] shadow-2xl p-12 max-w-md w-full border border-emerald-100 text-center space-y-10 animate-in zoom-in-95 slide-in-from-bottom-20 duration-700">
           <div className="w-28 h-28 bg-emerald-100 rounded-full flex items-center justify-center mx-auto relative">
              <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20" />
              <CheckCircle2 className="h-16 w-16 text-emerald-600 relative z-10" />
           </div>
           <div className="space-y-4">
              <h2 className="text-4xl font-extrabold text-[#022c22] tracking-tighter">¡LISTO!</h2>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest leading-relaxed">
                LA OPERACIÓN <span className="text-emerald-500">{title}</span> <br/>HA SIDO REGISTRADA EN NUBE
              </p>
           </div>
           <button 
              onClick={onClose}
              className="w-full py-6 bg-emerald-950 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-900/20 active:scale-95"
           >
              REGRESAR A BANDEJA
           </button>
        </div>
    </div>
  );
}

export default function LogiCaptureFase3Page() {
  const [transportMode, setTransportMode] = useState<"maritimo" | "terrestre" | "aereo">("maritimo");
  const [isProcessingIA, setIsProcessingIA] = useState(false);
  const [ocrTarget, setOcrTarget] = useState<string>("booking");
  const [isSearching, setIsSearching] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTitle, setSuccessTitle] = useState("");
  const [validatedFields, setValidatedFields] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [bookingError, setBookingError] = useState(false);

  const [formData, setFormData] = useState({
    booking: "",
    ordenBeta: "",
    contenedor: "",
    dam: "",
    dni: "",
    placaTracto: "",
    placaCarreta: "",
    empresa: "",
    precintoAduana: [] as string[],
    precintoOperador: [] as string[],
    precintoSenasa: [] as string[],
    precintoLinea: [] as string[],
    precintosBeta: [] as string[],
    termografos: [] as string[],
    tratamientoBuque: false,
    planta: "",
    cultivo: "",
    ruc_transportista: "",
    nombreChofer: "",
    licenciaChofer: "",
    codigo_sap: "",
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (value) setValidatedFields(prev => [...new Set([...prev, field])]);
    else setValidatedFields(prev => prev.filter(f => f !== field));
  };

  const handleLookup = async () => {
    const cleanBooking = formData.booking.trim().toUpperCase();
    if (!cleanBooking) return;
    
    setIsSearching(true);
    setBookingError(false);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/logicapture/lookup/${cleanBooking}`);
      if (!resp.ok) {
        setBookingError(true);
        toast.error("Booking no encontrado en Cuadro de Pedidos");
        return;
      }
      const res = await resp.json();
      setFormData(prev => ({
        ...prev,
        ordenBeta: res.orden_beta || "",
        dam: res.dam || "",
        contenedor: res.contenedor || "",
        planta: res.planta || "",
        cultivo: res.cultivo || "",
      }));
      setValidatedFields(prev => [...new Set([...prev, "booking", "ordenBeta", "dam", "contenedor"])]);
    } catch (e) {
      setBookingError(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let imageItem = null;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
            imageItem = items[i];
            break;
        }
    }
    if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) handleProcessImage(file);
    }
  };

  const handleProcessImage = async (file: File) => {
    setIsProcessingIA(true);
    const formDataIA = new FormData();
    formDataIA.append("file", file);
    formDataIA.append("target", ocrTarget);

    try {
        const resp = await fetch(`${API_BASE_URL}/api/v1/logicapture/ocr`, {
            method: "POST",
            body: formDataIA
        });
        if (!resp.ok) throw new Error("OCR Failed");
        const data = await resp.json();
        const extracted = data.text?.toUpperCase() || "";
        
        if (extracted) {
           updateField(ocrTarget, extracted);
           toast.success(`${ocrTarget.toUpperCase()} capturado con éxito`);
           if (ocrTarget === "booking") setTimeout(handleLookup, 500);
        }
    } catch (e) {
        toast.error("No se pudo procesar la imagen");
    } finally {
        setIsProcessingIA(false);
    }
  };

  const handleSave = async () => {
    setIsSearching(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/logicapture/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, status: "PROCESADO" })
      });
      if (!resp.ok) throw new Error();
      setSuccessTitle(formData.ordenBeta || "REGISTRO");
      setShowSuccess(true);
    } catch (e) {
      toast.error("Error al guardar registro");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f6f8fa]">
      <AppSidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader />
        
        <main onPaste={handlePaste} className="flex-1 overflow-y-auto p-10 lc-scroll pt-2">
          <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            
            {/* --- CABECERA FASE 3 --- */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 py-4">
               <div className="space-y-3 shrink-0">
                  <div className="flex items-center gap-4">
                     <div className="h-14 w-14 bg-emerald-600 rounded-[1.8rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20 translate-y-[-2px]">
                        <Scan className="h-7 w-7" />
                     </div>
                     <div className="flex flex-col">
                        <h1 className="text-4xl font-black tracking-[-0.05em] text-[#022c22] uppercase">LogiCapture</h1>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] font-['Outfit']">
                           REGISTRO OPERATIVO DE SALIDA - FASE 3
                        </p>
                     </div>
                  </div>
               </div>

               <div className="flex flex-wrap items-center gap-4 bg-white/60 backdrop-blur-md p-3 rounded-[2.5rem] border border-white shadow-xl">
                  {[
                    { id: "maritimo", icon: Ship, label: "MARÍTIMO" },
                    { id: "terrestre", icon: Truck, label: "TERRESTRE" },
                    { id: "aereo", icon: Plane, label: "AÉREO" }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setTransportMode(mode.id as any)}
                      className={cn(
                        "flex items-center gap-3 px-8 py-4 rounded-[1.8rem] transition-all duration-500 group",
                        transportMode === mode.id ? "bg-[#022c22] text-white shadow-2xl shadow-emerald-950/20 scale-105" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/50"
                      )}
                    >
                      <mode.icon className={cn("h-5 w-5", transportMode === mode.id ? "text-emerald-400 animate-pulse" : "group-hover:scale-120 transition-transform")} />
                      <span className="text-[10px] font-black tracking-widest">{mode.label}</span>
                    </button>
                  ))}
               </div>

               <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => window.location.reload()} className="h-14 px-8 bg-white border border-slate-100 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm">
                     LIMPIAR PANTALLA
                  </button>
                  <Button onClick={handleLookup} disabled={isSearching} className="h-14 px-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/30 animate-pulse-slow">
                     AUTOCOMPLETAR INTELIGENTE
                  </Button>
               </div>
            </div>

            {/* --- IA CAPTURE TERMINAL AREA --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               
               {/* TERMINAL OSCURA */}
               <div className={cn(
                  "col-span-12 lg:col-span-8 bg-[#0a1110] rounded-[3rem] border border-emerald-900/30 p-10 relative overflow-hidden group transition-all duration-700",
                  isProcessingIA ? "ring-4 ring-emerald-500/50 scale-[0.98]" : "hover:border-emerald-500/30 shadow-2xl"
               )}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#10b98120,transparent)]" />
                  
                  <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                     <div className="flex flex-col space-y-2">
                        <div className="flex items-center gap-2 mb-4">
                           <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-[0.5em]">IA CAPTURE TERMINAL V2.0</span>
                        </div>
                        
                        <div className={cn(
                           "h-[220px] w-full md:w-[480px] rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all duration-500",
                           isProcessingIA ? "border-emerald-500 bg-emerald-500/5" : "border-emerald-900/50 group-hover:border-emerald-500/50 bg-white/5"
                        )}>
                           <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center">
                              {isProcessingIA ? <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" /> : <FileText className="h-8 w-8 text-emerald-500/80" />}
                           </div>
                           <div className="text-center space-y-1">
                              <p className="text-lg font-black text-white/90 tracking-tight">PEGAR RECORTE O SOLTAR IMAGEN</p>
                              <p className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-[0.2em]">PRESIONA <span className="text-emerald-400">CTRL + V</span> PARA PROCESAR INSTANTÁNEAMENTE</p>
                           </div>
                           <input 
                              type="file" 
                              className="absolute inset-0 opacity-0 cursor-pointer" 
                              onChange={(e) => e.target.files?.[0] && handleProcessImage(e.target.files[0])}
                           />
                        </div>
                     </div>

                     <div className="flex-1 space-y-8">
                        <div className="space-y-4">
                           <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">IA LOG REPORT:</h4>
                           <div className="bg-black/40 rounded-2xl p-6 border border-emerald-900/20 font-mono text-[11px] text-emerald-500/60 leading-relaxed shadow-inner">
                              <p className="animate-in fade-in slide-in-from-left duration-300">$ system.vision: awaiting_input...</p>
                              {isProcessingIA && <p className="text-emerald-400 mt-1 animate-pulse">$ processing.deep_scan(buffer)... [|||||-----]</p>}
                              {formData.booking && <p className="text-emerald-500/80 mt-1 animate-in fade-in shrink-0">$ capture.detected.id: {formData.booking}</p>}
                           </div>
                        </div>
                        <Button className="w-full h-16 bg-white text-[#0a1110] hover:bg-emerald-50 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl">
                           PROCESAR CON IA AVANZADA
                        </Button>
                     </div>
                  </div>
               </div>

               {/* SELECTOR DE DESTINO */}
               <div className="col-span-12 lg:col-span-4 bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm relative overflow-hidden group">
                  <div className="flex flex-col h-full">
                     <div className="flex items-center gap-3 mb-8">
                        <Target className="h-5 w-5 text-emerald-600" />
                        <h3 className="text-[11px] font-black text-[#022c22] uppercase tracking-[0.2em]">SELECTOR DE DESTINO</h3>
                     </div>
                     <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-6">ELIGE DÓNDE APLICAR EL DATO EXTRAÍDO</p>
                     
                     <div className="grid grid-cols-2 gap-4 flex-1">
                        {[
                          { id: "booking", label: "BOOKING", icon: BookOpen },
                          { id: "dam", label: "DAM", icon: Hash },
                          { id: "contenedor", label: "CONTENEDOR", icon: Container },
                          { id: "placaTracto", label: "PLACA TRACTO", icon: Truck },
                          { id: "placaCarreta", label: "PLACA CARRETA", icon: Truck },
                        ].map((item) => (
                           <button
                              key={item.id}
                              onClick={() => setOcrTarget(item.id)}
                              className={cn(
                                 "flex flex-col items-center justify-center gap-3 p-4 rounded-[2rem] border transition-all duration-300 relative group/btn",
                                 ocrTarget === item.id 
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-600 ring-2 ring-emerald-500/10" 
                                    : "bg-slate-50/50 border-slate-100 text-slate-400 hover:bg-white hover:border-emerald-100 hover:text-emerald-500"
                              )}
                           >
                              <item.icon className={cn("h-5 w-5", ocrTarget === item.id ? "scale-110" : "group-hover/btn:scale-110")} />
                              <span className="text-[9px] font-black tracking-widest">{item.label}</span>
                              {ocrTarget === item.id && <div className="absolute top-3 right-3 h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* --- SECCIONES DE FORMULARIO --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               
               {/* 01. DATOS EMBARQUE */}
               <div className="col-span-12 bg-white rounded-[3.5rem] border border-slate-100 p-12 shadow-sm hover:shadow-xl transition-all duration-500 group">
                  <div className="flex items-center justify-between mb-10">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center ring-8 ring-emerald-50/30 group-hover:bg-emerald-100 transition-all">
                           <Ship className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div className="flex flex-col">
                           <h3 className="text-xl font-black text-[#022c22] tracking-tighter uppercase">01. DATOS DE EMBARQUE</h3>
                           <div className="flex items-center gap-2 mt-0.5">
                              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">VALIDACIÓN ACTIVA SINCRO-NUBE</p>
                           </div>
                        </div>
                     </div>
                     <button 
                        onClick={() => updateField("tratamientoBuque", !formData.tratamientoBuque)}
                        className={cn(
                           "px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300",
                           formData.tratamientoBuque 
                              ? "bg-emerald-950 text-white shadow-lg active:scale-95" 
                              : "bg-slate-50 text-slate-300 hover:bg-slate-100"
                        )}
                     >
                        {formData.tratamientoBuque ? "✓ TRATAMIENTO EN BUQUE" : "TRATAMIENTO EN BUQUE"}
                     </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                     <FormField label="BOOKING / RESERVA" placeholder="BK-XXXXXXXX" icon={BookOpen} value={formData.booking} onChange={(v) => updateField("booking", v)} onBlur={handleLookup} success={validatedFields.includes("booking")} error={bookingError} />
                     <FormField label="ORDEN BETA" placeholder="O-99999" icon={Hash} value={formData.ordenBeta} onChange={(v) => updateField("ordenBeta", v)} readOnly success={!!formData.ordenBeta} />
                     <FormField label="NÚMERO CONTENEDOR" placeholder="ABCD 123456-7" icon={Container} value={formData.contenedor} onChange={(v) => updateField("contenedor", v)} readOnly success={!!formData.contenedor} />
                     <FormField label="NÚMERO DAM" placeholder="118-2026-XX-XXXXX" icon={FileText} value={formData.dam} onChange={(v) => updateField("dam", v)} readOnly success={!!formData.dam} />
                  </div>
               </div>

               {/* 02. INFO TRANSPORTE */}
               <div className="col-span-12 bg-white rounded-[3.5rem] border border-slate-100 p-12 shadow-sm hover:shadow-xl transition-all duration-500 group">
                   <div className="flex items-center gap-4 mb-10">
                        <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center ring-8 ring-slate-50/30 group-hover:bg-slate-100 transition-all">
                           <Truck className="h-6 w-6 text-slate-600" />
                        </div>
                        <div className="flex flex-col">
                           <h3 className="text-xl font-black text-[#022c22] tracking-tighter uppercase">02. INFORMACIÓN DEL TRANSPORTE</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">LECTURA DE PLACAS Y CHOFERES</p>
                        </div>
                     </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                     <FormField label="DNI O NOMBRE DEL CHOFER" placeholder="Escriba DNI o Nombre" icon={User} value={formData.dni} onChange={(v) => updateField("dni", v)} helperText={formData.nombreChofer} />
                     <FormField label="PLACA TRACTO" placeholder="ABC-123" icon={Maximize2} value={formData.placaTracto} onChange={(v) => updateField("placaTracto", v)} />
                     <FormField label="PLACA CARRETA" placeholder="XYZ-987" icon={Maximize2} value={formData.placaCarreta} onChange={(v) => updateField("placaCarreta", v)} />
                     <FormField label="EMPRESA TRANSPORTES" placeholder="AUTOMÁTICO..." icon={Layers} value={formData.empresa} onChange={(v) => updateField("empresa", v)} readOnly helperText={formData.empresa ? `RUC: ${formData.ruc_transportista}` : ""} />
                  </div>
               </div>

               {/* 03. PRECINTOS */}
               <div className="col-span-12 bg-white rounded-[3.5rem] border border-slate-100 p-12 shadow-sm hover:shadow-xl transition-all duration-500 group">
                   <div className="flex items-center gap-4 mb-10">
                        <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center ring-8 ring-emerald-50/30 group-hover:bg-emerald-100 transition-all">
                           <ShieldCheck className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div className="flex flex-col">
                           <h3 className="text-xl font-black text-[#022c22] tracking-tighter uppercase">03. PRECINTOS Y CONTROL DE SALIDA</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">REGISTRO MÚLTIPLE DE SEGURIDAD</p>
                        </div>
                     </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <MultiInput label="PRECINTO ADUANA" placeholder="Ej: AD123" icon={ShieldCheck} values={formData.precintoAduana} onChange={(v) => updateField("precintoAduana", v)} />
                     <MultiInput label="PRECINTO OPERADOR" placeholder="Ej: OP456" icon={ShieldCheck} values={formData.precintoOperador} onChange={(v) => updateField("precintoOperador", v)} />
                     <MultiInput label="PRECINTO SENASA" placeholder="Ej: SE789" icon={BadgeCheck} values={formData.precintoSenasa} onChange={(v) => updateField("precintoSenasa", v)} />
                     <MultiInput label="PRECINTO LÍNEA" placeholder="Ej: LN012" icon={Layers} values={formData.precintoLinea} onChange={(v) => updateField("precintoLinea", v)} />
                     <MultiInput label="PRECINTOS BETA" placeholder="Ej: BT345" icon={Zap} values={formData.precintosBeta} onChange={(v) => updateField("precintosBeta", v)} />
                     <MultiInput label="TERMÓGRAFOS / KEY" placeholder="Ej: T-9999" icon={Thermometer} values={formData.termografos} onChange={(v) => updateField("termografos", v)} />
                  </div>

                  <div className="mt-16 pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                           <Info className="h-6 w-6" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-[#022c22] uppercase tracking-[0.2em]">OPERACIÓN PROTEGIDA</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Verifique que todos los datos sean legibles. El sistema validará la integridad de la operación al guardar.</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-8">
                        <button className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-emerald-600 transition-colors">BORRADOR LOCAL</button>
                        <Button 
                           onClick={handleSave} 
                           disabled={isSearching || formData.booking.length < 3}
                           className="h-20 px-16 bg-[#022c22] text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[11px] hover:bg-emerald-800 transition-all shadow-2xl shadow-emerald-950/20 active:scale-95 group"
                        >
                           {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>GUARDAR REGISTRO</span>}
                           <ArrowRight className="ml-4 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                        </Button>
                     </div>
                  </div>
               </div>
            </div>

            <div className="h-20" />
          </div>
        </main>
      </div>

      <SuccessModal isOpen={showSuccess} onClose={() => window.location.href="/logicapture/bandeja"} title={successTitle} />
      
      {/* --- BOTÓN FLOTANTE IA --- */}
      <div className="fixed bottom-12 right-12 z-[100] animate-in slide-in-from-right-40 duration-1000">
         <button 
           onClick={handleLookup}
           className="h-20 w-20 bg-emerald-500 rounded-3xl shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all shadow-emerald-500/20 group relative"
         >
            <div className="absolute inset-0 bg-emerald-400 rounded-3xl animate-ping opacity-20" />
            <Sparkles className="h-10 w-10 animate-pulse relative z-10" />
            
            <div className="absolute right-full mr-6 py-3 px-5 bg-emerald-950 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap">
               Asistente Inteligente Activo
               <div className="absolute top-1/2 -translate-y-1/2 left-full border-[6px] border-transparent border-l-emerald-950" />
            </div>
         </button>
      </div>
    </div>
  );
}
