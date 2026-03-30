"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, X, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchableFieldProps {
  label: string;
  placeholder: string;
  icon: any;
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: any) => void;
  searchUrl: string;
  readOnly?: boolean;
  loading?: boolean;
  hideResults?: boolean;
  error?: boolean;
  errorMsg?: string;
}

export function SearchableField({ 
  label, 
  placeholder, 
  icon: Icon, 
  value, 
  onChange, 
  onSelect, 
  searchUrl, 
  readOnly, 
  loading, 
  hideResults,
  error,
  errorMsg
}: SearchableFieldProps) {
  const [results, setResults] = useState<any[]>([]);
  const [isSearchingLocal, setIsSearchingLocal] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!value || value.length < 2 || readOnly) {
        setResults([]);
        return;
      }
      setIsSearchingLocal(true);
      try {
        const resp = await fetch(`${searchUrl}?q=${encodeURIComponent(value)}`);
        if (resp.ok) {
          const data = await resp.json();
          setResults(data);
          setShowResults(true); // Siempre mostrar si hubo búsqueda activa
        }
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        setIsSearchingLocal(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [value, searchUrl, readOnly]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-3 group/field relative" ref={dropdownRef}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within/field:text-emerald-500 transition-colors">
        {label}
      </label>
      <div className={cn(
        "relative flex items-center bg-white border rounded-2xl h-14 transition-all px-4 shadow-sm",
        readOnly ? "bg-slate-50/50 border-slate-100 opacity-60 cursor-not-allowed" : "border-slate-100 hover:border-emerald-200 focus-within:ring-2 focus-within:ring-emerald-500/10 focus-within:border-emerald-500",
        error && "border-rose-300 bg-rose-50/30"
      )}>
        <Icon className={cn(
          "h-4 w-4 mr-3 transition-colors", 
          readOnly ? "text-slate-300" : "text-slate-300 group-focus-within/field:text-emerald-500"
        )} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          placeholder={placeholder}
          onFocus={() => results.length > 0 && setShowResults(true)}
          className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-900 placeholder:text-slate-300 h-full"
        />
        {(loading || isSearchingLocal) && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
          </div>
        )}
      </div>

      {error && errorMsg && (
        <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-2 animate-in slide-in-from-top-1">
          {errorMsg}
        </p>
      )}

      {showResults && !readOnly && !hideResults && (
        <div className="absolute top-[105%] left-0 right-0 bg-white/80 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-2xl z-[1000] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 scale-100 origin-top">
           <div className="lc-scroll max-h-[220px] overflow-y-auto p-2 space-y-1">
              {results.length === 0 ? (
                <div className="p-10 flex flex-col items-center justify-center gap-3 text-slate-300">
                   <X className="h-10 w-10 opacity-20" />
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500/80 animate-pulse">Sin registros en maestros</p>
                </div>
              ) : results.map((res, i) => (
                 <div 
                   key={i} 
                   onClick={() => { onSelect(res); setShowResults(false); }} 
                   className="p-4 hover:bg-emerald-50/80 cursor-pointer rounded-2xl flex items-center gap-4 group transition-all duration-300"
                 >
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-slate-50 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 transition-all">
                      <Navigation className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                       <span className="text-sm font-black text-slate-800 group-hover:text-emerald-900 uppercase truncate tracking-tight">
                          {res.nombre || res.placa || res.booking || res.consignatario_fito}
                       </span>
                       <div className="flex flex-wrap gap-x-3 items-center opacity-60">
                          {res.dni && <span className="text-[10px] font-bold text-slate-500 uppercase">DNI: {res.dni}</span>}
                          {res.marca && <span className="text-[10px] font-bold text-slate-500 uppercase">{res.marca}</span>}
                          {res.transportista && <span className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[150px]">{res.transportista}</span>}
                          {res.dam && <span className="text-[10px] font-bold text-slate-500 uppercase truncate">DAM: {res.dam}</span>}
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}
