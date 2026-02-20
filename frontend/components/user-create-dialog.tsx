"use client";

import { useState } from "react";
import { Plus, User, Lock, Mail, Shield, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createUser, UsuarioCreate } from "@/lib/api";
import { ROLE_LABELS, UserRole } from "@/lib/constants";
import { toast } from "sonner";

export function UserCreateDialog({ onUserCreated }: { onUserCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<UsuarioCreate>({
        usuario: "",
        nombre: "",
        rol: "facturador",
        password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.usuario || !form.nombre || !form.password) {
            toast.error("Por favor complete todos los campos");
            return;
        }

        setLoading(true);
        try {
            await createUser(form);
            toast.success("Usuario creado correctamente");
            setOpen(false);
            setForm({ usuario: "", nombre: "", rol: "facturador", password: "" });
            onUserCreated();
        } catch (error: any) {
            toast.error(error.message || "Error al crear usuario");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" />
                    Nuevo Usuario
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] overflow-hidden rounded-2xl border-white/20 bg-white/80 backdrop-blur-xl dark:bg-slate-900/90">
                <DialogHeader>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <User className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-center text-xl font-bold tracking-tight">Dar de alta Usuario</DialogTitle>
                    <DialogDescription className="text-center">
                        Crea un nuevo acceso para el equipo. Asigna un rol específico para controlar los permisos.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="nombre">Nombre Completo</Label>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="nombre"
                                    placeholder="Ej: Juan Pérez"
                                    className="pl-10"
                                    value={form.nombre}
                                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="usuario">ID de Usuario (Login)</Label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="usuario"
                                    placeholder="jperez"
                                    className="pl-10"
                                    value={form.usuario}
                                    onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rol">Rol del Sistema</Label>
                            <Select
                                value={form.rol}
                                onValueChange={(val) => setForm({ ...form, rol: val })}
                                disabled={loading}
                            >
                                <SelectTrigger className="w-full">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Seleccione un rol" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña Temporal</Label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    disabled={loading}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">Mínimo 6 caracteres.</p>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-primary hover:bg-primary/90"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creando...
                                </>
                            ) : (
                                "Crear Usuario"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
