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
  History,
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
  FileUp,
  ShieldCheck
} from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";

export function AppSidebar({ className }: { className?: string }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sections = useMemo(() => {
    const p = user?.permisos || {};
    
    // Visibilidad por sección: Visible si al menos un hijo es visible
    const hasLogi = !!(p.lc_registro || p.lc_bandeja);
    const hasOper = !!(p.op_instrucciones);
    const hasMaestros = !!(p.m_bulk || p.m_contenedores || p.m_transportistas || p.m_vehiculos || p.m_choferes || p.m_clientes_ie);
    const hasSys = !!(p.sys_usuarios || p.sys_roles || (user?.rol as string) === "ADMIN");

    const allSections = [
      {
        id: "general",
        label: "General",
        visible: true,
        items: [
          { name: "Panel de Control", icon: LayoutDashboard, href: "/", active: pathname === "/" },
        ]
      },
      {
        id: "logicapture",
        label: "LogiCapture",
        visible: hasLogi,
        items: [
          { name: "Formulario Registro", icon: Scan, href: "/logicapture", active: pathname === "/logicapture", visible: !!p.lc_registro },
          { name: "Bandeja de Datos", icon: History, href: "/logicapture/bandeja", active: pathname === "/logicapture/bandeja", visible: !!p.lc_bandeja },
        ].filter(i => i.visible)
      },
      {
        id: "operaciones",
        label: "Gestión Operativa",
        visible: hasOper,
        items: [
          { name: "Instrucciones de Embarque", icon: FileBarChart, href: "/operaciones/instrucciones", active: pathname === "/operaciones/instrucciones", visible: !!p.op_instrucciones },
        ].filter(i => i.visible)
      },
      {
        id: "maestros",
        label: "Datos Maestros",
        visible: hasMaestros,
        items: [
          { name: "Carga Masiva (Excel)", icon: FileUp, href: "/maestros/bulk-upload", active: pathname === "/maestros/bulk-upload", visible: !!p.m_bulk },
          { name: "Contenedores y Dam's", icon: Package, href: "/maestros/contenedores-dams", active: pathname === "/maestros/contenedores-dams", visible: !!p.m_contenedores },
          { name: "Transportistas", icon: Truck, href: "/maestros/transportistas", active: pathname === "/maestros/transportistas", visible: !!p.m_transportistas },
          { name: "Vehículos", icon: Tractor, href: "/maestros/vehiculos", active: pathname === "/maestros/vehiculos", visible: !!p.m_vehiculos },
          { name: "Choferes", icon: Users, href: "/maestros/choferes", active: pathname === "/maestros/choferes", visible: !!p.m_choferes },
          { name: "Clientes IE", icon: Map, href: "/maestros/clientes-ie", active: pathname === "/maestros/clientes-ie", visible: !!p.m_clientes_ie },
        ].filter(i => i.visible)
      },
      {
        id: "sistema",
        label: "Sistema",
        visible: hasSys,
        items: [
          { name: "Usuarios", icon: UserRound, href: "/configuracion/usuarios", active: pathname === "/configuracion/usuarios", visible: !!p.sys_usuarios || (user?.rol as string) === "ADMIN" },
          { name: "Master Roles", icon: ShieldCheck, href: "/configuracion/roles", active: pathname === "/configuracion/roles", visible: !!p.sys_roles || (user?.rol as string) === "ADMIN" },
          { name: "Configuración", icon: Settings, href: "#", active: false, visible: (user?.rol as string) === "ADMIN" },
        ].filter(i => i.visible)
      }
    ];

    return allSections.filter(s => s.visible);
  }, [pathname, user]);

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
