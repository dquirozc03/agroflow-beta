"use client";

import React, { useState, useEffect } from "react";
import { 
  Map, 
  Search, 
  Plus,
  RefreshCw,
  Loader2,
  Globe,
  Navigation,
  Copy,
  Edit2,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";
import { ClienteIEModal } from "@/components/cliente-ie-modal";

interface ClienteIE {
  id: number;
  nombre_legal: string;
  pais: string;
  destino: string;
  estado: string;
}

export default function ClientesIEPage() {
  const [clientes, setClientes] = useState<ClienteIE[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/maestros/clientes-ie/`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setClientes(data);
    } catch (error) {
      toast.error("Error al cargar maestros de clientes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/maestros/clientes-ie/${id}/duplicate`, {
        method: 'POST'
      });
      if (response.ok) {
        toast.success("Maestro duplicado correctamente 💎");
        fetchClientes();
      }
    } catch (error) {
      toast.error("Error al duplicar maestro");
    }
  };

  const filtered = clientes.filter(c => 
    c.nombre_legal.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.pais.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.destino.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <ClienteIEModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchClientes}
        editingData={editingData}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tighter text-[#022c22]">Clientes IE</h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Rutas y consignatarios para Instrucciones de Embarque.</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={fetchClientes}
             className="h-12 w-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-100 transition-all shadow-sm group"
           >
              <RefreshCw className={cn("h-5 w-5 transition-transform group-hover:rotate-180 duration-500", isLoading && "animate-spin")} />
           </button>
           <button 
             onClick={() => { setEditingData(null); setIsModalOpen(true); }}
             className="h-12 px-6 bg-[#022c22] text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-900/10 active:scale-95">
              <Plus className="h-5 w-5" />
              Nuevo Cliente IE
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="lg:col-span-3 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por Cliente, País o Destino..."
              className="w-full h-14 pl-14 pr-6 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="bg-white border border-slate-100 rounded-2xl px-6 flex items-center justify-between shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Rutas</p>
            <p className="text-2xl font-extrabold text-[#022c22]">{filtered.length}</p>
         </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-300 font-['Outfit']">
             <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
             <p className="text-xs font-black uppercase tracking-[0.2em]">Sincronizando Maestros...</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/30 font-['Outfit']">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-r border-slate-200/80 text-center">Identificación de Ruta</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-r border-slate-200/80 text-center">País / Destino</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-r border-slate-200/80 text-center">Estado</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 font-['Inter']">
                {filtered.map((c) => (
                  <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-7 border-r border-slate-200/80">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                          <Globe className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-slate-800 tracking-tight uppercase truncate">
                             {c.nombre_legal}
                          </p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">Consignatario BL</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-7 border-r border-slate-200/80">
                       <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                             <Navigation className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                             <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{c.pais}</span>
                          </div>
                          <div className="flex items-center gap-2 pl-5">
                             <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.destino}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-7 border-r border-slate-200/80">
                       <div className="flex justify-center">
                          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-black uppercase tracking-widest px-3 h-6">
                             {c.estado}
                          </Badge>
                       </div>
                    </td>
                    <td className="px-8 py-7">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => handleDuplicate(c.id)}
                          title="Duplicar para nueva ruta"
                          className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all duration-300 shadow-sm group active:scale-95"
                        >
                          <Copy className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        </button>
                        <button 
                          onClick={() => { setEditingData(c); setIsModalOpen(true); }}
                          className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300 shadow-sm group active:scale-95"
                        >
                          <Edit2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
