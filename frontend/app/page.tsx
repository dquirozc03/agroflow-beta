"use client";

import React, { useState } from "react";
import { 
  Scan, 
  Container, 
  BookOpen, 
  Truck, 
  ShieldCheck, 
  Thermometer, 
  Hash, 
  Plus,
  FileText,
  BadgeCheck,
  Zap,
  Target,
  Layers,
  BarChart3,
  Search,
  CheckCircle2,
  AlertCircle,
  Download,
  MoreHorizontal,
  ChevronRight,
  User,
  Activity,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Users,
  Droplets,
  CloudSun,
  LayoutGrid,
  MapPin,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";

// --- Componentes UX Agro Inmaculado (Dashboard Version) ---

function StatCard({ title, value, icon: Icon, trend, trendValue, colorClass, desc }: any) {
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
           {desc || "Promedio Estimado"}
        </p>
      </div>
    </div>
  );
}

function WeatherDay({ day, temp, icon: Icon }: any) {
  return (
    <div className="flex flex-col items-center gap-2 p-3">
      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{day}</span>
      <Icon className="h-4 w-4 text-emerald-500" />
      <span className="text-xs font-bold text-slate-800">{temp}°</span>
    </div>
  );
}

// --- Dashboard Principal: Agro Hub (Carlos style) ---

