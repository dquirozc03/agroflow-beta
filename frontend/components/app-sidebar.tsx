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
    <div className="py-4 space-y-1">
      {!collapsed && (
        <h4 className="px-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">
          {label}
        </h4>
      )}
      {items.map((m) => (
        <a
          key={m.name}
          href={m.href}
          className={cn(
            "flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-500 relative group",
            m.active
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] ring-1 ring-slate-200/50 dark:ring-white/5"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          {/* Indicador de Línea Azul (Exacto al Mockup) */}
          {m.active && (
            <div className="absolute left-0 w-1 h-5 rounded-r-full bg-indigo-500 shadow-[2px_0_10px_rgba(99,102,241,0.5)]" />
          )}
          
          <m.icon className={cn(
            "h-5 w-5 min-w-[1.25rem] transition-all",
            m.active ? "text-indigo-500" : "group-hover:scale-110"
          )} />
          
          {!collapsed && (
            <span className={cn(
              "text-sm tracking-tight flex-1 font-medium",
              m.active ? "font-bold" : ""
            )}>
              {m.name}
            </span>
          )}

          {collapsed && (
            <div className="absolute left-16 px-3 py-2 bg-slate-900 text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-2xl z-[100]">
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
      "h-screen flex flex-col p-6 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
      collapsed ? "w-32" : "w-80"
    )}>
      <aside
        className={cn(
          "flex flex-col h-full overflow-hidden transition-all duration-500",
          "bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[3rem]",
          "border border-white/60 dark:border-white/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] shadow-indigo-500/5",
          "relative"
        )}
      >
        {/* Cabecera del Logo */}
        <div className="flex h-24 items-center gap-4 px-8 mt-4">
          <div className="h-11 w-11 rounded-[1.25rem] bg-indigo-500 flex items-center justify-center shadow-xl shadow-indigo-500/20">
            <Sprout className="text-white h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-700">
              <span className="font-black text-lg text-slate-800 dark:text-white tracking-widest">
                AGRO<span className="text-indigo-500">FLOW</span>
              </span>
            </div>
          )}
        </div>

        {/* Botón de Colapso (Integrado Minimalista) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute right-6 top-10 text-slate-400 hover:text-indigo-500 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>

        {/* Navegación Principal */}
        <nav className="flex-1 px-4 overflow-y-auto lc-scroll mt-4">
          {navGroups.map((group) => (
            <NavGroup 
              key={group.label} 
              label={group.label} 
              collapsed={collapsed} 
              items={group.items} 
            />
          ))}
        </nav>

        {/* Footer / Usuario */}
        <div className="p-6">
          <div className={cn(
            "flex items-center gap-4 p-4 rounded-[2rem] bg-white/50 dark:bg-slate-800/50 border border-white/50 dark:border-white/5 transition-all",
            collapsed ? "justify-center px-0" : ""
          )}>
            <div className="h-10 w-10 min-w-[2.5rem] rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-indigo-500/20">
              {user?.nombre?.[0] || "A"}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                  {user?.nombre || "Admin"}
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Online</span>
                </div>
              </div>
            )}
            {!collapsed && (
              <button onClick={logout} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
