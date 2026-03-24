"use client";

import { useAuth } from "@/contexts/auth-context";
import { 
  Bell, 
  Settings, 
  ChevronDown, 
  Plus,
  Search,
  LogOut,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onOpenScanner?: () => void;
  title?: string;
}

export function AppHeader({ onOpenScanner, title }: Props) {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-24 items-center justify-between px-10 bg-transparent sticky top-0 z-30">
      
      {/* IZQUIERDA: Contexto de Navegación (Clean Capsule) */}
      <div className="flex items-center gap-4 bg-white/60 backdrop-blur-xl px-6 py-3 rounded-[1.5rem] border border-white shadow-sm transition-all hover:bg-white">
        <MapPin className="h-4 w-4 text-emerald-600" />
        <span className="font-extrabold text-[12px] tracking-widest text-[#022c22] uppercase">
          {title || "SISTEMA INTEGRADO"}
        </span>
        <div className="h-1 w-1 rounded-full bg-slate-300 mx-1" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">V2.4</span>
      </div>

      {/* DERECHA: Buscador y Perfil Premium */}
      <div className="flex items-center gap-6">
        
        {/* Buscador Integrado */}
        <div className="relative group lg:block hidden">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500" />
           <input 
              type="text" 
              placeholder="Buscar datos..." 
              className="pl-11 pr-5 py-3 rounded-2xl bg-white border border-slate-100 outline-none w-64 text-sm font-bold text-slate-600 focus:border-emerald-500/30 transition-all shadow-sm"
           />
        </div>

        {/* Acciones & Alerts */}
        <div className="flex items-center gap-2">
          <button className="h-12 w-12 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center relative shadow-sm hover:shadow-lg">
             <Bell className="h-5 w-5" />
             <span className="absolute top-3.5 right-3.5 h-2 w-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
        </div>

        {/* PERFIL (John McClane Style) */}
        <div className="flex items-center gap-4 bg-white px-3 py-1.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group/user cursor-pointer">
          <div className="text-right hidden sm:block pl-2">
            <p className="text-[11px] font-black text-slate-800 leading-none truncate">
              {user?.nombre || "Maria Silva"}
            </p>
            <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest mt-1.5 leading-none">
               Online Status
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center p-0.5 overflow-hidden transition-all">
             <div className="h-full w-full rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 font-black text-xs">
                {user?.nombre?.[0] || "U"}
             </div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-300 group-hover/user:text-emerald-500" />
        </div>

        {/* Botón Maestro Acceso Rápido */}
        <button 
          onClick={onOpenScanner}
          className="h-14 w-14 rounded-2xl bg-emerald-600 shadow-[0_15px_35px_-5px_rgba(16,185,129,0.3)] flex items-center justify-center text-white active:scale-95 transition-all ml-2"
        >
          <Plus className="h-7 w-7" />
        </button>

      </div>
    </header>
  );
}
