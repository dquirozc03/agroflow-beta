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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LogOut, User, Settings, ShieldCheck } from "lucide-react";
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
          <img src="/Logo_Beta.png" alt="Beta" className="h-14 w-auto hover:opacity-80 transition-opacity" />
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
            onClick={onOpenScanner}
            className="hidden sm:flex h-10 gap-2 bg-primary hover:bg-primary/90 text-white dark:text-white rounded-xl px-5 font-black text-xs transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px] notranslate text-white">smartphone</span>
            Vincular Celular
          </Button>
        )}

        <ThemeToggle />

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="group flex items-center gap-3 pl-2 border-l border-slate-100 dark:border-white/5 ml-2 focus:outline-none transition-all">
                <div className="hidden lg:flex flex-col items-end pr-1">
                  <span className="text-[13px] font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight group-hover:text-primary transition-colors">
                    {user.nombre}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">
                    {ROLE_LABELS[user.rol as UserRole]}
                  </span>
                </div>
                <div className="relative">
                  <Avatar className="h-10 w-10 border border-slate-200 dark:border-white/10 group-hover:border-primary/50 transition-all shadow-sm">
                    <AvatarFallback className="bg-primary text-white font-black text-xs">
                      {user.nombre?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Ponto de Status Tecnológico (Respirante) */}
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0f172a] shadow-sm animate-pulse" />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl border-slate-200 dark:border-white/10 shadow-xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <DropdownMenuLabel className="px-2 py-1.5">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Mi Cuenta</p>
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{user.usuario}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5 -mx-1" />
              <DropdownMenuItem className="gap-2 px-2 py-2.5 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Mi Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 px-2 py-2.5 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                <Settings className="h-4 w-4 text-slate-400" />
                <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Configuración</span>
              </DropdownMenuItem>
              {user.rol === "administrador" && (
                <DropdownMenuItem className="gap-2 px-2 py-2.5 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Panel Admin</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5 -mx-1" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="gap-2 px-2 py-2.5 rounded-lg cursor-pointer bg-red-50/0 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition-all font-bold"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-[13px]">Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="flex items-center gap-2">
          {/* 
              DISEÑO POR EXCEPCIÓN: 
              Solo mostramos el estado de la API si hay problemas (isWaking o Offline).
              El indicador de entorno (DEV) se oculta para no confundir al usuario final.
          */}
          <div className="flex items-center">
            {isWaking ? (
              <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Iniciando API...</span>
              </div>
            ) : !apiOnline && apiOnline !== null ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => wakeBackend()} 
                      className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-500/10 text-red-600 animate-in fade-in zoom-in duration-300"
                    >
                      <span className="material-symbols-outlined text-[16px] notranslate leading-none">wifi_off</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Sin Conexión</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-[10px] font-bold">API Desconectada. Clic para reintentar.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
