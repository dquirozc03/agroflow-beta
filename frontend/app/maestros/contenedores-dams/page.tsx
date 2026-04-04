"use client";

import React, { useState, useEffect } from "react";
import { 
  Package, 
  Search, 
  Edit2, 
  Plus,
  RefreshCw,
  Loader2,
  Trash2,
  Barcode,
  Boxes,
  FileText,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ContenedoresModal } from "@/components/contenedores-modal";
import { DeleteConfirmModal } from "@/components/delete-confirm-modal";
import { API_BASE_URL } from "@/lib/constants";

interface Embarque {
  id: number;
  booking: string;
  dam: string;
  contenedor: string;
}

export default function ContenedoresDamsPage() {
  const [embarques, setEmbarques] = useState<Embarque[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const size = 10;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmbarque, setEditingEmbarque] = useState<any>(null);
  
  // Estado para eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [embarqueToDelete, setEmbarqueToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchEmbarques();
  }, [page, searchTerm]);

  const fetchEmbarques = async () => {
    setIsLoading(true);
    try {
      const url = new URL(`${API_BASE_URL}/api/v1/maestros/embarques`);
      url.searchParams.append("page", page.toString());
      url.searchParams.append("size", size.toString());
      if (searchTerm) url.searchParams.append("q", searchTerm);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }
      const data = await response.json();
      setEmbarques(data.items);
      setTotal(data.total_records);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.error("Error al cargar embarques:", error);
      toast.error("Error al cargar datos de embarque");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingEmbarque(null);
    setIsModalOpen(true);
  };

  const handleEdit = (e: Embarque) => {
    setEditingEmbarque(e);
    setIsModalOpen(true);
  };

  const handleDeleteInit = (id: number) => {
    setEmbarqueToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!embarqueToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/maestros/embarques/${embarqueToDelete}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setEmbarques(embarques.filter(e => e.id !== embarqueToDelete));
        toast.success("Registro eliminado exitosamente");
        setIsDeleteModalOpen(false);
      }
    } catch (error) {
      toast.error("Error al intentar eliminar");
    } finally {
      setIsDeleting(false);
      setEmbarqueToDelete(null);
    }
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <ContenedoresModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchEmbarques}
        editingData={editingEmbarque}
      />

      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="¿Eliminar Registro?"
        message="¿Estás seguro de que deseas borrar este despacho? Esta acción eliminará permanentemente la asociación del Booking y la DAM de la base de datos."
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tighter text-[#022c22]">Contenedores y Dam's</h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Gestión operativa de unidades y despachos aduaneros.</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={fetchEmbarques}
             className="h-12 w-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-100 transition-all shadow-sm group"
           >
              <RefreshCw className={cn("h-5 w-5 transition-transform group-hover:rotate-180 duration-500", isLoading && "animate-spin")} />
           </button>
           <button 
             onClick={handleCreateNew}
             className="h-12 px-6 bg-[#022c22] text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-900/10 active:scale-95">
              <Plus className="h-5 w-5" />
              Nuevo Registro
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="lg:col-span-3 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por Booking, DAM o Contenedor..."
              className="w-full h-14 pl-14 pr-6 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
         </div>
         <div className="bg-white border border-slate-100 rounded-2xl px-6 flex items-center justify-between shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Despachos</p>
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
          <>
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/30 font-['Outfit']">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center border-r border-slate-200/80">Identificación (Booking)</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center border-r border-slate-200/80">Documento Aduanero (DAM)</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center border-r border-slate-200/80">Unidad (Contenedor)</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 font-['Inter']">
                {embarques.map((e) => (
                  <tr key={e.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-7 border-r border-slate-200/80 text-center">
                       <div className="flex items-center justify-center gap-3">
                          <Barcode className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-bold text-slate-800 tracking-widest uppercase">{e.booking}</span>
                       </div>
                    </td>
                    <td className="px-8 py-7 border-r border-slate-200/80 text-center">
                       <div className="flex items-center justify-center gap-3">
                          <FileText className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm font-black text-[#022c22]">{e.dam}</span>
                       </div>
                    </td>
                    <td className="px-8 py-7 border-r border-slate-200/80 text-center">
                       <div className="flex items-center justify-center gap-3">
                          <Boxes className="h-4 w-4 text-emerald-500" />
                          <div className="bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                             <span className="text-sm font-black text-emerald-700 tracking-[0.1em]">{e.contenedor}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-7">
                      <div className="flex items-center justify-center gap-2 outline-none transition-all duration-300">
                        <button 
                          onClick={() => handleEdit(e)}
                          className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300 shadow-sm active:scale-95"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteInit(e.id)}
                          className="h-10 w-10 border border-slate-100 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-rose-500 hover:text-white hover:border-rose-500 text-slate-400 shadow-sm active:scale-95"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {embarques.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                       <p className="text-sm font-bold text-slate-300 uppercase tracking-widest font-['Outfit']">No se encontraron registros de embarque.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-8 py-5 border-t border-slate-50 bg-slate-50/20 flex items-center justify-between font-['Outfit']">
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Página</span>
                <div className="h-8 px-3 bg-white border border-slate-100 rounded-lg flex items-center justify-center shadow-sm">
                   <span className="text-sm font-bold text-emerald-700">{page} <span className="text-slate-300 mx-1">/</span> {totalPages}</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                   Mostrando {embarques.length} de {total} Despachos
                </span>
             </div>
             
             <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                  className="h-10 px-4 bg-white border border-slate-100 rounded-xl flex items-center gap-2 text-slate-600 font-bold text-xs hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed group"
                >
                   <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                   Anterior
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || isLoading}
                  className="h-10 px-4 bg-[#022c22] text-white rounded-xl flex items-center gap-2 font-bold text-xs hover:bg-emerald-600 transition-all shadow-md disabled:opacity-30 disabled:cursor-not-allowed group"
                >
                   Siguiente
                   <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
             </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
