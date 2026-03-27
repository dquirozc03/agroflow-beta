"use client";

import React, { useState, useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { 
  X, 
  Upload, 
  Loader2, 
  Truck, 
  Sparkles, 
  Fingerprint, 
  Building2,
  Table as TableIcon,
  Scaling,
  Weight,
  Layers,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";

interface VehiculoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingData?: any;
  type: "tractos" | "carretas";
}

interface Transportista {
  id: number;
  nombre_transportista: string;
  ruc: string;
}

export function VehiculoModal({ isOpen, onClose, onSuccess, editingData, type }: VehiculoModalProps) {
  const [transportistas, setTransportistas] = useState<Transportista[]>([]);
  const [formData, setFormData] = useState({
    transportista_id: "",
    placa: "",
    marca: "",
    numero_ejes: "",
    peso_neto: "",
    certificado: "",
    estado: "ACTIVO"
  });
  
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTermTransportista, setSearchTermTransportista] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchTransportistas();
      if (editingData) {
        setFormData({
          transportista_id: editingData.transportista_id.toString(),
          placa: editingData.placa_tracto || editingData.placa_carreta || "",
          marca: editingData.marca || "",
          numero_ejes: editingData.numero_ejes?.toString() || "",
          peso_neto: editingData.peso_neto_tracto || editingData.peso_neto_carreta || "",
          certificado: editingData.certificado_vehicular_tracto || editingData.certificado_vehicular_carreta || "",
          estado: editingData.estado || "ACTIVO"
        });
      } else {
        setFormData({
           transportista_id: "",
           placa: "",
           marca: "",
           numero_ejes: "",
           peso_neto: "",
           certificado: "",
           estado: "ACTIVO"
        });
      }
    }
  }, [isOpen, editingData]);

  const fetchTransportistas = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/maestros/transportistas`);
      if (resp.ok) setTransportistas(await resp.json());
    } catch (e) { console.error(e); }
  };

  const processOCR = async (file: File) => {
    setIsProcessingOCR(true);
    const apiData = new FormData();
    apiData.append("file", file);

    const ocrPromise = fetch(`${API_BASE_URL}/api/v1/maestros/vehiculos/ocr/tiv`, {
      method: "POST",
      body: apiData
    }).then(async (res) => {
      if (!res.ok) throw new Error("Error en servidor OCR");
      return res.json();
    });

    toast.promise(ocrPromise, {
      loading: "Escaneando Tarjeta TIV...",
      success: (result: any) => {
        if (result.data) {
          const { placa, marca, numero_ejes, peso_neto } = result.data;
          setFormData(prev => ({
            ...prev,
            placa: placa || prev.placa,
            marca: marca || prev.marca,
            numero_ejes: numero_ejes?.toString() || prev.numero_ejes,
            peso_neto: peso_neto?.toString() || prev.peso_neto
          }));
          return "Ficha técnica autocompletada";
        }
        return "No se detectaron datos legibles";
      },
      error: "Error al procesar TIV",
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
    
    // Mapeo dinámico según la tabla
    const body: any = {
       transportista_id: parseInt(formData.transportista_id),
       numero_ejes: parseInt(formData.numero_ejes) || 0,
       estado: formData.estado
    };

    if (type === "tractos") {
       body.placa_tracto = formData.placa;
       body.marca = formData.marca;
       body.peso_neto_tracto = parseFloat(formData.peso_neto) || 0;
       body.certificado_vehicular_tracto = formData.certificado;
    } else {
       body.placa_carreta = formData.placa;
       body.peso_neto_carreta = parseFloat(formData.peso_neto) || 0;
       body.certificado_vehicular_carreta = formData.certificado;
    }

    const endpoint = type === "tractos" ? "tractos" : "carretas";
    const url = editingData 
       ? `${API_BASE_URL}/api/v1/maestros/vehiculos/${type === "tractos" ? "tracto" : "carreta"}/${editingData.id}`
       : `${API_BASE_URL}/api/v1/maestros/vehiculos/${endpoint}`;
    
    const method = editingData ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast.success("Vehículo guardado exitosamente");
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
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-[2.5rem] p-8 shadow-2xl z-[110] animate-in zoom-in-95 focus:outline-none max-h-[90vh] overflow-y-auto">
           
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                 {type === "tractos" ? <Truck className="h-6 w-6" /> : <TableIcon className="h-6 w-6" />}
              </div>
              <div>
                <Dialog.Title className="text-2xl font-extrabold tracking-tighter text-[#022c22]">
                  {editingData ? `Editar ${type}` : `Nuevo ${type}`}
                </Dialog.Title>
                <p className="text-xs text-emerald-500 font-black uppercase tracking-widest">Gestión de Unidades Operativas</p>
              </div>
            </div>
            <Dialog.Close className="h-10 w-10 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-300 transition-all">
               <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* OCR TIV Area */}
            <div className={cn(
              "p-4 border-2 border-dashed rounded-2xl transition-all relative group",
              isProcessingOCR ? "border-emerald-500 bg-emerald-50/20" : "border-slate-100 hover:border-emerald-200"
            )}>
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className={cn(
                       "h-9 w-9 rounded-xl flex items-center justify-center transition-all shadow-sm",
                       isProcessingOCR ? "bg-emerald-500 text-white animate-pulse" : "bg-white text-emerald-500"
                     )}>
                        {isProcessingOCR ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                     </div>
                     <div>
                        <p className="text-xs font-bold text-slate-800 tracking-tight">Scanner de TIV Inteligente</p>
                        <p className="text-[10px] text-slate-400 font-medium">Pegar imagen de la tarjeta vehicular</p>
                     </div>
                  </div>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files?.[0] && processOCR(e.target.files[0])} />
               </div>
            </div>

            <div className="space-y-4">
               {/* Transportista Select */}
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Transportista Propietario</label>
                  <div className="relative group">
                     <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                     <select 
                       required
                       value={formData.transportista_id}
                       onChange={e => setFormData({...formData, transportista_id: e.target.value})}
                       className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-sm appearance-none"
                     >
                        <option value="">Seleccione Transportista...</option>
                        {transportistas.filter(t => t.nombre_transportista.toLowerCase().includes(searchTermTransportista.toLowerCase()) || t.ruc.includes(searchTermTransportista)).map(t => (
                           <option key={t.id} value={t.id}>{t.ruc} - {t.nombre_transportista}</option>
                        ))}
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Placa Vehicular</label>
                     <div className="relative group">
                        <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          required
                          value={formData.placa}
                          onChange={e => setFormData({...formData, placa: e.target.value.toUpperCase()})}
                          placeholder="ABC-123"
                          className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-sm"
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Número Ejes</label>
                     <div className="relative group">
                        <Layers className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          type="number"
                          value={formData.numero_ejes}
                          onChange={e => setFormData({...formData, numero_ejes: e.target.value})}
                          placeholder="2, 3, 6..."
                          className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-sm"
                        />
                     </div>
                  </div>
               </div>

               {type === "tractos" && (
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Marca / Fabricante</label>
                    <div className="relative group">
                       <Truck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                       <input 
                          value={formData.marca}
                          onChange={e => setFormData({...formData, marca: e.target.value.toUpperCase()})}
                          placeholder="EJ: VOLVO, SCANIA, KENWORTH"
                          className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-sm"
                       />
                    </div>
                 </div>
               )}

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Peso Neto (KG)</label>
                     <div className="relative group">
                        <Weight className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          type="number"
                          value={formData.peso_neto}
                          onChange={e => setFormData({...formData, peso_neto: e.target.value})}
                          placeholder="7500"
                          className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-sm"
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Certificado Vigente</label>
                     <div className="relative group">
                        <Scaling className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          value={formData.certificado}
                          onChange={e => setFormData({...formData, certificado: e.target.value.toUpperCase()})}
                          placeholder="MTC-XXXX"
                          className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-sm"
                        />
                     </div>
                  </div>
               </div>
            </div>

            <button
               type="submit"
               disabled={isSubmitting}
               className="w-full h-14 bg-[#022c22] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-900/10 active:scale-95 disabled:opacity-50 mt-4"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : editingData ? "Actualizar Unidad" : "Registrar Vehículo"}
            </button>

          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
