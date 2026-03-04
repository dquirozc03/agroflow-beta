"use client";

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Search, CheckCircle2, XCircle } from "lucide-react";
import type { FormState } from "@/lib/types";
import { useState } from "react";
import { getBookingRefs } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  refsLocked: boolean;
  setRefsLocked: (v: boolean) => void;
  justScannedId?: string | null;
}

export const CardEmbarque = React.memo(function CardEmbarque({ form, setForm, refsLocked, setRefsLocked }: Props) {
  const [loading, setLoading] = useState(false);
  const [refStatus, setRefStatus] = useState<"idle" | "ok" | "fail">("idle");

  const handleAutocompletar = async () => {
    if (!form.booking.trim()) {
      toast.error("Ingrese un BOOKING primero");
      return;
    }
    setLoading(true);
    setRefStatus("idle");
    try {
      const refs = await getBookingRefs(form.booking.trim());

      setForm((prev) => ({
        ...prev,
        // Sincronización con los 45 campos del modelo CONTROL
        o_beta: (refs.orden_beta_final as string) || (refs.o_beta_inicial as string) || prev.o_beta,
        awb: (refs.awb as string) || prev.awb,
        dam: (refs.dam as string) || prev.dam,

        // Metadatos operacionales (Disponibles en el estado para lógica de negocio)
        status_fcl: (refs.status_fcl as string) || "",
        status_beta_text: (refs.status_beta_text as string) || "",
        planta_empacadora: (refs.planta_empacadora as string) || "",
        cultivo: (refs.cultivo as string) || "",
        nave: (refs.nave as string) || "",

        etd_booking: (refs.etd_booking as string) || "",
        eta_booking: (refs.eta_booking as string) || "",
        week_eta_booking: (refs.week_eta_booking as string) || "",
        dias_tt_booking: Number(refs.dias_tt_booking) || 0,

        etd_final: (refs.etd_final as string) || "",
        eta_final: (refs.eta_final as string) || "",
        week_eta_real: (refs.week_eta_real as string) || "",
        dias_tt_real: Number(refs.dias_tt_real) || 0,
        week_debe_arribar: (refs.week_debe_arribar as string) || "",
        pol: (refs.pol as string) || "",

        o_beta_inicial: (refs.o_beta_inicial as string) || "",
        orden_beta_final: (refs.orden_beta_final as string) || "",

        cliente: (refs.cliente as string) || "",
        recibidor: (refs.recibidor as string) || "",
        destino_pedido: (refs.destino_pedido as string) || "",
        po_number: (refs.po_number as string) || "",
        destino_booking: (refs.destino_booking as string) || "",
        pais_booking: (refs.pais_booking as string) || "",

        nro_fcl: (refs.nro_fcl as string) || "",
        deposito_retiro: (refs.deposito_retiro as string) || "",
        operador: (refs.operador as string) || "",
        naviera: (refs.naviera as string) || "",

        termoregistros: (refs.termoregistros as string) || "",
        ac_option: (refs.ac_option as string) || "",
        ct_option: (refs.ct_option as string) || "",
        ventilacion: (refs.ventilacion as string) || "",
        temperatura: (refs.temperatura as string) || "",

        hora_solicitada_operador: (refs.hora_solicitada_operador as string) || "",
        fecha_real_llenado: (refs.fecha_real_llenado as string) || "",
        week_llenado: (refs.week_llenado as string) || "",

        variedad: (refs.variedad as string) || "",
        tipo_caja: (refs.tipo_caja as string) || "",
        etiqueta_caja: (refs.etiqueta_caja as string) || "",
        presentacion: (refs.presentacion as string) || "",
        calibre: (refs.calibre as string) || "",
        cj_kg: (refs.cj_kg as string) || "",
        total_unidades: (refs.total_unidades as string) || "",

        incoterm: (refs.incoterm as string) || "",
        flete: (refs.flete as string) || "",
      }));

      setRefsLocked(true);
      setRefStatus("ok");
      toast.success("Datos de referencia cargados");
    } catch {
      setRefStatus("fail");
      toast.error("No se encontraron referencias para este BOOKING");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-card-foreground">
            Embarque
          </CardTitle>
          <div className="flex items-center gap-2">
            {refStatus === "ok" && (
              <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                <CheckCircle2 className="h-3 w-3" />
                Refs OK
              </span>
            )}
            {refStatus === "fail" && (
              <span className="flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                <XCircle className="h-3 w-3" />
                Sin refs
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="booking" className="text-xs text-muted-foreground">
              BOOKING
            </Label>
            <Input
              id="booking"
              value={form.booking}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, booking: e.target.value.toUpperCase() }))
              }
              placeholder="Ingrese booking"
              className="mt-1 font-mono"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAutocompletar}
            disabled={loading || !form.booking.trim()}
            className="shrink-0"
          >
            {loading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="mr-1.5 h-3.5 w-3.5" />
            )}
            Autocompletar
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="o_beta" className="text-xs text-muted-foreground">
              O/BETA
            </Label>
            <Input
              id="o_beta"
              value={form.o_beta}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, o_beta: e.target.value.toUpperCase() }))
              }
              placeholder="O/BETA"
              disabled={refsLocked}
              className="mt-1 font-mono"
            />
          </div>
          <div>
            <Label htmlFor="awb" className="text-xs text-muted-foreground">
              AWB
            </Label>
            <Input
              id="awb"
              value={form.awb}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, awb: e.target.value.toUpperCase() }))
              }
              placeholder="AWB"
              className="mt-1 font-mono"
            />
          </div>
          <div>
            <Label htmlFor="dam" className="text-xs text-muted-foreground">
              DAM
            </Label>
            <Input
              id="dam"
              value={form.dam}
              readOnly
              placeholder="Desde refs"
              className="mt-1 bg-muted font-mono"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
