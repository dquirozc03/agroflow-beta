"use client";

import { Package, Heart } from "lucide-react";
import { SYSTEM_NAME, MODULE_LOGICAPTURE, COMPANY_NAME } from "@/lib/constants";

const currentYear = new Date().getFullYear();

export function AppFooter() {
  return (
    <footer
      role="contentinfo"
      className="shrink-0 border-t border-border bg-gradient-to-b from-card to-card/95 px-6 py-6 text-muted-foreground"
    >
      <div className="mx-auto max-w-[1600px]">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Producto */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" aria-hidden />
              <span className="font-semibold text-foreground">{SYSTEM_NAME}</span>
            </div>
            <p className="text-xs leading-relaxed">
              {MODULE_LOGICAPTURE} · Registro operativo, bandeja SAP e historial para exportaciones agroindustriales.
            </p>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/80">Sistema</p>
            <ul className="space-y-1 text-xs">
              <li>Captura · Bandeja SAP</li>
              <li>Historial y reportes</li>
              <li>Gestión de choferes y vehículos</li>
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/80">Soporte</p>
            <p className="text-xs leading-relaxed">
              ¿Olvidaste tu contraseña? Contacta al administrador de tu organización.
            </p>
          </div>

          {/* Empresa - Derechos */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-foreground">{COMPANY_NAME}</p>
            <p className="text-xs leading-relaxed">
              Soluciones de software para el sector agroindustrial.
            </p>
            <p className="mt-2 flex items-center gap-1 text-xs">
              © {currentYear} {COMPANY_NAME}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-border/60 pt-4 text-center text-xs text-muted-foreground">
          <span>Hecho con <Heart className="inline h-3.5 w-3 text-red-400" /> por {COMPANY_NAME}</span>
          <span>·</span>
          <span>{SYSTEM_NAME} v1.0</span>
        </div>
      </div>
    </footer>
  );
}
