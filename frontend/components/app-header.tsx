"use client";

import { useAuth } from "@/contexts/auth-context";
import { 
  Bell, 
  Settings, 
  ChevronDown, 
  Plus,
  Search,
  LogOut,
  MapPin,
  Cpu,
  Zap,
  ShieldCheck,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onOpenScanner?: () => void;
  title?: string;
}

export function AppHeader({ onOpenScanner, title }: Props) {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-24 items-center justify-between px-12 bg-white/20 backdrop-blur-3xl sticky top-0 z-40 border-b border-slate-100/50">
      
      {/* IZQUIERDA: Contexto de Navegación "Smart Capsule" (Expert Mode) */}
      <div className="flex items-center gap-6">
        <div className="h-10 w-10 rounded-2xl bg-[#0f172a] flex items-center justify-center text-emerald-500 shadow-xl shadow-slate-200">
           <LayoutGrid className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400 leading-none">Status Central</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xl font-['Space_Grotesk'] font-extrabold text-[#022c22] tracking-tighter">
              {title || "SISTEMA INTEGRADO"}
            </span>
            <div className="px-2 py-1 rounded bg-emerald-50 border border-emerald-100 text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">
               Active Mode
            </div>
          </div>
        </div>
      </div>

      {/* DERECHA: Buscador de Alta Fidelidad & Perfil Premium */}
      <div className="flex items-center gap-8">
        
        {/* Buscador de Cristal */}
        <div className="relative group lg:block hidden">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
           <input 
              type="text" 
              placeholder="Sincronizar datos..." 
              className="pl-12 pr-6 py-3.5 rounded-2xl bg-white/80 border border-slate-100 outline-none w-[280px] text-[13px] font-bold text-slate-700 placeholder-slate-300 focus:bg-white focus:border-emerald-500/30 transition-all shadow-sm group-hover:shadow-md"
           />
        </div>

        {/* Acciones & Nodes */}
        <div className="flex items-center gap-2">
          <button className="h-12 w-12 rounded-2xl bg-white/60 border border-slate-100 text-slate-400 hover:text-emerald-600 transition-all flex items-center justify-center relative shadow-sm hover:shadow-xl hover:-translate-y-1">
             <Bell className="h-5 w-5" />
             <span className="absolute top-4 right-4 h-2 w-2 bg-emerald-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="h-12 w-12 rounded-2xl bg-white/60 border border-slate-100 text-slate-400 hover:text-emerald-600 transition-all flex items-center justify-center shadow-sm hover:shadow-xl hover:-translate-y-1">
             <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* PERFIL (Premium John McClane Style) */}
        <div className="flex items-center gap-4 pl-8 border-l border-slate-100 group/user cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-[13px] font-black text-[#022c22] leading-none uppercase tracking-tight">
              {user?.nombre || "Maria Silva"}
            </p>
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-1.5 leading-none">
               Expert Administrator
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#0f172a] shadow-xl shadow-slate-200 border border-[#1e293b] flex items-center justify-center p-0.5 overflow-hidden transition-all group-hover/user:scale-105 group-hover/user:border-emerald-500">
             <div className="h-full w-full rounded-xl bg-[#1e293b] flex items-center justify-center text-emerald-400 font-extrabold text-[12px] uppercase">
                {user?.nombre?.slice(0, 2) || "SN"}
             </div>
          </div>
        </div>

      </div>
    </header>
  );
}
