"use client";

import React from "react";
import { cn } from "@/lib/utils";

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
 * Monitor dinámico del procesamiento OCR.
 * Muestra el progreso real, logs de la IA y el nivel de confianza.
 */
export function CardOcrStatus({ status, progress, logs, confidence }: Props) {
    return (
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary notranslate">insights</span>
                    Bitácora de IA
                </h3>
                <span className={cn(
                    "px-2 py-1 text-[10px] font-bold uppercase rounded transition-colors",
                    status === "processing" ? "bg-primary/20 text-primary animate-pulse" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                )}>
                    {status === "processing" ? "Procesando" : "En Espera"}
                </span>
            </div>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Confianza de Extracción</span>
                    <span className={cn(
                        "text-sm font-bold transition-colors",
                        confidence && confidence > 90 ? "text-emerald-500" : confidence ? "text-amber-500" : "text-slate-400"
                    )}>
                        {confidence ? `${confidence.toFixed(1)}%` : "---"}
                    </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full transition-all duration-500 ease-out",
                            status === "error" ? "bg-destructive w-full" : "bg-primary"
                        )}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                    {logs.length > 0 ? (
                        logs.map((log, i) => (
                            <div key={i} className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                <span className={cn(
                                    "material-symbols-outlined text-xl notranslate mt-0.5",
                                    log.type === "success" ? "text-emerald-500" : log.type === "warning" ? "text-amber-500" : "text-primary"
                                )}>
                                    {log.type === "success" ? "check_circle" : log.type === "warning" ? "warning" : "info"}
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{log.message}</p>
                                    {log.subtext && <p className="text-[11px] text-slate-500 italic mt-0.5">{log.subtext}</p>}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-6 text-center">
                            <span className="material-symbols-outlined text-slate-300 text-3xl notranslate">analytics</span>
                            <p className="text-xs text-slate-400 mt-2">Sube un documento para iniciar el análisis</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
