"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { listRegistros } from "@/lib/api";
import type { RegistroListado } from "@/lib/api";
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
import { Input } from "@/components/ui/input";
import { Loader2, Search, ChevronLeft, ChevronRight, Download, X } from "lucide-react";
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

export function HistorialRegistros() {
  const [desde, setDesde] = useState(minusDaysISO(7));
  const [hasta, setHasta] = useState(todayISO());
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<RegistroListado[]>([]);
  const [loading, setLoading] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState<string>("todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * pageSize;
      const data = await listRegistros({
        desde,
        hasta,
        limit: pageSize,
        offset,
        estado: estadoFilter === "todas" ? undefined : estadoFilter,
        search: searchQuery || undefined,
      });
      setRows(data.items);
      setTotal(data.total);
    } catch {
      toast.error("No se pudo cargar el historial");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [desde, hasta, page, pageSize, estadoFilter, searchQuery]);

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

  const exportHistorial = useCallback(() => {
    if (rows.length === 0) return;

    const headers = ["ID", "Fecha", "Estado", "Booking", "O. Beta", "AWB", "DAM", "DNI", "Chofer", "Transportista"];
    const csvContent = [
      headers.join(","),
      ...rows.map(r => [
        r.id,
        r.fecha_registro,
        r.estado,
        `"${(r.booking || "").replace(/"/g, '""')}"`,
        `"${(r.o_beta || "").replace(/"/g, '""')}"`,
        `"${(r.awb || "").replace(/"/g, '""')}"`,
        `"${(r.dam || "").replace(/"/g, '""')}"`,
        `"${(r.dni || "").replace(/"/g, '""')}"`,
        `"${(r.chofer || "").replace(/"/g, '""')}"`,
        `"${(r.transportista || "").replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `historial_registros_${desde}_al_${hasta}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [rows, desde, hasta]);

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (!isSearchExpanded) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery("");
    }
  };

  return (
    <div className="grid gap-4">
      {/* Filtros y buscador moderno */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between bg-white dark:bg-slate-950 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => {
                setDesde(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => {
                setHasta(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Estado</label>
            <Select value={estadoFilter} onValueChange={(val) => { setEstadoFilter(val); setPage(1); }}>
              <SelectTrigger className="h-10 w-[140px] rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                <SelectItem value="todas">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="procesado">Procesado</SelectItem>
                <SelectItem value="anulado">Anulado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <div className={cn(
              "relative flex items-center h-10 transition-all duration-300 ease-in-out overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
              isSearchExpanded ? "w-[240px] px-3 ring-2 ring-primary/20" : "w-10 px-0 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
            onClick={!isSearchExpanded ? toggleSearch : undefined}
            >
              <Search className={cn(
                "h-4 w-4 text-muted-foreground transition-colors",
                isSearchExpanded ? "mr-2" : "mx-auto"
              )} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar booking, dam..."
                value={searchQuery}
                onKeyDown={(e) => e.key === "Enter" && fetchData()}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/60 transition-opacity duration-200",
                  isSearchExpanded ? "opacity-100" : "opacity-0 invisible"
                )}
              />
              {isSearchExpanded && searchQuery && (
                <X 
                  className="h-3 w-3 text-muted-foreground cursor-pointer hover:text-foreground ml-1" 
                  onClick={() => setSearchQuery("")}
                />
              )}
            </div>
            {!isSearchExpanded && (
               <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-xl border-slate-200 hover:bg-slate-100"
                onClick={fetchData}
                disabled={loading}
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={exportHistorial}
            disabled={loading || rows.length === 0}
            className="h-10 px-4 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
          
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-[11px] font-bold px-2 min-w-[70px] text-center text-slate-600 dark:text-slate-300">
              PÁG. {page} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl overflow-hidden animate-in fade-in duration-500">
        <div className="w-full overflow-x-auto custom-scrollbar">
          <div className="min-w-[1100px]">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50/50">
                  <TableHead className="h-12 px-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">ID</TableHead>
                  <TableHead className="h-12 px-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">FECHA</TableHead>
                  <TableHead className="h-12 px-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">BOOKING</TableHead>
                  <TableHead className="h-12 px-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">O. BETA</TableHead>
                  <TableHead className="h-12 px-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">AWB</TableHead>
                  <TableHead className="h-12 px-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">DAM</TableHead>
                  <TableHead className="h-12 px-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">TRANSPORTISTA</TableHead>
                  <TableHead className="h-12 px-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">ESTADO</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading && rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                        <span className="text-sm font-medium text-slate-400 italic">Cargando registros...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id} className="group border-b border-slate-50 dark:border-slate-900 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <TableCell className="px-4 py-3.5 font-mono text-xs font-bold text-primary text-center">#{r.id}</TableCell>
                      <TableCell className="px-4 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-300 text-center whitespace-nowrap">
                        {String(r.fecha_registro).slice(0, 10)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 font-mono text-xs font-bold text-slate-700 dark:text-slate-200 text-center uppercase">
                        {r.booking ?? "---"}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 font-mono text-xs text-slate-500 text-center">
                        {r.o_beta ?? "---"}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 font-mono text-xs text-slate-500 text-center">
                        {r.awb ?? "---"}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 font-mono text-xs text-slate-500 text-center">
                        {r.dam ?? "---"}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-xs text-slate-500 text-center max-w-[200px] truncate">
                        {r.transportista ?? "---"}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-center">
                        <EstadoBadge estado={r.estado ?? ""} className="shadow-none" />
                      </TableCell>
                    </TableRow>
                  ))
                )}

                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-slate-300">
                        <Search className="h-12 w-12 opacity-10" />
                        <div className="text-sm font-medium">No se encontraron registros en este rango.</div>
                        <p className="text-xs text-slate-400">Intenta ajustar los filtros de fecha o estado.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Total: <span className="text-primary">{total}</span> REGISTROS
          </div>
          <div className="flex items-center gap-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registros por página:</label>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-8 w-[110px] rounded-lg border-slate-200 bg-white font-bold text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                {PAGE_SIZES.map((n) => (
                  <SelectItem key={n} value={String(n)} className="text-[11px] font-medium">
                    {n} filas
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
