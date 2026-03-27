"use client";

import React, { useState, useEffect } from "react";
import { 
  BusFront, 
  Truck, 
  Search, 
  Plus, 
  RefreshCw, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Edit2,
  Table as TableIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";
import { VehiculoModal } from "@/components/vehiculo-modal";

type TabMode = "tractos" | "carretas";

interface Vehiculo {
  id: number;
  transportista_id: number;
  transportista?: {
    nombre_transportista: string;
  };
  placa_tracto?: string;
  placa_carreta?: string;
  marca?: string;
  estado: string;
}

export default function VehiculosPage() {
  const [mode, setMode] = useState<TabMode>("tractos");
  const [data, setData] = useState<Vehiculo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [mode]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const endpoint = mode === "tractos" ? "tractos" : "carretas";
      const response = await fetch(`${API_BASE_URL}/api/v1/maestros/vehiculos/${endpoint}`);
      if (!response.ok) throw new Error("Error cargando vehiculos");
      const result = await response.json();
      setData(result);
    } catch (error) {
      toast.error(`Error al cargar ${mode}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEstado = async (id: number, currentEstado: string) => {
    const nuevoEstado = currentEstado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    const tipo = mode === "tractos" ? "tracto" : "carreta";
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/maestros/vehiculos/${tipo}/${id}/estado?estado=${nuevoEstado}`, {
        method: "PATCH",
      });
      if (response.ok) {
        setData(data.map(v => v.id === id ? { ...v, estado: nuevoEstado } : v));
        toast.success("Estado actualizado");
      }
    } catch (error) {
      toast.error("Error al actualizar estado");
    }
  };

  const filtered = data.filter(v => {
    const placa = (v.placa_tracto || v.placa_carreta || "").toLowerCase();
    const transportista = (v.transportista?.nombre_transportista || "").toLowerCase();
    return placa.includes(searchTerm.toLowerCase()) || transportista.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <VehiculoModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        editingData={editingVehiculo}
        type={mode}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tighter text-[#022c22]">Vehículos</h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Registro de unidades por transportista (Tractos y Carretas).</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={fetchData}
             className="h-12 w-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-100 transition-all shadow-sm active:scale-95"
           >
              <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
           </button>
           <button 
             onClick={() => { setEditingVehiculo(null); setIsModalOpen(true); }}
             className="h-12 px-6 bg-[#022c22] text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-900/10 active:scale-95">
              <Plus className="h-5 w-5" />
              Nuevo {mode === "tractos" ? "Tracto" : "Carreta"}
           </button>
        </div>
      </div>

      {/* Tabs Professional Toggle */}
      <div className="flex p-1.5 bg-slate-100/50 rounded-2xl w-fit border border-slate-100 shadow-sm relative overflow-hidden group">
         <button 
           onClick={() => setMode("tractos")}
           className={cn(
             "relative z-10 h-11 px-8 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
             mode === "tractos" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
           )}
         >
           <Truck className="h-4 w-4" />
           Tractos
         </button>
         <button 
           onClick={() => setMode("carretas")}
           className={cn(
             "relative z-10 h-11 px-8 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
             mode === "carretas" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
           )}
         >
           <TableIcon className="h-4 w-4" />
           Carretas
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="lg:col-span-3 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder={`Buscar por placa o transportista de ${mode}...`}
              className="w-full h-14 pl-14 pr-6 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="bg-white border border-slate-100 rounded-2xl px-6 flex items-center justify-between shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total {mode}</p>
            <p className="text-2xl font-extrabold text-[#022c22]">{filtered.length}</p>
         </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-300">
             <Loader2 className="h-10 w-10 animate-spin" />
             <p className="text-sm font-bold uppercase tracking-widest">Sincronizando flota...</p>
          </div>
        ) : (
          <div className="overflow-x-auto text-nowrap">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/10 font-['Outfit']">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Placa / Unidad</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Transportista</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Estado</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 font-['Inter']">
                {filtered.map((v) => (
                  <tr key={`${mode}-${v.id}`} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                          v.estado === "ACTIVO" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                        )}>
                          {mode === "tractos" ? <Truck className="h-5 w-5" /> : <TableIcon className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 tracking-tight">{v.placa_tracto || v.placa_carreta}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{mode === "tractos" ? v.marca || "SIN MARCA" : "REMOLQUE"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs font-bold text-slate-600">{v.transportista?.nombre_transportista}</p>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex justify-center">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter",
                            v.estado === "ACTIVO" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                          )}>
                            {v.estado}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-2 outline-none opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button 
                          onClick={() => { setEditingVehiculo(v); setIsModalOpen(true); }}
                          className="h-9 w-9 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-300 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300 shadow-sm active:scale-95"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => toggleEstado(v.id, v.estado)}
                          className={cn(
                            "h-9 w-9 border border-slate-100 rounded-lg flex items-center justify-center transition-all duration-300 bg-white shadow-sm active:scale-95",
                            v.estado === "ACTIVO" 
                              ? "hover:bg-rose-500 hover:text-white hover:border-rose-500 text-slate-300" 
                              : "hover:bg-emerald-500 hover:text-white hover:border-emerald-500 text-slate-300"
                          )}
                        >
                          {v.estado === "ACTIVO" ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                       <p className="text-sm font-bold text-slate-300 uppercase tracking-widest font-['Outfit']">No se encontraron unidades registradas.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
