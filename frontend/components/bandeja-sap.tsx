"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import {
  Search,
  Download,
  Filter,
  MoreHorizontal,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Edit2,
  Trash2,
  Eye,
  FileSpreadsheet,
  RefreshCcw,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

// --- Tipos de Datos ---
interface FilaSap {
  registro_id: number
  FECHA: string
  O_BETA: string
  BOOKING: string
  AWB: string
  MARCA: string
  PLACAS: string
  DNI: string
  CHOFER: string
  LICENCIA: string
  TERMOGRAFOS: string
  CODIGO_SAP: string
  TRANSPORTISTA: string
  PS_BETA: string
  PS_ADUANA: string
  PS_OPERADOR: string
  SENASA_PS_LINEA: string
  N_DAM: string
  P_REGISTRAL: string
  CER_VEHICULAR: string
  RUC: string
  estado?: string
  processed_at?: string
}

export function BandejaSAP() {
  const [data, setData] = useState<FilaSap[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState("pendientes")
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [isExporting, setIsExporting] = useState(false)

  // Cargar datos según la pestaña seleccionada
  const fetchData = async () => {
    setLoading(true)
    try {
      let endpoint = "/registros/pendientes"
      if (selectedTab === "procesados") {
        const hoy = format(new Date(), "yyyy-MM-dd")
        endpoint = `/registros/procesados?fecha=${hoy}`
      }
      
      const response = await api.get(endpoint)
      setData(response.data.items || [])
    } catch (error) {
      console.error("Error al cargar datos de bandeja SAP:", error)
      toast.error("No se pudo cargar la información de la bandeja SAP")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedTab])

  // Filtrado de datos
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const searchStr = `${item.BOOKING} ${item.O_BETA} ${item.AWB} ${item.TRANSPORTISTA} ${item.CHOFER}`.toLowerCase()
      return searchStr.includes(searchTerm.toLowerCase())
    })
  }, [data, searchTerm])

  // Manejo de exportación
  const handleExport = async () => {
    if (selectedRows.length === 0) {
      toast.warning("Selecciona al menos un registro para exportar")
      return
    }

    setIsExporting(true)
    try {
      const response = await api.post(
        "/registros/export/sap-xlsx",
        { registro_ids: selectedRows },
        { responseType: "blob" }
      )
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `export-sap-${format(new Date(), "yyyy-MM-dd")}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.success("Exportación completada")
    } catch (error) {
      console.error("Error al exportar SAP:", error)
      toast.error("Error al generar el archivo Excel")
    } finally {
      setIsExporting(false)
    }
  }

  // Selección de filas
  const toggleRow = (id: number) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedRows.length === filteredData.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(filteredData.map((item) => item.registro_id))
    }
  }

  return (
    <Card className="w-full border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-green-600" />
              Bandeja SAP
            </CardTitle>
            <CardDescription>
              Gestión y exportación de registros para el sistema SAP
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="h-9"
              disabled={loading}
            >
              <RefreshCcw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
              Actualizar
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleExport}
              className="h-9 bg-green-600 hover:bg-green-700"
              disabled={isExporting || selectedRows.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar ({selectedRows.length})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="pendientes" className="rounded-md">
                Pendientes
              </TabsTrigger>
              <TabsTrigger value="procesados" className="rounded-md">
                Procesados (Hoy)
              </TabsTrigger>
            </TabsList>
            
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por Booking, O. Beta, AWB..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 bg-background border-muted-foreground/20 focus:border-green-500 transition-all"
              />
            </div>
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      checked={selectedRows.length > 0 && selectedRows.length === filteredData.length}
                      onChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>O. Beta</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>AWB / Contenedor</TableHead>
                  <TableHead>Transportista</TableHead>
                  <TableHead>Chofer</TableHead>
                  <TableHead>Placas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9} className="h-16 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4 animate-pulse" />
                          Cargando...
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      No se encontraron registros
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.registro_id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          checked={selectedRows.includes(item.registro_id)}
                          onChange={() => toggleRow(item.registro_id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {format(new Date(item.FECHA), "dd MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono bg-blue-50 text-blue-700 border-blue-200">
                          {item.O_BETA}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.BOOKING}</TableCell>
                      <TableCell className="font-mono text-sm font-semibold">{item.AWB}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {item.TRANSPORTISTA}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {item.CHOFER}
                      </TableCell>
                      <TableCell>{item.PLACAS}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <Eye className="w-4 h-4" /> Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <Edit2 className="w-4 h-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="flex items-center gap-2 text-destructive">
                              <Trash2 className="w-4 h-4" /> Anular
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
