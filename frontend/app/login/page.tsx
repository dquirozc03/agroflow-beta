"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Loader2, ArrowRight, CircleAlert, RotateCw } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { SYSTEM_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    setError("");
    setLoading(true);
    try {
      const result = await login(usuario, password);
      if (result.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(result.error ?? "Error al iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || user) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      </div>
    );
  }

  return (
    <div className="flex min-h-svh">
      {/* Panel izquierdo: solo imagen de fondo, sin texto */}
      <div
        className="relative hidden min-h-svh flex-[1.15] md:flex"
        style={{
          backgroundImage: "url('/Fondo_Login.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/25" aria-hidden />
      </div>

      {/* Panel derecho: formulario de login */}
      <div className="relative flex flex-[0.85] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 px-8 py-12 md:px-16">
        <div className="absolute -left-24 -top-24 h-48 w-48 rounded-full bg-primary/5 blur-2xl" aria-hidden />
        <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-slate-200/40 blur-3xl" aria-hidden />

        {/* Esquina: AgroFlow + Recargar */}
        <div className="absolute right-6 top-6 flex items-center gap-3">
          <span className="rounded-lg border border-slate-200/80 bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-700 backdrop-blur-sm">
            {SYSTEM_NAME}
          </span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg p-2 text-slate-400 transition-all hover:bg-white/80 hover:text-slate-600"
            title="Recargar"
            aria-label="Recargar"
          >
            <RotateCw className="h-5 w-5" />
          </button>
        </div>

        <div className="relative w-full max-w-[400px]">
          {/* Texto descriptivo arriba del login */}
          <div className="mb-6 rounded-2xl border border-slate-200/60 bg-white/80 px-6 py-4 shadow-lg shadow-slate-200/30 backdrop-blur-sm">
            <h2 className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-lg font-bold tracking-tight text-transparent">
              Área comercial y exportaciones
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Accede con tu usuario y contraseña para gestionar registros operativos, bandeja SAP e historial.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white px-8 py-10 shadow-xl shadow-slate-200/40 ring-1 ring-white/80">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Iniciar sesión</h1>
            <p className="mt-2 text-sm text-slate-500">Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="usuario" className="text-sm font-medium text-slate-700">
                Usuario
              </Label>
              <div className="relative overflow-hidden rounded-xl">
                <User className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="usuario"
                  type="text"
                  placeholder="usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="h-12 border-slate-200 bg-slate-50/50 pl-11 text-base transition-colors focus:bg-white"
                  autoComplete="username"
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Contraseña
              </Label>
              <div className="relative overflow-hidden rounded-xl">
                <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 border-slate-200 bg-slate-50/50 pl-11 text-base transition-colors focus:bg-white"
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </div>
            {error && (
              <div
                className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-amber-50/80 px-4 py-3 shadow-sm"
                role="alert"
              >
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <p className="text-sm text-amber-900">{error}</p>
              </div>
            )}
            <Button
              type="submit"
              className="h-12 w-full rounded-xl bg-gradient-to-b from-[#7CC546] to-[#6BB83A] text-base font-semibold text-white shadow-lg shadow-[#7CC546]/30 transition-all hover:from-[#6BB83A] hover:to-[#5CA830] hover:shadow-xl hover:shadow-[#7CC546]/35 disabled:opacity-70"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verificando…
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            ¿Olvidaste tu contraseña? Contacta al administrador.
          </p>
          <p className="mt-3 text-center text-xs text-slate-400">©2026 Nexora Technologies</p>
        </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}
