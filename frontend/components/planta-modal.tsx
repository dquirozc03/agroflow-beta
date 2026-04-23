"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { 
  X, 
  Factory, 
  MapPin, 
  Save, 
  Loader2, 
  CheckCircle2, 
  Hash,
  Navigation,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";

interface PlantaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingData?: any;
}

export function PlantaModal({ isOpen, onClose, onSuccess, editingData }: PlantaModalProps) {
  const [formData, setFormData] = useState({
    planta: "",
    centro: "",
    direccion: "",
    ubigeo: "",
    distrito: "",
    provincia: "",
    departamento: ""
  });

  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (editingData) {
      setFormData({
        planta: editingData.planta || "",
        centro: editingData.centro || "",
        direccion: editingData.direccion || "",
        ubigeo: editingData.ubigeo || "",
        distrito: editingData.distrito || "",
        provincia: editingData.provincia || "",
        departamento: editingData.departamento || ""
      });
    } else {
      setFormData({
        planta: "",
        centro: "",
        direccion: "",
        ubigeo: "",
        distrito: "",
        provincia: "",
        departamento: ""
      });
    }
  }, [editingData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingData 
        ? `${API_BASE_URL}/api/v1/maestros/plantas/${editingData.id}`
        : `${API_BASE_URL}/api/v1/maestros/plantas`;
      
      const method = editingData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al guardar planta");
      }

      setIsSuccess(true);
      onSuccess();
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-[#022c22]/40 backdrop-blur-md z-[100] animate-in fade-in duration-500" />
        <Dialog.Content className={cn(
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full z-[110] animate-in zoom-in-95 duration-500 focus:outline-none border-none",
          isSuccess ? "max-w-md bg-transparent shadow-none p-0" : "max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden font-['Inter']"
        )}>
          {isSuccess ? (
            <div className="relative bg-white rounded-[3.5rem] shadow-2xl p-12 w-full text-center space-y-8 animate-in zoom-in-95 slide-in-from-bottom-12 duration-700 ease-out border border-emerald-50">
              <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto relative group">
                <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-emerald-500" />
                <ShieldCheck className="h-12 w-12 text-emerald-600 relative z-10" />
              </div>
              <div className="space-y-3">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
                  {editingData ? "¡Actualizada!" : "¡Registrada!"}
                </h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
                  La sede operativa <br />
                  <span className="text-emerald-600 border-b-2 border-emerald-500/20">
                    {formData.planta || "NUEVA"}
                  </span> <br />
                  ha sido guardada correctamente.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative p-10 max-h-[90vh] overflow-y-auto lc-scroll">


            <Dialog.Title className="text-3xl font-black text-emerald-950 tracking-tighter flex items-center gap-4 mb-2">
              <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
                <Factory className="h-6 w-6" />
              </div>
              {editingData ? "Editar Planta" : "Nueva Planta"}
            </Dialog.Title>
            <Dialog.Description className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-10 ml-16">
              Gestión de Sedes y Puntos Operativos
            </Dialog.Description>

            <form onSubmit={handleSubmit} className="space-y-8 transition-all duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre de la Sede</label>
                  <div className="relative group">
                    <Factory className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      required
                      placeholder="Ej: PLANTA CASMA"
                      className="w-full h-14 pl-12 pr-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm uppercase"
                      value={formData.planta}
                      onChange={(e) => setFormData({ ...formData, planta: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Código Centro (MTC)</label>
                  <div className="relative group">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      placeholder="Ej: 4102"
                      className="w-full h-14 pl-12 pr-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm uppercase tracking-widest"
                      value={formData.centro}
                      onChange={(e) => setFormData({ ...formData, centro: e.target.value })}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Dirección Fiscal / Operativa</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      required
                      placeholder="Calle, Número, Referencia..."
                      className="w-full h-14 pl-12 pr-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm uppercase"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ubigeo</label>
                  <div className="relative group">
                    <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      required
                      placeholder="Ej: 020801"
                      className="w-full h-14 pl-12 pr-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm"
                      value={formData.ubigeo}
                      onChange={(e) => setFormData({ ...formData, ubigeo: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Distrito</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      placeholder="Ej: CASMA"
                      className="w-full h-14 pl-12 pr-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm uppercase"
                      value={formData.distrito}
                      onChange={(e) => setFormData({ ...formData, distrito: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Provincia</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      placeholder="Ej: CASMA"
                      className="w-full h-14 pl-12 pr-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm uppercase"
                      value={formData.provincia}
                      onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Departamento</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      placeholder="Ej: ANCASH"
                      className="w-full h-14 pl-12 pr-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm uppercase"
                      value={formData.departamento}
                      onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-16 bg-slate-50 text-slate-400 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-slate-100 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] h-16 bg-emerald-950 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-950/20 active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-5 w-5 text-emerald-400" />
                      {editingData ? "Actualizar Sede" : "Registrar Planta"}
                    </>
                  )}
                </button>
              </div>
            </form>

            <Dialog.Close className="absolute top-10 right-10 h-10 w-10 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all outline-none group shadow-sm border border-transparent hover:border-rose-100">
              <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            </Dialog.Close>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
