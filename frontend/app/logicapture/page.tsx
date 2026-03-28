"use client";

import React, { useState, KeyboardEvent, useEffect } from "react";
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
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";

// --- Componentes UX Premium Carlos Style ---

interface MultiInputProps {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (newValues: string[]) => void;
  icon: any;
}

function MultiInput({ label, placeholder, values, onChange, icon: Icon }: MultiInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!values.includes(inputValue.trim())) {
        onChange([...values, inputValue.trim()]);
      }
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  const removeValue = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 group">
      <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-emerald-500 transition-colors">
        {label}
      </label>
      <div className="bg-white border border-slate-100 rounded-2xl p-2 min-h-[56px] flex flex-wrap gap-2 items-center transition-all duration-300 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 hover:border-emerald-200 shadow-sm hover:shadow-md hover:scale-[1.01]">
        <div className="pl-3 pr-1 text-slate-300">
          <Icon className="h-4 w-4" />
        </div>
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl text-sm font-bold animate-in zoom-in-95 duration-200">
            {v}
            <button onClick={() => removeValue(i)} className="hover:text-emerald-900 transition-colors">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={values.length === 0 ? placeholder : "Añadir más..."}
          className="flex-1 bg-transparent border-none outline-none text-base font-medium text-slate-900 placeholder:text-slate-300 min-w-[120px] px-2"
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
}

