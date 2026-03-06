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

import type { FormState, SapRow } from "@/lib/types";
import { initialFormState } from "@/lib/types";
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
  }, []);

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
                      <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Nueva Entrada Operacional</h2>
                      <p className="text-slate-500 mt-1">Gestión inteligente de datos de embarque.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10 px-4 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-sm transition-all">
                        <span className="material-symbols-outlined mr-2 text-lg notranslate">save</span>
                        Guardar Borrador
                      </Button>
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
                        <CardOcr key={`ocr-${formResetKey}`} form={form} setForm={setForm} />
                        <CardOcrStatus />
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
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Entradas Recientes</span>
                            <button onClick={() => setTab("historial")} className="text-xs text-primary font-bold hover:underline">Ver todas</button>
                          </div>
                          <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {/* Aquí integraremos un mini listado del historial si se desea, por ahora mockups según HTML */}
                            <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                  <span className="material-symbols-outlined text-lg notranslate">description</span>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">BK-772818-A</p>
                                  <p className="text-[10px] text-slate-500">Último registro procesado con éxito</p>
                                </div>
                              </div>
                              <span className="material-symbols-outlined text-slate-300 notranslate">chevron_right</span>
                            </div>
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
