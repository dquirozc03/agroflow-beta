"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiUpdateOwnPassword } from "@/lib/api";
import { toast } from "sonner";
import { KeyRound, ShieldAlert, Loader2 } from "lucide-react";

interface ChangePasswordModalProps {
    isOpen: boolean;
    onSuccess: () => void;
    onCancel?: () => void;
}

export function ChangePasswordModal({ isOpen, onSuccess, onCancel }: ChangePasswordModalProps) {
    const [passwordActual, setPasswordActual] = useState("");
    const [nuevaPassword, setNuevaPassword] = useState("");
    const [confirmarPassword, setConfirmarPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (nuevaPassword.length < 6) {
            return toast.error("La nueva contraseña debe tener al menos 6 caracteres");
        }

        if (nuevaPassword !== confirmarPassword) {
            return toast.error("Las contraseñas no coinciden");
        }

        setLoading(true);
        try {
            await apiUpdateOwnPassword({
                password_actual: passwordActual,
                nueva_password: nuevaPassword,
            });
            toast.success("Contraseña actualizada correctamente");
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Error al actualizar contraseña. Verifica tu contraseña actual.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open && onCancel) onCancel();
        }}>
            <DialogContent className="sm:max-w-[425px] border-none shadow-2xl dark:bg-slate-900">
                <DialogHeader className="space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/30">
                        <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                    </div>
                    <DialogTitle className="text-center text-xl font-bold">Cambio de Contraseña Obligatorio</DialogTitle>
                    <DialogDescription className="text-center">
                        Tu cuenta tiene una contraseña temporal. Por seguridad, debes establecer una nueva contraseña para continuar.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="current" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Contraseña Actual (Temporal)
                        </Label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                id="current"
                                type="password"
                                required
                                className="pl-10 focus-visible:ring-primary"
                                value={passwordActual}
                                onChange={(e) => setPasswordActual(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="new" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Nueva Contraseña
                        </Label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                id="new"
                                type="password"
                                required
                                className="pl-10 focus-visible:ring-primary"
                                value={nuevaPassword}
                                onChange={(e) => setNuevaPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Confirmar Nueva Contraseña
                        </Label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                id="confirm"
                                type="password"
                                required
                                className="pl-10 focus-visible:ring-primary"
                                value={confirmarPassword}
                                onChange={(e) => setConfirmarPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Actualizando...
                                </>
                            ) : (
                                "Guardar Contraseña y Continuar"
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full text-slate-500 hover:text-red-600"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cerrar Sesión y Volver
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
