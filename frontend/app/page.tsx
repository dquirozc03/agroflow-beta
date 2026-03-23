"use client";

import { useAuth } from "@/contexts/auth-context";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";

export default function AgroFlowV2Home() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
        <AppHeader onOpenScanner={() => {}} />

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto lc-scroll bg-[#f8fafd] dark:bg-[#0f172a] p-8">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            <header className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Bienvenido, {user?.nombre || "Usuario"}
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                AgroFlow V2: Iniciando la reconstrucción profesional del sistema.
              </p>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Estado del Sistema</h3>
                <p className="text-sm text-slate-500">
                  Backend: Conectado (Auth Only)<br />
                  Fase: 0 - Reinicio Selectivo
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
