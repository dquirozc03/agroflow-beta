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
  Navigation
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClienteIEModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingData?: any;
}

export function ClienteIEModal({ isOpen, onClose, onSuccess, editingData }: ClienteIEModalProps) {
  const [formData, setFormData] = useState({
    nombre_legal: "",
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

  useEffect(() => {
    if (isOpen) {
      if (editingData) {
        setFormData({
          nombre_legal: editingData.nombre_legal || "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        toast.success("Maestro de Cliente guardado exitosamente 💎");
        onSuccess();
        onClose();
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nombre Legal Cliente</label>
                    <input
                      required
                      value={formData.nombre_legal}
                      onChange={e => setFormData({ ...formData, nombre_legal: e.target.value.toUpperCase() })}
                      placeholder="EJ: BETA BEST"
                      className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-extrabold text-sm"
                    />
                  </div>
                  <div className="space-y-2 text-xs">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">País</label>
                    <input
                      required
                      value={formData.pais}
                      onChange={e => setFormData({ ...formData, pais: e.target.value.toUpperCase() })}
                      placeholder="EJ: ESPAÑA"
                      className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-extrabold text-sm"
                    />
                  </div>
                  <div className="space-y-2 text-xs">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Puerto Destino</label>
                    <input
                      required
                      value={formData.destino}
                      onChange={e => setFormData({ ...formData, destino: e.target.value.toUpperCase() })}
                      placeholder="EJ: BARCELONA"
                      className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-extrabold text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Consignatario (BL)</label>
                      <textarea
                        value={formData.consignatario_bl}
                        onChange={e => setFormData({ ...formData, consignatario_bl: e.target.value.toUpperCase() })}
                        placeholder="DATOS DEL CONSIGNATARIO..."
                        className="w-full min-h-[80px] p-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-xs lc-scroll"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 text-xs">Notify Party (BL)</label>
                      <textarea
                        value={formData.notify_bl}
                        onChange={e => setFormData({ ...formData, notify_bl: e.target.value.toUpperCase() })}
                        placeholder="DATOS DEL NOTIFY PARTY..."
                        className="w-full min-h-[80px] p-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-xs lc-scroll"
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dirección Notify</label>
                       <textarea 
                         value={formData.direccion_notify}
                         onChange={e => setFormData({...formData, direccion_notify: e.target.value.toUpperCase()})}
                         placeholder="DIRECCIÓN DEL NOTIFY PARTY..."
                         className="w-full min-h-[160px] p-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-xs lc-scroll"
                       />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dirección del Consignatario</label>
                      <textarea
                        value={formData.direccion_consignatario}
                        onChange={e => setFormData({ ...formData, direccion_consignatario: e.target.value.toUpperCase() })}
                        placeholder="DIRECCIÓN COMPLETA..."
                        className="w-full min-h-[160px] p-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-xs lc-scroll"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Lugar de Emisión BL</label>
                      <input
                        value={formData.emision_bl}
                        onChange={e => setFormData({ ...formData, emision_bl: e.target.value.toUpperCase() })}
                        placeholder="EJ: PIURA, PERU"
                        className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-extrabold text-xs"
                      />
                    </div>
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
