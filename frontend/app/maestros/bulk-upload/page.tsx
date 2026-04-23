"use client";

import React, { useState } from "react";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Download,
  Loader2,
  FileUp,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const data = await apiRequest<any>("/maestros/bulk-upload", {
        method: "POST",
        body: formData,
        // No pasamos Content-Type para que el navegador ponga el boundary correcto
      });

      setResult(data);
    } catch (error: any) {
      toast.error(error.message || "Error al subir el archivo");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-emerald-950 rounded-2xl flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950/20">
                <FileUp className="h-5 w-5" />
             </div>
             <h1 className="text-3xl font-extrabold tracking-tighter text-emerald-950 font-['Outfit']">
                Carga <span className="text-emerald-500">Inteligente</span>
             </h1>
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-13">
             Sincronización masiva de transportistas, conductores y flotas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Zona de Carga */}
        <div className="lg:col-span-2 space-y-6">
          <div 
            className={cn(
              "relative border-2 border-dashed rounded-[2.5rem] p-12 transition-all flex flex-col items-center justify-center gap-6 group overflow-hidden bg-white shadow-sm",
              file ? "border-emerald-500 bg-emerald-50/10" : "border-slate-200 hover:border-emerald-400 hover:bg-slate-50"
            )}
          >
            {/* Decoración de fondo */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl" />
            
            {!file ? (
              <>
                <div className="h-20 w-20 bg-emerald-100/50 rounded-3xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-500 shadow-sm border border-emerald-100">
                  <FileUp className="h-10 w-10" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-black text-emerald-950 font-['Outfit'] tracking-tight">Arrastra tu archivo Excel aquí</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">O haz clic para seleccionar (xlsx, xls)</p>
                </div>
                <input 
                  type="file" 
                  accept=".xlsx,.xls" 
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </>
            ) : (
              <div className="w-full space-y-6 animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-4 p-5 bg-white border border-emerald-100 rounded-3xl shadow-sm relative group/file">
                  <div className="h-12 w-12 bg-emerald-950 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-emerald-950 truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button 
                    onClick={removeFile}
                    className="h-8 w-8 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-full flex items-center justify-center transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full bg-emerald-950 text-white h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-950/20 active:scale-[0.98] disabled:opacity-50 border-none"
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Procesar Archivo Maestro
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Resultados */}
          {result && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500 bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[#022c22]">Resultado de la Carga</h3>
                  <p className="text-sm text-slate-500">{result.mensaje}</p>
                </div>
              </div>

              {result.errores && result.errores.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest pl-4">Errores Detectados</p>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2 lc-scroll">
                    {result.errores.map((err: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                        <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-rose-700 font-medium">{err}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Guía de Formato */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em] mb-8 border-b border-slate-50 pb-4">Protocolo de Carga</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="h-8 w-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-black text-[10px] shrink-0 border border-emerald-100">01</div>
                <p className="text-xs text-slate-500 leading-relaxed font-bold">Asegúrate de que el documento tenga el formato de asignación oficial de <span className="text-emerald-600">AgroFlow</span>.</p>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-black text-[10px] shrink-0 border border-emerald-100">02</div>
                <p className="text-xs text-slate-500 leading-relaxed font-bold">El <span className="text-slate-800">RUC</span> debe estar en la <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Columna F</span> e incluir los 11 dígitos exactos.</p>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-black text-[10px] shrink-0 border border-emerald-100">03</div>
                <p className="text-xs text-slate-500 leading-relaxed font-bold">Las <span className="text-slate-800">Placas</span> deben estar separadas por una barra (ej: <code className="text-emerald-600 font-black">ABC-123/DEF-456</code>) en la Columna I.</p>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-black text-[10px] shrink-0 border border-emerald-100">04</div>
                <p className="text-xs text-slate-500 leading-relaxed font-bold">Los <span className="text-slate-800">Conductores</span> se extraen de las columnas <span className="text-emerald-600">G (Licencia)</span> y <span className="text-emerald-600">H (Nombre)</span>.</p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100">
               <button className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 py-4 rounded-2xl transition-all border border-transparent hover:border-emerald-100">
                  <Download className="h-4 w-4" />
                  Descargar Plantilla Maestra
                  <ArrowRight className="h-3 w-3" />
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
