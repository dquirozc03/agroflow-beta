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
import { API_BASE_URL } from "@/lib/constants";

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
  const [ocrMode, setOcrMode] = useState<'all' | 'ruc' | 'partida'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (editingData) {
      setFormData({
        ruc: editingData.ruc || "",
        nombre_transportista: editingData.nombre_transportista || "",
        partida_registral: editingData.partida_registral || "",
        codigo_sap: editingData.codigo_sap || "",
        estado: editingData.estado || "ACTIVO"
      });
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

    const ocrPromise = fetch(`${API_BASE_URL}/api/v1/maestros/ocr/transportista`, {
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

          setFormData(prev => {
            if (ocrMode === 'ruc') {
              return { ...prev, ruc: ruc || prev.ruc };
            }
            if (ocrMode === 'partida') {
              // Si no se detectó específicamente como partida, pero estamos en ese modo, 
              // tomamos el texto crudo limpio como fallback (Captura Libre)
              const fallback = result.raw_text?.split('\n')[0]?.trim() || "";
              return { ...prev, partida_registral: partida_registral || fallback || prev.partida_registral };
            }
            // Modo All (Completo)
            return {
              ...prev,
              ruc: ruc || prev.ruc,
              nombre_transportista: nombre_transportista || prev.nombre_transportista,
              partida_registral: partida_registral || prev.partida_registral
            };
          });
          return `Modo ${ocrMode.toUpperCase()} aplicado`;
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
      ? `${API_BASE_URL}/api/v1/maestros/transportistas/${editingData.id}` 
      : `${API_BASE_URL}/api/v1/maestros/transportistas`;
    
    const method = editingData ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsSuccess(true);
        onSuccess();
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
        }, 2000);
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
        <Dialog.Content className={cn(
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full z-[110] animate-in zoom-in-95 duration-300 focus:outline-none",
          isSuccess ? "max-w-md bg-transparent shadow-none p-0" : "max-w-xl bg-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
        )}>
          {isSuccess ? (
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
                  El transportista <br />
                  <span className="text-emerald-600 border-b-2 border-emerald-500/20">
                    {formData.nombre_transportista || "NUEVO"}
                  </span> <br />
                  ha sido guardado correctamente.
                </p>
              </div>
            </div>
          ) : (
            <>
          
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
            <Dialog.Close className="h-10 w-10 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-300 transition-all hover:rotate-90">
               <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="relative">


            <form onSubmit={handleSubmit} className="space-y-6 relative transition-all duration-300">
            
            {/* Zona de OCR Inteligente (Visible en Creación y Edición) */}
            <div className={cn(
                "p-5 rounded-2xl border-2 border-dashed transition-all flex items-center justify-between group overflow-hidden relative",
                isProcessingOCR ? "border-emerald-500 bg-emerald-50/20" : "border-slate-100 hover:border-emerald-200 hover:bg-slate-50"
              )}>
                <div className="flex flex-col gap-3 w-full">
                  <div className="flex items-center justify-between">
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
                  </div>

                  {/* Selector de Modo */}
                  <div className="flex items-center gap-2 p-1 bg-slate-100/50 rounded-xl w-fit relative z-10 transition-all">
                    <button
                      type="button"
                      onClick={() => setOcrMode('all')}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                        ocrMode === 'all' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      <Sparkles className="h-3 w-3" />
                      Completo
                    </button>
                    <button
                      type="button"
                      onClick={() => setOcrMode('ruc')}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                        ocrMode === 'ruc' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      <Fingerprint className="h-3 w-3" />
                      Solo RUC
                    </button>
                    <button
                      type="button"
                      onClick={() => setOcrMode('partida')}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                        ocrMode === 'partida' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      <ScrollText className="h-3 w-3" />
                      Solo Partida
                    </button>
                  </div>
                </div>
                
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-0"
                  onChange={(e) => e.target.files?.[0] && processOCR(e.target.files[0])}
                />
              </div>

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
                    className="w-full h-12 pl-11 pr-10 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-sm"
                   />
                   <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 cursor-help group-hover:scale-110 transition-transform">
                      <Sparkles className="h-4 w-4" />
                   </div>
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
                  className="w-full h-12 pl-11 pr-10 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-sm"
                 />
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 cursor-help group-hover:scale-110 transition-transform">
                    <Sparkles className="h-4 w-4" />
                 </div>
              </div>
            </div>

            <button
              disabled={isSubmitting}
              className="w-full h-14 bg-emerald-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-950/20 active:scale-95 disabled:opacity-50 border-none"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : editingData ? "Actualizar Cambios" : "Registrar Transportista"}
            </button>

            </form>
          </div>
          </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
