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
    router.replace("/login");
    return null;
  }

  // Shell inmediato: mostramos la app aunque esté cargando o despertando el backend
  return (
    <>
      {children}
      <WakingOverlay />
    </>
  );
}
