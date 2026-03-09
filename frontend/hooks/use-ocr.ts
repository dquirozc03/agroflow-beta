import { useState, useCallback } from "react";

export function useOcr() {
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<{ type: "info" | "success" | "warning"; message: string; subtext?: string }[]>([]);
  const [confidence, setConfidence] = useState<number | null>(null);

  const addLog = useCallback((type: "info" | "success" | "warning", message: string, subtext?: string) => {
    setLogs(prev => [{ type, message, subtext }, ...prev].slice(0, 5));
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setLogs([]);
    setConfidence(null);
  }, []);

  const start = useCallback(() => {
    setStatus("processing");
    setProgress(10);
    setConfidence(null);
    setLogs([]);
    addLog("info", "Iniciando extracción", "Analizando estructura del documento...");
  }, [addLog]);

  return {
    status, setStatus,
    progress, setProgress,
    logs, setLogs,
    confidence, setConfidence,
    addLog,
    reset,
    start
  };
}
