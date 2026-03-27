"use client";

import React, { useState, useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { 
  X, 
  Upload, 
  Loader2, 
  ShieldCheck, 
  FileText, 
  Image as ImageIcon,
  Sparkles,
  ClipboardCheck,
  Building2,
  Fingerprint,
  ScrollText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TransportistaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingData?: any;
}

export function TransportistaModal({ isOpen, onClose, onSuccess, editingData }: TransportistaModalProps) {
  const [formData, setFormData] = useState({
    ruc: "",
    nombre_transportista: "",
    partida_registral: "",
    codigo_sap: "",
    estado: "ACTIVO"
  });
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingData) {
      setFormData(editingData);
    } else {
      setFormData({
        ruc: "",
        nombre_transportista: "",
        partida_registral: "",
        codigo_sap: "",
        estado: "ACTIVO"
      });
    }
  }, [editingData, isOpen]);

  // --- Lógica de OCR (Paste & Upload) ---
  const processOCR = async (file: File) => {
    setIsProcessingOCR(true);
    const apiData = new FormData();
    apiData.append("file", file);

    const ocrPromise = fetch("http://localhost:8000/api/v1/maestros/ocr/transportista", {
      method: "POST",
      body: apiData
    }).then(async (res) => {
      if (!res.ok) throw new Error("Error en servidor OCR");
      return res.json();
    });

    toast.promise(ocrPromise, {
      loading: "Escaneando tarjeta MTC...",
      success: (result: any) => {
        console.log("--- [DEBUG OCR] Respuesta del Servidor ---", result);
        if (result.data) {
          const { ruc, nombre_transportista, partida_registral } = result.data;
          
          if (!ruc && !nombre_transportista) {
            console.warn("OCR detectó el archivo pero no encontró datos clave.");
            return "Escaneo completado (Sin datos claros)";
          }

          setFormData(prev => ({
            ...prev,
            ruc: ruc || prev.ruc,
            nombre_transportista: nombre_transportista || prev.nombre_transportista,
            partida_registral: partida_registral || prev.partida_registral
          }));
          return "Datos extraídos exitosamente";
        }
        return "No se detectaron datos";
      },
      error: "Error al procesar la imagen",
      finally: () => setIsProcessingOCR(false)
    });
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (!isOpen || isProcessingOCR) return;
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            processOCR(blob);
            break; // Solo procesamos la primera imagen pegada
          }
        }
      }
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
      ? `http://localhost:8000/api/v1/maestros/transportistas/${editingData.id}` 
      : "http://localhost:8000/api/v1/maestros/transportistas";
    
    const method = editingData ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingData ? "Transportista actualizado" : "Transportista creado con éxito");
        onSuccess();
        onClose();
      } else {
        const err = await response.json();
        toast.error(err.detail || "Error al guardar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-in fade-in duration-300" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-[2.5rem] p-10 shadow-2xl z-[110] animate-in zoom-in-95 duration-300 focus:outline-none overflow-hidden">
          
          {/* Fondo Decorativo */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex justify-between items-center mb-8 relative">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                 <Building2 className="h-6 w-6" />
              </div>
              <div>
                <Dialog.Title className="text-2xl font-extrabold tracking-tighter text-[#022c22]">
                  {editingData ? "Editar Transportista" : "Nuevo Transportista"}
                </Dialog.Title>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Módulo de Datos Maestros</p>
              </div>
            </div>
            <Dialog.Close className="h-10 w-10 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-300 transition-all">
               <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative">
            
            {/* Zona de OCR Inteligente */}
            {!editingData && (
              <div className={cn(
                "p-5 rounded-2xl border-2 border-dashed transition-all flex items-center justify-between group overflow-hidden relative",
                isProcessingOCR ? "border-emerald-500 bg-emerald-50/20" : "border-slate-100 hover:border-emerald-200 hover:bg-slate-50"
              )}>
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                    isProcessingOCR ? "bg-emerald-500 text-white animate-pulse" : "bg-white text-slate-300 group-hover:text-emerald-500 shadow-sm"
                  )}>
                    {isProcessingOCR ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Scanner MTC Inteligente</p>
                    <p className="text-[10px] text-slate-400 font-medium tracking-tight">Pega una imagen (Ctrl+V) o arrastra la tarjeta</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <div className="h-8 px-3 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <ClipboardCheck className="h-3 w-3" />
                      Pegar Habilitado
                   </div>
                </div>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => e.target.files?.[0] && processOCR(e.target.files[0])}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">RUC 11 Dígitos</label>
                <div className="relative group">
                   <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                   <input 
                    required
                    value={formData.ruc}
                    onChange={e => setFormData({...formData, ruc: e.target.value})}
                    placeholder="20XXXXXXXXX"
                    className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-sm"
                   />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Código SAP</label>
                <input 
                  value={formData.codigo_sap || ""}
                  onChange={e => setFormData({...formData, codigo_sap: e.target.value})}
                  placeholder="OPCIONAL"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Razón Social</label>
              <div className="relative group">
                 <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                 <input 
                  required
                  value={formData.nombre_transportista}
                  onChange={e => setFormData({...formData, nombre_transportista: e.target.value})}
                  placeholder="NOMBRE COMPLETO DE LA EMPRESA"
                  className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-sm"
                 />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Partida Registral</label>
              <div className="relative group">
                 <ScrollText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                 <input 
                  value={formData.partida_registral || ""}
                  onChange={e => setFormData({...formData, partida_registral: e.target.value})}
                  placeholder="NÚMERO DE PARTIDA"
                  className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-sm"
                 />
              </div>
            </div>

            <button
              disabled={isSubmitting}
              className="w-full h-14 bg-[#022c22] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-900/10 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : editingData ? "Actualizar Cambios" : "Registrar Transportista"}
            </button>

          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
