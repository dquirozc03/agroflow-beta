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
  Zap
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
    }
  }, [isOpen, editingData]);

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
          setFormData(prev => ({
            ...prev,
            dam: dam || prev.dam,
            contenedor: contenedor || prev.contenedor,
          }));
          return "Patrones de embarque extraídos con éxito";
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

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Ruta alineada con el backend corregido
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
        toast.success("Registro guardado exitosamente");
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
            <Dialog.Close className="h-10 w-10 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-300 transition-all">
               <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* OCR Scan Area */}
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Booking Number</label>
                  <div className="relative group">
                     <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                     <input 
                       required
                       value={formData.booking}
                       onChange={e => setFormData({...formData, booking: e.target.value.toUpperCase()})}
                       placeholder="EJ: EBKG-2024-XP"
                       className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm tracking-widest"
                     />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">N° de DAM</label>
                     <div className="relative group">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          required
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
