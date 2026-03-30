"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Search, 
  Plus, 
  RefreshCw, 
  Loader2,
  Settings2,
  Trash2,
  Save,
  Scan,
  Truck,
  FileBarChart,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface Rol {
  id: number;
  nombre_rol: string;
  descripcion: string;
  permisos_plantilla: any;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRol, setEditingRol] = useState<any>(null);
  const [formData, setFormData] = useState({
    nombre_rol: "",
    descripcion: "",
    permisos_plantilla: {
      logicapture: true,
      maestros: false,
      operaciones: false,
      sistema: false
    }
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/roles`);
      if (response.ok) {
        setRoles(await response.json());
      }
    } catch (error) {
      toast.error("Error al cargar roles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (r: Rol) => {
    setEditingRol(r);
    setFormData({
      nombre_rol: r.nombre_rol,
      descripcion: r.descripcion || "",
      permisos_plantilla: r.permisos_plantilla
    });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingRol(null);
    setFormData({
      nombre_rol: "",
      descripcion: "",
      permisos_plantilla: {
        logicapture: true,
        maestros: false,
        operaciones: false,
        sistema: false
      }
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRol 
        ? `${API_BASE_URL}/api/v1/auth/roles/${editingRol.id}`
        : `${API_BASE_URL}/api/v1/auth/roles`;
      
      const response = await fetch(url, {
        method: editingRol ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingRol ? "Rol actualizado" : "Rol creado con éxito");
        fetchRoles();
        setIsModalOpen(false);
      } else {
        const err = await response.json();
        toast.error(err.detail || "Error al procesar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-['Outfit']">
      
      {/* MODAL DE EDICIÓN/CREACIÓN */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
         <DialogContent className="max-w-xl bg-white border-0 shadow-2xl rounded-[2.5rem] overflow-hidden p-0">
            <div className="h-2 bg-indigo-500" />
            <DialogHeader className="px-10 pt-10 pb-4">
               <DialogTitle className="text-3xl font-black text-[#022c22] uppercase tracking-tighter">
                  {editingRol ? "Modificar Rol Maestro" : "Nuevo Perfil Operativo"}
               </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="px-10 pb-10 space-y-6">
               <div className="space-y-4">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identificador del Rol</Label>
                     <Input 
                        className="h-14 bg-slate-50 border-slate-100 rounded-2xl font-bold uppercase focus:ring-indigo-500/20" 
                        value={formData.nombre_rol}
                        onChange={e => setFormData({...formData, nombre_rol: e.target.value.toUpperCase()})}
                        placeholder="EJ: SUPERVISOR_PLANTA"
                        required
                     />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción Funcional</Label>
                     <Input 
                        className="h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-indigo-500/20" 
                        value={formData.descripcion}
                        onChange={e => setFormData({...formData, descripcion: e.target.value})}
                        placeholder="EJ: Acceso a reportes y validación de campo."
                     />
                  </div>
               </div>

               <div className="space-y-4 border-t border-slate-100 pt-6">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Plantilla de Permisos por Defecto</Label>
                  
                  <div className="grid grid-cols-1 gap-3">
                     {[
                        { id: 'logicapture', label: 'LogiCapture', icon: Scan },
                        { id: 'maestros', label: 'Maestros', icon: Truck },
                        { id: 'operaciones', label: 'Operaciones', icon: FileBarChart },
                        { id: 'sistema', label: 'Sistema (Admin)', icon: Shield, color: 'rose' }
                     ].map(mod => (
                        <div key={mod.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <div className="flex items-center gap-3">
                              <mod.icon className={cn("h-5 w-5", mod.color === 'rose' ? 'text-rose-500' : 'text-indigo-500')} />
                              <span className="text-xs font-bold text-slate-700 uppercase">{mod.label}</span>
                           </div>
                           <Switch 
                              checked={(formData.permisos_plantilla as any)[mod.id]}
                              onCheckedChange={v => setFormData({
                                 ...formData, 
                                 permisos_plantilla: { ...formData.permisos_plantilla, [mod.id]: v }
                              })}
                           />
                        </div>
                     ))}
                  </div>
               </div>

               <Button type="submit" className="w-full h-14 bg-indigo-600 hover:bg-[#022c22] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-900/20 transition-all">
                  <Save className="h-5 w-5 mr-3" />
                  {editingRol ? "Guardar Cambios Maestros" : "Crear Rol en el Radar"}
               </Button>
            </form>
         </DialogContent>
      </Dialog>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <ShieldCheck className="h-8 w-8 text-indigo-600" />
             <h1 className="text-4xl font-extrabold tracking-tighter text-[#022c22] uppercase">
                Maestro de Roles
             </h1>
          </div>
          <p className="text-sm text-slate-500 font-medium tracking-tight uppercase tracking-widest pl-11">
             Definición de plantillas de acceso corporativo.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={fetchRoles}
             className="h-12 w-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-100 transition-all shadow-sm group"
           >
              <RefreshCw className={cn("h-5 w-5 transition-transform group-hover:rotate-180 duration-500", isLoading && "animate-spin")} />
           </button>
           <button 
             onClick={handleCreate}
             className="h-12 px-8 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 hover:bg-[#022c22] transition-all shadow-xl shadow-indigo-500/20 active:scale-95">
              <Plus className="h-4 w-4" />
              Nuevo Rol
           </button>
        </div>
      </div>

      {/* LISTADO DE ROLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({length: 3}).map((_, i) => (
            <div key={i} className="h-48 bg-slate-50 animate-pulse rounded-[2.5rem]" />
          ))
        ) : (
          roles.map(r => (
            <div key={r.id} className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:shadow-indigo-900/10 transition-all duration-500 overflow-hidden">
               <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-50/50 rounded-bl-[4rem] group-hover:bg-indigo-500 transition-all duration-500 -z-0" />
               
               <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-start">
                     <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-white transition-all">
                        <Settings2 className="h-7 w-7" />
                     </div>
                     <button 
                       onClick={() => handleEdit(r)}
                       className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                     >
                        <Plus className="h-4 w-4 rotate-45" />
                     </button>
                  </div>

                  <div>
                     <h3 className="text-xl font-black text-[#022c22] uppercase tracking-tighter truncate">{r.nombre_rol}</h3>
                     <p className="text-[11px] text-slate-400 font-bold uppercase mt-1 leading-relaxed h-8 line-clamp-2">
                        {r.descripcion || "Sin descripción definida."}
                     </p>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                     <div className="flex gap-1.5">
                        {['logicapture', 'maestros', 'operaciones', 'sistema'].map(mod => (
                           <div 
                             key={mod} 
                             title={mod.toUpperCase()}
                             className={cn(
                               "h-2 w-2 rounded-full",
                               r.permisos_plantilla[mod] ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-slate-200"
                             )} 
                           />
                        ))}
                     </div>
                     <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Plantilla Activa</span>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
