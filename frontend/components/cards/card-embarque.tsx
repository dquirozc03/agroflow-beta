// frontend/components/cards/card-embarque.tsx

"use client";

import React, { useState } from "react";
import { Loader2, XCircle, CheckCircle2 } from "lucide-react";
import { getBookingRefs } from "@/lib/api";
import { toast } from "sonner";
import type { FormState } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  refsLocked: boolean;
  setRefsLocked: (v: boolean) => void;
  justScannedId?: string | null;
}

export const CardEmbarque = React.memo(function CardEmbarque({
  form,
  setForm,
  refsLocked,
  setRefsLocked,
  justScannedId
}: Props) {
  const [loading, setLoading] = useState(false);
  const [bookingError, setBookingError] = useState(false);

  const handleAutocompletar = async () => {
    if (!form.booking.trim()) {
      toast.error("Ingrese un BOOKING primero");
      return;
    }
    setLoading(true);
    setBookingError(false);
    try {
      const refs = await getBookingRefs(form.booking.trim());
      setForm((prev) => ({
        ...prev,
        o_beta: (refs.orden_beta_final as string) || (refs.o_beta_inicial as string) || prev.o_beta,
        awb: (refs.awb as string) || prev.awb,
        dam: (refs.dam as string) || prev.dam,
      }));
      setRefsLocked(true);
      toast.success("Datos de referencia cargados");
    } catch {
      setBookingError(true);
      toast.error("No se encontraron referencias para este BOOKING");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center px-6">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tight">
          <span className="material-symbols-outlined text-primary notranslate">local_shipping</span>
          1. Datos de Embarque
        </h3>
        <button
          onClick={handleAutocompletar}
          disabled={loading || !form.booking.trim()}
          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 disabled:opacity-50 disabled:no-underline"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="material-symbols-outlined text-sm notranslate font-semibold">auto_awesome</span>}
          AUTOCOMPLETAR
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Booking */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Booking</label>
          <div className="relative group">
            <input
              id="input-booking"
              className={cn(
                "w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary py-2.5 px-4 transition-all outline-none text-slate-700 dark:text-slate-200 font-mono",
                justScannedId === "booking" && "ring-2 ring-primary bg-primary/5",
                bookingError && "border-red-500 ring-1 ring-red-500 bg-red-50/30 dark:bg-red-950/20"
              )}
              type="text"
              value={form.booking}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setForm(p => ({ ...p, booking: val }));
                if (bookingError) setBookingError(false);
                
                // Si borra el booking, limpiar datos autocompletados
                if (!val.trim()) {
                  setForm(prev => ({
                    ...prev,
                    o_beta: "",
                    awb: "",
                    dam: ""
                  }));
                  setRefsLocked(false);
                }
              }}
              placeholder="BK-XXXXXX"
            />
            {bookingError && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 animate-in zoom-in duration-300">
                <XCircle className="h-5 w-5" />
              </span>
            )}
            {refsLocked && !bookingError && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-in zoom-in duration-300">
                <CheckCircle2 className="h-5 w-5" />
              </span>
            )}
          </div>
        </div>

        {/* O/Beta */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">O/Beta</label>
          <input
            className={cn(
              "w-full bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 outline-none text-slate-500 dark:text-slate-400 cursor-not-allowed",
              justScannedId === "o_beta" && "ring-2 ring-primary bg-primary/5"
            )}
            type="text"
            value={form.o_beta}
            readOnly
            placeholder="Autocompletado..."
          />
        </div>

        {/* CONTENEDOR */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CONTENEDOR</label>
          <input
            className={cn(
              "w-full bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 outline-none text-slate-500 dark:text-slate-400 cursor-not-allowed",
              justScannedId === "awb" && "ring-2 ring-primary bg-primary/5"
            )}
            type="text"
            value={form.awb}
            readOnly
            placeholder="Autocompletado..."
          />
        </div>

        {/* Número de DAM */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Número de DAM</label>
          <input
            className={cn(
              "w-full bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 outline-none text-slate-500 dark:text-slate-400 cursor-not-allowed",
              justScannedId === "dam" && "ring-2 ring-primary bg-primary/5"
            )}
            type="text"
            value={form.dam}
            readOnly
            placeholder="000-000000"
          />
        </div>
      </div>
    </section>
  );
});

