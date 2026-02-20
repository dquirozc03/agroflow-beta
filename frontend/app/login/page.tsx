"use client";

import { useState, useEffect, memo } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ArrowRight, CircleAlert } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { SYSTEM_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { TruckLoader } from "@/components/truck-loader";

// Memoized background to prevent re-renders on input
const AuthBackground = memo(() => (
  <div className="absolute inset-0 z-0 pointer-events-none">
    <img
      src="/Logo_Logueo.png"
      alt="Background"
      className="h-full w-full object-cover opacity-100 transition-transform duration-[30s]"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent dark:from-black/70 dark:via-black/40" />
  </div>
));
AuthBackground.displayName = "AuthBackground";

// Memoized header
const AuthHeader = memo(() => (
  <div className="absolute left-0 right-0 top-0 z-20 flex justify-between p-6 pt-safe-top">
    <div />
    <div className="rounded-full bg-white/20 p-1 backdrop-blur-md dark:bg-black/20">
      <ThemeToggle />
    </div>
  </div>
));
AuthHeader.displayName = "AuthHeader";

function LoginForm() {
  const router = useRouter();
  const { user, isLoading: authLoading, login } = useAuth();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      router.replace("/");
      router.refresh();
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario || !password) {
      setError("Por favor complete todos los campos");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // Small artificial delay for visual polish (trailer animation)
      await new Promise(r => setTimeout(r, 1500));

      const result = await login(usuario, password);
      if (result.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(result.error ?? "Error al iniciar sesión");
      }
    } finally {
      if (router) { // Check if still mounted
        setLoading(false);
      }
    }
  };

  if (authLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 font-sans selection:bg-primary/30 dark:bg-slate-950">

      <AuthBackground />
      <AuthHeader />

      {/* MAIN CONTENT - GLASS CARD */}
      <div className="relative z-10 w-full max-w-[400px] px-4 py-8 animate-in fade-in zoom-in-95 duration-700">

        {/* Card Container */}
        <div className="group overflow-hidden rounded-3xl border border-white/40 bg-white/60 p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/50 transition-all dark:border-white/10 dark:bg-black/50 dark:ring-white/10">

          {/* Header Section */}
          <div className="mb-8 text-center">
            <h1 className="bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent drop-shadow-sm dark:from-white dark:to-slate-300">
              {SYSTEM_NAME}
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">
              Área Comercial y Exportaciones
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="usuario" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Usuario
              </Label>
              <div className="relative group/input">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within/input:text-primary" />
                <Input
                  id="usuario"
                  type="text"
                  placeholder="ID de usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="h-12 border-slate-300/60 bg-white/50 pl-11 text-slate-800 placeholder:text-slate-400 transition-all focus:border-primary/50 focus:bg-white focus:ring-primary/20 dark:border-slate-700 dark:bg-black/20 dark:text-white dark:placeholder:text-slate-600 dark:focus:bg-black/40"
                  autoComplete="username"
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Contraseña
              </Label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within/input:text-primary" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 border-slate-300/60 bg-white/50 pl-11 text-slate-800 placeholder:text-slate-400 transition-all focus:border-primary/50 focus:bg-white focus:ring-primary/20 dark:border-slate-700 dark:bg-black/20 dark:text-white dark:placeholder:text-slate-600 dark:focus:bg-black/40"
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-50/50 px-4 py-3 text-red-600 shadow-sm backdrop-blur-md animate-in slide-in-from-top-2 dark:bg-red-900/20 dark:text-red-300">
                <CircleAlert className="h-5 w-5 shrink-0" />
                <p className="text-xs font-medium">{error}</p>
              </div>
            )}

            <div className="pt-2 min-h-[50px]">
              {loading ? (
                <TruckLoader />
              ) : (
                <Button
                  type="submit"
                  className="group relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary/80 text-base font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
                  size="lg"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Iniciar Sesión
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                  {/* Shiny effect on hover */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </Button>
              )}
            </div>
          </form>

          {/* Footer links inside card */}
          <div className="mt-8 flex flex-col items-center gap-4 border-t border-slate-200/50 pt-6 text-center dark:border-white/10">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ¿Problemas para acceder? <span className="cursor-pointer font-medium text-slate-600 transition-colors hover:text-primary hover:underline dark:text-slate-300">Contactar Soporte</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}
