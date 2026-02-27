"use client";

import { Package, Heart } from "lucide-react";
import { SYSTEM_NAME, MODULE_LOGICAPTURE, COMPANY_NAME } from "@/lib/constants";

const currentYear = new Date().getFullYear();

export function AppFooter() {
  return (
    <footer className="group fixed bottom-0 left-0 right-0 z-[100] translate-y-[calc(100%-2.5rem)] bg-slate-950 text-slate-300 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:translate-y-0">
      {/* Handle / Status Bar (Always Visible) */}
      <div className="flex h-10 w-full items-center justify-between border-t border-white/10 bg-slate-900/80 px-4 backdrop-blur-md transition-colors group-hover:bg-slate-900">
        <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-slate-400 group-hover:text-slate-200">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse box-shadow-green-glow" />
          Sistemas Operativos
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-[10px] text-slate-500 sm:inline group-hover:text-slate-400">© {currentYear} {COMPANY_NAME}</span>
          <div className="h-1 w-16 rounded-full bg-slate-700/50 group-hover:bg-slate-600" />
        </div>
      </div>

      {/* Expanded Content */}
      <div className="mx-auto max-w-[1600px] px-6 py-12">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 md:grid-cols-4 lg:gap-8 opacity-0 transition-opacity duration-300 delay-100 group-hover:opacity-100">
          {/* Col 1: Branding */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white shadow-lg shadow-green-900/20">
                <Package className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">{SYSTEM_NAME}</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 max-w-[280px]">
              Plataforma integral para el control operativo, gestión de embarques y trazabilidad agroexportadora.
            </p>
          </div>

          {/* Col 2: Navegación */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Plataforma</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                <a href="/?tab=dashboard" className="hover:text-white transition-colors">Dashboard Gerencial</a>
              </li>
              <li>
                <a href="/?tab=captura" className="hover:text-white transition-colors">Registro Operativo</a>
              </li>
              <li>
                <a href="/?tab=bandeja" className="hover:text-white transition-colors">Bandeja SAP</a>
              </li>
              <li>
                <a href="/?tab=historial" className="hover:text-white transition-colors">Historial de Registros</a>
              </li>
            </ul>
          </div>

          {/* Col 3: Recursos */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Recursos</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Documentación API</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Guía de Usuario</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Reportar Incidente</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Estado del Servicio</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal / Empresa */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Legal</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>Términos de Servicio</li>
              <li>Política de Privacidad</li>
              <li>Seguridad de Datos</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800/50 pt-8 sm:flex-row text-xs text-slate-500 opacity-0 transition-opacity duration-300 delay-150 group-hover:opacity-100">
          <p>© {currentYear} {COMPANY_NAME}. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              Hecho con <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" /> por el equipo de tecnología
            </span>
            <span className="hidden sm:inline">v1.0.2-beta</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
