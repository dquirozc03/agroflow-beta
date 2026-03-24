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
  Settings,
  Cpu,
  BarChart3,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";

// --- Componentes UI Stitch Edition (Bento Style) ---

function BentoCard({ title, subtitle, icon: Icon, children, className }: any) {
  return (
    <div className={cn(
      "bg-[#131313] rounded-2xl p-8 border border-white/5 relative overflow-hidden group hover:border-[#b6a0ff]/20 transition-all duration-500",
      className
    )}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#b6a0ff]/5 blur-[60px] rounded-full pointer-events-none" />
      
      <div className="flex justify-between items-start mb-10 relative z-10">
        <div>
          <h2 className="font-['Space_Grotesk'] text-2xl font-black tracking-tighter text-white mb-1 uppercase italic">
            {title}
          </h2>
          <p className="text-[#adaaaa] text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
            {subtitle}
          </p>
        </div>
        <div className="h-10 w-10 bg-[#b6a0ff]/10 rounded-xl flex items-center justify-center text-[#b6a0ff]">
           <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {children}
      </div>
    </div>
  );
}

function StitchInput({ label, placeholder, icon: Icon }: any) {
  return (
    <div className="space-y-2.5">
      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#adaaaa] ml-2 block">
        {label}
      </label>
      <div className="relative">
        <input 
          type="text" 
          placeholder={placeholder}
          className="w-full bg-[#1a1a1a] rounded-xl py-3.5 px-6 outline-none border border-white/5 focus:border-[#b6a0ff] text-sm font-bold text-white placeholder-slate-800 transition-all"
        />
        {Icon && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-800">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}

function MultiTagStitch({ label, placeholder }: any) {
  const [tags, setTags] = useState<string[]>([]);
  return (
    <div className="space-y-2.5">
      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#adaaaa] ml-2 block">
        {label}
      </label>
      <div className="flex flex-wrap gap-2 items-center min-h-[56px] rounded-xl px-5 py-3.5 bg-[#1a1a1a] border border-white/5">
        {tags.map((tag, i) => (
          <span key={i} className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#b6a0ff] to-[#7e51ff] text-[#000000] rounded-lg text-[10px] font-black shadow-lg">
            {tag}
            <Plus className="h-3.5 w-3.5 rotate-45 cursor-pointer opacity-70 hover:opacity-100" onClick={() => setTags(tags.filter((_, idx) => idx !== i))} />
          </span>
        ))}
        <input 
          type="text" 
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-[#adaaaa] placeholder-slate-800"
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

export default function LogicCaptureStitchPage() {
  const [ocrMode, setOcrMode] = useState<"booking" | "contenedor">("contenedor");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0e0e0e]">
      {/* SIDEBAR FIJO */}
      <AppSidebar />

      {/* CONTENIDO CENTRAL */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader title="AGRICULTURE HUB" onOpenScanner={() => {}} />

        <main className="flex-1 overflow-y-auto p-10 lc-scroll">
          <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            
            {/* Bento Grid */}
            <div className="grid grid-cols-12 gap-10">
              
              <BentoCard 
                title="Sincronización Operativa" 
                subtitle="Real-time telemetry / OCR Processing" 
                icon={Cpu}
                className="col-span-12 lg:col-span-8"
              >
                <div className="flex justify-between items-center bg-[#b6a0ff]/5 p-5 border border-[#b6a0ff]/20 rounded-2xl mb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-[#b6a0ff] rounded-xl flex items-center justify-center text-[#340090] shadow-[0_0_15px_#b6a0ff]">
                      <Target className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-white font-['Space_Grotesk'] font-black uppercase text-lg italic tracking-tighter">Modo de Detección</h3>
                      <p className="text-[10px] text-[#adaaaa] font-black uppercase tracking-widest">IA Conectada / Precisión 99.8%</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => setOcrMode("contenedor")} className={cn("px-6 py-2.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all", ocrMode === "contenedor" ? "bg-[#b6a0ff] text-[#000000]" : "bg-[#262626] text-[#adaaaa]")}>Contenedor</button>
                     <button onClick={() => setOcrMode("booking")} className={cn("px-6 py-2.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all", ocrMode === "booking" ? "bg-[#b6a0ff] text-[#000000]" : "bg-[#262626] text-[#adaaaa]")}>Booking</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mt-10">
                  <div className="space-y-6">
                    <StitchInput label="Nº de Booking" placeholder="STICH-BK-000" icon={Hash} />
                    <StitchInput label="ID Contenedor" placeholder="BETA-HUB-CN" icon={Container} />
                  </div>
                  <div className="space-y-6">
                    <StitchInput label="Orden Beta" placeholder="OB-PRE-2024" icon={FileText} />
                    <StitchInput label="ID DAM" placeholder="DMN-PE-ALPHA" icon={Layers} />
                  </div>
                </div>
              </BentoCard>

              <BentoCard title="Unidad Operativa" subtitle="Vehicle & Driver Analysis" icon={Truck} className="col-span-12 lg:col-span-4">
                <div className="p-5 rounded-2xl bg-[#ff6e84]/5 border border-[#ff6e84]/20 mb-6">
                  <p className="text-[10px] font-black text-[#ff6e84] uppercase tracking-widest mb-1 italic">Estado de Carga</p>
                  <p className="text-sm font-bold text-white tracking-tight leading-relaxed">Esperando validación de Pesaje de Planta.</p>
                </div>
                <StitchInput label="DNI Chofer" placeholder="Escaneo Inteligente" icon={Zap} />
                <div className="grid grid-cols-2 gap-4">
                   <StitchInput label="Placa Tracto" placeholder="000-XXX" />
                   <StitchInput label="Placa Carreta" placeholder="000-XXX" />
                </div>
                <StitchInput label="Empresa" placeholder="Transportista Asignado" icon={BookOpen} />
              </BentoCard>

              <BentoCard title="Precintos de Seguridad" subtitle="Security Protocol" icon={ShieldCheck} className="col-span-12 lg:col-span-8">
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-6">
                     <MultiTagStitch label="Precinto Aduana" placeholder="Usar / para separar" />
                     <MultiTagStitch label="Precinto Operador" placeholder="Ingreso múltiple" />
                     <MultiTagStitch label="Precinto Senasa" placeholder="ID de Validación" />
                   </div>
                   <div className="space-y-6">
                     <MultiTagStitch label="Precinto Línea" placeholder="Ingreso múltiple" />
                     <MultiTagStitch label="Precinto BETA" placeholder="Planta oficial" />
                     <MultiTagStitch label="Termógrafos" placeholder="ID Térmico" />
                   </div>
                </div>
              </BentoCard>

              <BentoCard title="Performance" subtitle="Live Stats" icon={BarChart3} className="col-span-12 lg:col-span-4">
                <div className="h-44 w-full flex items-center justify-center bg-[#b6a0ff]/5 border border-[#b6a0ff]/10 rounded-2xl overflow-hidden">
                   <svg className="w-full h-full p-4" viewBox="0 0 400 150">
                      <path d="M0,130 Q50,110 100,120 T200,80 T300,100 T430,40" fill="none" stroke="#b6a0ff" strokeWidth="4" />
                   </svg>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                   <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 text-center">
                      <p className="text-[10px] font-black text-[#adaaaa] uppercase mb-1">OCR Precisión</p>
                      <p className="text-xl font-['Space_Grotesk'] font-black text-white italic">99.9%</p>
                   </div>
                   <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 text-center">
                      <p className="text-[10px] font-black text-[#adaaaa] uppercase mb-1">Estado</p>
                      <p className="text-xl font-['Space_Grotesk'] font-black text-[#8eff71] italic">ONLINE</p>
                   </div>
                </div>
              </BentoCard>

            </div>

            <button className="w-full relative group mt-8">
               <div className="bg-gradient-to-r from-[#b6a0ff] via-[#7e51ff] to-[#b6a0ff] h-20 rounded-2xl flex items-center justify-center shadow-[0_20px_50px_-10px_#b6a0ff60] transition-all group-hover:scale-[1.005] group-active:scale-[0.98]">
                  <span className="font-['Space_Grotesk'] font-black text-[#000000] text-xl uppercase italic tracking-tighter">
                     Sincronizar Datos Logísticos
                  </span>
               </div>
            </button>

          </div>
        </main>
      </div>
    </div>
  );
}
