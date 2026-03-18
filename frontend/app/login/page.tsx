"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { apiUpdateOwnPassword } from "@/lib/api";
import { toast } from "sonner";
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  ArrowLeft,
  Leaf
} from "lucide-react";

export default function LoginPage() {
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
      <div className="flex flex-col min-h-screen items-center justify-center bg-[#08110a]">
        <div className="h-12 w-12 rounded-full border-4 border-[#13ec5b]/20 border-t-[#13ec5b] animate-spin mb-4" />
        <p className="text-sm font-medium text-[#13ec5b] animate-pulse uppercase tracking-widest">Verificando sesión...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-display relative flex flex-col justify-center items-center overflow-hidden bg-slate-100">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <Image 
          src="/Fondo_Login.png"
          alt="Login Background"
          fill
          priority
          quality={100}
          className="object-cover transition-transform duration-[20s] ease-out scale-[1.03]"
        />
      </div>
      {/* Subtle overlay gradiente radial para que el texto de arriba sea legible sin perder la imagen */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/40 z-0 pointer-events-none mix-blend-multiply" />

      {/* Absolute Bottom Footer - OS Style Lock Screen */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:px-8 md:py-5 z-20 flex flex-col md:flex-row justify-between items-center pointer-events-none bg-gradient-to-t from-black/60 to-transparent">
        
        {/* Left: Restricted Banner */}
        <div className="flex items-center pointer-events-auto mb-2 md:mb-0 opacity-80 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2 text-white/80 text-[9px] md:text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 rounded-md border border-white/10 bg-black/20 backdrop-blur-sm">
            <Lock className="w-3 h-3 text-[#13ec5b]" />
            <span>Plataforma de acceso restringido</span>
          </div>
        </div>

        {/* Right: Status & Version */}
        <div className="flex items-center gap-4 text-white/70 font-medium text-[10px] uppercase tracking-widest pointer-events-auto">
          <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-md border border-white/10" title="Todos los servicios en línea">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#13ec5b] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#13ec5b]"></span>
            </span>
            <span>Sistemas Operativos</span>
          </div>
          
          <div className="hidden md:block w-px h-4 bg-white/20"></div>
          
          <span className="font-mono text-[10px] bg-white/10 px-2 py-1 rounded text-white/60 hidden md:block border border-white/10">v1.0 BETA</span>
        </div>
      </div>

      {/* Login Center Card (Glassmorphism) - Reduced spacing to fit smaller screens perfectly */}
      <div className="relative z-10 w-full max-w-[420px] px-4 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
        <div className="bg-white/85 backdrop-blur-2xl p-6 md:px-8 md:py-8 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border border-white/60 text-center transition-all">
          
          {/* Logo Central (Full Color, transparente sin fondo blanco) */}
          <div className="flex justify-center h-16 md:h-20 mb-3 mt-2 relative">
            {/* Usamos scale() para ampliar el logo sin que su canvas transparente empuje la tarjeta hacia abajo */}
            <img 
              src="/Logo_AgroFlow.png" 
              alt="AgroFlow" 
              className="h-full w-auto object-contain drop-shadow-md scale-[1.8] md:scale-[2] origin-center hover:scale-[2.05] transition-transform duration-500" 
              onError={(e) => { e.currentTarget.src = "/Logo_Logueo.png"; }}
            />
          </div>

          {!showChangePassword ? (
            <>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight mb-1">
                ¡Bienvenido a AgroFlow!
              </h2>
              <p className="text-slate-500 text-xs md:text-sm font-medium mb-5">
                Cultivando el futuro, juntos
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight mb-1">
                Actualizar Contraseña
              </h2>
              <p className="text-slate-500 text-xs md:text-sm font-medium mb-5">
                Por tu seguridad, actualiza tu clave temporal hoy.
              </p>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
            {!showChangePassword ? (
              <>
                {/* Email / Usuario Input */}
                <div className="space-y-1">
                  <label className="text-slate-700 text-[11px] font-semibold pl-1.5">Identificador de Usuario</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#10b981] transition-colors" />
                    <input
                      className="w-full pl-10 pr-4 py-3 rounded-full border border-slate-200/80 bg-white/60 focus:bg-white text-slate-800 focus:outline-none focus:border-[#10b981] transition-all shadow-sm placeholder:text-slate-400 font-medium text-sm"
                      placeholder="Ingresa tu ID corporativo"
                      type="text"
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Contraseña Input */}
                <div className="space-y-1">
                  <label className="text-slate-700 text-[11px] font-semibold pl-1.5">Contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#10b981] transition-colors" />
                    <input
                      className="w-full pl-10 pr-10 py-3 rounded-full border border-slate-200/80 bg-white/60 focus:bg-white text-slate-800 focus:outline-none focus:border-[#10b981] transition-all shadow-sm placeholder:text-slate-400 font-medium text-sm"
                      placeholder="••••••••"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors p-1"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Extras de Login */}
                <div className="flex items-center px-1 pt-0.5 pb-1">
                  <label className="flex items-center gap-1.5 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-3.5 h-3.5 rounded border border-slate-300 group-hover:border-[#10b981] transition-colors bg-white">
                      <input type="checkbox" className="absolute opacity-0 cursor-pointer" />
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold group-hover:text-slate-800 transition-colors">Mantener sesión activa</span>
                  </label>
                </div>
              </>
            ) : (
              <>
                {/* Nuevas Contraseñas Inputs */}
                <div className="space-y-1">
                  <label className="text-slate-700 text-[11px] font-semibold pl-1.5">Nueva Contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#10b981] transition-colors" />
                    <input
                      className="w-full pl-10 pr-4 py-3 rounded-full border border-slate-200/80 bg-white/60 focus:bg-white text-slate-800 focus:outline-none focus:border-[#10b981] transition-all shadow-sm placeholder:text-slate-400 font-medium text-sm"
                      placeholder="••••••••"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 text-[11px] font-semibold pl-1.5">Confirmar Contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#10b981] transition-colors" />
                    <input
                      className="w-full pl-10 pr-4 py-3 rounded-full border border-slate-200/80 bg-white/60 focus:bg-white text-slate-800 focus:outline-none focus:border-[#10b981] transition-all shadow-sm placeholder:text-slate-400 font-medium text-sm"
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

            {/* Alertas de Error */}
            {error && (
              <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Principal Button */}
            <button
              className="w-full mt-1 py-3 rounded-full font-bold text-white shadow-md shadow-[#10b981]/25 transition-all transform hover:scale-[1.015] active:scale-[0.98] bg-gradient-to-r from-[#0ea5e9] to-[#10b981] relative overflow-hidden flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#10b981]/40"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-sm tracking-wide drop-shadow-sm">
                    {showChangePassword ? "Actualizar Contraseña" : "Iniciar Sesión"}
                  </span>
                  {!showChangePassword && (
                    <Leaf className="w-3.5 h-3.5 ml-1 opacity-80 group-hover:opacity-100 group-hover:-rotate-12 transition-all drop-shadow-sm" />
                  )}
                </>
              )}
            </button>
          </form>

          {!showChangePassword ? (
            <div className="mt-8 pt-5 border-t border-slate-200/60 w-full flex justify-center">
              <a href="#" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#10b981] transition-all text-[11px] font-bold tracking-widest uppercase">
                <AlertCircle className="w-3.5 h-3.5" />
                Contactar a Soporte TI
              </a>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-slate-200">
               <button
                  type="button"
                  onClick={handleGoBack}
                  className="w-full text-slate-500 text-xs font-semibold flex items-center justify-center gap-1.5 hover:text-slate-800 transition-colors"
               >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Regresar al inicio de sesión
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