function FormField({ label, placeholder, icon: Icon, value, onChange, readOnly, success, loading }: FormFieldProps) {
  return (
    <div className="space-y-3 group">
      <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-emerald-500 transition-colors">
        {label}
      </label>
      <div className="relative">
        <div className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 transition-colors z-10",
          success ? "text-emerald-500" : "text-slate-300 group-focus-within:text-emerald-500"
        )}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
        </div>
        <input
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full border rounded-2xl py-4 pl-11 pr-12 text-base font-medium transition-all duration-300 shadow-sm outline-none",
            readOnly ? "bg-slate-50/50 text-slate-500 cursor-not-allowed border-slate-100" : "bg-white border-slate-100 text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hover:shadow-md hover:border-emerald-100 focus:scale-[1.01]",
            success && "border-emerald-500 ring-2 ring-emerald-500/5 bg-emerald-50/10 text-emerald-700 font-bold"
          )}
        />
        {success && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 animate-in zoom-in-50">
             <CheckCircle2 className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function LogiCaptureV2Page() {
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const mainRef = React.useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const mainElement = mainRef.current;
    if (!mainElement) return;

    const handleScroll = () => {
      setScrollY(mainElement.scrollTop);
      setShowFloatingButton(mainElement.scrollTop > 100);
    };
    mainElement.addEventListener("scroll", handleScroll);
    return () => mainElement.removeEventListener("scroll", handleScroll);
  }, []);

  // Calcular posición dinámica (se mueve entre 30% y 70% de la pantalla)
  const dynamicY = Math.min(70, 30 + (scrollY / 10));

  // Estado del Formulario
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
  });

  const [isSearching, setIsSearching] = useState(false);
  const [validatedFields, setValidatedFields] = useState<string[]>([]);

  const handleLookup = async () => {
    const cleanBooking = formData.booking.trim().toUpperCase();
    if (!cleanBooking) {
      toast.error("Ingrese un Booking para comenzar");
      return;
    }

    setIsSearching(true);
    setValidatedFields([]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/logicapture/lookup/${cleanBooking}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Booking no encontrado");
      }
      
      const result = await response.json();
      
      setFormData(prev => ({
        ...prev,
        booking: cleanBooking,
        ordenBeta: result.orden_beta,
        dam: result.dam,
        contenedor: result.contenedor
      }));
      
      setValidatedFields(["ordenBeta", "dam", "contenedor"]);
      toast.success("Resolución de datos exitosa");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f6f8fa]">
      <AppSidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader />

        <main ref={mainRef} className="flex-1 overflow-y-auto p-10 lc-scroll pt-2">
          <div className="max-w-[1200px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            
            {/* Header de Sección Carlos Style (Sin Sticky por petición de Inge Daniel) */}
            <div className="py-6 flex flex-col md:flex-row md:items-end justify-between gap-6 transition-all duration-300">
              <div className="space-y-2">
                <div className="flex items-center gap-3 group">
                   <div className="h-10 w-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                      <Scan className="h-5 w-5" />
                   </div>
                   <h1 className="text-4xl font-extrabold tracking-tighter text-emerald-950 font-['Outfit'] group-hover:tracking-tight transition-all duration-500">
                      Logi<span className="text-emerald-500 drop-shadow-sm">Capture</span>
                   </h1>
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] ml-13">
                  Registro Operativo de Salida de Contenedores
                </p>
              </div>

              <div className="flex items-center gap-3">
                 <button className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:border-slate-200 hover:text-slate-700 transition-all duration-300 hover:scale-[1.02] active:scale-95 group">
                    <RefreshCw className="h-4 w-4 transition-transform group-hover:rotate-180 duration-500" />
                    Limpiar Pantalla
                 </button>
                 <button 
                    onClick={handleLookup}
                    disabled={isSearching}
                    className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-2xl shadow-lg text-[11px] font-black uppercase tracking-widest hover:from-emerald-700 hover:to-emerald-600 transition-all duration-300 active:scale-95 animate-venom disabled:opacity-50"
                  >
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Sparkles className="h-4 w-4 animate-pulse" />}
                    Autocompletar Inteligente
                  </button>
              </div>
            </div>

            {/* Fila 0: Inteligencia Operativa (OCR Hub Unificado) Carlos Edition */}
            <div className="bg-gradient-to-br from-[#022c22] to-slate-900 rounded-[2.5rem] p-1 shadow-2xl shadow-emerald-900/20 group overflow-hidden relative">
               {/* Efecto de Brillo de Fondo */}
               <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-1000" />
               
               <div className="bg-white/5 backdrop-blur-xl rounded-[2.4rem] p-8 md:p-12 relative z-10 border border-white/5">
                  <div className="grid grid-cols-12 gap-12 items-center">
                    
                    {/* IZQUIERDA: Terminal de Captura (Drop/Paste) */}
                    <div className="col-span-12 lg:col-span-7 space-y-6">
                       <div className="flex items-center gap-3 mb-2">
                          <Zap className="h-5 w-5 text-emerald-400 animate-pulse" />
                          <h2 className="text-xs font-black text-emerald-400/80 uppercase tracking-[0.3em]">IA Capture Terminal v2.0</h2>
                       </div>
                       
                       <div className="relative group/terminal">
                          <div className="absolute inset-0 bg-emerald-500/20 rounded-[2rem] blur-xl opacity-0 group-hover/terminal:opacity-100 transition-opacity duration-700" />
                          <div className="relative h-64 bg-[#011a14]/80 border-2 border-dashed border-emerald-500/30 rounded-[2rem] flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-emerald-400/60 transition-all group/area hover:bg-[#011a14]">
                             <div className="h-20 w-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-400 group-hover/area:scale-110 group-hover/area:bg-emerald-500 group-hover/area:text-white transition-all duration-500 shadow-inner">
                                <FileText className="h-10 w-10" />
                             </div>
                             <div className="text-center space-y-2">
                                <p className="text-base font-black text-white uppercase tracking-widest">Pegar Recorte o Soltar Imagen</p>
                                <p className="text-xs font-bold text-emerald-500/50 uppercase tracking-widest">Presiona <kbd className="bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">Ctrl + V</kbd> para procesar instantáneamente</p>
                             </div>
                             
                             {/* Lineas de Escaneo Simuladas */}
                             <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent animate-scan" />
                          </div>
                       </div>
                    </div>

                    {/* DERECHA: Centro de Mapeo y Destino */}
                    <div className="col-span-12 lg:col-span-5 space-y-8">
                       <div className="bg-[#022c22]/50 border border-white/5 rounded-3xl p-8 space-y-6">
                          <div className="space-y-1">
                             <h3 className="text-sm font-black text-white uppercase tracking-widest">Selector de Destino</h3>
                             <p className="text-xs font-bold text-emerald-500/40 uppercase tracking-widest">Elige dónde aplicar el dato extraído</p>
                          </div>
                          
                          <div className="grid grid-cols-6 gap-4">
                             {[
                                { id: "booking", label: "Booking", icon: BookOpen, span: "col-span-2" },
                                { id: "dam", label: "DAM", icon: Hash, span: "col-span-2" },
                                { id: "contenedor", label: "Contenedor", icon: Container, span: "col-span-2" },
                                { id: "tracto", label: "Placa Tracto", icon: Truck, span: "col-span-3" },
                                { id: "carreta", label: "Placa Carreta", icon: Truck, span: "col-span-3" }
                             ].map((target) => (
                                <button 
                                   key={target.id}
                                   className={cn(
                                      "flex flex-col items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-emerald-500 hover:border-emerald-400 group/btn transition-all duration-300",
                                      target.span
                                   )}
                                >
                                   <target.icon className="h-5 w-5 text-emerald-500 group-hover/btn:text-white transition-colors" />
                                   <span className="text-xs font-black text-emerald-500/70 group-hover/btn:text-white uppercase tracking-widest">{target.label}</span>
                                </button>
                             ))}
                          </div>

                          <button className="w-full py-5 bg-white text-[#022c22] rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all shadow-xl shadow-black/20">
                             Procesar con IA Avanzada
                          </button>
                       </div>
                    </div>

                  </div>
               </div>
            </div>

            {/* CUERPO DEL FORMULARIO: Columnas de Datos */}
            <div className="grid grid-cols-12 gap-8">
               
               {/* BLOQUE 1: DATOS DE EMBARQUE */}
               <div className="col-span-12 lg:col-span-6 bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
                  <div className="flex items-center gap-3 mb-10">
                     <BadgeCheck className="h-5 w-5 text-emerald-600" />
                     <h3 className="text-xs font-black text-emerald-950 uppercase tracking-[0.2em]">01. Datos de Embarque</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <FormField 
                        label="Booking / Reserva" 
                        placeholder="BK-XXXXXXXX" 
                        icon={BookOpen} 
                        value={formData.booking} 
                        onChange={(v) => updateField("booking", v)} 
                     />
                     <FormField 
                        label="Orden Beta" 
                        placeholder="O-99999" 
                        icon={Target} 
                        value={formData.ordenBeta} 
                        onChange={(v) => updateField("ordenBeta", v)} 
                        readOnly
                        success={validatedFields.includes("ordenBeta")}
                     />
                     <FormField 
                        label="Número Contenedor" 
                        placeholder="ABCD 123456-7" 
                        icon={Container} 
                        value={formData.contenedor} 
                        onChange={(v) => updateField("contenedor", v)} 
                        readOnly
                        success={validatedFields.includes("contenedor")}
                     />
                     <FormField 
                        label="Número DAM" 
                        placeholder="118-2026-XX-XXXXXX" 
                        icon={Hash} 
                        value={formData.dam} 
                        onChange={(v) => updateField("dam", v)} 
                        readOnly
                        success={validatedFields.includes("dam")}
                     />
                  </div>
               </div>

               {/* BLOQUE 2: INFORMACIÓN DE TRANSPORTE */}
               <div className="col-span-12 lg:col-span-6 bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-slate-900" />
                  <div className="flex items-center gap-3 mb-10">
                     <Truck className="h-5 w-5 text-slate-900" />
                     <h3 className="text-xs font-black text-emerald-950 uppercase tracking-[0.2em]">02. Información del Transporte</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <FormField 
                        label="DNI del Chofer" 
                        placeholder="XXXXXXXX" 
                        icon={User} 
                        value={formData.dni} 
                        onChange={(v) => updateField("dni", v)} 
                     />
                     <FormField 
                        label="Placa Tracto" 
                        placeholder="ABC-123" 
                        icon={Maximize2} 
                        value={formData.placaTracto} 
                        onChange={(v) => updateField("placaTracto", v)} 
                     />
                     <FormField 
                        label="Placa Carreta" 
                        placeholder="XYZ-987" 
                        icon={Maximize2} 
                        value={formData.placaCarreta} 
                        onChange={(v) => updateField("placaCarreta", v)} 
                     />
                     <FormField 
                        label="Empresa Transportes" 
                        placeholder="BUSCAR EMPRESA..." 
                        icon={Layers} 
                        value={formData.empresa} 
                        onChange={(v) => updateField("empresa", v)} 
                     />
                  </div>
               </div>

               {/* BLOQUE 3: PRECINTOS Y CONTROL (MULTIENTRADA) */}
                <div className="col-span-12 bg-gradient-to-br from-white to-slate-50/50 rounded-[2.5rem] border border-slate-100 p-10 shadow-sm relative transition-all duration-500 hover:shadow-xl hover:border-emerald-100 group">
                  <div className="flex items-center gap-3 mb-10">
                     <ShieldCheck className="h-5 w-5 text-emerald-600" />
                     <h3 className="text-xs font-black text-emerald-950 uppercase tracking-[0.2em]">03. Precintos y Control de Salida</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                     <MultiInput 
                        label="Precinto Aduana" 
                        placeholder="Ej: AD123" 
                        values={formData.precintoAduana} 
                        onChange={(v) => updateField("precintoAduana", v)}
                        icon={ShieldCheck}
                     />
                     <MultiInput 
                        label="Precinto Operador" 
                        placeholder="Ej: OP456" 
                        values={formData.precintoOperador} 
                        onChange={(v) => updateField("precintoOperador", v)}
                        icon={ShieldCheck}
                     />
                     <MultiInput 
                        label="Precinto SENASA" 
                        placeholder="Ej: SE789" 
                        values={formData.precintoSenasa} 
                        onChange={(v) => updateField("precintoSenasa", v)}
                        icon={BadgeCheck}
                     />
                     <MultiInput 
                        label="Precinto Línea" 
                        placeholder="Ej: LN012" 
                        values={formData.precintoLinea} 
                        onChange={(v) => updateField("precintoLinea", v)}
                        icon={Layers}
                     />
                     <MultiInput 
                        label="Precintos BETA" 
                        placeholder="Ej: BT345" 
                        values={formData.precintosBeta} 
                        onChange={(v) => updateField("precintosBeta", v)}
                        icon={Zap}
                     />
                     <MultiInput 
                        label="Termógrafos / Key" 
                        placeholder="Ej: T-9999" 
                        values={formData.termografos} 
                        onChange={(v) => updateField("termografos", v)}
                        icon={Thermometer}
                     />
                  </div>

                  {/* Acciones Finales Carlos Style */}
                  <div className="mt-16 flex items-center justify-end border-t border-slate-50 pt-10 gap-6">
                    <button className="text-[11px] font-black uppercase tracking-widest text-slate-300 hover:text-emerald-600 transition-colors duration-300">
                      Guardar como borrador
                    </button>
                    <button className="flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-emerald-950 to-slate-900 text-white rounded-[1.5rem] shadow-xl shadow-emerald-900/10 text-[12px] font-black uppercase tracking-[0.2em] hover:scale-[1.03] active:scale-95 transition-all duration-500 group overflow-hidden relative">
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                       <span className="relative z-10">Guardar y Confirmar Salida</span>
                       <ArrowRight className="h-5 w-5 text-emerald-400 group-hover:translate-x-1 transition-transform relative z-10" />
                    </button>
                  </div>
               </div>

            </div>
          </div>
        </main>
      </div>

      {/* Botón VENOM Flotante e Inteligente (Inge Daniel Edition) */}
      <div 
        style={{ top: `${dynamicY}%` }}
        className={cn(
          "fixed right-12 z-[100] transition-all duration-1000 ease-out pointer-events-none",
          showFloatingButton ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 translate-x-64"
        )}
      >
          <button 
            onClick={handleLookup}
            disabled={isSearching}
            className="group relative flex flex-col items-center gap-3 outline-none pointer-events-auto"
          >
              {/* Tooltip Venom */}
              <div className="absolute right-full mr-10 py-2.5 px-6 bg-[#022c22] text-emerald-400 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl border border-emerald-500/20 opacity-0 group-hover:opacity-100 transition-all translate-x-10 group-hover:translate-x-0 whitespace-nowrap">
                 IA Autocomplete
              </div>
              
              {/* El Botón Orgánico "Venom" */}
              <div className="h-24 w-24 bg-gradient-to-br from-emerald-600 to-emerald-400 rounded-3xl shadow-2xl shadow-emerald-500/50 flex items-center justify-center text-white animate-venom cursor-pointer hover:scale-110 active:scale-95 transition-all duration-500 disabled:opacity-50">
                 {isSearching ? <Loader2 className="h-10 w-10 animate-spin text-white" /> : <Sparkles className="h-12 w-12 animate-pulse" />}
              </div>
              
              {/* Aura Venom */}
              <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl rounded-full animate-pulse z-[-1]" />
          </button>
      </div>
    </div>
  );
}
