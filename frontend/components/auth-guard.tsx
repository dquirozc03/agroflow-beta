"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { WakingOverlay } from "@/components/waking-overlay";

const PUBLIC_PATHS = ["/login", "/scanner"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
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

  // Ruta protegida sin usuario ni carga en curso → redirigir (evitar flash)
  if (!user && !isLoading) return null;

  // Shell inmediato: mostramos la app aunque esté cargando o despertando el backend
  return (
    <>
      {children}
      <WakingOverlay />
    </>
  );
}
