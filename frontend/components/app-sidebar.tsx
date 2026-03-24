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
  Tractor,
  Layers,
  Settings,
  Map,
  BarChart3
} from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navItems = useMemo(() => [
    { name: "Panel de Control", icon: LayoutDashboard, href: "/", active: pathname === "/" },
    { name: "Mis Campos", icon: Map, href: "#", active: false },
    { name: "Maquinaria", icon: Tractor, href: "#", active: false },
    { name: "Riego", icon: Droplets, href: "/logicapture", active: pathname === "/logicapture" },
    { name: "Analítica", icon: BarChart3, href: "#", active: false },
    { name: "Configuración", icon: Settings, href: "#", active: false },
  ], [pathname]);

  return (
    <aside className="w-64 h-screen flex flex-col bg-white border-r border-slate-100 p-6 transition-all relative z-50">
      
      {/* Brand Logo "Carlos style" */}
      <div className="flex items-center gap-3 mb-12 ml-2">
        <div className="h-9 w-9 bg-white border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
           <Sprout className="h-5 w-5 fill-current" />
        </div>
        <span className="font-['Outfit'] font-extrabold text-[#022c22] text-xl tracking-tighter">
          AgroFlow
        </span>
      </div>

      {/* Navegación Vertical Inmaculada */}
      <nav className="flex-1 space-y-2">
        {navItems.map((m) => (
          <a
            key={m.name}
            href={m.href}
            className={cn(
              "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative",
              m.active
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <m.icon className={cn(
              "h-5 w-5",
              m.active ? "text-white" : "text-slate-400 group-hover:text-emerald-500"
            )} />
            <span className={cn(
              "text-sm tracking-tight",
              m.active ? "font-bold" : "font-medium"
            )}>
              {m.name}
            </span>
          </a>
        ))}
      </nav>

      {/* Footer Minimalista (Shadcn Style) */}
      <div className="mt-auto px-2 pt-6 border-t border-slate-50">
        <div className="flex items-center gap-3 mb-4 group/user cursor-pointer">
           <div className="h-9 w-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-xs ring-2 ring-white">
              {user?.nombre?.[0] || "C"}
           </div>
           <div className="flex flex-col min-w-0">
             <p className="text-xs font-bold text-slate-900 truncate uppercase mt-0.5">{user?.nombre || "Carlos"}</p>
             <p className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-widest">En Línea</p>
           </div>
        </div>
        <button 
          onClick={logout} 
          className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-bold transition-all"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
