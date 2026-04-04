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
  CreditCard,
  ChevronLeft,
  ChevronRight,
  SortAsc,
  SortDesc
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
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const size = 10;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChofer, setEditingChofer] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    fetchChoferes();
  }, [page, searchTerm, sortOrder]);

  const fetchChoferes = async () => {
    setIsLoading(true);
    try {
      const url = new URL(`${API_BASE_URL}/api/v1/maestros/choferes`);
      url.searchParams.append("page", page.toString());
      url.searchParams.append("size", size.toString());
      url.searchParams.append("order", sortOrder);
      if (searchTerm) url.searchParams.append("q", searchTerm);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }
      const data = await response.json();
      setChoferes(data.items);
      setTotal(data.total);
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
    if (updatingId) return; // Evitar clics concurrentes
    setUpdatingId(id);
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
    } finally {
      setUpdatingId(null);
    }
  };


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
         <div className="lg:col-span-3 flex gap-3">
            <div className="relative flex-1 group">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Buscar por Nombre, DNI o Apellidos..."
                 className="w-full h-14 pl-14 pr-6 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm font-medium"
                 value={searchTerm}
                 onChange={(e) => {
                   setSearchTerm(e.target.value);
                   setPage(1);
                 }}
               />
            </div>
            <button 
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
              className={cn(
                "h-14 w-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-95 group shrink-0",
                sortOrder === "asc" ? "text-emerald-600 border-emerald-100" : "text-slate-400"
              )}
              title={sortOrder === "asc" ? "Orden: A-Z" : "Orden: Z-A"}
            >
               {sortOrder === "asc" ? <SortAsc className="h-6 w-6" /> : <SortDesc className="h-6 w-6" />}
            </button>
         </div>
         <div className="bg-white border border-slate-100 rounded-2xl px-6 flex items-center justify-between shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total de Conductores</p>
            <p className="text-2xl font-extrabold text-[#022c22]">{total}</p>
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
                <tr className="border-b border-slate-50 bg-slate-50/30 font-['Outfit']">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center border-r border-slate-200/80">Identidad Operativa</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center border-r border-slate-200/80">Documentación</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center border-r border-slate-200/80">Estado</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 font-['Inter']">
                {choferes.map((c: Chofer) => (
                  <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-7 border-r border-slate-200/80">
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
                    <td className="px-8 py-7 border-r border-slate-200/80">
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
                    <td className="px-8 py-7 border-r border-slate-200/80">
                       <div className="flex justify-center">
                          <div className={cn(
                             "inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                             c.estado === "ACTIVO" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                          )}>
                             <div className={cn("h-1.5 w-1.5 rounded-full mr-1.5", c.estado === "ACTIVO" ? "bg-emerald-500" : "bg-slate-400")} />
                             {c.estado}
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-7">
                      <div className="flex items-center justify-center gap-2 outline-none transition-all duration-300">
                        <button 
                          onClick={() => handleEdit(c)}
                          className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300 shadow-sm active:scale-95"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => toggleEstado(c.id, c.estado)}
                          disabled={updatingId === c.id}
                          className={cn(
                            "h-9 w-9 border border-slate-100 rounded-lg flex items-center justify-center transition-all duration-300 bg-white shadow-sm active:scale-95",
                            updatingId === c.id ? "opacity-50 cursor-not-allowed" : 
                            c.estado === "ACTIVO" 
                              ? "hover:bg-rose-500 hover:text-white hover:border-rose-500 text-slate-400" 
                              : "hover:bg-emerald-500 hover:text-white hover:border-emerald-500 text-slate-400"
                          )}
                        >
                          {updatingId === c.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                          ) : c.estado === "ACTIVO" ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {choferes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                       <p className="text-sm font-bold text-slate-300 uppercase tracking-widest font-['Outfit']">No se encontraron choferes registrados.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer con Paginación */}
        {!isLoading && total > size && (
          <div className="border-t border-slate-50 bg-slate-50/20 px-8 py-6 flex items-center justify-between">
            <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">
               Mostrando {((page - 1) * size) + 1} - {Math.min(page * size, total)} de {total} Conductores
            </div>
            <div className="flex items-center gap-2">
               <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="h-10 w-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-emerald-500 hover:border-emerald-100 transition-all shadow-sm disabled:opacity-30 active:scale-95"
               >
                  <ChevronLeft className="h-5 w-5" />
               </button>
               <div className="h-10 px-4 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-sm border border-emerald-100">
                  {page}
               </div>
               <button 
                  disabled={page * size >= total}
                  onClick={() => setPage(p => p + 1)}
                  className="h-10 w-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-emerald-500 hover:border-emerald-100 transition-all shadow-sm disabled:opacity-30 active:scale-95"
               >
                  <ChevronRight className="h-5 w-5" />
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
