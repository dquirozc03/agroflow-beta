"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, TableProperties, History, LayoutDashboard, Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { useAuth } from "@/contexts/auth-context";
import { canSeeCapturaAndBandeja } from "@/lib/constants";
import { getDashboardStats, type DashboardStatsResponse } from "@/lib/api";
import { HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const COLOR_PENDIENTE = "hsl(var(--chart-3))";
const COLOR_PROCESADO = "hsl(var(--accent))";
const COLOR_ANULADO = "hsl(var(--destructive))";

function minusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function DashboardContent() {
  const { user } = useAuth();
  const role = user?.rol;
  const showCapturaBandeja = canSeeCapturaAndBandeja(role ?? "documentaria");

  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    getDashboardStats({ dias: 30 })
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
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
        {error ?? "Sin datos"}
      </div>
    );
  }

  const porDiaChart = stats.por_dia.map((d) => ({
    fecha: d.fecha.slice(5),
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

  return (
    <TooltipProvider>
      <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-card-foreground">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Resumen de registros según tu acceso. Últimos 30 días.
          </p>
        </div>

        {/* Accesos directos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <LayoutDashboard className="h-4 w-4" />
              Accesos directos
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {showCapturaBandeja && (
              <>
                <Button variant="outline" size="sm" asChild className="gap-2">
                  <Link href="/?tab=captura">
                    <ClipboardList className="h-4 w-4" />
                    Captura
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="gap-2">
                  <Link href="/?tab=bandeja">
                    <TableProperties className="h-4 w-4" />
                    Bandeja SAP
                  </Link>
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" asChild className="gap-2">
              <Link href="/?tab=historial">
                <History className="h-4 w-4" />
                Historial
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* KPI */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground">Total (30 d)</p>
              <p className="text-2xl font-bold text-foreground">{stats.total_registros}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground">Pendientes</p>
              <p className="text-2xl font-bold text-chart-3">
                {stats.por_estado.find((e) => e.estado === "pendiente")?.total ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground">Procesados</p>
              <p className="text-2xl font-bold text-accent">
                {stats.por_estado.find((e) => e.estado === "procesado")?.total ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground">Anulados</p>
              <p className="text-2xl font-bold text-destructive">
                {stats.por_estado.find((e) => e.estado === "anulado")?.total ?? 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-sm font-medium">Registros por día</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex cursor-help text-muted-foreground" tabIndex={0}>
                      <HelpCircle className="h-3.5 w-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[220px]">
                    Cantidad de registros creados cada día (pendientes, procesados y anulados). El rojo corresponde a anulados.
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porDiaChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RechartsTooltip
                      contentStyle={{ fontSize: 12 }}
                      labelFormatter={(label) => `Día ${label}`}
                    />
                    <Bar dataKey="pendientes" name="Pendientes" stackId="a" fill={COLOR_PENDIENTE} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="procesados" name="Procesados" stackId="a" fill={COLOR_PROCESADO} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="anulados" name="Anulados" stackId="a" fill={COLOR_ANULADO} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Pendientes */}
            <Card className="border-0 shadow-lg shadow-amber-100/50 dark:shadow-none dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 transition-all hover:-translate-y-1 hover:shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pendientes</p>
                    <p className="mt-2 text-3xl font-bold text-amber-500">{stats.por_estado.find((e) => e.estado === "pendiente")?.total ?? 0}</p>
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
                    <p className="mt-2 text-3xl font-bold text-emerald-500">{stats.por_estado.find((e) => e.estado === "procesado")?.total ?? 0}</p>
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
                    <p className="mt-2 text-3xl font-bold text-red-500">{stats.por_estado.find((e) => e.estado === "anulado")?.total ?? 0}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    <XCircle className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Access to New Module */}
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

          {/* Main Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Area Chart: Activity Over Time */}
            <Card className="col-span-1 lg:col-span-2 border-0 shadow-xl shadow-slate-200/40 dark:shadow-none dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
              <CardHeader>
                <CardTitle>Tendencia de Registros</CardTitle>
                <p className="text-sm text-muted-foreground">Volumen diario de operaciones</p>
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

            {/* Pie Chart: Distribution */}
            <Card className="border-0 shadow-xl shadow-slate-200/40 dark:shadow-none dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
              <CardHeader>
                <CardTitle>Distribución por Estado</CardTitle>
                <p className="text-sm text-muted-foreground">Proporción global de operaciones</p>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {porEstadoPie.length > 0 ? (
                      <PieChart>
                        <Pie
                          data={porEstadoPie}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                        >
                          {porEstadoPie.map((_, i) => (
                            <Cell key={i} fill={porEstadoPie[i].color} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value: number) => [value, ""]} />
                        <Legend />
                      </PieChart>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Sin datos
                      </div>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {stats.por_transportista.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-1.5">
                  <CardTitle className="text-sm font-medium">Top transportistas (registros)</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-help text-muted-foreground" tabIndex={0}>
                        <HelpCircle className="h-3.5 w-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[220px]">
                      Los 8 transportistas con más registros en el periodo. Ordenados de mayor a menor.
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={porTransportistaBar}
                      layout="vertical"
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="nombre" width={120} tick={{ fontSize: 10 }} />
                      <RechartsTooltip contentStyle={{ fontSize: 12 }} />
                      <Bar dataKey="total" name="Registros" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
    </TooltipProvider>
  );
}
