"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Shield } from "lucide-react";
import type { FormState } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}

interface ScannerGroupProps {
  id?: string;
  label: string;
  items: string[];
  maxItems?: number;
  onAdd: (value: string) => void;
  onClear: () => void;
  resultLabel: string;
  resultValue: string;
}

function ScannerGroup({
  id,
  label,
  items,
  maxItems,
  onAdd,
  onClear,
  resultLabel,
  resultValue,
}: ScannerGroupProps) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const val = input.trim().toUpperCase();
    if (!val) return;
    if (maxItems && items.length >= maxItems) {
      toast.error(`Maximo ${maxItems} elementos permitidos`);
      return;
    }
    if (items.includes(val)) {
      toast.error("Valor duplicado");
      return;
    }
    onAdd(val);
    setInput("");
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Escanear y agregar"
          className="font-mono"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAdd}
          className="shrink-0"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Agregar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          disabled={items.length === 0}
          className="shrink-0 bg-transparent"
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          Limpiar
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              key={item}
              className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-medium text-primary"
            >
              {item}
            </span>
          ))}
        </div>
      )}
      <div>
        <span className="text-xs text-muted-foreground">{resultLabel}: </span>
        <span className="font-mono text-xs font-medium text-card-foreground">
          {resultValue || "---"}
        </span>
      </div>
    </div>
  );
}

export const CardUnicidad = React.memo(function CardUnicidad({ form, setForm }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-card-foreground">
          <Shield className="h-4 w-4 text-primary" />
          Precintos y Termografos
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        {/* Precintos fields */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <Label htmlFor="ps_aduana" className="text-xs text-muted-foreground">
              PS_ADUANA
            </Label>
            <Input
              id="ps_aduana"
              value={form.ps_aduana}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  ps_aduana: e.target.value.toUpperCase(),
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  document.getElementById("ps_operador")?.focus();
                }
              }}
              className="mt-1 font-mono"
            />
          </div>
          <div className="min-w-0">
            <Label htmlFor="ps_operador" className="text-xs text-muted-foreground">
              PS_OPERADOR
            </Label>
            <Input
              id="ps_operador"
              value={form.ps_operador}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  ps_operador: e.target.value.toUpperCase(),
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  document.getElementById("senasa")?.focus();
                }
              }}
              className="mt-1 font-mono"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <Label htmlFor="senasa" className="text-xs text-muted-foreground">
              SENASA
            </Label>
            <Input
              id="senasa"
              value={form.senasa}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  senasa: e.target.value.toUpperCase(),
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  document.getElementById("ps_linea")?.focus();
                }
              }}
              className="mt-1 font-mono"
            />
          </div>
          <div className="min-w-0">
            <Label htmlFor="ps_linea" className="text-xs text-muted-foreground">
              PS_LINEA
            </Label>
            <Input
              id="ps_linea"
              value={form.ps_linea}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  ps_linea: e.target.value.toUpperCase(),
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  // Saltar al primer input de precintos múltiples
                  document.getElementById("scanner_ps_beta")?.focus();
                }
              }}
              className="mt-1 font-mono"
            />
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-border" />

        {/* Scanner groups */}
        <ScannerGroup
          id="scanner_ps_beta"
          label="PS BETA (Múltiples)"
          items={form.ps_beta_items}
          maxItems={4}
          onAdd={(val) =>
            setForm((prev) => ({
              ...prev,
              ps_beta_items: [...prev.ps_beta_items, val],
            }))
          }
          onClear={() =>
            setForm((prev) => ({ ...prev, ps_beta_items: [] }))
          }
          resultLabel="PS_BETA"
          resultValue={form.ps_beta_items.join("/")}
        />

        <ScannerGroup
          id="scanner_termografos"
          label="Termografos (Múltiples)"
          items={form.termografos_items}
          onAdd={(val) =>
            setForm((prev) => ({
              ...prev,
              termografos_items: [...prev.termografos_items, val],
            }))
          }
          onClear={() =>
            setForm((prev) => ({ ...prev, termografos_items: [] }))
          }
          resultLabel="TERMOGRAFOS"
          resultValue={form.termografos_items.join("/")}
        />

        <p className="text-xs italic text-muted-foreground">
          SENASA / PS_LINEA se calcula en backend.
        </p>
      </CardContent>
    </Card>
  );
});
