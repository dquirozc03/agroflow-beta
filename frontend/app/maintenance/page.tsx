import { HardHat, ServerCog } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
        
        {/* Icono animado */}
        <div className="mx-auto w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 relative">
          <ServerCog className="w-12 h-12 text-emerald-600 animate-pulse" />
          <div className="absolute -bottom-2 -right-2 bg-amber-100 p-2 rounded-full border-4 border-white shadow-sm">
            <HardHat className="w-6 h-6 text-amber-600" />
          </div>
        </div>

        {/* Titulos */}
        <h1 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">
          Mantenimiento<br/>Programado
        </h1>
        
        <p className="text-slate-500 mb-8 font-medium leading-relaxed">
          Agroflow se encuentra temporalmente fuera de servicio. Estamos realizando nuestra migración oficial a los servidores de AWS para brindarte una plataforma más rápida y segura.
        </p>

        {/* Barra de progreso visual */}
        <div className="bg-slate-100 rounded-full h-3 w-full mb-2 overflow-hidden relative">
          <div className="bg-emerald-500 h-full w-1/2 rounded-full absolute top-0 left-0 animate-[pulse_2s_ease-in-out_infinite]"></div>
        </div>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Migrando datos...</p>
        
      </div>
    </div>
  );
}
