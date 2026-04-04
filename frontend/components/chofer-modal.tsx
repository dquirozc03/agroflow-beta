"use client";

import React, { useState, useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { 
  X, 
  Upload, 
  Loader2, 
  User, 
  Sparkles, 
  Fingerprint, 
  CreditCard,
  Contact,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";

interface ChoferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingData?: any;
}

export function ChoferModal({ isOpen, onClose, onSuccess, editingData }: ChoferModalProps) {
  const [formData, setFormData] = useState({
    dni: "",
    nombres: "",
    apellido_paterno: "",
    apellido_materno: "",
    licencia: "",
    estado: "ACTIVO"
  });
  
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingData) {
        setFormData({
          dni: editingData.dni || "",
          nombres: editingData.nombres || "",
          apellido_paterno: editingData.apellido_paterno || "",
          apellido_materno: editingData.apellido_materno || "",
          licencia: editingData.licencia || "",
          estado: editingData.estado || "ACTIVO"
        });
      } else {
        setFormData({
           dni: "",
           nombres: "",
           apellido_paterno: "",
           apellido_materno: "",
           licencia: "",
           estado: "ACTIVO"
        });
      }
    }
  }, [isOpen, editingData]);

  const processOCR = async (file: File) => {
    setIsProcessingOCR(true);
    const apiData = new FormData();
    apiData.append("file", file);

    const ocrPromise = fetch(`${API_BASE_URL}/api/v1/maestros/ocr/licencia`, {
      method: "POST",
      body: apiData
    }).then(async (res) => {
      if (!res.ok) throw new Error("Error en servidor OCR");
      return res.json();
    });

    toast.promise(ocrPromise, {
      loading: "Escaneando Licencia de Conducir...",
      success: (result: any) => {
        if (result.data) {
          const { 
            dni, 
            nombres, 
            apellido_paterno, 
            apellido_materno, 
            licencia,
            numero_licencia // Backup key
          } = result.data;

          console.log("OCR DATA RECEIVED:", result.data);

          // Parche de Estabilidad: Pequeño delay para que Radix UI no se asuste (V13.1)
          setTimeout(() => {
            setFormData(prev => ({
              ...prev,
              dni: dni || prev.dni,
              nombres: nombres || prev.nombres,
              apellido_paterno: apellido_paterno || prev.apellido_paterno,
              apellido_materno: apellido_materno || prev.apellido_materno,
              licencia: licencia || numero_licencia || prev.licencia,
            }));
          }, 200);
          
          return "Datos de identidad extraídos con éxito";
        }
        return "Respuesta vacía del servidor OCR";
      },
      error: "Error al procesar Brevete",
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

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const url = editingData 
       ? `${API_BASE_URL}/api/v1/maestros/choferes/${editingData.id}`
       : `${API_BASE_URL}/api/v1/maestros/choferes`;
    
    const method = editingData ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success("Chofer guardado exitosamente");
        onSuccess();
        onClose();
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

  // Cálculo del Alias Operativo en tiempo real
  const getAlias = () => {
    if (!formData.nombres || !formData.apellido_paterno) return "ESPERANDO DATOS...";
    const primerNombre = formData.nombres.trim().split(" ")[0].toUpperCase();
    const apePat = formData.apellido_paterno.trim().toUpperCase();
    const apeMatInic = formData.apellido_materno ? `${formData.apellido_materno.trim()[0].toUpperCase()}.` : "";
    return `${primerNombre} ${apePat} ${apeMatInic}`.trim();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] animate-in fade-in duration-300" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl z-[110] animate-in zoom-in-95 duration-300 focus:outline-none max-h-[92vh] flex flex-col overflow-hidden border border-white/20">
          
          {/* Header Fijo */}
          <div className="p-8 pb-4 flex justify-between items-center border-b border-slate-50 bg-white/50 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-[#E8F5EE] text-[#10B981] rounded-2xl flex items-center justify-center shadow-inner">
                 <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <Dialog.Title className="text-2xl font-extrabold tracking-tighter text-[#022c22]">
                  {editingData ? "Editar Operador" : "Nuevo Operador"}
                </Dialog.Title>
                <p className="text-[10px] text-[#10B981] font-black uppercase tracking-[0.2em]">Identidad Operativa Agroflow</p>
              </div>
            </div>
            <Dialog.Close className="h-10 w-10 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-300 transition-all hover:rotate-90">
               <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          {/* Contenido Scrolleable con Scrollbar Elegante */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent hover:scrollbar-thumb-emerald-100 transition-all">
            <form onSubmit={handleSubmit} className="space-y-6 pb-4">
              
              {/* OCR Brevete Area */}
              <div className={cn(
                "p-6 border-2 border-dashed rounded-[2rem] transition-all relative group overflow-hidden bg-slate-50/50",
                isProcessingOCR ? "border-emerald-500 bg-emerald-50/50" : "border-slate-100 hover:border-emerald-200 hover:bg-white"
              )}>
                 <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                       <div className={cn(
                         "h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                         isProcessingOCR ? "bg-emerald-500 text-white animate-pulse" : "bg-white text-emerald-500"
                       )}>
                          {isProcessingOCR ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                       </div>
                       <div>
                          <p className="text-xs font-bold text-slate-800 tracking-tight uppercase">Smart Scan Brevete</p>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Pegar / Arrastrar Licencia</p>
                       </div>
                    </div>
                    <div className="relative">
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) processOCR(file);
                      }} />
                      <button type="button" className="h-11 px-5 bg-white text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-emerald-50 hover:bg-emerald-500 hover:text-white transition-all">
                         Subir Archivo
                      </button>
                    </div>
                 </div>
                 {isProcessingOCR && (
                   <div className="absolute inset-0 bg-emerald-500/5 backdrop-blur-[1px] animate-pulse"></div>
                 )}
              </div>

              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">N° Licencia</label>
                       <div className="relative group">
                          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                          <input 
                            required
                            value={formData.licencia}
                            onChange={e => {
                              const val = e.target.value.toUpperCase();
                              const onlyDigits = val.replace(/\D/g, "");
                              setFormData({
                                ...formData, 
                                licencia: val,
                                dni: onlyDigits.length >= 8 ? onlyDigits.slice(-8) : onlyDigits
                              });
                            }}
                            placeholder="Q72505661"
                            className="w-full h-14 pl-11 pr-4 bg-[#F8FAFC] border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold text-sm tracking-widest"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">N° DNI (Automático)</label>
                       <div className="relative group">
                          <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                          <input 
                            readOnly
                            required
                            value={formData.dni}
                            placeholder="72505661"
                            className="w-full h-14 pl-11 pr-4 bg-slate-100/50 border-none rounded-2xl font-bold text-sm tracking-widest text-slate-400 cursor-not-allowed select-none"
                          />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nombres Completos</label>
                    <div className="relative group">
                       <Contact className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                       <input 
                         required
                         value={formData.nombres}
                         onChange={e => setFormData({...formData, nombres: e.target.value.toUpperCase()})}
                         placeholder="EJ: DANIEL LEONEL"
                         className="w-full h-14 pl-11 pr-4 bg-[#F8FAFC] border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold text-sm"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Apellido Paterno</label>
                       <input 
                         required
                         value={formData.apellido_paterno}
                         onChange={e => setFormData({...formData, apellido_paterno: e.target.value.toUpperCase()})}
                         placeholder="QUIROZ"
                         className="w-full h-14 px-5 bg-[#F8FAFC] border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold text-sm"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Apellido Materno</label>
                       <input 
                         value={formData.apellido_materno}
                         onChange={e => setFormData({...formData, apellido_materno: e.target.value.toUpperCase()})}
                         placeholder="CARRASCO"
                         className="w-full h-14 px-5 bg-[#F8FAFC] border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold text-sm"
                       />
                    </div>
                 </div>
              </div>

              {/* Alias Operativo Preview */}
              <div className="bg-[#E8F5EE]/50 border border-[#10B981]/10 rounded-2xl p-5 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-[#10B981] text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/10">
                       <Users className="h-5 w-5" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-[#059669] uppercase tracking-widest leading-tight">Alias Operativo</p>
                       <p className="text-[9px] text-[#10B981]/70 font-bold uppercase tracking-tighter">Reportes Agroflow</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-base font-black text-[#022c22] tracking-tighter uppercase tabular-nums">
                       {getAlias()}
                    </p>
                 </div>
              </div>

              <button
                 type="submit"
                 disabled={isSubmitting}
                 className="w-full h-14 bg-[#022c22] text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-900/20 active:scale-[0.98] disabled:opacity-50 mt-4 overflow-hidden relative group"
              >
                 {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                   <>
                     <span className="relative z-10">{editingData ? "Actualizar Perfil" : "Registrar Chofer"}</span>
                     <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                   </>
                 )}
              </button>

            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
