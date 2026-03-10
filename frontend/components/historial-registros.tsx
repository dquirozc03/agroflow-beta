"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
  const searchContainerRef = useRef<HTMLDivElement>(null);

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

  const exportHistorial = useCallback(async () => {
    if (rows.length === 0) return;

    try {
      const ExcelJS = (await import("exceljs")).default;
      const { saveAs } = (await import("file-saver")).default as any;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Historial de Registros");

      // 1. Definir Columnas
      const columns = [
        { header: "ID", key: "id", width: 10 },
        { header: "FECHA REGISTRO", key: "fecha", width: 18 },
        { header: "ESTADO", key: "estado", width: 15 },
        { header: "O_BETA", key: "o_beta", width: 15 },
        { header: "BOOKING", key: "booking", width: 18 },
        { header: "AWB / CONTENEDOR", key: "awb", width: 22 },
        { header: "DAM", key: "dam", width: 15 },
        { header: "MARCA", key: "marca", width: 15 },
        { header: "PLACAS", key: "placas", width: 15 },
        { header: "DNI CHOFER", key: "dni", width: 15 },
        { header: "NOMBRES CHOFER", key: "chofer", width: 25 },
        { header: "LICENCIA", key: "licencia", width: 15 },
        { header: "TERMÓGRAFOS", key: "termografos", width: 20 },
        { header: "CÓDIGO SAP", key: "codigo_sap", width: 15 },
        { header: "TRANSPORTISTA", key: "transportista", width: 30 },
        { header: "PRECINTOS BETA", key: "ps_beta", width: 20 },
        { header: "PRECINTO ADUANA", key: "ps_aduana", width: 18 },
        { header: "PRECINTO OPERADOR", key: "ps_operador", width: 18 },
        { header: "SENASA/LINEA", key: "ps_linea", width: 20 },
        { header: "PARTIDA REGISTRAL", key: "p_registral", width: 20 },
        { header: "CERT. VEHICULAR", key: "cer_vehicular", width: 20 },
      ];

      worksheet.columns = columns;

      // 2. Estilizar Encabezados
      const headerRow = worksheet.getRow(1);
      headerRow.height = 30;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1E293B" }, // Slate 800
        };
        cell.font = {
          color: { argb: "FFFFFFFF" },
          bold: true,
          size: 11,
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FF475569" } },
        };
      });

      // 3. Añadir Datos
      rows.forEach((r, idx) => {
        const rowData = {
          id: r.id,
          fecha: String(r.fecha_registro).slice(0, 10),
          estado: (r.estado || "").toUpperCase(),
          o_beta: r.o_beta || "—",
          booking: r.booking || "—",
          awb: r.awb || "—",
          dam: r.dam || "—",
          marca: r.marca || "—",
          placas: r.placas || "—",
          dni: r.dni || "—",
          chofer: r.chofer || "—",
          licencia: r.licencia || "—",
          termografos: r.termografos || "—",
          codigo_sap: r.codigo_sap || "—",
          transportista: r.transportista || "—",
          ps_beta: r.ps_beta || "—",
          ps_aduana: r.ps_aduana || "—",
          ps_operador: r.ps_operador || "—",
          ps_linea: r.senasa_ps_linea || "—",
          p_registral: r.p_registral || "—",
          cer_vehicular: r.cer_vehicular || "—",
        };
        const row = worksheet.addRow(rowData);
        
        // Celdas centradas y con bordes tenues
        row.eachCell((cell) => {
          cell.alignment = { 
            vertical: "middle", 
            horizontal: "center",
            wrapText: true // <--- Esto permite que el texto largo baje de línea
          };
          cell.border = {
            bottom: { style: "thin", color: { argb: "FFF1F5F9" } },
          };
          if (idx % 2 === 1) {
             cell.fill = {
               type: "pattern",
               pattern: "solid",
               fgColor: { argb: "FFF8FAFC" } // Slate 50
             };
          }
        });
      });

      // 4. Formatear como Tabla (opcional, pero ExcelJS no tiene un "addTable" tan simple con estilos automáticos sin que rompa en algunos visores, así que lo hacemos manual con filtros)
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: columns.length },
      };

      // 5. Generar archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `HISTORIAL_REGISTROS_${desde}_AL_${hasta}.xlsx`);
      
      toast.success("Excel generado correctamente.");
    } catch (e: any) {
      console.error(e);
      toast.error("Error al generar el Excel.");
    }
  }, [rows, desde, hasta]);

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (!isSearchExpanded) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchExpanded(false);
      }
    };
    if (isSearchExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchExpanded]);

  const headBase = "px-3 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 text-center whitespace-nowrap z-20 sticky top-0";
  const cellBase = "px-3 py-4 align-middle text-[13px] text-slate-600 dark:text-slate-300 border-b border-slate-50 dark:border-slate-900 transition-colors group-hover:bg-primary/5 dark:group-hover:bg-primary/10 leading-tight whitespace-normal break-words text-center";
  const cellMono = "font-mono text-xs font-bold text-primary";

  return (
    <div className="grid gap-6 animate-in fade-in duration-700">
      {/* 🔍 Filtros y buscador moderno */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/20 dark:border-slate-800/50 transition-all hover:shadow-2xl">
        <div className="flex flex-wrap items-end gap-4">
          <div className="grid gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 ml-1">Rango Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => {
                setDesde(e.target.value);
                setPage(1);
              }}
              className="h-11 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary/10 transition-all outline-none shadow-sm"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 ml-1">Rango Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => {
                setHasta(e.target.value);
                setPage(1);
              }}
              className="h-11 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary/10 transition-all outline-none shadow-sm"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 ml-1">Estatus Global</label>
            <Select value={estadoFilter} onValueChange={(val) => { setEstadoFilter(val); setPage(1); }}>
              <SelectTrigger className="h-11 w-[160px] rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl p-1">
                <SelectItem value="todas" className="rounded-xl font-bold">Todos los Estatus</SelectItem>
                <SelectItem value="pendiente" className="rounded-xl font-bold">Pendientes</SelectItem>
                <SelectItem value="procesado" className="rounded-xl font-bold">Procesados</SelectItem>
                <SelectItem value="anulado" className="rounded-xl font-bold">Anulados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <div 
              ref={searchContainerRef}
              className={cn(
                "relative flex items-center h-11 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm",
                isSearchExpanded ? "w-[280px] px-4 ring-4 ring-primary/10" : "w-11 px-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
              onClick={!isSearchExpanded ? toggleSearch : undefined}
            >
              <Search className={cn(
                "h-5 w-5 text-slate-400 transition-all duration-300",
                isSearchExpanded ? "mr-3 text-primary" : "mx-auto"
              )} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Escanea o escribe..."
                value={searchQuery}
                onKeyDown={(e) => e.key === "Enter" && fetchData()}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "bg-transparent border-none outline-none text-sm font-bold text-slate-700 dark:text-slate-200 w-full placeholder:text-slate-300 transition-opacity duration-300",
                  isSearchExpanded ? "opacity-100" : "opacity-0 invisible"
                )}
              />
              {isSearchExpanded && searchQuery && (
                <X 
                  className="h-4 w-4 text-slate-300 cursor-pointer hover:text-red-500 ml-1 transition-colors" 
                  onClick={(e) => { e.stopPropagation(); setSearchQuery(""); }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={exportHistorial}
            disabled={loading || rows.length === 0}
            className="h-11 px-6 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-black text-[11px] uppercase tracking-[0.1em] text-slate-700 dark:text-slate-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 border-none ring-1 ring-slate-200/50"
          >
            <Download className="h-4 w-4 text-primary" />
            Exportar Excel
          </Button>
          
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm active:scale-90"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-[10px] font-black px-3 min-w-[90px] text-center text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
              PAG. <span className="text-primary text-xs">{page}</span> / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm active:scale-90"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 📊 Tabla Principal Premium */}
      <div className="rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden flex flex-col transition-all">
        <div className="w-full overflow-x-auto custom-scrollbar max-h-[700px]">
          <div className="min-w-[1200px]">
            <Table className="table-fixed">
              <TableHeader className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-sm">
                <TableRow className="border-b border-slate-100 dark:border-slate-800 hover:bg-transparent">
                  <TableHead className={cn(headBase, "w-[90px]")}>ID</TableHead>
                  <TableHead className={cn(headBase, "w-[150px]")}>Fecha Registro</TableHead>
                  <TableHead className={cn(headBase, "w-[150px]")}>Booking</TableHead>
                  <TableHead className={cn(headBase, "w-[150px]")}>O. Beta</TableHead>
                  <TableHead className={cn(headBase, "w-[180px]")}>AWB (AirWay Bill)</TableHead>
                  <TableHead className={cn(headBase, "w-[150px]")}>Estado</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading && rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-32 text-center bg-slate-50/20">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                           <Loader2 className="h-12 w-12 animate-spin text-primary/30" />
                           <div className="absolute inset-0 flex items-center justify-center">
                              <span className="h-2 w-2 bg-primary rounded-full animate-ping"></span>
                           </div>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Sincronizando Historial...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r, idx) => (
                    <TableRow 
                      key={r.id} 
                      className={cn(
                        "group border-b border-slate-50 dark:border-slate-900 transition-all duration-300",
                        idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/20 dark:bg-slate-900/10",
                        "hover:bg-primary/[0.03] dark:hover:bg-primary/[0.05]"
                      )}
                    >
                      <TableCell className={cn(cellBase, cellMono, "text-primary/70")}>
                         <div className="flex items-center justify-center gap-1">
                            <span className="text-[10px] opacity-30">#</span>
                            {r.id}
                         </div>
                      </TableCell>
                      <TableCell className={cn(cellBase, "font-black text-slate-800 dark:text-slate-200")}>
                        {String(r.fecha_registro).slice(0, 10)}
                      </TableCell>
                      <TableCell className={cn(cellBase, "font-mono font-black text-slate-900 dark:text-white text-sm tracking-tight")}>
                        {r.booking ?? "—"}
                      </TableCell>
                      <TableCell className={cn(cellBase, "font-medium opacity-70")}>
                        {r.o_beta ?? "—"}
                      </TableCell>
                      <TableCell className={cn(cellBase, "font-mono text-[11px] opacity-60")}>
                        {r.awb ?? "—"}
                      </TableCell>
                      <TableCell className={cn(cellBase)}>
                        <EstadoBadge estado={r.estado ?? ""} className="shadow-2xl scale-90 ring-1 ring-white/10" />
                      </TableCell>
                    </TableRow>
                  ))
                )}

                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-32 text-center bg-slate-50/10">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="size-20 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-2">
                           <Search className="h-8 w-8 text-slate-200" />
                        </div>
                        <div className="text-sm font-black text-slate-400 uppercase tracking-widest">Sin coincidencias</div>
                        <p className="text-xs text-slate-400 max-w-[200px] mx-auto leading-relaxed italic opacity-70">
                          Ajusta los filtros de fecha o utiliza el buscador para localizar registros específicos.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="px-8 py-5 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="size-2 bg-primary rounded-full animate-pulse shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
               Balance Total: <span className="text-slate-900 dark:text-white text-sm ml-1 font-black">{total}</span> DOCUMENTOS
             </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Vista:</label>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="h-9 w-[115px] rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-black text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-2xl p-1">
                  {PAGE_SIZES.map((n) => (
                    <SelectItem key={n} value={String(n)} className="text-[11px] font-black rounded-lg">
                      {n} FILAS
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
