"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Scale, 
  Truck, 
  Container, 
  Package, 
  ChevronRight, 
  FileDown, 
  AlertCircle,
  RefreshCw,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";

interface PesosMedidasModalProps {
  isOpen: boolean;
  onClose: () => void;
  registroId: number | null;
}

export function PesosMedidasModal({ isOpen, onClose, registroId }: PesosMedidasModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  
  // Pesos para cálculo
  const [taraVehiculo, setTaraVehiculo] = useState(0);
  const [taraContenedor, setTaraContenedor] = useState(0);
  const [pesoNeto, setPesoNeto] = useState(0);
  const [pesoBruto, setPesoBruto] = useState(0);

  useEffect(() => {
    if (isOpen && registroId) {
      fetchInitialData();
    }
  }, [isOpen, registroId]);

  // Recalcular Bruto automáticamente: Bruto = Tara Vehículo + Tara Contenedor + Neto Carga
  useEffect(() => {
    setPesoBruto(taraVehiculo + taraContenedor + pesoNeto);
  }, [taraVehiculo, taraContenedor, pesoNeto]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Obtener datos actuales del registro (por si ya tiene pesos ingresados)
      const res = await fetch(`${API_BASE_URL}/api/v1/logicapture/registros/${registroId}`);
      if (!res.ok) throw new Error("Error al obtener registro");
      const reg = await res.json();
      setData(reg);
      
      // Precargar pesos existentes para corrección de digitación 💎
      setTaraContenedor(Number(reg.peso_tara_contenedor) || 0);
      setPesoNeto(Number(reg.peso_neto_carga) || 0);

      // 2. Obtener Taras Técnicas de Maestros (Cálculo Automático) 🚛⚖️
      const [tractoRes, carretaRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/logicapture/vehicle/${reg.placa_tracto}`),
        fetch(`${API_BASE_URL}/api/v1/logicapture/trailer/${reg.placa_carreta}`)
      ]);

      let taraFija = 0;
      if (tractoRes.ok) {
        const t = await tractoRes.json();
        taraFija += (Number(t.peso_neto) || 0);
      }
      if (carretaRes.ok) {
        const c = await carretaRes.json();
        taraFija += (Number(c.peso_neto) || 0);
      }
      
      setTaraVehiculo(taraFija);

    } catch (error) {
      console.error(error);
      toast.error("Error al sincronizar datos de balanza");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/logicapture/registros/${registroId}/anexo1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          peso_bruto: pesoBruto,
          peso_tara_contenedor: taraContenedor,
          peso_neto_carga: pesoNeto
        })
      });

      if (!response.ok) throw new Error("Error en la descarga del Anexo 1");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Nombre de archivo personalizado: PesosYMedidas_[Orden Beta].pdf
      a.download = `PesosYMedidas_${data?.orden_beta || 'S-O'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success("Documento descargado y pesos actualizados");
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border-0 shadow-2xl rounded-[2.5rem] overflow-hidden p-0 lc-scroll">
        <div className="h-2 bg-emerald-500" />
        
        <DialogHeader className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
                    <Scale className="h-6 w-6" />
                </div>
                <div>
                   <DialogTitle className="text-2xl font-black text-[#022c22] tracking-tighter uppercase">
                     Balanza Digital MTC
                   </DialogTitle>
                   <DialogDescription className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                     Configuración de Pesos y Medidas (Anexo 1)
                   </DialogDescription>
                </div>
            </div>
            <button onClick={onClose} className="h-10 w-10 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-300 transition-all hover:rotate-90">
                <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-8 pb-8 space-y-6">
            
            {/* Info Panel: Vehículo Detectado */}
            <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-all">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-emerald-600">
                      <Truck className="h-5 w-5" />
                   </div>
                   <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidades en Balanza</p>
                       <p className="text-sm font-bold text-slate-700">
                           {data?.placa_tracto || "---"} / {data?.placa_carreta || "---"}
                       </p>
                   </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orden Beta</p>
                    <p className="text-sm font-bold text-emerald-600">
                        {data?.orden_beta || "PENDIENTE"}
                    </p>
                </div>
            </div>

            {/* Formulario de Pesaje */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Col Izq: Inputs de Usuario */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Container className="h-3 w-3" /> Tara Contenedor (KG)
                        </Label>
                        <Input 
                            type="number"
                            value={taraContenedor}
                            onChange={(e) => setTaraContenedor(Number(e.target.value))}
                            className="h-14 bg-slate-50 border-slate-100 rounded-xl focus:ring-emerald-500/20 font-bold text-lg"
                            placeholder="Ej: 3850.00"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Package className="h-3 w-3" /> Peso Neto Carga (KG)
                        </Label>
                        <Input 
                            type="number"
                            value={pesoNeto}
                            onChange={(e) => setPesoNeto(Number(e.target.value))}
                            className="h-14 bg-slate-50 border-slate-100 rounded-xl focus:ring-emerald-500/20 font-bold text-lg"
                            placeholder="Ej: 22450.00"
                        />
                    </div>
                </div>

                {/* Col Der: Cálculo Automático */}
                <div className="bg-[#022c22] rounded-[2rem] p-6 text-white flex flex-col justify-between shadow-xl shadow-emerald-950/20">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center opacity-60">
                            <span className="text-[9px] font-black uppercase tracking-widest">Tara Vehicular Master</span>
                            <span className="text-xs font-bold">{taraVehiculo.toLocaleString()} KG</span>
                        </div>
                        <div className="flex justify-between items-center opacity-60">
                            <span className="text-[9px] font-black uppercase tracking-widest">Input Contenedor</span>
                            <span className="text-xs font-bold">{taraContenedor.toLocaleString()} KG</span>
                        </div>
                        <div className="flex justify-between items-center opacity-60">
                            <span className="text-[9px] font-black uppercase tracking-widest">Input Carga Neta</span>
                            <span className="text-xs font-bold">{pesoNeto.toLocaleString()} KG</span>
                        </div>
                    </div>
                    
                    <div className="mt-8 pt-4 border-t border-emerald-500/30">
                        <div className="flex items-center gap-2 mb-1">
                            <Scale className="h-3 w-3 text-emerald-400" />
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Peso Bruto Total MTC</p>
                        </div>
                        <p className="text-4xl font-black text-white tracking-tighter">
                            {pesoBruto.toLocaleString()} <span className="text-sm opacity-50">KG</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Aviso Legal */}
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-4">
                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shrink-0 border border-emerald-100 text-emerald-600">
                    <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                   <p className="text-xs font-bold text-emerald-900 uppercase tracking-tight">Corrección de Errores de Digitación</p>
                   <p className="text-[10px] text-emerald-700 font-medium leading-tight opacity-70">
                       Si detecta un error en el PDF, simplemente abra este modal nuevamente, corrija los datos y vuelva a descargar. Los pesos se actualizarán automáticamente.
                   </p>
                </div>
            </div>

            <Button 
                onClick={handleDownload}
                disabled={loading || !registroId || (pesoBruto <= 0)}
                className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50"
            >
                {loading ? (
                    <RefreshCw className="h-6 w-6 animate-spin mr-3" />
                ) : (
                    <FileDown className="h-5 w-5 mr-3" />
                )}
                {loading ? "PROCESANDO..." : "Sincronizar y Descargar PDF"}
            </Button>

        </div>
      </DialogContent>
    </Dialog>
  );
}
