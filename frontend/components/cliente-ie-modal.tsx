"use client";

import React, { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  Loader2,
  Globe,
  FileText,
  ShieldCheck,
  MapPin,
  Save,
  Navigation,
  CheckCircle2,
  Search,
  Pencil,
  ChevronDown,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { safeToUpperCase } from "@/lib/utils";

const CULTIVOS_LIST = [
  "ARANDANO FRESCO",
  "ARANDANO CONGELADO",
  "UVAS",
  "MANDARINA",
  "PALTA",
  "GRANADA",
  "ESPARRAGO FRESCO",
  "ESPARRAGO CONGELADO"
];

// --- SmartTooltip v3.0 (Anclaje Absoluto Infalible) ---
function SmartTooltip({ text, children }: { text: string, children: React.ReactNode }) {
  const [show, setShow] = useState(false);

  return (
    <div 
      className="relative w-full"
      onMouseEnter={() => text && text.trim() !== "" && setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && text && (
        <div 
          className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-[1000] px-4 py-2.5 bg-slate-900/95 backdrop-blur-xl text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl border border-white/10 pointer-events-none animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 text-center whitespace-normal min-w-[140px] max-w-[280px] leading-tight"
        >
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900/95" />
        </div>
      )}
    </div>
  );
}

interface ClienteIEModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingData?: any;
}


