"use client";

import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, Factory, MapPin, Hash, Save, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Planta {
  id: number;
  planta: string;
  centro: string | null;
  direccion: string;
  distrito: string | null;
  provincia: string | null;
  departamento: string | null;
  ubigeo: string;
}

export default function PlantasPage() {
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [editCentros, setEditCentros] = useState<Record<number, string>>({});
  const { toast } = useToast();

  const fetchPlantas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/maestros/plantas`);
      if (!response.ok) throw new Error("Error cargando plantas");
      const data = await response.json();
      setPlantas(data);
      
      // Inicializar estado de edición con los centros actuales
      const initialCentros: Record<number, string> = {};
      data.forEach((p: Planta) => {
        initialCentros[p.id] = p.centro || "";
      });
      setEditCentros(initialCentros);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el maestro de plantas."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlantas();
  }, []);

  const handleCentroChange = (id: number, value: string) => {
    setEditCentros(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveCentro = async (planta: Planta) => {
    const nuevoCentro = editCentros[planta.id];
    
    // Si no ha cambiado, no hacer nada
    if (nuevoCentro === planta.centro) return;

    try {
      setSavingId(planta.id);
      // Aquí asumo un endpoint PATCH o PUT que acepte el centro. 
      // Si no existe, lo creamos en el backend o usamos el genérico de actualización.
      // Por ahora, simulamos el éxito si el endpoint no está implementado para centro específico.
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/maestros/plantas/${planta.id}/centro?centro=${nuevoCentro}`, {
        method: 'PATCH'
      });

      if (!response.ok) throw new Error("Error guardando centro");

      toast({
        title: "Centro Actualizado",
        description: `La planta ${planta.planta} ahora tiene el centro ${nuevoCentro}.`,
      });
      
      // Actualizar localmente
      setPlantas(prev => prev.map(p => p.id === planta.id ? { ...p, centro: nuevoCentro } : p));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "Hubo un problema al actualizar el código de centro."
      });
    } finally {
      setSavingId(null);
    }
  };

  const filteredPlantas = plantas.filter(p => 
    p.planta.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.distrito || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
          <Factory className="h-8 w-8 text-indigo-600" />
          MAESTRO DE PLANTAS
        </h1>
        <p className="text-slate-500 font-medium">
          Configuración de Sedes y Códigos de Trazabilidad Dinámica.
        </p>
      </div>

      <Card className="border-none shadow-2xl shadow-indigo-100/50 overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b bg-white/50 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Hash className="h-5 w-5 text-indigo-500" />
                Catálogo de Sedes Oficiales
              </CardTitle>
              <CardDescription>
                Define el código de centro para la trazabilidad del Anexo 1.
              </CardDescription>
            </div>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar planta o distrito..." 
                className="pl-10 bg-white/50 border-slate-200 focus:ring-indigo-500 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="w-[300px] font-bold text-slate-600 uppercase text-[10px] tracking-widest pl-6">Planta / Sede</TableHead>
                <TableHead className="w-[200px] font-bold text-slate-600 uppercase text-[10px] tracking-widest text-center">Código Centro (MTC)</TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-widest">Ubicación Geográfica</TableHead>
                <TableHead className="w-[150px] font-bold text-slate-600 uppercase text-[10px] tracking-widest text-right pr-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell colSpan={4} className="h-16 bg-slate-50/20"></TableCell>
                  </TableRow>
                ))
              ) : filteredPlantas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                      <AlertCircle className="h-8 w-8" />
                      <p className="font-medium">No se encontraron plantas con esos criterios.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlantas.map((planta) => (
                  <TableRow key={planta.id} className="group hover:bg-indigo-50/30 transition-colors border-slate-100">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100/50 rounded-lg text-indigo-600 group-hover:scale-110 transition-transform">
                          <Factory className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{planta.planta}</p>
                          <p className="text-[11px] text-slate-500 font-medium">UBIGEO: {planta.ubigeo}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <div className="relative w-32 group/input">
                          <Input
                            value={editCentros[planta.id] || ""}
                            onChange={(e) => handleCentroChange(planta.id, e.target.value)}
                            className="text-center font-black tracking-widest border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 h-9 rounded-lg bg-white/50"
                            placeholder="Ej: 4102"
                            maxLength={10}
                          />
                          {editCentros[planta.id] !== planta.centro && (
                            <div className="absolute -top-1 -right-1 h-3 w-3 bg-amber-500 rounded-full border-2 border-white animate-bounce" title="Cambios sin guardar" />
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="bg-slate-100/50 border-slate-200 text-slate-600 text-[10px] font-bold">
                            {planta.distrito || "S/D"}
                          </Badge>
                          <span className="text-slate-300">/</span>
                          <span className="text-slate-600 text-[11px] font-medium">{planta.provincia}, {planta.departamento}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button
                        size="sm"
                        disabled={savingId === planta.id || editCentros[planta.id] === planta.centro}
                        onClick={() => handleSaveCentro(planta)}
                        className={`rounded-xl transition-all duration-300 ${
                          editCentros[planta.id] !== planta.centro 
                            ? "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200" 
                            : "bg-slate-100 text-slate-400 border-none"
                        }`}
                      >
                        {savingId === planta.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : editCentros[planta.id] === planta.centro ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        <span className="ml-2 hidden md:inline">
                          {editCentros[planta.id] === planta.centro ? "Guardado" : "Guardar"}
                        </span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-4 items-start shadow-sm shadow-amber-100/50">
        <div className="p-2 bg-amber-100 rounded-xl text-amber-600 shrink-0">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-amber-900 font-bold text-sm">Información de Trazabilidad Dinámica 🛰️</p>
          <p className="text-amber-800/80 text-xs leading-relaxed font-medium">
            El código configurado aquí como <strong>"Centro"</strong> se utiliza automáticamente en la generación de los documentos oficiales (Anexo 1). 
            La trazabilidad se genera siguiendo la fórmula: <code>[Centro] + [Fecha DDMMYY]</code>. 
            Ejemplo: Si Ica tiene centro <strong>4102</strong> y hoy es <strong>07/04/26</strong>, el código será <strong>4102070426</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
