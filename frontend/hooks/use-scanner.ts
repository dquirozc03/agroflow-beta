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
    if (val === lastScanRef.current.val && now - lastScanRef.current.time < 2000) return;
    lastScanRef.current = { val, time: now };

    startTransition(() => {
      setForm((prev) => {
        const fieldId = lastFocusedId.current;
        const toastId = `pc-scan-${val}`;

        if (fieldId && fieldId in prev && !Array.isArray(prev[fieldId as keyof FormState])) {
          toast.info(`Insertado en ${fieldId}: ${val}`, { id: toastId });
          setJustScannedId(fieldId);
          setTimeout(() => setJustScannedId(null), 1000);
          return { ...prev, [fieldId]: val };
        }

        if (/^\d{8}$/.test(val)) {
          toast.info(`DNI Escaneado: ${val}`, { id: toastId });
          setJustScannedId("dni");
          setTimeout(() => setJustScannedId(null), 1000);
          return { ...prev, dni: val };
        }

        if (prev.ps_beta_items.includes(val)) {
          toast.warning("Precinto duplicado", { id: `dup-${val}` });
          return prev;
        }
        
        toast.success(`Precinto agregado: ${val}`, { id: toastId });
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
