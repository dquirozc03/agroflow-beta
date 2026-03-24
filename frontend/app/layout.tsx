import React from "react"
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Public_Sans, Outfit } from "next/font/google";
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
const _outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });


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
        <title>AgroFlow | Gestión Logística</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn(
        "min-h-screen antialiased selection:bg-indigo-500/20 text-slate-800 relative flex items-center justify-center p-8 bg-[#eef1f5]",
        _inter.variable,
        _publicSans.variable,
        _jetbrains.variable,
        _outfit.variable,
        _outfit.className
      )}>
        {/* Background Atmosphere (Luz real) */}
        <div className="fixed inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/40 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-100/30 blur-[120px] rounded-full" />
        </div>

        {/* LA GRAN CÁPSULA (LUMINOSA) */}
        <div className="relative z-10 w-full max-w-[1700px] h-[92vh] flex overflow-hidden rounded-[3.5rem] bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-white/50 ring-1 ring-black/5">
          <Providers>
            <AuthGuard>
              {children}
            </AuthGuard>
          </Providers>
        </div>
        
        {/* Toaster & Overlays (Fuera de la cápsula) */}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
