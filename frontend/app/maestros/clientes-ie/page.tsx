"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Trash2,
  Ban,
  ShieldCheck,
  Filter,
  ChevronDown,
  Check,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/lib/constants";
import { ClienteIEModal } from "../../../components/cliente-ie-modal";

interface ClienteIE {
  id: number;
  nombre_legal: string;
  cultivo?: string;
  eori_consignatario: string;
  eori_notify: string;
  po?: string;
  pais: string;
  destino: string;
  estado: string;
}

export default function ClientesIEPage() {
  const [clientes, setClientes] = useState<ClienteIE[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCultivo, setSelectedCultivo] = useState("TODOS");
  const [isCultivoMenuOpen, setIsCultivoMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [statusModal, setStatusModal] = useState<{ open: boolean; mode: 'ACTIVO' | 'INACTIVO'; title: string }>({
    open: false,
    mode: 'ACTIVO',
    title: ''
  });

  useEffect(() => {
    fetchClientes();
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsCultivoMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    setUpdatingId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/maestros/clientes-ie/${id}/duplicate`, {
        method: 'POST'
      });
      if (response.ok) {
        setStatusModal({
          open: true,
          mode: 'ACTIVO', // Usamos ACTIVO para el verde
          title: "¡Duplicación Exitosa!"
        });
        setTimeout(() => setStatusModal(prev => ({ ...prev, open: false })), 3000);
        fetchClientes();
      }
    } catch (error) {
      toast.error("Error al duplicar maestro");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleStatus = async (id: number, nombre: string, currentStatus: string) => {
    setUpdatingId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/maestros/clientes-ie/${id}/toggle-status`, {
        method: 'PATCH'
      });
      if (response.ok) {
        const nextStatus = currentStatus === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        setStatusModal({
          open: true,
          mode: nextStatus as any,
          title: nombre
        });

        // Auto-cierre en 3 segundos
        setTimeout(() => {
          setStatusModal(prev => ({ ...prev, open: false }));
        }, 3000);

        fetchClientes();
      }
    } catch (error) {
      toast.error("Error al cambiar estado");
    } finally {
      setUpdatingId(null);
    }
  };

  // --- Lógica de Filtros ---
  const cultivosDisponibles = useMemo(() => {
    const list = clientes.map(c => c.cultivo).filter(Boolean) as string[];
    return ["TODOS", ...Array.from(new Set(list))].sort();
  }, [clientes]);

  const filtered = clientes.filter(c => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (c.nombre_legal || "").toLowerCase().includes(search) || 
                          (c.pais || "").toLowerCase().includes(search) || 
                          (c.destino || "").toLowerCase().includes(search);
    const matchesCultivo = selectedCultivo === "TODOS" || c.cultivo === selectedCultivo;
    return matchesSearch && matchesCultivo;
  });

  const ITEMS_PER_PAGE = 10;
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCultivo]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <ClienteIEModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchClientes}
        editingData={editingData}
      />

      {/* Modal de Estado dinámico estilo Carlos 💎 */}
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
                El cliente <br />
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
                <Globe className="h-5 w-5" />
             </div>
             <h1 className="text-3xl font-extrabold tracking-tighter text-emerald-950 font-['Outfit']">
                Clientes <span className="text-emerald-500">IE</span>
             </h1>
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-13">
             Rutas y consignatarios para Instrucciones de Embarque
          </p>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={fetchClientes}
             className="h-12 w-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-100 transition-all shadow-sm active:scale-95 group"
           >
              <RefreshCw className={cn("h-5 w-5 transition-transform group-hover:rotate-180 duration-500", isLoading && "animate-spin")} />
           </button>
           <button 
             onClick={() => { setEditingData(null); setIsModalOpen(true); }}
             className="h-12 px-6 bg-emerald-950 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[11px] flex items-center gap-2 hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-950/20 active:scale-95 border-none"
           >
              <Plus className="h-4 w-4" />
              Nuevo Cliente IE
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm items-end transition-all duration-500">
        <div className="lg:col-span-3 space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Búsqueda Rápida</label>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por Cliente, País o Destino..."
              className="w-full h-11 pl-12 pr-6 bg-slate-50/50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-2 relative" ref={menuRef}>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Filtrar Cultivo</label>
          <button
            onClick={() => setIsCultivoMenuOpen(!isCultivoMenuOpen)}
            className={cn(
              "w-full h-11 flex items-center gap-4 bg-slate-50/50 border rounded-2xl px-6 transition-all text-left group",
              isCultivoMenuOpen ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-slate-100 hover:border-emerald-200"
            )}
          >
            <span className="flex-1 text-[11px] font-black uppercase text-slate-900 truncate">
              {selectedCultivo}
            </span>
            <ChevronDown className={cn("h-4 w-4 text-slate-300 transition-transform duration-300", isCultivoMenuOpen && "rotate-180")} />
          </button>

          {isCultivoMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-[100] bg-[#022c22]/95 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-2 animate-in zoom-in-95 slide-in-from-top-2 duration-300 origin-top">
               <div className="px-4 py-3 mb-1 border-b border-white/5">
                 <p className="text-[9px] font-black text-emerald-400/70 uppercase tracking-[0.3em]">Seleccionar Cultivo</p>
               </div>
               <div className="max-h-[280px] overflow-y-auto lc-scroll pr-1">
                  {cultivosDisponibles.map((cult) => (
                    <button
                      key={cult}
                      onClick={() => {
                        setSelectedCultivo(cult);
                        setIsCultivoMenuOpen(false);
                      }}
                      className={cn(
                        "w-full px-5 py-3.5 flex items-center justify-between rounded-xl transition-all text-left group/item mb-1",
                        selectedCultivo === cult 
                          ? "bg-emerald-500/20 text-emerald-300 border-l-2 border-emerald-400" 
                          : "hover:bg-white/10 text-white/70 hover:text-white"
                      )}
                    >
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">{cult}</span>
                      {selectedCultivo === cult && (
                        <Check className="h-4 w-4 text-emerald-400" />
                      )}
                    </button>
                  ))}
               </div>
            </div>
          )}
        </div>

        <div className="bg-emerald-50/30 border border-emerald-100 rounded-[1.5rem] px-6 h-11 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60">Registros</p>
          <p className="text-xl font-black text-emerald-900">{filtered.length}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-300 font-['Outfit']">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando Maestros...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50 font-['Outfit']">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-none text-center">Identificación de Cliente</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-none text-center">Cultivo</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-none text-center">País / Destino</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-none text-center">Estado</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center border-none">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 font-['Inter']">
                {currentItems.map((c) => (
                  <tr key={c.id} className="group hover:bg-emerald-50/10 transition-colors border-none">
                    <td className="px-8 py-7 border-none">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm shrink-0 transition-colors",
                          c.estado === "ACTIVO" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                        )}>
                          <Globe className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className={cn(
                            "text-sm font-extrabold tracking-tight uppercase truncate transition-colors",
                            c.estado === "ACTIVO" ? "text-slate-800" : "text-slate-400"
                          )}>
                            {c.nombre_legal}
                          </p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">Consignatario BL</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-7 border-none">
                      <div className="flex justify-center">
                        <Badge className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-3 h-7 transition-all flex items-center gap-2",
                          c.estado === "ACTIVO"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm"
                            : "bg-slate-100 text-slate-400 border-slate-200 grayscale opacity-70"
                        )}>
                          {c.cultivo || "N/A"}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-8 py-7 border-none">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <Navigation className={cn(
                            "h-3.5 w-3.5 shrink-0 transition-colors",
                            c.estado === "ACTIVO" ? "text-emerald-500" : "text-slate-300"
                          )} />
                          <span className={cn(
                            "text-xs font-black uppercase tracking-tight transition-colors",
                            c.estado === "ACTIVO" ? "text-slate-700" : "text-slate-400"
                          )}>{c.pais}</span>
                        </div>
                        <div className="flex items-center gap-2 pl-5">
                          <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.destino}</span>
                          {c.po && (
                            <Badge className="ml-2 bg-amber-50 text-amber-600 border-amber-100 text-[8px] font-black h-5 uppercase">PO: {c.po}</Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-7 border-none">
                      <div className="flex justify-center">
                        <Badge className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-3 h-6",
                          c.estado === "ACTIVO"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-slate-100 text-slate-400 border-slate-200"
                        )}>
                          {c.estado}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-8 py-7">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleDuplicate(c.id)}
                          disabled={updatingId === c.id}
                          title="Duplicar para nueva ruta"
                          className={cn(
                            "h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm group active:scale-95",
                            updatingId === c.id ? "opacity-50 cursor-not-allowed" : "text-slate-400 hover:bg-amber-500 hover:text-white hover:border-amber-500"
                          )}
                        >
                          {updatingId === c.id ? <Loader2 className="h-4 w-4 animate-spin text-emerald-500" /> : <Copy className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                        </button>
                        <button
                          onClick={() => handleToggleStatus(c.id, c.nombre_legal, c.estado)}
                          disabled={updatingId === c.id}
                          title={c.estado === "ACTIVO" ? "Inhabilitar" : "Habilitar"}
                          className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95",
                            updatingId === c.id ? "opacity-50 cursor-not-allowed bg-slate-50" :
                            c.estado === "ACTIVO"
                              ? "bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border hover:border-rose-200"
                              : "bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white hover:border hover:border-emerald-500"
                          )}
                        >
                          {updatingId === c.id ? <Loader2 className="h-4 w-4 animate-spin text-emerald-500" /> : c.estado === "ACTIVO" ? <Ban className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
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

        {!isLoading && totalPages > 1 && (
           <div className="px-8 py-8 border-t border-slate-50 bg-white/50 flex items-center justify-between font-['Outfit']">
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Página</span>
                 <div className="h-10 px-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm">
                   <span className="text-sm font-bold text-emerald-700">{currentPage} <span className="text-slate-300 mx-1">/</span> {totalPages}</span>
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">
                   Mostrando {currentItems.length} de {filtered.length} registros operativos
                 </span>
              </div>

              <div className="flex items-center gap-3">
                 <button 
                   onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                   disabled={currentPage === 1}
                   className="h-12 px-6 bg-white border border-slate-100 rounded-2xl flex items-center gap-2 text-slate-600 font-bold text-xs hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed group"
                 >
                   <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                   Anterior
                 </button>
                 <button 
                   onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                   disabled={currentPage === totalPages}
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
