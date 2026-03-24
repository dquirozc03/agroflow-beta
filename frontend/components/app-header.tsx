"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { 
  Bell, 
  Settings, 
  ChevronDown, 
  MapPin, 
  Plus,
  HelpCircle
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
    <header className="flex justify-between items-center w-full px-10 py-6 sticky top-0 z-50 bg-[#0e0e0e]/80 backdrop-blur-xl border-b border-[#484847]/15">
      
      {/* SECTOR IZQUIERDO: Selector de Zona (Stitch Capsule Style) */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4 bg-[#262626]/60 px-5 py-2.5 rounded-full border border-white/5 shadow-[0_8px_32px_rgba(182,160,255,0.08)] group cursor-pointer hover:bg-[#262626] transition-all">
          <MapPin className="h-5 w-5 text-[#b6a0ff] shadow-[0_0_10px_#b6a0ff]" />
          <span className="font-['Space_Grotesk'] font-bold text-sm tracking-tight text-white uppercase">
            {title || "CENTRAL ZONE"}
          </span>
          <ChevronDown className="h-4 w-4 text-[#adaaaa] group-hover:text-[#b6a0ff] transition-colors" />
        </div>

        {/* Links de Navegación Secundaria (Stitch Style) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-['Space_Grotesk'] font-medium">
          <a className="text-[#adaaaa] hover:text-white transition-colors" href="#">Sincronización</a>
          <a className="text-[#b6a0ff] border-b-2 border-[#b6a0ff] pb-1 font-bold" href="#">LogiCapture</a>
          <a className="text-[#adaaaa] hover:text-white transition-colors" href="#">Historial</a>
        </nav>
      </div>

      {/* SECTOR DERECHO: Herramientas y Perfil John McClane Style */}
      <div className="flex items-center gap-8">
        
        {/* Notificaciones y Settings */}
        <div className="flex items-center gap-2">
          <button className="p-2.5 rounded-full hover:bg-[#262626]/50 transition-all text-[#adaaaa] hover:text-white relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#ff6e84] rounded-full shadow-[0_0_8px_#ff6e84]"></span>
          </button>
          <button className="p-2.5 rounded-full hover:bg-[#262626]/50 transition-all text-[#adaaaa] hover:text-white">
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Perfil Técnico con Borde Lavanda */}
        <div className="flex items-center gap-4 border-l border-[#484847]/15 pl-8 group cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black font-['Space_Grotesk'] leading-none text-white uppercase tracking-tighter">
              {user?.nombre || "Administrador"}
            </p>
            <p className="text-[10px] text-[#adaaaa] uppercase tracking-[0.2em] font-black mt-1.5 opacity-60">
              {user?.rol || "Field Operative"}
            </p>
          </div>
          <div className="w-11 h-11 rounded-full border-2 border-[#b6a0ff] bg-[#262626] flex items-center justify-center shadow-[0_0_20px_#b6a0ff15] overflow-hidden group-hover:scale-105 transition-transform">
             <span className="text-white font-black text-sm">{user?.nombre?.[0] || "A"}</span>
          </div>
        </div>

        {/* Botón de Acción Acción Rápida (Floating Plus) */}
        <button 
           onClick={onOpenScanner}
           className="w-12 h-12 rounded-full bg-[#b6a0ff] shadow-[0_0_25px_rgba(182,160,255,0.4)] flex items-center justify-center text-[#340090] active:scale-90 transition-all ml-2"
        >
          <Plus className="h-7 w-7" />
        </button>

      </div>
    </header>
  );
}
