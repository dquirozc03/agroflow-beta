"use client";

import React, { useState, useEffect, useRef } from "react";
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
  User,
  ArrowRight,
  Maximize2,
  Sparkles,
  Loader2,
  AlertTriangle,
  Ship,
  Plane,
  Info
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
  readOnly?: boolean;
}

function MultiInput({ label, placeholder, values, onChange, icon: Icon, readOnly }: MultiInputProps) {
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
    } else if (e.key === "Backspace" && !inputValue && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div className="space-y-3 group">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
        {label}
      </label>
      <div className="bg-white/80 border border-slate-100 rounded-[1.5rem] p-2 min-h-[64px] flex flex-wrap gap-2 items-center transition-all duration-300 focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 shadow-sm">
        <div className="pl-3 pr-1 text-slate-300">
          <Icon className="h-4 w-4" />
        </div>
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-700">
             {v}
             <button onClick={() => onChange(values.filter((_, idx) => idx !== i))} className="hover:text-emerald-900">
                <X className="h-3 w-3" />
             </button>
          </div>
        ))}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={values.length === 0 ? placeholder : "..."}
          className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-900 placeholder:text-slate-300 px-2 min-w-[80px]"
        />
      </div>
    </div>
  );
}

function FormField({ label, placeholder, icon: Icon, value, onChange, readOnly, success, loading, error, onBlur, helperText }: any) {
  return (
    <div className="space-y-3 group/field">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-emerald-500 transition-colors">
        {label}
      </label>
      <div className="relative group/input">
        <div className={cn(
          "absolute left-5 top-1/2 -translate-y-1/2 transition-colors z-10",
          success ? "text-emerald-500" : (error ? "text-rose-400" : "text-slate-300 group-focus-within:text-emerald-500")
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
            error && "border-rose-500 bg-rose-50/10 text-rose-800"
          )}
        />
        {success && !error && <div className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-500"><CheckCircle2 className="h-5 w-5" /></div>}
        {error && <div className="absolute right-5 top-1/2 -translate-y-1/2 text-rose-500 animate-pulse"><AlertTriangle className="h-5 w-5" /></div>}
        
        {helperText && (
          <div className="absolute bottom-full left-5 mb-3 px-4 py-3 bg-[#022c22] text-white rounded-2xl shadow-2xl opacity-0 translate-y-2 group-hover/input:opacity-100 group-hover/input:translate-y-0 transition-all duration-300 z-[100] whitespace-nowrap">
             <span className="text-[10px] font-black uppercase text-emerald-400">Validado:</span>
             <p className="text-xs font-bold mt-1">{helperText}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SuccessModal({ isOpen, onClose, title }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-lg">
        <div className="relative bg-white rounded-[3.5rem] p-12 max-w-md w-full text-center space-y-10 animate-in zoom-in-95 duration-500">
           <div className="w-28 h-28 bg-emerald-100 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 className="h-16 w-16 text-emerald-600" /></div>
           <div className="space-y-4">
              <h2 className="text-4xl font-extrabold text-[#022c22] tracking-tighter">¡LISTO!</h2>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest leading-relaxed">OPERACIÓN {title} REGISTRADA</p>
           </div>
           <button onClick={onClose} className="w-full py-6 bg-emerald-950 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all">REGRESAR A BANDEJA</button>
        </div>
    </div>
  );
}

export default function LogiCaptureFase3OriginalPage() {
  const [transportMode, setTransportMode] = useState<"maritimo" | "terrestre" | "aereo">("maritimo");
  const [isProcessingIA, setIsProcessingIA] = useState(false);
  const [ocrTarget, setOcrTarget] = useState<string>("booking");
  const [isSearching, setIsSearching] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTitle, setSuccessTitle] = useState("");
  const [validatedFields, setValidatedFields] = useState<string[]>([]);
  const [bookingError, setBookingError] = useState(false);

  const [formData, setFormData] = useState({
    booking: "", ordenBeta: "", contenedor: "", dam: "", dni: "", placaTracto: "", placaCarreta: "", empresa: "",
    precintoAduana: [] as string[], precintoOperador: [] as string[], precintoSenasa: [] as string[],
    precintoLinea: [] as string[], precintosBeta: [] as string[], termografos: [] as string[],
    tratamientoBuque: false, planta: "", cultivo: "", ruc_transportista: "", nombreChofer: "", licenciaChofer: ""
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
      if (!resp.ok) { setBookingError(true); return; }
      const res = await resp.json();
      setFormData(prev => ({ ...prev, ordenBeta: res.orden_beta || "", dam: res.dam || "", contenedor: res.contenedor || "", planta: res.planta || "", cultivo: res.cultivo || "" }));
      setValidatedFields(prev => [...new Set([...prev, "booking", "ordenBeta", "dam", "contenedor"])]);
    } catch (e) { setBookingError(true); } finally { setIsSearching(false); }
  };

  const handleProcessImage = async (file: File) => {
    setIsProcessingIA(true);
    const fd = new FormData(); 
    fd.append("file", file); 
    fd.append("target", ocrTarget);
    try {
        const resp = await fetch(`${API_BASE_URL}/api/v1/logicapture/ocr`, { method: "POST", body: fd });
        const d = await resp.json();
        if (d.text) { 
           updateField(ocrTarget, d.text.toUpperCase()); 
           toast.success("Captura Exitosa"); 
           if (ocrTarget === "booking") setTimeout(handleLookup, 500); 
        }
    } catch (e) { 
        toast.error("Error OCR"); 
    } finally { 
        setIsProcessingIA(false); 
    }
  };

  const handlePaste = async (e: any) => {
    const item = Array.from(e.clipboardData.items).find((i: any) => i.type.indexOf("image") !== -1);
    if (item) {
        const file = (item as any).getAsFile();
        if (file) handleProcessImage(file);
    }
  };

  const handleSave = async () => {
    setIsSearching(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/logicapture/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...formData, status: "PROCESADO" }) });
      if (!resp.ok) throw new Error();
      setSuccessTitle(formData.ordenBeta || "REGISTRO"); setShowSuccess(true);
    } catch (e) { toast.error("Error al guardar"); } finally { setIsSearching(false); }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f6f8fa]">
      <AppSidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader />
        
        <main onPaste={handlePaste} className="flex-1 overflow-y-auto p-10 lc-scroll pt-2">
          <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700">
            
            {/* --- CABECERA ORIGINAL --- */}
            <div className="flex items-center justify-between gap-8 py-2">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                     <Scan className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col">
                     <h1 className="text-3xl font-black tracking-tighter text-[#022c22] uppercase">LogiCapture</h1>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">REGISTRO OPERATIVO DE SALIDA - FASE 3</p>
                  </div>
               </div>

               <div className="flex items-center gap-3 bg-white/80 p-2 rounded-[2rem] border border-slate-100 shadow-sm">
                  {[
                    { id: "maritimo", icon: Ship, label: "MARÍTIMO" },
                    { id: "terrestre", icon: Truck, label: "TERRESTRE" },
                    { id: "aereo", icon: Plane, label: "AÉREO" }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setTransportMode(mode.id as any)}
                      className={cn("flex items-center gap-3 px-6 py-3 rounded-[1.5rem] transition-all", transportMode === mode.id ? "bg-[#022c22] text-white shadow-lg" : "text-slate-400 hover:text-emerald-600")}
                    >
                      <mode.icon className="h-4 w-4" />
                      <span className="text-[10px] font-black tracking-widest">{mode.label}</span>
                    </button>
                  ))}
               </div>

               <div className="flex items-center gap-3">
                  <button onClick={() => window.location.reload()} className="h-12 px-6 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 shadow-sm">LIMPIAR PANTALLA</button>
                  <Button onClick={handleLookup} disabled={isSearching} className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">AUTOCOMPLETAR INTELIGENTE</Button>
               </div>
            </div>

            {/* --- BLOQUE DARK UNIFICADO (TERMINAL + SELECTOR) --- */}
            <div className="bg-[#0a1110] rounded-[3.5rem] border border-emerald-900/30 p-12 relative shadow-2xl flex flex-col lg:flex-row gap-12 overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#10b98115,transparent)]" />
               
               {/* LADO IZQUIERDO: TERMINAL */}
               <div className="flex-1 space-y-8 relative z-10">
                  <div className="flex items-center gap-2">
                     <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-[0.5em]">IA CAPTURE TERMINAL V2.0</span>
                  </div>
                  
                  <div className={cn(
                     "h-[280px] w-full rounded-[2.5rem] border-2 border-dashed border-emerald-900/50 flex flex-col items-center justify-center gap-6 transition-all group hover:border-emerald-500/40 bg-white/5",
                     isProcessingIA && "border-emerald-500 animate-pulse"
                  )}>
                     <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center">
                        {isProcessingIA ? <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" /> : <FileText className="h-10 w-10 text-emerald-500/80" />}
                     </div>
                     <div className="text-center space-y-2">
                        <p className="text-xl font-black text-white tracking-tight">PEGAR RECORTE O SOLTAR IMAGEN</p>
                        <p className="text-[10px] font-bold text-emerald-500/40 uppercase tracking-[0.2em]">PRESIONA <span className="text-emerald-400">CTRL + V</span> PARA PROCESAR INSTANTÁNEAMENTE</p>
                     </div>
                     <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && handleProcessImage(e.target.files[0])} />
                  </div>
               </div>

               {/* LADO DERECHO: SELECTOR DE DESTINO (DARK) */}
               <div className="w-full lg:w-[450px] space-y-8 relative z-10">
                  <div className="space-y-1">
                     <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">SELECTOR DE DESTINO</h3>
                     <p className="text-[10px] font-bold text-emerald-500/40 uppercase tracking-widest">ELIGE DÓNDE APLICAR EL DATO EXTRAÍDO</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
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
                              "flex flex-col items-center justify-center gap-3 p-5 rounded-[2rem] border transition-all duration-300",
                              ocrTarget === item.id 
                                 ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
                                 : "bg-[#0d1615] border-emerald-900/30 text-emerald-500/40 hover:bg-[#14211f] hover:text-emerald-400"
                           )}
                        >
                           <item.icon className="h-5 w-5" />
                           <span className="text-[10px] font-black tracking-widest">{item.label}</span>
                        </button>
                     ))}
                  </div>

                  <Button className="w-full h-16 bg-white text-[#0a1110] hover:bg-emerald-50 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl mt-4">
                     PROCESAR CON IA AVANZADA
                  </Button>
               </div>
            </div>

            {/* --- SECCIONES DE FORMULARIO --- */}
            <div className="space-y-8">
               <div className="bg-white rounded-[3.5rem] border border-slate-100 p-12 shadow-sm">
                  <div className="flex items-center justify-between mb-10">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center ring-8 ring-emerald-50/10"><Ship className="h-6 w-6 text-emerald-600" /></div>
                        <div>
                           <h3 className="text-xl font-black text-[#022c22] tracking-tighter uppercase">01. DATOS DE EMBARQUE</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">VALIDACIÓN ACTIVA SINCRO-NUBE</p>
                        </div>
                     </div>
                     <button onClick={() => updateField("tratamientoBuque", !formData.tratamientoBuque)} className={cn("px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", formData.tratamientoBuque ? "bg-[#022c22] text-white shadow-xl scale-105" : "bg-slate-50 text-slate-300")}>
                        {formData.tratamientoBuque ? "✓ TRATAMIENTO EN BUQUE" : "TRATAMIENTO EN BUQUE"}
                     </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                     <FormField label="BOOKING / RESERVA" placeholder="BK-XXXXXXXX" icon={BookOpen} value={formData.booking} onChange={(v: string) => updateField("booking", v)} onBlur={handleLookup} success={validatedFields.includes("booking")} error={bookingError} />
                     <FormField label="ORDEN BETA" placeholder="O-99999" icon={Hash} value={formData.ordenBeta} onChange={(v: string) => updateField("ordenBeta", v)} readOnly success={!!formData.ordenBeta} />
                     <FormField label="CONTENEDOR" placeholder="ABCD 123" icon={Container} value={formData.contenedor} onChange={(v: string) => updateField("contenedor", v)} readOnly success={!!formData.contenedor} />
                     <FormField label="DAM" placeholder="118-2026" icon={FileText} value={formData.dam} onChange={(v: string) => updateField("dam", v)} readOnly success={!!formData.dam} />
                  </div>
               </div>

               <div className="bg-white rounded-[3.5rem] border border-slate-100 p-12 shadow-sm">
                   <div className="flex items-center gap-4 mb-10">
                        <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center ring-8 ring-slate-50/10"><Truck className="h-6 w-6 text-slate-600" /></div>
                        <div>
                           <h3 className="text-xl font-black text-[#022c22] tracking-tighter uppercase">02. TRANSPORTE</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LECTURA DE PLACAS Y CHOFERES</p>
                        </div>
                     </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                     <FormField label="DNI CHOFER" placeholder="Escriba DNI" icon={User} value={formData.dni} onChange={(v: string) => updateField("dni", v)} helperText={formData.nombreChofer} />
                     <FormField label="PLACA TRACTO" placeholder="ABC-123" icon={Maximize2} value={formData.placaTracto} onChange={(v: string) => updateField("placaTracto", v)} />
                     <FormField label="PLACA CARRETA" placeholder="XYZ-987" icon={Maximize2} value={formData.placaCarreta} onChange={(v: string) => updateField("placaCarreta", v)} />
                     <FormField label="EMPRESA" placeholder="AUTOMÁTICO..." icon={Layers} value={formData.empresa} onChange={(v: string) => updateField("empresa", v)} readOnly helperText={formData.empresa ? `RUC: ${formData.ruc_transportista}` : ""} />
                  </div>
               </div>

               <div className="bg-white rounded-[3.5rem] border border-slate-100 p-12 shadow-sm">
                   <div className="flex items-center gap-4 mb-10">
                        <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center ring-8 ring-emerald-50/10"><ShieldCheck className="h-6 w-6 text-emerald-600" /></div>
                        <div>
                           <h3 className="text-xl font-black text-[#022c22] tracking-tighter uppercase">03. PRECINTOS Y SALIDA</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SEGURIDAD Y CONTROL</p>
                        </div>
                     </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <MultiInput label="ADUANA" placeholder="ADD" icon={ShieldCheck} values={formData.precintoAduana} onChange={(v) => updateField("precintoAduana", v)} />
                     <MultiInput label="OPERADOR" placeholder="OPP" icon={ShieldCheck} values={formData.precintoOperador} onChange={(v) => updateField("precintoOperador", v)} />
                     <MultiInput label="SENASA" placeholder="SEN" icon={BadgeCheck} values={formData.precintoSenasa} onChange={(v) => updateField("precintoSenasa", v)} />
                     <MultiInput label="LÍNEA" placeholder="LIN" icon={Layers} values={formData.precintoLinea} onChange={(v) => updateField("precintoLinea", v)} />
                     <MultiInput label="BETA" placeholder="BET" icon={Zap} values={formData.precintosBeta} onChange={(v) => updateField("precintosBeta", v)} />
                     <MultiInput label="TERMÓGRAFOS" placeholder="TERM" icon={Thermometer} values={formData.termografos} onChange={(v) => updateField("termografos", v)} />
                  </div>

                  <div className="mt-16 pt-12 border-t border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><Info className="h-6 w-6" /></div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-sm">Verifique que todos los datos sean legibles. El sistema validará la integridad de la operación al guardar.</p>
                     </div>
                     <div className="flex items-center gap-8">
                        <button className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-emerald-600">BORRADOR</button>
                        <Button onClick={handleSave} disabled={isSearching || formData.booking.length < 3} className="h-20 px-16 bg-[#022c22] text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[11px] hover:bg-emerald-800 shadow-2xl transition-all group">
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
      
      <div className="fixed bottom-12 right-12 z-[100]">
         <button onClick={handleLookup} className="h-20 w-20 bg-emerald-500 rounded-3xl shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all shadow-emerald-500/20 group">
            <div className="absolute inset-0 bg-emerald-400 rounded-3xl animate-ping opacity-20" />
            <Sparkles className="h-10 w-10 animate-pulse relative z-10" />
         </button>
      </div>
    </div>
  );
}