export function ClienteIEModal({ isOpen, onClose, onSuccess, editingData }: ClienteIEModalProps) {
  const [activeTab, setActiveTab] = useState("bl");
  const [formData, setFormData] = useState({
    nombre_legal: "",
    cultivo: "",
    pais: "",
    destino: "",
    consignatario_bl: "",
    direccion_consignatario: "",
    notify_bl: "",
    direccion_notify: "",
    eori_consignatario: "",
    eori_notify: "",
    fitosanitario: {
      id: null as number | null,
      consignatario_fito: "",
      direccion_fito: ""
    },
    po: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCultivoMenuOpen, setIsCultivoMenuOpen] = useState(false);
  const cultivoMenuRef = useRef<HTMLDivElement>(null);

  const [isFitoEditing, setIsFitoEditing] = useState(false);
  const [isFitoSearchModalOpen, setIsFitoSearchModalOpen] = useState(false);
  const [fitoSearchTerm, setFitoSearchTerm] = useState("");
  const [fitoResults, setFitoResults] = useState<any[]>([]);
  const [isSearchingFito, setIsSearchingFito] = useState(false);

  useEffect(() => {
    if (isFitoSearchModalOpen && fitoSearchTerm.length > 1) {
      const timer = setTimeout(async () => {
        setIsSearchingFito(true);
        try {
          const res = await fetch(`${API_BASE_URL}/api/v1/maestros/clientes-ie/maestro-fitos?q=${encodeURIComponent(fitoSearchTerm)}`);
          if (res.ok) setFitoResults(await res.json());
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearchingFito(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [fitoSearchTerm, isFitoSearchModalOpen]);

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setIsFitoEditing(false);
      setIsCultivoMenuOpen(false);
      setActiveTab("bl");
      if (editingData) {
        setFormData({
          nombre_legal: editingData.nombre_legal || "",
          cultivo: editingData.cultivo || "",
          pais: editingData.pais || "",
          destino: editingData.destino || "",
          consignatario_bl: editingData.consignatario_bl || "",
          direccion_consignatario: editingData.direccion_consignatario || "",
          notify_bl: editingData.notify_bl || "",
          direccion_notify: editingData.direccion_notify || "",
          eori_consignatario: editingData.eori_consignatario || "",
          eori_notify: editingData.eori_notify || "",
          fitosanitario: {
            id: editingData.fitosanitario?.id || null,
            consignatario_fito: editingData.fitosanitario?.consignatario_fito || "",
            direccion_fito: editingData.fitosanitario?.direccion_fito || ""
          },
          po: editingData.po || ""
        });
      } else {
        setFormData({
          nombre_legal: "",
          cultivo: "",
          pais: "",
          destino: "",
          consignatario_bl: "",
          direccion_consignatario: "",
          notify_bl: "",
          direccion_notify: "",
          eori_consignatario: "",
          eori_notify: "",
          fitosanitario: {
            id: null,
            consignatario_fito: "",
            direccion_fito: ""
          },
          po: ""
        });
      }
    }
  }, [isOpen, editingData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cultivoMenuRef.current && !cultivoMenuRef.current.contains(event.target as Node)) {
        setIsCultivoMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    let hasCriticalError = false;

    if (!formData.nombre_legal.trim()) {
      newErrors.nombre_legal = "Requerido";
      hasCriticalError = true;
    }
    if (!formData.pais.trim()) {
      newErrors.pais = "Requerido";
      hasCriticalError = true;
    }
    if (!formData.cultivo.trim()) {
      newErrors.cultivo = "Requerido";
      hasCriticalError = true;
    }
    
    // Validación de Fitosanitario
    if (!formData.fitosanitario.consignatario_fito.trim()) {
      newErrors.consignatario_fito = "Requerido";
    }
    if (!formData.fitosanitario.direccion_fito.trim()) {
      newErrors.direccion_fito = "Requerido";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (hasCriticalError) {
        toast.error("Faltan campos obligatorios en Instrucciones BL");
        setActiveTab("bl");
      } else if (newErrors.consignatario_fito || newErrors.direccion_fito) {
        toast.error("Faltan campos obligatorios en Fitosanitario");
        setActiveTab("fito");
      }
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    const url = editingData
      ? `${API_BASE_URL}/api/v1/maestros/clientes-ie/${editingData.id}`
      : `${API_BASE_URL}/api/v1/maestros/clientes-ie/`;

    const method = editingData ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowSuccess(true);
        onSuccess();
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
        }, 2000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || "Error al guardar el maestro");
      }
    } catch (e) {
      toast.error("Error de conexión con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(val) => !val && !isSubmitting && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-in fade-in" />
        <Dialog.Content className={cn(
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full z-[110] animate-in zoom-in-95 focus:outline-none",
          showSuccess ? "max-w-md bg-transparent shadow-none p-0" : "max-w-3xl bg-white rounded-[3rem] p-10 shadow-2xl max-h-[95vh] overflow-y-auto lc-scroll border border-slate-100"
        )}>
          {showSuccess ? (
            <div className="relative bg-white rounded-[3.5rem] shadow-2xl p-12 w-full text-center space-y-8 animate-in zoom-in-95 slide-in-from-bottom-12 duration-700 ease-out border border-emerald-50">
              <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto relative group">
                <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-emerald-500" />
                <ShieldCheck className="h-12 w-12 text-emerald-600 relative z-10" />
              </div>
              <div className="space-y-3">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
                  {editingData ? "¡Actualizado!" : "¡Registrado!"}
                </h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
                  El cliente <br />
                  <span className="text-emerald-600 border-b-2 border-emerald-500/20">
                    {formData.nombre_legal || "NUEVO"}
                  </span> <br />
                  ha sido guardado correctamente.
                </p>
              </div>
            </div>
          ) : (
            <>

          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                <Globe className="h-7 w-7" />
              </div>
              <div>
                <Dialog.Title className="text-3xl font-extrabold tracking-tighter text-[#022c22]">
                  {editingData ? "Editar Cliente" : "Nuevo Cliente"}
                </Dialog.Title>
                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em]">Configuración de Instrucciones de Embarque</p>
              </div>
            </div>
            <Dialog.Close disabled={isSubmitting} className="h-12 w-12 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-300 transition-all hover:rotate-90 disabled:opacity-30">
              <X className="h-6 w-6" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 transition-all duration-300">

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-slate-50 border border-slate-100 p-2 rounded-2xl h-16 w-full flex gap-2">
                <TabsTrigger value="bl" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm transition-all">
                  <FileText className="h-4 w-4 mr-2" /> Instrucciones BL
                </TabsTrigger>
                <TabsTrigger value="fito" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm transition-all">
                  <ShieldCheck className="h-4 w-4 mr-2" /> Fitosanitario
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bl" className="mt-8 space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nombre Cliente</label>
                    <SmartTooltip text={formData.nombre_legal}>
                      <input 
                        value={formData.nombre_legal}
                        onChange={e => {
                          setFormData({ ...formData, nombre_legal: safeToUpperCase(e.target.value) });
                          if (errors.nombre_legal) setErrors({ ...errors, nombre_legal: "" });
                        }}
                        placeholder="EJ: BETA BEST"
                        className={cn(
                          "w-full h-14 px-6 bg-slate-50 border rounded-2xl focus:outline-none transition-all font-extrabold text-sm truncate",
                          errors.nombre_legal ? "border-rose-400 bg-rose-50/30" : "border-slate-100 focus:ring-emerald-500/10 focus:border-emerald-500"
                        )}
                      />
                    </SmartTooltip>
                  </div>

                  <div className="space-y-2 relative" ref={cultivoMenuRef}>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Cultivo</label>
                    <SmartTooltip text={formData.cultivo}>
                      <button
                        type="button"
                        onClick={() => setIsCultivoMenuOpen(!isCultivoMenuOpen)}
                        className={cn(
                          "w-full h-14 px-6 bg-slate-50 border rounded-2xl flex items-center justify-between focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-extrabold text-sm",
                          errors.cultivo ? "border-rose-400 bg-rose-50/30" : "border-slate-100"
                        )}
                      >
                        <span className="truncate">{formData.cultivo || "SELECCIONE..."}</span>
                        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", isCultivoMenuOpen && "rotate-180")} />
                      </button>
                    </SmartTooltip>
                    {isCultivoMenuOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-[200] bg-white border border-slate-100 rounded-2xl shadow-xl p-1 animate-in zoom-in-95 slide-in-from-top-1 duration-200">
                        <div className="max-h-[200px] overflow-y-auto lc-scroll">
                          {CULTIVOS_LIST.map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, cultivo: c });
                                setIsCultivoMenuOpen(false);
                                if (errors.cultivo) setErrors({ ...errors, cultivo: "" });
                              }}
                              className={cn(
                                "w-full px-5 py-3 rounded-xl text-left text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between group",
                                formData.cultivo === c ? "bg-emerald-50 text-emerald-700" : "hover:bg-slate-50 text-slate-500"
                              )}
                            >
                              {c}
                              {formData.cultivo === c && <Check className="h-3.5 w-3.5" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">País</label>
                    <SmartTooltip text={formData.pais}>
                      <input 
                        value={formData.pais}
                        onChange={e => {
                          setFormData({ ...formData, pais: safeToUpperCase(e.target.value) });
                          if (errors.pais) setErrors({ ...errors, pais: "" });
                        }}
                        placeholder="EJ: ESPAÑA"
                        className={cn(
                          "w-full h-14 px-6 bg-slate-50 border rounded-2xl focus:outline-none transition-all font-extrabold text-sm truncate",
                          errors.pais ? "border-rose-400 bg-rose-50/30" : "border-slate-100 focus:ring-emerald-500/10 focus:border-emerald-500"
                        )}
                      />
                    </SmartTooltip>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 text-[9px]">P. Destino <span className="text-slate-300 italic opacity-50 ml-1">(Opc)</span></label>
                    <SmartTooltip text={formData.destino}>
                      <input 
                        value={formData.destino}
                        onChange={e => setFormData({ ...formData, destino: safeToUpperCase(e.target.value) })}
                        placeholder="BARCELONA"
                        className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-extrabold text-sm truncate"
                      />
                    </SmartTooltip>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Consignatario (BL)</label>
                      <SmartTooltip text={formData.consignatario_bl}>
                        <input
                          value={formData.consignatario_bl}
                          onChange={e => setFormData({ ...formData, consignatario_bl: safeToUpperCase(e.target.value) })}
                          placeholder="NOMBRE DEL CONSIGNATARIO..."
                          className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-extrabold text-sm truncate"
                        />
                      </SmartTooltip>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dirección del Consignatario</label>
                      <SmartTooltip text={formData.direccion_consignatario}>
                        <textarea
                          value={formData.direccion_consignatario}
                          onChange={e => setFormData({ ...formData, direccion_consignatario: safeToUpperCase(e.target.value) })}
                          placeholder="DIRECCIÓN COMPLETA..."
                          className="w-full min-h-[120px] p-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-xs lc-scroll"
                        />
                      </SmartTooltip>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 text-xs">Notify (BL)</label>
                      <SmartTooltip text={formData.notify_bl}>
                        <input
                          value={formData.notify_bl}
                          onChange={e => setFormData({ ...formData, notify_bl: safeToUpperCase(e.target.value) })}
                          placeholder="NOMBRE DEL NOTIFY PARTY..."
                          className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-extrabold text-sm truncate"
                        />
                      </SmartTooltip>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dirección Notify</label>
                      <SmartTooltip text={formData.direccion_notify}>
                        <textarea
                          value={formData.direccion_notify}
                          onChange={e => setFormData({ ...formData, direccion_notify: safeToUpperCase(e.target.value) })}
                          placeholder="DIRECCIÓN DEL NOTIFY PARTY..."
                          className="w-full min-h-[120px] p-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-xs lc-scroll"
                        />
                      </SmartTooltip>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">EORI Consignatario</label>
                    <SmartTooltip text={formData.eori_consignatario}>
                      <input
                        value={formData.eori_consignatario}
                        onChange={e => setFormData({ ...formData, eori_consignatario: safeToUpperCase(e.target.value) })}
                        placeholder="EORI..."
                        className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-extrabold text-xs truncate"
                      />
                    </SmartTooltip>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">EORI Notify</label>
                    <SmartTooltip text={formData.eori_notify}>
                      <input
                        value={formData.eori_notify}
                        onChange={e => setFormData({ ...formData, eori_notify: safeToUpperCase(e.target.value) })}
                        placeholder="EORI..."
                        className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-extrabold text-xs truncate"
                      />
                    </SmartTooltip>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">PO (Orden de Compra)</label>
                    <SmartTooltip text={formData.po}>
                      <input
                        value={formData.po}
                        onChange={e => setFormData({ ...formData, po: safeToUpperCase(e.target.value) })}
                        placeholder="PO-12345"
                        className="w-full h-14 px-6 bg-amber-50/30 border border-amber-100/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-extrabold text-xs truncate"
                      />
                    </SmartTooltip>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="fito" className="mt-8 space-y-10 animate-in fade-in duration-500 relative min-h-[400px]">
                <div className="bg-emerald-50/50 p-10 rounded-[2.5rem] border border-emerald-100/50 space-y-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                    <ShieldCheck className="h-40 w-40 text-emerald-900" />
                  </div>
                  
                  <div className="relative z-10 space-y-2">
                    <h3 className="text-sm font-black text-emerald-950 uppercase tracking-widest">Configuración Fitosanitaria</h3>
                    <p className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-widest">Datos para el certificado SENASA</p>
                  </div>

                  <div className="space-y-6 relative z-10">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 text-xs">
                          CONSIGNATARIO (FITO)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setFitoSearchTerm("");
                            setFitoResults([]);
                            setIsFitoSearchModalOpen(true);
                          }}
                          className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 hover:text-emerald-700 transition-all"
                        >
                          <Search className="h-3.5 w-3.5" /> Buscar Registrado
                        </button>
                      </div>
                      <div className="flex gap-2 relative">
                        <SmartTooltip text={formData.fitosanitario.consignatario_fito}>
                          <input
                             value={formData.fitosanitario.consignatario_fito}
                             readOnly={!!formData.fitosanitario.id && !isFitoEditing}
                             onChange={(e) => {
                               setFormData({
                                 ...formData,
                                 fitosanitario: { ...formData.fitosanitario, consignatario_fito: safeToUpperCase(e.target.value) }
                               });
                               if (errors.consignatario_fito) setErrors({ ...errors, consignatario_fito: "" });
                             }}
                             placeholder="INTRODUCIR O BUSCAR CONSIGNATARIO..."
                             className={cn(
                               "w-full h-14 px-6 border rounded-2xl focus:outline-none transition-all font-bold text-xs shadow-sm truncate",
                               errors.consignatario_fito ? "border-rose-400 bg-rose-50/30" : "",
                               formData.fitosanitario.id && !isFitoEditing
                                  ? "bg-emerald-50/30 border-emerald-100 text-emerald-800 cursor-not-allowed" 
                                  : formData.fitosanitario.id && isFitoEditing
                                    ? "bg-amber-50/40 border-amber-200 text-amber-900 focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400"
                                    : "bg-white border-slate-100 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500"
                             )}
                          />
                        </SmartTooltip>
                        {formData.fitosanitario.id && (
                          <div className="flex gap-1.5">
                           <button
                             type="button"
                             onClick={() => setIsFitoEditing(!isFitoEditing)}
                             className={cn(
                               "h-14 px-4 border rounded-2xl transition-all font-bold text-xs flex items-center justify-center whitespace-nowrap shadow-sm",
                               isFitoEditing
                                 ? "bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200 hover:border-amber-300"
                                 : "bg-blue-50 text-blue-500 hover:bg-blue-100 border-transparent hover:border-blue-200"
                             )}
                           >
                              <Pencil className="h-4 w-4 mr-1" /> {isFitoEditing ? "Editando" : "Editar"}
                           </button>
                           {!isFitoEditing && (
                             <button
                               type="button"
                               onClick={() => {
                                 setFormData({
                                   ...formData,
                                   fitosanitario: { id: null, consignatario_fito: "", direccion_fito: "" }
                                 });
                                 setIsFitoEditing(false);
                               }}
                               className="h-14 px-4 bg-rose-50 text-rose-500 hover:bg-rose-100 border border-transparent rounded-2xl transition-all font-bold text-xs flex items-center justify-center whitespace-nowrap shadow-sm hover:border-rose-200"
                             >
                                <X className="h-4 w-4 mr-1" /> Desvincular
                             </button>
                           )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 text-xs">DIRECCIÓN (FITO)</label>
                      <SmartTooltip text={formData.fitosanitario.direccion_fito}>
                        <textarea
                          value={formData.fitosanitario.direccion_fito}
                          readOnly={!!formData.fitosanitario.id && !isFitoEditing}
                          onChange={e => {
                            setFormData({
                              ...formData,
                              fitosanitario: { ...formData.fitosanitario, direccion_fito: safeToUpperCase(e.target.value) }
                            });
                            if (errors.direccion_fito) setErrors({ ...errors, direccion_fito: "" });
                          }}
                          placeholder="DIRECCIÓN PARA EL FITO..."
                          className={cn(
                             "w-full min-h-[120px] p-6 border rounded-2xl focus:outline-none transition-all font-bold text-xs lc-scroll shadow-sm",
                             errors.direccion_fito ? "border-rose-400 bg-rose-50/30" : "",
                             formData.fitosanitario.id && !isFitoEditing
                              ? "bg-emerald-50/30 border-emerald-100 text-emerald-800 cursor-not-allowed" 
                              : formData.fitosanitario.id && isFitoEditing
                                ? "bg-amber-50/40 border-amber-200 text-amber-900 focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400"
                                : "bg-white border-slate-100 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500"
                          )}
                        />
                      </SmartTooltip>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-16 bg-[#022c22] text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-4 hover:bg-emerald-600 transition-all shadow-2xl shadow-emerald-900/10 active:scale-[0.98] disabled:opacity-50 mt-4 group"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                  <span>Procesando...</span>
                </div>
              ) : (
                <>
                  <Save className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                  {editingData ? "ACTUALIZAR MAESTRO" : "GUARDAR EN MAESTRO"}
                </>
              )}
            </button>

          </form>
          </>
          )}

          {/* Buscador Integrado Minimalista */}
          {isFitoSearchModalOpen && (
            <div className="absolute inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm rounded-[3rem] animate-in fade-in duration-300 flex items-center justify-center p-8">
               <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[80%] animate-in zoom-in-95">
                 <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center gap-4">
                    <Search className="h-5 w-5 text-emerald-500" />
                    <input 
                      autoFocus
                      type="text"
                      placeholder="Buscar por nombre..."
                      className="flex-1 bg-transparent border-none outline-none font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-medium"
                      value={fitoSearchTerm}
                      onChange={e => setFitoSearchTerm(e.target.value)}
                    />
                    <button onClick={() => setIsFitoSearchModalOpen(false)} className="p-2 hover:bg-slate-200/50 rounded-full text-slate-400 transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto lc-scroll p-4">
                    {isSearchingFito ? (
                      <div className="flex items-center justify-center p-10">
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                      </div>
                    ) : fitoResults.length > 0 ? (
                      <div className="space-y-2">
                        {fitoResults.map(fito => (
                          <div 
                            key={fito.id}
                            onClick={() => {
                               setFormData({
                                 ...formData,
                                 fitosanitario: {
                                   id: fito.id,
                                   consignatario_fito: fito.consignatario_fito,
                                   direccion_fito: fito.direccion_fito
                                 }
                               });
                               setIsFitoSearchModalOpen(false);
                               if (errors.consignatario_fito) setErrors({ ...errors, consignatario_fito: "" });
                               if (errors.direccion_fito) setErrors({ ...errors, direccion_fito: "" });
                            }}
                            className="p-4 rounded-2xl hover:bg-emerald-50 border border-transparent hover:border-emerald-100 cursor-pointer transition-all group"
                          >
                             <h4 className="font-bold text-sm text-slate-800 group-hover:text-emerald-700">{fito.consignatario_fito}</h4>
                             <p className="text-xs text-slate-400 line-clamp-1 mt-1">{fito.direccion_fito}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-10 text-slate-300 font-medium text-sm">
                        {fitoSearchTerm.length > 1 ? "No se encontraron coincidencias" : "Escribe para buscar..."}
                      </div>
                    )}
                 </div>
               </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
