"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    ShieldAlert,
    Search,
    Calendar as CalendarIcon,
    Filter,
    User,
    History,
    FileText,
    AlertTriangle,
    MoveRight,
    ShieldCheck,
    CheckCircle2
} from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { canSeeAuditoria } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAuditLogs, type AuditLog } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Helper para formatear fechas de forma segura
function safeFormat(dateStr: string | undefined | null, pattern: string) {
    if (!dateStr) return "---";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "---";
        return format(d, pattern, { locale: es });
    } catch {
        return "---";
    }
}

function AuditoriaContent() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterUser, setFilterUser] = useState("");
    const [filterAction, setFilterAction] = useState("ALL");

    useEffect(() => {
        if (isLoading) return;
        if (!user || !canSeeAuditoria(user.rol)) {
            router.replace("/");
            return;
        }
        fetchLogs();
    }, [user, isLoading, router]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await getAuditLogs();
            setLogs(data);
        } catch (e: any) {
            console.error("Audit load error:", e);
            const msg = e.message || "Error desconocido";
            const status = e.status ? `(${e.status})` : "";
            toast.error(`Error al cargar auditoría ${status}: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            const matchUser = log.usuario?.toLowerCase().includes(filterUser.toLowerCase()) ?? true;
            const matchAction = filterAction === "ALL" || log.accion === filterAction;
            return matchUser && matchAction;
        });
    }, [logs, filterUser, filterAction]);

    if (isLoading || !user) return null;

    return (
        <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
            <AppSidebar />
            <div className="flex flex-1 flex-col h-full overflow-hidden">
                <AppHeader />

                <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
                    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    Auditoría del Sistema
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400">
                                    Registro detallado de operaciones críticas y anulaciones.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="gap-1.5 px-3 py-1 text-sm font-medium border-slate-300 dark:border-slate-700">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                    Acceso Seguro: {user.rol}
                                </Badge>
                            </div>
                        </div>

                        {/* Filtros */}
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="relative md:col-span-2">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por usuario..."
                                    className="pl-9"
                                    value={filterUser}
                                    onChange={(e) => setFilterUser(e.target.value)}
                                />
                            </div>
                            <Select value={filterAction} onValueChange={setFilterAction}>
                                <SelectTrigger>
                                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <SelectValue placeholder="Filtrar por acción" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todas las acciones</SelectItem>
                                    <SelectItem value="CREAR">Creación Registro</SelectItem>
                                    <SelectItem value="EDITAR">Edición Registro</SelectItem>
                                    <SelectItem value="ANULAR">Anulación Registro</SelectItem>
                                    <SelectItem value="PROCESAR">Procesado SAP</SelectItem>
                                    <SelectItem value="USUARIO_CREAR">Nuevo Colaborador</SelectItem>
                                    <SelectItem value="USUARIO_EDITAR">Edición Colaborador</SelectItem>
                                    <SelectItem value="USUARIO_PASSWORD_RESET">Reset Clave</SelectItem>
                                    <SelectItem value="USUARIO_ESTADO">Activar/Desactivar</SelectItem>
                                    <SelectItem value="LOGIN">Accesos</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" onClick={fetchLogs} disabled={loading}>
                                <History className="mr-2 h-4 w-4" />
                                Refrescar
                            </Button>
                        </div>

                        {/* Timeline */}
                        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent md:before:ml-[8.5rem] dark:before:via-slate-800">
                            {loading ? (
                                <div className="flex justify-center p-12">
                                    <span className="animate-pulse text-muted-foreground">Cargando registros...</span>
                                </div>
                            ) : filteredLogs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-2 p-12 text-center text-muted-foreground">
                                    <ShieldCheck className="h-12 w-12 text-slate-300" />
                                    <p>No se encontraron registros de auditoría.</p>
                                </div>
                            ) : (
                                filteredLogs.map((log) => (
                                    <div key={log.id} className="relative flex items-center md:items-start group">

                                        {/* Date Bubble (Desktop) */}
                                        <div className="hidden md:block w-24 text-right pr-6 mt-1.5">
                                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                                {safeFormat(log.creado_en, "HH:mm")}
                                            </p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                                                {safeFormat(log.creado_en, "dd MMM")}
                                            </p>
                                        </div>

                                        {/* Timeline Dot */}
                                        <div className={cn(
                                            "absolute left-0 h-10 w-10 flex items-center justify-center rounded-full border-4 border-slate-50 bg-white shadow-sm z-10 md:left-28 dark:border-slate-950 dark:bg-slate-900",
                                            getActionColor(log.accion)
                                        )}>
                                            {getActionIcon(log.accion)}
                                        </div>

                                        {/* Content Card */}
                                        <div className="ml-14 flex-1 md:ml-44">
                                            <Card className="border-0 shadow-md ring-1 ring-slate-200 dark:ring-slate-800 transition-all hover:shadow-lg hover:ring-slate-300 dark:hover:ring-slate-700">
                                                <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                                                            {log.accion}
                                                        </Badge>
                                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                            {log.usuario || "Sistema"}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground md:hidden">
                                                        {safeFormat(log.creado_en, "dd/MM HH:mm")}
                                                    </span>
                                                </CardHeader>
                                                <CardContent className="px-4 pb-4">
                                                    <div className="text-sm text-slate-600 dark:text-slate-300">
                                                        {renderLogDetails(log)}
                                                    </div>
                                                    {log.motivo && (
                                                        <div className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                                                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                                            <div>
                                                                <span className="font-bold">Motivo:</span> {log.motivo}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="mt-2 text-[10px] text-slate-400 font-mono">
                                                        ID Evento: #{log.id} {log.registro_id ? `• Registro Ref: #${log.registro_id}` : ""}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                ))
                            )}

                            {!loading && filteredLogs.length > 0 && (
                                <div className="relative flex items-center md:items-start group pt-4">
                                    <div className="hidden md:block w-24 pr-6 mt-1.5" />
                                    <div className="absolute left-0 h-10 w-10 flex items-center justify-center rounded-full border-4 border-slate-50 bg-slate-100 shadow-sm z-10 md:left-28 dark:border-slate-950 dark:bg-slate-900">
                                        <CheckCircle2 className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <div className="ml-14 flex-1 md:ml-44">
                                        <p className="text-xs font-medium text-slate-400 py-3">Final del historial visible</p>
                                    </div>
                                </div>
                            )}

                            {/* Espaciador final para que el footer no tape la última tarjeta */}
                            <div className="h-24 w-full" />
                        </div>

                    </div>
                </main>

                <AppFooter />
            </div>
        </div>
    );
}

