"use client";

import React, { useState, useEffect } from "react";
import { 
  PackageSearch, 
  Ship, 
  FileText, 
  AlertCircle,
  TrendingUp,
  MapPin,
  CalendarClock,
  BookOpen,
  Filter,
  X
} from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// --- Components ---
function StatCard({ title, value, icon: Icon, trendValue, colorClass, desc }: any) {
  return (
    <div className={cn(
      "bg-white rounded-[1.5rem] p-7 border border-slate-100 shadow-sm transition-all hover:bg-slate-50 relative group overflow-hidden",
      colorClass
    )}>
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">{title}</h4>
        <Icon className={cn("h-4 w-4", !colorClass ? "text-slate-300 group-hover:text-emerald-500" : "text-emerald-700")} />
      </div>
      <div className="space-y-2">
        <div className="flex items-end gap-3">
          <p className="text-3xl font-extrabold tracking-tighter text-[#022c22] leading-none">{value}</p>
          {trendValue && (
             <div className="h-6 w-16 mb-1 bg-emerald-50 rounded-full flex items-center justify-center">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
             </div>
          )}
        </div>
        <p className={cn("text-[10px] font-bold uppercase tracking-wider", !colorClass ? "text-slate-300" : "text-emerald-700")}>
           {desc}
        </p>
      </div>
    </div>
  );
}

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#64748b'];

