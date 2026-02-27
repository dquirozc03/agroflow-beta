import React from "react"
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { AuthGuard } from "@/components/auth-guard";
import { SessionTimeout } from "@/components/session-timeout";

import "./globals.css";

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const _jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "AgroFlow · Área comercial y exportaciones",
  description:
    "Sistema AgroFlow para el área comercial y exportaciones. LogiCapture: registro operativo, bandeja SAP e historial. Por Nexora Technologies.",
};

export const viewport: Viewport = {
  themeColor: "#5fb83d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          <AuthGuard>
            {children}
            <SessionTimeout />
            <Toaster position="top-right" richColors />
          </AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
