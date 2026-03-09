"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { 
  ClipboardCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  FileText 
} from "lucide-react";

interface OcrLog {
    type: "info" | "success" | "warning";
    message: string;
    subtext?: string;
}

interface Props {
    status: "idle" | "processing" | "success" | "error";
    progress: number;
    logs: OcrLog[];
    confidence: number | null;
}

/**
 * Monitor de Estatus del Registro.
 * Mide el nivel de completitud de los datos obligatorios.
 */
export function CardOcrStatus({ status, progress, logs, confidence }: Props) {
    return (
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    Estatus del Registro
                </h3>
                <span className={cn(
                    "px-2 py-1 text-[10px] font-bold uppercase rounded transition-colors",
                    status === "processing" ? "bg-primary/20 text-primary animate-pulse" : 
                    progress === 100 ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                )}>
                    {status === "processing" ? "Extrayendo..." : progress === 100 ? "Completado" : "En Espera"}
                </span>
            </div>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Progreso de Llenado</span>
                    <span className={cn(
                        "text-sm font-black transition-colors",
                        progress === 100 ? "text-emerald-500" : progress > 50 ? "text-amber-500" : "text-slate-400"
                    )}>
                        {progress}%
                    </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                    <div
                        className={cn(
                            "h-full transition-all duration-1000 ease-out rounded-full shadow-sm",
                            status === "error" ? "bg-destructive w-full" : 
                            progress === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-primary to-emerald-400"
                        )}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                    {progress > 0 || logs.length > 0 ? (
                        <div className="space-y-3">
                            {logs.map((log, i) => (
                                <div key={i} className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                    {log.type === "success" ? (
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                                    ) : log.type === "warning" ? (
                                        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                                    ) : (
                                        <Info className="h-5 w-5 text-primary mt-0.5" />
                                    )}
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{log.message}</p>
                                        {log.subtext && <p className="text-[11px] text-slate-500 font-medium mt-0.5">{log.subtext}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                            <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs text-slate-400 font-medium max-w-[180px] mx-auto">Analiza un documento o inicia el llenado manual para medir el progreso.</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