export default function AuditoriaPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center text-muted-foreground">Cargando auditoría...</div>}>
            <AuditoriaContent />
        </Suspense>
    );
}

function getActionColor(action: string) {
    if (action.startsWith("USUARIO_")) return "text-indigo-500 ring-indigo-100 dark:ring-indigo-900";

    switch (action) {
        case "ANULAR": return "text-red-500 ring-red-100 dark:ring-red-900";
        case "CREAR": return "text-emerald-500 ring-emerald-100 dark:ring-emerald-900";
        case "EDITAR": return "text-blue-500 ring-blue-100 dark:ring-blue-900";
        case "ACTUALIZAR": return "text-blue-500 ring-blue-100 dark:ring-blue-900";
        case "PROCESAR": return "text-amber-500 ring-amber-100 dark:ring-amber-900";
        case "LOGIN": return "text-purple-500 ring-purple-100 dark:ring-purple-900";
        default: return "text-slate-500 ring-slate-100 dark:ring-slate-800";
    }
}

function getActionIcon(action: string) {
    if (action.startsWith("USUARIO_")) return <UserCog className="h-5 w-5" />;

    switch (action) {
        case "ANULAR": return <ShieldAlert className="h-5 w-5" />;
        case "CREAR": return <FilePlus2 className="h-5 w-5" />;
        case "EDITAR": return <FileText className="h-5 w-5" />;
        case "ACTUALIZAR": return <FileText className="h-5 w-5" />;
        case "PROCESAR": return <CheckCircle2 className="h-5 w-5" />;
        case "LOGIN": return <User className="h-5 w-5" />;
        default: return <FileText className="h-5 w-5" />;
    }
}

import { FilePlus2, UserCog } from "lucide-react";

function renderLogDetails(log: AuditLog) {
    const action = log.accion;

    if (action === 'ANULAR') {
        return <span className="font-medium text-red-600 dark:text-red-400">Anuló el registro operativo #{log.registro_id}</span>;
    }
    if (action === 'CREAR') {
        return <span className="font-medium text-emerald-600 dark:text-emerald-400">Creó un nuevo registro operativo.</span>;
    }
    if (action === 'EDITAR' || action === 'ACTUALIZAR') {
        return <span>Actualizó datos en el registro operativo #{log.registro_id}.</span>;
    }
    if (action === 'PROCESAR') {
        return <span className="font-medium text-amber-600 dark:text-amber-400">Finalizó y procesó el registro #{log.registro_id} para SAP.</span>;
    }

    if (action === 'USUARIO_CREAR') {
        return <span>Creó la cuenta del nuevo colaborador: <strong className="text-indigo-600 dark:text-indigo-400">{log.despues?.usuario}</strong></span>;
    }
    if (action === 'USUARIO_EDITAR') {
        return <span>Editó los datos del colaborador <strong className="text-indigo-600 dark:text-indigo-400">{log.despues?.usuario}</strong>.</span>;
    }
    if (action === 'USUARIO_PASSWORD_RESET') {
        return <span>Restableció la contraseña del colaborador <strong className="text-indigo-600 dark:text-indigo-400">{log.despues?.usuario}</strong>.</span>;
    }
    if (action === 'USUARIO_CAMBIAR_PASSWORD') {
        return <span>Actualizó su propia contraseña de acceso.</span>;
    }
    if (action === 'USUARIO_ESTADO') {
        const activo = log.despues?.activo;
        return <span>{activo ? 'Activó' : 'Desactivó'} la cuenta del colaborador <strong className="text-indigo-600 dark:text-indigo-400">{log.despues?.usuario}</strong>.</span>;
    }

    return <span>Realizó una acción de {action.toLowerCase()} en el sistema.</span>;
}
