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
  RotateCcw
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { cn } from "@/lib/utils";

// --- Subcomponentes de UI Minimalista (Estilo V2 Clean) ---

function CleanCard({ title, icon: Icon, children }: any) {
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-[2.5rem] border border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-8 transition-all duration-500",
      "hover:border-indigo-500/30 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)]"
    )}>
      {/* Glow Sutil de Fondo */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/5 blur-[80px] group-hover:bg-indigo-500/10 transition-all" />
      
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
            {title}
          </h3>
          <div className="h-0.5 w-8 bg-indigo-500/0 group-hover:w-12 group-hover:bg-indigo-500/50 transition-all duration-500 mt-1" />
        </div>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

function InputMinimal({ label, placeholder, icon: Icon }: any) {
  return (
    <div className="group space-y-2 w-full">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors group-focus-within:text-indigo-500">
          {label}
        </label>
      </div>
      <div className="relative">
        <input 
          type="text" 
          placeholder={placeholder}
          className={cn(
            "w-full bg-white/50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-5 outline-none transition-all duration-300",
            "placeholder:text-slate-300 dark:placeholder:text-slate-700 text-slate-700 dark:text-slate-200 font-medium",
            "focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500/40 focus:ring-[6px] focus:ring-indigo-500/5 shadow-sm"
          )}
        />
        {Icon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-700 group-focus-within:text-indigo-500/50 transition-colors">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}

function MultiTagInput({ label, placeholder }: any) {
  const [tags, setTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  const addTag = () => {
    const val = inputValue.trim();
    if (val) {
      setTags([...tags, val]);
      setInputValue("");
    }
  };

  return (
    <div className="group space-y-2 w-full">
      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-indigo-500">
        {label}
      </label>
      <div className={cn(
        "flex flex-wrap gap-2 items-center w-full min-h-[54px] bg-white/50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/5 rounded-2xl px-4 py-2.5 transition-all duration-300 shadow-sm",
        "focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-indigo-500/40 focus-within:ring-[6px] focus-within:ring-indigo-500/5"
      )}>
        {tags.map((tag, i) => (
          <span key={i} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-[11px] font-black text-slate-600 dark:text-slate-300 animate-in zoom-in duration-300">
            {tag}
            <button 
              onClick={() => setTags(tags.filter((_, idx) => idx !== i))}
              className="p-1 hover:bg-red-500 hover:text-white rounded-md transition-colors"
            >
              <Plus className="h-3 w-3 rotate-45" />
            </button>
          </span>
        ))}
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-slate-300 dark:placeholder:text-slate-700 min-w-[120px]"
          onKeyDown={(e) => {
            if (e.key === "/" || e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
        />
      </div>
    </div>
  );
}

// --- Componente Principal ---

export default function LogicCaptureMinimalPage() {
  const [ocrMode, setOcrMode] = useState<"booking" | "contenedor">("contenedor");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#fafafa] dark:bg-[#07090e]">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
        <AppHeader title="LogicCapture V2" onOpenScanner={() => {}} />

        <main className="flex-1 overflow-y-auto lc-scroll p-10 lg:p-14">
          <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-1000">
            
            {/* Header de la Aplicación */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-slate-200 dark:border-white/5 pb-12">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/10 text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">
                  <Zap className="h-3 w-3" />
                  Módulo de Inteligencia
                </div>
                <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tight">
                  Logi<span className="text-slate-300 dark:text-slate-700">Capture</span>
                </h1>
                <p className="text-slate-400 dark:text-slate-600 text-lg max-w-xl font-medium">Sincronización avanzada de datos de embarque con inteligencia OCR integrada.</p>
              </div>

              {/* Selector de Modo OCR Minimalista */}
              <div className="flex bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-3xl border border-slate-200/50 dark:border-white/5 shadow-sm">
                <button 
                  onClick={() => setOcrMode("contenedor")}
                  className={cn(
                    "flex items-center gap-2 px-8 py-3 rounded-[1.25rem] font-black text-[11px] tracking-widest transition-all uppercase",
                    ocrMode === "contenedor" 
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xl shadow-black/5 scale-[1.02]" 
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  )}
                >
                  <Container className={cn("h-4 w-4", ocrMode === "contenedor" ? "text-indigo-500" : "")} />
                  Contenedor
                </button>
                <button 
                  onClick={() => setOcrMode("booking")}
                  className={cn(
                    "flex items-center gap-2 px-8 py-3 rounded-[1.25rem] font-black text-[11px] tracking-widest transition-all uppercase",
                    ocrMode === "booking" 
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xl shadow-black/5 scale-[1.02]" 
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  )}
                >
                  <BookOpen className={cn("h-4 w-4", ocrMode === "booking" ? "text-indigo-500" : "")} />
                  Booking
                </button>
              </div>
            </div>

            {/* Grid de Contenido */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              
              <CleanCard title="Datos de Embarque" icon={FileText}>
                <InputMinimal label="Nº de Booking" placeholder="Ingresar booking..." icon={Hash} />
                <InputMinimal label="ID Contenedor" placeholder="Cargar contenedor..." icon={Container} />
                <InputMinimal label="Nº Orden Beta" placeholder="Asignar orden..." />
                <InputMinimal label="Nº de Dam" placeholder="Referencia DAM..." />
              </CleanCard>

              <CleanCard title="Unidad Operativa" icon={Truck}>
                <InputMinimal label="DNI Chofer" placeholder="Escaneo automático..." icon={Zap} />
                <div className="grid grid-cols-2 gap-4">
                  <InputMinimal label="Placa Tracto" placeholder="000-XXX" />
                  <InputMinimal label="Placa Carreta" placeholder="000-XXX" />
                </div>
                <InputMinimal label="Transportista" placeholder="Empresa asignada..." icon={BookOpen} />
                <InputMinimal label="Precinto BETA" placeholder="Cierre de unidad..." />
              </CleanCard>

              <CleanCard title="Precintos de Seguridad" icon={ShieldCheck}>
                <MultiTagInput label="Aduana" placeholder="Ingrese nros y use /" />
                <MultiTagInput label="Operador" placeholder="Ingrese nros y use /" />
                <MultiTagInput label="Senasa / Línea" placeholder="Ingrese nros y use /" />
                <MultiTagInput label="Termógrafos" placeholder="Identificadores..." />
              </CleanCard>

            </div>

            {/* Panel de Acción Flotante */}
            <div className="relative group bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-slate-200 dark:border-white/5 p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 transition-all hover:border-indigo-500/20">
              <div className="flex items-center gap-6">
                <div className="h-14 w-14 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 ring-1 ring-emerald-500/20">
                  <BadgeCheck className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-1">Verificación Completa</h4>
                  <p className="text-slate-500 font-medium">Todos los parámetros críticos han sido validados.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-5 rounded-[1.5rem] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100">
                  <RotateCcw className="h-4 w-4" />
                  LIMPIAR
                </button>
                <button className="flex-[2] md:flex-none flex items-center justify-center gap-3 px-12 py-5 rounded-[1.5rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-lg shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                  FINALIZAR REGISTRO
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
