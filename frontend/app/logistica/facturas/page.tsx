"use client";

import React, { useEffect, useState, Suspense } from "react"
import { format } from "date-fns"
import * as XLSX from "xlsx"
import { TriangleAlert, Download } from "lucide-react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"

interface Factura {
    id: number
    proveedor_ruc: string
    proveedor_razon_social: string
    serie_correlativo: string
    fecha_emision: string
    moneda: string
    forma_pago: string | null
    subtotal: number
    contenedor: string | null
    advertencia: string | null
    descripcion: string | null
    unidad_medida: string | null
}

function FacturasLogisticasContent() {
    const [facturas, setFacturas] = useState<Factura[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchFacturas()
    }, [])

    const fetchFacturas = async () => {
        try {
            setLoading(true)
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
            const res = await fetch(`${apiUrl}/api/v1/agroflow/logistica/facturas`)
            if (!res.ok) throw new Error("Error al obtener las facturas")
            const data = await res.json()
            setFacturas(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const exportToExcel = () => {
        // Preparar data para excel
        const excelData = facturas.map((f) => ({
            "RUC Operador": f.proveedor_ruc,
            "Nombre Operador": f.proveedor_razon_social,
            "Comprobante": f.serie_correlativo,
            "Fecha Emisión": f.fecha_emision ? format(new Date(f.fecha_emision), "dd/MM/yyyy") : "",
            "Moneda": f.moneda,
            "Forma de Pago": f.forma_pago || "No especificado",
            "Descripción": f.descripcion || "Sin descripción",
            "U.M.": f.unidad_medida || "ZZ",
            "Valor de Venta Neto": f.subtotal,
            "AWB / Contenedor": f.contenedor || "",
            "Advertencia Validaciones": f.advertencia || "Ninguna"
        }))

        const ws = XLSX.utils.json_to_sheet(excelData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Facturas")
        XLSX.writeFile(wb, "Facturas_Logisticas.xlsx")
    }

    return (
        <div className="flex min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
            <AppSidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <AppHeader />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="mx-auto max-w-[1400px] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Facturas Logísticas</h1>
                                <p className="text-slate-500 dark:text-slate-400">
                                    Gestión de comprobantes y extracción inteligente de servicios
                                </p>
                            </div>
                            <Button onClick={exportToExcel} disabled={facturas.length === 0} className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20">
                                <Download className="mr-2 h-4 w-4" />
                                Exportar a Excel
                            </Button>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
                                {error}
                            </div>
                        )}

                        <Card className="overflow-hidden border-none bg-white shadow-xl dark:bg-slate-900">
                            <Table>
                                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                                    <TableRow className="border-slate-100 dark:border-slate-800">
                                        <TableHead className="px-6">Operador / RUC</TableHead>
                                        <TableHead className="px-6">Comprobante</TableHead>
                                        <TableHead className="px-6">Descripción de Servicios</TableHead>
                                        <TableHead className="px-6 text-center">UM</TableHead>
                                        <TableHead className="px-6 text-center">F. Emisión</TableHead>
                                        <TableHead className="px-6">Forma Pago</TableHead>
                                        <TableHead className="px-6 text-right">Valor Venta</TableHead>
                                        <TableHead className="px-6 text-center">AWB / Cont.</TableHead>
                                        <TableHead className="px-6 text-center">Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-20 text-slate-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                                    Cargando facturas...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : facturas.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-20 text-slate-500">
                                                No hay facturas registradas. Los XMLs subidos a Drive aparecerán aquí.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        facturas.map((f) => (
                                            <TableRow key={f.id} className="border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                <TableCell className="px-4 py-4 min-w-[180px]">
                                                    <div className="font-bold text-slate-900 dark:text-white leading-tight">{f.proveedor_razon_social}</div>
                                                    <div className="text-[10px] text-slate-500 font-mono">ID {f.proveedor_ruc}</div>
                                                </TableCell>
                                                <TableCell className="px-4 font-mono text-[11px] font-bold">{f.serie_correlativo}</TableCell>
                                                <TableCell className="px-4">
                                                    <div className="text-[12px] font-medium text-slate-700 dark:text-slate-300 line-clamp-2 max-w-[300px]">
                                                        {f.descripcion || "SERVICIOS LOGISTICOS"}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 text-center">
                                                    <Badge variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                                        {f.unidad_medida || "ZZ"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-4 text-center text-xs">{f.fecha_emision ? format(new Date(f.fecha_emision), "dd/MM") : "-"}</TableCell>
                                                <TableCell className="px-4 text-[10px] text-slate-600 dark:text-slate-400 capitalize">{f.forma_pago?.toLowerCase() || "-"}</TableCell>
                                                <TableCell className="px-4 text-right font-bold text-slate-900 dark:text-white">
                                                    <div className="text-[10px] text-muted-foreground mr-1 inline">{f.moneda}</div>
                                                    {Number(f.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="px-4 text-center">
                                                    {f.contenedor ? (
                                                        <Badge variant="outline" className="text-[10px] font-mono bg-blue-50/50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800 px-1.5 py-0">
                                                            {f.contenedor}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-4 text-center">
                                                    {f.advertencia ? (
                                                        <div className="flex justify-center" title={f.advertencia}>
                                                            <Badge variant="destructive" className="cursor-help gap-1 text-[10px] px-1.5 py-0">
                                                                <TriangleAlert className="w-3 h-3" /> BETA
                                                            </Badge>
                                                        </div>
                                                    ) : (
                                                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 text-[10px] px-1.5 py-0">
                                                            OK
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default function FacturasLogisticasPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center text-muted-foreground">Cargando módulo logístico...</div>}>
            <FacturasLogisticasContent />
        </Suspense>
    )
}

