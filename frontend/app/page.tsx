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
import { CardOperacion } from "@/components/cards/card-operacion";
import { CardUnicidad } from "@/components/cards/card-unicidad";
import { CardAccion } from "@/components/cards/card-accion";
import { BandejaSap } from "@/components/bandeja-sap";
import { HistorialRegistros } from "@/components/historial-registros";
import { ScannerModal } from "@/components/scanner-modal";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const handleScan = useCallback((data: string) => {
    const val = data.trim().toUpperCase();
    if (!val) return;

    startTransition(() => {
      setForm((prev) => {
        const fieldId = lastFocusedId.current;

        // 1. Si hay un campo enfocado, intentar insertar ahí
        if (fieldId && fieldId in prev && !Array.isArray(prev[fieldId as keyof FormState])) {
          toast.info(`Insertado en ${fieldId}: ${val}`);
          setJustScannedId(fieldId);
          setTimeout(() => setJustScannedId(null), 1000);
          return { ...prev, [fieldId]: val };
        }

        // 2. Si no hay foco o el campo no es directo (ej: items), usar lógica inteligente
        // Si parece DNI (8 dígitos numéricos), forzar al DNI
        if (/^\d{8}$/.test(val)) {
          toast.info(`DNI Escaneado: ${val}`);
          setJustScannedId("dni");
          setTimeout(() => setJustScannedId(null), 1000);
          return { ...prev, dni: val };
        }

        // 3. Por defecto u otros casos: Agregar a PS_BETA_ITEMS (Precintos múltiples)
        if (prev.ps_beta_items.includes(val)) {
          toast.warning("Precinto duplicado (ya está en lista)");
          return prev;
        }
        toast.success(`Precinto agregado: ${val}`);
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
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto lc-scroll bg-gradient-to-br from-slate-50 via-slate-50/50 to-slate-100/50 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950/50 pb-16">
          {isDashboard ? (
            /* Solo Dashboard: sin pestañas */
            <div className="mt-0 flex-1 min-h-0 overflow-auto">
              <DashboardContent />
            </div>
          ) : isLogiCapture ? (
            /* LogiCapture: solo pestañas Captura, Bandeja, Historial (sin Dashboard) */
            <Tabs value={defaultTab} onValueChange={setTab} className="flex h-full flex-col">
              <div className="border-b border-border/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md px-6 pt-2 sticky top-0 z-30 supports-[backdrop-filter]:bg-background/60">
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
                  {/*
                  ✅ Layout tipo ERP:
                  - Más ancho útil (sin sentirse "pegado" a los bordes)
                  - Mejor aprovechamiento vertical
                */}
                  <div className="mx-auto w-full max-w-[1800px] p-4 md:p-6 2xl:max-w-[2000px]">
                    <div className="mb-4 flex flex-col gap-1">
                      <div className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                        Captura operativa
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        Registra embarques, valida unicidad y prepara datos para la bandeja SAP.
                      </div>
                    </div>

                    {/* ✅ "Shell" tipo sistema */}
                    <div className="rounded-2xl border border-border/60 bg-background/50 backdrop-blur-sm shadow-sm">
                      <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_450px]">
                        {/* Columna principal */}
                        <div className="min-w-0 space-y-4">
                          <div className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                            <CardEmbarque
                              form={form}
                              setForm={setForm}
                              refsLocked={refsLocked}
                              setRefsLocked={setRefsLocked}
                              justScannedId={justScannedId}
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                              <CardOperacion form={form} setForm={setForm} justScannedId={justScannedId} />
                            </div>
                            <div className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                              <CardUnicidad form={form} setForm={setForm} justScannedId={justScannedId} />
                            </div>
                          </div>
                        </div>

                        {/* Columna lateral: OCR + Acción (poco espacio entre ellos) */}
                        <div className="space-y-3">
                          <div className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                            <CardOcr key={`ocr-${formResetKey}`} form={form} setForm={setForm} />
                          </div>
                          <div className="sticky top-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 z-20">
                            <CardAccion
                              form={form}
                              registroId={registroId}
                              setRegistroId={setRegistroId}
                              onSapRow={handleSapRow}
                              onNuevoRegistro={handleNuevoRegistro}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="h-6" />
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
