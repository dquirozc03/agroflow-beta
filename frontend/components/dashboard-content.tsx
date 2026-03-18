"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  ClipboardList,
  TableProperties,
  History,
  LayoutDashboard,
  Loader2,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { canSeeCapturaAndBandeja } from "@/lib/constants";
import { getDashboardStats, type DashboardStatsResponse } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DateRangePicker } from "@/components/date-range-picker";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";

const COLOR_PENDIENTE = "#fbbf24"; // Amber-400
const COLOR_PROCESADO = "#10b981"; // Emerald-500
const COLOR_ANULADO = "#ef4444";   // Red-500

export function DashboardContent() {
  const { user } = useAuth();
  const role = user?.rol;
  const showCapturaBandeja = canSeeCapturaAndBandeja(role ?? "documentaria");

  // Rango por defecto: últimos 30 días
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    // Preparar params
    const params: { desde?: string; hasta?: string; dias?: number } = {};
    if (dateRange?.from) {
      params.desde = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange?.to) {
      params.hasta = format(dateRange.to, "yyyy-MM-dd");
    }
    // Si no hay rango completo, fallback a 30 días
    if (!params.desde && !params.hasta) {
      params.dias = 30;
    }

    getDashboardStats(params)
      .then((data) => {
        if (mounted) setStats(data);
      })
      .catch(() => {
        if (mounted) setError("No se pudieron cargar las estadísticas");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [dateRange]); // Recargar al cambiar fechas

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Cargando métricas...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center text-muted-foreground dark:border-slate-800 dark:bg-slate-900/50">
        <div className="max-w-[300px]">
          <p className="text-lg font-semibold">{error ?? "Sin datos disponibles"}</p>
          <p className="text-sm">Intenta recargar la página más tarde.</p>
        </div>
      </div>
    );
  }

  const porDiaChart = stats.por_dia.map((d) => ({
    fecha: d.fecha.slice(5), // MM-DD
    total: d.total,
    pendientes: d.pendientes,
    procesados: d.procesados,
    anulados: d.anulados,
  }));

  const porEstadoPie = stats.por_estado.map((e) => {
    const name = e.estado.charAt(0).toUpperCase() + e.estado.slice(1);
    const color =
      e.estado === "anulado"
        ? COLOR_ANULADO
        : e.estado === "procesado"
          ? COLOR_PROCESADO
          : COLOR_PENDIENTE;
    return { name, value: e.total, color };
  });

  const porTransportistaBar = stats.por_transportista.slice(0, 8).map((t) => ({
    nombre: t.nombre.length > 18 ? t.nombre.slice(0, 18) + "…" : t.nombre,
    total: t.total,
  }));

  const totalPendientes = stats.por_estado.find((e) => e.estado === "pendiente")?.total ?? 0;
  const totalProcesados = stats.por_estado.find((e) => e.estado === "procesado")?.total ?? 0;
  const totalAnulados = stats.por_estado.find((e) => e.estado === "anulado")?.total ?? 0;

  return (
    <TooltipProvider>
      <div className="mx-auto w-full max-w-[1600px] space-y-8 p-6 md:p-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {role === "asistente_comercial" ? "Panel Compras & Embarque" : "Dashboard Operativo"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {role === "asistente_comercial" 
                ? "Seguimiento de instrucciones y flujo comercial." 
                : "Resumen de actividad y métricas clave."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker date={dateRange} setDate={setDateRange} />
          </div>
        </div>

        {/* Quick Access Logicapture (Solo para otros roles) */}
        {role !== "asistente_comercial" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-1">
            <Card className="border-0 shadow-lg shadow-green-100/50 dark:shadow-none dark:bg-slate-900 ring-1 ring-green-200 dark:ring-green-900/30 transition-all hover:ring-green-400">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl font-bold text-green-700 dark:text-green-400">Control de Facturas Logísticas</CardTitle>
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Nuevo</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Extrae datos de XMLs de operadores, consulta advertencias y exporta a SAP.</p>
                </div>
                <Link href="/logistica/facturas">
                  <Button className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20">
                    <TableProperties className="mr-2 h-4 w-4" />
                    Abrir Módulo
                  </Button>
                </Link>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Commercial/Assistant Header (Solo para asistente_comercial) */}
        {role === "asistente_comercial" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-1">
            <Card className="border-0 shadow-lg shadow-blue-100/50 dark:shadow-none dark:bg-slate-900 ring-1 ring-blue-200 dark:ring-blue-900/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div>
                  <CardTitle className="text-xl font-bold text-blue-700 dark:text-blue-400">Instrucciones de Embarque (IE)</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Genera y consulta el historial de las instrucciones enviadas a los operadores.</p>
                </div>
                <Link href="/ie">
                  <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Ir a Embarques
                  </Button>
                </Link>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Solo mostrar KPIs si NO es asistente comercial */}
          {role !== "asistente_comercial" ? (
            <>
              {/* Total */}
              <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 transition-all hover:-translate-y-1 hover:shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Registros</p>
                      <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{stats.total_registros}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pendientes */}
              <Card className="border-0 shadow-lg shadow-amber-100/50 dark:shadow-none dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 transition-all hover:-translate-y-1 hover:shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pendientes</p>
                      <p className="mt-2 text-3xl font-bold text-amber-500">{totalPendientes}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                      <Clock className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Procesados */}
              <Card className="border-0 shadow-lg shadow-emerald-100/50 dark:shadow-none dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 transition-all hover:-translate-y-1 hover:shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Procesados</p>
                      <p className="mt-2 text-3xl font-bold text-emerald-500">{totalProcesados}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Anulados */}
              <Card className="border-0 shadow-lg shadow-red-100/50 dark:shadow-none dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 transition-all hover:-translate-y-1 hover:shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Anulados</p>
                      <p className="mt-2 text-3xl font-bold text-red-500">{totalAnulados}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 dark:bg-red-900/20 dark:text-red-400">
                      <XCircle className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* KPIs Comerciales para Asistente */}
              <Card className="col-span-1 lg:col-span-2 border-0 shadow-lg shadow-blue-50/50 dark:shadow-none dark:bg-slate-900 ring-1 ring-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <ClipboardList className="h-6 w-6" />
                     </div>
                     <div>
                        <p className="text-sm font-medium text-slate-500">Historial de IEs</p>
                        <p className="text-2xl font-bold">Módulo de Exportación Activo</p>
                     </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-1 lg:col-span-2 border-0 shadow-lg shadow-slate-100/50 dark:shadow-none dark:bg-slate-900 ring-1 ring-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                        <LayoutDashboard className="h-6 w-6" />
                     </div>
                     <div>
                        <p className="text-sm font-medium text-slate-500">Estado de Cuenta</p>
                        <p className="text-2xl font-bold italic text-slate-400">Próximamente Analytics</p>
                     </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Gráficos y Top Transportistas */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Gráfico de tendencia solo si NO es asistente comercial */}
          {role !== "asistente_comercial" && (
            <Card className="col-span-1 lg:col-span-2 border-0 shadow-xl shadow-slate-200/40 dark:shadow-none dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
              <CardHeader>
                <CardTitle>Tendencia de Registros</CardTitle>
                <CardDescription>Volumen diario de operaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={porDiaChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
                      <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        labelStyle={{ color: '#64748b', marginBottom: '8px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#6366f1"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pie Chart: Distribution (Solo para roles con acceso total) */}
          {role !== "asistente_comercial" && (
            <Card className="border-0 shadow-xl shadow-slate-200/40 dark:shadow-none dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
              <CardHeader>
                <CardTitle>Distribución por Estado</CardTitle>
                <CardDescription>Proporción global de operaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={porEstadoPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                      >
                        {porEstadoPie.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bar Chart: Transportistas (Solo para roles con acceso total) */}
          {role !== "asistente_comercial" && (
            <Card className="border-0 shadow-xl shadow-slate-200/40 dark:shadow-none dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
              <CardHeader>
                <CardTitle>Top Transportistas</CardTitle>
                <CardDescription>Empresas con mayor volumen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={porTransportistaBar}
                      layout="vertical"
                      margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-slate-200 dark:stroke-slate-800" />
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="nombre"
                        width={140}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
