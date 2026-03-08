"use client";

import { COMPANY_NAME } from "@/lib/constants";

export function AppFooter() {
  return (
    <footer className="w-full py-6 mt-12 border-t border-slate-100 dark:border-slate-800/50">
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          <span>© 2026 {COMPANY_NAME}</span>
          <span className="text-slate-200 dark:text-slate-800">•</span>
          <span>Versión 1.0.2</span>
          <span className="text-slate-200 dark:text-slate-800">•</span>
          <button className="hover:text-primary transition-colors">Soporte Técnico</button>
        </div>
        <p className="text-[10px] text-slate-400/60 font-medium italic">
          Plataforma avanzada de gestión agroexportadora.
        </p>
      </div>
    </footer>
  );
}
