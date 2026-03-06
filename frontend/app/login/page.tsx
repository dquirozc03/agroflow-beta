"use client";

import { useState, useEffect, memo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiUpdateOwnPassword } from "@/lib/api";
import { toast } from "sonner";

// Background Component following the new design
const NewAuthBackground = memo(() => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
    <div className="bg-dynamic" />
    {/* Background Overlay for Depth */}
    <div className="absolute inset-0 bg-gradient-to-tr from-[#08110a] via-[#08110a]/80 to-transparent"></div>
    <div className="absolute inset-0 animated-overlay"></div>

    {/* Header / Logo Area */}
    <div className="absolute top-8 left-8 z-10">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-[#13ec5b]/20 rounded-lg flex items-center justify-center border border-[#13ec5b]/30">
          <img
            alt="Logo"
            className="w-8 h-8 object-contain"
            src="/Logo_Beta.png"
          />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg leading-none">BETA</h2>
          <p className="text-[#13ec5b] text-xs font-medium tracking-widest uppercase">Agroindustrial</p>
        </div>
      </div>
    </div>
  </div>
));
NewAuthBackground.displayName = "NewAuthBackground";


function LoginForm() {
  const router = useRouter();
  const { user, isLoading: authLoading, login, logout } = useAuth();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      if (user.requiere_cambio_password) {
        setShowChangePassword(true);
        return;
      }
      router.replace("/");
      router.refresh();
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showChangePassword) {
      handleUpdatePassword();
      return;
    }
    if (!usuario || !password) {
      setError("Por favor complete todos los campos");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await login(usuario, password);
      if (result.ok) {
        // Redirection handled by useEffect
      } else {
        setError(result.error ?? "Error al iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Complete los campos de contraseña");
      return;
    }
    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await apiUpdateOwnPassword({
        password_actual: password,
        nueva_password: newPassword
      });
      toast.success("Contraseña actualizada correctamente");
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Error al actualizar contraseña");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    logout();
    setShowChangePassword(false);
    setUsuario("");
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  };

  if (authLoading || (user && !user.requiere_cambio_password)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08110a]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-[#13ec5b]/20 border-t-[#13ec5b] animate-spin" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-display bg-[#f6f8f6] dark:bg-[#08110a] h-screen overflow-hidden relative flex flex-col justify-center items-center">
      <NewAuthBackground />

      {/* Main Content Container */}
      <div className="relative z-20 w-full max-w-[1200px] px-6 py-12 flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Branding/Slogan Section */}
        <div className="flex-1 text-center lg:text-left transition-all duration-700 animate-in fade-in slide-in-from-left-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#13ec5b]/10 border border-[#13ec5b]/20 mb-6">
            <span className="material-symbols-outlined notranslate text-[#13ec5b] text-sm">auto_awesome</span>
            <span className="text-xs font-black uppercase tracking-[0.2em] hero-gradient">AgroFlow</span>
          </div>
          <h1 className="text-white tracking-tight text-5xl lg:text-7xl font-bold leading-[1.1] mb-6">
            Optimizando <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#13ec5b] to-[#a855f7]">Nuestro Futuro.</span>
          </h1>
          <p className="text-slate-300 text-lg lg:text-xl font-normal max-w-lg mx-auto lg:mx-0 leading-relaxed">
            Plataforma de gestión avanzada para el crecimiento sostenible y la excelencia operacional.
          </p>
          <div className="mt-10 hidden lg:grid grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <span className="material-symbols-outlined notranslate text-[#a855f7] text-3xl">precision_manufacturing</span>
              <span className="text-white font-medium">Ops Inteligentes</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="material-symbols-outlined notranslate text-[#a855f7] text-3xl">analytics</span>
              <span className="text-white font-medium">Datos en Tiempo Real</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="material-symbols-outlined notranslate text-[#a855f7] text-3xl">eco</span>
              <span className="text-white font-medium">Sostenibilidad</span>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-[440px] transition-all duration-700 animate-in fade-in slide-in-from-right-8 delay-300">
          <div className="glass-panel p-8 lg:p-10 rounded-3xl shadow-2xl">
            <div className="mb-8">
              <h3 className="text-white text-2xl font-bold mb-2 tracking-tight">
                {showChangePassword ? "Actualizar Contraseña" : "Bienvenido de nuevo"}
              </h3>
              <p className="text-slate-400 text-sm">
                {showChangePassword
                  ? "Para tu seguridad, debes cambiar tu clave temporal."
                  : "Por favor, ingresa tus credenciales para acceder al ERP"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!showChangePassword ? (
                <>
                  <div className="space-y-2">
                    <label className="text-slate-200 text-[11px] font-black uppercase tracking-[0.15em] px-1">USUARIO</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined notranslate absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#13ec5b] transition-colors">person</span>
                      <input
                        className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#08110a]/50 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#13ec5b]/40 focus:border-[#13ec5b]/50 transition-all"
                        placeholder="Ingresa tu usuario"
                        type="text"
                        value={usuario}
                        onChange={(e) => setUsuario(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-slate-200 text-[11px] font-black uppercase tracking-[0.15em] px-1">CONTRASEÑA</label>
                    </div>
                    <div className="relative group">
                      <span className="material-symbols-outlined notranslate absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#13ec5b] transition-colors">lock</span>
                      <input
                        className="w-full pl-12 pr-12 py-4 rounded-xl bg-[#08110a]/50 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#13ec5b]/40 focus:border-[#13ec5b]/50 transition-all"
                        placeholder="••••••••"
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="material-symbols-outlined notranslate absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 cursor-pointer hover:text-white transition-colors"
                      >
                        {showPass ? "visibility_off" : "visibility"}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-slate-200 text-[11px] font-black uppercase tracking-[0.15em] px-1">NUEVA CONTRASEÑA</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined notranslate absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#13ec5b] transition-colors">lock</span>
                      <input
                        className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#08110a]/50 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#13ec5b]/40 focus:border-[#13ec5b]/50 transition-all"
                        placeholder="••••••••"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-200 text-[11px] font-black uppercase tracking-[0.15em] px-1">CONFIRMAR CONTRASEÑA</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined notranslate absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#13ec5b] transition-colors">lock</span>
                      <input
                        className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#08110a]/50 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#13ec5b]/40 focus:border-[#13ec5b]/50 transition-all"
                        placeholder="••••••••"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-pulse">
                  <span className="material-symbols-outlined notranslate text-sm">error</span>
                  {error}
                </div>
              )}

              <div className="pt-2"></div>


              <button
                className="w-full bg-[#13ec5b] hover:bg-[#13ec5b]/90 text-[#08110a] font-bold py-4 rounded-xl shadow-lg shadow-[#13ec5b]/20 transition-all flex items-center justify-center gap-2 group glow-button disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-[#08110a]/30 border-t-[#08110a] rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{showChangePassword ? "Actualizar y Continuar" : "Ingresar al Tablero"}</span>
                    <span className="material-symbols-outlined notranslate text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-white/5 text-center">
              {showChangePassword && (
                <button
                  onClick={handleGoBack}
                  className="text-slate-400 text-sm flex items-center justify-center gap-1 mx-auto hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined notranslate text-sm">arrow_back</span>
                  Regresar al inicio
                </button>
              )}
            </div>
          </div>

          {/* Subtle Footer info */}
          <div className="mt-6 flex justify-between items-center px-4">
            <p className="text-slate-500 text-[10px] uppercase tracking-tighter">© 2026 BETA S.A.C.</p>
            <div className="flex gap-4">
              <a
                href="mailto:comercial.olmos2@beta.com.pe"
                className="text-slate-500 text-[10px] uppercase hover:text-white transition-colors"
              >
                SOPORTE
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function LoginPage() {
  return <LoginForm />;
}
