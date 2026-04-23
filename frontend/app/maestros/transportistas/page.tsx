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
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  XCircle as Ban
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TransportistaModal } from "@/components/transportista-modal";
import { API_BASE_URL } from "@/lib/constants";

interface Transportista {
  id: number;
  ruc: string;
  nombre_transportista: string;
  codigo_sap?: string;
  partida_registral?: string;
  estado: string;
}

export default function TransportistasPage() {
  const [transportistas, setTransportistas] = useState<Transportista[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showIncompletos, setShowIncompletos] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransportista, setEditingTransportista] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [statusModal, setStatusModal] = useState<{ open: boolean; mode: 'ACTIVO' | 'INACTIVO'; title: string }>({
    open: false,
    mode: 'ACTIVO',
    title: ''
  });

  useEffect(() => {
    fetchTransportistas();
  }, [page, searchTerm, showIncompletos]);

  const fetchTransportistas = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/maestros/transportistas?page=${page}&q=${searchTerm}&incompletos=${showIncompletos}`);
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }
      const data = await response.json();
      setTransportistas(data.items);
      setTotalPages(data.total_pages);
      setTotalRecords(data.total);
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
    setUpdatingId(id);
    const nuevoEstado = currentEstado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/maestros/transportistas/${id}/estado?estado=${nuevoEstado}`, {
        method: "PATCH",
      });
      if (response.ok) {
        setTransportistas(transportistas.map(t => 
          t.id === id ? { ...t, estado: nuevoEstado } : t
        ));
        setStatusModal({
          open: true,
          mode: nuevoEstado as any,
          title: transportistas.find(t => t.id === id)?.nombre_transportista || ""
        });
        setTimeout(() => setStatusModal(prev => ({ ...prev, open: false })), 3000);
      }
    } catch (error) {
      toast.error("Error al actualizar estado");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = transportistas.filter(t => 
    t.nombre_transportista.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.ruc.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <TransportistaModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTransportistas}
        editingData={editingTransportista}
      />

      {/* Modal de Estado dinámico al estilo AgroFlow Premium 💎 */}
      {statusModal.open && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setStatusModal(prev => ({ ...prev, open: false }))} />
          <div className={cn(
            "relative bg-white rounded-[3.5rem] shadow-2xl p-12 max-w-md w-full text-center space-y-8 animate-in zoom-in-95 slide-in-from-bottom-12 duration-700 ease-out border",
            statusModal.mode === "ACTIVO" ? "border-emerald-50" : "border-rose-50"
          )}>
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center mx-auto relative group",
              statusModal.mode === "ACTIVO" ? "bg-emerald-100" : "bg-rose-100"
            )}>
              <div className={cn(
                "absolute inset-0 rounded-full animate-ping opacity-20",
                statusModal.mode === "ACTIVO" ? "bg-emerald-500" : "bg-rose-500"
              )} />
              {statusModal.mode === "ACTIVO" ? (
                <ShieldCheck className="h-12 w-12 text-emerald-600 relative z-10" />
              ) : (
                <Ban className="h-12 w-12 text-rose-600 relative z-10" />
              )}
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
                {statusModal.mode === "ACTIVO" ? "¡Habilitado!" : "¡Inhabilitado!"}
              </h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
                El transportista <br />
                <span className={cn(
                  "border-b-2",
                  statusModal.mode === "ACTIVO" ? "text-emerald-600 border-emerald-500/20" : "text-rose-600 border-rose-500/20"
                )}>{statusModal.title}</span> <br />
                ha sido {statusModal.mode === "ACTIVO" ? "activado" : "desactivado"} correctamente.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-emerald-950 rounded-2xl flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950/20">
                <Truck className="h-5 w-5" />
             </div>
             <h1 className="text-3xl font-extrabold tracking-tighter text-emerald-950 font-['Outfit']">
                Red de <span className="text-emerald-500">Transportistas</span>
             </h1>
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-13">
             Gestiona tu base de datos maestra de empresas de transporte
          </p>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={fetchTransportistas}
             className="h-12 w-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-100 transition-all shadow-sm active:scale-95 group"
           >
              <RefreshCw className={cn("h-5 w-5 transition-transform group-hover:rotate-180 duration-500", isLoading && "animate-spin")} />
           </button>
           <button 
             onClick={handleCreateNew}
             className="h-12 px-6 bg-emerald-950 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[11px] flex items-center gap-2 hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-950/20 active:scale-95 border-none"
           >
              <Plus className="h-4 w-4" />
              Nuevo Transportista
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm items-end transition-all duration-500">
         <div className="lg:col-span-3 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Búsqueda Rápida</label>
            <div className="relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Buscar por RUC o Nombre..."
                 className="w-full h-11 pl-12 pr-6 bg-slate-50/50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-sm"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
         </div>

         <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Filtro Estado</label>
            <div className="flex p-1 bg-slate-100/50 rounded-2xl border border-slate-100 h-11">
               <button 
                 onClick={() => { setShowIncompletos(false); setPage(1); }}
                 className={cn(
                   "flex-1 rounded-xl font-black uppercase tracking-tighter text-[9px] transition-all",
                   !showIncompletos ? "bg-[#022c22] text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                 )}
               >
                 Todos
               </button>
               <button 
                 onClick={() => { setShowIncompletos(true); setPage(1); }}
                 className={cn(
                   "flex-1 rounded-xl font-black uppercase tracking-tighter text-[9px] transition-all flex items-center justify-center gap-2",
                   showIncompletos ? "bg-amber-500 text-white shadow-sm" : "text-amber-600/60 hover:text-amber-600"
                 )}
               >
                 <AlertTriangle className="h-3 w-3" />
                 Incompletos
               </button>
            </div>
         </div>

          <div className="bg-emerald-50/30 border border-emerald-100 rounded-[1.5rem] px-6 h-11 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60">Empresas</p>
            <p className="text-xl font-black text-emerald-900">{totalRecords}</p>
          </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-300 font-['Outfit']">
             <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em]">Cargando datos maestros...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50 font-['Outfit']">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center border-none">Transportista</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center border-none">RUC</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center border-none">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 font-['Inter']">
                {transportistas.map((t) => (
                  <tr key={t.id} className="group hover:bg-emerald-50/10 transition-colors border-none">
                    <td className="px-8 py-6 border-none">
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
                    <td className="px-8 py-6 border-none">
                       <div className="flex flex-col items-center justify-center gap-2">
                          <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-lg w-fit">{t.ruc}</span>
                          {(!t.codigo_sap || !t.partida_registral) && (
                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md w-fit">
                                <AlertTriangle className="h-3 w-3" />
                                <span>FALTA: {!t.codigo_sap && "SAP"} {!t.codigo_sap && !t.partida_registral && "|"} {!t.partida_registral && "Partida"}</span>
                             </div>
                          )}
                       </div>
                    </td>
                    <td className="px-8 py-6 border-none">
                      <div className="flex items-center justify-center gap-2 outline-none transition-all duration-300">
                        <button 
                          onClick={() => handleEdit(t)}
                          className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300 shadow-sm active:scale-95"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => toggleEstado(t.id, t.estado)}
                          disabled={updatingId === t.id}
                          className={cn(
                            "h-9 w-9 border border-transparent rounded-lg flex items-center justify-center transition-all duration-300 bg-white shadow-sm active:scale-95",
                            updatingId === t.id ? "opacity-50 cursor-not-allowed" :
                            t.estado === "ACTIVO" 
                              ? "hover:bg-rose-500 hover:text-white hover:border-rose-500 text-slate-300" 
                              : "hover:bg-emerald-500 hover:text-white hover:border-emerald-500 text-slate-300"
                          )}
                        >
                          {updatingId === t.id ? (
                             <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                          ) : t.estado === "ACTIVO" ? (
                             <XCircle className="h-4 w-4" />
                          ) : (
                             <CheckCircle2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {transportistas.length === 0 && (
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

        {!isLoading && totalPages > 1 && (
           <div className="px-8 py-8 border-t border-slate-50 bg-white/50 flex items-center justify-between font-['Outfit']">
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Página</span>
                 <div className="h-10 px-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm">
                   <span className="text-sm font-bold text-emerald-700">{page} <span className="text-slate-300 mx-1">/</span> {totalPages}</span>
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">
                   Mostrando {transportistas.length} de {totalRecords} registros operativos
                 </span>
              </div>

              <div className="flex items-center gap-3">
                 <button 
                   onClick={() => setPage(p => Math.max(1, p - 1))}
                   disabled={page === 1}
                   className="h-12 px-6 bg-white border border-slate-100 rounded-2xl flex items-center gap-2 text-slate-600 font-bold text-xs hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed group"
                 >
                   <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                   Anterior
                 </button>
                 <button 
                   onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                   disabled={page === totalPages}
                   className="h-12 px-8 bg-emerald-950 text-white rounded-2xl flex items-center gap-2 font-bold text-xs hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-950/10 disabled:opacity-30 disabled:cursor-not-allowed group"
                 >
                   Siguiente
                   <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                 </button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
