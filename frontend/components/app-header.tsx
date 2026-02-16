"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { checkApiHealth } from "@/lib/api";
import { useBackendStatus } from "@/contexts/backend-status-context";
import { Wifi, WifiOff, Boxes, LogOut, User, Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { SYSTEM_NAME, MODULE_LOGICAPTURE, ROLE_LABELS } from "@/lib/constants";
import type { UserRole } from "@/lib/constants";
import { Button } from "@/components/ui/button";

const ENV = process.env.NEXT_PUBLIC_ENV || "DEV";

function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <span className="h-9 w-9" aria-hidden />;
  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      title={isDark ? "Modo claro" : "Modo oscuro"}
      aria-label={isDark ? "Usar modo claro" : "Usar modo oscuro"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function AppHeader() {
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
      <div className="flex min-w-0 items-center gap-4">
        <img
          src="/Logo_Beta.png"
          alt="AgroFlow"
          className="h-[3.5rem] w-auto object-contain"
        />
        <div className="h-8 w-px bg-border" />
        <div className="flex items-center gap-2">
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
        <ThemeToggle />
        {user && (
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground/90">{user.nombre}</span>
            <span className="text-xs text-muted-foreground">
              ({ROLE_LABELS[user.rol as UserRole]})
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
        {/* Estado API */}
        <div className="flex items-center">
          {isWaking ? (
            <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="text-xs font-medium text-primary">Despertando…</span>
            </div>
          ) : apiOnline === null ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" />
              <span className="text-xs text-muted-foreground">Verificando…</span>
            </div>
          ) : apiOnline ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5">
              <Wifi className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">API Online</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => wakeBackend()}
              className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
              title="Reintentar conexión"
            >
              <WifiOff className="h-4 w-4" />
              <span>Reintentar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
