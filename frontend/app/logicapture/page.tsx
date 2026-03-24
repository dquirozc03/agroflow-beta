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
  BadgeCheck
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { cn } from "@/lib/utils";

// --- Subcomponentes de UI (Diseño Glassmorphism) ---

function GlassCard({ title, icon: Icon, children, color = "indigo" }: any) {
  const colorMap: any = {
    indigo: "border-indigo-500/20 bg-indigo-500/5",
    emerald: "border-emerald-500/20 bg-emerald-500/5",
    amber: "border-amber-500/20 bg-amber-500/5",
    slate: "border-slate-500/20 bg-slate-500/5",
  };

  const iconMap: any = {
    indigo: "text-indigo-500 bg-indigo-500/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
    amber: "text-amber-500 bg-amber-500/10",
    slate: "text-slate-500 bg-slate-500/10",
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-3xl border p-6 transition-all hover:shadow-2xl hover:shadow-indigo-500/5",
      colorMap[color]
    )}>
      <div className="flex items-center gap-3 mb-6">
        <div className={cn("p-2 rounded-xl", iconMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">
          {title}
        </h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function InputField({ label, placeholder, icon: Icon, value, onChange }: any) {
  return (
    <div className="group relative space-y-1.5 w-full">
      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input 
          type="text" 
          placeholder={placeholder}
          className={cn(
            "w-full bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 outline-none transition-all",
            "focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10",
            Icon ? "pl-10 pr-4" : "px-4"
          )}
        />
      </div>
    </div>
  );
}

function MultiValueInput({ label, placeholder, icon: Icon }: any) {
  const [tags, setTags] = useState<string[]>([]);
  
  return (
    <div className="group relative space-y-1.5 w-full">
      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className={cn(
        "flex flex-wrap gap-2 items-center w-full min-h-[46px] bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 transition-all",
        "focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10"
      )}>
        {tags.map((tag, i) => (
          <span key={i} className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {tag}
            <button onClick={() => setTags(tags.filter((_, idx) => idx !== i))}>
              <Trash2 className="h-3 w-3 hover:text-red-500" />
            </button>
          </span>
        ))}
        <input 
          type="text" 
          placeholder={tags.length === 0 ? placeholder : "Añadir /..."}
          className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-slate-400 min-w-[100px]"
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

export default function LogicCapturePage() {
  const [ocrMode, setOcrMode] = useState<"booking" | "contenedor">("contenedor");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-[#0f172a]">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
        <AppHeader title="LogicCapture V2" onOpenScanner={() => {}} />

        <main className="flex-1 overflow-y-auto lc-scroll p-8 bg-[#f8fafd] dark:bg-[#0b0f1a]">
          <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Cabecera del Módulo */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                  LOGI<span className="text-indigo-500">CAPTURE</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Capture inteligente de datos logísticos con OCR asistido.</p>
              </div>

              {/* Selector de Modo OCR (Cápsula Tecnológica) */}
              <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-1">
                <button 
                  onClick={() => setOcrMode("contenedor")}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
                    ocrMode === "contenedor" 
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <Container className="h-4 w-4" />
                  MODO CONTENEDOR
                </button>
                <button 
                  onClick={() => setOcrMode("booking")}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
                    ocrMode === "booking" 
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <BookOpen className="h-4 w-4" />
                  MODO BOOKING
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* PANEL 1: DATOS DE EMBARQUE */}
              <GlassCard title="Datos de Embarque" icon={FileText} color="amber">
                <InputField label="Nº de Booking" placeholder="Ej: BK-12345" icon={Hash} />
                <InputField label="ID Contenedor" placeholder="Ej: ABCD1234567" icon={Container} />
                <InputField label="Nº Orden Beta" placeholder="Ej: OB-999" icon={ChevronRight} />
                <InputField label="Número DAM" placeholder="Ej: DAM-001" icon={BadgeCheck} />
              </GlassCard>

              {/* PANEL 2: DATOS OPERATIVOS */}
              <GlassCard title="Datos Operativos" icon={Truck} color="indigo">
                <InputField label="Licencia Chofer" placeholder="Ej: Q12345678" />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Placa Tracto" placeholder="ABC-123" />
                  <InputField label="Placa Carreta" placeholder="XYZ-987" />
                </div>
                <InputField label="Empresa de Transporte" placeholder="Buscar empresa..." icon={BookOpen} />
                <InputField label="Precinto BETA" placeholder="Ej: BT-001" />
              </GlassCard>

              {/* PANEL 3: PRECINTOS Y TERMOGRAFOS */}
              <GlassCard title="Precintos & Sensores" icon={ShieldCheck} color="emerald">
                <MultiValueInput label="Precinto Aduana" placeholder="Ingrese y escriba /" />
                <MultiValueInput label="Precinto Operador" placeholder="Ingrese y escriba /" />
                <MultiValueInput label="Precinto Senasa" placeholder="Ingrese y escriba /" />
                <MultiValueInput label="Precinto Línea" placeholder="Ingrese y escriba /" />
                <MultiValueInput label="Termógrafos" placeholder="Ingrese y escriba /" icon={Thermometer} />
              </GlassCard>

            </div>

            {/* Acciones Finales */}
            <div className="mt-8 flex items-center justify-end gap-4 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl">
              <button className="px-8 py-3 rounded-2xl font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all underline underline-offset-4">
                Limpiar Formulario
              </button>
              <button className="flex items-center gap-3 px-12 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-black text-lg shadow-xl shadow-indigo-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]">
                FINALIZAR REGISTRO
                <Plus className="h-6 w-6" />
              </button>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
