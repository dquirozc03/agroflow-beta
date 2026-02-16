// frontend/components/cards/card-ocr.tsx

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, ScanText, ClipboardPaste, ImageIcon, Upload, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { FormState } from "@/lib/types";
import { extractOcr } from "@/lib/api";

interface Props {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}

type Tipo = "BOOKING" | "AWB";

export function CardOcr({ form, setForm }: Props) {
  const [tipo, setTipo] = useState<Tipo>("BOOKING");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const setFileWithPreview = useCallback(
    (f: File | null) => {
      setFile(f);
      if (preview) URL.revokeObjectURL(preview);

      if (f && f.type.startsWith("image/")) setPreview(URL.createObjectURL(f));
      else setPreview(null);
    },
    [preview]
  );

  const clearFile = () => {
    setFileWithPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // Paste listener (imagen desde portapapeles)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (blob) {
            const pasted = new File([blob], `captura-${Date.now()}.png`, {
              type: blob.type,
            });
            setFileWithPreview(pasted);
            toast.info("Imagen pegada desde portapapeles");
          }
          return;
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [setFileWithPreview]);

  const applyToForm = (value: string) => {
    const v = (value || "").trim();
    if (!v) return;

    if (tipo === "BOOKING") setForm((prev) => ({ ...prev, booking: v }));
    else setForm((prev) => ({ ...prev, awb: v })); // AWB = contenedor
  };

  const handleExtract = async () => {
    if (!file) {
      toast.error("Seleccione o pegue una imagen primero");
      return;
    }

    setLoading(true);

    try {
      const data = await extractOcr(tipo, file);

      const texto = (data?.texto ?? "").toString();
      const mejor = (data?.mejor_valor ?? "").toString().trim();
      const candidatos = Array.isArray(data?.valores_detectados)
        ? data.valores_detectados
        : [];


      if (!mejor && candidatos.length === 0) {
        // Mensaje específico para tu “AWB=contenedor”
        if (tipo === "AWB" && texto.trim().length > 0) {
          toast.warning(
            'No se detectó un contenedor válido. Formato esperado: "AAAA 123456-7" (ej: SEKU 942643-3).'
          );
        } else {
          toast.warning(
            "OCR completado, pero no se detectó ningún valor. Prueba con una imagen más nítida o recortada."
          );
        }
        return;
      }

      // Aplicación automática pro (sin pasos extra)
      if (mejor) {
        applyToForm(mejor);
        toast.success(`OCR aplicado a ${tipo}`);
      } else {
        applyToForm(candidatos[0]);
        toast.success(`OCR aplicado a ${tipo}`);
      }
    } catch (err: any) {
      const detail = err?.body?.detail;
      if (typeof detail === "string" && detail.trim()) toast.error(detail);
      else toast.error("Error al extraer OCR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-card-foreground">
          <ScanText className="h-4 w-4 text-primary" />
          OCR
        </CardTitle>
      </CardHeader>

      <CardContent className="grid gap-3">
        <div className="flex items-end gap-3">
          <div className="w-48">
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as Tipo)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BOOKING">BOOKING</SelectItem>
                <SelectItem value="AWB">AWB (Contenedor)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            onClick={handleExtract}
            disabled={loading || !file}
            className="ml-auto"
          >
            {loading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <ScanText className="mr-1.5 h-3.5 w-3.5" />
            )}
            Extraer con OCR
          </Button>
        </div>

        <div
          onClick={() => !file && fileRef.current?.click()}
          className="relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/10 transition-colors hover:bg-muted/20"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f) setFileWithPreview(f);
            }}
          />

          {!file ? (
            <div className="flex max-w-[420px] flex-col items-center gap-2 px-4 text-center">
              <ImageIcon className="h-7 w-7 text-muted-foreground" />
              <div className="text-base font-semibold text-card-foreground">
                Arrastra o haz clic para subir una imagen
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ClipboardPaste className="h-4 w-4" />
                o pega (Ctrl+V) una captura
              </div>
              <div className="text-xs text-muted-foreground">
                Tip: recorta al texto (BOOKING / contenedor) para mayor precisión.
              </div>
            </div>
          ) : (
            <div className="relative w-full p-3">
              <div className="relative overflow-hidden rounded-lg border bg-background">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt="Vista previa OCR"
                    className="h-[260px] w-full object-contain sm:h-[320px]"
                  />
                ) : (
                  <div className="flex h-[260px] w-full items-center justify-center sm:h-[320px]">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}

                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  title="Quitar imagen"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{file.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tip UX para evitar confusión */}
        {tipo === "AWB" && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            Formato esperado:{" "}
            <span className="font-mono">SEKU 942643-3</span> (4 letras + 6 dígitos
            + guion + 1 dígito). Si viene pegado como{" "}
            <span className="font-mono">SEKU9426433</span>, el sistema lo normaliza.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
