import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/constants";
import { Loader2, Ship, Search, Calendar, CheckCircle2, AlertCircle, FileX, Truck, FileText, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function EmbarquesSemana({ filters }: { filters: { planta: string; cultivo: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

  const fetchEmbarques = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.planta) params.append("planta", filters.planta);
    if (filters.cultivo) params.append("cultivo", filters.cultivo);
    if (search) {
      params.append("q", search);
    }

    fetch(`${API_BASE_URL}/api/v1/dashboard/embarques-semana?${params.toString()}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchEmbarques();
      setCurrentPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [filters, search]);

  if (loading && !data) {
    return (
      <div className="flex w-full items-center justify-center py-24 bg-white rounded-[2rem] border border-slate-100 shadow-sm mt-6">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mb-4" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando embarques...</p>
        </div>
      </div>
    );
  }

  const embarques = data?.embarques || [];
  
  // Lógica de Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = embarques.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(embarques.length / itemsPerPage);

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm mt-6 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER TABLA */}
      <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <Ship className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 font-['Outfit'] tracking-tight">
              Embarques WK {data?.semana_actual || '--'}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {formatDate(data?.fecha_inicio)} AL {formatDate(data?.fecha_fin)} · {data?.total_registros || 0} REGISTROS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar Booking u Orden..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
            />
          </div>
          <button onClick={fetchEmbarques} className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm" title="Actualizar datos">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin text-emerald-500")} />
          </button>
        </div>
      </div>

      {/* TABLA */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-white">
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Embarque</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Logística</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Posicionamiento</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">DAM</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Contenedor</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <FileX className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No hay embarques en esta semana</p>
                </td>
              </tr>
            ) : (
              currentItems.map((emb: any, idx: number) => {
                const isEmbarcado = emb.estado === "EMBARCADO";
                return (
                <tr key={idx} className={cn("group hover:bg-slate-50/50 transition-colors", isEmbarcado && "opacity-60 bg-slate-50/30")}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800 font-['Outfit']">{emb.booking}</span>
                      <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">OB: {emb.orden_beta || 'S/N'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-slate-300" />
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{emb.operador || 'No asignado'}</span>
                    </div>
                    <div className="flex gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[8px] bg-white border-slate-200 font-black px-1.5 py-0">{emb.planta}</Badge>
                      <Badge variant="outline" className="text-[8px] bg-white border-slate-200 font-black px-1.5 py-0">{emb.cultivo}</Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-700">{formatDate(emb.fecha_posicionamiento)}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 mt-1 ml-5 uppercase tracking-widest">{emb.hora_posicionamiento || 'Hora Pendiente'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {emb.falta_dam && !isEmbarcado ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-100 text-rose-600 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                        <AlertCircle className="h-3 w-3" /> Falta DAM
                      </span>
                    ) : (
                      <span className="text-[11px] font-black text-emerald-600">{emb.dam || '-'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {emb.falta_contenedor && !isEmbarcado ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-100 text-rose-600 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                        <AlertCircle className="h-3 w-3" /> Falta Equipo
                      </span>
                    ) : (
                      <span className="text-[11px] font-black text-emerald-600">{emb.contenedor || '-'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {isEmbarcado ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Embarcado
                      </span>
                    ) : emb.estado === "COMPLETO" ? (
                      <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto" title="Listo para embarque">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto" title={emb.estado}>
                        <AlertCircle className="h-5 w-5" />
                      </div>
                    )}
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, embarques.length)} de {embarques.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 rounded-lg flex items-center justify-center border border-slate-200 bg-white text-slate-400 disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1 px-2">
              <span className="text-xs font-black text-slate-700">{currentPage}</span>
              <span className="text-[10px] font-bold text-slate-400">/ {totalPages}</span>
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 rounded-lg flex items-center justify-center border border-slate-200 bg-white text-slate-400 disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
