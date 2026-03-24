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
  ChevronRight,
  ChevronDown,
  Info,
  Sprout
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";

// --- Componentes UX Beta Clean (Form Version) ---

function SectionCard({ title, subtitle, icon: Icon, children, className }: any) {
  return (
    <div className={cn(
      "bg-white rounded-[1.5rem] p-7 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all",
      className
    )}>
      <div className="flex items-center gap-4 mb-8">
        <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
           <Icon className="h-5 w-5" />
        </div>
        <div>
           <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{title}</h3>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

function BetaInput({ label, placeholder, icon: Icon }: any) {
  return (
    <div className="space-y-1.5 group">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block leading-none">
        {label}
      </label>
      <div className="relative">
        <input 
          type="text" 
          placeholder={placeholder}
          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 px-4 outline-none focus:bg-white focus:border-emerald-500/30 text-sm font-bold text-slate-700 placeholder-slate-300 transition-all shadow-sm"
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

function BetaMultiTag({ label, placeholder }: any) {
  const [tags, setTags] = useState<string[]>([]);
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block leading-none">
        {label}
      </label>
      <div className="flex flex-wrap items-center min-h-[48px] rounded-xl px-4 py-2 bg-slate-50 border border-slate-100 shadow-sm focus-within:bg-white focus-within:border-emerald-500/30 transition-all">
        {tags.map((tag, i) => (
          <React.Fragment key={i}>
            <span className="flex items-center gap-2 py-1.5 bg-white border border-slate-100 px-3 rounded-lg text-xs font-bold text-emerald-700 shadow-sm">
              {tag}
              <Plus className="h-3.5 w-3.5 rotate-45 cursor-pointer opacity-50 hover:opacity-100" onClick={() => setTags(tags.filter((_, idx) => idx !== i))} />
            </span>
            {i < tags.length - 1 && (
               <span className="mx-2 text-slate-300 font-extrabold">/</span>
            )}
          </React.Fragment>
        ))}
        {tags.length > 0 && <span className="mx-2 text-slate-300 font-extrabold italic opacity-30">/</span>}
        <input 
          type="text" 
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-700 placeholder-slate-300 min-w-[100px]"
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

// --- Componente Principal: LogiCapture Hub Pro ---

export default function LogicCaptureHubProPage() {
  const [ocrMode, setOcrMode] = useState<"booking" | "contenedor">("contenedor");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f1f5f9]">
      {/* SIDEBAR FIJO (BETA PRO) */}
      <AppSidebar />

      {/* CONTENIDO CENTRAL */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader title="LOGICAPTURE OPERATIVO" onOpenScanner={() => {}} />

        <main className="flex-1 overflow-y-auto p-12 lc-scroll">
          <div className="max-w-[1400px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            
            {/* Header del Formulario & OCR Mode */}
            <div className="flex items-end justify-between border-b border-slate-100 pb-10">
               <div>
                  <h1 className="text-3xl font-extrabold text-[#022c22] tracking-tighter italic uppercase">Registro de Embarque</h1>
                  <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-[0.3em]">Operativa General de Despacho · BETA</p>
               </div>

               {/* Selector OCR Premium */}
               <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex bg-slate-50 rounded-xl p-1 relative">
                     <button 
                        onClick={() => setOcrMode("contenedor")}
                        className={cn(
                          "flex items-center gap-2 px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all relative z-10",
                          ocrMode === "contenedor" ? "text-emerald-700" : "text-slate-400"
                        )}
                     >
                        Contenedor
                     </button>
                     <button 
                        onClick={() => setOcrMode("booking")}
                        className={cn(
                          "flex items-center gap-2 px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all relative z-10",
                          ocrMode === "booking" ? "text-emerald-700" : "text-slate-400"
                        )}
                     >
                        Booking
                     </button>
                     <div className={cn(
                        "absolute inset-y-1 transition-all duration-300 bg-white shadow-sm border border-slate-100 rounded-lg",
                        ocrMode === "contenedor" ? "left-1 w-[26px] md:w-[130px]" : "left-[134px] w-[110px]"
                     )} />
                  </div>
                  <button className="h-11 w-11 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100 animate-pulse">
                     <Scan className="h-5 w-5" />
                  </button>
               </div>
            </div>

            {/* Grid de Formulario Operativo */}
            <div className="grid grid-cols-12 gap-8">
               
               {/* 1. SECCIÓN EMBARQUE */}
               <SectionCard title="Datos de Embarque" subtitle="Shipment Telemetry" icon={Layers} className="col-span-12 lg:col-span-8">
                  <div className="grid grid-cols-2 gap-8">
                     <BetaInput label="Nº de Booking" placeholder="Ingreso manual o escaneo" icon={Hash} />
                     <BetaInput label="ID Contenedor" placeholder="Detección Inteligente" icon={Container} />
                     <BetaInput label="Orden Beta" placeholder="OB-000000" icon={FileText} />
                     <BetaInput label="Nº de DAM" placeholder="DAM-2024" icon={BadgeCheck} />
                  </div>
               </SectionCard>

               {/* 2. SECCIÓN TRANSPORTE */}
               <SectionCard title="Identidad de Flota" subtitle="Driver & Vehicle Log" icon={Truck} className="col-span-12 lg:col-span-4">
                  <BetaInput label="Nombre / Licencia" placeholder="DNI del chofer" icon={Zap} />
                  <div className="grid grid-cols-2 gap-4">
                     <BetaInput label="Placa Tracto" placeholder="000-XXX" />
                     <BetaInput label="Placa Carreta" placeholder="000-XXX" />
                  </div>
                  <BetaInput label="Empresa de Transporte" placeholder="Transportista asignado" icon={BookOpen} />
               </SectionCard>

               {/* 3. SECCIÓN PRECITOS (Multipuntos) */}
               <SectionCard title="Protocolos de Seguridad" subtitle="Seal / Multi-Tag Entries" icon={ShieldCheck} className="col-span-12 lg:col-span-8">
                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-6">
                        <BetaMultiTag label="Precinto de Aduana" placeholder="Usar / o Enter" />
                        <BetaMultiTag label="Precinto Operador" placeholder="Ingreso múltiple" />
                        <BetaMultiTag label="Precinto Senasa" placeholder="ID de Validación" />
                     </div>
                     <div className="space-y-6">
                        <BetaMultiTag label="Precinto Línea" placeholder="Ingreso múltiple" />
                        <BetaMultiTag label="Precintos BETA" placeholder="Planta oficial" />
                        <BetaMultiTag label="Termógrafos ID" placeholder="Registro térmico" />
                     </div>
                  </div>
               </SectionCard>

               {/* 4. SECCIÓN ACCIONES / QUICK INFO */}
               <div className="col-span-12 lg:col-span-4 space-y-8">
                  <div className="p-8 rounded-[1.5rem] bg-[#022c22] text-white shadow-xl shadow-emerald-50 relative overflow-hidden group">
                     <div className="relative z-10">
                        <h4 className="font-extrabold text-xl italic tracking-tighter uppercase leading-none">Guardar Operación</h4>
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.2em] mt-2 mb-8">Sincronización instantánea SAP</p>
                        
                        <div className="space-y-4">
                           <div className="flex items-center gap-3">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Validación de Datos OK</span>
                           </div>
                           <div className="flex items-center gap-3">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Servidor Conectado</span>
                           </div>
                        </div>

                        <button className="w-full mt-10 py-5 bg-emerald-500 hover:bg-emerald-400 font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-black/20 transition-all active:scale-95 group-hover:px-10">
                           Finalizar Registro
                        </button>
                     </div>
                     <Sprout className="absolute -bottom-10 -right-10 h-40 w-40 text-emerald-900/40 rotate-[25deg] pointer-events-none" />
                  </div>

                  <div className="p-7 rounded-[1.5rem] bg-white border border-slate-100 flex items-start gap-4 shadow-sm">
                     <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-1" />
                     <p className="text-xs font-bold text-slate-400 leading-relaxed italic">
                        Utiliza el botón de escaneo superior para autocompletar los campos de Contenedor y Booking mediante inteligencia artificial.
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
