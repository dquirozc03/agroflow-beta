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
  Users,
  MessageSquare,
  Settings,
  HelpCircle,
  FileCode,
  ShieldAlert
} from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";

interface SidebarSection {
  title: string;
  items: any[];
}

export function AppSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const sections: SidebarSection[] = useMemo(() => [
    {
      title: "General",
      items: [
        { name: "Dashboard", icon: LayoutDashboard, href: "/", active: pathname === "/" },
        { name: "LogiCapture", icon: Scan, href: "/logicapture", active: pathname === "/logicapture" },
        { name: "Apps", icon: Box, href: "#", active: false },
        { name: "Chats", icon: MessageSquare, href: "#", active: false, badge: 3 },
        { name: "Users", icon: Users, href: "#", active: false },
      ]
    },
    {
      title: "Pages",
      items: [
        { name: "Auth", icon: ShieldAlert, href: "#", active: false },
        { name: "Errors", icon: FileCode, href: "#", active: false },
      ]
    },
    {
      title: "Other",
      items: [
        { name: "Settings", icon: Settings, href: "#", active: false },
        { name: "Help Center", icon: HelpCircle, href: "#", active: false },
      ]
    }
  ], [pathname]);

  return (
    <aside className="w-64 h-screen flex flex-col bg-[#f9fafb] border-r border-slate-200/60 p-4 transition-all overflow-hidden relative">
      
      {/* Brand Header Style: Shadcn Admin */}
      <div className="flex items-center gap-3 px-3 py-6 mb-4">
        <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center text-white shadow-lg">
           <Sprout className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-sm leading-none tracking-tight">Shadcn Admin</span>
          <span className="text-[10px] text-slate-400 font-medium mt-1">Vite + ShadcnUI</span>
        </div>
        <div className="ml-auto hidden group-hover:block">
           <ChevronDown className="h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Nav Content Sectioned */}
      <nav className="flex-1 space-y-8 px-2 overflow-y-auto lc-scroll">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
             <p className="px-2 text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-widest">{section.title}</p>
             {section.items.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm group",
                    item.active 
                      ? "bg-white text-black shadow-sm border border-slate-200/50" 
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
                  )}
                >
                  <item.icon className={cn("h-4.5 w-4.5", item.active ? "text-black" : "text-slate-400 group-hover:text-slate-900")} />
                  <span className={cn(item.active ? "font-bold" : "font-medium")}>{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto bg-black text-white text-[10px] h-5 w-5 flex items-center justify-center rounded-full font-bold">{item.badge}</span>
                  )}
                  {item.active && <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />}
                </a>
             ))}
          </div>
        ))}
      </nav>

      {/* Footer Perfil John McClane Style (Calcado Referencia) */}
      <div className="mt-auto px-1 pt-6 border-t border-slate-200/60">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-100 transition-all cursor-pointer group/user">
          <div className="h-9 w-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold text-xs ring-1 ring-slate-200">
             {user?.nombre?.[0] || "SN"}
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate uppercase mt-0.5">{user?.nombre || "Sat Naing"}</p>
            <p className="text-[10px] text-slate-400 font-medium truncate">{user?.email || "satnaingdev@gmail.com"}</p>
          </div>
          <button onClick={logout} className="ml-auto p-1.5 text-slate-300 hover:text-slate-900">
             <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
