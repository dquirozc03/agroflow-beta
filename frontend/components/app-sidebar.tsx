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
  Sprout
} from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = useMemo(() => [
    { name: "Dashboard", icon: LayoutDashboard, href: "/", active: pathname === "/", soon: false },
    { name: "LogiCapture", icon: Box, href: "/logicapture", active: pathname === "/logicapture", soon: false },
    { name: "Irrigación", icon: Droplets, href: "#", active: false, soon: true },
    { name: "Climatología", icon: Thermometer, href: "#", active: false, soon: true },
    { name: "Análisis AI", icon: Brain, href: "#", active: false, soon: true },
    { name: "Sensores", icon: Cpu, href: "#", active: false, soon: true },
  ], [pathname]);

  return (
    <aside 
      className={cn(
        "flex flex-col h-screen transition-all duration-[600ms] ease-[cubic-bezier(0.2,1,0.2,1)] relative z-40 bg-white/40 backdrop-blur-3xl border-r border-slate-200 shadow-[0_0_40px_rgba(0,0,0,0.02)]",
        collapsed ? "w-24" : "w-[320px]"
      )}
    >
      {/* Botón de Colapso (Integrado en el Borde) */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-10 h-6 w-6 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:text-indigo-500 shadow-sm z-50 transition-all hover:scale-110 active:scale-95"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Header Logo (Adaptive) */}
      <div className="p-8">
        <div className={cn("flex items-center gap-4 transition-all", collapsed ? "justify-center" : "")}>
          <div className="h-10 w-10 min-w-[2.5rem] rounded-[1rem] bg-indigo-600 flex items-center justify-center shadow-[0_10px_20px_-5px_rgba(79,70,229,0.4)]">
            <Sprout className="text-white h-6 w-6" />
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
              <h1 className="font-['Space_Grotesk'] font-black text-slate-800 text-xl tracking-tighter uppercase italic">
                AGROFLOW
              </h1>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] leading-none mt-1">
                V2.0 Next Gen
              </p>
            </div>
          )}
        </div>

        {/* Navegación Light Generation */}
        <nav className="mt-12 space-y-1.5">
          {navItems.map((m) => (
            <a
              key={m.name}
              href={m.href}
              className={cn(
                "flex items-center gap-4 rounded-[1.25rem] transition-all duration-300 relative group",
                collapsed ? "justify-center h-14 w-14 mx-auto" : "px-5 py-4",
                m.active
                  ? "bg-indigo-600 text-white shadow-[0_15px_30px_-5px_rgba(79,70,229,0.3)]"
                  : "text-slate-400 hover:text-slate-900 hover:bg-slate-100/80 active:scale-95"
              )}
            >
              <m.icon className={cn(
                "h-5 w-5 transition-transform",
                m.active ? "text-white" : "group-hover:scale-110"
              )} />
              
              {!collapsed && (
                <span className={cn(
                  "text-[13px] tracking-tight",
                  m.active ? "font-black" : "font-bold"
                )}>
                  {m.name}
                </span>
              )}

              {collapsed && (
                <div className="absolute left-20 px-4 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 whitespace-nowrap pointer-events-none shadow-2xl z-50">
                  {m.name.toUpperCase()}
                </div>
              )}
            </a>
          ))}
        </nav>
      </div>

      {/* Footer Perfil & Logout */}
      <div className="mt-auto p-6 space-y-4">
        {!collapsed && (
           <button className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95 mb-4">
              NUEVA TAREA
           </button>
        )}

        <div className={cn(
          "flex items-center gap-4 p-3 rounded-[1.25rem] bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all group/user cursor-pointer",
          collapsed ? "justify-center" : ""
        )}>
          <div className="h-10 w-10 min-w-[2.5rem] rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm">
             {user?.nombre?.[0] || "A"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-slate-800 truncate">{user?.nombre || "Admin"}</p>
              <div className="flex items-center gap-1 mt-0.5">
                 <div className="h-1 w-1 rounded-full bg-emerald-500" />
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">En Línea</span>
              </div>
            </div>
          )}
          {!collapsed && (
             <button onClick={logout} className="p-2 text-slate-300 hover:text-red-400 transition-colors">
               <LogOut className="h-4 w-4" />
             </button>
          )}
        </div>
      </div>
    </aside>
  );
}
