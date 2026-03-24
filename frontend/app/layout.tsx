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
  themeColor: "#0e0e0e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="dark">
      <head>
        <title>AgroFlow | Gestión Logística</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn(
        "min-h-screen bg-[#0e0e0e] antialiased selection:bg-[#b6a0ff]/20 text-white relative font-['Manrope']",
        _inter.variable,
        _publicSans.variable,
        _jetbrains.variable,
        _outfit.variable,
        _outfit.className
      )}>
        {/* Stitch Atmosphere Layer */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#b6a0ff]/5 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 flex h-screen w-full overflow-hidden">
          <Providers>
            <AuthGuard>
              {children}
            </AuthGuard>
          </Providers>
        </div>
        
        <Toaster position="top-right" richColors theme="dark" />
        <SessionTimeout />
      </body>
    </html>
  );
}
