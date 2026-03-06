import React from "react"
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Public_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { AuthGuard } from "@/components/auth-guard";
import { SessionTimeout } from "@/components/session-timeout";

import { cn } from "@/lib/utils";
import "./globals.css";

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const _publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans" });
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased selection:bg-primary/20",
        _inter.variable,
        _publicSans.variable,
        _jetbrains.variable
      )}>
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
