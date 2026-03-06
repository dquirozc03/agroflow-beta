"use client";

import React from "react";

export function CardOcrStatus() {
    return (
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary notranslate">insights</span>
                    Estado de Procesamiento
                </h3>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-400 text-[10px] font-bold uppercase rounded">
                    En Tiempo Real
                </span>
            </div>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Confianza del OCR</span>
                    <span className="text-sm font-bold text-primary">94.8%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-[94.8%]"></div>
                </div>
                <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-green-500 text-xl notranslate">check_circle</span>
                        <div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Booking Detectado</p>
                            <p className="text-xs text-slate-400 italic">BK-772819-A (Autocompletado)</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-amber-500 text-xl notranslate">warning</span>
                        <div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Validación de DAM</p>
                            <p className="text-xs text-slate-400 italic">Dígito verificador requiere revisión manual</p>
                        </div>
                    </li>
                </ul>
            </div>
        </section>
    );
}
