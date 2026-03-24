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
  ChevronRight,
  Plus,
  Trash2,
  FileText,
  BadgeCheck,
  Zap,
  RotateCcw,
  Target
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { cn } from "@/lib/utils";

// --- Subcomponentes de UI 1:1 (John McClane Edition) ---

function DashboardCard({ title, icon: Icon, children, dark = false }: any) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-[2.5rem] border p-8 transition-all duration-500",
      dark 
        ? "bg-slate-900/95 border-white/5 text-white shadow-2xl" 
        : "bg-white/80 border-white/60 text-slate-800 shadow-[0_15px_40px_-5px_rgba(0,0,0,0.05)] backdrop-blur-xl hover:shadow-[0_25px_60px_-10px_rgba(0,0,0,0.08)]"
    )}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={cn(
            "h-10 w-10 rounded-[1rem] flex items-center justify-center text-white",
            dark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-500 shadow-xl shadow-indigo-500/20"
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <h3 className={cn(
            "text-sm font-black uppercase tracking-[0.2em]",
            dark ? "text-slate-100" : "text-slate-400"
          )}>
            {title}
          </h3>
        </div>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

function InputPill({ label, placeholder, icon: Icon, dark = false }: any) {
  return (
    <div className="space-y-2 group">
      <label className={cn(
        "text-[10px] font-black uppercase tracking-widest ml-2",
        dark ? "text-slate-500" : "text-slate-400"
      )}>
        {label}
      </label>
      <div className="relative">
        <input 
          type="text" 
          placeholder={placeholder}
          className={cn(
            "w-full rounded-[1.5rem] py-3.5 px-6 outline-none transition-all duration-300 font-bold text-sm",
            dark 
            ? "bg-white/5 border border-white/5 focus:bg-white/10 text-white placeholder-slate-700 focus:border-indigo-500/50" 
            : "bg-slate-50 border border-slate-100 focus:bg-white text-slate-900 placeholder-slate-300 focus:border-indigo-500/40 focus:ring-8 focus:ring-indigo-500/5 shadow-sm"
          )}
        />
        {Icon && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}

function TagSystem({ label, placeholder, dark = false }: any) {
  const [tags, setTags] = useState<string[]>([]);
  return (
    <div className="space-y-2">
      <label className={cn("text-[10px] font-black uppercase tracking-widest ml-2", dark ? "text-slate-500" : "text-slate-400")}>
        {label}
      </label>
      <div className={cn(
        "flex flex-wrap gap-2 items-center min-h-[56px] rounded-[1.5rem] px-4 py-3 border transition-all shadow-sm",
        dark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100"
      )}>
        {tags.map((tag, i) => (
          <span key={i} className="flex items-center gap-2 pl-4 pr-2 py-1.5 bg-indigo-500 text-white rounded-xl text-[11px] font-bold shadow-lg shadow-indigo-500/20">
            {tag}
            <Plus className="h-3 w-3 rotate-45 cursor-pointer hover:scale-125" onClick={() => setTags(tags.filter((_, idx) => idx !== i))} />
          </span>
        ))}
        <input 
          type="text" 
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-500"
          onKeyDown={(e) => {
            if (e.key === "/" || e.key === "Enter") {
              e.preventDefault();
              const val = (e.target as HTMLInputElement).value.trim();
              if (val) {
                setTags([...tags, val]);
                (e.target as HTMLInputElement).value = "";
              }
            }
          }}
        />
      </div>
    </div>
  );
}

// --- Componente Principal ---

export default function LogicCapturePerfectionPage() {
  const [ocrMode, setOcrMode] = useState<"booking" | "contenedor">("contenedor");

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-1000">
      <AppHeader title="LOGICAPTURE V2" onOpenScanner={() => {}} />

      <main className="flex-1 overflow-y-auto lc-scroll px-10 pb-16">
        <div className="max-w-[1600px] mx-auto space-y-12 mt-4">
          
          {/* Dashboard Header 1:1 (Style: Farm Overview) */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-white/10 pb-10">
            <div className="space-y-1">
              <h1 className="text-[54px] font-black text-slate-800 dark:text-white leading-[1.1] tracking-tighter">
                LogiCapture <span className="text-indigo-400">Hub</span>
              </h1>
              <p className="text-slate-500 font-bold text-lg tracking-tight">Registro Operativo · AgroFlow V2</p>
            </div>

            {/* Selector de Modo OCR (Style: Floating Pill) */}
            <div className="flex bg-white/80 dark:bg-slate-950/20 p-2 rounded-[2rem] border border-white dark:border-white/5 shadow-2xl backdrop-blur-xl">
              <button 
                onClick={() => setOcrMode("contenedor")}
                className={cn(
                  "flex items-center gap-2 px-10 py-3 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all",
                  ocrMode === "contenedor" 
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-[1.03]" 
                  : "text-slate-400 hover:text-slate-700"
                )}
              >
                <Target className="h-4 w-4" />
                Detección Contenedor
              </button>
              <button 
                onClick={() => setOcrMode("booking")}
                className={cn(
                  "flex items-center gap-2 px-10 py-3 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all",
                  ocrMode === "booking" 
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-[1.03]" 
                  : "text-slate-400 hover:text-slate-700"
                )}
              >
                <FileText className="h-4 w-4" />
                Detección Booking
              </button>
            </div>
          </div>

          {/* Grid de Contenido (Módulos de Información) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            
            {/* PANEL 1 (STYLE: DARK MAP CARD) */}
            <DashboardCard title="Parámetros de Embarque" icon={FileText} dark={true}>
              <InputPill label="Nº de Booking" placeholder="Ingresar booking..." icon={Hash} dark={true} />
              <InputPill label="ID de Contenedor" placeholder="Referencia oficial..." icon={Container} dark={true} />
              <InputPill label="Nº de Orden Beta" placeholder="Orden de embarque..." dark={true} />
              <div className="h-28 bg-white/5 rounded-[2rem] border border-white/5 flex items-center justify-center text-slate-700 italic text-[11px] font-black uppercase tracking-widest">
                <Scan className="h-6 w-6 mr-3 text-indigo-400 animate-pulse" />
                Analizando Estándar SAP...
              </div>
            </DashboardCard>

            <DashboardCard title="Gestión de Unidad" icon={Truck}>
              <InputPill label="DNI del Chofer" placeholder="Escaneo inteligente..." icon={Zap} />
              <div className="grid grid-cols-2 gap-4">
                <InputPill label="Tracto" placeholder="000-XXX" />
                <InputPill label="Carreta" placeholder="000-XXX" />
              </div>
              <InputPill label="Transportista" placeholder="Empresa asignada..." icon={BookOpen} />
              <InputPill label="Precinto BETA" placeholder="Precinto oficial de planta..." icon={BadgeCheck} />
            </DashboardCard>

            <DashboardCard title="Niveles de Seguridad" icon={ShieldCheck}>
              <TagSystem label="Lote de Aduana" placeholder="Usar / para separar" />
              <TagSystem label="Lote de Operador" placeholder="Usar / para separar" />
              <TagSystem label="Senasa / Línea" placeholder="Ingreso múltiple..." />
              <TagSystem label="Sensores Térmicos" placeholder="ID de termógrafo..." />
            </DashboardCard>

          </div>

          {/* GRAN BOTÓN DE CIERRE (Estilo Flomsters / Central Button) */}
          <div className="flex items-center justify-between bg-indigo-600 p-6 rounded-[3rem] shadow-[0_30px_70px_-15px_rgba(79,70,229,0.5)] group transform hover:scale-[1.01] transition-all cursor-pointer">
            <div className="flex items-center gap-6 px-4 text-white">
              <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                <BadgeCheck className="h-8 w-8 text-white" />
              </div>
              <div>
                <h4 className="text-2xl font-black italic tracking-tighter">CONCLUIR CAPTURA</h4>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-60">Sincronización instantánea con Base de Datos</p>
              </div>
            </div>
            <div className="h-16 w-16 bg-white text-indigo-600 rounded-full flex items-center justify-center mr-4 shadow-xl group-hover:rotate-45 transition-all">
              <Plus className="h-10 w-10" />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
