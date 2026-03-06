// frontend/components/cards/card-operacion.tsx

"use client";

import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { getVehiculoPorTractoCarreta } from "@/lib/api";
import type { Transportista } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { FormState } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  justScannedId?: string | null;
}

function TransportistaDetail({ t }: { t: Transportista }) {
  return (
    <div className="grid gap-2 p-1">
      <div className="text-sm font-bold text-slate-800 dark:text-white leading-snug">
        {t.nombre_transportista}
      </div>
      <div className="grid gap-1.5 text-xs text-slate-500">
        <div className="flex justify-between">
          <span>RUC</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">{t.ruc}</span>
        </div>
        <div className="flex justify-between">
          <span>SAP</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">{t.codigo_sap}</span>
        </div>
        <div className="flex justify-between">
          <span>Estado</span>
          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[9px] font-bold uppercase">
            {t.estado || "ACTIVO"}
          </span>
        </div>
      </div>
    </div>
  );
}

interface ScannerGroupProps {
  id?: string;
  label: string;
  items: string[];
  onAdd: (val: string) => void;
  onClear: () => void;
  isFlashing?: boolean;
}

function ScannerField({ id, label, items, onAdd, onClear, isFlashing }: ScannerGroupProps) {
  const [val, setVal] = useState("");

  const handleAdd = () => {
    const v = val.trim().toUpperCase();
    if (!v) return;
    if (items.includes(v)) {
      toast.error("Valor duplicado");
      return;
    }
    onAdd(v);
    setVal("");
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1 group">
          <input
            id={id}
            className={cn(
              "w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary py-2 px-3 transition-all outline-none text-slate-700 dark:text-slate-200 text-sm font-mono",
              isFlashing && "ring-2 ring-primary bg-primary/5"
            )}
            type="text"
            placeholder="Escanear..."
            value={val}
            onChange={(e) => setVal(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={items.length === 0}
          className="p-2 text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors disabled:opacity-30"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {items.map((it, i) => (
            <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-md font-mono border border-primary/20 flex items-center gap-1">
              {it}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export const CardOperacion = React.memo(function CardOperacion({ form, setForm, justScannedId }: Props) {
  const [placasLoading, setPlacasLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const placasDebounceRef = useRef<number | null>(null);

  useEffect(() => {
    const tracto = (form.placas_tracto || "").trim().toUpperCase();
    if (!tracto) {
      setForm((prev) => ({ ...prev, transportista: null, codigo_sap: "" }));
      setPlacasLoading(false);
      return;
    }

    if (placasDebounceRef.current) window.clearTimeout(placasDebounceRef.current);
    setPlacasLoading(true);

    const carreta = (form.placas_carreta || "").trim() ? form.placas_carreta : undefined;

    placasDebounceRef.current = window.setTimeout(async () => {
      try {
        const data = await getVehiculoPorTractoCarreta(tracto, carreta);
        setForm((prev) => ({
          ...prev,
          transportista: data.transportista ?? null,
          codigo_sap: data.transportista?.codigo_sap ?? "",
        }));
        if (data.transportista) {
          toast.success("Transportista cargado");
        }
      } catch {
        setForm((prev) => ({ ...prev, transportista: null, codigo_sap: "" }));
      } finally {
        setPlacasLoading(false);
      }
    }, 500);

    return () => {
      if (placasDebounceRef.current) window.clearTimeout(placasDebounceRef.current);
    };
  }, [form.placas_tracto, form.placas_carreta, setForm]);

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary notranslate">lock_open</span>
          2. Operación y Precintos
        </h3>
        {form.transportista && (
          <Popover open={detailOpen} onOpenChange={setDetailOpen}>
            <PopoverTrigger asChild>
              <button className="text-[10px] font-bold text-slate-500 hover:text-primary flex items-center gap-1 transition-colors uppercase">
                <span className="material-symbols-outlined text-sm notranslate">info</span>
                Detalles SAP
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <TransportistaDetail t={form.transportista} />
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="p-6 space-y-8">
        {/* Row 1: Operación Chofer y Vehículo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">DNI Scanner</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 notranslate font-semibold">person</span>
              <input
                className={cn(
                  "w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary py-2.5 pl-10 pr-4 transition-all outline-none text-slate-700 dark:text-slate-200 font-mono",
                  justScannedId === "dni" && "ring-2 ring-primary bg-primary/5"
                )}
                type="text"
                placeholder="45903211"
                value={form.dni}
                onChange={(e) => setForm(p => ({ ...p, dni: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Placa Tractor {placasLoading && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}
            </label>
            <input
              className={cn(
                "w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary py-2.5 px-4 transition-all outline-none text-slate-700 dark:text-slate-200 font-mono",
                justScannedId === "placas_tracto" && "ring-2 ring-primary bg-primary/5"
              )}
              placeholder="ABC-123"
              type="text"
              value={form.placas_tracto}
              onChange={(e) => setForm(p => ({ ...p, placas_tracto: e.target.value.toUpperCase() }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Placa Carreta</label>
            <input
              className={cn(
                "w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary py-2.5 px-4 transition-all outline-none text-slate-700 dark:text-slate-200 font-mono",
                justScannedId === "placas_carreta" && "ring-2 ring-primary bg-primary/5"
              )}
              placeholder="XYZ-789"
              type="text"
              value={form.placas_carreta}
              onChange={(e) => setForm(p => ({ ...p, placas_carreta: e.target.value.toUpperCase() }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa Transportes</label>
            <div className="relative">
              <input
                className={cn(
                  "w-full bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 outline-none text-slate-600 dark:text-slate-400 cursor-not-allowed font-bold text-sm truncate",
                  form.transportista && "text-primary dark:text-primary"
                )}
                type="text"
                readOnly
                value={form.transportista?.nombre_transportista || "Esperando placas..."}
              />
              {form.transportista && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-sm notranslate">check_circle</span>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Precintos Principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Naviera (Aduana)</label>
            <input
              className={cn(
                "w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary py-2.5 px-4 transition-all outline-none text-slate-700 dark:text-slate-200 font-mono",
                justScannedId === "ps_aduana" && "ring-2 ring-primary bg-primary/5"
              )}
              placeholder="S-192837"
              type="text"
              value={form.ps_aduana}
              onChange={(e) => setForm(p => ({ ...p, ps_aduana: e.target.value.toUpperCase() }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operador Log.</label>
            <input
              className={cn(
                "w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary py-2.5 px-4 transition-all outline-none text-slate-700 dark:text-slate-200 font-mono",
                justScannedId === "ps_operador" && "ring-2 ring-primary bg-primary/5"
              )}
              placeholder="OP-7721"
              type="text"
              value={form.ps_operador}
              onChange={(e) => setForm(p => ({ ...p, ps_operador: e.target.value.toUpperCase() }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Precinto SENASA</label>
            <input
              className={cn(
                "w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary py-2.5 px-4 transition-all outline-none text-slate-700 dark:text-slate-200 font-mono",
                justScannedId === "senasa" && "ring-2 ring-primary bg-primary/5"
              )}
              placeholder="SNS-0012"
              type="text"
              value={form.senasa}
              onChange={(e) => setForm(p => ({ ...p, senasa: e.target.value.toUpperCase() }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Línea (Naviera)</label>
            <input
              className={cn(
                "w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary py-2.5 px-4 transition-all outline-none text-slate-700 dark:text-slate-200 font-mono",
                justScannedId === "ps_linea" && "ring-2 ring-primary bg-primary/5"
              )}
              placeholder="LIN-9901"
              type="text"
              value={form.ps_linea}
              onChange={(e) => setForm(p => ({ ...p, ps_linea: e.target.value.toUpperCase() }))}
            />
          </div>
        </div>

        {/* Row 3: Precintos Múltiples y Termógrafos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ScannerField
            id="scanner_ps_beta"
            label="PS BETA (Exportador)"
            items={form.ps_beta_items}
            onAdd={(v) => setForm(p => ({ ...p, ps_beta_items: [...p.ps_beta_items, v] }))}
            onClear={() => setForm(p => ({ ...p, ps_beta_items: [] }))}
            isFlashing={justScannedId === "scanner_ps_beta"}
          />
          <ScannerField
            id="scanner_termografos"
            label="Termógrafos"
            items={form.termografos_items}
            onAdd={(v) => setForm(p => ({ ...p, termografos_items: [...p.termografos_items, v] }))}
            onClear={() => setForm(p => ({ ...p, termografos_items: [] }))}
            isFlashing={justScannedId === "scanner_termografos"}
          />
        </div>
      </div>
    </section>
  );
});
