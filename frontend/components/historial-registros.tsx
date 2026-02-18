"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { listRegistros, getRegistroSap } from "@/lib/api";
import type { RegistroListado } from "@/lib/api";
import type { SapRow } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Search, ChevronLeft, ChevronRight, Check, Ban } from "lucide-react";
import { toast } from "sonner";
import { EstadoBadge } from "@/components/estado-badge";
import { cn } from "@/lib/utils";

const PAGE_SIZES = [10, 25, 50, 100] as const;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function minusDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

type Props = {
  onAddSapRow: (row: SapRow) => void;
  /** IDs que YA están en bandeja (para bloquear duplicados desde Historial) */
  bandejaIds?: Set<number>;
};

export function HistorialRegistros({ onAddSapRow, bandejaIds }: Props) {
  const [desde, setDesde] = useState(minusDaysISO(7));
  const [hasta, setHasta] = useState(todayISO());
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<RegistroListado[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * pageSize;
      const data = await listRegistros({ desde, hasta, limit: pageSize, offset });
      setRows(data.items);
      setTotal(data.total);
    } catch {
      toast.error("No se pudo cargar el historial");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [desde, hasta, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Al cambiar tamaño de página, volver a página 1
  const handlePageSizeChange = (value: string) => {
    const n = Number(value);
    if (PAGE_SIZES.includes(n as any)) {
      setPageSize(n);
      setPage(1);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Normaliza estado a lower-case para comparar robusto
  const isPendiente = useCallback((estado: unknown) => {
    return String(estado ?? "").trim().toLowerCase() === "pendiente";
  }, []);

  const addToBandeja = useCallback(
    async (registroId: number) => {
      // Blindaje: si ya está en bandeja, no hacemos nada (evita duplicados incluso si el UI fallara)
      if (bandejaIds?.has(registroId)) {
        toast.message(`El registro #${registroId} ya está en Bandeja SAP`);
        return;
      }

      setAddingId(registroId);
      try {
        const sap = await getRegistroSap(registroId);
        onAddSapRow({ registro_id: registroId, ...(sap as Record<string, unknown>) });
        toast.success(`Agregado a bandeja SAP (#${registroId})`);
      } catch {
        toast.error("No se pudo traer SAP para ese registro");
      } finally {
        setAddingId(null);
      }
    },
    [bandejaIds, onAddSapRow]
  );

  // Solo para UX: si hay bandejaIds, calculamos un fallback seguro
  const bandejaIdsSafe = useMemo(() => bandejaIds ?? new Set<number>(), [bandejaIds]);

  return (
    <div className="grid gap-4">
      {/* Filtros y selector de página */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:flex-row">
          <div className="grid gap-1">
            <label className="text-xs font-medium text-muted-foreground">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => {
                setDesde(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-medium text-muted-foreground">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => {
                setHasta(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-medium text-muted-foreground">Mostrar</label>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} registros
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={fetchData} disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Buscar
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="whitespace-nowrap">
            Mostrando {from}–{to} de {total}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              title="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[80px] text-center font-medium">
              Pág. {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              title="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[1100px]">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-10 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">ID</TableHead>
                  <TableHead className="h-10 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">FECHA</TableHead>
                  <TableHead className="h-10 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">BOOKING</TableHead>
                  <TableHead className="h-10 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">O/BETA</TableHead>
                  <TableHead className="h-10 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">AWB</TableHead>
                  <TableHead className="h-10 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">DAM</TableHead>
                  <TableHead className="h-10 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">ESTADO</TableHead>
                  <TableHead className="h-10 px-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Acción</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading && rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => {
                    const yaEnBandeja = bandejaIdsSafe.has(r.id);
                    const pendiente = isPendiente(r.estado);
                    const busy = addingId === r.id;

                    const disabled = busy || yaEnBandeja || !pendiente;

                    const label = yaEnBandeja
                      ? "En bandeja"
                      : !pendiente
                        ? "No disponible"
                        : "Bandeja SAP";

                    const Icon = busy
                      ? Loader2
                      : yaEnBandeja
                        ? Check
                        : !pendiente
                          ? Ban
                          : Plus;

                    return (
                      <TableRow key={r.id} className="group border-b border-border/40 transition-colors hover:bg-muted/50">
                        <TableCell className="px-3 py-2 font-mono text-xs text-foreground">#{r.id}</TableCell>
                        <TableCell className="px-3 py-2 text-sm text-foreground/90 whitespace-nowrap">
                          {String(r.fecha_registro).slice(0, 10)}
                        </TableCell>
                        <TableCell className="px-3 py-2 font-mono text-xs text-foreground/80">
                          {r.booking ?? "---"}
                        </TableCell>
                        <TableCell className="px-3 py-2 font-mono text-xs text-foreground/80">
                          {r.o_beta ?? "---"}
                        </TableCell>
                        <TableCell className="px-3 py-2 font-mono text-xs text-foreground/80">
                          {r.awb ?? "---"}
                        </TableCell>
                        <TableCell className="px-3 py-2 font-mono text-xs text-foreground/80">
                          {r.dam ?? "---"}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <EstadoBadge estado={r.estado ?? ""} className="w-[100px] shadow-sm transform scale-90 origin-left" />
                        </TableCell>
                        <TableCell className="px-3 py-2 text-right">
                          <Button
                            variant={yaEnBandeja ? "outline" : "secondary"}
                            size="sm"
                            onClick={() => addToBandeja(r.id)}
                            disabled={disabled}
                            className={cn(
                              "h-7 text-xs shadow-sm",
                              yaEnBandeja && "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900",
                              !pendiente && !yaEnBandeja && "opacity-50"
                            )}
                          >
                            <Icon
                              className={
                                busy
                                  ? "mr-1 h-3 w-3 animate-spin"
                                  : "mr-1 h-3 w-3"
                              }
                            />
                            {label}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}

                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Search className="h-8 w-8 opacity-20" />
                        <span className="text-sm">No se encontraron registros en este rango.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
