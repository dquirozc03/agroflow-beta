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
  Trash2,
  Ban,
  ShieldCheck
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
  pais: string;
  destino: string;
  estado: string;
}

export default function ClientesIEPage() {
  const [clientes, setClientes] = useState<ClienteIE[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);

  const getCultivoIcon = (cultivo: string) => {
    const c = (cultivo || "").toUpperCase();
    if (c.includes("GRANADA")) return "🍎";
    if (c.includes("ARANDANO")) return "🫐";
    if (c.includes("UVA")) return "🍇";
    if (c.includes("PALTA") || c.includes("AVOCADO")) return "🥑";
    if (c.includes("MANGO")) return "🥭";
    if (c.includes("ESPARRAGO")) return "🎋";
    if (c.includes("CITRICO") || c.includes("NARANJA") || c.includes("LIMON")) return "🍊";
    return "📦";
  };
  const [statusModal, setStatusModal] = useState<{ open: boolean; mode: 'ACTIVO' | 'INACTIVO'; title: string }>({
    open: false,
    mode: 'ACTIVO',
    title: ''
  });

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

  const handleToggleStatus = async (id: number, nombre: string, currentStatus: string) => {
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
    }
  };

  const filtered = clientes.filter(c => {
    const search = searchTerm.toLowerCase();
    const nombre = (c.nombre_legal || "").toLowerCase();
    const pais = (c.pais || "").toLowerCase();
    const destino = (c.destino || "").toLowerCase();

    return nombre.includes(search) || pais.includes(search) || destino.includes(search);
  });

  const ITEMS_PER_PAGE = 10;
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

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
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl px-6 flex items-center justify-between shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Clientes</p>
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/30 font-['Outfit']">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-r border-slate-200/80 text-center">Identificación de Cliente</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-r border-slate-200/80 text-center">Cultivo</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-r border-slate-200/80 text-center">País / Destino</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-r border-slate-200/80 text-center">Estado</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 font-['Inter']">
                {currentItems.map((c) => (
                  <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-7 border-r border-slate-200/80">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm shrink-0 transition-colors",
                          c.estado === "ACTIVO" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
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
                    <td className="px-8 py-7 border-r border-slate-200/80">
                      <div className="flex justify-center">
                        <Badge className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-3 h-7 transition-all flex items-center gap-2",
                          c.estado === "ACTIVO"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm"
                            : "bg-slate-100 text-slate-400 border-slate-200 grayscale opacity-70"
                        )}>
                          <span className="text-sm">{getCultivoIcon(c.cultivo || "")}</span>
                          {c.cultivo || "N/A"}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-8 py-7 border-r border-slate-200/80">
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
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-7 border-r border-slate-200/80">
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
                          title="Duplicar para nueva ruta"
                          className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all duration-300 shadow-sm group active:scale-95"
                        >
                          <Copy className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(c.id, c.nombre_legal, c.estado)}
                          title={c.estado === "ACTIVO" ? "Inhabilitar" : "Habilitar"}
                          className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                            c.estado === "ACTIVO"
                              ? "bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                              : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                          )}
                        >
                          {c.estado === "ACTIVO" ? <Ban className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
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

      {/* Paginación */}
      {!isLoading && filtered.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <p className="text-xs text-slate-500 font-medium">
            Mostrando <span className="font-bold text-slate-800">{indexOfFirstItem + 1}</span> a <span className="font-bold text-slate-800">{Math.min(indexOfLastItem, filtered.length)}</span> de <span className="font-bold text-slate-800">{filtered.length}</span> entradas
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:text-slate-500"
            >
              Anterior
            </button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "w-8 h-8 rounded-xl text-xs font-bold transition-all",
                    currentPage === i + 1
                      ? "bg-[#022c22] text-white shadow-md shadow-emerald-900/10"
                      : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:text-slate-500"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
