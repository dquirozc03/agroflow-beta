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
  Loader2,
  AlertTriangle,
  AlertCircle,
  Info,
  Ship,
  Plane,
  ShieldAlert,
  Calendar as CalendarIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// --- Componentes UX Premium Carlos Style ---

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
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (readOnly) return;
    if (e.key === "Enter") {
      const cleanValue = inputValue.trim().toUpperCase();
      if (!cleanValue) return;

      e.preventDefault();
      // Silencioso: Solo añade si no existe, limpia en cualquier caso
      if (!values.includes(cleanValue)) {
        onChange([...values, cleanValue]);
      }
      setInputValue("");
      
      // Asegurar que el foco se mantenga para el siguiente escaneo (pistola modo ráfaga)
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
      <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-emerald-500 transition-colors">
        {label}
      </label>
      <div className="bg-white border border-slate-100 rounded-2xl p-2 min-h-[56px] flex flex-wrap gap-2 items-center transition-all duration-300 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 hover:border-emerald-200 shadow-sm hover:shadow-md hover:scale-[1.01]">
        <div className="pl-3 pr-1 text-slate-300">
          <Icon className="h-4 w-4" />
        </div>
        {values.map((v, i) => {
          const isDuplicated = duplicatedValues.includes(v);
          return (
            <div key={i} className={cn(
               "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold animate-in zoom-in-95 duration-200 border",
               isDuplicated 
                  ? "bg-rose-50 border-rose-200 text-rose-700 animate-pulse shadow-sm shadow-rose-100" 
                  : "bg-emerald-50 border-emerald-100 text-emerald-700"
            )}>
               {v}
               <button onClick={() => removeValue(i)} className="hover:text-emerald-900 transition-colors">
                  <X className="h-3 w-3" />
               </button>
            </div>
          );
        })}
        <input
          ref={inputRef}
          autoFocus={autoFocus}
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
  error?: boolean;
  errorMsg?: string;
  onBlur?: () => void;
  helperText?: string;
  highlightError?: boolean;
}

function FormField({ label, placeholder, icon: Icon, value, onChange, readOnly, success, loading, error, errorMsg, onBlur, helperText, highlightError }: FormFieldProps) {
  return (
    <div className="space-y-3 group/field">
      <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-emerald-500 transition-colors">
        {label}
      </label>
      <div className={cn("relative group/input", (error || highlightError) && "z-20 hover:z-30")}>
        <div className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 transition-colors z-10",
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
            "w-full border rounded-2xl py-4 pl-11 pr-12 text-base font-medium transition-all duration-300 shadow-sm outline-none",
            readOnly ? "bg-slate-50/50 text-slate-500 cursor-not-allowed border-slate-100" : "bg-white border-slate-100 text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hover:shadow-md hover:border-emerald-100 focus:scale-[1.01]",
            success && !error && !highlightError && "border-emerald-500 ring-2 ring-emerald-500/5 bg-emerald-50/10 text-emerald-700 font-bold",
            (error || highlightError) && "border-rose-500 ring-2 ring-rose-500/5 bg-rose-50/10 text-rose-800"
          )}
        />
        {success && !error && !highlightError && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 animate-in zoom-in-50">
             <CheckCircle2 className="h-5 w-5" />
          </div>
        )}
        {error && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 group/tooltip inline-block">
             <AlertTriangle className="h-5 w-5 text-rose-500 animate-pulse cursor-help" />
             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2 bg-rose-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl opacity-0 group-hover/tooltip:opacity-100 transition-all scale-75 group-hover/tooltip:scale-100 pointer-events-none whitespace-nowrap z-[100] origin-bottom">
                {errorMsg}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-rose-950" />
             </div>
          </div>
        )}
        {helperText && !error && !loading && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-5 py-3 bg-[#022c22] backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-[10px] font-black tracking-[0.15em] uppercase rounded-2xl shadow-2xl opacity-0 scale-90 -translate-y-2 group-hover/input:opacity-100 group-hover/input:scale-100 group-hover/input:translate-y-0 pointer-events-none transition-all duration-300 z-[110] whitespace-nowrap origin-bottom">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-scan-slow opacity-10" />
             <div className="flex items-center gap-2 relative z-10">
                <CheckCircle2 className="h-3 w-3" />
                <span>{helperText}</span>
             </div>
             <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#022c22]" />
          </div>
        )}
      </div>
    </div>
  );
}

