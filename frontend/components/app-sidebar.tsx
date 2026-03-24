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
  HelpCircle,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight,
  Sprout
} from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";

interface NavItem {
  name: string;
  icon: any;
  href: string;
  active: boolean;
  soon: boolean;
}

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
    { name: "Recursos", icon: Package, href: "#", active: false, soon: true },
    { name: "Reportes", icon: FileBarChart, href: "#", active: false, soon: true },
  ], [pathname]);

  return (
    <aside 
      className={cn(
        "flex flex-col h-screen bg-[#131313]/90 backdrop-blur-3xl border-r border-white/5 transition-all duration-500 relative z-40 font-['Manrope']",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Botón de Colapso (Integrado Minimalista) */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-24 h-6 w-6 rounded-full bg-[#b6a0ff] text-[#000000] flex items-center justify-center shadow-[0_0_15px_#b6a0ff] scale-75 hover:scale-100 transition-transform z-50 focus:outline-none"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Header Logo (Banda Sprout) */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-10 overflow-hidden">
          <div className="min-w-[40px] h-10 rounded-xl bg-[#b6a0ff] flex items-center justify-center shadow-[0_0_20px_rgba(182,160,255,0.3)]">
            <Sprout className="text-[#340090] h-6 w-6 fill-current" />
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500 whitespace-nowrap">
              <h1 className="font-['Space_Grotesk'] font-black text-[#b6a0ff] text-lg leading-tight">
                AGROFLOW
              </h1>
              <p className="text-[10px] text-[#adaaaa] tracking-widest uppercase font-black">
                V2.0 PRO System
              </p>
            </div>
          )}
        </div>

        {/* Navegación (Stitch Sytle) */}
        <nav className="space-y-1">
          {navItems.map((m) => (
            <a
              key={m.name}
              href={m.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 transition-all duration-300 relative group text-sm",
                m.active
                  ? "bg-gradient-to-r from-[#b6a0ff]/20 to-transparent text-[#b6a0ff] border-l-4 border-[#b6a0ff]"
                  : "text-[#adaaaa] hover:text-white hover:bg-[#262626]/40 hover:translate-x-1"
              )}
            >
              <m.icon className={cn(
                "h-5 w-5 transition-transform",
                m.active ? "text-[#b6a0ff]" : "group-hover:scale-110"
              )} />
              
              {!collapsed && (
                <span className={cn(
                  "font-headline tracking-tight",
                  m.active ? "font-black" : "font-medium"
                )}>
                  {m.name}
                </span>
              )}

              {collapsed && (
                <div className="absolute left-16 px-3 py-1.5 bg-[#b6a0ff] text-[#000000] text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-2xl">
                  {m.name.toUpperCase()}
                </div>
              )}
            </a>
          ))}
        </nav>
      </div>

      {/* Footer (Deploy Action) */}
      <div className="mt-auto p-6 space-y-4">
        {!collapsed && (
          <button className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-[#b6a0ff] to-[#7e51ff] text-[#000000] font-black text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(182,160,255,0.4)] active:scale-95 transition-all">
            Nueva Tarea
          </button>
        )}

        <div className="pt-4 border-t border-white/5 space-y-2">
          <div className={cn(
            "flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl cursor-pointer group",
            collapsed ? "justify-center" : ""
          )}>
            <div className="min-w-[32px] h-8 rounded-lg bg-[#262626] border border-white/5 flex items-center justify-center text-[#b6a0ff] font-black text-xs">
               {user?.nombre?.[0] || "A"}
            </div>
            {!collapsed && (
              <p className="flex-1 text-[11px] font-bold text-[#adaaaa] truncate">{user?.nombre || "Admin"}</p>
            )}
          </div>

          <button 
            onClick={logout}
            className={cn(
              "flex w-full items-center gap-3 px-4 py-2 text-[#ff6e84] hover:bg-[#ff6e84]/10 rounded-xl transition-colors",
              collapsed ? "justify-center" : ""
            )}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="text-xs font-black uppercase tracking-widest">Cerrar Sesión</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
