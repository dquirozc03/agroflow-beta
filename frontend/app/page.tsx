"use client";

import { useMemo, useState, useEffect, useCallback, Suspense, useRef, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { useAuth } from "@/contexts/auth-context";
import { canSeeCapturaAndBandeja } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { CardEmbarque } from "@/components/cards/card-embarque";
import { CardOcr } from "@/components/cards/card-ocr";
import { CardOcrStatus } from "@/components/cards/card-ocr-status";
import { CardOperacion } from "@/components/cards/card-operacion";
import { CardAccion } from "@/components/cards/card-accion";
import { BandejaSap } from "@/components/bandeja-sap";
import { HistorialRegistros } from "@/components/historial-registros";
import { ScannerModal } from "@/components/scanner-modal";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ClipboardList, TableProperties, History, LayoutDashboard } from "lucide-react";
import { DashboardContent } from "@/components/dashboard-content";
import { ChatWidget } from "@/components/chat-widget";

import { listRegistros, apiValidarValor } from "@/lib/api";
import type { FormState, SapRow } from "@/lib/types";
import { initialFormState } from "@/lib/types";
import type { RegistroListado } from "@/lib/api";
import { toast } from "sonner";

const BANDEJA_STORAGE_KEY = "logi-capture-bandeja";

function loadBandejaFromStorage(): SapRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BANDEJA_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function AgroFlowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const role = user?.rol;
  const showCapturaBandeja = canSeeCapturaAndBandeja(role ?? "documentaria");
  const tabFromUrl = searchParams?.get("tab");
  const validTab =
    tabFromUrl === "dashboard" ||
      tabFromUrl === "captura" ||
      tabFromUrl === "bandeja" ||
      tabFromUrl === "historial"
      ? tabFromUrl
      : null;
  const defaultTab = validTab ?? "dashboard";
  const isDashboard = defaultTab === "dashboard";
  const isLogiCapture = defaultTab === "captura" || defaultTab === "bandeja" || defaultTab === "historial";

  const [recientes, setRecientes] = useState<RegistroListado[]>([]);

  const fetchRecientes = useCallback(async () => {
    try {
      const res = await listRegistros({ limit: 3 });
      setRecientes(res.items || []);
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    fetchRecientes();
  }, [fetchRecientes]);

  const setTab = useCallback(
    (tab: string) => {
      router.push("/?tab=" + tab);
    },
    [router]
  );

  const [form, setForm] = useState<FormState>(initialFormState);
  const [isPending, startTransition] = useTransition();
  const [refsLocked, setRefsLocked] = useState(false);
  const [registroId, setRegistroId] = useState<number | null>(null);
  const [sapRows, setSapRows] = useState<SapRow[]>([]);
  const [formResetKey, setFormResetKey] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  // Estados para Monitorización OCR
  const [ocrStatus, setOcrStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrLogs, setOcrLogs] = useState<{ type: "info" | "success" | "warning"; message: string; subtext?: string }[]>([]);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [valCache, setValCache] = useState<Record<string, { valido: boolean; mensaje?: string }>>({});

  const addOcrLog = useCallback((type: "info" | "success" | "warning", message: string, subtext?: string) => {
    setOcrLogs(prev => [{ type, message, subtext }, ...prev].slice(0, 5));
  }, []);

  // Track cursor position
  const lastFocusedId = useRef<string | null>(null);

  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT") {
        lastFocusedId.current = target.id;
      }
    };
    document.addEventListener("focusin", handleFocus);
    return () => document.removeEventListener("focusin", handleFocus);
  }, []);

  // Persistencia: restaurar bandeja al cargar
  useEffect(() => {
    setSapRows(loadBandejaFromStorage());
    setHydrated(true);
  }, []);

  // Persistencia: guardar bandeja cuando cambie (evitar guardar antes de hidratar)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(BANDEJA_STORAGE_KEY, JSON.stringify(sapRows));
    } catch {
      // quota o privado
    }
  }, [hydrated, sapRows]);

  const pendingCount = sapRows.length;

  /**
   * ✅ Set de IDs en bandeja (para bloquear duplicados desde Historial).
   * Ojo: usamos Number() por si registro_id viniera como string en algún punto.
   */
  // ✅ Bitácora Reactiva: Monitoreo de campos manuales
  useEffect(() => {
    if (ocrStatus === "processing") return; // No interrumpir si el OCR está corriendo

    const logs: { type: "info" | "success" | "warning"; message: string; subtext?: string }[] = [];

    // 1. Validar Booking (Dato Maestro)
    if (form.booking && form.booking.length > 3) {
      logs.push({ type: "success", message: "Booking Detectado", subtext: form.booking });
    } else if (form.booking) {
      logs.push({ type: "warning", message: "Booking parcial", subtext: "Esperando código completo..." });
    }

    // 2. Validar DNI
    if (form.dni && form.dni.length === 8) {
      logs.push({ type: "success", message: "DNI Verificado", subtext: "Chofer identificado" });
    } else if (form.dni && form.dni.length > 0) {
      logs.push({ type: "info", message: "Ingresando DNI...", subtext: `${form.dni.length}/8 dígitos` });
    }

    // 3. Validar Placas
    if (form.placas_tracto && form.placas_carreta) {
      logs.push({ type: "success", message: "Vehículo Completo", subtext: `${form.placas_tracto} / ${form.placas_carreta}` });
    } else if (form.placas_tracto) {
      logs.push({ type: "info", message: "Placa Tractor lista", subtext: "Falta placa carreta" });
    }

    // 4. Validar DAM
    if (form.dam && form.dam.length > 5) {
      logs.push({ type: "success", message: "DAM Asignada", subtext: form.dam });
    }

    // 5. Validar Precintos (Unicidad en tiempo real)
    const todosPrecintos = [
      ...(form.ps_beta_items || []),
      ...(form.termografos_items || []),
      form.ps_operador,
      form.senasa
    ].filter(v => v && v.trim() && !v.includes("*"));

    todosPrecintos.forEach(p => {
      const cache = valCache[p];
      if (cache) {
        if (cache.valido) {
          logs.push({ type: "success", message: `Precinto ${p}`, subtext: "Único (disponible)" });
        } else {
          logs.push({ type: "warning", message: `Precinto ${p}`, subtext: "¡YA REGISTRADO! (USADO)" });
        }
      } else {
        // Disparar validación si no está en cache (simplificado para Bitácora)
        apiValidarValor("PS_BETA", p).then(res => {
          setValCache(prev => ({ ...prev, [p]: { valido: res.valido, mensaje: res.mensaje } }));
        }).catch(() => { });
      }
    });

    // Especial: Precinto Operador **
    if (form.ps_operador && form.ps_operador.includes("*")) {
      logs.push({ type: "success", message: "Precinto Operador", subtext: "Omitido o Comodín (**)" });
    }

    if (logs.length > 0) {
      setOcrLogs(logs);
      if (ocrStatus === "idle") setOcrProgress(Math.min(logs.length * 20, 100));
    }
  }, [form.booking, form.dni, form.placas_tracto, form.placas_carreta, form.dam, form.ps_beta_items, form.termografos_items, form.ps_operador, form.senasa, ocrStatus, valCache]);

  const bandejaIds = useMemo(() => {
    return new Set(sapRows.map((r) => Number(r.registro_id)));
  }, [sapRows]);

  /**
   * ✅ Agregar a bandeja (con blindaje anti-duplicados).
   * - Si ya existe: actualiza el item (mantiene datos frescos).
   * - Si no existe: lo agrega al final.
   *
   * Nota: esto complementa el bloqueo del botón en Historial.
   */
  const handleSapRow = useCallback((row: SapRow) => {
    setSapRows((prev) => {
      const nextId = Number(row.registro_id);
      const existsIndex = prev.findIndex((r) => Number(r.registro_id) === nextId);

      if (existsIndex !== -1) {
        // actualiza sin crear duplicado
        const next = [...prev];
        next[existsIndex] = row;
        return next;
      }

      return [...prev, row];
    });
    // Refrescar recientes tras cada inserción existosa
    fetchRecientes();
  }, [fetchRecientes]);

  /**
   * ✅ Flujo profesional:
   * - Limpia el formulario para iniciar un nuevo registro
   * - Resetea flags UI (refsLocked)
   * - Resetea registroId (si aplica)
   * - Fuerza re-mount del CardOcr (para limpiar preview/estado interno)
   */
  const handleNuevoRegistro = useCallback(() => {
    setForm(initialFormState);
    setRefsLocked(false);
    setRegistroId(null);
    setFormResetKey((k) => k + 1);
    toast.success("Formulario listo para nuevo registro");
  }, []);

  const tabLabelBandeja = useMemo(() => {
    return pendingCount > 0 ? `Bandeja SAP (${pendingCount})` : "Bandeja SAP";
  }, [pendingCount]);

  // Scanner Logic
  const [scannerOpen, setScannerOpen] = useState(false);
  const [justScannedId, setJustScannedId] = useState<string | null>(null);
  const lastScanRef = useRef<{ val: string; time: number }>({ val: "", time: 0 });

  const handleScan = useCallback((data: string) => {
    const val = data.trim().toUpperCase();
    if (!val) return;

    // 🛡️ DEDUPLICACIÓN PC: No alertar lo mismo en menos de 2 segundos
    const now = Date.now();
    if (val === lastScanRef.current.val && now - lastScanRef.current.time < 2000) return;
    lastScanRef.current = { val, time: now };

    startTransition(() => {
      setForm((prev) => {
        const fieldId = lastFocusedId.current;
        const toastId = `pc-scan-${val}`; // ID único para deduplicar toasts en sonner

        // 1. Si hay un campo enfocado, intentar insertar ahí
        if (fieldId && fieldId in prev && !Array.isArray(prev[fieldId as keyof FormState])) {
          toast.info(`Insertado en ${fieldId}: ${val}`, { id: toastId });
          setJustScannedId(fieldId);
          setTimeout(() => setJustScannedId(null), 1000);
          return { ...prev, [fieldId]: val };
        }

        // 2. Si no hay foco o el campo no es directo (ej: items), usar lógica inteligente
        if (/^\d{8}$/.test(val)) {
          toast.info(`DNI Escaneado: ${val}`, { id: toastId });
          setJustScannedId("dni");
          setTimeout(() => setJustScannedId(null), 1000);
          return { ...prev, dni: val };
        }

        // 3. Por defecto u otros casos: Agregar a PS_BETA_ITEMS (Precintos múltiples)
        if (prev.ps_beta_items.includes(val)) {
          toast.warning("Precinto duplicado", { id: `dup-${val}` });
          return prev;
        }
        toast.success(`Precinto agregado: ${val}`, { id: toastId });
        // Para items múltiples, flasheamos el input del scanner correspondiente
        setJustScannedId("scanner_ps_beta");
        setTimeout(() => setJustScannedId(null), 1000);
        return {
          ...prev,
          ps_beta_items: [...prev.ps_beta_items, val],
        };
      });
    });
  }, []);

  // Debug: Exponer handleScan para pruebas manuales
  useEffect(() => {
    (window as any).simulateScan = handleScan;
    return () => { delete (window as any).simulateScan; };
  }, [handleScan]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />

      <ScannerModal
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleScan}
      />

      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
        <AppHeader onOpenScanner={() => setScannerOpen(true)} />

        {/* Contenido principal + footer fijo abajo */}
        {/* Contenido principal + footer fijo abajo */}
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto lc-scroll bg-[#f8fafd] dark:bg-[#0f172a] pb-16">
          {isDashboard ? (
            /* Solo Dashboard: sin pestañas */
            <div className="mt-0 flex-1 min-h-0 overflow-auto">
              <DashboardContent />
            </div>
          ) : isLogiCapture ? (
            /* LogiCapture: solo pestañas Captura, Bandeja, Historial (sin Dashboard) */
            <Tabs value={defaultTab} onValueChange={setTab} className="flex h-full flex-col">
              <div className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 pt-2 sticky top-0 z-30 supports-[backdrop-filter]:bg-background/60">
                <TabsList className="bg-transparent">
                  {showCapturaBandeja && (
                    <>
                      <TabsTrigger
                        value="captura"
                        className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all duration-300"
                      >
                        <ClipboardList className="h-4 w-4" />
                        Captura
                      </TabsTrigger>
                      <TabsTrigger
                        value="bandeja"
                        className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all duration-300"
                      >
                        <TableProperties className="h-4 w-4" />
                        {tabLabelBandeja}
                        {pendingCount > 0 && (
                          <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground animate-pulse">
                            {pendingCount}
                          </span>
                        )}
                      </TabsTrigger>
                    </>
                  )}
                  <TabsTrigger
                    value="historial"
                    className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all duration-300"
                  >
                    <History className="h-4 w-4" />
                    Historial
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* CAPTURA — solo para roles con acceso */}
              {showCapturaBandeja && (
                <div className={cn("flex-1 min-h-0 overflow-auto focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500", defaultTab !== "captura" && "hidden")}>
                  {/* Top Header Section */}
                  <header className="px-6 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-[1800px] mx-auto w-full">
                    <div>
                      <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                        <span>Operaciones</span>
                        <span className="material-symbols-outlined text-xs notranslate">chevron_right</span>
                        <span className="text-primary font-medium">LogicCapture</span>
                      </div>
                      <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Nueva Captura</h2>
                      <p className="text-slate-500 mt-1">Gestión inteligente de datos de embarque.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <CardAccion
                        form={form}
                        registroId={registroId}
                        setRegistroId={setRegistroId}
                        onSapRow={handleSapRow}
                        onNuevoRegistro={handleNuevoRegistro}
                        isHeaderVariant // Esto requerirá un pequeño ajuste en CardAccion para mostrarse como botón
                      />
                    </div>
                  </header>

                  <div className="mx-auto w-full max-w-[1800px] px-6 pb-12">
                    <div className="grid grid-cols-12 gap-6">

                      {/* Left Column: Intake & Insights (4 col) */}
                      <div className="col-span-12 lg:col-span-4 space-y-6">
                        <CardOcr
                          key={`ocr-${formResetKey}`}
                          form={form}
                          setForm={setForm}
                          onProcessingStart={() => {
                            setOcrStatus("processing");
                            setOcrProgress(10);
                            setOcrConfidence(null);
                            setOcrLogs([]);
                            addOcrLog("info", "Iniciando extracción", "Analizando estructura del documento...");
                          }}
                          onProcessingProgress={(p: number) => setOcrProgress(p)}
                          onProcessingLog={(type: "info" | "success" | "warning", msg: string, sub?: string) => addOcrLog(type, msg, sub)}
                          onProcessingEnd={(confidence: number | null) => {
                            setOcrStatus("success");
                            setOcrProgress(100);
                            setOcrConfidence(confidence);
                          }}
                          onProcessingError={(err: string) => {
                            setOcrStatus("error");
                            setOcrProgress(0);
                            addOcrLog("warning", "Error en extracción", err);
                          }}
                        />
                        <CardOcrStatus
                          status={ocrStatus}
                          progress={ocrProgress}
                          logs={ocrLogs}
                          confidence={ocrConfidence}
                        />
                      </div>

                      {/* Right Column: Form Data (8 col) */}
                      <div className="col-span-12 lg:col-span-8 space-y-6">
                        <CardEmbarque
                          form={form}
                          setForm={setForm}
                          refsLocked={refsLocked}
                          setRefsLocked={setRefsLocked}
                          justScannedId={justScannedId}
                        />
                        <CardOperacion
                          form={form}
                          setForm={setForm}
                          justScannedId={justScannedId}
                        />

                        {/* Entradas Recientes Section (Manual Placeholder integration) */}
                        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Registros Recientes</span>
                            <button onClick={() => setTab("historial")} className="text-xs text-primary font-bold hover:underline">Ver todas</button>
                          </div>
                          <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recientes.length > 0 ? (
                              recientes.map((reg) => (
                                <div
                                  key={reg.id}
                                  className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                                  onClick={() => setTab("historial")}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                      reg.estado === "procesado" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30" : "bg-primary/10 text-primary"
                                    )}>
                                      <span className="material-symbols-outlined text-lg notranslate">
                                        {reg.estado === "procesado" ? "check_circle" : "inventory_2"}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none">
                                        {reg.booking || "SIN BOOKING"}
                                      </p>
                                      <div className="flex items-center gap-1.5 mt-1.5">
                                        <span className={cn(
                                          "text-[9px] font-black uppercase px-1.5 py-0.5 rounded",
                                          reg.estado === "procesado" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40" : "bg-slate-100 text-slate-600 dark:bg-slate-800"
                                        )}>
                                          {reg.estado}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                          {new Date(reg.fecha_registro).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors notranslate">chevron_right</span>
                                </div>
                              ))
                            ) : (
                              <div className="p-8 text-center bg-slate-50/30 dark:bg-transparent">
                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <span className="material-symbols-outlined text-slate-400 notranslate">history</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 italic">No hay registros recientes</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-tight mt-1">Los registros aparecerán aquí al finalizar capturas</p>
                              </div>
                            )}
                          </div>
                        </section>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* BANDEJA — solo para roles con acceso */}
              {showCapturaBandeja && (
                <div className={cn("animate-in fade-in slide-in-from-bottom-2 duration-500", defaultTab !== "bandeja" && "hidden")}>
                  <div className="mx-auto w-full max-w-[1800px] p-4 md:p-6 2xl:max-w-[2000px]">
                    <div className="mb-4">
                      <div className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">Bandeja SAP</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        Registros guardados en el navegador; se mantienen al refrescar. Listos para exportar y cargar en SAP.
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/50 backdrop-blur-sm p-3 shadow-lg transition-all duration-300 md:p-4 hover:shadow-xl">
                      <BandejaSap className="w-full" rows={sapRows} setRows={setSapRows} />
                    </div>
                  </div>
                </div>
              )}

              {/* HISTORIAL — todos los roles */}
              <div className={cn("flex-1 overflow-hidden", defaultTab !== "historial" && "hidden")}>
                <div className="flex h-full min-w-0 flex-col overflow-auto">
                  <div className="mx-auto w-full max-w-[1800px] p-4 md:p-6 2xl:max-w-[2000px]">
                    <div className="mb-4">
                      <div className="text-lg font-semibold text-card-foreground">
                        Historial de registros
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Todo lo registrado; mostrado por páginas. Añade filas a la Bandeja SAP si necesitas reexportar.
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-3 shadow-sm md:p-4">
                      <HistorialRegistros onAddSapRow={handleSapRow} bandejaIds={bandejaIds} />
                    </div>
                  </div>
                </div>
              </div>
            </Tabs>
          ) : null}
        </main>

        <AppFooter />
        <ChatWidget />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center text-muted-foreground">Cargando aplicación...</div>}>
      <AgroFlowContent />
    </Suspense>
  );
}
