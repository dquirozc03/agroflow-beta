// frontend/components/app-sidebar.tsx

"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useMemo } from "react";
import { MODULE_LOGICAPTURE, canSeeAuditoria, canManageUsers } from "@/lib/constants";
import { useAuth } from "@/contexts/auth-context";

export function AppSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab") ?? "";

  const isLogiCapture = tab === "captura" || tab === "bandeja" || tab === "historial";

  const modules = useMemo(
    () => [
      {
        name: "Dashboard",
        icon: "dashboard",
        href: "/?tab=dashboard",
        active: pathname === "/" && (tab === "dashboard" || tab === ""),
        soon: false,
      },
      {
        name: MODULE_LOGICAPTURE,
        icon: "inventory_2", // Representa mejor la captura/cajas
        href: "/?tab=captura",
        active: pathname === "/" && isLogiCapture,
        soon: false,
      },
      {
        name: "Auditoría",
        icon: "priority_high",
        href: "/auditoria",
        active: pathname === "/auditoria",
        soon: false,
        hidden: !canSeeAuditoria(user?.rol ?? ""),
      },
      {
        name: "Facturas Logísticas",
        icon: "package_2",
        href: "/logistica/facturas",
        active: pathname === "/logistica/facturas",
        soon: false,
      },
      {
        name: "Instrucciones de Embarque",
        icon: "description",
        href: "/ie",
        active: pathname === "/ie",
        soon: false,
      },
      {
        name: "Usuarios",
        icon: "group",
        href: "/usuarios",
        active: pathname === "/usuarios",
        soon: false,
        hidden: !canManageUsers(user?.rol ?? ""),
      },
      {
        name: "Configuración",
        icon: "settings",
        href: "#",
        active: false,
        soon: true,
      },
    ],
    [pathname, tab, isLogiCapture, user]
  );

  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-white/5 bg-[#0f172a] shadow-2xl transition-all duration-300 z-50",
        collapsed ? "w-[4.5rem]" : "w-72"
      )}
    >
      {/* Header del Sidebar */}
      <div className="flex h-20 items-center justify-between px-5 border-b border-white/5">
        {!collapsed && (
          <div className="flex items-center gap-3 animate-in fade-in duration-500">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 bg-gradient-to-br from-primary to-green-600">
              <span className="material-symbols-outlined text-white text-2xl notranslate">sprout</span>
            </div>
            <div>
              <h1 className="text-[17px] font-extrabold tracking-tight text-white leading-none">AgroFlow</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[2px] mt-1">v1.1</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="group rounded-xl p-2 hover:bg-slate-800/50 text-slate-500 hover:text-white transition-all border border-transparent hover:border-white/10"
          aria-label={collapsed ? "Expandir" : "Colapsar"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-1.5 p-4 lc-scroll overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[2px] mb-4 mt-2">
            Menu Principal
          </p>
        )}

        {modules.filter(m => !m.hidden).map((mod) => (
          <a
            key={mod.name}
            href={mod.href}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-300",
              mod.active
                ? "bg-primary/10 text-primary shadow-[inset_0_0_20px_rgba(34,197,94,0.05)] border border-primary/20"
                : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent",
              mod.soon && "cursor-not-allowed opacity-40 grayscale"
            )}
            onClick={(e) => {
              if (mod.soon) e.preventDefault();
            }}
          >
            {/* Active Glow Bar */}
            {mod.active && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 rounded-r-full bg-primary shadow-[4px_0_15px_rgba(34,197,94,0.6)]" />
            )}

            <span className={cn(
              "material-symbols-outlined transition-all group-hover:scale-110 notranslate leading-none",
              mod.active ? "text-primary fill-[1]" : "text-slate-500 group-hover:text-white"
            )}>
              {mod.icon}
            </span>

            {!collapsed && (
              <span className={cn(
                "text-[13.5px] font-bold flex-1 tracking-tight transition-colors",
                mod.active ? "text-white" : "text-slate-400 group-hover:text-white"
              )}>
                {mod.name}
                {mod.soon && (
                  <span className="ml-2 rounded-lg bg-slate-800/50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-600 border border-white/5">
                    Pronto
                  </span>
                )}
              </span>
            )}

            {/* Collapsed Tooltip */}
            {collapsed && (
              <div className="absolute left-full ml-4 hidden rounded-lg bg-slate-900 border border-white/10 px-3 py-1.5 text-xs font-bold text-white group-hover:block whitespace-nowrap z-[100] shadow-2xl animate-in fade-in slide-in-from-left-2">
                {mod.name}
              </div>
            )}
          </a>
        ))}
      </nav>

      {/* Profile Section */}
      <div className="p-4 mt-auto">
        <div className={cn(
          "rounded-2xl bg-white/5 border border-white/5 p-4 transition-all hover:bg-white/10 group/profile overflow-hidden",
          collapsed && "p-2 items-center flex justify-center"
        )}>
          <div className="flex items-center gap-3 relative">
            <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-white/5 bg-slate-800 transition-all group-hover/profile:ring-primary/40">
              <span className="material-symbols-outlined text-[20px] text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 notranslate">
                person
              </span>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-primary border-2 border-[#131b2e]"></span>
            </div>

            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-black text-white truncate leading-none">
                  {user?.nombre?.split(" ")[0] ?? "DANIEL"}
                </p>
                <p className="text-[10px] text-primary font-bold tracking-wider mt-1.5 uppercase">Activo ahora</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
