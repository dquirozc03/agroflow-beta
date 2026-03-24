"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { 
  Bell, 
  Settings, 
  ChevronDown, 
  MapPin, 
  Plus,
  HelpCircle,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onOpenScanner?: () => void;
  title?: string;
}

export function AppHeader({ onOpenScanner, title }: Props) {
  const { user } = useAuth();
  const pathname = usePathname();

  return (
    <header className="flex justify-between items-center w-full px-12 py-8 sticky top-0 z-20 bg-white/40 backdrop-blur-3xl border-b border-slate-100/50">
      
      {/* SECTOR IZQUIERDO: Breadcrumbs / Modulo (Minimal Capsule) */}
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-[1.5rem] border border-slate-100 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.03)] group cursor-pointer hover:border-indigo-2 transition-all">
          <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="font-['Space_Grotesk'] font-black text-[13px] tracking-tight text-slate-800 uppercase italic">
            {title || "DASHBOARD"}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
        </div>

        {/* Buscador Integrado (Next-Gen Search) */}
        <div className="relative group hidden lg:block">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
           <input 
              type="text" 
              placeholder="Buscar registros..." 
              className="pl-11 pr-6 py-3 rounded-2xl bg-slate-50 border border-slate-100 outline-none w-64 text-sm font-bold text-slate-600 focus:bg-white focus:border-indigo-500/30 focus:shadow-xl transition-all"
           />
        </div>
      </div>

      {/* SECTOR DERECHO: Herramientas y Perfil Light Edition */}
      <div className="flex items-center gap-10">
        
        {/* Notificaciones & Alerts */}
        <div className="flex items-center gap-3">
          <button className="h-12 w-12 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center relative shadow-sm">
            <Bell className="h-5 w-5" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="h-12 w-12 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center shadow-sm">
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Perfil John McClane Light Style */}
        <div className="flex items-center gap-5 border-l border-slate-100 pl-10 group cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] font-black font-['Space_Grotesk'] leading-none text-slate-800 uppercase tracking-tighter italic">
              {user?.nombre || "Administrador"}
            </p>
            <p className="text-[9px] text-slate-400 uppercase tracking-[0.3em] font-black mt-2 opacity-80 leading-none">
              {user?.rol || "Supervisor Alpha"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm group-hover:scale-105 transition-transform overflow-hidden relative">
             <div className="h-full w-full rounded-xl bg-slate-50 flex items-center justify-center text-indigo-600 font-black text-sm">
                {user?.nombre?.[0] || "A"}
             </div>
             <div className="absolute bottom-1 right-1 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
          </div>
        </div>

        {/* Acción Maestro (Floating Plus Light) */}
        <button 
           onClick={onOpenScanner}
           className="h-14 w-14 rounded-[1.5rem] bg-indigo-600 shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)] flex items-center justify-center text-white active:scale-95 hover:bg-indigo-700 transition-all ml-2"
        >
          <Plus className="h-7 w-7" />
        </button>

      </div>
    </header>
  );
}
