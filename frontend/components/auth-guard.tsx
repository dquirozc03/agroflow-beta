// frontend/components/auth-guard.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

const PUBLIC_PATHS = ["/login"];

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

  // Si es una ruta pública, permitir siempre
  if (isPublic) return <>{children}</>;

  // Si está cargando o no hay usuario en ruta protegida, no mostrar nada (evita parpadeo)
  if (isLoading || !user) return null;

  // Renderizar la aplicación
  return <>{children}</>;
}