export default function AgroHubDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<any>({ plantas: [], cultivos: [] });
  const [filters, setFilters] = useState({ planta: "", cultivo: "" });

  // Fetch Metadata (Plants/Crops)
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/dashboard/metadata`)
      .then(res => res.json())
      .then(m => setMetadata(m))
      .catch(err => console.error("Metadata error:", err));
  }, []);

  // Fetch Dashboard Data
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.planta) params.append("planta", filters.planta);
    if (filters.cultivo) params.append("cultivo", filters.cultivo);

    fetch(`${API_BASE_URL}/api/v1/dashboard/summary?${params.toString()}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [filters]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f6f8fa]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-4"></div>
          <p className="text-emerald-800 font-bold uppercase tracking-widest text-xs">Cargando Centro de Comando...</p>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const barData = data?.despachos_por_dia || [];
  const pieData = data?.distribucion_cultivos || [];
  const ultimos = data?.ultimos_registros || [];
  const proximos = data?.proximos_posicionamientos || [];

  const currentMonth = new Date().toLocaleString('es-ES', { month: 'long' });
  const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f6f8fa]">
      <AppSidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader />

        <main className="flex-1 overflow-y-auto p-10 lc-scroll pt-2">
          <div className="max-w-[1500px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            
            {/* FILTER BAR */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-4 rounded-3xl border border-slate-200/60 shadow-sm">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                     <Filter className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Filtros de Análisis</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Segmentación de datos operativos</p>
                  </div>
               </div>

               <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Planta:</span>
                     <select 
                        className="text-xs font-bold text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer outline-none min-w-[120px]"
                        value={filters.planta}
                        onChange={(e) => setFilters(prev => ({ ...prev, planta: e.target.value }))}
                     >
                        <option value="">TODAS</option>
                        {metadata.plantas.map((p: string) => (
                           <option key={p} value={p}>{p}</option>
                        ))}
                     </select>
                  </div>

                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cultivo:</span>
                     <select 
                        className="text-xs font-bold text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer outline-none min-w-[120px]"
                        value={filters.cultivo}
                        onChange={(e) => setFilters(prev => ({ ...prev, cultivo: e.target.value }))}
                     >
                        <option value="">TODOS</option>
                        {metadata.cultivos.map((c: string) => (
                           <option key={c} value={c}>{c}</option>
                        ))}
                     </select>
                  </div>

                  {(filters.planta || filters.cultivo) && (
                    <button 
                      onClick={() => setFilters({ planta: "", cultivo: "" })}
                      className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
                      title="Limpiar Filtros"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
               </div>
            </div>
            {/* ROW 1: KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <StatCard 
                 title="1. Contenedores Despachados" 
                 value={kpis.contenedores_procesados || 0} 
                 icon={PackageSearch} 
                 trendValue="up" 
                 desc="Procesados Exitosamente" 
               />
               <StatCard 
                 title="2. Maestros por Completar" 
                 value={kpis.maestros_incompletos || 0} 
                 icon={BookOpen} 
                 colorClass={kpis.maestros_incompletos > 0 ? "bg-amber-50/80 border-amber-100" : ""}
                 desc="Registros con datos faltantes" 
               />
               <StatCard 
                 title="3. Programados (Hoy)" 
                 value={kpis.programados_hoy || 0} 
                 icon={CalendarClock} 
                 desc="Posicionamientos para hoy" 
               />
               <StatCard 
                 title="4. Alertas Operativas" 
                 value={kpis.alertas_activas || 0} 
                 icon={AlertCircle} 
                 colorClass={kpis.alertas_activas > 0 ? "bg-rose-50/80 border-rose-100" : "bg-emerald-50/80 border-emerald-100"} 
                 desc="Pendientes y Anulados" 
               />
            </div>

            {/* ROW 2: Charts Area */}
            <div className="grid grid-cols-12 gap-6">
               
               {/* Gráfico de Barras */}
               <div className="col-span-12 lg:col-span-8 bg-white rounded-[2rem] border border-slate-100 px-8 py-8 shadow-sm">
                  <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-widest leading-none mb-8">Volumen de Despachos (Semana Actual - {capitalizedMonth})</h3>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="fecha" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} 
                          dy={10}
                        />
                        <YAxis 
                          allowDecimals={false}
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="cantidad" fill="#10b981" radius={[6, 6, 6, 6]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               {/* Gráfico de Dona */}
               <div className="col-span-12 lg:col-span-4 bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                  <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-widest leading-none mb-4">Distribución por Cultivos</h3>
                  <div className="h-[300px] w-full flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={5}
                          dataKey="cantidad"
                          nameKey="cultivo"
                          stroke="none"
                        >
                          {pieData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span className="text-3xl font-extrabold text-[#022c22]">{pieData.reduce((acc: number, cur: any) => acc + cur.cantidad, 0)}</span>
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total</span>
                    </div>
                  </div>
                  {/* Leyenda manual */}
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {pieData.map((entry: any, index: number) => (
                       <div key={index} className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span className="text-xs font-bold text-slate-600 truncate">{entry.cultivo}</span>
                       </div>
                    ))}
                  </div>
               </div>

            </div>

            {/* ROW 3: Tablas */}
            <div className="grid grid-cols-12 gap-6">
              
              {/* Últimos Registros */}
              <div className="col-span-12 lg:col-span-6 bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                 <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-widest leading-none mb-6">Últimos Contenedores Procesados (En Vivo)</h3>
                 <div className="space-y-4">
                    {ultimos.map((reg: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
                              <PackageSearch className="h-5 w-5 text-emerald-500" />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-slate-800">{reg.contenedor}</p>
                              <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-tighter">BKG: {reg.booking} • {reg.transportista}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <span className={cn(
                             "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                             reg.status === 'PROCESADO' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                           )}>
                             {reg.status}
                           </span>
                           <p className="text-xs font-bold text-slate-400 mt-2">{reg.hora}</p>
                        </div>
                      </div>
                    ))}
                    {ultimos.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-4">No hay registros recientes.</p>
                    )}
                 </div>
              </div>

              {/* Próximos Posicionamientos */}
              <div className="col-span-12 lg:col-span-6 bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                 <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-widest leading-none mb-6">Próximos Posicionamientos (Programados)</h3>
                 <div className="space-y-4">
                    {proximos.map((pos: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
                              <CalendarClock className="h-5 w-5 text-sky-500" />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-slate-800">
                                {pos.booking}
                                <span className="text-slate-400 font-medium text-xs ml-2">({pos.orden_beta})</span>
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3 text-slate-400" />
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter truncate max-w-[150px]">
                                  {pos.planta_llenado}
                                </p>
                              </div>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-xs font-black text-slate-800">{pos.fecha_programada}</p>
                           <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{pos.nave}</p>
                        </div>
                      </div>
                    ))}
                    {proximos.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-4">No hay posicionamientos programados.</p>
                    )}
                 </div>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
