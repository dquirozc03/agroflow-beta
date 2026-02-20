"use client";

import { useEffect, useState, Suspense } from "react";
import {
    Users,
    ShieldCheck,
    UserPlus,
    Search,
    MoreVertical,
    UserMinus,
    UserCheck,
    Shield,
    RefreshCw,
    Pencil,
    Key,
    UserCircle
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listUsers, toggleUserStatus, apiUpdateUser, apiResetUserPassword, Usuario } from "@/lib/api";
import { ROLE_LABELS, UserRole } from "@/lib/constants";
import { toast } from "sonner";
import { UserCreateDialog } from "@/components/user-create-dialog";
import { Skeleton } from "@/components/ui/skeleton";

function UsuariosContent() {
    const [users, setUsers] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Edit User State
    const [editingUser, setEditingUser] = useState<Usuario | null>(null);
    const [editNombre, setEditNombre] = useState("");
    const [editUsuario, setEditUsuario] = useState("");
    const [editRol, setEditRol] = useState("");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Reset Password State
    const [resettingUser, setResettingUser] = useState<Usuario | null>(null);
    const [nuevaPassword, setNuevaPassword] = useState("");
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await listUsers();
            setUsers(data);
        } catch (error: any) {
            toast.error("No se pudieron cargar los usuarios");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleToggleStatus = async (id: number) => {
        try {
            await toggleUserStatus(id);
            toast.success("Estado de usuario actualizado");
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message || "Error al actualizar estado");
        }
    };

    const filteredUsers = users.filter(u =>
        u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.usuario.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        try {
            await apiUpdateUser(editingUser.id, {
                nombre: editNombre,
                rol: editRol,
                usuario: editUsuario
            });
            toast.success("Usuario actualizado correctamente");
            setIsEditModalOpen(false);
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message || "Error al actualizar usuario");
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resettingUser) return;
        if (nuevaPassword.length < 6) {
            return toast.error("La contraseña debe tener al menos 6 caracteres");
        }
        try {
            await apiResetUserPassword(resettingUser.id, nuevaPassword);
            toast.success(`Contraseña de ${resettingUser.usuario} restablecida`);
            setIsResetModalOpen(false);
            setNuevaPassword("");
        } catch (error: any) {
            toast.error(error.message || "Error al restablecer contraseña");
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
            <AppSidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <AppHeader />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                        {/* Header Section */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Equipo</h1>
                                <p className="text-slate-500 dark:text-slate-400">
                                    Administra los accesos y roles de los usuarios del sistema.
                                </p>
                            </div>
                            <UserCreateDialog onUserCreated={fetchUsers} />
                        </div>

                        {/* Stats / Quick Info */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <Card className="border-none bg-white/50 shadow-md backdrop-blur-sm dark:bg-slate-900/50">
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                    <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                                    <Users className="h-4 w-4 text-slate-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{users.length}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Colaboradores registrados</p>
                                </CardContent>
                            </Card>
                            <Card className="border-none bg-white/50 shadow-md backdrop-blur-sm dark:bg-slate-900/50">
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                    <CardTitle className="text-sm font-medium">Administradores</CardTitle>
                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{users.filter(u => u.rol === 'administrador').length}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Con acceso total</p>
                                </CardContent>
                            </Card>
                            <Card className="border-none bg-white/50 shadow-md backdrop-blur-sm dark:bg-slate-900/50">
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                    <CardTitle className="text-sm font-medium">Activos</CardTitle>
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{users.filter(u => u.activo).length}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Cuentas habilitadas</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Table Card */}
                        <Card className="overflow-hidden border-none bg-white shadow-xl dark:bg-slate-900">
                            <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <CardTitle className="text-lg font-bold">Listado de Usuarios</CardTitle>
                                    <div className="relative flex-1 max-w-xs">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            placeholder="Buscar por nombre o ID..."
                                            className="pl-10 h-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={fetchUsers} disabled={loading}>
                                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-slate-50/30 dark:bg-slate-900/30">
                                        <TableRow className="border-slate-100 dark:border-slate-800">
                                            <TableHead className="w-[300px] px-6">Usuario</TableHead>
                                            <TableHead className="px-6">Rol</TableHead>
                                            <TableHead className="px-6 text-center">Estado</TableHead>
                                            <TableHead className="px-6 text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            Array.from({ length: 3 }).map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Skeleton className="h-10 w-10 rounded-full" />
                                                            <div className="space-y-2">
                                                                <Skeleton className="h-4 w-24" />
                                                                <Skeleton className="h-3 w-16" />
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 px-4">
                                                        <Skeleton className="h-6 w-20 rounded-full" />
                                                    </TableCell>
                                                    <TableCell className="px-6 text-center">
                                                        <Skeleton className="mx-auto h-6 w-16 rounded-full" />
                                                    </TableCell>
                                                    <TableCell className="px-6 text-right">
                                                        <Skeleton className="ml-auto h-8 w-8 rounded-md" />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : filteredUsers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                                                    No se encontraron usuarios.
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredUsers.map((u) => (
                                            <TableRow key={u.id} className="border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                            {u.nombre.charAt(0)}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900 dark:text-white leading-tight">
                                                                {u.nombre}
                                                            </span>
                                                            <span className="text-xs text-slate-500">
                                                                @{u.usuario}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <Badge variant="outline" className="bg-slate-50 font-medium capitalize border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                                                        {ROLE_LABELS[u.rol as UserRole] || u.rol}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-6 text-center">
                                                    {u.activo ? (
                                                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                                                            Activo
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20">
                                                            Inactivo
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-6 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-200 dark:border-slate-800">
                                                            <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="gap-2" onClick={() => handleToggleStatus(u.id)}>
                                                                {u.activo ? (
                                                                    <>
                                                                        <UserMinus className="h-4 w-4 text-red-500" />
                                                                        <span>Desactivar cuenta</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <UserCheck className="h-4 w-4 text-green-500" />
                                                                        <span>Activar cuenta</span>
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="gap-2" onClick={() => {
                                                                setEditingUser(u);
                                                                setEditNombre(u.nombre);
                                                                setEditUsuario(u.usuario);
                                                                setEditRol(u.rol);
                                                                setIsEditModalOpen(true);
                                                            }}>
                                                                <Pencil className="h-4 w-4 text-blue-500" />
                                                                <span>Editar Usuario</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="gap-2" onClick={() => {
                                                                setResettingUser(u);
                                                                setIsResetModalOpen(true);
                                                            }}>
                                                                <Key className="h-4 w-4 text-amber-500" />
                                                                <span>Restablecer Clave</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="gap-2 cursor-not-allowed opacity-50">
                                                                <Shield className="h-4 w-4" />
                                                                <span>Permisos Avanzados</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>

            {/* MODAL EDITAR USUARIO */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Colaborador</DialogTitle>
                        <DialogDescription>Modifica los datos básicos o el rol del usuario.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditUser} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Nombre Completo</Label>
                            <Input value={editNombre} onChange={(e) => setEditNombre(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>ID de Usuario (Login)</Label>
                            <Input value={editUsuario} onChange={(e) => setEditUsuario(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Rol del Sistema</Label>
                            <Select value={editRol} onValueChange={setEditRol}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(ROLE_LABELS).map(([val, label]) => (
                                        <SelectItem key={val} value={val}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                            <Button type="submit">Guardar Cambios</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL RESTABLECER CLAVE */}
            <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Restablecer Contraseña</DialogTitle>
                        <DialogDescription>
                            Establece una clave temporal para @{resettingUser?.usuario}.
                            El usuario deberá cambiarla obligatoriamente la próxima vez que entre.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetPassword} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Nueva Contraseña Temporal</Label>
                            <Input
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={nuevaPassword}
                                onChange={(e) => setNuevaPassword(e.target.value)}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsResetModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" className="bg-amber-600 hover:bg-amber-700">Restablecer Ahora</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}

export default function UsuariosPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center text-muted-foreground">Cargando gestión de usuarios...</div>}>
            <UsuariosContent />
        </Suspense>
    );
}
