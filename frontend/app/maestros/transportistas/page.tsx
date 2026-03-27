"use client";

import React, { useState, useEffect } from "react";
import { 
  Truck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Edit2, 
  Plus,
  RefreshCw,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TransportistaModal } from "@/components/transportista-modal";
import { API_BASE_URL } from "@/lib/constants";

interface Transportista {
  id: number;
  ruc: string;
  nombre_transportista: string;
  estado: string;
}

export default function TransportistasPage() {
  const [transportistas, setTransportistas] = useState<Transportista[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransportista, setEditingTransportista] = useState<any>(null);

  useEffect(() => {
    fetchTransportistas();
  }, []);

  const fetchTransportistas = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/maestros/transportistas`);
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }
      const data = await response.json();
      setTransportistas(data);
    } catch (error) {
      console.error("Detalle del error al cargar transportistas:", error);
      toast.error("Error al cargar transportistas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingTransportista(null);
    setIsModalOpen(true);
  };

  const handleEdit = (t: Transportista) => {
    setEditingTransportista(t);
    setIsModalOpen(true);
  };

  const toggleEstado = async (id: number, currentEstado: string) => {
    const nuevoEstado = currentEstado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/maestros/transportistas/${id}/estado?estado=${nuevoEstado}`, {
        method: "PATCH",
      });
      if (response.ok) {
        setTransportistas(transportistas.map(t => 
          t.id === id ? { ...t, estado: nuevoEstado } : t
        ));
        toast.success(`Transportista ${nuevoEstado === "ACTIVO" ? "habilitado" : "inhabilitado"}`);
      }
    } catch (error) {
      toast.error("Error al actualizar estado");
    }
  };

  const filtered = transportistas.filter(t => 
    t.nombre_transportista.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.ruc.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <TransportistaModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTransportistas}
        editingData={editingTransportista}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tighter text-[#022c22]">Transportistas</h1>
          <p className="text-sm text-slate-500 font-medium">Gestiona tu base de datos maestra de empresas de transporte.</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={fetchTransportistas}
             className="h-12 w-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-100 transition-all shadow-sm"
           >
              <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
           </button>
           <button 
             onClick={handleCreateNew}
             className="h-12 px-6 bg-[#022c22] text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-900/10 active:scale-95">
              <Plus className="h-5 w-5" />
              Nuevo Transportista
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="lg:col-span-3 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por RUC o Nombre..."
              className="w-full h-14 pl-14 pr-6 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="bg-white border border-slate-100 rounded-2xl px-6 flex items-center justify-between shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</p>
            <p className="text-2xl font-extrabold text-[#022c22]">{filtered.length}</p>
         </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-300">
             <Loader2 className="h-10 w-10 animate-spin" />
             <p className="text-sm font-bold uppercase tracking-widest">Cargando datos maestros...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50 font-['Outfit'] bg-slate-50/10">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center border-r border-slate-100">Transportista</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center border-r border-slate-100">RUC</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 font-['Inter']">
                {filtered.map((t) => (
                  <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 border-r border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                          t.estado === "ACTIVO" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                        )}>
                          <Truck className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 tracking-tight">{t.nombre_transportista}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Empresa de Transporte</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 border-r border-slate-100">
                       <div className="flex justify-center">
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">{t.ruc}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-2 outline-none transition-all duration-300">
                        <button 
                          onClick={() => handleEdit(t)}
                          className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300 shadow-sm active:scale-95"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => toggleEstado(t.id, t.estado)}
                          className={cn(
                            "h-9 w-9 border border-transparent rounded-lg flex items-center justify-center transition-all duration-300 bg-white shadow-sm active:scale-95",
                            t.estado === "ACTIVO" 
                              ? "hover:bg-rose-500 hover:text-white hover:border-rose-500 text-slate-300" 
                              : "hover:bg-emerald-500 hover:text-white hover:border-emerald-500 text-slate-300"
                          )}
                        >
                          {t.estado === "ACTIVO" ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-8 py-20 text-center">
                       <p className="text-sm font-bold text-slate-400">No se encontraron transportistas.</p>
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