export default function AgroHubDashboardPage() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f6f8fa]">
      {/* SIDEBAR FIJO (AGRO INMACULADO) */}
      <AppSidebar />

      {/* CONTENIDO CENTRAL CARLOS STYLE */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader />

        <main className="flex-1 overflow-y-auto p-10 lc-scroll pt-2">
          <div className="max-w-[1500px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            
            {/* Row 1: Agro Stats Grid (4 Cards Superiores) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <StatCard title="1. Humedad del Suelo" value="68%" icon={Droplets} trendValue="up" desc="Averagio Estimado" />
               <StatCard title="2. Temperatura del Aire" value="24°C" icon={Thermometer} desc="Promedio del Día" />
               <StatCard title="3. Estado del Riego" value="Sincronizado" icon={CheckCircle2} desc="3 sistemas activos" />
               <StatCard title="4. Alertas Activas" value="2" icon={AlertCircle} colorClass="bg-emerald-50/80 border-emerald-100" desc="advertencias críticas" />
            </div>

            {/* Main Content Area (Two Columns Layout) */}
            <div className="grid grid-cols-12 gap-6">
               
               {/* IZQUIERDA: Mapa del Campo (Sat View Reference) */}
               <div className="col-span-12 lg:col-span-9 bg-white rounded-[2rem] border border-slate-100 px-4 py-4 shadow-sm relative overflow-hidden group">
                  <div className="h-[600px] w-full rounded-[1.5rem] bg-slate-100 overflow-hidden relative border border-slate-50">
                     {/* Imagen Satelital Simulada de Alta Calidad */}
                     <img 
                        src="https://images.unsplash.com/photo-1500382017468-9049fee74a62?auto=format&fit=crop&q=80&w=2000" 
                        alt="Campo de Cultivo" 
                        className="h-full w-full object-cover grayscale-[0.3] brightness-[0.85] contrast-[1.1]"
                     />
                     
                     {/* Superposición de Lotes (Colores de la referncia) */}
                     <div className="absolute inset-0 bg-transparent flex items-center justify-center">
                        {/* Lote 1 - Verde Intenso */}
                        <div className="absolute top-[10%] left-[35%] w-[180px] h-[300px] bg-emerald-500/60 border-2 border-emerald-400/80 -rotate-[15deg] backdrop-blur-[2px] cursor-pointer hover:bg-emerald-500/80 transition-all flex items-center justify-center">
                           <div className="bg-white p-1 rounded-full shadow-lg h-8 w-8 flex items-center justify-center">
                              <MapPin className="h-4 w-4 text-emerald-600" />
                           </div>
                        </div>
                        {/* Lote 2 - Lima Brillante */}
                        <div className="absolute top-[35%] left-[55%] w-[150px] h-[350px] bg-lime-400/60 border-2 border-lime-300/80 -rotate-[15deg] backdrop-blur-[2px] cursor-pointer hover:bg-lime-400/80 transition-all flex items-center justify-center">
                           <div className="bg-white p-1 rounded-full shadow-lg h-8 w-8 flex items-center justify-center">
                              <MapPin className="h-4 w-4 text-lime-600" />
                           </div>
                        </div>
                        {/* Lote 3 - Amarillo Ambar */}
                        <div className="absolute top-[50%] left-[70%] w-[130px] h-[250px] bg-amber-400/60 border-2 border-amber-300/80 -rotate-[15deg] backdrop-blur-[2px] cursor-pointer hover:bg-amber-400/80 transition-all flex items-center justify-center">
                           <div className="bg-white p-1 rounded-full shadow-lg h-8 w-8 flex items-center justify-center">
                              <MapPin className="h-4 w-4 text-amber-600" />
                           </div>
                        </div>
                     </div>

                     {/* Controles del Mapa Slim */}
                     <div className="absolute top-6 left-6 flex flex-col gap-2">
                        <button className="h-10 w-10 bg-white border border-slate-100 rounded-xl shadow-lg flex items-center justify-center text-slate-900 font-bold text-xl hover:scale-110 active:scale-95 transition-all text-[12px]">
                           +
                        </button>
                        <button className="h-10 w-10 bg-white border border-slate-100 rounded-xl shadow-lg flex items-center justify-center text-slate-900 font-bold text-xl hover:scale-110 active:scale-95 transition-all text-[12px]">
                           -
                        </button>
                     </div>

                     <div className="absolute top-6 right-6 flex items-center gap-3">
                        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-xl shadow-lg text-[11px] font-black uppercase tracking-widest text-[#022c22] hover:bg-slate-50 transition-all">
                           <LayoutGrid className="h-4 w-4 text-emerald-500" />
                           Switch View
                        </button>
                        <button className="h-11 w-11 bg-white border border-slate-100 rounded-xl shadow-lg flex items-center justify-center text-slate-500 active:scale-95">
                           <Layers className="h-5 w-5" />
                        </button>
                     </div>
                  </div>
               </div>

               {/* DERECHA: Clima & Alertas List (Carlos style) */}
               <div className="col-span-12 lg:col-span-3 space-y-8">
                  
                  {/* Clima Card Inmaculada */}
                  <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                     <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-widest leading-none mb-8">Clima en Tiempo Real</h3>
                     <div className="flex items-center justify-between mb-8">
                        <CloudSun className="h-14 w-14 text-[#022c22] opacity-80" />
                        <div className="text-right">
                           <p className="text-5xl font-extrabold tracking-tighter text-[#022c22] font-['Outfit']">23°</p>
                           <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Cielo Despejado</p>
                        </div>
                     </div>
                     <div className="flex justify-between mt-8 border-t border-slate-50 pt-6">
                        <WeatherDay day="3 día" temp="23" icon={CloudSun} />
                        <WeatherDay day="3 día" temp="24" icon={Sun} />
                        <WeatherDay day="3 día" temp="23" icon={CloudSun} />
                     </div>
                  </div>

                  {/* Alertas Recientes List (Carlos Style) */}
                  <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm flex flex-col flex-1">
                     <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-widest leading-none mb-8">Alertas Recientes</h3>
                     
                     <div className="space-y-6 flex-1 pr-2 lc-scroll">
                        {[
                          { title: "Campo 4: Baja humedad detectada", date: "Hace 10 min", icon: AlertCircle, color: "text-rose-500" },
                          { title: "Mantenimiento de Tractor Completado", date: "Hace 2 horas", icon: CheckCircle2, color: "text-emerald-500" },
                          { title: "Nivel de Riego en Campo 2 Estable", date: "Hace 4 horas", icon: Droplets, color: "text-sky-500" }
                        ].map((alert, i) => (
                          <div key={i} className="flex gap-4 group cursor-pointer">
                             <div className={cn("h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-slate-100 transition-all", alert.color.replace('text', 'bg').replace('500', '100'))}>
                                <alert.icon className={cn("h-5 w-5", alert.color)} />
                             </div>
                             <div>
                                <p className="text-xs font-bold text-slate-800 leading-tight">{alert.title}</p>
                                <p className="text-[10px] font-medium text-slate-300 mt-2 uppercase tracking-tighter">{alert.date}</p>
                             </div>
                             {i === 0 && <div className="ml-auto h-2 w-2 rounded-full bg-emerald-500 mt-1 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />}
                          </div>
                        ))}
                     </div>
                     
                     <button className="mt-10 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all">
                        Ver todas las alertas
                     </button>
                  </div>

               </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

function Sun(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  )
}
