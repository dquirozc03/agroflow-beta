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
  MoreHorizontal,
  ShieldCheck,
  Settings,
  HelpCircle,
  Activity
} from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = useMemo(() => [
    { name: "Dashboard", icon: LayoutDashboard, href: "/", active: pathname === "/", soon: false },
    { name: "LogiCapture Pro", icon: Scan, href: "/logicapture", active: pathname === "/logicapture", soon: false },
    { name: "Irrigación Hub", icon: Droplets, href: "#", active: false, soon: true },
    { name: "Climatología", icon: Thermometer, href: "#", active: false, soon: true },
    { name: "Sistemas AI", icon: Brain, href: "#", active: false, soon: true },
    { name: "Hardware Sensores", icon: Cpu, href: "#", active: false, soon: true },
    { name: "Reportes Expert", icon: FileBarChart, href: "#", active: false, soon: true },
  ], [pathname]);

  return (
    <aside 
      className={cn(
        "flex flex-col h-screen transition-all duration-700 ease-[cubic-bezier(0.2,0,0,1)] relative z-50 bg-[#0f172a] border-r border-[#1e293b] shadow-[40px_0_80px_-20px_rgba(0,0,0,0.5)]",
        collapsed ? "w-24" : "w-80"
      )}
    >
      {/* Botón de Colapso (Style: Obsidian Marker) */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-10 h-7 w-7 rounded-lg bg-[#0f172a] border border-[#1e293b] text-slate-500 flex items-center justify-center hover:text-emerald-400 shadow-xl z-50 transition-all hover:scale-110 active:scale-95 group"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Header Logo (Obsidian Tech Style) */}
      <div className="p-10">
        <div className={cn("flex items-center gap-5 transition-all", collapsed ? "justify-center" : "")}>
          <div className="h-12 w-12 min-w-[3rem] rounded-2xl bg-[#0f172a] border border-emerald-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.15)] relative group overflow-hidden">
            <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
            <Sprout className="text-emerald-500 h-7 w-7 fill-current relative z-10" />
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-in fade-in slide-in-from-left-6 duration-700">
              <h1 className="font-['Space_Grotesk'] font-extrabold text-white text-2xl tracking-tighter leading-none italic uppercase">
                Agro<span className="text-emerald-500">Flow</span>
              </h1>
              <div className="flex items-center gap-2 mt-2">
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <p className="text-[10px] text-emerald-500/60 font-black uppercase tracking-[0.4em] leading-none">V2 Expert Mode</p>
              </div>
            </div>
          )}
        </div>

        {/* Navegación Vertical Obsidian Pro */}
        <nav className="mt-16 space-y-3">
          {navItems.map((m) => (
            <a
              key={m.name}
              href={m.href}
              className={cn(
                "flex items-center gap-5 rounded-2xl transition-all duration-400 relative group overflow-hidden",
                collapsed ? "justify-center h-14 w-14 mx-auto" : "px-5 py-4",
                m.active
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.2)]"
                  : "text-slate-500 hover:text-white hover:bg-white/5"
              )}
            >
              <m.icon className={cn(
                "h-5 w-5 transition-transform duration-300",
                m.active ? "text-emerald-400" : "group-hover:scale-125 group-hover:text-emerald-500"
              )} />
              
              {!collapsed && (
                <span className={cn(
                  "text-[14px] tracking-tight transition-all",
                  m.active ? "font-extrabold" : "font-semibold"
                )}>
                  {m.name}
                </span>
              )}

              {/* Indicador Activo (Side Marker High-Tech) */}
              {m.active && !collapsed && (
                <div className="absolute right-0 top-3 bottom-3 w-1.5 bg-emerald-500 rounded-l-full shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
              )}

              {collapsed && (
                <div className="absolute left-24 px-4 py-3 bg-emerald-950 text-emerald-400 text-[11px] font-black rounded-xl border border-emerald-500/30 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 whitespace-nowrap pointer-events-none z-50 shadow-2xl">
                  {m.name.toUpperCase()}
                </div>
              )}
            </a>
          ))}
        </nav>
      </div>

      {/* Footer Acceso Operativo & Perfil Premium */}
      <div className="mt-auto p-10 space-y-8">
        {!collapsed && (
           <button className="w-full py-5 rounded-[1.25rem] bg-emerald-600 text-white font-extrabold text-[12px] uppercase tracking-[0.2em] hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-500/20 active:scale-95 group relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="flex items-center justify-center gap-3 relative z-10">
                 <Zap className="h-4 w-4 text-white fill-current" />
                 Nueva Operación
              </span>
           </button>
        )}

        {/* Perfil Obsidian Detail (John McClane Status) */}
        <div className={cn(
          "flex items-center gap-5 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/20 transition-all cursor-pointer group/user overflow-hidden relative",
          collapsed ? "justify-center" : ""
        )}>
          <div className="h-10 w-10 min-w-[2.5rem] rounded-[0.8rem] bg-[#0f172a] border border-[#1e293b] flex items-center justify-center text-emerald-500 font-extrabold text-sm shadow-inner group-hover/user:bg-emerald-500 group-hover/user:text-white transition-all">
             {user?.nombre?.[0] || "A"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-black text-white truncate leading-none uppercase tracking-tight">{user?.nombre || "Admin"}</p>
              <div className="flex items-center gap-2 mt-1.5">
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                 <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest leading-none">Online Mode</span>
              </div>
            </div>
          )}
          {!collapsed && (
             <button onClick={logout} className="p-2 text-slate-500 hover:text-rose-400 transition-colors">
               <LogOut className="h-5 w-5" />
             </button>
          )}
        </div>
      </div>
    </aside>
  );
}
