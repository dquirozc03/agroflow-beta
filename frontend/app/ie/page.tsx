"use client";

import { useState, useEffect, useCallback } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Download, History, Calendar as CalendarIcon, Loader2, Ban, ChevronLeft, ChevronRight } from "lucide-react";
import { searchIeBookings, getIeHistory, getDownloadIeUrl, checkIeExists, anularIe, type IeSearchResult, type IeHistoryRecord } from "@/lib/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function IePage() {
    const [search, setSearch] = useState("");
    const [results, setResults] = useState<IeSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<IeSearchResult | null>(null);

    const [history, setHistory] = useState<IeHistoryRecord[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [dateFilter, setDateFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // UI states
    const [observaciones, setObservaciones] = useState("");
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [pendingBookingToGenerate, setPendingBookingToGenerate] = useState<string | null>(null);

    // Buscar bookings
    const handleSearch = useCallback(async (q: string) => {
        if (q.length < 3) {
            setResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const data = await searchIeBookings(q);
            setResults(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search) handleSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, handleSearch]);

    // Cargar historial
    const loadHistory = useCallback(async () => {
        setIsLoadingHistory(true);
        try {
            const data = await getIeHistory({ 
                desde: dateFilter || undefined, 
                limit: 5, 
                page: page 
            });
            setHistory(data.results);
            setTotalPages(Math.max(1, Math.ceil(data.total / 5)));
        } catch (error) {
            toast.error("Error al cargar el historial");
        } finally {
            setIsLoadingHistory(false);
        }
    }, [dateFilter, page]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const handleRequestGenerate = async (booking: string) => {
        try {
            const { exists } = await checkIeExists(booking);
            if (exists) {
                setPendingBookingToGenerate(booking);
                setConfirmDialogOpen(true);
            } else {
                await doGenerate(booking, false);
            }
        } catch (error) {
            toast.error("Error al consultar el estado de la Instrucción de Embarque");
        }
    };

    const doGenerate = async (booking: string, override: boolean) => {
        try {
            if (override) {
                toast.loading("Anulando instrucción anterior...");
                await anularIe(booking);
                toast.dismiss();
            }

            const url = getDownloadIeUrl(booking, observaciones);
            // Abrir en nueva pestaña para descargar
            window.open(url, "_blank");
            toast.success(`Generando IE para ${booking}...`);

            // Recargar historial después de un momento
            setTimeout(loadHistory, 2000);
            setConfirmDialogOpen(false);
        } catch (error) {
            toast.dismiss();
            toast.error("Error al generar la Instrucción de Embarque");
        }
    };
    
    const handleAnularDesdeHistorial = async (booking: string) => {
        if (!window.confirm(`¿Estás seguro de anular la IE activa del booking ${booking}?`)) return;
        try {
            const res = await anularIe(booking);
            if(res.ok) {
                toast.success(`IE Anulada correctamente`);
                loadHistory();
            }
        } catch (error) {
            toast.error("Error al anular la Instrucción de Embarque");
        }
    }

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <AppSidebar />

            <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
                <AppHeader />

                <main className="flex min-w-0 flex-1 flex-col overflow-y-auto lc-scroll bg-slate-50 dark:bg-slate-950 pb-16">
                    <div className="mx-auto w-full max-w-[1800px] p-4 md:p-6 2xl:max-w-[2000px] space-y-6">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                                Instrucciones de Embarque
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400">
                                Generación automatizada de PDFs para Granada e historial de registros.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Buscador */}
                            <Card className="md:col-span-1 shadow-sm border-border/60">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <Search className="h-4 w-4 text-primary" />
                                        Buscar Booking
                                    </CardTitle>
                                    <CardDescription>Ingresa al menos 3 caracteres</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="relative">
                                        <Input
                                            placeholder="Ej: EBKG..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value.toUpperCase())}
                                            className="pr-10"
                                        />
                                        {isSearching && (
                                            <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                                        )}
                                    </div>

                                    <div className="space-y-2 max-h-[300px] overflow-auto pr-2 lc-scroll">
                                        {results.length > 0 ? (
                                            results.map((r) => (
                                                <button
                                                    key={r.booking}
                                                    onClick={() => setSelectedBooking(r)}
                                                    className={cn(
                                                        "w-full text-left p-3 rounded-lg border text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800",
                                                        selectedBooking?.booking === r.booking
                                                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                                            : "border-border"
                                                    )}
                                                >
                                                    <div className="font-bold text-slate-700 dark:text-slate-200">{r.booking}</div>
                                                    <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                                                        <span>{r.cliente}</span>
                                                        <span>{r.cultivo}</span>
                                                    </div>
                                                </button>
                                            ))
                                        ) : search.length >= 3 && !isSearching ? (
                                            <div className="text-center py-6 text-sm text-muted-foreground">
                                                No se encontraron resultados
                                            </div>
                                        ) : null}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Detalles y Acción */}
                            <Card className="md:col-span-2 shadow-sm border-border/60">
                                <CardHeader>
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-accent" />
                                        Detalles del Embarque
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {selectedBooking ? (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase">Booking</p>
                                                    <p className="text-lg font-bold">{selectedBooking.booking}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase">Orden Beta</p>
                                                    <p className="text-lg font-bold">{selectedBooking.orden_beta || "---"}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase">Cliente</p>
                                                    <p className="font-medium text-slate-700 dark:text-slate-300">{selectedBooking.cliente}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase">Cultivo</p>
                                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                                        {selectedBooking.cultivo}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-border/60">
                                                <div className="mb-4">
                                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                                        Observaciones (Opcional)
                                                    </p>
                                                    <Textarea 
                                                        placeholder="Escribe alguna observación a añadir en el recuadro final del PDF..."
                                                        value={observaciones}
                                                        onChange={(e) => setObservaciones(e.target.value)}
                                                        className="resize-none text-sm h-16"
                                                    />
                                                </div>
                                                <Button
                                                    size="lg"
                                                    className="w-full gap-2 text-base shadow-lg shadow-primary/20"
                                                    onClick={() => handleRequestGenerate(selectedBooking.booking)}
                                                >
                                                    <Download className="h-5 w-5" />
                                                    Generar Instrucciones de Embarque
                                                </Button>
                                                <p className="text-[10px] text-center text-muted-foreground mt-3 italic">
                                                    El PDF se generará con los datos del Posicionamiento y la Base de Clientes.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                            <FileText className="h-12 w-12 opacity-10 mb-4" />
                                            <p className="text-sm">Selecciona un booking de la búsqueda para continuar</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Historial */}
                        <Card className="shadow-sm border-border/60 overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 bg-slate-50/50 dark:bg-slate-900/50 py-4">
                                <div className="flex items-center gap-2">
                                    <History className="h-4 w-4 text-slate-400" />
                                    <CardTitle className="text-base font-semibold">Historial de Generación</CardTitle>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-background border border-input rounded-md px-3 py-1.5 shadow-sm">
                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="date"
                                            value={dateFilter}
                                            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                                            className="bg-transparent border-none text-sm focus:ring-0 outline-none"
                                        />
                                    </div>
                                    <Button variant="outline" size="sm" onClick={loadHistory} disabled={isLoadingHistory}>
                                        Actualizar
                                    </Button>
                                </div>
                            </CardHeader>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-b border-border/40">
                                            <TableHead className="w-[150px] text-center">Fecha/Hora</TableHead>
                                            <TableHead className="text-center">Booking</TableHead>
                                            <TableHead className="text-center">Orden Beta</TableHead>
                                            <TableHead className="text-center">Cliente</TableHead>
                                            <TableHead className="text-center">Cultivo</TableHead>
                                            <TableHead className="text-center">Estado</TableHead>
                                            <TableHead className="text-center">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingHistory ? (
                                            Array.from({ length: 3 }).map((_, i) => (
                                                <TableRow key={i} className="animate-pulse">
                                                    <TableCell colSpan={6} className="h-12 bg-slate-50/50 dark:bg-slate-900/50" />
                                                </TableRow>
                                            ))
                                        ) : history.length > 0 ? (
                                            history.map((record) => (
                                                <TableRow key={record.id} className="group hover:bg-slate-50/10 dark:hover:bg-slate-900/10">
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {format(new Date(record.fecha_generacion), "dd/MM/yy HH:mm", { locale: es })}
                                                    </TableCell>
                                                    <TableCell className="font-bold">{record.booking}</TableCell>
                                                    <TableCell className="text-slate-500">{record.o_beta}</TableCell>
                                                    <TableCell className="text-sm">{record.cliente}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0">
                                                            {record.cultivo}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center relative">
                                                        {record.estado === 'ACTIVO' ? (
                                                            <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] hover:bg-emerald-500/20">
                                                                ACTIVO
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="destructive" className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[10px] hover:bg-rose-500/20">
                                                                ANULADO
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="flex items-center justify-end gap-1">
                                                        {record.estado === 'ACTIVO' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                title="Anular Instrucción Activa"
                                                                className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                                                                onClick={() => handleAnularDesdeHistorial(record.booking)}
                                                            >
                                                                <Ban className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            title="Descargar IE"
                                                            className="h-8 w-8 p-0 hover:text-primary transition-colors"
                                                            onClick={() => doGenerate(record.booking, false)}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                                    No hay registros de Instrucciones de Embarque {dateFilter && "para la fecha seleccionada"}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            
                            {/* Paginación */}
                            <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-slate-50/50 dark:bg-slate-900/50">
                                <span className="text-xs text-muted-foreground">
                                    Página {page} de {totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        disabled={page === 1 || isLoadingHistory}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        disabled={page >= totalPages || isLoadingHistory}
                                        onClick={() => setPage((p) => p + 1)}
                                    >
                                        Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </main>
                
                {/* Cuadro de Diálogo para IE Duplicada */}
                <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¡Instrucción de Embarque Existente!</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500">
                                El booking <b>{pendingBookingToGenerate}</b> ya cuenta con una Instrucción de Embarque <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-none mx-1 text-[10px]">ACTIVA</Badge>. <br/><br/>
                                ¿Deseas anular la versión anterior y generar una nueva instrucción? Se actualizará el historial para reflejar este cambio.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Mantener Actual</AlertDialogCancel>
                            <AlertDialogAction onClick={() => { if(pendingBookingToGenerate) doGenerate(pendingBookingToGenerate, true) }}>
                                Sí, Anular y Generar Nueva
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </div>
        </div>
    );
}
