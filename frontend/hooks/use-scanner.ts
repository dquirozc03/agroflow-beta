import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { FormState } from "@/lib/types";

export function useScanner(setForm: React.Dispatch<React.SetStateAction<FormState>>, startTransition: (callback: () => void) => void) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [justScannedId, setJustScannedId] = useState<string | null>(null);
  const lastScanRef = useRef<{ val: string; time: number }>({ val: "", time: 0 });
  const lastFocusedId = useRef<string | null>(null);

  const handleScan = useCallback((data: string) => {
    const val = data.trim().toUpperCase();
    if (!val) return;

    const now = Date.now();
    // Sincronizado con el móvil: 5 segundos de cooldown para evitar ráfagas
    if (now - lastScanRef.current.time < 5000) return;
    lastScanRef.current = { val, time: now };

    startTransition(() => {
      setForm((prev) => {
        const fieldId = lastFocusedId.current;
        const toastId = `pc-scan-${val}`;

        // Mapeo inteligente de IDs de DOM a propiedades de FormState
        const fieldMap: Record<string, keyof FormState> = {
          "input-booking": "booking",
          "input-dni": "dni",
          "input-placas-tracto": "placas_tracto",
          "input-placas-carreta": "placas_carreta",
          "input-ps-operador": "ps_operador",
          "input-senasa": "senasa"
        };

        const targetField = fieldId ? (fieldMap[fieldId] || fieldId) : null;

        if (targetField && targetField in prev && !Array.isArray(prev[targetField as keyof FormState])) {
          toast.info(`Insertado en ${String(targetField).toUpperCase()}: ${val}`, { id: toastId });
          setJustScannedId(String(targetField));
          setTimeout(() => setJustScannedId(null), 1000);
          return { ...prev, [targetField]: val };
        }

        // Fallback: Si no hay foco, intentar adivinar por formato
        if (/^\d{8}$/.test(val)) {
          toast.info(`DNI Detectado: ${val}`, { id: toastId });
          setJustScannedId("dni");
          setTimeout(() => setJustScannedId(null), 1000);
          return { ...prev, dni: val };
        }

        // Por defecto, si no se sabe dónde va, es un Precinto Beta
        if (prev.ps_beta_items.includes(val)) {
          toast.warning("Precinto ya en lista", { id: `dup-${val}` });
          return prev;
        }
        
        toast.success(`Precinto Beta: ${val}`, { id: toastId });
        setJustScannedId("scanner_ps_beta");
        setTimeout(() => setJustScannedId(null), 1000);
        return {
          ...prev,
          ps_beta_items: [...prev.ps_beta_items, val],
        };
      });
    });
  }, [setForm, startTransition]);

  return {
    scannerOpen, setScannerOpen,
    justScannedId, setJustScannedId,
    lastFocusedId,
    handleScan
  };
}
