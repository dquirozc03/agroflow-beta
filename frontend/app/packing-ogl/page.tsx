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
  Thermometer
} from "lucide-react";
import { 
  apiGetOglNaves, 
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

  const [confFile, setConfFile] = useState<File | null>(null);
  const [termFile, setTermFile] = useState<File | null>(null);
  
  const [isUploadingConf, setIsUploadingConf] = useState(false);
  const [isUploadingTerm, setIsUploadingTerm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [confStatus, setConfStatus] = useState<{ ok?: boolean; orders?: number } | null>(null);
  const [termStatus, setTermStatus] = useState<{ ok?: boolean; added?: number } | null>(null);

  useEffect(() => {
    fetchNaves();
  }, []);

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

  const handleUploadConf = async () => {
    if (!confFile) return;
    try {
      setIsUploadingConf(true);
      const res = await apiUploadConfirmacion(confFile);
      setConfStatus({ ok: true, orders: res.orders.length });
      toast.success("Confirmación procesada correctamente");
      // Refrescar naves por si hay nuevas
      fetchNaves();
    } catch (e: any) {
      toast.error(e.message || "Error al subir confirmación");
      setConfStatus({ ok: false });
    } finally {
      setIsUploadingConf(false);
    }
  };

  const handleUploadTerm = async () => {
    if (!termFile) return;
    try {
      setIsUploadingTerm(true);
      const res = await apiUploadTermografos(termFile);
      setTermStatus({ ok: true, added: res.added });
      toast.success("Termógrafos procesados correctamente");
    } catch (e: any) {
      toast.error(e.message || "Error al subir termógrafos");
      setTermStatus({ ok: false });
    } finally {
      setIsUploadingTerm(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedNave) {
      toast.warning("Selecciona una nave primero");
      return;
    }
    try {
      setIsGenerating(true);
      const url = getDownloadOglPackingUrl(selectedNave);
      
      // Trigger download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `PACKING_LIST_OGL_${selectedNave}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Generando Packing List para ${selectedNave}...`);
    } catch (e) {
      toast.error("Error al generar el documento");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Generación de Packing List OGL" />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Packing List OGL</h2>
                <p className="text-slate-500 mt-1">Consolida órdenes por nave en formato oficial</p>
              </div>
              <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-1">
                <Button variant="ghost" className="rounded-xl px-4 py-2 font-bold text-xs uppercase tracking-wider text-slate-500 hover:text-primary">
                  Historial
                </Button>
                <Button variant="ghost" className="rounded-xl px-4 py-2 font-bold text-xs uppercase tracking-wider text-slate-500 hover:text-primary">
                  Plantillas
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Uploads */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* File Upload: Confirmación */}
                <div className="group relative bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 p-8 transition-all hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20">
                  <div className="flex items-start gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 transition-transform group-hover:scale-110">
                      <FileText className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-800">Cargar Confirmación</h3>
                      <p className="text-sm text-slate-500 mt-1">Archivo Excel con IDs de Pallets (HU)</p>
                      
                      <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
                        <label className="flex-1 w-full cursor-pointer group/label">
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".xlsx,.xls" 
                            onChange={(e) => setConfFile(e.target.files?.[0] || null)}
                          />
                          <div className={cn(
                            "flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-dashed transition-all",
                            confFile ? "border-primary/40 bg-primary/5 text-primary" : "border-slate-200 group-hover/label:border-primary/30 group-hover/label:bg-slate-50 text-slate-400"
                          )}>
                            <Upload className="h-5 w-5" />
                            <span className="font-bold text-sm truncate max-w-[200px]">
                              {confFile ? confFile.name : "Seleccionar Archivo"}
                            </span>
                          </div>
                        </label>
                        
                        <Button 
                          onClick={handleUploadConf}
                          disabled={!confFile || isUploadingConf}
                          className="w-full sm:w-auto rounded-2xl bg-slate-900 border-none hover:bg-primary transition-all px-8 h-[54px] font-bold"
                        >
                          {isUploadingConf ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                          Procesar
                        </Button>
                      </div>

                      {confStatus?.ok && (
                        <div className="mt-4 flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-xl animate-in fade-in slide-in-from-top-2">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="text-xs font-bold uppercase tracking-tight">Detectadas {confStatus.orders} órdenes con éxito</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* File Upload: Termógrafos */}
                <div className="group relative bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 p-8 transition-all hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20">
                  <div className="flex items-start gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 transition-transform group-hover:scale-110">
                      <Thermometer className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-800">Cargar Termógrafos</h3>
                      <p className="text-sm text-slate-500 mt-1">Archivo Excel con códigos de temperatura</p>
                      
                      <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
                        <label className="flex-1 w-full cursor-pointer group/label">
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".xlsx,.xls" 
                            onChange={(e) => setTermFile(e.target.files?.[0] || null)}
                          />
                          <div className={cn(
                            "flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-dashed transition-all",
                            termFile ? "border-orange-200 bg-orange-50 text-orange-600" : "border-slate-200 group-hover/label:border-orange-200 group-hover/label:bg-slate-50 text-slate-400"
                          )}>
                            <Upload className="h-5 w-5" />
                            <span className="font-bold text-sm truncate max-w-[200px]">
                              {termFile ? termFile.name : "Seleccionar Archivo"}
                            </span>
                          </div>
                        </label>
                        
                        <Button 
                          onClick={handleUploadTerm}
                          disabled={!termFile || isUploadingTerm}
                          className="w-full sm:w-auto rounded-2xl bg-slate-900 border-none hover:bg-orange-600 transition-all px-8 h-[54px] font-bold"
                        >
                          {isUploadingTerm ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                          Procesar
                        </Button>
                      </div>

                      {termStatus?.ok && (
                        <div className="mt-4 flex items-center gap-2 text-orange-600 bg-orange-50 p-3 rounded-xl animate-in fade-in slide-in-from-top-2 border border-orange-100">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="text-xs font-bold uppercase tracking-tight">Sincronizados {termStatus.added} códigos de termógrafo</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Generation */}
              <div className="space-y-6">
                <div className="sticky top-8 bg-gradient-to-br from-primary to-green-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-primary/20 overflow-hidden group">
                  <div className="absolute -right-8 -bottom-8 opacity-20 transition-transform group-hover:scale-125 duration-700">
                    <FileSpreadsheet width={200} height={200} />
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="text-2xl font-black italic tracking-tighter">GENERACIÓN</h3>
                    <p className="text-white/80 text-sm font-bold mt-2 leading-tight">Selecciona la nave para consolidar las órdenes OGL</p>
                    
                    <div className="mt-8 space-y-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[2px] text-white/60 ml-1">Barco / Nave</label>
                        <div className="relative">
                          <select 
                            value={selectedNave}
                            onChange={(e) => setSelectedNave(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-white/40 glass-effect transition-all"
                            disabled={isLoadingNaves}
                          >
                            <option value="" className="text-slate-900">Seleccionar nave...</option>
                            {naves.map(n => (
                              <option key={n} value={n} className="text-slate-900">{n}</option>
                            ))}
                          </select>
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Ship className="h-4 w-4 text-white/60" />
                          </div>
                        </div>
                      </div>

                      {isLoadingNaves && (
                        <div className="flex items-center justify-center py-2 animate-pulse">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Cargando naves...</span>
                        </div>
                      )}

                      <Button 
                        onClick={handleDownload}
                        disabled={!selectedNave || isGenerating}
                        className="w-full h-16 rounded-2xl bg-white text-primary hover:bg-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-all font-black text-sm uppercase tracking-[1px] shadow-xl shadow-black/10 group/btn"
                      >
                        {isGenerating ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <>
                            Generar Packing List
                            <Download className="h-5 w-5 ml-2 transition-transform group-hover/btn:translate-y-1" />
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/10 flex items-start gap-4">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-white/10 flex items-center justify-center flex-col gap-0.5">
                         <AlertCircle className="h-5 w-5 text-white/80" />
                      </div>
                      <p className="text-[10px] font-bold text-white/70 leading-relaxed uppercase tracking-tight">
                        Asegúrate de haber procesado el cuadro de pedidos desde OneDrive antes de generar.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-lg shadow-slate-200/50">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-4">Estado del Sistema</h4>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-slate-600">Base OGL</span>
                         <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-slate-600">Sync OneDrive</span>
                         <span className="inline-flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-slate-600">Mapeo Plantillas</span>
                         <span className="text-[10px] font-black p-1 px-2 bg-slate-100 rounded-lg text-slate-400">OK</span>
                      </div>
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
