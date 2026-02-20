"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { checkApiHealth } from "@/lib/api";
import { useBackendStatus } from "@/contexts/backend-status-context";
import { Wifi, WifiOff, Boxes, LogOut, User, Moon, Sun, Smartphone } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { SYSTEM_NAME, MODULE_LOGICAPTURE, ROLE_LABELS } from "@/lib/constants";
import type { UserRole } from "@/lib/constants";
import { Button } from "@/components/ui/button";

const ENV = process.env.NEXT_PUBLIC_ENV || "DEV";

import { ThemeToggle } from "@/components/theme-toggle";

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
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      {/* IZQUIERDA */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-4 shrink-0">
        <img
          src="/Logo_Beta.png"
          alt="AgroFlow"
          className="h-8 sm:h-[3rem] w-auto object-contain"
        />
        <div className="hidden xs:block h-8 w-px bg-border" />
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {SYSTEM_NAME}
          </span>
          <span className="text-muted-foreground/60">·</span>
          <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-1.5">
            <Boxes className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              {MODULE_LOGICAPTURE}
            </span>
          </div>
        </div>
      </div>

      {/* DERECHA */}
      <div className="flex items-center gap-4">
        {onOpenScanner && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenScanner}
            className="flex gap-1.5 border-dashed border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
          >
            <Smartphone className="h-4 w-4" />
            <span className="hidden lg:inline text-xs font-semibold">Vincular Celular</span>
          </Button>
        )}

        <ThemeToggle />
        {user && (
          <div className="hidden lg:flex flex-col items-start gap-0 rounded-lg border border-border/60 bg-muted/40 px-3 py-1 min-w-0 max-w-[220px]">
            <div className="flex items-center gap-2 w-full">
              <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground/90 truncate">{user.nombre}</span>
            </div>
            <span className="text-[10px] text-muted-foreground pl-5 uppercase tracking-wider">
              {ROLE_LABELS[user.rol as UserRole]}
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Salir
        </Button>
        <span
          className={
            ENV === "PROD"
              ? "rounded-md bg-accent/15 px-3 py-1 text-xs font-semibold text-accent"
              : "rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
          }
        >
          {ENV}
        </span>
        <div className="hidden sm:flex items-center">
          {isWaking ? (
            <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="text-xs font-medium text-primary">…</span>
            </div>
          ) : apiOnline === null ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" />
              <span className="text-xs text-muted-foreground">...</span>
            </div>
          ) : apiOnline ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5">
              <Wifi className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden xl:inline text-xs font-medium text-emerald-700 dark:text-emerald-300">API Online</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => wakeBackend()}
              className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
              title="Reintentar conexión"
            >
              <WifiOff className="h-4 w-4" />
              <span className="hidden xl:inline">Reintentar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
