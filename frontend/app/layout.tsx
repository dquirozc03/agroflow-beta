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
        "min-h-screen antialiased selection:bg-indigo-500/20 text-slate-800 relative flex items-center justify-center p-8",
        _inter.variable,
        _publicSans.variable,
        _jetbrains.variable,
        _outfit.variable,
        _outfit.className
      )}>
        {/* Greenhouse Background Overlay (Exacto al mockup) */}
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center brightness-[0.7]"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?q=80&w=2574&auto=format&fit=crop')" }}
        >
          <div className="absolute inset-0 backdrop-blur-md bg-black/10" />
        </div>

        {/* LA GRAN CÁPSULA (Contenedor Maestro V2) */}
        <div className="relative z-10 w-full max-w-[1800px] h-[92vh] flex overflow-hidden rounded-[3.5rem] bg-white/5 backdrop-blur-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10 ring-1 ring-white/20">
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
