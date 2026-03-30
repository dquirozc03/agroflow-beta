"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  User, 
  Lock, 
  Key, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  Unlock,
  Contact,
  Scan,
  Truck,
  FileBarChart,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ActionConfirmModal } from "./action-confirm-modal";
import { StatusModal } from "./status-modal";

interface UsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingData?: any;
}

export function UsuarioModal({ isOpen, onClose, onSuccess, editingData }: UsuarioModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    usuario: "",
    nombre: "",
    rol: "OPERATIVO",
    password: "123456",
    activo: true,
    permisos: {
      logicapture: true,
      maestros: true,
      operaciones: true,
      sistema: false
    }
  });

  useEffect(() => {
    if (editingData) {
      setFormData({
        usuario: editingData.usuario || "",
        nombre: editingData.nombre || "",
        rol: editingData.rol || "OPERATIVO",
        password: "", // No se edita password aquí normalmente
        activo: editingData.activo ?? true,
        permisos: editingData.permisos || {
          logicapture: true,
          maestros: true,
          operaciones: true,
          sistema: false
        }
      });
    } else {
      setFormData({
        usuario: "",
        nombre: "",
        rol: "OPERATIVO",
        password: "123456",
        activo: true,
        permisos: {
          logicapture: true,
          maestros: true,
          operaciones: true,
          sistema: false
        }
      });
    }
  }, [editingData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingData 
        ? `${API_BASE_URL}/api/v1/auth/usuarios/${editingData.id}`
        : `${API_BASE_URL}/api/v1/auth/usuarios`;
      
      const method = editingData ? "PATCH" : "POST";
      
      const payload = { ...formData };
      if (editingData) delete (payload as any).password; // No enviar password en update parcial

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Error al guardar usuario");
      }

      toast.success(editingData ? "Usuario actualizado" : "Usuario creado exitosamente");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const [rolesData, setRolesData] = useState<any[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/roles`);
      if (response.ok) {
        const data = await response.json();
        setRolesData(data);
      }
    } catch (error) {
      console.error("Error al cargar roles:", error);
    }
  };

  const handleRoleChange = (rolName: string) => {
    const rolSpec = rolesData.find(r => r.nombre_rol === rolName);
    if (rolSpec) {
      setFormData({
        ...formData,
        rol: rolName,
        permisos: rolSpec.permisos_plantilla
      });
    } else {
      setFormData({...formData, rol: rolName});
    }
  };

  const recoverPassword = async () => {
    setConfirmOpen(true);
  };

  const executeRecover = async () => {
    if (!editingData) return;
    setConfirmOpen(false);
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/usuarios/${editingData.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nueva_password: "123456" }),
      });
      if (response.ok) {
        toast.success("Contraseña restablecida a 123456");
      }
    } catch (error) {
      toast.error("Error al restablecer contraseña");
    } finally {
      setLoading(false);
    }
  };

  const unlockAccount = async () => {
    if (!editingData) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/usuarios/${editingData.id}/desbloquear`, {
        method: "PATCH",
      });
      if (response.ok) {
        toast.success("Cuenta desbloqueada correctamente");
        onSuccess();
      }
    } catch (error) {
      toast.error("Error al desbloquear cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <ActionConfirmModal 
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={executeRecover}
        variant="danger"
        title="Restablecer Contraseña"
        message="¿Estás seguro de resetear la contraseña del usuario a '123456'? Se obligará al usuario a cambiarla al ingresar."
        confirmText="Sí, Resetear"
      />
      <DialogContent className="max-w-2xl bg-white border-0 shadow-2xl rounded-[2rem] overflow-hidden p-0">
        <div className="h-2 bg-emerald-500" />
        
        <DialogHeader className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black text-[#022c22] tracking-tighter uppercase">
                {editingData ? "Gestión de Colaborador" : "Nuevo Usuario Maestro"}
              </DialogTitle>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                {editingData ? `ID de Sistema: #${editingData.id}` : "Definición de perfil y accesos operativos"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
          <Tabs defaultValue="perfil" className="w-full">
            <TabsList className="bg-slate-50 p-1 rounded-xl mb-6 w-full flex justify-start gap-1">
              <TabsTrigger value="perfil" className="rounded-lg text-[10px] uppercase font-black tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm px-6 py-2">
                Perfil
              </TabsTrigger>
              <TabsTrigger value="permisos" className="rounded-lg text-[10px] uppercase font-black tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm px-6 py-2">
                Accesos
              </TabsTrigger>
              {editingData && (
                <TabsTrigger value="seguridad" className="rounded-lg text-[10px] uppercase font-black tracking-widest data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-sm px-6 py-2">
                  Seguridad
                </TabsTrigger>
              )}
            </TabsList>

            {/* TAB: PERFIL */}
            <TabsContent value="perfil" className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre Completo</Label>
                  <div className="relative group">
                     <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                     <Input 
                       className="pl-10 h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-emerald-500/20" 
                       value={formData.nombre} 
                       onChange={e => setFormData({...formData, nombre: e.target.value.toUpperCase()})}
                       placeholder="EJ: DANIEL QUIROZ"
                       required
                     />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID de Usuario</Label>
                  <div className="relative group">
                     <Contact className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                     <Input 
                       className="pl-10 h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-emerald-500/20" 
                       value={formData.usuario} 
                       onChange={e => setFormData({...formData, usuario: e.target.value.toUpperCase().replace(/\s/g, '')})}
                       placeholder="EJ: DQUIROZ"
                       required
                       disabled={!!editingData}
                     />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rol Maestro</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {rolesData.length > 0 ? (
                    rolesData.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleRoleChange(r.nombre_rol)}
                        className={cn(
                          "py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                          formData.rol === r.nombre_rol 
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20" 
                            : "bg-white text-slate-400 border-slate-100 hover:border-emerald-200"
                        )}
                      >
                        {r.nombre_rol}
                      </button>
                    ))
                  ) : (
                    ["ADMIN", "SUPERVISOR", "OPERATIVO"].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleRoleChange(r)}
                        className={cn(
                          "py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                          formData.rol === r 
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20" 
                            : "bg-white text-slate-400 border-slate-100 hover:border-emerald-200"
                        )}
                      >
                        {r}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {!editingData && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contraseña Inicial</Label>
                  <div className="relative group">
                     <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                     <Input 
                       type="password"
                       className="pl-10 h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-emerald-500/20" 
                       value={formData.password} 
                       onChange={e => setFormData({...formData, password: e.target.value})}
                       required
                     />
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight italic">
                    * El usuario deberá cambiarla obligatoriamente al primer ingreso.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* TAB: PERMISOS */}
            <TabsContent value="permisos" className="space-y-6 animate-in fade-in slide-in-from-top-2 pt-2">
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                       <Scan className="h-5 w-5 text-emerald-500" />
                       <div>
                          <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">Módulo LogiCapture</p>
                          <p className="text-[10px] text-slate-400 font-medium">Registro de contenedores y blindaje.</p>
                       </div>
                    </div>
                    <Switch 
                      checked={formData.permisos.logicapture} 
                      onCheckedChange={(v) => setFormData({...formData, permisos: {...formData.permisos, logicapture: v}})} 
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                       <Truck className="h-5 w-5 text-emerald-500" />
                       <div>
                          <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">Módulo Maestros</p>
                          <p className="text-[10px] text-slate-400 font-medium">Gestión de choferes, vehículos y transportistas.</p>
                       </div>
                    </div>
                    <Switch 
                      checked={formData.permisos.maestros} 
                      onCheckedChange={(v) => setFormData({...formData, permisos: {...formData.permisos, maestros: v}})} 
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                       <FileBarChart className="h-5 w-5 text-emerald-500" />
                       <div>
                          <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">Módulo Operaciones</p>
                          <p className="text-[10px] text-slate-400 font-medium">Instrucciones de embarque y reportes técnicos.</p>
                       </div>
                    </div>
                    <Switch 
                      checked={formData.permisos.operaciones} 
                      onCheckedChange={(v) => setFormData({...formData, permisos: {...formData.permisos, operaciones: v}})} 
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 ring-2 ring-rose-500/5">
                    <div className="flex items-center gap-3">
                       <Shield className="h-5 w-5 text-rose-500" />
                       <div>
                          <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">Módulo Sistema</p>
                          <p className="text-[10px] text-slate-400 font-medium font-bold italic text-rose-400">Acceso a configuración de usuarios.</p>
                       </div>
                    </div>
                    <Switch 
                      checked={formData.permisos.sistema} 
                      onCheckedChange={(v) => setFormData({...formData, permisos: {...formData.permisos, sistema: v}})} 
                    />
                  </div>
               </div>
            </TabsContent>

            {/* TAB: SEGURIDAD */}
            {editingData && (
              <TabsContent value="seguridad" className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl space-y-4">
                   <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                         <p className="text-xs font-black text-rose-700 uppercase tracking-tight">Zona de Recuperación</p>
                         <p className="text-[11px] text-rose-600/70 font-medium leading-tight">
                            Si el usuario olvidó su contraseña o bloqueó su cuenta, usa estas acciones de emergencia.
                         </p>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                      <Button 
                        type="button" 
                        onClick={recoverPassword}
                        variant="outline" 
                        className="h-12 border-rose-200 text-rose-600 hover:bg-rose-500 hover:text-white rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all"
                      >
                         <Lock className="h-4 w-4 mr-2" />
                         Reset Password
                      </Button>
                      <Button 
                        type="button" 
                        onClick={unlockAccount}
                        disabled={!editingData.bloqueado}
                        variant="outline" 
                        className="h-12 border-rose-200 text-rose-600 hover:bg-rose-500 hover:text-white rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all disabled:opacity-30"
                      >
                         <Unlock className="h-4 w-4 mr-2" />
                         {editingData.bloqueado ? "Desbloquear" : "No Bloqueado"}
                      </Button>
                   </div>
                </div>

                <div className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                   <div className="flex items-center gap-3">
                      <Activity className={cn("h-5 w-5", formData.activo ? "text-emerald-500" : "text-slate-400")} />
                      <div>
                         <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">Estado de la cuenta</p>
                         <p className="text-[10px] text-slate-400 font-medium">Habilita o deshabilita el ingreso total.</p>
                      </div>
                   </div>
                   <Switch 
                     checked={formData.activo} 
                     onCheckedChange={(v) => setFormData({...formData, activo: v})} 
                   />
                </div>
              </TabsContent>
            )}
          </Tabs>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-14 bg-emerald-600 hover:bg-[#022c22] text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Save className="h-5 w-5 mr-3" />
            )}
            {editingData ? "Guardar Cambios Maestros" : "Autorizar Nuevo Usuario"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
