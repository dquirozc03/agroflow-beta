"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
} from "recharts";
import { ClipboardList, TableProperties, History, LayoutDashboard, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { canSeeCapturaAndBandeja } from "@/lib/constants";
import { getDashboardStats, type DashboardStatsResponse } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

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

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-sm font-medium">Por estado</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-help text-muted-foreground" tabIndex={0}>
                    <HelpCircle className="h-3.5 w-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[220px]">
                  Distribución de registros por estado. Rojo = anulados, verde = procesados, amarillo = pendientes.
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              {porEstadoPie.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
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
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Sin datos
                </div>
              )}
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
