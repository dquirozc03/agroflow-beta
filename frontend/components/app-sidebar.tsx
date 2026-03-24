"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Sprout,
  LayoutDashboard,
  Box,
  FileText,
  Settings,
  Users,
  Truck,
  Building2,
  RefreshCw,
  LogOut
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

interface NavGroupProps {
  label: string;
  collapsed: boolean;
  items: NavItem[];
}

function NavGroup({ label, collapsed, items }: NavGroupProps) {
  return (
    <div className="py-4 space-y-1.5">
      {!collapsed && (
        <h4 className="px-6 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 opacity-50">
          {label}
        </h4>
      )}
      {items.map((m) => (
        <a
          key={m.name}
          href={m.href}
          className={cn(
            "flex items-center gap-4 px-5 py-4 rounded-[1.5rem] transition-all duration-500 relative group overflow-hidden",
            m.active
              ? "bg-indigo-500 text-white shadow-[0_15px_40px_-10px_rgba(99,102,241,0.4)] scale-[1.03]"
              : "text-slate-400 hover:text-white hover:bg-white/5 active:scale-95"
          )}
        >
          {/* Brillo de Fondo Dinámico (Solo en activos) */}
          {m.active && (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-transparent opacity-50" />
          )}

          <m.icon className={cn(
            "h-5 w-5 min-w-[1.25rem] transition-all duration-500 z-10",
            m.active ? "text-white" : "group-hover:scale-110 group-hover:rotate-6"
          )} />
          
          {!collapsed && (
            <span className={cn(
              "text-sm tracking-tight flex-1 z-10",
              m.active ? "font-black" : "font-bold"
            )}>
              {m.name}
            </span>
          )}

          {collapsed && (
            <div className="absolute left-24 px-4 py-2 bg-slate-900 border border-white/10 text-white text-[10px] font-black rounded-xl opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 pointer-events-none shadow-2xl z-[100] backdrop-blur-xl">
              {m.name.toUpperCase()}
            </div>
          )}
        </a>
      ))}
    </div>
  );
}

export function AppSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navGroups = useMemo(() => [
    {
      label: "Control",
      items: [
        { name: "Dashboard", icon: LayoutDashboard, href: "/", active: pathname === "/", soon: false },
      ]
    },
    {
      label: "Operación",
      items: [
        { name: "LogiCapture", icon: Box, href: "/logicapture", active: pathname === "/logicapture", soon: false },
      ]
    },
    {
      label: "Maestros",
      items: [
        { name: "Choferes", icon: Users, href: "#", active: false, soon: true },
        { name: "Vehículos", icon: Truck, href: "#", active: false, soon: true },
        { name: "Transportistas", icon: Building2, href: "#", active: false, soon: true },
      ]
    }
  ], [pathname]);

  return (
    <div className={cn(
      "h-screen flex flex-col p-8 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
      collapsed ? "w-36" : "w-80"
    )}>
      <aside
        className={cn(
          "flex flex-col h-full overflow-hidden transition-all duration-700",
          "bg-[#0f172a]/95 dark:bg-[#07090e]/95 backdrop-blur-3xl rounded-[2.5rem]",
          "border border-white/5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)]",
          "relative"
        )}
      >
        {/* Glow Decor (Top Corner) */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none" />

        {/* Header con Logo */}
        <div className="flex h-32 items-center gap-5 px-8">
          <div className="relative group">
            <div className="h-12 w-12 rounded-[1.25rem] bg-indigo-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              <Sprout className="text-white h-6 w-6" />
            </div>
            <div className="absolute -inset-1 bg-indigo-500/20 blur-md rounded-full opacity-50 animate-pulse" />
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-700">
              <span className="font-black text-xl text-white tracking-widest leading-none">
                AGRO<span className="text-indigo-400">FLOW</span>
              </span>
              <span className="text-[10px] font-black text-slate-500 tracking-[0.4em] mt-1.5 ml-0.5">
                V2.0 PRO
              </span>
            </div>
          )}
        </div>

        {/* Navegación por Grupos */}
        <nav className="flex-1 px-5 overflow-y-auto lc-scroll">
          {navGroups.map((group) => (
            <NavGroup 
              key={group.label} 
              label={group.label} 
              collapsed={collapsed} 
              items={group.items} 
            />
          ))}
        </nav>

        {/* Botón de Colapso (Integrado en el diseño) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute right-6 top-10 h-8 w-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all hover:bg-indigo-500 active:scale-90"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Footer / Perfil Usuario (Estilo Dark Card) */}
        <div className="p-6">
          <div className={cn(
            "flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group/user",
            collapsed ? "justify-center" : ""
          )}>
            <div className="h-10 w-10 min-w-[2.5rem] rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center text-white text-xs font-black shadow-2xl">
              {user?.nombre?.[0] || "A"}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate">
                  {user?.nombre || "Administrador"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">En Línea</span>
                </div>
              </div>
            )}
            {!collapsed && (
              <button 
                onClick={logout}
                className="p-2 text-slate-500 hover:text-red-400 transition-colors group-hover/user:scale-110"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
