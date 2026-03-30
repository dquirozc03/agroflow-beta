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
  Sun,
  LayoutGrid,
  Leaf
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onOpenScanner?: () => void;
  title?: string;
}

export function AppHeader({ onOpenScanner, title }: Props) {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-20 items-center justify-between px-10 bg-[#f6f8fa] relative z-40">
      
      {/* IZQUIERDA: Saludo Personalizado "Fase 3 Style" */}
      <div className="flex flex-col">
        <h2 className="text-2xl font-black text-[#022c22] tracking-tighter uppercase">
          ¡Buen día, {user?.nombre || "ADMINISTRADOR AGROFLOW"}!
        </h2>
        <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-[0.2em] leading-none">
          {title || "Tus campos están estables."}
        </p>
      </div>

      {/* DERECHA: Search & Controls (Agro Style) */}
      <div className="flex items-center gap-6">
        
        {/* Buscador Slim (Shadcn + Carlos Style) */}
        <div className="relative group lg:block hidden">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
           <input 
              type="text" 
              placeholder="Buscar..." 
              className="pl-12 pr-6 py-2.5 rounded-xl bg-white border border-slate-100 outline-none w-[320px] text-sm font-bold text-slate-700 focus:border-emerald-500/30 transition-all shadow-sm"
           />
        </div>

        {/* Notificaciones & Perfil Avatar (Referencia Calcada) */}
        <div className="flex items-center gap-4">
          <button className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-600 transition-all shadow-sm hover:shadow-lg relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-emerald-500 rounded-full border border-white"></span>
          </button>
          
          <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-100 flex items-center justify-center text-slate-700 font-bold text-[10px] cursor-pointer hover:bg-slate-200 transition-all uppercase ring-4 ring-white shadow-sm">
             {user?.nombre?.slice(0, 2) || "CA"}
          </div>
          
          <ChevronDown className="h-4 w-4 text-slate-300 cursor-pointer" />
        </div>

      </div>
    </header>
  );
}
