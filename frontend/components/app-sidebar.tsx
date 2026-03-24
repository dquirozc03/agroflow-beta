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
  Users,
  Truck,
  Building2,
  RefreshCw,
  LogOut,
  ChevronDown,
  Bell,
  Settings
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

function SidebarItem({ m, collapsed }: { m: NavItem, collapsed: boolean }) {
  return (
    <a
      key={m.name}
      href={m.href}
      className={cn(
        "flex items-center gap-5 px-6 py-4 rounded-2xl transition-all duration-700 relative group",
        m.active
          ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_10px_25px_-5px_rgba(79,70,229,0.4)]"
          : "text-slate-400 hover:text-white"
      )}
    >
      {/* EL PUNTO CYAN (The Blue Glow Dot - Exacto al mockup) */}
      {m.active && (
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2">
          <div className="h-3 w-3 rounded-full bg-[#00f2ff] shadow-[0_0_15px_#00f2ff,0_0_5px_#fff] animate-pulse" />
        </div>
      )}
      
      <m.icon className={cn(
        "h-5 w-5 min-w-[1.25rem] transition-transform duration-500",
        m.active ? "text-white" : "group-hover:scale-110"
      )} />
      
      {!collapsed && (
        <span className={cn(
          "text-[13px] tracking-tight flex-1",
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
    <aside
      className={cn(
        "relative flex flex-col h-full transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)]",
        "bg-[#0f172a] border-r border-white/5",
        collapsed ? "w-24" : "w-[340px]"
      )}
    >
      {/* Glow Decor Layer */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

      {/* Header Logo (Exacto al Mockup) */}
      <div className="flex h-32 items-center gap-4 px-10 relative z-10">
        <div className="h-12 w-12 flex items-center justify-center bg-indigo-500 rounded-2xl shadow-xl shadow-indigo-500/20">
          <Sprout className="text-white h-7 w-7" />
        </div>
        {!collapsed && (
          <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-700">
            <span className="font-black text-[22px] text-white tracking-widest leading-none">
              AGROFLOW <span className="text-indigo-400">V2</span>
            </span>
            <span className="text-[10px] font-black text-slate-500 tracking-[0.3em] mt-1.5 ml-0.5">
               MANAGEMENT PRO
            </span>
          </div>
        )}
      </div>

      {/* Navegación por Grupos */}
      <nav className="flex-1 px-6 space-y-8 overflow-y-auto lc-scroll">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <h4 className="px-6 text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-4">
                {group.label}
              </h4>
            )}
            <div className="space-y-1.5">
              {group.items.map((m) => (
                <SidebarItem key={m.name} m={m} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Botón de Colapso Flotante */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-[#00f2ff] shadow-[0_0_15px_#00f2ff] flex items-center justify-center text-slate-900 transition-transform active:scale-95"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      <div className="p-8">
        {/* Espacio reservado para el footer del sidebar si fuera necesario */}
      </div>
    </aside>
  );
}
