"use client";

import React, { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { 
  FileSpreadsheet, 
  Upload, 
  Ship, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  FileText,
  Thermometer,
  Package,
  X,
  Plus,
  Trash2
} from "lucide-react";
import { 
  apiGetOglNaves, 
  apiGetOglOrders,
  apiUploadConfirmacion, 
  apiUploadTermografos, 
  getDownloadOglPackingUrl 
} from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function PackingOglPage() {
  const [naves, setNaves] = useState<string[]>([]);
  const [selectedNave, setSelectedNave] = useState<string>("");
  const [isLoadingNaves, setIsLoadingNaves] = useState(true);
  const [naveOrders, setNaveOrders] = useState<{ orden: string; booking: string; finalizado: boolean }[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const [confFiles, setConfFiles] = useState<File[]>([]);
  const [termFiles, setTermFiles] = useState<File[]>([]);
  
  const [uploadingStatus, setUploadingStatus] = useState<string | null>(null);
  const [processedStatus, setProcessedStatus] = useState<{name: string, ok: boolean}[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchNaves();
  }, []);

  useEffect(() => {
    if (selectedNave) {
      fetchOrders(selectedNave);
    } else {
      setNaveOrders([]);
    }
  }, [selectedNave]);

  async function fetchNaves() {
    try {
      setIsLoadingNaves(true);
      const data = await apiGetOglNaves();
      setNaves(data);
    } catch (error) {
      toast.error("Error al cargar naves");
    } finally {
      setIsLoadingNaves(false);
    }
  }

  async function fetchOrders(nave: string) {
    try {
      setIsLoadingOrders(true);
      const data = await apiGetOglOrders(nave);
      setNaveOrders(data);
    } catch (error) {
      toast.error("Error al cargar órdenes de la nave");
    } finally {
      setIsLoadingOrders(false);
    }
  }

  const handleProcessAll = async () => {
    if (confFiles.length === 0 && termFiles.length === 0) return;
    
    setUploadingStatus("Iniciando carga...");
    let successCount = 0;
    const newStatus: {name: string, ok: boolean}[] = [];

    // Procesar Confirmaciones
    for (const file of confFiles) {
      setUploadingStatus(`Subiendo Confirmación: ${file.name}`);
      try {
        await apiUploadConfirmacion(file);
        successCount++;
        newStatus.push({ name: file.name, ok: true });
      } catch (e: any) {
        toast.error(`Error en ${file.name}: ${e.message}`);
        newStatus.push({ name: file.name, ok: false });
      }
    }

    // Procesar Termógrafos
    for (const file of termFiles) {
      setUploadingStatus(`Subiendo Termógrafo: ${file.name}`);
      try {
        await apiUploadTermografos(file);
        successCount++;
        newStatus.push({ name: file.name, ok: true });
      } catch (e: any) {
        toast.error(`Error en ${file.name}: ${e.message}`);
        newStatus.push({ name: file.name, ok: false });
      }
    }

    setUploadingStatus(null);
    setProcessedStatus(newStatus);

    if (successCount > 0) {
      toast.success(`Se procesaron ${successCount} archivos. ¡Revisa la lista!`);
      fetchNaves(); 
      if (selectedNave) fetchOrders(selectedNave);
    }
  };

  const handleDownload = async () => {
    if (!selectedNave) return;
    try {
      setIsGenerating(true);
      toast.info("Generando Packing List, por favor espera...", { duration: 5000 });
      
      const url = getDownloadOglPackingUrl(selectedNave);
      
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `PACKING_LIST_OGL_${selectedNave}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Packing List generado para ${selectedNave}.`);
      
      // Bloqueamos por 5 segundos para que no le den clic mil veces mientras descarga
      setTimeout(() => {
        fetchNaves();
        setSelectedNave("");
        setIsGenerating(false);
      }, 5000);
      
    } catch (e) {
      toast.error("Error al generar el documento");
      setIsGenerating(false);
    }
  };

  const removeFile = (type: 'conf' | 'term', index: number) => {
    if (type === 'conf') {
      const file = confFiles[index];
      setConfFiles(prev => prev.filter((_, i) => i !== index));
      setProcessedStatus(prev => prev.filter(p => p.name !== file.name));
    } else {
      const file = termFiles[index];
      setTermFiles(prev => prev.filter((_, i) => i !== index));
      setProcessedStatus(prev => prev.filter(p => p.name !== file.name));
    }
  };

  const clearAll = () => {
    setConfFiles([]);
    setTermFiles([]);
    setProcessedStatus([]);
    toast.info("Lista de archivos limpia");
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, type: 'conf' | 'term') => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.xlsx'));
    if (files.length > 0) {
      if (type === 'conf') setConfFiles(prev => [...prev, ...files]);
      else setTermFiles(prev => [...prev, ...files]);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Packing List OGL</h2>
                <p className="text-slate-500 mt-1">Carga múltiple de archivos y consolidación por nave</p>
              </div>
              <div className="flex items-center gap-2">
                {uploadingStatus && (
                  <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-xl animate-pulse border border-primary/20">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs font-bold text-primary truncate max-w-[200px]">{uploadingStatus}</span>
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={clearAll} className="rounded-xl font-bold">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpiar Todo
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <div className="lg:col-span-2 space-y-6">
                
                {/* ZONA DE CARGA MÚLTIPLE */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl p-8 space-y-8">
                  
                  {/* Confirmaciones */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <FileText className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-slate-800">Confirmaciones (.xlsx)</h3>
                      </div>
                      <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 p-2 rounded-lg transition-colors group">
                        <Plus className="h-4 w-4 text-slate-600 group-hover:scale-125 transition-transform" />
                        <input 
                          type="file" 
                          multiple 
                          className="hidden" 
                          accept=".xlsx"
                          onChange={(e) => setConfFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
                        />
                      </label>
                    </div>

                    <div 
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'conf')}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[100px]"
                    >
                      {confFiles.length === 0 && (
                        <div className="col-span-full border-2 border-dashed border-slate-100 rounded-2xl py-8 flex flex-col items-center justify-center text-slate-300">
                          <Upload className="h-8 w-8 mb-2 opacity-50" />
                          <span className="text-xs font-bold uppercase tracking-widest">Arrastra Confirmaciones aquí</span>
                        </div>
                      )}
                      {confFiles.map((file, idx) => {
                        const status = processedStatus.find(p => p.name === file.name);
                        return (
                          <div key={idx} className={cn(
                            "flex items-center justify-between p-3 rounded-xl border transition-all",
                            status?.ok ? "bg-green-50 border-green-100" : status?.ok === false ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"
                          )}>
                            <div className="flex items-center gap-3 truncate">
                              <FileSpreadsheet className={cn("h-4 w-4 shrink-0", status?.ok ? "text-green-500" : "text-blue-400")} />
                              <span className="text-[11px] font-bold text-slate-600 truncate">{file.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {status?.ok && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                              <button onClick={() => removeFile('conf', idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Termógrafos */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                          <Thermometer className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-slate-800">Termógrafos (.xlsx)</h3>
                      </div>
                      <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 p-2 rounded-lg transition-colors group">
                        <Plus className="h-4 w-4 text-slate-600 group-hover:scale-125 transition-transform" />
                        <input 
                          type="file" 
                          multiple 
                          className="hidden" 
                          accept=".xlsx"
                          onChange={(e) => setTermFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
                        />
                      </label>
                    </div>

                    <div 
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'term')}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[100px]"
                    >
                      {termFiles.length === 0 && (
                        <div className="col-span-full border-2 border-dashed border-slate-100 rounded-2xl py-8 flex flex-col items-center justify-center text-slate-300">
                          <Upload className="h-8 w-8 mb-2 opacity-50" />
                          <span className="text-xs font-bold uppercase tracking-widest">Arrastra Termógrafos aquí</span>
                        </div>
                      )}
                      {termFiles.map((file, idx) => {
                        const status = processedStatus.find(p => p.name === file.name);
                        return (
                          <div key={idx} className={cn(
                            "flex items-center justify-between p-3 rounded-xl border transition-all",
                            status?.ok ? "bg-green-50 border-green-100" : status?.ok === false ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"
                          )}>
                            <div className="flex items-center gap-3 truncate">
                              <FileSpreadsheet className={cn("h-4 w-4 shrink-0", status?.ok ? "text-green-500" : "text-orange-400")} />
                              <span className="text-[11px] font-bold text-slate-600 truncate">{file.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               {status?.ok && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                               <button onClick={() => removeFile('term', idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                                 <X className="h-4 w-4" />
                               </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Button 
                    onClick={handleProcessAll}
                    disabled={(confFiles.length === 0 && termFiles.length === 0) || !!uploadingStatus}
                    className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-primary transition-all font-black uppercase tracking-widest text-xs"
                  >
                    {uploadingStatus ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Upload className="h-5 w-5 mr-2" />}
                    Procesar Múltiples Archivos ({confFiles.length + termFiles.length})
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-br from-primary to-green-600 rounded-[2.5rem] p-8 text-white shadow-2xl">
                    <h3 className="text-2xl font-black italic tracking-tighter">CONSOLIDACIÓN</h3>
                    
                    <div className="mt-8 space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[2px] text-white/60 ml-1">Elegir Nave</label>
                        <select 
                          value={selectedNave}
                          onChange={(e) => setSelectedNave(e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-white/40 glass-effect transition-all"
                          disabled={isLoadingNaves}
                        >
                          <option value="" className="text-slate-900">Seleccionar...</option>
                          {naves.map(n => (
                            <option key={n} value={n} className="text-slate-900">{n}</option>
                          ))}
                        </select>
                      </div>

                      {/* Órdenes de la Nave */}
                      {selectedNave && (
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
                           <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/60">
                              <span>Órdenes Detectadas</span>
                              <span>Estado</span>
                           </div>
                           <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                              {isLoadingOrders ? (
                                <div className="flex items-center gap-2 py-4 justify-center">
                                   <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : (
                                naveOrders.map((o, i) => (
                                  <div key={i} className="flex items-center justify-between bg-white/10 p-2 rounded-lg">
                                     <div className="flex items-center gap-2">
                                        <Package className="h-3 w-3 text-white/50" />
                                        <span className="text-[11px] font-bold">{o.orden}</span>
                                     </div>
                                     {o.finalizado ? (
                                       <span className="text-[8px] px-1.5 py-0.5 bg-green-500/20 text-green-300 rounded border border-green-500/30 font-black">CERRADA</span>
                                     ) : (
                                       <span className="text-[8px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded border border-yellow-500/30 font-black">PENDIENTE</span>
                                     )}
                                  </div>
                                ))
                              )}
                           </div>
                        </div>
                      )}

                      <Button 
                        onClick={handleDownload}
                        disabled={!selectedNave || isGenerating || naveOrders.length === 0}
                        className="w-full h-16 rounded-2xl bg-white text-primary hover:bg-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-all font-black text-sm uppercase tracking-[1px] shadow-xl"
                      >
                        {isGenerating ? <Loader2 className="h-6 w-6 animate-spin" /> : "Generar Packing List"}
                        <Download className="h-5 w-5 ml-2" />
                      </Button>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-[2.5rem] p-8 flex items-start gap-4">
                   <AlertCircle className="h-6 w-6 text-blue-500 shrink-0" />
                   <div>
                      <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest mb-1">Nota de Seguridad</h4>
                      <p className="text-[10px] font-medium text-blue-600 leading-relaxed uppercase tracking-tight">
                         Al generar el archivo, las órdenes se marcan como <strong>Finalizadas</strong>. 
                         Esto bloquea nuevas cargas para estos IDs y archiva el proceso.
                      </p>
                   </div>
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
