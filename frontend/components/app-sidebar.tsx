"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Package,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useState, useMemo } from "react";
import { SYSTEM_NAME, MODULE_LOGICAPTURE } from "@/lib/constants";
import { useAuth } from "@/contexts/auth-context";

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab") ?? "";
  const { user, logout } = useAuth();

  const isLogiCapture = tab === "captura" || tab === "bandeja" || tab === "historial";

  const modules = useMemo(
    () => [
      {
        name: "Dashboard",
        icon: LayoutDashboard,
        href: "/?tab=dashboard",
        active: pathname === "/" && (tab === "dashboard" || tab === ""),
        soon: false,
      },
      {
        name: MODULE_LOGICAPTURE,
        icon: Package,
        href: "/?tab=captura",
        active: pathname === "/" && isLogiCapture,
        soon: false,
      },
      {
        name: "Configuración",
        icon: Settings,
        href: "#",
        active: false,
        soon: true,
      },
    ],
    [pathname, tab, isLogiCapture]
  );

  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl transition-all duration-300 z-50 pb-12",
        collapsed ? "w-[4.5rem]" : "w-72"
      )}
    >
      {/* Header del Sidebar */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800/50">
        {!collapsed && (
          <div className="flex items-center gap-2 animate-in fade-in duration-300">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-bold text-xs">AF</span>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">AgroFlow</h1>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Suite v1.0</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="group rounded-full p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all"
          aria-label={collapsed ? "Expandir" : "Colapsar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {!collapsed && <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Menu Principal</p>}

        {modules.map((mod) => (
          <a
            key={mod.name}
            href={mod.href}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
              mod.active
                ? "bg-gradient-to-r from-primary/15 to-transparent text-primary shadow-sm ring-1 ring-primary/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white",
              mod.soon && "cursor-not-allowed opacity-50 grayscale"
            )}
            onClick={(e) => {
              if (mod.soon) e.preventDefault();
            }}
          >
            {/* Active Indicator Bar */}
            {mod.active && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]" />}

            <mod.icon className={cn("h-5 w-5 shrink-0 transition-transform group-hover:scale-110", mod.active ? "text-green-400" : "text-slate-400 group-hover:text-white")} />

            {!collapsed && (
              <span className={cn("flex flex-1 items-center justify-between", mod.active ? "text-white font-semibold" : "text-slate-400 group-hover:text-white")}>
                {mod.name}
                {mod.soon && (
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Pronto
                  </span>
                )}
              </span>
            )}

            {/* Hover Tooltip for Collapsed State */}
            {collapsed && (
              <div className="absolute left-full ml-4 hidden rounded-md bg-slate-900 px-2 py-1 text-xs text-white group-hover:block whitespace-nowrap z-50 animate-in fade-in slide-in-from-left-2">
                {mod.name}
              </div>
            )}
          </a>
        ))}
      </nav>

      {/* Footer del Sidebar */}
      <div className="p-4 border-t border-white/10 bg-slate-900/50">
        {!collapsed ? (
          <div className="rounded-xl bg-slate-800/50 p-3 border border-white/5 transition-colors hover:bg-slate-800">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-800 text-slate-200 shadow-inner ring-1 ring-white/10">
                <div className="h-5 w-5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-slate-900"></span>
                </span>
              </div>
              <div className="flex-1 overflow-hidden text-left">
                <p className="text-sm font-bold text-white truncate leading-tight">
                  {user?.nombre?.split(" ")[0] ?? "Usuario"}
                </p>
                <p className="text-[10px] text-green-400 font-medium truncate">Activo ahora</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative mx-auto h-9 w-9 flex items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-800 text-slate-200 shadow-inner ring-1 ring-white/10 group-hover:scale-105 transition-transform">
            <div className="h-5 w-5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 border-2 border-slate-900"></span>
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
