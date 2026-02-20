"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { WakingOverlay } from "@/components/waking-overlay";
import { ChangePasswordModal } from "@/components/change-password-modal";

const PUBLIC_PATHS = ["/login", "/scanner"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const isPublic = PUBLIC_PATHS.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    if (isLoading) return;
    if (isPublic) return;
    if (!user) {
      router.replace("/login");
    }
  }, [isLoading, user, isPublic, router]);

  // Ruta pública (login): siempre mostrar
  if (isPublic) {
    return (
      <>
        {children}
        <WakingOverlay />
      </>
    );
  }

  // Ruta protegida: Si está cargando o no hay usuario, no renderizar children (evita flash)
  if (isLoading) return null;
  if (!user) return null;

  // Intercepción: Si el usuario requiere cambio de password
  if (user?.requiere_cambio_password) {
    return (
      <div className="relative h-screen w-full overflow-hidden">
        {/* Fondo del dashboard difuminado para efecto premium */}
        <div className="absolute inset-0 z-0 opacity-50 blur-2xl grayscale-[0.3] pointer-events-none select-none">
          {children}
        </div>

        {/* Overlay oscuro para legibilidad */}
        <div className="absolute inset-0 z-10 bg-slate-950/40 backdrop-blur-[2px]" />

        <div className="relative z-50 flex h-full items-center justify-center p-4">
          <ChangePasswordModal
            isOpen={true}
            onSuccess={() => {
              // Pequeño delay para que se vea el toast de éxito antes del reload
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            }}
            onCancel={() => {
              logout();
            }}
          />
        </div>
      </div>
    );
  }

  // Shell inmediato: mostramos la app aunque esté cargando o despertando el backend
  return (
    <>
      {children}
      <WakingOverlay />
    </>
  );
}
