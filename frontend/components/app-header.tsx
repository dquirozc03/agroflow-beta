// frontend/components/app-header.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { checkApiHealth } from "@/lib/api";
import { useBackendStatus } from "@/contexts/backend-status-context";
import { useAuth } from "@/contexts/auth-context";
import { SYSTEM_NAME, MODULE_LOGICAPTURE, ROLE_LABELS } from "@/lib/constants";
import type { UserRole } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const ENV = process.env.NEXT_PUBLIC_ENV || "DEV";

interface Props {
  onOpenScanner?: () => void;
}

export function AppHeader({ onOpenScanner }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const { isWaking, wakeBackend } = useBackendStatus();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  // Lógica de detección de módulo
  const tab = searchParams?.get("tab") || "";

  const getModuleInfo = () => {
    if (pathname === "/ie") return { name: "Instrucciones de Embarque", icon: "description" };
    if (pathname === "/auditoria") return { name: "Auditoría", icon: "priority_high" };
    if (pathname === "/logistica/facturas") return { name: "Facturas Logísticas", icon: "package_2" };
    if (pathname === "/usuarios") return { name: "Gestión de Usuarios", icon: "group" };

    // Si está en el root
    if (pathname === "/") {
      if (tab === "dashboard" || tab === "") return { name: "Dashboard Gerencial", icon: "dashboard" };
      return { name: MODULE_LOGICAPTURE, icon: "inventory_2" };
    }

    return { name: "AgroFlow", icon: "sprout" };
  };

  const moduleInfo = getModuleInfo();

  const handleLogout = () => {
    logout();
    router.replace("/login");
    router.refresh();
  };

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const ok = await checkApiHealth();
      if (mounted) setApiOnline(ok);
    };
    check();
    const interval = setInterval(check, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#0f172a]/50 backdrop-blur-md px-6 sticky top-0 z-40 transition-all">
      {/* IZQUIERDA */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <img src="/Logo_Beta.png" alt="Beta" className="h-11 w-auto hover:opacity-80 transition-opacity" />
        </div>

        <div className="hidden md:flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-1.5 border border-primary/10 animate-in fade-in slide-in-from-left-2 duration-300">
          <span className="material-symbols-outlined text-[18px] text-primary notranslate">{moduleInfo.icon}</span>
          <span className="text-[13px] font-black text-primary tracking-tight">
            {moduleInfo.name}
          </span>
        </div>
      </div>

      {/* DERECHA */}
      <div className="flex items-center gap-4">
        {onOpenScanner && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenScanner}
            className="hidden sm:flex h-10 gap-2 border-slate-200 dark:border-white/10 rounded-xl px-4 text-slate-600 dark:text-slate-300 font-bold text-xs hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px] notranslate">smartphone</span>
            Vincular Celular
          </Button>
        )}

        <ThemeToggle />

        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-100 dark:border-white/5 ml-2">
            <div className="hidden lg:flex flex-col items-end pr-1">
              <span className="text-[13px] font-black text-slate-900 dark:text-white leading-none uppercase tracking-tight">
                {user.nombre}
              </span>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 text-right">
                {ROLE_LABELS[user.rol as UserRole]}
              </span>
            </div>
            <button className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center border border-slate-100 dark:border-white/10 hover:border-primary/50 transition-all group">
              <span className="material-symbols-outlined text-slate-500 group-hover:text-primary notranslate">person</span>
            </button>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors font-bold text-xs uppercase tracking-wider ml-2"
        >
          <span className="material-symbols-outlined text-[18px] notranslate">logout</span>
          <span className="hidden sm:inline">Salir</span>
        </button>

        <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-100 dark:border-white/5">
          {/* Indicador de Entorno (DEV/PROD) */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black tracking-widest uppercase",
                  ENV === "PROD" 
                    ? "bg-amber-100/50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400" 
                    : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", ENV === "PROD" ? "bg-amber-500" : "bg-blue-500")} />
                  {ENV}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-[10px] font-bold">Entorno de {ENV === "PROD" ? "Producción" : "Desarrollo"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Indicador de Estado API */}
          <div className="flex items-center">
            {isWaking ? (
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              </div>
            ) : apiOnline ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-500/10">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Online</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-[10px] font-bold">Servicio API Conectado</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => wakeBackend()} className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/20 px-2.5 py-1 rounded-full border border-red-100 dark:border-red-500/10 text-red-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Offline</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-[10px] font-bold">API Desconectada. Clic para despertar.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
