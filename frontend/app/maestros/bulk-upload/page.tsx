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
      const response = await fetch("http://localhost:8000/api/v1/maestros/bulk-upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        toast.success(data.mensaje);
      } else {
        toast.error(data.detail || "Error al subir el archivo");
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header Sección */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tighter text-[#022c22]">Carga Masiva de Transportistas</h1>
        <p className="text-slate-500 font-medium">Sincroniza tu base de datos de transportistas y vehículos desde un archivo Excel.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Zona de Carga */}
        <div className="lg:col-span-2 space-y-6">
          <div 
            className={cn(
              "relative border-2 border-dashed rounded-[2rem] p-12 transition-all flex flex-col items-center justify-center gap-6 group overflow-hidden bg-white shadow-sm",
              file ? "border-emerald-500 bg-emerald-50/10" : "border-slate-200 hover:border-emerald-400 hover:bg-slate-50"
            )}
          >
            {/* Decoración de fondo */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl" />
            
            {!file ? (
              <>
                <div className="h-20 w-20 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                  <FileUp className="h-10 w-10" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-bold text-slate-800">Arrastra tu archivo Excel aquí</p>
                  <p className="text-sm text-slate-400">O haz clic para seleccionar (xlsx, xls)</p>
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
                <div className="flex items-center gap-4 p-4 bg-white border border-emerald-100 rounded-2xl shadow-sm relative group/file">
                  <div className="h-12 w-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
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
                  className="w-full bg-[#022c22] text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-900/10 active:scale-[0.98] disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Procesar Archivo
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
          <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
            <h3 className="text-sm font-black text-[#022c22] uppercase tracking-[0.2em] mb-6">Instrucciones</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs shrink-0">1</div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">Asegúrate de que el documento tenga el formato de asignación oficial.</p>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs shrink-0">2</div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">El <strong>RUC</strong> debe estar en la <strong>Columna F</strong> e incluir los 11 dígitos.</p>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs shrink-0">3</div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">Las <strong>Placas</strong> deben estar separadas por una barra (ej: <code>ABC-123/DEF-456</code>).</p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-50">
               <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-all">
                  <Download className="h-4 w-4" />
                  Descargar Plantilla
                  <ArrowRight className="h-3 w-3" />
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
