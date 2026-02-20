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
        o_beta: (refs.o_beta as string) || prev.o_beta,
        awb: (refs.awb as string) || prev.awb,
        dam: (refs.dam as string) || "",
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
