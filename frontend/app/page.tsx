"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { useAuth } from "@/contexts/auth-context";
import { canSeeCapturaAndBandeja } from "@/lib/constants";

import { CardEmbarque } from "@/components/cards/card-embarque";
import { CardOcr } from "@/components/cards/card-ocr";
import { CardOperacion } from "@/components/cards/card-operacion";
import { CardUnicidad } from "@/components/cards/card-unicidad";
import { CardAccion } from "@/components/cards/card-accion";
import { BandejaSap } from "@/components/bandeja-sap";
import { HistorialRegistros } from "@/components/historial-registros";

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

export default function Page() {
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
  const [refsLocked, setRefsLocked] = useState(false);
  const [registroId, setRegistroId] = useState<number | null>(null);
  const [sapRows, setSapRows] = useState<SapRow[]>([]);
  const [formResetKey, setFormResetKey] = useState(0);
  const [hydrated, setHydrated] = useState(false);

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

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />

        {/* Contenido principal + footer fijo abajo */}
        <main className="flex min-w-0 flex-1 flex-col bg-muted/20">
          {isDashboard ? (
            /* Solo Dashboard: sin pestañas */
            <div className="mt-0 flex-1 min-h-0 overflow-auto">
              <DashboardContent />
            </div>
          ) : isLogiCapture ? (
            /* LogiCapture: solo pestañas Captura, Bandeja, Historial (sin Dashboard) */
            <Tabs value={defaultTab} onValueChange={setTab} className="flex h-full flex-col">
              <div className="border-b border-border bg-card/90 backdrop-blur px-6 pt-2">
                <TabsList className="bg-transparent">
                  {showCapturaBandeja && (
                    <>
                      <TabsTrigger
                        value="captura"
                        className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      >
                        <ClipboardList className="h-4 w-4" />
                        Captura
                      </TabsTrigger>
                      <TabsTrigger
                        value="bandeja"
                        className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      >
                        <TableProperties className="h-4 w-4" />
                        {tabLabelBandeja}
                        {pendingCount > 0 && (
                          <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                            {pendingCount}
                          </span>
                        )}
                      </TabsTrigger>
                    </>
                  )}
                  <TabsTrigger
                    value="historial"
                    className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                  >
                    <History className="h-4 w-4" />
                    Historial
                  </TabsTrigger>
                </TabsList>
              </div>

            {/* CAPTURA — solo para roles con acceso */}
            {showCapturaBandeja && (
            <TabsContent value="captura" className="mt-0 flex-1 min-h-0 overflow-auto">
                {/*
                  ✅ Layout tipo ERP:
                  - Más ancho útil (sin sentirse “pegado” a los bordes)
                  - Mejor aprovechamiento vertical
                */}
              <div className="mx-auto w-full max-w-[1800px] p-4 md:p-6 2xl:max-w-[2000px]">
                  <div className="mb-4 flex flex-col gap-1">
                    <div className="text-lg font-semibold text-card-foreground">
                      Captura operativa
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Registra embarques, valida unicidad y prepara datos para la bandeja SAP.
                    </div>
                  </div>

                  {/* ✅ “Shell” tipo sistema */}
                  <div className="rounded-2xl border border-border bg-background shadow-sm">
                    <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_520px] 2xl:grid-cols-[minmax(0,1fr)_600px]">
                      {/* Columna principal */}
                      <div className="min-w-0 space-y-4">
                        <CardEmbarque
                          form={form}
                          setForm={setForm}
                          refsLocked={refsLocked}
                          setRefsLocked={setRefsLocked}
                        />

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                          <CardOperacion form={form} setForm={setForm} />
                          <CardUnicidad form={form} setForm={setForm} />
                        </div>
                      </div>

                      {/* Columna lateral: OCR + Acción (poco espacio entre ellos) */}
                      <div className="space-y-3">
                        <CardOcr key={`ocr-${formResetKey}`} form={form} setForm={setForm} />
                        <div className="sticky top-2">
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
            </TabsContent>
            )}

            {/* BANDEJA — solo para roles con acceso */}
            {showCapturaBandeja && (
            <TabsContent value="bandeja" className="mt-0">
              <div className="mx-auto w-full max-w-[1800px] p-4 md:p-6 2xl:max-w-[2000px]">
                <div className="mb-4">
                  <div className="text-lg font-semibold text-card-foreground">Bandeja SAP</div>
                  <div className="text-sm text-muted-foreground">
                    Registros guardados en el navegador; se mantienen al refrescar. Listos para exportar y cargar en SAP.
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background p-3 shadow-sm md:p-4">
                  <BandejaSap className="w-full" rows={sapRows} setRows={setSapRows} />
                </div>
              </div>
            </TabsContent>
            )}

            {/* HISTORIAL — todos los roles */}
            <TabsContent value="historial" className="mt-0 flex-1 overflow-hidden">
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
            </TabsContent>
          </Tabs>
          ) : null}
        </main>

        <AppFooter />
        <ChatWidget />
      </div>
    </div>
  );
}
