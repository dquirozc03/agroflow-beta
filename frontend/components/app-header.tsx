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
  Search,
  LayoutDashboard,
  FolderOpen,
  ClipboardList,
  BarChart3,
  LogOut,
  Sprout
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onOpenScanner?: () => void;
  title?: string;
}

function NavItem({ name, icon: Icon, active, href }: any) {
  return (
    <a 
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all relative group",
        active 
          ? "text-emerald-600 bg-emerald-50/50 font-bold" 
          : "text-slate-500 hover:text-slate-900"
      )}
    >
      <Icon className={cn("h-4.5 w-4.5", active ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-900")} />
      <span className="text-sm tracking-tight">{name}</span>
      {active && (
        <div className="absolute -bottom-4 left-4 right-4 h-1 bg-emerald-500 rounded-full" />
      )}
    </a>
  );
}

export function AppHeader({ onOpenScanner, title }: Props) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="flex h-20 items-center justify-between px-10 bg-white border-b border-slate-100 relative z-50">
      
      {/* IZQUIERDA: Marca y Navegación Principal */}
      <div className="flex items-center gap-12">
        {/* LOGO (Style: Stitch) */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-200">
             <Sprout className="text-white h-5 w-5 fill-current" />
          </div>
          <span className="font-extrabold text-[#022c22] text-xl tracking-tighter">
            Logi<span className="text-emerald-600">Capture</span>
          </span>
        </div>

        {/* TOP NAV TABS (Referencia Calcada) */}
        <nav className="flex items-center gap-2 ml-4">
           <NavItem name="Dashboard" icon={LayoutDashboard} active={pathname === "/"} href="/" />
           <NavItem name="Projects" icon={FolderOpen} active={false} href="#" />
           <NavItem name="Operativo" icon={ClipboardList} active={pathname === "/logicapture"} href="/logicapture" />
           <NavItem name="Reports" icon={BarChart3} active={false} href="#" />
           <NavItem name="Settings" icon={Settings} active={false} href="#" />
        </nav>
      </div>

      {/* DERECHA: Buscador y Perfil John McClane Edition */}
      <div className="flex items-center gap-6">
        
        {/* Buscador Integrado (Borde Redondo) */}
        <div className="relative group lg:block hidden">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500" />
           <input 
              type="text" 
              placeholder="Search data..." 
              className="pl-11 pr-5 py-2.5 rounded-full bg-slate-50 border border-slate-100 outline-none w-64 text-sm font-medium text-slate-600 focus:bg-white focus:border-emerald-500/30 transition-all shadow-sm"
           />
        </div>

        {/* Acciones y Notificaciones */}
        <div className="flex items-center gap-2">
          <button className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors relative">
             <Bell className="h-5 w-5" />
             <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
        </div>

        {/* PERFIL (Referencia John McClane Style) */}
        <div className="flex items-center gap-3 border-l border-slate-100 pl-6 group/user cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-none">
              {user?.nombre || "Maria Silva"}
            </p>
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-1.5 leading-none">
               Online Status
            </p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-emerald-100 bg-slate-50 flex items-center justify-center p-0.5 overflow-hidden group-hover/user:border-emerald-500 transition-all">
             {/* Avatar placeholder o inicial */}
             <div className="h-full w-full rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-black text-[11px]">
                {user?.nombre?.[0] || "U"}
             </div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-300 group-hover/user:text-emerald-500" />
        </div>

        {/* Botón Logout Directo */}
        <button onClick={logout} className="p-2.5 text-slate-300 hover:text-rose-500 transition-colors hover:bg-rose-50 rounded-lg">
           <LogOut className="h-5 w-5" />
        </button>

      </div>
    </header>
  );
}
