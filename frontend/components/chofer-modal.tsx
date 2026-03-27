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
          const { dni, nombres, apellido_paterno, apellido_materno, licencia } = result.data;
          setFormData(prev => ({
            ...prev,
            dni: dni || prev.dni,
            nombres: nombres || prev.nombres,
            apellido_paterno: apellido_paterno || prev.apellido_paterno,
            apellido_materno: apellido_materno || prev.apellido_materno,
            licencia: licencia || prev.licencia,
          }));
          return "Datos de licencia extraídos con éxito";
        }
        return "No se detectaron datos legibles";
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

  return (
    <Dialog.Root open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-[2.5rem] p-8 shadow-2xl z-[110] animate-in zoom-in-95 focus:outline-none max-h-[95vh] overflow-y-auto">
           
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                 <Users className="h-6 w-6" />
              </div>
              <div>
                <Dialog.Title className="text-2xl font-extrabold tracking-tighter text-[#022c22]">
                  {editingData ? "Editar Operador" : "Nuevo Operador"}
                </Dialog.Title>
                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em]">Identidad Operativa Agroflow</p>
              </div>
            </div>
            <Dialog.Close className="h-10 w-10 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-300 transition-all">
               <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* OCR Brevete Area */}
            <div className={cn(
              "p-5 border-2 border-dashed rounded-[2rem] transition-all relative group",
              isProcessingOCR ? "border-emerald-500 bg-emerald-50/20" : "border-slate-100 hover:border-emerald-200"
            )}>
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className={cn(
                       "h-11 w-11 rounded-2xl flex items-center justify-center transition-all shadow-sm",
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
                    <button type="button" className="h-10 px-4 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">
                       Subir Archivo
                    </button>
                  </div>
               </div>
            </div>

            <div className="space-y-5">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 text-xs">N° DNI</label>
                     <div className="relative group">
                        <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          required
                          value={formData.dni}
                          onChange={e => setFormData({...formData, dni: e.target.value})}
                          placeholder="88888888"
                          className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm tracking-widest"
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 text-xs">N° Licencia</label>
                     <div className="relative group">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          value={formData.licencia}
                          onChange={e => setFormData({...formData, licencia: e.target.value.toUpperCase()})}
                          placeholder="Q-88888888"
                          className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm tracking-widest"
                        />
                     </div>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 text-xs text-xs">Nombres Completos</label>
                  <div className="relative group">
                     <Contact className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                     <input 
                       required
                       value={formData.nombres}
                       onChange={e => setFormData({...formData, nombres: e.target.value.toUpperCase()})}
                       placeholder="EJ: DANIEL LEONEL"
                       className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm"
                     />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 text-xs">Apellido Paterno</label>
                     <div className="relative group">
                        <input 
                          required
                          value={formData.apellido_paterno}
                          onChange={e => setFormData({...formData, apellido_paterno: e.target.value.toUpperCase()})}
                          placeholder="QUIROZ"
                          className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm"
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 text-xs">Apellido Materno</label>
                     <div className="relative group">
                        <input 
                          value={formData.apellido_materno}
                          onChange={e => setFormData({...formData, apellido_materno: e.target.value.toUpperCase()})}
                          placeholder="CARRASCO"
                          className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm"
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
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : editingData ? "Actualizar Perfil" : "Registrar Chofer"}
            </button>

          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
