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
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onOpenScanner?: () => void;
  title?: string;
}

function NavTab({ name, active }: any) {
  return (
    <a 
      href="#"
      className={cn(
        "text-sm px-4 py-2 transition-all relative border-b-2",
        active 
          ? "border-black text-black font-bold" 
          : "border-transparent text-slate-400 hover:text-slate-900"
      )}
    >
      {name}
    </a>
  );
}

export function AppHeader({ onOpenScanner, title }: Props) {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between px-6 bg-white border-b border-slate-200/60 sticky top-0 z-50">
      
      {/* IZQUIERDA: Tabs Navigation (Shadcn Style) */}
      <div className="flex items-center gap-2">
        <button className="h-8 w-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-black mr-4 group">
           <LayoutGrid className="h-4 w-4 group-hover:scale-110 transition-transform" />
        </button>
        <NavTab name="Overview" active={true} />
        <NavTab name="Customers" active={false} />
        <NavTab name="Products" active={false} />
        <NavTab name="Settings" active={false} />
      </div>

      {/* DERECHA: Search & Controls (Shadcn Style) */}
      <div className="flex items-center gap-4">
        
        {/* Buscador Slim con Atajo */}
        <div className="relative group lg:block hidden">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-black transition-colors" />
           <input 
              type="text" 
              placeholder="Search..." 
              className="pl-9 pr-12 py-1.5 rounded-md bg-white border border-slate-200 outline-none w-[200px] text-xs font-semibold text-slate-700 focus:border-black transition-all"
           />
           <div className="absolute right-2 top-1/2 -translate-y-1/2 px-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-black text-slate-400 pointer-events-none">
              ⌘K
           </div>
        </div>

        {/* System Controls */}
        <div className="flex items-center gap-1 border-l border-slate-200/60 pl-4 ml-2">
          <button className="h-8 w-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
            <Sun className="h-4 w-4" />
          </button>
          <button className="h-8 w-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 bg-rose-500 rounded-full border border-white"></span>
          </button>
          <button className="h-8 w-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors mr-2">
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* User Badge (SN Style) */}
        <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-[10px] cursor-pointer hover:bg-slate-200 transition-all uppercase">
           {user?.nombre?.slice(0, 2) || "SN"}
        </div>

      </div>
    </header>
  );
}
