"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, Ship, Thermometer, Wind, Factory, Clock, User, Sprout, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { getAgroflowBooking, AgroflowBookingData, ApiError } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AgroFlowPortal() {
    const [booking, setBooking] = useState("");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<AgroflowBookingData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!booking.trim()) return;

        setLoading(true);
        setError(null);
        setData(null);

        try {
            const result = await getAgroflowBooking(booking);
            setData(result);
            toast.success("Booking encontrado con éxito");
        } catch (err: any) {
            if (err instanceof ApiError && err.status === 404) {
                setError("El Booking no existe en el sistema de posicionamiento.");
                toast.error("Booking no encontrado");
            } else {
                setError("Hubo un error al buscar los datos. Reintente por favor.");
                toast.error("Error de conexión");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-12">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6 border-slate-200">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                            AgroFlow <span className="text-green-600">Ops</span>
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">
                            Portal de Autoservicio para Operadores · LogiCapture 1.0
                        </p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sincronización</span>
                        <div className="flex items-center gap-2 text-green-600 font-semibold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Excel Conectado</span>
                        </div>
                    </div>
                </div>

                {/* Search Bar Section */}
                <section className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 transition-all hover:shadow-2xl">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
                            <Input
                                value={booking}
                                onChange={(e) => setBooking(e.target.value.toUpperCase())}
                                placeholder="INGRESE EL BOOKING (Ej: BOOKING123)"
                                className="pl-12 h-16 text-2xl font-bold border-2 focus-visible:ring-green-500 rounded-xl"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={loading || !booking.trim()}
                            className="h-16 px-10 text-xl font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <ArrowRight className="w-6 h-6 mr-2" />}
                            BUSCAR
                        </Button>
                    </form>
                    {error && (
                        <div className="mt-4 flex items-center gap-2 text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </div>
                    )}
                </section>

                {/* Results Section */}
                {data && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">

                        {/* Main Info Card */}
                        <Card className="col-span-1 md:col-span-2 border-slate-200 shadow-lg overflow-hidden border-t-4 border-t-green-600">
                            <CardHeader className="bg-slate-50/50">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                        <Ship className="w-6 h-6 text-slate-500" />
                                        Detalles del Transporte
                                    </CardTitle>
                                    <Badge variant="outline" className="text-lg px-3 py-1 bg-white">
                                        {data.booking}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                                <DataField label="NAVIVERA" value={data.naviera} icon={<Ship className="w-5 h-5" />} />
                                <DataField label="NAVE" value={data.nave} icon={<Ship className="w-5 h-5" />} />
                                <DataField label="PUERTO CARGA (POL)" value={data.pol} icon={<ArrowRight className="w-5 h-5" />} />
                                <DataField label="PUERTO DESTINO (POD)" value={data.pod} icon={<ArrowRight className="w-5 h-5" />} />
                                <DataField label="PLANTA DE LLENADO" value={data.planta_llenado} icon={<Factory className="w-5 h-5" />} />
                                <DataField label="HORA POSICIONAMIENTO" value={data.hora_posicionamiento} icon={<Clock className="w-5 h-5" />} />
                            </CardContent>
                        </Card>

                        {/* Technical Info Card */}
                        <Card className="border-slate-200 shadow-lg border-t-4 border-t-blue-500">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold flex items-center gap-2">
                                    <Thermometer className="w-6 h-6 text-slate-500" />
                                    Condiciones
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <DataField label="TEMPERATURA" value={data.temperatura} icon={<Thermometer className="w-5 h-5 text-red-500" />} />
                                <DataField label="VENTILACIÓN" value={data.ventilacion} icon={<Wind className="w-5 h-5 text-blue-500" />} />

                                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-400">ATMÓSFERA CONTROLADA (AC)</span>
                                    <BoolBadge value={data.ac_option} />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-400">CONTROL DE TEMPERATURA (CT)</span>
                                    <BoolBadge value={data.ct_option} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Logistics Card */}
                        <Card className="col-span-1 md:col-span-3 border-slate-200 shadow-lg border-t-4 border-t-slate-700">
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
                                <DataField label="OPERADOR LOGÍSTICO" value={data.operador_logistico} icon={<User className="w-5 h-5" />} />
                                <DataField label="CULTIVO" value={data.cultivo} icon={<Sprout className="w-5 h-5 text-green-600" />} />
                                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl">
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">¿ES REPROGRAMADO?</span>
                                    <BoolBadge value={data.es_reprogramado} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Empty State */}
                {!data && !loading && (
                    <div className="flex flex-col items-center justify-center p-20 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                        <Search className="w-20 h-20 mb-4 opacity-20" />
                        <p className="text-xl font-medium">Ingrese un Booking para comenzar la extracción</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function DataField({ label, value, icon }: { label: string; value: string | null; icon: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                {icon}
                {label}
            </div>
            <div className="text-xl font-bold text-slate-800 break-words">
                {value || <span className="text-slate-200 italic font-normal">S/D</span>}
            </div>
        </div>
    );
}

function BoolBadge({ value }: { value: boolean }) {
    return (
        <Badge
            className={`text-sm py-1 px-4 rounded-full font-bold ${value
                    ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100 shadow-none"
                    : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-100 shadow-none"
                }`}
        >
            {value ? "SÍ" : "NO"}
        </Badge>
    );
}
