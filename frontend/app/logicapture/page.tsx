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
  ChevronRight,
  User,
  Activity,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Users,
  Info,
  Sprout
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";

// --- Componentes UX Obsidian Pro (Expert Edition) ---

function SectionCard({ title, subtitle, icon: Icon, children, className }: any) {
  return (
    <div className={cn(
      "bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.05)] transition-all duration-500",
      className
    )}>
      <div className="flex items-center gap-6 mb-12">
        <div className="h-14 w-14 rounded-2xl bg-[#0f172a] text-emerald-500 flex items-center justify-center shadow-2xl shadow-slate-200">
           <Icon className="h-6 w-6" />
        </div>
        <div>
           <h3 className="text-sm font-black text-[#022c22] uppercase tracking-[0.2em]">{title}</h3>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-10 relative">
        {children}
      </div>
    </div>
  );
}

function ExpertInput({ label, placeholder, icon: Icon }: any) {
  return (
    <div className="space-y-2.5 group">
      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-1 block leading-none">
        {label}
      </label>
      <div className="relative">
        <input 
          type="text" 
          placeholder={placeholder}
          className="w-full bg-[#f8fafc] border border-slate-100/50 rounded-2xl py-4.5 px-6 outline-none focus:bg-white focus:border-emerald-500/30 text-[14px] font-bold text-[#022c22] placeholder-slate-300 transition-all shadow-sm"
        />
        {Icon && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-emerald-500 transition-colors">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

function MultiTagExpert({ label, placeholder }: any) {
  const [tags, setTags] = useState<string[]>([]);
  return (
    <div className="space-y-2.5">
      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-1 block leading-none">
        {label}
      </label>
      <div className="flex flex-wrap items-center min-h-[58px] rounded-2xl px-5 py-3 bg-[#f8fafc] border border-slate-100/50 shadow-sm focus-within:bg-white focus-within:border-emerald-500/30 transition-all">
        {tags.map((tag, i) => (
          <React.Fragment key={i}>
            <span className="flex items-center gap-3 py-2 bg-white border border-slate-100 px-4 rounded-xl text-xs font-black text-emerald-600 shadow-sm hover:scale-105 transition-transform animate-in zoom-in-95">
              {tag}
              <Plus className="h-4 w-4 rotate-45 cursor-pointer opacity-40 hover:opacity-100 hover:text-rose-500" onClick={() => setTags(tags.filter((_, idx) => idx !== i))} />
            </span>
            {i < tags.length - 1 && (
               <span className="mx-3 text-slate-200 font-black italic opacity-60">/</span>
            )}
          </React.Fragment>
        ))}
        {tags.length > 0 && <span className="mx-3 text-slate-200 font-black italic opacity-30">/</span>}
        <input 
          type="text" 
          placeholder={tags.length === 0 ? placeholder : "Añadir..."}
          className="flex-1 bg-transparent border-none outline-none text-sm font-extrabold text-[#022c22] placeholder-slate-300 min-w-[120px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " " || e.key === "/") {
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

// --- Dashboard Principal: LogiCapture Pro (Expert Mode) ---

export default function LogisticCaptureExpertPage() {
  const [ocrMode, setOcrMode] = useState<"booking" | "contenedor">("contenedor");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc]">
      {/* SIDEBAR OBSIDIAN PRO */}
      <AppSidebar />

      {/* CONTENIDO CENTRAL EXPERT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader title="LOGICAPTURE OPERATIVO" onOpenScanner={() => {}} />

        <main className="flex-1 overflow-y-auto p-12 lc-scroll">
          <div className="max-w-[1500px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            
            {/* Header Formulario & Premium OCR Selection (Tesla Format) */}
            <div className="flex items-end justify-between border-b border-slate-100 pb-12">
               <div>
                  <h1 className="text-4xl font-['Space_Grotesk'] font-extrabold text-[#022c22] tracking-tighter italic uppercase ml-2">Registro de Embarque</h1>
                  <p className="text-[11px] font-black text-slate-400 mt-4 uppercase tracking-[0.5em] ml-2">Sistema Centralizado de Despacho · BETA PRO</p>
               </div>

               {/* Selector OCR Expert Mode */}
               <div className="flex items-center gap-6 bg-white p-3 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100">
                  <div className="flex bg-[#f8fafc] rounded-2xl p-1.5 relative border border-slate-100 shadow-inner overflow-hidden">
                     <button 
                        onClick={() => setOcrMode("contenedor")}
                        className={cn(
                          "flex items-center gap-2 px-8 py-3.5 rounded-xl text-[12px] font-black uppercase tracking-[0.2em] transition-all relative z-10",
                          ocrMode === "contenedor" ? "text-white" : "text-slate-400"
                        )}
                     >
                        Contenedor
                     </button>
                     <button 
                        onClick={() => setOcrMode("booking")}
                        className={cn(
                          "flex items-center gap-2 px-8 py-3.5 rounded-xl text-[12px] font-black uppercase tracking-[0.2em] transition-all relative z-10",
                          ocrMode === "booking" ? "text-white" : "text-slate-400"
                        )}
                     >
                        Booking
                     </button>
                     <div className={cn(
                        "absolute inset-y-1.5 transition-all duration-500 bg-[#0f172a] shadow-lg rounded-xl",
                        ocrMode === "contenedor" ? "left-1.5 w-[145px]" : "left-[152px] w-[125px]"
                     )} />
                  </div>
                  <button className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30 animate-pulse hover:scale-110 active:scale-95 transition-all">
                     <Scan className="h-6 w-6" />
                  </button>
               </div>
            </div>

            {/* Grid del Formulario (Expert Bento Format) */}
            <div className="grid grid-cols-12 gap-10">
               
               {/* 1. SECCIÓN EMBARQUE (Technical Telemetry) */}
               <SectionCard title="Telemetry Embarque" subtitle="Shipment Data Matrix" icon={Layers} className="col-span-12 lg:col-span-8">
                  <div className="grid grid-cols-2 gap-10">
                     <ExpertInput label="Nº de Booking" placeholder="Detectando vía OCR..." icon={BookOpen} />
                     <ExpertInput label="ID Contenedor" placeholder="Analizando prefijos SAP..." icon={Container} />
                     <ExpertInput label="Orden de Servicio BETA" placeholder="OB-2024-BETA" icon={FileText} />
                     <ExpertInput label="Nº de DAM" placeholder="DAM-CORP-ID" icon={BadgeCheck} />
                  </div>
               </SectionCard>

               {/* 2. SECCIÓN TRANSPORTE (Fleet Identity) */}
               <SectionCard title="Fuerza de Transporte" subtitle="Fleet Control Nodes" icon={Truck} className="col-span-12 lg:col-span-4">
                  <ExpertInput label="Licencia de Conductor" placeholder="DNI del chofer" icon={Zap} />
                  <div className="grid grid-cols-2 gap-5">
                     <ExpertInput label="Placa Tracto" placeholder="XXX-000" />
                     <ExpertInput label="Placa Carreta" placeholder="XXX-000" />
                  </div>
                  <ExpertInput label="Operador Logístico" placeholder="Transportista Oficial" icon={ShieldCheck} />
               </SectionCard>

               {/* 3. SECCIÓN SEGURIDAD (Multi-Tag Protocols) */}
               <SectionCard title="Protocolos Expert" subtitle="Seal Security Layers" icon={ShieldCheck} className="col-span-12 lg:col-span-8 overflow-hidden">
                  <div className="grid grid-cols-2 gap-10">
                     <div className="space-y-8">
                        <MultiTagExpert label="Precinto Aduana" placeholder="Usar / para separar" />
                        <MultiTagExpert label="Precinto Operador" placeholder="Ingreso múltiple" />
                        <MultiTagExpert label="Precinto Senasa" placeholder="ID de Validación" />
                     </div>
                     <div className="space-y-8">
                        <MultiTagExpert label="Precinto Línea" placeholder="Registro vía OCR" />
                        <MultiTagExpert label="Precinto oficial BETA" placeholder="Planta Central" />
                        <MultiTagExpert label="Identidades Termógrafos" placeholder="Sensor ID" />
                     </div>
                  </div>
               </SectionCard>

               {/* 4. SECCIÓN ACCIONES / QUICK INFO (High-End Master Action) */}
               <div className="col-span-12 lg:col-span-4 space-y-10">
                  <div className="p-10 rounded-[2.5rem] bg-[#0f172a] text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                     <div className="relative z-10">
                        <h4 className="font-['Space_Grotesk'] font-extrabold text-2xl italic tracking-tighter uppercase leading-none">Cerrar Sincronización</h4>
                        <p className="text-[11px] text-emerald-500 font-bold uppercase tracking-[0.4em] mt-3 mb-10">Expert Operational Mode Active</p>
                        
                        <div className="space-y-5">
                           <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                              <div>
                                 <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none">Sincronización SAP</p>
                                 <p className="text-[10px] text-slate-500 font-bold uppercase mt-1.5 leading-none tracking-tighter">Conexión Segura</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                              <div>
                                 <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none">Nodos de Red</p>
                                 <p className="text-[10px] text-slate-500 font-bold uppercase mt-1.5 leading-none tracking-tighter">Latencia 12ms</p>
                              </div>
                           </div>
                        </div>

                        <button className="w-full mt-12 py-5.5 bg-emerald-600 hover:bg-emerald-500 font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-emerald-500/20 transition-all active:scale-95 group-hover:px-12 flex items-center justify-center gap-4 group">
                           Finalizar Operación
                           <ChevronRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                        </button>
                     </div>
                     <Sprout className="absolute -bottom-12 -right-12 h-44 w-44 text-emerald-500/10 rotate-[25deg] pointer-events-none" />
                  </div>

                  <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 flex items-start gap-5 shadow-sm">
                     <Info className="h-6 w-6 text-emerald-600 shrink-0 mt-1" />
                     <p className="text-[13px] font-bold text-slate-500 leading-relaxed italic">
                        El sistema de validación experta está monitorizando la integridad de los precintos en tiempo real. Utiliza el módulo OCR para garantizar la precisión de los datos.
                     </p>
                  </div>
               </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

function CheckCircle2(props: any) {
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
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