function SuccessModal({ isOpen, onClose, title }: { isOpen: boolean, onClose: () => void, title: string }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
       <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
       <div className="relative bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(2,44,34,0.3)] p-12 max-w-md w-full border border-emerald-50 text-center space-y-8 animate-in zoom-in-95 slide-in-from-bottom-12 duration-700 ease-out">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto relative group">
             <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20 group-hover:opacity-40 transition-opacity" />
             <CheckCircle2 className="h-12 w-12 text-emerald-600 relative z-10 animate-in zoom-in-50 duration-500" />
          </div>
          <div className="space-y-3">
             <h2 className="text-3xl font-black text-emerald-950 tracking-tighter">¡Operación Exitosa!</h2>
             <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">Registro: {title}</p>
          </div>
          <button 
             onClick={onClose}
             className="w-full py-5 bg-emerald-950 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-900/20 active:scale-95"
          >
             Continuar Operación
          </button>
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

  const dynamicY = Math.min(70, 30 + (scrollY / 10));

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
    codigo_sap: "",
    ruc_transportista: "",
    marca_tracto: "",
    cert_tracto: "",
    cert_carreta: "",
    fecha_embarque: new Date().toISOString(),
    nombreChofer: "",
    licenciaChofer: "",
    partidaRegistral: ""
  });

  const [isSearching, setIsSearching] = useState(false);
  const [validatedFields, setValidatedFields] = useState<string[]>([]);
  const [bookingError, setBookingError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [duplicatedCodes, setDuplicatedCodes] = useState<string[]>([]);
  const [isLoadingVehiculo, setIsLoadingVehiculo] = useState(false);
  const [isLoadingChofer, setIsLoadingChofer] = useState(false);
  const [isLoadingCarreta, setIsLoadingCarreta] = useState(false);
  const [transportMode, setTransportMode] = useState<"maritimo" | "terrestre" | "aereo">("maritimo");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTitle, setSuccessTitle] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editField, setEditField] = useState<string>("none");

  const AUDIT_OPTIONS = [
    { id: "none", label: "Solo Lectura" },
    { id: "precintos", label: "Corregir Precintos" },
    { id: "transporte", label: "Corregir Transporte (Placas/Chofer)" },
    { id: "fecha", label: "Corregir Fecha de Embarque" },
    { id: "termografos", label: "Corregir Termógrafos" }
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("edit");
    if (id) {
      setEditId(id);
      loadRegistroForEdit(id);
    }
  }, []);

  const loadRegistroForEdit = async (id: string) => {
    setIsSearching(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/logicapture/registros/${id}`);
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setFormData({
        booking: data.booking,
        ordenBeta: data.orden_beta,
        contenedor: data.contenedor,
        dam: data.dam,
        dni: data.dni_chofer,
        placaTracto: data.placa_tracto,
        placaCarreta: data.placa_carreta,
        empresa: data.empresa_transporte,
        precintoAduana: data.precinto_aduana || [],
        precintoOperador: data.precinto_operador || [],
        precintoSenasa: data.precinto_senasa || [],
        precintoLinea: data.precinto_linea || [],
        precintosBeta: data.precintos_beta || [],
        termografos: data.termografos || [],
        tratamientoBuque: data.is_maritimo || false,
        planta: data.planta || "",
        cultivo: data.cultivo || "",
        codigo_sap: data.codigo_sap || "",
        ruc_transportista: data.ruc_transportista || "",
        marca_tracto: data.marca_tracto || "",
        cert_tracto: data.cert_tracto || "",
        cert_carreta: data.cert_carreta || "",
        fecha_embarque: data.fecha_registro,
        nombreChofer: data.nombre_chofer || "",
        licenciaChofer: data.licencia_chofer || "",
        partidaRegistral: data.partida_registral || ""
      });
      setValidatedFields(["booking", "ordenBeta", "contenedor", "dam", "dni", "placaTracto", "placaCarreta"]);
      toast.success("Información cargada para Auditoría");
    } catch (e) {
      toast.error("No se pudo cargar el registro para edición");
    } finally {
      setIsSearching(false);
    }
  };

  const handleLookup = async () => {
    const cleanBooking = formData.booking.trim().toUpperCase();
    if (!cleanBooking) {
      toast.error("Ingrese un Booking para comenzar");
      return;
    }
    setIsSearching(true);
    setValidatedFields([]);
    setBookingError(false);
    setFieldErrors({});
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/logicapture/lookup/${cleanBooking}`);
      if (!response.ok) {
        setBookingError(true);
        setIsSearching(false);
        return;
      }
      const result = await response.json();
      let cleanDam = result.dam;
      if (cleanDam && cleanDam.includes("-")) {
        const parts = cleanDam.split("-");
        const suffix = parts[parts.length - 1];
        parts[parts.length - 1] = suffix.replace(/^0+(?!$)/, "");
        cleanDam = parts.join("-");
      }
      setFormData(prev => ({
        ...prev,
        booking: cleanBooking,
        ordenBeta: result.orden_beta || "",
        dam: cleanDam || "",
        contenedor: result.contenedor || "",
        planta: result.planta || "",
        cultivo: result.cultivo || "",
      }));
      const found: string[] = [];
      if (result.orden_beta) found.push("ordenBeta");
      if (result.contenedor) found.push("contenedor");
      if (result.dam) found.push("dam");
      setValidatedFields(found);
    } catch (error: any) {
      setBookingError(true);
    } finally {
      setIsSearching(false);
    }
  };

  const updateField = (field: string, value: any) => {
    if (field === "booking") setBookingError(false);
    setValidatedFields(prev => prev.filter(f => f !== field));
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChoferBlurWithVal = async (val?: string) => {
    const dni = (val || formData.dni || "").trim();
    if (!dni) return;
    setIsLoadingChofer(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/logicapture/driver/${dni}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      updateField("nombreChofer", data.nombre_operativo);
      updateField("licenciaChofer", data.licencia);
      setFieldErrors(prev => ({ ...prev, dni_info: `CHOFER: ${data.nombre_operativo}` }));
    } catch (e) {
      setFieldErrors(prev => ({ ...prev, dni: "Chofer no registrado" }));
    } finally {
      setIsLoadingChofer(false);
    }
  };

  const handleVehiculoBlurWithVal = async (val?: string) => {
    const placa = (val || formData.placaTracto || "").trim().toUpperCase().replace(/-/g, "");
    if (!placa) return;
    setIsLoadingVehiculo(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/logicapture/vehicle/${placa}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setFormData(prev => ({
        ...prev,
        empresa: data.transportista.nombre_transportista,
        ruc_transportista: data.transportista.ruc_transportista,
        marca_tracto: data.marca,
        cert_tracto: data.configuracion_vehicular,
        codigo_sap: data.transportista.codigo_sap,
        partidaRegistral: data.transportista.partida_registral
      }));
      setFieldErrors(prev => ({ ...prev, empresa_info: `TRANSPORTISTA: ${data.transportista.nombre_transportista}` }));
    } catch (e) {
      setFieldErrors(prev => ({ ...prev, placaTracto: "Placa no registrada" }));
    } finally {
      setIsLoadingVehiculo(false);
    }
  };

  const handleCarretaBlurWithVal = async (val?: string) => {
    const placa = (val || formData.placaCarreta || "").trim().toUpperCase().replace(/-/g, "");
    if (!placa) return;
    setIsLoadingCarreta(true);
    try {
      await fetch(`${API_BASE_URL}/api/v1/logicapture/trailer/${placa}`);
    } catch (e) {} finally {
      setIsLoadingCarreta(false);
    }
  };

  const handleFieldBlur = async (field: string, value: string) => {
    const cleanVal = (value || "").trim().toUpperCase();
    if (!cleanVal || !["booking", "dam", "contenedor"].includes(field)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/logicapture/check_unique?field=${field}&value=${cleanVal}`);
      const data = await response.json();
      if (data.exists) {
        setFieldErrors(prev => ({ ...prev, [field]: `Duplicado en #${data.id}` }));
      }
    } catch (e) {}
  };

  const validateSeal = async (field: keyof typeof formData, newValues: string[]) => {
    updateField(field as string, newValues);
  };

  const handleSaveDraft = () => {
    localStorage.setItem("logicapture_draft", JSON.stringify({ formData, validatedFields }));
    toast.info("Borrador local guardado");
  };

  useEffect(() => {
    const draft = localStorage.getItem("logicapture_draft");
    if (draft && !editId) {
      const parsed = JSON.parse(draft);
      setFormData(parsed.formData);
      setValidatedFields(parsed.validatedFields || []);
      toast.success("Borrador recuperado");
    }
  }, [editId]);

  const handleSave = async () => {
    setIsSearching(true);
    setServerError(null);
    try {
      const url = editId ? `${API_BASE_URL}/api/v1/logicapture/registros/${editId}` : `${API_BASE_URL}/api/v1/logicapture/register`;
      const response = await fetch(url, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, status: "PROCESADO" })
      });
      if (!response.ok) {
        const err = await response.json();
        setServerError(err.detail || "Error al procesar");
        return;
      }
      setSuccessTitle(formData.ordenBeta || "REGISTRO");
      setShowSuccess(true);
      localStorage.removeItem("logicapture_draft");
    } catch (e) {
      setServerError("Error de red");
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
     window.location.reload();
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f6f8fa]">
      <AppSidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader />
        <main ref={mainRef} className="flex-1 overflow-y-auto p-10 lc-scroll pt-2">
          <div className="max-w-[1200px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            
            <div className="py-6 flex flex-col md:flex-row md:items-end justify-between gap-6 transition-all duration-300">
              <div className="space-y-2">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                       <Scan className="h-5 w-5" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tighter text-emerald-950">
                       Logi<span className="text-emerald-500">Capture</span>
                    </h1>
                 </div>
                 <p className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-13">
                    {editId ? "Modo Auditoría" : "Registro Operativo"}
                 </p>
              </div>

              <div className="flex bg-white p-2 rounded-[1.8rem] border border-slate-100 shadow-sm gap-2">
                {[
                  { id: "maritimo", icon: Ship, label: "Marítimo" },
                  { id: "terrestre", icon: Truck, label: "Terrestre" }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setTransportMode(mode.id as any)}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 rounded-2xl transition-all",
                      transportMode === mode.id ? "bg-emerald-950 text-white shadow-xl" : "text-slate-400"
                    )}
                  >
                    <mode.icon className="h-5 w-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{mode.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                 <Button onClick={handleReset} variant="outline" className="rounded-2xl h-14 px-6 uppercase font-black tracking-widest text-[10px]">Limpiar</Button>
                 <Button onClick={handleLookup} disabled={isSearching} className="rounded-2xl h-14 px-8 bg-emerald-600 hover:bg-emerald-700 uppercase font-black tracking-widest text-[10px]">Autocompletar</Button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
               <div className="col-span-12 bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                      <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                         <Search className="h-5 w-5 text-emerald-600" />
                      </div>
                      <h3 className="text-xs font-black text-emerald-950 uppercase tracking-widest">01. Identificadores</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                     <FormField label="Booking" placeholder="BK-123" icon={Search} value={formData.booking} onChange={(v) => updateField("booking", v)} onBlur={handleLookup} error={bookingError} />
                     <FormField label="Orden Beta" placeholder="O-123" icon={Hash} value={formData.ordenBeta} onChange={(v) => updateField("ordenBeta", v)} readOnly />
                     <FormField label="Contenedor" placeholder="CONT-123" icon={Container} value={formData.contenedor} onChange={(v) => updateField("contenedor", v)} readOnly />
                     <FormField label="DAM" placeholder="DAM-123" icon={FileText} value={formData.dam} onChange={(v) => updateField("dam", v)} readOnly />
                  </div>
               </div>

               <div className="col-span-12 bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                      <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center">
                         <Truck className="h-5 w-5 text-slate-600" />
                      </div>
                      <h3 className="text-xs font-black text-emerald-950 uppercase tracking-widest">02. Transporte</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                     <FormField label="DNI Chofer" placeholder="12345678" icon={User} value={formData.dni} onChange={(v) => updateField("dni", v)} onBlur={() => handleChoferBlurWithVal()} helperText={fieldErrors.dni_info} />
                     <FormField label="Placa Tracto" placeholder="ABC-123" icon={Maximize2} value={formData.placaTracto} onChange={(v) => updateField("placaTracto", v)} onBlur={() => handleVehiculoBlurWithVal()} />
                     <FormField label="Placa Carreta" placeholder="XYZ-987" icon={Maximize2} value={formData.placaCarreta} onChange={(v) => updateField("placaCarreta", v)} onBlur={() => handleCarretaBlurWithVal()} />
                     <FormField label="Empresa" placeholder="Transportista..." icon={Layers} value={formData.empresa} onChange={() => {}} readOnly helperText={fieldErrors.empresa_info} />
                  </div>
               </div>

               <div className="col-span-12 bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                      <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                         <ShieldCheck className="h-5 w-5 text-emerald-600" />
                      </div>
                      <h3 className="text-xs font-black text-emerald-950 uppercase tracking-widest">03. Precintos</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <MultiInput label="Aduana" placeholder="ADD" icon={ShieldCheck} values={formData.precintoAduana} onChange={(v) => validateSeal("precintoAduana", v)} />
                     <MultiInput label="Operador" placeholder="OPP" icon={ShieldCheck} values={formData.precintoOperador} onChange={(v) => validateSeal("precintoOperador", v)} />
                     <MultiInput label="SENASA" placeholder="SEN" icon={BadgeCheck} values={formData.precintoSenasa} onChange={(v) => validateSeal("precintoSenasa", v)} />
                     <MultiInput label="Línea" placeholder="LIN" icon={Layers} values={formData.precintoLinea} onChange={(v) => validateSeal("precintoLinea", v)} />
                     <MultiInput label="BETA" placeholder="BET" icon={Zap} values={formData.precintosBeta} onChange={(v) => validateSeal("precintosBeta", v)} />
                     <MultiInput label="Termógrafos" placeholder="TERM" icon={Thermometer} values={formData.termografos} onChange={(v) => validateSeal("termografos", v)} />
                  </div>

                  <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-8 border-t border-slate-100 pt-10">
                     <div className="flex-1">
                        {serverError && <p className="text-rose-600 text-xs font-bold uppercase tracking-widest flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {serverError}</p>}
                        {isSearching && <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest animate-pulse flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Procesando...</p>}
                     </div>
                     <div className="flex items-center gap-4">
                        <button onClick={handleSaveDraft} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-all">Pausar Borrador</button>
                        <Button 
                           onClick={handleSave} 
                           disabled={isSearching || (validatedFields.length < 3 && !editId)}
                           className="h-20 px-12 bg-emerald-950 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-emerald-800 transition-all shadow-2xl shadow-emerald-900/20"
                        >
                           Finalizar Salida Operativa
                        </Button>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </main>
      </div>

      <div 
        style={{ top: `${dynamicY}%` }}
        className={cn(
          "fixed right-12 z-[100] transition-all duration-1000 ease-out",
          showFloatingButton ? "opacity-100 translate-x-0" : "opacity-0 translate-x-64 pointer-events-none"
        )}
      >
          <button onClick={handleLookup} className="h-24 w-24 bg-emerald-500 rounded-3xl shadow-2xl flex items-center justify-center text-white animate-venom hover:scale-110 active:scale-95 transition-all">
             {isSearching ? <Loader2 className="h-10 w-10 animate-spin" /> : <Sparkles className="h-12 w-12 animate-pulse" />}
          </button>
      </div>

      <SuccessModal isOpen={showSuccess} onClose={() => window.location.href="/logicapture/bandeja"} title={successTitle} />
    </div>
  );
}
