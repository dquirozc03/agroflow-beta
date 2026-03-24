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
  MoreHorizontal,
  RotateCcw,
  Settings,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/app-header";

// --- Componentes UX Beta Clean (Style: Dashboard Reference) ---

function DashboardCard({ title, subtitle, icon: Icon, children, className, actionIcon: ActionIcon }: any) {
  return (
    <div className={cn(
      "bg-white rounded-[1.25rem] p-7 border border-slate-100 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_45px_-10px_rgba(0,0,0,0.05)] group",
      className
    )}>
      <div className="flex justify-between items-start mb-8 relative">
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-[#022c22] leading-none">
            {title}
          </h2>
          <p className="text-slate-400 text-[11px] font-medium tracking-tight">
            {subtitle}
          </p>
        </div>
        <div className="flex gap-2">
           <button className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
           </button>
        </div>
      </div>

      <div className="space-y-6 relative">
        {children}
      </div>
    </div>
  )
}

function InputMinimal({ label, placeholder, icon: Icon }: any) {
  return (
    <div className="space-y-1.5 group">
      <label className="text-[11px] font-bold text-slate-500 ml-1 block leading-none">
        {label}
      </label>
      <div className="relative">
        <input 
          type="text" 
          placeholder={placeholder}
          className="w-full bg-slate-50/50 rounded-xl py-3 px-4 outline-none border border-slate-100 focus:bg-white focus:border-emerald-500/30 text-sm font-medium text-slate-700 placeholder-slate-300 transition-all"
        />
        {Icon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-200">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}

// --- Dashboard Principal: LogiCapture Hub ---

export default function LogicCaptureDashboardPage() {
  const [ocrMode, setOcrMode] = useState<"booking" | "contenedor">("contenedor");

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f1f5f9]">
      <AppHeader title="LOGICAPTURE HUB" onOpenScanner={() => {}} />

      <main className="flex-1 overflow-y-auto p-12 lc-scroll">
        <div className="max-w-[1600px] mx-auto space-y-10">
          
          {/* Dashboard Title & Master Action (Referencia Calcada) */}
          <div className="flex items-center justify-between mb-2">
             <h1 className="text-3xl font-extrabold text-[#022c22] tracking-tighter italic">Dashboard</h1>
             <div className="flex gap-3">
                <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95">
                   <Plus className="h-4 w-4" />
                   Create New Log
                </button>
                <div className="flex gap-1.5 ml-2">
                   <button className="h-10 w-10 flex items-center justify-center bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all">
                      <RotateCcw className="h-4.5 w-4.5" />
                   </button>
                   <button className="h-10 w-10 flex items-center justify-center bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all">
                      <Settings className="h-4.5 w-4.5" />
                   </button>
                </div>
             </div>
          </div>

          {/* Grid Operativa 3 Columnas (Style Reference) */}
          <div className="grid grid-cols-12 gap-8">
            
            {/* IZQUIERDA: Active Logs (Graph) */}
            <DashboardCard title="Active Logs" subtitle="Logs output v. active logs" icon={BarChart3} className="col-span-12 lg:col-span-5">
               <div className="flex items-center gap-6 mb-2">
                   <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-slate-700">Active Logs</span>
                   </div>
                   <div className="flex items-center gap-2 opacity-50">
                      <div className="h-2 w-2 rounded-full bg-emerald-200" />
                      <span className="text-xs font-bold text-slate-700">New Logs</span>
                   </div>
               </div>
               <div className="h-52 w-full flex items-center justify-center bg-white overflow-hidden relative">
                  <svg className="w-full h-full" viewBox="0 0 400 150">
                     <defs>
                        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
                           <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                     </defs>
                     <path d="M0,130 Q50,110 100,120 T200,80 T300,100 T430,40" fill="url(#lineGrad)" />
                     <path d="M0,130 Q50,110 100,120 T200,80 T300,100 T430,40" fill="none" stroke="#10b981" strokeWidth="3" />
                  </svg>
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-[10px] font-bold text-slate-300 uppercase">
                     <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                  </div>
               </div>
               {/* Controles del OCR Integrados */}
               <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                  <InputMinimal label="Booking ID" placeholder="ST-BK-000" icon={Hash} />
                  <InputMinimal label="Contenedor" placeholder="CN-BETA-00" icon={Container} />
               </div>
            </DashboardCard>

            {/* CENTRO: Recent Activity (Timeline) */}
            <DashboardCard title="Recent Activity" subtitle="Real-time OCR detections" icon={RotateCcw} className="col-span-12 lg:col-span-4">
               <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-2 before:w-px before:bg-slate-100">
                  {[
                    { label: "Key Events", time: "1 day ago", desc: "Passes 18, 2024 at 3:58 PM", active: true },
                    { label: "Log Connected", time: "1 day ago", desc: "February 20, 2024 at 10:07 PM", active: true },
                    { label: "Socoon Collected", time: "1 day ago", desc: "February 18, 2024 at 11:53 PM", active: true },
                    { label: "Log Received", time: "20 hs ago", desc: "March 19, 2024 at 3:37 PM", active: false }
                  ].map((ev, i) => (
                    <div key={i} className="flex gap-6 relative z-10">
                       <div className={cn("h-4 w-4 rounded-full border-2 border-white shadow-sm mt-1 shrink-0", ev.active ? "bg-emerald-500" : "bg-slate-200")} />
                       <div>
                          <p className="text-sm font-bold text-slate-800 leading-none">{ev.label}</p>
                          <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-tighter">{ev.desc}</p>
                       </div>
                       <span className="ml-auto text-[10px] font-bold text-slate-300 whitespace-nowrap">{ev.time}</span>
                    </div>
                  ))}
               </div>
               {/* Input de Enfoque Maestro */}
               <div className="pt-8 space-y-3">
                  <InputMinimal label="Focused Entry" placeholder="Type here..." />
                  <button className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all">
                     Submit Entry
                  </button>
               </div>
            </DashboardCard>

            {/* DERECHA: Device Status (System Nodes) */}
            <DashboardCard title="Device Status" subtitle="Hardware & Network nodes" icon={Settings} className="col-span-12 lg:col-span-3">
               <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "CPU", icon: Zap, status: "Active", bg: "bg-emerald-600 text-white" },
                    { label: "USB", icon: Container, status: "Online", bg: "bg-emerald-600 text-white" },
                    { label: "Hardware", icon: ShieldCheck, status: "Ready", bg: "bg-slate-100 text-slate-400" },
                    { label: "Line", icon: FileText, status: "Active", bg: "bg-emerald-600 text-white" }
                  ].map((node, i) => (
                    <div key={i} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50/80 border border-slate-100 group-hover:border-emerald-200 transition-all">
                       <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", node.bg)}>
                          <node.icon className="h-5 w-5" />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-tight text-slate-800">{node.label}</span>
                    </div>
                  ))}
               </div>
               
               {/* Resumen de Seguridad BETA */}
               <div className="mt-10 p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] opacity-60">
                   <div className="flex items-center gap-3 mb-4">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Precision Status</span>
                   </div>
                   <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[88%] shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                   </div>
               </div>

               <div className="flex gap-2.5 mt-auto pt-10">
                  <button className="flex-1 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-emerald-600 transition-all">
                     <RotateCcw className="h-4.5 w-4.5" />
                  </button>
                  <button className="flex-1 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-emerald-600 transition-all">
                     <Settings className="h-4.5 w-4.5" />
                  </button>
                  <button className="flex-1 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-emerald-600 transition-all">
                     <HelpCircle className="h-4.5 w-4.5" />
                  </button>
               </div>
            </DashboardCard>

          </div>
        </div>
      </main>
    </div>
  );
}
