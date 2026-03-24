"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Box,
  Droplets,
  Thermometer,
  Brain,
  Cpu,
  Package,
  FileBarChart,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight,
  Sprout,
  Scan,
  MoreHorizontal
} from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = useMemo(() => [
    { name: "Dashboard", icon: LayoutDashboard, href: "/", active: pathname === "/", soon: false },
    { name: "LogiCapture Hub", icon: Scan, href: "/logicapture", active: pathname === "/logicapture", soon: false },
    { name: "Irrigación", icon: Droplets, href: "#", active: false, soon: true },
    { name: "Climatología", icon: Thermometer, href: "#", active: false, soon: true },
    { name: "Sensores Alpha", icon: Cpu, href: "#", active: false, soon: true },
    { name: "Análisis AI", icon: Brain, href: "#", active: false, soon: true },
    { name: "Reportes", icon: FileBarChart, href: "#", active: false, soon: true },
  ], [pathname]);

  return (
    <aside 
      className={cn(
        "flex flex-col h-screen transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] relative z-50 bg-white border-r border-slate-100 shadow-[20px_0_40px_-20px_rgba(0,0,0,0.03)]",
        collapsed ? "w-24" : "w-72"
      )}
    >
      {/* Botón de Colapso (Style: BETA Edge) */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-10 h-6 w-6 rounded-lg bg-white border border-slate-100 text-slate-400 flex items-center justify-center hover:text-emerald-600 shadow-sm z-50 transition-all hover:scale-110 active:scale-95"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Header Logo (BETA Style) */}
      <div className="p-8">
        <div className={cn("flex items-center gap-4 transition-all", collapsed ? "justify-center" : "")}>
          <div className="h-10 w-10 min-w-[2.5rem] rounded-xl bg-emerald-600 flex items-center justify-center shadow-[0_10px_20px_-5px_rgba(16,185,129,0.3)]">
            <Sprout className="text-white h-6 w-6 fill-current" />
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
              <h1 className="font-['Inter'] font-extrabold text-[#022c22] text-xl tracking-tighter leading-none">
                AGROFLOW
              </h1>
              <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em] mt-1.5 leading-none">
                V2.0 PRO
              </p>
            </div>
          )}
        </div>

        {/* Navegación Vertical BETA */}
        <nav className="mt-14 space-y-2">
          {navItems.map((m) => (
            <a
              key={m.name}
              href={m.href}
              className={cn(
                "flex items-center gap-4 rounded-xl transition-all duration-300 relative group",
                collapsed ? "justify-center h-12 w-12 mx-auto" : "px-4 py-3.5",
                m.active
                  ? "bg-emerald-50 text-emerald-600 shadow-sm"
                  : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <m.icon className={cn(
                "h-5 w-5 transition-transform",
                m.active ? "text-emerald-600" : "group-hover:scale-110"
              )} />
              
              {!collapsed && (
                <span className={cn(
                  "text-[13px] tracking-tight",
                  m.active ? "font-extrabold" : "font-semibold"
                )}>
                  {m.name}
                </span>
              )}

              {/* Indicador Activo (Side Marker) */}
              {m.active && !collapsed && (
                <div className="absolute right-0 top-3 bottom-3 w-1 bg-emerald-600 rounded-l-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              )}

              {collapsed && (
                <div className="absolute left-20 px-3 py-2 bg-slate-900 text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 whitespace-nowrap pointer-events-none z-50">
                  {m.name.toUpperCase()}
                </div>
              )}
            </a>
          ))}
        </nav>
      </div>

      {/* Footer Acceso Rápido & Perfil */}
      <div className="mt-auto p-6 space-y-6">
        {!collapsed && (
           <button className="w-full py-4 rounded-2xl bg-[#022c22] text-white font-extrabold text-[11px] uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-100 active:scale-95 mb-4 group">
              <span className="flex items-center justify-center gap-2">
                 <Zap className="h-4 w-4 text-emerald-400 fill-current" />
                 NUEVA TAREA
              </span>
           </button>
        )}

        {/* Perfil Mini (BETA Clean) */}
        <div className={cn(
          "flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer group/user overflow-hidden",
          collapsed ? "justify-center" : ""
        )}>
          <div className="h-9 w-9 min-w-[2.25rem] rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 font-bold text-xs shadow-sm">
             {user?.nombre?.[0] || "A"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-extrabold text-slate-800 truncate leading-none uppercase">{user?.nombre || "Admin"}</p>
              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-1 block">Online</span>
            </div>
          )}
          {!collapsed && (
             <button onClick={logout} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors">
               <LogOut className="h-4 w-4" />
             </button>
          )}
        </div>
      </div>
    </aside>
  );
}
