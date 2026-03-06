// frontend/components/app-header.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkApiHealth } from "@/lib/api";
import { useBackendStatus } from "@/contexts/backend-status-context";
import { useAuth } from "@/contexts/auth-context";
import { SYSTEM_NAME, MODULE_LOGICAPTURE, ROLE_LABELS } from "@/lib/constants";
import type { UserRole } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const ENV = process.env.NEXT_PUBLIC_ENV || "DEV";

interface Props {
  onOpenScanner?: () => void;
}

export function AppHeader({ onOpenScanner }: Props) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isWaking, wakeBackend } = useBackendStatus();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  const handleLogout = () => {
    logout();
    router.replace("/login");
    router.refresh();
  };

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const ok = await checkApiHealth();
      if (mounted) setApiOnline(ok);
    };
    check();
    const interval = setInterval(check, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#0f172a]/50 backdrop-blur-md px-6 sticky top-0 z-40 transition-all">
      {/* IZQUIERDA */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <img src="/Logo_Beta.png" alt="Beta" className="h-8 w-auto hover:opacity-80 transition-opacity" />
          <div className="h-4 w-[1.5px] bg-slate-200 dark:bg-white/10 mx-1" />
          <span className="text-[15px] font-bold text-slate-400 dark:text-slate-500 tracking-tight">AgroFlow</span>
        </div>

        <div className="hidden md:flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-1.5 border border-primary/10">
          <span className="material-symbols-outlined text-[18px] text-primary notranslate">inventory_2</span>
          <span className="text-[13px] font-black text-primary tracking-tight">
            {MODULE_LOGICAPTURE}
          </span>
        </div>
      </div>

      {/* DERECHA */}
      <div className="flex items-center gap-4">
        {onOpenScanner && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenScanner}
            className="hidden sm:flex h-10 gap-2 border-slate-200 dark:border-white/10 rounded-xl px-4 text-slate-600 dark:text-slate-300 font-bold text-xs hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px] notranslate">smartphone</span>
            Vincular Celular
          </Button>
        )}

        <ThemeToggle />

        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-100 dark:border-white/5 ml-2">
            <div className="hidden lg:flex flex-col items-end pr-1">
              <span className="text-[13px] font-black text-slate-900 dark:text-white leading-none uppercase tracking-tight">
                {user.nombre}
              </span>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 text-right">
                {ROLE_LABELS[user.rol as UserRole]}
              </span>
            </div>
            <button className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center border border-slate-100 dark:border-white/10 hover:border-primary/50 transition-all group">
              <span className="material-symbols-outlined text-slate-500 group-hover:text-primary notranslate">person</span>
            </button>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors font-bold text-xs uppercase tracking-wider ml-2"
        >
          <span className="material-symbols-outlined text-[18px] notranslate">logout</span>
          <span className="hidden sm:inline">Salir</span>
        </button>

        <div className="flex items-center gap-2 ml-2">
          <span className={cn(
            "px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase",
            ENV === "PROD" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" : "bg-primary/10 text-primary"
          )}>
            {ENV}
          </span>

          <div className="flex items-center">
            {isWaking ? (
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center animate-pulse">
                <span className="h-2 w-2 rounded-full bg-primary" />
              </div>
            ) : apiOnline ? (
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-500/10">
                <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400 notranslate leading-none">wifi</span>
                <span className="hidden xl:inline text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">API Online</span>
              </div>
            ) : (
              <button onClick={() => wakeBackend()} className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-500/10 text-red-600">
                <span className="material-symbols-outlined text-[16px] notranslate leading-none">wifi_off</span>
                <span className="hidden xl:inline text-[10px] font-black uppercase tracking-wider">Desconectado</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
