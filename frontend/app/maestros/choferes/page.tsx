"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Edit2, 
  Plus,
  RefreshCw,
  Loader2,
  Contact,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ChoferModal } from "@/components/chofer-modal";
import { API_BASE_URL } from "@/lib/constants";

interface Chofer {
  id: number;
  dni: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  licencia: string;
  nombre_operativo: string;
  estado: string;
}

export default function ChoferesPage() {
  const [choferes, setChoferes] = useState<Chofer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChofer, setEditingChofer] = useState<any>(null);

  useEffect(() => {
    fetchChoferes();
  }, []);

  const fetchChoferes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/maestros/choferes`);
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }
      const data = await response.json();
      setChoferes(data);
    } catch (error) {
      console.error("Error al cargar choferes:", error);
      toast.error("Error al cargar choferes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingChofer(null);
    setIsModalOpen(true);
  };

  const handleEdit = (c: Chofer) => {
    setEditingChofer(c);
    setIsModalOpen(true);
  };

  const toggleEstado = async (id: number, currentEstado: string) => {
    const nuevoEstado = currentEstado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/maestros/choferes/${id}/estado?estado=${nuevoEstado}`, {
        method: "PATCH",
      });
      if (response.ok) {
        setChoferes(choferes.map(c => 
          c.id === id ? { ...c, estado: nuevoEstado } : c
        ));
        toast.success(`Chofer ${nuevoEstado === "ACTIVO" ? "habilitado" : "inhabilitado"}`);
      }
    } catch (error) {
      toast.error("Error al actualizar estado");
    }
  };

  const filtered = choferes.filter(c => 
    c.nombre_operativo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.dni.includes(searchTerm) ||
    c.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.apellido_paterno.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <ChoferModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchChoferes}
        editingData={editingChofer}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tighter text-[#022c22]">Choferes</h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Gestión de conductores y operadores de flota.</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={fetchChoferes}
             className="h-12 w-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-100 transition-all shadow-sm group"
           >
              <RefreshCw className={cn("h-5 w-5 transition-transform group-hover:rotate-180 duration-500", isLoading && "animate-spin")} />
           </button>
           <button 
             onClick={handleCreateNew}
             className="h-12 px-6 bg-[#022c22] text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-900/10 active:scale-95">
              <Plus className="h-5 w-5" />
              Nuevo Chofer
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="lg:col-span-3 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por Nombre, DNI o Apellidos..."
              className="w-full h-14 pl-14 pr-6 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="bg-white border border-slate-100 rounded-2xl px-6 flex items-center justify-between shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Operadores</p>
            <p className="text-2xl font-extrabold text-[#022c22]">{filtered.length}</p>
         </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-300 font-['Outfit']">
             <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
             <p className="text-xs font-black uppercase tracking-[0.2em]">Sincronizando Base de Datos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/30">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Identidad Operativa</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Documentación</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((c) => (
                  <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center transition-all shadow-sm shrink-0",
                          c.estado === "ACTIVO" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                        )}>
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 tracking-tight truncate uppercase">
                             {c.nombre_operativo}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase truncate">
                             {c.nombres} {c.apellido_paterno} {c.apellido_materno}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                           <Contact className="h-3 w-3 text-slate-400" />
                           <span className="text-[11px] font-bold text-slate-600">DNI: {c.dni}</span>
                        </div>
                        {c.licencia && (
                          <div className="flex items-center gap-2">
                             <CreditCard className="h-3 w-3 text-emerald-500" />
                             <span className="text-[11px] font-bold text-emerald-600">BREVETE: {c.licencia}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                          c.estado === "ACTIVO" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                       )}>
                          <div className={cn("h-1.5 w-1.5 rounded-full mr-1.5", c.estado === "ACTIVO" ? "bg-emerald-500" : "bg-slate-400")} />
                          {c.estado}
                       </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 outline-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(c)}
                          className="h-9 w-9 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-all shadow-sm"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => toggleEstado(c.id, c.estado)}
                          className={cn(
                            "h-9 w-9 border border-slate-100 rounded-lg flex items-center justify-center transition-all bg-white shadow-sm",
                            c.estado === "ACTIVO" 
                              ? "hover:text-rose-500 text-slate-400" 
                              : "hover:text-emerald-500 text-slate-400"
                          )}
                        >
                          {c.estado === "ACTIVO" ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                       <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">No se encontraron choferes.</p>
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
