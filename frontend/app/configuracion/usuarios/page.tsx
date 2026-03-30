"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Search, 
  UserPlus, 
  RefreshCw, 
  Loader2,
  Lock,
  Unlock,
  Settings2,
  MoreVertical,
  Activity,
  ShieldAlert,
  Edit3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";
import { UsuarioModal } from "@/components/usuario-modal";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface Usuario {
  id: number;
  usuario: string;
  nombre: string;
  rol: string;
  activo: boolean;
  bloqueado: boolean;
  requiere_cambio_password: boolean;
  permisos: any;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/usuarios`);
      if (!response.ok) {
        throw new Error(`Acceso denegado o error de red (${response.status})`);
      }
      const data = await response.json();
      setUsuarios(data);
    } catch (error: any) {
      console.error("Error al cargar usuarios:", error);
      toast.error(error.message || "Error al cargar listado de usuarios.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (u: Usuario) => {
    setEditingUser(u);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const filtered = usuarios.filter(u => 
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.usuario.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-['Outfit']">
      <UsuarioModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUsuarios}
        editingData={editingUser}
      />

      {/* HEADER PREMIUM */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <ShieldCheck className="h-8 w-8 text-emerald-600" />
             <h1 className="text-4xl font-extrabold tracking-tighter text-[#022c22] uppercase">
                Administración de Usuarios
             </h1>
          </div>
          <p className="text-sm text-slate-500 font-medium tracking-tight uppercase tracking-widest pl-11">
             Gestión de Seguridad, Permisos y Accesos Maestros.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={fetchUsuarios}
             className="h-12 w-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-100 transition-all shadow-sm group"
           >
              <RefreshCw className={cn("h-5 w-5 transition-transform group-hover:rotate-180 duration-500", isLoading && "animate-spin")} />
           </button>
           <button 
             onClick={handleCreate}
             className="h-12 px-8 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 hover:bg-[#022c22] transition-all shadow-xl shadow-emerald-500/20 active:scale-95">
              <UserPlus className="h-4 w-4" />
              Nuevo Usuario
           </button>
        </div>
      </div>

      {/* STATS & SEARCH */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="lg:col-span-3 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por Nombre o ID de Usuario..."
              className="w-full h-14 pl-14 pr-6 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/50 transition-all shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="bg-white border border-slate-100 rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm">
            <div className="flex flex-col">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Usuarios Registrados</p>
              <p className="text-3xl font-black text-[#022c22] leading-none mt-1">{usuarios.length}</p>
            </div>
            <Activity className="h-8 w-8 text-emerald-500/20" />
         </div>
      </div>

      {/* TABLE CARLOS STYLE */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-24 flex flex-col items-center justify-center gap-4 text-slate-300">
             <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
             <p className="text-[10px] font-black uppercase tracking-[0.3em]">Autenticando Permisos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Identidad Digital</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Permisos / Rol</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Seguridad</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {filtered.map((u) => (
                  <tr key={u.id} className="group hover:bg-slate-50/30 transition-all duration-300">
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "h-14 w-14 rounded-[1.2rem] flex items-center justify-center font-black text-lg shadow-sm border-2",
                          u.activo ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-slate-50 border-slate-100 text-slate-300"
                        )}>
                          {u.nombre?.[0] || "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">{u.nombre}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">@{u.usuario}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex flex-col items-center gap-2">
                         <div className={cn(
                           "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                           u.rol === "ADMIN" ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-500"
                         )}>
                            {u.rol}
                         </div>
                         <div className="flex gap-1">
                            {["logicapture", "maestros", "operaciones", "sistema"].map(mod => (
                               <div 
                                 key={mod} 
                                 title={mod.toUpperCase()}
                                 className={cn(
                                   "h-1.5 w-1.5 rounded-full",
                                   u.permisos?.[mod] ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-slate-200"
                                 )} 
                               />
                            ))}
                         </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex flex-col items-center gap-1.5">
                         {u.bloqueado ? (
                           <div className="flex items-center gap-1.5 text-rose-600">
                              <Lock className="h-3 w-3" />
                              <span className="text-[9px] font-black uppercase tracking-tight">CUENTA BLOQUEADA</span>
                           </div>
                         ) : u.activo ? (
                           <div className="flex items-center gap-1.5 text-emerald-600">
                              <Unlock className="h-3 w-3" />
                              <span className="text-[9px] font-black uppercase tracking-tight">ACCESO ACTIVO</span>
                           </div>
                         ) : (
                           <div className="flex items-center gap-1.5 text-slate-400">
                              <ShieldAlert className="h-3 w-3" />
                              <span className="text-[9px] font-black uppercase tracking-tight">DESACTIVADO</span>
                           </div>
                         )}

                         {u.requiere_cambio_password && (
                           <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest italic animate-pulse">Pendiente Reset Password</span>
                         )}
                      </div>
                    </td>
                    <td className="px-10 py-7">
                       <div className="flex justify-center items-center gap-2">
                          <button 
                            onClick={() => handleEdit(u)}
                            className="h-11 w-11 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-500 shadow-sm grow-hover hover:scale-110 active:scale-95"
                          >
                             <Settings2 className="h-4 w-4" />
                          </button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                               <button className="h-11 w-11 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                                 <MoreVertical className="h-4 w-4" />
                               </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-slate-100 shadow-2xl p-2 font-['Outfit']">
                               <p className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Acciones Rápidas</p>
                               <DropdownMenuSeparator />
                               <DropdownMenuItem onClick={() => handleEdit(u)} className="rounded-xl py-3 cursor-pointer text-xs font-bold text-slate-600 focus:bg-emerald-50 focus:text-emerald-700">
                                  <Edit3 className="h-4 w-4 mr-3 opacity-50" />
                                  Editar Perfil
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => handleEdit(u)} className="rounded-xl py-3 cursor-pointer text-xs font-bold text-slate-600 focus:bg-emerald-50 focus:text-emerald-700">
                                  <Lock className="h-4 w-4 mr-3 opacity-50" />
                                  Seguridad y Pasword
                               </DropdownMenuItem>
                               <DropdownMenuSeparator />
                               <DropdownMenuItem className="rounded-xl py-3 cursor-pointer text-xs font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-700">
                                  {u.activo ? "Inhabilitar Acceso" : "Habilitar Acceso"}
                               </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                       </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-10 py-32 text-center">
                       <p className="text-sm font-black text-slate-200 uppercase tracking-[0.4em] italic">No se encontraros operadores en el radar.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
