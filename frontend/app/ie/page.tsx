"use client";

import { useState, useEffect, useCallback } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Download, History, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { searchIeBookings, getIeHistory, getDownloadIeUrl, type IeSearchResult, type IeHistoryRecord } from "@/lib/api";
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
    const [dateFilter, setDateFilter] = useState(format(new Date(), "yyyy-MM-dd"));

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
            const data = await getIeHistory({ desde: dateFilter });
            setHistory(data.results);
        } catch (error) {
            toast.error("Error al cargar el historial");
        } finally {
            setIsLoadingHistory(false);
        }
    }, [dateFilter]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const handleGenerate = async (booking: string) => {
        try {
            const url = getDownloadIeUrl(booking);
            // Abrir en nueva pestaña para descargar
            window.open(url, "_blank");
            toast.success(`Generando IE para ${booking}...`);

            // Recargar historial después de un momento
            setTimeout(loadHistory, 2000);
        } catch (error) {
            toast.error("Error al disparar la descarga");
        }
    };

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
                                                <Button
                                                    size="lg"
                                                    className="w-full gap-2 text-base shadow-lg shadow-primary/20"
                                                    onClick={() => handleGenerate(selectedBooking.booking)}
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
                                            onChange={(e) => setDateFilter(e.target.value)}
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
                                            <TableHead className="text-center">PDF</TableHead>
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
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 hover:text-primary transition-colors"
                                                            onClick={() => handleGenerate(record.booking)}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                                    No hay registros para la fecha seleccionada
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </div>
                </main>

            </div>
        </div>
    );
}
