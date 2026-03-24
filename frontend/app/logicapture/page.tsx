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
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";

// --- Componentes UI Light Generation (Bento Style) ---

function BentoCardLight({ title, subtitle, icon: Icon, children, className, accent = false }: any) {
  return (
    <div className={cn(
      "bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white transition-all duration-700 relative overflow-hidden group shadow-[0_20px_50px_-20px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] hover:border-indigo-100",
      className
    )}>
      {/* Dynamic Background Flare */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/50 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-100/40 transition-colors" />
      
      <div className="flex justify-between items-start mb-10 relative z-10">
        <div className="space-y-1">
          <h2 className="font-['Space_Grotesk'] text-[22px] font-black tracking-tighter text-slate-900 leading-none uppercase italic">
            {title}
          </h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] ml-0.5 opacity-80">
            {subtitle}
          </p>
        </div>
        <div className={cn(
          "h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm",
          accent ? "bg-indigo-600 text-white shadow-indigo-200" : "bg-slate-50 text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50"
        )}>
           <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {children}
      </div>
    </div>
  );
}

function InputLight({ label, placeholder, icon: Icon }: any) {
  return (
    <div className="space-y-2.5 group">
      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-3 block leading-none">
        {label}
      </label>
      <div className="relative">
        <input 
          type="text" 
          placeholder={placeholder}
          className="w-full bg-slate-50/50 rounded-2xl py-4 px-6 outline-none border border-slate-100 focus:bg-white focus:border-indigo-500/30 text-sm font-bold text-slate-700 placeholder-slate-300 transition-all shadow-sm focus:shadow-xl"
        />
        {Icon && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-indigo-500 transition-colors">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}

function TagLight({ label, placeholder }: any) {
  const [tags, setTags] = useState<string[]>([]);
  return (
    <div className="space-y-2.5">
      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-3 block leading-none">
        {label}
      </label>
      <div className="flex flex-wrap gap-2.5 items-center min-h-[62px] rounded-2xl px-5 py-4 bg-slate-50/50 border border-slate-100 shadow-sm transition-all focus-within:bg-white focus-within:border-indigo-500/30">
        {tags.map((tag, i) => (
          <span key={i} className="flex items-center gap-2.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[11px] font-black shadow-lg shadow-indigo-200">
            {tag}
            <Plus className="h-4 w-4 rotate-45 cursor-pointer opacity-80 hover:opacity-100" onClick={() => setTags(tags.filter((_, idx) => idx !== i))} />
          </span>
        ))}
        <input 
          type="text" 
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-600 placeholder-slate-300"
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

// --- Componente Maestro: LogiCapture Hub Light ---

export default function LogicCaptureLightPage() {
  const [ocrMode, setOcrMode] = useState<"booking" | "contenedor">("contenedor");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc]">
      <AppSidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader title="LOGICAPTURE HUB" onOpenScanner={() => {}} />

        <main className="flex-1 overflow-y-auto p-12 lc-scroll relative">
          <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            
            {/* Header del Dashboard (The Apple Style) */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 border-b border-slate-100/80 pb-12">
               <div>
                  <h1 className="font-['Space_Grotesk'] text-[64px] font-black text-slate-900 leading-[0.9] tracking-tighter italic">
                    Capture <span className="text-indigo-600">Pro</span>
                  </h1>
                  <p className="text-slate-400 font-bold text-xl tracking-tight mt-2 uppercase tracking-[0.2em] ml-1 opacity-70">Registro Operativo Móvil · V2.4</p>
               </div>

               {/* Selector de Modo (Floating Capsule Light) */}
               <div className="flex bg-white p-2.5 rounded-[2.5rem] border border-slate-100 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.03)]">
                  <button 
                    onClick={() => setOcrMode("contenedor")}
                    className={cn(
                      "flex items-center gap-3 px-10 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all",
                      ocrMode === "contenedor" 
                      ? "bg-slate-900 text-white shadow-xl scale-[1.03]" 
                      : "text-slate-400 hover:text-slate-800"
                    )}
                  >
                    <Target className="h-5 w-5" />
                    Contenedor
                  </button>
                  <button 
                    onClick={() => setOcrMode("booking")}
                    className={cn(
                      "flex items-center gap-3 px-10 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all",
                      ocrMode === "booking" 
                      ? "bg-slate-900 text-white shadow-xl scale-[1.03]" 
                      : "text-slate-400 hover:text-slate-800"
                    )}
                  >
                    <FileText className="h-5 w-5" />
                    Booking / DAM
                  </button>
               </div>
            </div>

            {/* Bento Layout Light Edition */}
            <div className="grid grid-cols-12 gap-10">
               
               {/* Hero Section (Embarque) */}
               <BentoCardLight 
                 title="Datos de Embarque" 
                 subtitle="OCR Hub Analysis" 
                 icon={Layers}
                 className="col-span-12 lg:col-span-8"
                 accent={true}
               >
                  <div className="grid grid-cols-2 gap-10">
                     <div className="space-y-6">
                        <InputLight label="Booking Oficial" placeholder="STICH-HUB-2024" icon={Hash} />
                        <InputLight label="Contenedor ID" placeholder="BETA-CN-ALPHA" icon={Container} />
                     </div>
                     <div className="space-y-6">
                        <InputLight label="Orden Beta" placeholder="OB-PRE-000" icon={FileText} />
                        <InputLight label="Número DAM" placeholder="DMN-PE-2024" icon={Layers} />
                     </div>
                  </div>
                  <div className="p-6 bg-slate-50/80 rounded-[2rem] border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-indigo-200 transition-all">
                     <div className="flex items-center gap-5">
                         <div className="h-10 w-10 bg-white shadow-sm flex items-center justify-center rounded-xl text-indigo-500">
                             <Zap className="h-5 w-5 animate-pulse" />
                         </div>
                         <p className="text-xs font-black text-slate-500 uppercase tracking-widest italic">Análisis Inteligente de Prefijos SAP Activo</p>
                     </div>
                     <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
               </BentoCardLight>

               {/* Transport Section */}
               <BentoCardLight title="Unidad & Chofer" subtitle="Operational Validation" icon={Truck} className="col-span-12 lg:col-span-4">
                  <div className="space-y-6">
                     <InputLight label="Identidad Chofer" placeholder="DNI / Licencia" icon={BadgeCheck} />
                     <div className="grid grid-cols-2 gap-5">
                         <InputLight label="P. Tracto" placeholder="XXX-000" />
                         <InputLight label="P. Carreta" placeholder="XXX-000" />
                     </div>
                     <InputLight label="Transportista" placeholder="Empresa Asignada" icon={BookOpen} />
                  </div>
               </BentoCardLight>

               {/* Security Section (Tags) */}
               <BentoCardLight title="Protocolos de Seguridad" subtitle="Seal Grouping" icon={ShieldCheck} className="col-span-12 lg:col-span-8">
                  <div className="grid grid-cols-2 gap-10">
                     <div className="space-y-6">
                        <TagLight label="Precinto de Aduana" placeholder="Usar / para separar" />
                        <TagLight label="Precinto Operador" placeholder="Ingreso múltiple" />
                        <TagLight label="Precinto Senasa" placeholder="ID Certificación" />
                     </div>
                     <div className="space-y-6">
                        <TagLight label="Precinto Línea" placeholder="Ingreso múltiple" />
                        <TagLight label="Precinto BETA" placeholder="Planta oficial" />
                        <TagLight label="Termógrafos ID" placeholder="Registro térmico" />
                     </div>
                  </div>
               </BentoCardLight>

               {/* Summary Section */}
               <BentoCardLight title="Audit Statistics" subtitle="Telemetry Log" icon={BarChart3} className="col-span-12 lg:col-span-4">
                  <div className="flex flex-col h-full justify-between gap-6">
                     <div className="p-6 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-center gap-5">
                         <CheckCircle2 className="h-8 w-8 text-indigo-600" />
                         <div>
                            <p className="text-sm font-black text-slate-900 leading-none italic">Todo listo para guardar</p>
                            <p className="text-[10px] text-indigo-400 font-bold mt-1 uppercase tracking-widest">Sincronización Disponible</p>
                         </div>
                     </div>
                     <div className="grid grid-cols-2 gap-5">
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                           <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Precisión OCR</p>
                           <p className="text-2xl font-['Space_Grotesk'] font-black text-slate-800 italic tracking-tighter">99.9%</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                           <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Integridad ID</p>
                           <p className="text-2xl font-['Space_Grotesk'] font-black text-emerald-500 italic tracking-tighter">OK</p>
                        </div>
                     </div>
                  </div>
               </BentoCardLight>

            </div>

            {/* CTA Final (THE MAIN ACTION) */}
            <button className="w-full relative group">
               <div className="bg-slate-900 h-24 rounded-[2.5rem] flex items-center justify-between px-12 transition-all group-hover:scale-[1.005] group-active:scale-[0.98] shadow-2xl">
                  <div className="flex items-center gap-6">
                     <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5">
                        <BadgeCheck className="h-6 w-6 text-indigo-400" />
                     </div>
                     <div className="text-left">
                        <span className="block font-['Space_Grotesk'] font-black text-white text-2xl uppercase italic tracking-tighter leading-none">
                           CONCLUIR OPERACIÓN LOGÍSTICA
                        </span>
                        <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mt-2 block ml-1 leading-none">Sincronización Instantánea con SAP</span>
                     </div>
                  </div>
                  <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-xl group-hover:translate-x-2 transition-transform">
                     <Plus className="h-6 w-6" />
                  </div>
               </div>
            </button>

          </div>
        </main>
      </div>
    </div>
  );
}
