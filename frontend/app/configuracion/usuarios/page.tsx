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
  Edit3,
  ChevronLeft,
  ChevronRight
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

  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("nexo-token") : null;
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/usuarios`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
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

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentUsuarios = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleToggleStatus = async (u: Usuario) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("nexo-token") : null;
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/usuarios/${u.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ activo: !u.activo })
      });

      if (!response.ok) throw new Error("Error al actualizar estado del usuario");
      
      toast.success(`Usuario ${!u.activo ? "habilitado" : "inhabilitado"} correctamente`);
      fetchUsuarios();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-['Outfit']">
      <UsuarioModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUsuarios}
        editingData={editingUser}
      />

      {/* HEADER PREMIUM */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-emerald-950 rounded-2xl flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950/20">
                <ShieldCheck className="h-5 w-5" />
             </div>
             <h1 className="text-3xl font-extrabold tracking-tighter text-emerald-950 font-['Outfit']">
                Seguridad de <span className="text-emerald-500">Usuarios</span>
             </h1>
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-13">
             Gestión de Seguridad, Permisos y Accesos Maestros
          </p>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={fetchUsuarios}
             className="h-12 w-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-100 transition-all shadow-sm active:scale-95 group"
           >
              <RefreshCw className={cn("h-5 w-5 transition-transform group-hover:rotate-180 duration-500", isLoading && "animate-spin")} />
           </button>
           <button 
             onClick={handleCreate}
             className="h-12 px-6 bg-emerald-950 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[11px] flex items-center gap-2 hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-950/20 active:scale-95 border-none"
           >
              <UserPlus className="h-4 w-4" />
              Nuevo Usuario
           </button>
        </div>
      </div>

      {/* STATS & SEARCH */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm items-end transition-all duration-500">
         <div className="lg:col-span-3 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Búsqueda Rápida</label>
            <div className="relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Buscar por Nombre o ID de Usuario..."
                 className="w-full h-11 pl-12 pr-6 bg-slate-50/50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-sm"
                 value={searchTerm}
                 onChange={(e) => {
                   setSearchTerm(e.target.value);
                   setPage(1);
                 }}
               />
            </div>
         </div>
         <div className="bg-emerald-50/30 border border-emerald-100 rounded-[1.5rem] px-6 h-11 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60">Operadores</p>
            <p className="text-xl font-black text-emerald-900">{usuarios.length}</p>
         </div>
      </div>

      {/* TABLE CARLOS STYLE */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-24 flex flex-col items-center justify-center gap-4 text-slate-300 font-['Outfit']">
             <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
             <p className="text-[10px] font-black uppercase tracking-[0.3em]">Autenticando Permisos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-none">
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-none">Identidad Digital</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center border-none">Permisos / Rol</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center border-none">Seguridad</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center border-none">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {currentUsuarios.map((u) => (
                  <tr key={u.id} className="group hover:bg-emerald-50/10 transition-all duration-300 border-none">
                    <td className="px-10 py-7 border-none">
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "h-14 w-14 rounded-[1.2rem] flex items-center justify-center font-black text-lg shadow-sm border-2 transition-all",
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
                    <td className="px-10 py-7 border-none">
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
                    <td className="px-10 py-7 border-none">
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
                    <td className="px-10 py-7 border-none">
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
                               <DropdownMenuItem 
                                 onClick={() => handleToggleStatus(u)}
                                 className="rounded-xl py-3 cursor-pointer text-xs font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                               >
                                  {u.activo ? "Inhabilitar Acceso" : "Habilitar Acceso"}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                       </div>
                    </td>
                  </tr>
                ))}
                {currentUsuarios.length === 0 && (
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

        {!isLoading && totalPages > 1 && (
           <div className="px-10 py-8 border-t border-slate-50 bg-white/50 flex items-center justify-between font-['Outfit']">
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Página</span>
                 <div className="h-10 px-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm">
                   <span className="text-sm font-bold text-emerald-700">{page} <span className="text-slate-300 mx-1">/</span> {totalPages}</span>
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">
                   Mostrando {currentUsuarios.length} de {filtered.length} registros operativos
                 </span>
              </div>

              <div className="flex items-center gap-3">
                 <button 
                   onClick={() => setPage(p => Math.max(1, p - 1))}
                   disabled={page === 1}
                   className="h-12 px-6 bg-white border border-slate-100 rounded-2xl flex items-center gap-2 text-slate-600 font-bold text-xs hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed group"
                 >
                   <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                   Anterior
                 </button>
                 <button 
                   onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                   disabled={page === totalPages}
                   className="h-12 px-8 bg-emerald-950 text-white rounded-2xl flex items-center gap-2 font-bold text-xs hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-950/10 disabled:opacity-30 disabled:cursor-not-allowed group"
                 >
                   Siguiente
                   <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                 </button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
