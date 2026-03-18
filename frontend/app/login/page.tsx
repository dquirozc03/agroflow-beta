"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
      {/* Background Image - Puerto Marítimo Realista Generado con IA */}
      {/* Usamos public/bg-login-generated.png con fallback opcional */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center object-cover pointer-events-none scale-[1.03] transition-transform duration-[20s] ease-out select-none"
        style={{ backgroundImage: "url('/bg-login-generated.png')" }}
      />
      {/* Subtle overlay gradiente radial para que el texto de arriba sea legible sin perder la imagen */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/40 z-0 pointer-events-none mix-blend-multiply" />

      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-8 z-20 flex flex-col md:flex-row justify-between items-start md:items-center pointer-events-none">
        {/* Left Side: Logo */}
        <div className="flex items-center mb-4 md:mb-0">
          <img 
            src="/media__1772547691471.png" 
            alt="AgroFlow" 
            className="h-10 md:h-12 object-contain drop-shadow-md brightness-0 invert" 
            onError={(e) => { e.currentTarget.src = "/Logo_Logueo.png"; }}
          />
        </div>

        {/* Right Side: Navigation Links & Restrict Banner */}
        <div className="flex flex-col items-end gap-3 pointer-events-auto">
          {/* Restrict Banner */}
          <div className="flex items-center gap-2 text-white/90 text-[9px] md:text-[11px] font-semibold tracking-wider bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 shadow-sm">
            <Lock className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span>PLATAFORMA DE ACCESO RESTRINGIDO A PERSONAL AUTORIZADO</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 md:gap-8 text-white font-medium text-xs md:text-sm drop-shadow-md">
            <a href="#" className="hover:text-[#10b981] transition-colors drop-shadow-lg">About</a>
            <a href="#" className="hover:text-[#10b981] transition-colors drop-shadow-lg">Features</a>
            <a href="#" className="hover:text-[#10b981] transition-colors drop-shadow-lg">Blog</a>
            
            <button className="flex items-center gap-1.5 hover:bg-white/20 transition-all px-3 py-1.5 rounded-full border border-white/40 bg-white/10 backdrop-blur-sm shadow-sm">
              Español <span className="text-[10px]">▼</span>
            </button>
          </div>
        </div>
      </div>

      {/* Login Center Card (Glassmorphism) */}
      <div className="relative z-10 w-full max-w-[460px] px-6 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
        <div className="bg-white/85 backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border border-white/60 text-center transition-all">
          
          {/* Logo Central (Full Color) */}
          <div className="flex justify-center mb-6">
            <img 
              src="/media__1772547691471.png" 
              alt="AgroFlow" 
              className="h-14 md:h-16 object-contain" 
              onError={(e) => { e.currentTarget.src = "/Logo_Logueo.png"; }}
            />
          </div>

          {!showChangePassword ? (
            <>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight mb-2">
                ¡Bienvenido a AgroFlow!
              </h2>
              <p className="text-slate-600 text-sm md:text-base font-medium mb-8">
                Cultivando el futuro, juntos
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight mb-2">
                Actualizar Contraseña
              </h2>
              <p className="text-slate-600 text-sm md:text-base font-medium mb-8">
                Por tu seguridad, actualiza tu clave temporal hoy.
              </p>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            {!showChangePassword ? (
              <>
                {/* Email / Usuario Input */}
                <div className="space-y-1.5">
                  <label className="text-slate-700 text-xs font-semibold pl-1.5">Email / Usuario</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#10b981] transition-colors" />
                    <input
                      className="w-full pl-11 pr-4 py-3.5 rounded-full border-2 border-slate-200/80 bg-white/60 focus:bg-white text-slate-800 focus:outline-none focus:border-[#10b981] transition-all shadow-sm placeholder:text-slate-400 font-medium"
                      placeholder="ejemplo@correo.com"
                      type="text"
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Contraseña Input */}
                <div className="space-y-1.5">
                  <label className="text-slate-700 text-xs font-semibold pl-1.5">Contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#10b981] transition-colors" />
                    <input
                      className="w-full pl-11 pr-11 py-3.5 rounded-full border-2 border-slate-200/80 bg-white/60 focus:bg-white text-slate-800 focus:outline-none focus:border-[#10b981] transition-all shadow-sm placeholder:text-slate-400 font-medium"
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
                <div className="flex items-center justify-between px-2 pt-1 pb-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-4 h-4 rounded-[4px] border-2 border-slate-300 group-hover:border-[#10b981] transition-colors bg-white">
                      <input type="checkbox" className="absolute opacity-0 cursor-pointer" />
                    </div>
                    <span className="text-xs text-slate-600 font-semibold group-hover:text-slate-800 transition-colors pt-0.5">Recuérdarme</span>
                  </label>
                  <a href="#" className="text-xs font-bold text-slate-700 hover:text-[#10b981] underline decoration-slate-400 underline-offset-4 transition-colors pt-0.5">
                    Olvidé mi contraseña
                  </a>
                </div>
              </>
            ) : (
              <>
                {/* Nuevas Contraseñas Inputs */}
                <div className="space-y-1.5">
                  <label className="text-slate-700 text-xs font-semibold pl-1.5">Nueva Contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#10b981] transition-colors" />
                    <input
                      className="w-full pl-11 pr-4 py-3.5 rounded-full border-2 border-slate-200/80 bg-white/60 focus:bg-white text-slate-800 focus:outline-none focus:border-[#10b981] transition-all shadow-sm placeholder:text-slate-400 font-medium"
                      placeholder="••••••••"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-700 text-xs font-semibold pl-1.5">Confirmar Contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#10b981] transition-colors" />
                    <input
                      className="w-full pl-11 pr-4 py-3.5 rounded-full border-2 border-slate-200/80 bg-white/60 focus:bg-white text-slate-800 focus:outline-none focus:border-[#10b981] transition-all shadow-sm placeholder:text-slate-400 font-medium"
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
              <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-[13px] font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Principal Button */}
            <button
              className="w-full mt-2 py-4 rounded-full font-bold text-white shadow-lg shadow-[#10b981]/25 transition-all transform hover:scale-[1.015] active:scale-[0.98] bg-gradient-to-r from-[#0ea5e9] to-[#10b981] relative overflow-hidden flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-[#10b981]/40"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-base tracking-wide drop-shadow-sm">
                    {showChangePassword ? "Actualizar Contraseña" : "Iniciar Sesión"}
                  </span>
                  {!showChangePassword && (
                    <Leaf className="w-4 h-4 ml-1 opacity-80 group-hover:opacity-100 group-hover:-rotate-12 transition-all drop-shadow-sm" />
                  )}
                </>
              )}
            </button>
          </form>

          {!showChangePassword ? (
            <>
              {/* Login con terceros separador */}
              <div className="relative flex items-center my-7">
                <div className="flex-grow border-t border-slate-300"></div>
                <span className="flex-shrink-0 mx-4 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  O inicia sesión con
                </span>
                <div className="flex-grow border-t border-slate-300"></div>
              </div>

              {/* Botones Sociales */}
              <div className="flex items-center justify-center flex-wrap gap-4 mb-8">
                {/* Google Button */}
                <button type="button" className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 hover:scale-[1.05] transition-all cursor-pointer">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </button>

                {/* Microsoft Button */}
                <button type="button" className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 hover:scale-[1.05] transition-all cursor-pointer">
                  <svg viewBox="0 0 21 21" width="20" height="20">
                    <path fill="#f35325" d="M1 1h9v9H1z"/>
                    <path fill="#81bc06" d="M11 1h9v9h-9z"/>
                    <path fill="#05a6f0" d="M1 11h9v9H1z"/>
                    <path fill="#ffba08" d="M11 11h9v9h-9z"/>
                  </svg>
                </button>

                {/* Agriculture Association Button */}
                <button type="button" className="flex items-center justify-center px-4 h-12 rounded-full bg-white shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 hover:scale-[1.05] transition-all cursor-pointer gap-2">
                  <Leaf className="text-[#10b981] w-4 h-4" />
                  <span className="text-[11px] font-bold text-slate-700 leading-tight text-left">
                    Agriculture<br/>Association
                  </span>
                </button>
              </div>

              {/* Botón Inferior: Crear cuenta y Ayuda */}
              <div className="flex flex-col gap-3 font-semibold text-sm">
                <a href="#" className="text-slate-700 hover:text-[#10b981] transition-colors">
                  Crear una cuenta nueva
                </a>
                <a href="#" className="text-slate-500 hover:text-slate-800 transition-colors text-xs">
                  Ayuda
                </a>
              </div>
            </>
          ) : (
            <div className="mt-6 pt-6 border-t border-slate-200">
               <button
                  type="button"
                  onClick={handleGoBack}
                  className="w-full text-slate-500 text-sm font-semibold flex items-center justify-center gap-1.5 hover:text-slate-800 transition-colors"
               >
                  <ArrowLeft className="h-4 w-4" />
                  Regresar al inicio de sesión
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
