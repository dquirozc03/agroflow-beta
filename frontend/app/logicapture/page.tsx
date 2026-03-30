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
  Plane
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
  autoFocus?: boolean;
  duplicatedValues?: string[];
}

function MultiInput({ label, placeholder, values, onChange, icon: Icon, autoFocus, duplicatedValues = [] }: MultiInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
             {/* Tooltip Alert Style */}
             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2 bg-rose-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl opacity-0 group-hover/tooltip:opacity-100 transition-all scale-75 group-hover/tooltip:scale-100 pointer-events-none whitespace-nowrap z-[100] origin-bottom">
                {errorMsg}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-rose-950" />
             </div>
          </div>
        )}

        {/* Tooltip de Información Adicional (Helper) */}
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

        {/* Tooltip Premium para Datos (Solo si el dato es largo y no hay error) */}
        {value && value.length > 14 && !error && !loading && !helperText && (
          <div className="absolute top-[110%] left-1/2 -translate-x-1/2 px-5 py-3 bg-emerald-950/90 backdrop-blur-md border border-emerald-500/20 text-emerald-400 text-xs font-black tracking-widest uppercase rounded-2xl shadow-2xl opacity-0 scale-90 translate-y-2 group-hover/input:opacity-100 group-hover/input:scale-100 group-hover/input:translate-y-0 pointer-events-none transition-all duration-300 z-[100] whitespace-nowrap origin-top overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-scan-slow opacity-20" />
             <span className="relative z-10">{value}</span>
             <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-emerald-950/90" />
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
    tratamientoBuque: false,
    // Datos de Trazabilidad SAP/Auditoría
    nombreChofer: "",
    licenciaChofer: "",
    marca_tracto: "",
    cert_tracto: "",
    cert_carreta: "",
    codigo_sap: "",
    partidaRegistral: "",
    ruc_transportista: "",
    planta: "",
    cultivo: "",
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
        // Limpiar campos para evitar confusión con el booking anterior
        setFormData(prev => ({
          ...prev,
          ordenBeta: "",
          dam: "",
          contenedor: ""
        }));
        return;
      }
      
      const result = await response.json();
      
      // Sanitización de DAM Carlos Style (quitar ceros a la izquierda del último segmento)
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
        codigo_sap: result.codigo_sap || ""
      }));
      
      const found: string[] = [];
      const errors: { [key: string]: string } = {};

      if (result.orden_beta) found.push("ordenBeta");
      else errors.ordenBeta = "No se encontró Orden Beta en el Posicionamiento";

      if (result.contenedor) found.push("contenedor");
      else errors.contenedor = "No se encontró Contenedor en Datos Maestros";

      if (result.dam) found.push("dam");
      else errors.dam = "No se encontró DAM en el Control de Embarque";

      setValidatedFields(found);
      setFieldErrors(errors);

      setFieldErrors(errors);

      if (found.length < 3) {
        // En lugar de toast, los errores ya están en fieldErrors
      }
    } catch (error: any) {
      setBookingError(true);
    } finally {
      setIsSearching(false);
    }
  };

  const updateField = (field: string, value: any) => {
    if (field === "booking") setBookingError(false);
    
    // Al editar un campo, deja de estar validado hasta el siguiente blur/lookup
    setValidatedFields(prev => prev.filter(f => f !== field));
    
    // Al borrar placa, limpiar empresa y su info de forma reactiva
    if (field === "placaTracto" && !value) {
      setFormData(prev => ({ 
        ...prev, 
        empresa: "",
        marca_tracto: "",
        cert_tracto: "",
        codigo_sap: "",
        partidaRegistral: "",
        ruc_transportista: ""
      }));
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.empresa_info;
        return next;
      });
    }

    // Al borrar DNI, limpiar su info reactivada
    if (field === "dni" && !value) {
      setFormData(prev => ({
        ...prev,
        nombreChofer: "",
        licenciaChofer: ""
      }));
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.dni_info;
        return next;
      });
    }

    // Limpiar error específico al editar
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newState = { ...prev };
        delete newState[field];
        return newState;
      });
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVehiculoBlur = async () => {
    const placa = (formData.placaTracto || "").trim().toUpperCase().replace(/-/g, "");
    if (!placa) return;

    setIsLoadingVehiculo(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/logicapture/vehicle/${placa}`);
      if (!response.ok) throw new Error("Placa no registrada en maestros");
      const data = await response.json();
      if (!data || !data.transportista) throw new Error("Datos de vehículo incompletos");
      
      setFormData(prev => ({
        ...prev,
        empresa: data.transportista,
        marca_tracto: data.marca,
        cert_tracto: data.configuracion_vehicular,
        codigoSap: data.codigo_sap,
        partidaRegistral: data.partida_registral,
        ruc_transportista: data.ruc_transportista
      }));
      setFieldErrors(prev => ({ ...prev, empresa_info: `TRANSPORTISTA: ${data.transportista}` }));
    } catch (error: any) {
      setFieldErrors(prev => ({ ...prev, placaTracto: error.message || "Placa no registrada en maestros" }));
      updateField("empresa", "");
    } finally {
      setIsLoadingVehiculo(false);
    }
  };

  const handleChoferBlur = async () => {
    const dni = (formData.dni || "").trim();
    if (!dni) return;

    setIsLoadingChofer(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/logicapture/driver/${dni}`);
      if (!response.ok) throw new Error("DNI no registrado en el sistema de maestros");
      const data = await response.json();
      if (!data) throw new Error("Datos de chofer no encontrados");
      
      setFormData(prev => ({
        ...prev,
        nombreChofer: data.nombre_operativo || `${data.nombres || ""} ${data.apellido_paterno || ""}`.trim(),
        licenciaChofer: data.licencia
      }));
      setFieldErrors(prev => ({ ...prev, dni_info: `CHOFER: ${data.nombre_operativo || data.nombres}` }));
    } catch (error: any) {
      setFieldErrors(prev => ({ ...prev, dni: error.message || "Chofer no registrado en maestros" }));
    } finally {
      setIsLoadingChofer(false);
    }
  };

  const handleFieldBlur = async (field: string, value: string) => {
    const cleanVal = (value || "").trim().toUpperCase();
    if (!cleanVal) return;

    // Solo validamos duplicados para campos clave de logicapture_registros
    if (!["booking", "dam", "contenedor"].includes(field)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/logicapture/check_unique?field=${field}&value=${cleanVal}&treatment_buque=${formData.tratamientoBuque}`);
      if (!response.ok) return;
      const data = await response.json();
      
      if (data.exists) {
         setFieldErrors(prev => ({ 
            ...prev, 
            [field]: `Dato Duplicado: Ya existe en registro #${data.id}` 
         }));
         // Quitamos de validados si es duplicado
         setValidatedFields(prev => prev.filter(f => f !== field));
      } else {
         // Si existía un error previo de duplicado para este campo, lo borramos
         setFieldErrors(prev => {
            const next = { ...prev };
            if (next[field]?.includes("Duplicado")) delete next[field];
            return next;
         });
         // Marcamos como validado
         setValidatedFields(prev => [...new Set([...prev, field])]);
      }
    } catch (error) {
       console.error("Error check unique", error);
    }
  };

  const validateSeal = async (field: keyof typeof formData, newValues: string[]) => {
    const oldValues = formData[field] as string[];
    updateField(field as string, newValues);

    // Si el array creció, validamos el último elemento
    if (newValues.length > oldValues.length) {
       const lastValue = newValues[newValues.length - 1];
       try {
          const response = await fetch(`${API_BASE_URL}/api/v1/logicapture/check_unique?field=precinto&value=${lastValue}`);
          if (!response.ok) return;
          const data = await response.json();
          if (data.exists) {
             setDuplicatedCodes(prev => [...new Set([...prev, lastValue])]);
             setFieldErrors(prev => ({ ...prev, [field]: `Precinto Duplicado: ${lastValue}` }));
          } else {
             setFieldErrors(prev => {
                const n = { ...prev };
                delete n[field];
                return n;
             });
          }
       } catch (e) { console.error(e); }
    }
  };

  const handleCarretaBlur = async () => {
    const placa = (formData.placaCarreta || "").trim().toUpperCase().replace(/-/g, "");
    if (!placa) return;

    setIsLoadingCarreta(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/logicapture/trailer/${placa}`);
      if (!response.ok) throw new Error("Carreta no registrada en maestros");
      const data = await response.json();
      if (!data) throw new Error("Datos de carreta no encontrados");
      
      setFormData(prev => ({
        ...prev,
        cert_carreta: data.configuracion_vehicular
      }));
    } catch (error: any) {
      setFieldErrors(prev => ({ ...prev, placaCarreta: error.message || "Carreta no registrada en maestros" }));
    } finally {
      setIsLoadingCarreta(false);
    }
  };

  const handleSaveDraft = () => {
    localStorage.setItem("logicapture_draft", JSON.stringify({
      formData,
      validatedFields,
      fieldErrors,
      transportMode
    }));
    toast.info("Borrador guardado localmente (Congelado)");
  };

  useEffect(() => {
    const draft = localStorage.getItem("logicapture_draft");
    if (draft) {
      const parsed = JSON.parse(draft);
      setFormData(parsed.formData);
      setValidatedFields(parsed.validatedFields || []);
      setFieldErrors(parsed.fieldErrors || {});
      setTransportMode(parsed.transportMode || "maritimo");
      toast.success("Borrador recuperado automáticamente");
    }
  }, []);

  const handleSave = async () => {
    setServerError(null);

    // Sanitización de campos opcionales por defecto (**)
    const payload = {
       ...formData,
       precintoOperador: formData.precintoOperador.length === 0 ? ["**"] : formData.precintoOperador,
       precintoSenasa: formData.precintoSenasa.length === 0 ? ["**"] : formData.precintoSenasa
    };

    setIsSearching(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/logicapture/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
         const errData = await response.json();
         setServerError(errData.detail || "Hubo un problema al procesar el registro. Verifique los datos.");
         return;
      }
      
      const resData = await response.json();
      setSuccessTitle(formData.ordenBeta || formData.contenedor);
      setShowSuccess(true);
      // Mantenemos la data visible por petición del usuario
    } catch (error: any) {
      setServerError("Error de conexión con el servidor. Intente nuevamente en unos momentos.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setFormData({
      booking: "",
      ordenBeta: "",
      contenedor: "",
      dam: "",
      dni: "",
      placaTracto: "",
      placaCarreta: "",
      empresa: "",
      precintoAduana: [],
      precintoOperador: [],
      precintoSenasa: [],
      precintoLinea: [],
      precintosBeta: [],
      termografos: [],
      tratamientoBuque: false,
      nombreChofer: "",
      licenciaChofer: "",
      marca_tracto: "",
      cert_tracto: "",
      cert_carreta: "",
      codigoSap: "",
      partidaRegistral: "",
      ruc_transportista: "",
      planta: "",
      cultivo: "",
    });
    setValidatedFields([]);
    setFieldErrors({});
    setBookingError(false);
    setServerError(null);
    localStorage.removeItem("logicapture_draft");
    toast.info("Pantalla Limpia", { description: "Datos y borrador eliminados" });
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
                  Registro Operativo de Salida - Fase 3
                </p>
              </div>

              {/* Selector de Modalidad Carlos Style */}
              <div className="flex bg-white/50 backdrop-blur-sm p-2 rounded-[1.8rem] border border-slate-100 shadow-sm gap-2">
                {[
                  { id: "maritimo", icon: Ship, label: "Marítimo" },
                  { id: "terrestre", icon: Truck, label: "Terrestre" },
                  { id: "aereo", icon: Plane, label: "Aéreo" }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setTransportMode(mode.id as any)}
                    className={cn(
                      "group relative flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-500 overflow-hidden",
                      transportMode === mode.id 
                        ? "bg-emerald-950 text-white shadow-xl shadow-emerald-900/10 scale-105" 
                        : "hover:bg-emerald-50 text-slate-400 hover:text-emerald-700"
                    )}
                  >
                    <mode.icon className={cn("h-5 w-5 transition-transform duration-500 group-hover:scale-110", transportMode === mode.id ? "text-emerald-400" : "")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{mode.label}</span>
                    {transportMode === mode.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-scan-slow opacity-30" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                 <button 
                    onClick={handleReset}
                    className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:border-slate-200 hover:text-slate-700 transition-all duration-300 hover:scale-[1.02] active:scale-95 group"
                 >
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
            <div className="grid grid-cols-12 gap-6">
               
                {/* BLOQUE 1: DATOS DE EMBARQUE */}
                <div className="col-span-12 lg:col-span-6 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative">
                   <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500 rounded-l-3xl" />
                   <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-3">
                            <BadgeCheck className="h-5 w-5 text-emerald-600" />
                            <h3 className="text-xs font-black text-emerald-950 uppercase tracking-[0.2em]">01. Datos de Embarque</h3>
                         </div>
                         
                         {/* Toggle Tratamiento en Buque (Compacto en Cabecera) */}
                         {transportMode === "maritimo" && (
                           <button 
                              onClick={() => updateField("tratamientoBuque", !formData.tratamientoBuque)}
                              className={cn(
                                 "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 border",
                                 formData.tratamientoBuque 
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm" 
                                    : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200"
                              )}
                           >
                              <div className={cn(
                                 "w-2 h-2 rounded-full",
                                 formData.tratamientoBuque ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                              )} />
                              <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Tratamiento en Buque</span>
                           </button>
                         )}
                      </div>
                      
                      {/* Oráculo de Unicidad: Alerta Centralizada */}
                      {(fieldErrors.booking || fieldErrors.ordenBeta || fieldErrors.contenedor || fieldErrors.dam) && (
                        <div className="bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-500 max-w-[200px]">
                           <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                           <span className="text-[9px] font-black text-rose-600 uppercase tracking-tight truncate">
                              {fieldErrors.booking || fieldErrors.ordenBeta || fieldErrors.contenedor || fieldErrors.dam}
                           </span>
                        </div>
                      )}
                   </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField 
                        label="Booking / Reserva" 
                        placeholder="BK-XXXXXXXX" 
                        icon={BookOpen} 
                        value={formData.booking} 
                        onChange={(v) => updateField("booking", v)} 
                        onBlur={() => handleFieldBlur("booking", formData.booking)}
                        error={bookingError}
                        errorMsg="Booking no registrado en posicionamiento"
                        highlightError={!!fieldErrors.booking}
                     />
                     <FormField 
                        label="Orden Beta" 
                        placeholder="O-99999" 
                        icon={Target} 
                        value={formData.ordenBeta} 
                        onChange={(v) => updateField("ordenBeta", v)} 
                        onBlur={() => handleFieldBlur("ordenBeta", formData.ordenBeta)}
                        readOnly
                        success={validatedFields.includes("ordenBeta")}
                        highlightError={!!fieldErrors.ordenBeta}
                     />
                     <FormField 
                        label="Número Contenedor" 
                        placeholder="ABCD 123456-7" 
                        icon={Container} 
                        value={formData.contenedor} 
                        onChange={(v) => updateField("contenedor", v)} 
                        onBlur={() => handleFieldBlur("contenedor", formData.contenedor)}
                        readOnly
                        success={validatedFields.includes("contenedor")}
                        highlightError={!!fieldErrors.contenedor}
                     />
                     <FormField 
                        label="Número DAM" 
                        placeholder="118-2026-XX-XXXXXX" 
                        icon={Hash} 
                        value={formData.dam} 
                        onChange={(v) => updateField("dam", v)} 
                        onBlur={() => handleFieldBlur("dam", formData.dam)}
                        readOnly
                        success={validatedFields.includes("dam")}
                        highlightError={!!fieldErrors.dam}
                     />
                  </div>
               </div>

               {/* BLOQUE 2: INFORMACIÓN DE TRANSPORTE */}
               <div className="col-span-12 lg:col-span-6 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative">
                  <div className="absolute top-0 left-0 w-2 h-full bg-slate-900 rounded-l-3xl" />
                  <div className="flex items-center gap-3 mb-5">
                     <Truck className="h-5 w-5 text-slate-900" />
                     <h3 className="text-xs font-black text-emerald-950 uppercase tracking-[0.2em]">02. Información del Transporte</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField 
                        label="DNI del Chofer" 
                        placeholder="XXXXXXXX" 
                        icon={User} 
                        value={formData.dni} 
                        onChange={(v) => updateField("dni", v)} 
                        onBlur={handleChoferBlur}
                        loading={isLoadingChofer}
                        error={!!fieldErrors.dni}
                        errorMsg={fieldErrors.dni}
                        helperText={fieldErrors.dni_info}
                     />
                     <FormField 
                        label="Placa Tracto" 
                        placeholder="ABC-123" 
                        icon={Maximize2} 
                        value={formData.placaTracto} 
                        onChange={(v) => updateField("placaTracto", v)} 
                        onBlur={handleVehiculoBlur}
                        loading={isLoadingVehiculo}
                        error={!!fieldErrors.placaTracto}
                        errorMsg={fieldErrors.placaTracto}
                     />
                     <FormField 
                        label="Placa Carreta" 
                        placeholder="XYZ-987" 
                        icon={Maximize2} 
                        value={formData.placaCarreta} 
                        onChange={(v) => updateField("placaCarreta", v)} 
                        onBlur={handleCarretaBlur}
                        loading={isLoadingCarreta}
                        error={!!fieldErrors.placaCarreta}
                        errorMsg={fieldErrors.placaCarreta}
                     />
                     <FormField 
                        label="Empresa Transportes" 
                        placeholder="AUTOMÁTICO..." 
                        icon={Layers} 
                        value={formData.empresa} 
                        onChange={(v) => updateField("empresa", v)} 
                        readOnly
                        helperText={fieldErrors.empresa_info}
                     />
                  </div>
               </div>

               {/* BLOQUE 3: PRECINTOS Y CONTROL (MULTIENTRADA) */}
                <div className="col-span-12 bg-gradient-to-br from-white to-slate-50/50 rounded-3xl border border-slate-100 p-6 shadow-sm relative transition-all duration-500 hover:shadow-xl hover:border-emerald-100 group">
                  <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                         <ShieldCheck className="h-5 w-5 text-emerald-600" />
                         <h3 className="text-xs font-black text-emerald-950 uppercase tracking-[0.2em]">03. Precintos y Control de Salida</h3>
                      </div>
                      {/* Espacio para estatus de la sección */}
                      {serverError && (
                         <div className="flex items-center gap-2 text-rose-500 animate-in slide-in-from-right-4 duration-500">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Problema Detectado</span>
                         </div>
                      )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     <MultiInput 
                        label="Precinto Aduana" 
                        placeholder="Ej: AD123" 
                        values={formData.precintoAduana} 
                        onChange={(v) => validateSeal("precintoAduana", v)}
                        icon={ShieldCheck}
                        duplicatedValues={duplicatedCodes}
                        autoFocus
                     />
                     <MultiInput 
                        label="Precinto Operador" 
                        placeholder="Ej: OP456" 
                        values={formData.precintoOperador} 
                        onChange={(v) => validateSeal("precintoOperador", v)}
                        icon={ShieldCheck}
                        duplicatedValues={duplicatedCodes}
                     />
                     <MultiInput 
                        label="Precinto SENASA" 
                        placeholder="Ej: SE789" 
                        values={formData.precintoSenasa} 
                        onChange={(v) => validateSeal("precintoSenasa", v)}
                        icon={BadgeCheck}
                        duplicatedValues={duplicatedCodes}
                     />
                     <MultiInput 
                        label="Precinto Línea" 
                        placeholder="Ej: LN012" 
                        values={formData.precintoLinea} 
                        onChange={(v) => validateSeal("precintoLinea", v)}
                        icon={Layers}
                        duplicatedValues={duplicatedCodes}
                     />
                     <MultiInput 
                        label="Precintos BETA" 
                        placeholder="Ej: BT345" 
                        values={formData.precintosBeta} 
                        onChange={(v) => validateSeal("precintosBeta", v)}
                        icon={Zap}
                        duplicatedValues={duplicatedCodes}
                     />
                     <MultiInput 
                        label="Termógrafos / Key" 
                        placeholder="Ej: T-9999" 
                        values={formData.termografos} 
                        onChange={(v) => validateSeal("termografos", v)}
                        icon={Thermometer}
                        duplicatedValues={duplicatedCodes}
                     />
                  </div>

                  {/* PANEL DE ESTATUS AMIGABLE 'CARLOS STYLE' */}
                  <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                     <div className="max-w-[60%] min-h-[40px] flex items-center">
                        {serverError ? (
                           <div className="flex items-start gap-4 text-rose-700 bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50 animate-in slide-in-from-left-4 duration-500 shadow-sm">
                              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-800">No se pudo procesar</p>
                                 <p className="text-sm font-medium leading-tight opacity-90 leading-relaxed">{serverError}</p>
                              </div>
                           </div>
                        ) : isSearching ? (
                           <div className="flex items-center gap-4 text-emerald-700 animate-pulse">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando con LogiCapture Central...</p>
                           </div>
                        ) : (
                           <div className="flex items-start gap-4 text-slate-400 group-hover:text-emerald-600/50 transition-colors duration-500">
                              <Info className="h-5 w-5 mt-0.5" />
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black uppercase tracking-[0.2em]">Operación Protegida</p>
                                 <p className="text-[11px] font-medium leading-tight max-w-sm">Verifique que todos los datos sean legibles. El sistema validará la integridad de la operación al guardar.</p>
                              </div>
                           </div>
                        )}
                     </div>

                     <div className="flex items-center gap-4">
                        <button 
                           onClick={handleSaveDraft}
                           className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-all p-3 px-6"
                        >
                           Borrador Local
                        </button>
                        <button 
                           onClick={handleSave}
                           disabled={isSearching}
                           className={cn(
                              "relative group/btn flex items-center gap-3 px-8 py-4 rounded-3xl text-sm font-black uppercase tracking-widest transition-all duration-500",
                              isSearching 
                                 ? "bg-slate-100 text-slate-400 cursor-wait" 
                                 : "bg-emerald-950 text-emerald-50 hover:bg-emerald-900 shadow-2xl shadow-emerald-950/20 active:scale-95 border border-emerald-900"
                           )}
                        >
                           {isSearching ? "Sincronizando..." : "Guardar Registro"}
                           {!isSearching && <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />}
                        </button>
                     </div>
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

      <SuccessModal 
         isOpen={showSuccess} 
         onClose={() => setShowSuccess(false)} 
         title={successTitle} 
      />
    </div>
  );
}
