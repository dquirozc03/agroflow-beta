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
import { Switch } from "@/components/ui/switch";
import { 
  Scale, 
  Truck, 
  Container, 
  Package, 
  ChevronRight, 
  FileDown, 
  AlertCircle,
  RefreshCw,
  X,
  Zap
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
  
  // Datos de Configuración Vehicular Real (de Maestros) 🏗️
  const [tractoEjes, setTractoEjes] = useState(0);
  const [carretaEjes, setCarretaEjes] = useState(0);
  const [isSe2, setIsSe2] = useState(false); 

  // Pesos Individuales
  const [taraTracto, setTaraTracto] = useState(0);
  const [taraCarreta, setTaraCarreta] = useState(0);
  
  // Pesos para cálculo
  const [taraContenedor, setTaraContenedor] = useState(0);
  const [pesoBrutoProducto, setPesoBrutoProducto] = useState(0);
  const [pesoBrutoTotal, setPesoBrutoTotal] = useState(0);
  const [guiaRemision, setGuiaRemision] = useState("");

  useEffect(() => {
    if (isOpen && registroId) {
      fetchInitialData();
    }
  }, [isOpen, registroId]);

  // Recalcular Bruto Total automáticamente
  useEffect(() => {
    setPesoBrutoTotal(taraTracto + taraCarreta + taraContenedor + pesoBrutoProducto);
  }, [taraTracto, taraCarreta, taraContenedor, pesoBrutoProducto]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/logicapture/registros/${registroId}`);
      if (!res.ok) throw new Error("Error al obtener registro");
      const reg = await res.json();
      setData(reg);
      
      setTaraContenedor(Number(reg.peso_tara_contenedor) || 0);
      setPesoBrutoProducto(Number(reg.peso_neto_carga) || 0);
      setGuiaRemision(reg.num_guia || ""); // Carga automática del correlativo guardado 📋✨

      // 2. Obtener Taras Técnicas y Ejes Reales 🚛📊
      const [tractoRes, carretaRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/logicapture/vehicle/${reg.placa_tracto}`),
        fetch(`${API_BASE_URL}/api/v1/logicapture/trailer/${reg.placa_carreta}`)
      ]);

      if (tractoRes.ok) {
        const t = await tractoRes.json();
        setTaraTracto(Number(t.peso_neto) || 0);
        setTractoEjes(t.numero_ejes || 3);
      }
      if (carretaRes.ok) {
        const c = await carretaRes.json();
        setTaraCarreta(Number(c.peso_neto) || 0);
        setCarretaEjes(c.numero_ejes || 0); // Ejes Reales de Maestros ✨
      }
      
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
          peso_bruto: pesoBrutoTotal,
          peso_tara_contenedor: taraContenedor,
          peso_neto_carga: pesoBrutoProducto,
          is_especial: isSe2,
          guia_remision: guiaRemision
        })
      });

      if (!response.ok) throw new Error("Error en la descarga del Anexo 1");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PesosYMedidas_${data?.orden_beta || 'S-O'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border-0 shadow-2xl rounded-[2.5rem] overflow-hidden p-0 max-h-[90vh] flex flex-col">
        <div className="h-2 bg-emerald-500 shrink-0" />
        
        <div className="flex-1 overflow-y-auto lc-scroll">
          <DialogHeader className="px-8 pt-8 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
                      <Scale className="h-6 w-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black text-[#022c22] tracking-tighter uppercase">
                      Pesos y Medidas (Anexo 1)
                    </DialogTitle>
                  </div>
              </div>
            </div>
          </DialogHeader>

        <div className="px-8 pb-8 space-y-6">
            
            {/* Cabecera Info */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                  <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-sm">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Ejes Conectados</p>
                    <p className="text-xs font-bold text-slate-700">{tractoEjes}E + {carretaEjes}E</p>
                  </div>
               </div>
               <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Orden Beta</p>
                  <p className="text-xs font-bold text-emerald-600 uppercase">{data?.orden_beta || "PENDIENTE"}</p>
               </div>
            </div>

            {/* Switch Se2 Especial */}
            {carretaEjes === 2 && (
                <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-5 flex items-center justify-between animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
                            <Zap className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest leading-none mb-1">Configuración Se2 (Esparcidos)</p>
                            <p className="text-[11px] font-bold text-amber-600 leading-none">Activar Límite 47T</p>
                        </div>
                    </div>
                    <Switch checked={isSe2} onCheckedChange={setIsSe2} className="data-[state=checked]:bg-amber-500" />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                             Tara Contenedor (KG)
                        </Label>
                        <Input 
                            type="number"
                            value={taraContenedor}
                            onChange={(e) => setTaraContenedor(Number(e.target.value))}
                            className="h-14 bg-slate-50 border-slate-100 rounded-xl font-bold text-lg"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                             Peso Bruto del Producto (KG)
                        </Label>
                        <Input 
                            type="number"
                            value={pesoBrutoProducto}
                            onChange={(e) => setPesoBrutoProducto(Number(e.target.value))}
                            className="h-14 bg-slate-50 border-slate-100 rounded-xl font-bold text-lg"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                             Guía de Remisión
                        </Label>
                        <Input 
                            type="text"
                            placeholder="Ej: 001-00012345"
                            value={guiaRemision}
                            onChange={(e) => setGuiaRemision(e.target.value)}
                            className="h-14 bg-slate-50 border-slate-100 rounded-xl font-bold text-lg uppercase"
                        />
                    </div>
                </div>

                <div className="bg-[#022c22] rounded-[2rem] p-6 text-white flex flex-col justify-between shadow-xl">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center opacity-40">
                            <span className="text-[8px] font-black uppercase tracking-widest">Tara Tracto ({data?.placa_tracto})</span>
                            <span className="text-xs font-bold">{taraTracto.toLocaleString()} KG</span>
                        </div>
                        <div className="flex justify-between items-center opacity-40">
                            <span className="text-[8px] font-black uppercase tracking-widest">Tara Carreta ({data?.placa_carreta})</span>
                            <span className="text-xs font-bold">{taraCarreta.toLocaleString()} KG</span>
                        </div>
                        <div className="flex justify-between items-center opacity-40">
                            <span className="text-[8px] font-black uppercase tracking-widest">Tara Contenedor</span>
                            <span className="text-xs font-bold">{taraContenedor.toLocaleString()} KG</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/10 mt-1">
                            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-300">Configuración MTC</span>
                            <span className="text-[10px] font-black text-emerald-400">
                                {tractoEjes === 3 && carretaEjes === 2 ? (isSe2 ? "T3/Se2 (47T)" : "T3/S2 (43T)") : 
                                 tractoEjes === 3 && carretaEjes === 3 ? "T3/S3 (48T)" : "DETECTANDO ejes..."}
                            </span>
                        </div>
                    </div>
                    
                    <div className="mt-8 pt-4 border-t border-emerald-500/30">
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Peso Bruto Total</p>
                        <p className="text-4xl font-black text-white tracking-tighter">
                            {pesoBrutoTotal.toLocaleString()} <span className="text-sm opacity-50">KG</span>
                        </p>
                    </div>
                </div>
            </div>

            <Button onClick={handleDownload} disabled={loading || !registroId} className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transition-all">
                {loading ? <RefreshCw className="h-6 w-6 animate-spin mr-3" /> : <FileDown className="h-5 w-5 mr-3" />}
                {loading ? "PROCESANDO..." : "Sincronizar y Descargar PDF"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
