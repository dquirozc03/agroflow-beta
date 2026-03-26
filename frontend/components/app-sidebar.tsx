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
  BarChart3,
  Truck,
  Users,
  UserRound,
  FileUp
} from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sections = useMemo(() => [
    {
      label: "General",
      items: [
        { name: "Panel de Control", icon: LayoutDashboard, href: "/", active: pathname === "/" },
      ]
    },
    {
      label: "LogiCapture",
      items: [
        { name: "Formulario Registro", icon: Scan, href: "/logicapture", active: pathname === "/logicapture" },
      ]
    },
    {
      label: "Datos Maestros",
      items: [
        { name: "Carga Masiva (Excel)", icon: FileUp, href: "/maestros/bulk-upload", active: pathname === "/maestros/bulk-upload" },
        { name: "Transportistas", icon: Truck, href: "/maestros/transportistas", active: pathname === "/maestros/transportistas" },
        { name: "Vehículos", icon: Tractor, href: "#", active: false },
        { name: "Choferes", icon: Users, href: "#", active: false },
      ]
    },
    {
      label: "Sistema",
      items: [
        { name: "Analítica", icon: BarChart3, href: "#", active: false },
        { name: "Configuración", icon: Settings, href: "#", active: false },
      ]
    }
  ], [pathname]);

  return (
    <aside className={cn(
      "h-screen flex flex-col bg-[#022c22] border-r border-emerald-900/30 transition-all duration-500 relative z-50 shadow-2xl",
      isCollapsed ? "w-20" : "w-64"
    )}>
      
      {/* Brand Logo & Toggle */}
      <div className={cn(
        "flex items-center gap-3 mb-10 mt-8 transition-all duration-500",
        isCollapsed ? "justify-center px-0" : "px-8"
      )}>
        <div className="h-10 w-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
           <Sprout className="h-6 w-6 fill-current" />
        </div>
        {!isCollapsed && (
          <span className="font-['Outfit'] font-extrabold text-white text-2xl tracking-tighter animate-in fade-in slide-in-from-left-2 transition-all">
            AgroFlow
          </span>
        )}
      </div>

      {/* Botón de Colapsar (Pegado al borde) */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 h-6 w-6 bg-emerald-500 rounded-full border-2 border-[#022c22] flex items-center justify-center text-white shadow-lg hover:scale-110 transition-all z-[60]"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Navegación Vertical con Secciones */}
      <div className="flex-1 overflow-y-auto px-4 sidebar-scroll">
        {sections.map((section, sIdx) => (
          <div key={section.label} className={cn("mb-6", sIdx === 0 ? "mt-2" : "")}>
            {!isCollapsed && (
              <p className="px-5 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/40 animate-in fade-in duration-700">
                {section.label}
              </p>
            )}
            {isCollapsed && (
              <div className="h-px bg-emerald-900/30 mx-4 mb-4" />
            )}
            <nav className="space-y-1">
              {section.items.map((m) => (
                <a
                  key={m.name}
                  href={m.href}
                  title={isCollapsed ? m.name : ""}
                  className={cn(
                    "flex items-center gap-4 py-3 rounded-2xl transition-all group relative overflow-hidden",
                    isCollapsed ? "justify-center px-0" : "px-5",
                    m.active
                      ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20"
                      : "text-emerald-100/40 hover:text-white hover:bg-white/5"
                  )}
                >
                  <m.icon className={cn(
                    "h-5 w-5 transition-transform duration-300",
                    m.active ? "text-white scale-110" : "text-emerald-500/50 group-hover:scale-110 group-hover:text-emerald-400"
                  )} />
                  {!isCollapsed && (
                    <span className={cn(
                      "text-[13px] tracking-tight animate-in fade-in duration-500",
                      m.active ? "font-bold" : "font-medium"
                    )}>
                      {m.name}
                    </span>
                  )}
                  {m.active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full shadow-[0_0_10px_white]" />
                  )}
                </a>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer & Perfil */}
      <div className={cn(
        "mt-auto pt-6 border-t border-emerald-900/30 mb-8 transition-all duration-500",
        isCollapsed ? "px-0 items-center" : "px-6"
      )}>
        <div className={cn(
          "flex items-center gap-3 mb-6 group/user cursor-pointer p-2 rounded-2xl hover:bg-white/5 transition-all",
          isCollapsed ? "justify-center" : ""
        )}>
           <div className="h-10 w-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 font-bold text-xs ring-2 ring-emerald-500/20 shrink-0">
              {user?.nombre?.[0] || "C"}
           </div>
           {!isCollapsed && (
             <div className="flex flex-col min-w-0 animate-in fade-in">
               <p className="text-xs font-bold text-white truncate uppercase tracking-tight">{user?.nombre || "Carlos"}</p>
               <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                  <p className="text-[9px] text-emerald-500/60 font-black uppercase tracking-[0.2em]">En Línea</p>
               </div>
             </div>
           )}
        </div>
        <button 
          onClick={logout} 
          className={cn(
            "flex items-center gap-3 px-4 py-3 text-emerald-100/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            isCollapsed ? "justify-center" : "w-full"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}
