// frontend/components/app-sidebar.tsx

"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Sprout,
  LayoutDashboard,
  Box,
  FileText,
  Settings
} from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";

export function AppSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab") ?? "";

  const modules = useMemo(
    () => [
      {
        name: "Dashboard",
        icon: LayoutDashboard,
        href: "/",
        active: pathname === "/" && (tab === "dashboard" || tab === ""),
        soon: false,
      },
      {
        name: "LogiCapture V2",
        icon: Box,
        href: "#",
        active: false,
        soon: true,
      },
      {
        name: "Informes Profesionales",
        icon: FileText,
        href: "#",
        active: false,
        soon: true,
      },
      {
        name: "Configuración",
        icon: Settings,
        href: "#",
        active: false,
        soon: true,
      },
    ],
    [pathname, tab]
  );

  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-white/5 bg-[#0f172a] shadow-2xl transition-all duration-300 z-50",
        collapsed ? "w-[4.5rem]" : "w-72"
      )}
    >
      {/* Header del Sidebar */}
      <div className="flex h-20 items-center justify-between px-5 border-b border-white/5">
        {!collapsed && (
          <div className="flex items-center gap-3 animate-in fade-in duration-500">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 bg-gradient-to-br from-primary to-green-600">
              <Sprout className="text-white h-6 w-6" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">AgroFlow <span className="text-primary">V2</span></span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto lc-scroll">
        {modules.map((m) => (
          <a
            key={m.name}
            href={m.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
              m.active
                ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <m.icon className={cn("h-5 w-5", m.active ? "text-primary" : "group-hover:scale-110 transition-transform")} />
            {!collapsed && (
              <span className="font-medium text-sm flex-1">{m.name}</span>
            )}
            {!collapsed && m.soon && (
              <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-md">
                Próximamente
              </span>
            )}
          </a>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "px-2")}>
          <div className="h-8 w-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-primary">
            {user?.nombre?.substring(0, 1) || "U"}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white truncate">{user?.nombre || "Usuario"}</span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{user?.rol || "Invitado"}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
