"use client";

import React, { useState, useEffect } from "react";
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
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClienteIE {
  id: number;
  nombre_legal: string;
  pais: string;
  destino: string;
  estado: string;
}

interface ClienteIEModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingData?: any;
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

export function ClienteIEModal({ isOpen, onClose, onSuccess, editingData }: ClienteIEModalProps) {
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
    emision_bl: "",
    fitosanitario: {
      consignatario_fito: "",
      direccion_consignatario_fito: ""
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrors({});
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
          emision_bl: editingData.emision_bl || "",
          fitosanitario: {
            consignatario_fito: editingData.fitosanitario?.consignatario_fito || "",
            direccion_consignatario_fito: editingData.fitosanitario?.direccion_consignatario_fito || ""
          }
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
          emision_bl: "",
          fitosanitario: {
            consignatario_fito: "",
            direccion_consignatario_fito: ""
          }
        });
      }
    }
  }, [isOpen, editingData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre_legal.trim()) newErrors.nombre_legal = "Identidad legal requerida";
    if (!formData.pais.trim()) newErrors.pais = "País destino obligatorio";
    // Destino es opcional ahora
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      } else {
        toast.error("Error al guardar el maestro");
      }
    } catch (e) {
      toast.error("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <SuccessModal 
        isOpen={showSuccess} 
        onClose={() => {
          setShowSuccess(false);
          onSuccess();
          onClose();
        }} 
        title={formData.nombre_legal} 
      />

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white rounded-[3rem] p-10 shadow-2xl z-[110] animate-in zoom-in-95 focus:outline-none max-h-[95vh] overflow-y-auto lc-scroll">

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
            <Dialog.Close className="h-12 w-12 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-300 transition-all">
              <X className="h-6 w-6" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">

            <Tabs defaultValue="bl" className="w-full">
              <TabsList className="bg-slate-50 border border-slate-100 p-2 rounded-2xl h-16 w-full flex gap-2">
                <TabsTrigger value="bl" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm transition-all">
                  <FileText className="h-4 w-4 mr-2" /> Instrucciones BL
                </TabsTrigger>
                <TabsTrigger value="fito" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm transition-all">
                  <ShieldCheck className="h-4 w-4 mr-2" /> Fitosanitario
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bl" className="mt-8 space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nombre Cliente</label>
                    <input 
                      value={formData.nombre_legal}
                      onChange={e => {
                        setFormData({ ...formData, nombre_legal: e.target.value.toUpperCase() });
                        if (errors.nombre_legal) setErrors({ ...errors, nombre_legal: "" });
                      }}
                      placeholder="EJ: BETA BEST"
                      className={cn(
                        "w-full h-14 px-6 bg-slate-50 border rounded-2xl focus:outline-none transition-all font-extrabold text-sm",
                        errors.nombre_legal ? "border-rose-400 focus:ring-rose-500/10" : "border-slate-100 focus:ring-emerald-500/10 focus:border-emerald-500"
                      )}
                    />
                    {errors.nombre_legal && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-2">{errors.nombre_legal}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Cultivo</label>
                    <input 
                      value={formData.cultivo}
                      onChange={e => setFormData({ ...formData, cultivo: e.target.value.toUpperCase() })}
                      placeholder="EJ: ARANDANO"
                      className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-extrabold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">País</label>
                    <input 
                      value={formData.pais}
                      onChange={e => {
                        setFormData({ ...formData, pais: e.target.value.toUpperCase() });
                        if (errors.pais) setErrors({ ...errors, pais: "" });
                      }}
                      placeholder="EJ: ESPAÑA"
                      className={cn(
                        "w-full h-14 px-6 bg-slate-50 border rounded-2xl focus:outline-none transition-all font-extrabold text-sm",
                        errors.pais ? "border-rose-400 focus:ring-rose-500/10" : "border-slate-100 focus:ring-emerald-500/10 focus:border-emerald-500"
                      )}
                    />
                    {errors.pais && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-2">{errors.pais}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 text-[9px]">P. Destino <span className="text-slate-300 italic opacity-50 ml-1">(Opc)</span></label>
                    <input 
                      value={formData.destino}
                      onChange={e => setFormData({ ...formData, destino: e.target.value.toUpperCase() })}
                      placeholder="EJ: BARCELONA"
                      className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-extrabold text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Bloque Izquierdo: Consignatario */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Consignatario (BL)</label>
                      <input
                        value={formData.consignatario_bl}
                        onChange={e => setFormData({ ...formData, consignatario_bl: e.target.value.toUpperCase() })}
                        placeholder="NOMBRE DEL CONSIGNATARIO..."
                        className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-extrabold text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dirección del Consignatario</label>
                      <textarea
                        value={formData.direccion_consignatario}
                        onChange={e => setFormData({ ...formData, direccion_consignatario: e.target.value.toUpperCase() })}
                        placeholder="DIRECCIÓN COMPLETA..."
                        className="w-full min-h-[120px] p-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-xs lc-scroll"
                      />
                    </div>
                  </div>

                  {/* Bloque Derecho: Notify Party */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 text-xs">Notify (BL)</label>
                      <input
                        value={formData.notify_bl}
                        onChange={e => setFormData({ ...formData, notify_bl: e.target.value.toUpperCase() })}
                        placeholder="NOMBRE DEL NOTIFY PARTY..."
                        className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-extrabold text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dirección Notify</label>
                      <textarea
                        value={formData.direccion_notify}
                        onChange={e => setFormData({ ...formData, direccion_notify: e.target.value.toUpperCase() })}
                        placeholder="DIRECCIÓN DEL NOTIFY PARTY..."
                        className="w-full min-h-[120px] p-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-xs lc-scroll"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">EORI Consignatario</label>
                    <input
                      value={formData.eori_consignatario}
                      onChange={e => setFormData({ ...formData, eori_consignatario: e.target.value.toUpperCase() })}
                      placeholder="EORI..."
                      className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-extrabold text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">EORI Notify</label>
                    <input
                      value={formData.eori_notify}
                      onChange={e => setFormData({ ...formData, eori_notify: e.target.value.toUpperCase() })}
                      placeholder="EORI..."
                      className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-extrabold text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Emisión BL</label>
                    <input
                      value={formData.emision_bl}
                      onChange={e => setFormData({ ...formData, emision_bl: e.target.value.toUpperCase() })}
                      placeholder="EJ: SWB"
                      className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-extrabold text-xs"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="fito" className="mt-8 space-y-8 animate-in fade-in duration-500">
                <div className="bg-emerald-50/30 border border-emerald-100 rounded-[2rem] p-8 space-y-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-emerald-950">
                    <ShieldCheck className="h-40 w-40 rotate-12" />
                  </div>

                  <div className="space-y-2 relative z-10">
                    <h4 className="text-sm font-black text-emerald-950 uppercase tracking-widest">Configuración Fitosanitaria</h4>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-[0.1em]">Estos datos se usarán exclusivamente para el Certificado SENASA</p>
                  </div>

                  <div className="space-y-6 relative z-10">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Consignatario (FITO)</label>
                      <textarea
                        value={formData.fitosanitario.consignatario_fito}
                        onChange={e => setFormData({
                          ...formData,
                          fitosanitario: { ...formData.fitosanitario, consignatario_fito: e.target.value.toUpperCase() }
                        })}
                        placeholder="CONSIGNATARIO PARA EL FITO..."
                        className="w-full min-h-[120px] p-6 bg-white border border-emerald-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-xs resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 text-xs">Dirección (FITO)</label>
                      <textarea
                        value={formData.fitosanitario.direccion_consignatario_fito}
                        onChange={e => setFormData({
                          ...formData,
                          fitosanitario: { ...formData.fitosanitario, direccion_consignatario_fito: e.target.value.toUpperCase() }
                        })}
                        placeholder="DIRECCIÓN PARA EL FITO..."
                        className="w-full min-h-[120px] p-6 bg-white border border-emerald-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-xs resize-none"
                      />
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
                <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
              ) : (
                <>
                  <Save className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                  {editingData ? "Actualizar Cliente" : "Registrar Nuevo Cliente"}
                </>
              )}
            </button>

          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
