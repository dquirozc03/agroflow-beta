"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { 
  Bell, 
  Settings, 
  ChevronDown, 
  MapPin, 
  LogOut,
  Search,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onOpenScanner?: () => void;
  title?: string;
}

export function AppHeader({ onOpenScanner, title }: Props) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="flex h-24 items-center justify-between px-10 relative z-20">
      
      {/* IZQUIERDA: Módulo Actual (Estilo Central Zone) */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl px-6 py-3 rounded-[1.5rem] border border-white dark:border-white/5 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)]">
          <div className="p-1.5 rounded-lg bg-indigo-500/5 text-indigo-500">
            <MapPin className="h-4 w-4" />
          </div>
          <span className="text-[13px] font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">
            {title || "SISTEMA LOGÍSTICO"}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400 ml-2" />
        </div>
      </div>

      {/* DERECHA: Herramientas y Usuario (Exacto al Mockup) */}
      <div className="flex items-center gap-3">
        
        {/* Notificaciones */}
        <div className="flex bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl p-1.5 rounded-[1.5rem] border border-white dark:border-white/5 shadow-sm">
          <button className="relative p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-500">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-4 w-4 bg-indigo-500 border-2 border-white dark:border-slate-900 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
              3
            </span>
          </button>
          <button className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-500">
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Perfil de Usuario (Card John McClane Style) */}
        <div className="flex items-center gap-4 bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl pl-2 pr-6 py-2.5 rounded-[1.5rem] border border-white dark:border-white/5 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] group cursor-pointer">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 border border-white shadow-lg overflow-hidden flex items-center justify-center text-white font-black text-xs">
             {user?.nombre?.[0] || "U"}
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-slate-800 dark:text-white leading-none">
              {user?.nombre || "Usuario"}
            </span>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
              Online
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-300 ml-2 group-hover:text-indigo-500 transition-colors" />
        </div>

        {/* Botón de Acción Especial (Opcional del Mockup) */}
        <button 
          onClick={onOpenScanner}
          className="flex items-center justify-center h-12 w-12 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Plus className="h-6 w-6" />
        </button>

      </div>
    </header>
  );
}
