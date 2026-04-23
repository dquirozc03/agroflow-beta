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
import { 
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Search,
  Factory,
  MapPin,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/constants";
import { PlantaModal } from "@/components/planta-modal";
import { DeleteConfirmModal } from "@/components/delete-confirm-modal";
import { toast } from "sonner";

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
  const [statusModal, setStatusModal] = useState<{ open: boolean; type: 'success' | 'error'; title: string; message: string }>({
    open: false,
    type: 'success',
    title: '',
    message: ''
  });
  
  // Paginación
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanta, setEditingPlanta] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [plantaToDelete, setPlantaToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteSuccess, setIsDeleteSuccess] = useState(false);

  const fetchPlantas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/maestros/plantas`);
      if (!response.ok) throw new Error("Error cargando plantas");
      const data = await response.json();
      setPlantas(data);
      
      const initialCentros: Record<number, string> = {};
      data.forEach((p: Planta) => {
        initialCentros[p.id] = p.centro || "";
      });
      setEditCentros(initialCentros);
    } catch (error) {
      toast.error("No se pudo cargar el maestro de plantas.");
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
    if (nuevoCentro === planta.centro) return;

    try {
      setSavingId(planta.id);
      const response = await fetch(`${API_BASE_URL}/api/v1/maestros/plantas/${planta.id}/centro?centro=${nuevoCentro}`, {
        method: 'PATCH'
      });

      if (!response.ok) throw new Error("Error guardando centro");

      setPlantas(prev => prev.map(p => p.id === planta.id ? { ...p, centro: nuevoCentro } : p));
      setStatusModal({
        open: true,
        type: 'success',
        title: "¡Centro Actualizado!",
        message: `La planta ${planta.planta} ahora tiene el centro ${nuevoCentro} vinculado.`
      });
      setTimeout(() => setStatusModal(prev => ({ ...prev, open: false })), 3000);
    } catch (error) {
      setStatusModal({
        open: true,
        type: 'error',
        title: "Error de Sincronización",
        message: "Hubo un problema al actualizar el código de centro. Verifique la conexión."
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteInit = (id: number) => {
    setPlantaToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!plantaToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/maestros/plantas/${plantaToDelete}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setIsDeleteSuccess(true);
        setTimeout(() => {
          setIsDeleteModalOpen(false);
          setIsDeleteSuccess(false);
          setPlantaToDelete(null);
          fetchPlantas();
        }, 1500);
      }
    } catch (error) {
      toast.error("Error al intentar eliminar sede");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPlantas = plantas.filter(p => 
    p.planta.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.distrito || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPlantas.length / itemsPerPage);
  const currentPlantas = filteredPlantas.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen font-['Inter'] animate-in fade-in duration-700">
      {/* Modal de Estado dinámico al estilo AgroFlow Premium 💎 */}
      {statusModal.open && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setStatusModal(prev => ({ ...prev, open: false }))} />
          <div className={cn(
            "relative bg-white rounded-[3.5rem] shadow-2xl p-12 max-w-md w-full text-center space-y-8 animate-in zoom-in-95 slide-in-from-bottom-12 duration-700 ease-out border",
            statusModal.type === "success" ? "border-emerald-50" : "border-rose-50"
          )}>
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center mx-auto relative group",
              statusModal.type === "success" ? "bg-emerald-100" : "bg-rose-100"
            )}>
              <div className={cn(
                "absolute inset-0 rounded-full animate-ping opacity-20",
                statusModal.type === "success" ? "bg-emerald-500" : "bg-rose-500"
              )} />
              {statusModal.type === "success" ? (
                <ShieldCheck className="h-12 w-12 text-emerald-600 relative z-10" />
              ) : (
                <AlertCircle className="h-12 w-12 text-rose-600 relative z-10" />
              )}
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
                {statusModal.type === "success" ? "¡Operación Exitosa!" : "¡Ocurrió un Error!"}
              </h2>
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
                  {statusModal.title}
                </p>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-tight leading-relaxed">
                  {statusModal.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-emerald-950 rounded-2xl flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950/20">
                <Factory className="h-5 w-5" />
             </div>
             <h1 className="text-3xl font-extrabold tracking-tighter text-emerald-950 font-['Outfit']">
                Plantas y <span className="text-emerald-500">Sedes</span>
             </h1>
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-13">
             Configuración de Sedes y Códigos de Trazabilidad Dinámica
          </p>
        </div>

        <button 
          onClick={() => { setEditingPlanta(null); setIsModalOpen(true); }}
          className="h-12 px-6 bg-emerald-950 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[11px] flex items-center gap-2 hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-950/20 active:scale-95 border-none"
        >
          <Plus className="h-4 w-4" />
          Nueva Planta
        </button>
      </div>

      <PlantaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPlantas}
        editingData={editingPlanta}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        showSuccess={isDeleteSuccess}
        title="¿Eliminar Sede?"
        message="¿Estás seguro de que deseas borrar esta planta? Esta acción podría afectar la trazabilidad de registros históricos."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm items-end transition-all duration-500">
        <div className="lg:col-span-3 space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Búsqueda Rápida</label>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar planta o distrito..."
              className="w-full h-11 pl-12 pr-6 bg-slate-50/50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div className="bg-emerald-50/30 border border-emerald-100 rounded-[1.5rem] px-6 h-11 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60">Sedes</p>
          <p className="text-xl font-black text-emerald-900">{filteredPlantas.length}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-none px-6">
                <TableHead className="w-[300px] font-black text-slate-400 uppercase text-[10px] tracking-widest pl-8 py-6 border-none">Planta / Sede</TableHead>
                <TableHead className="w-[200px] font-black text-slate-400 uppercase text-[10px] tracking-widest text-center border-none">Código Centro (MTC)</TableHead>
                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest border-none px-8">Ubicación Geográfica</TableHead>
                <TableHead className="w-[150px] font-black text-slate-400 uppercase text-[10px] tracking-widest text-center border-none">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell colSpan={4} className="h-20 bg-slate-50/20"></TableCell>
                  </TableRow>
                ))
              ) : currentPlantas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-60 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-300 gap-3">
                      <AlertCircle className="h-10 w-10" />
                      <p className="font-bold uppercase tracking-widest text-xs">No se encontraron plantas registradas.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentPlantas.map((planta) => (
                  <TableRow key={planta.id} className="group hover:bg-emerald-50/10 transition-colors border-none">
                    <TableCell className="pl-8 py-6 border-none">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 transition-all">
                          <Factory className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 leading-tight tracking-tight uppercase">{planta.planta}</p>
                          <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase">UBIGEO: {planta.ubigeo}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center border-none">
                      <div className="flex justify-center">
                        <div className="relative w-32">
                          <input
                            value={editCentros[planta.id] || ""}
                            onChange={(e) => handleCentroChange(planta.id, e.target.value)}
                            className="w-full text-center font-black tracking-widest border border-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 h-10 rounded-xl bg-slate-50/50 shadow-sm text-sm"
                            placeholder="Ej: 4102"
                            maxLength={10}
                          />
                          {editCentros[planta.id] !== planta.centro && (
                            <div className="absolute -top-1 -right-1 h-3 w-3 bg-amber-500 rounded-full border-2 border-white animate-bounce shadow-md" />
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="border-none px-8">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-emerald-500" />
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-white border-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg">
                            {planta.distrito || "S/D"}
                          </Badge>
                          <span className="text-slate-600 text-xs font-bold">{planta.provincia}, {planta.departamento}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 border-none">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => { setEditingPlanta(planta); setIsModalOpen(true); }}
                          className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300 shadow-sm active:scale-95"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteInit(planta.id)}
                          className="h-10 w-10 border border-slate-100 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-rose-500 hover:text-white hover:border-rose-500 text-slate-400 shadow-sm active:scale-95"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <Button
                          size="sm"
                          disabled={savingId === planta.id || editCentros[planta.id] === planta.centro}
                          onClick={() => handleSaveCentro(planta)}
                          className={cn(
                            "h-10 px-5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all duration-300 shadow-sm border-none",
                            editCentros[planta.id] !== planta.centro 
                              ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200" 
                              : "bg-slate-50 text-slate-300 hover:bg-slate-50"
                          )}
                        >
                          {savingId === planta.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : editCentros[planta.id] === planta.centro ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!loading && totalPages > 1 && (
            <div className="px-8 py-8 border-t border-slate-50 bg-white/50 flex items-center justify-between font-['Outfit']">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Página</span>
                  <div className="h-10 px-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm">
                    <span className="text-sm font-bold text-emerald-700">{page} <span className="text-slate-300 mx-1">/</span> {totalPages}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">
                    Mostrando {currentPlantas.length} de {filteredPlantas.length} registros operativos
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-12 px-6 bg-white border border-slate-100 rounded-2xl flex items-center gap-2 text-slate-600 font-bold text-xs hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed group"
                  >
                    <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Anterior
                  </button>
                  <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-12 px-8 bg-emerald-950 text-white rounded-2xl flex items-center gap-2 font-bold text-xs hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-950/10 disabled:opacity-30 disabled:cursor-not-allowed group"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
            </div>
          )}
      </div>

      <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-6 flex gap-5 items-start shadow-sm shadow-emerald-100/50">
        <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600 shrink-0 shadow-inner">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-emerald-950 font-black text-sm uppercase tracking-widest">Información de Trazabilidad Dinámica 🛰️</p>
          <p className="text-emerald-800/70 text-xs leading-relaxed font-bold uppercase tracking-tight">
            El código configurado como <strong className="text-emerald-900">"Centro"</strong> se utiliza automáticamente en el Anexo 1. 
            Fórmula: <code className="bg-emerald-100/50 px-2 py-0.5 rounded text-emerald-900">[Centro] + [Fecha DDMMYY]</code>. 
          </p>
        </div>
      </div>
    </div>
  );
}
