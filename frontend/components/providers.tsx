"use client";

import { ThemeProvider } from "next-themes";
import { BackendStatusProvider } from "@/contexts/backend-status-context";
import { AuthProvider } from "@/contexts/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="agroflow-theme">
      <BackendStatusProvider>
        <AuthProvider>{children}</AuthProvider>
      </BackendStatusProvider>
    </ThemeProvider>
  );
}
