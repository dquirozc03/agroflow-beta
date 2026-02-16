"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Package,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useMemo } from "react";
import { SYSTEM_NAME, MODULE_LOGICAPTURE } from "@/lib/constants";

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab") ?? "";

  const isLogiCapture = tab === "captura" || tab === "bandeja" || tab === "historial";
  const modules = useMemo(
    () => [
      {
        name: "Dashboard",
        icon: LayoutDashboard,
        href: "/?tab=dashboard",
        active: pathname === "/" && (tab === "dashboard" || tab === ""),
        soon: false,
      },
      {
        name: MODULE_LOGICAPTURE,
        icon: Package,
        href: "/?tab=captura",
        active: pathname === "/" && isLogiCapture,
        soon: false,
      },
      {
        name: "Configuracion",
        icon: Settings,
        href: "#",
        active: false,
        soon: true,
      },
    ],
    [pathname, tab, isLogiCapture]
  );
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200",
        collapsed ? "w-[4.25rem]" : "w-64"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <span className="text-base font-semibold tracking-tight text-sidebar-foreground uppercase">
            Módulos
          </span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 p-3">
        {modules.map((mod) => (
          <a
            key={mod.name}
            href={mod.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors",
              mod.active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              mod.soon && "cursor-not-allowed opacity-60"
            )}
            onClick={(e) => {
              if (mod.soon) e.preventDefault();
            }}
          >
            <mod.icon className="h-5 w-5 shrink-0" />
            {!collapsed && (
              <span className="flex items-center gap-2">
                {mod.name}
                {mod.soon && (
                  <span className="rounded-md bg-sidebar-accent px-2 py-0.5 text-xs font-medium text-sidebar-foreground/70">
                    Pronto
                  </span>
                )}
              </span>
            )}
          </a>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3">
        {!collapsed && (
          <p className="text-xs text-sidebar-foreground/50">
            Beta · LogiCapture v1.0
          </p>
        )}
      </div>
    </aside>
  );
}
