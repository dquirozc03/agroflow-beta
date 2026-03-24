import React from "react"
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Public_Sans, Outfit, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { AuthGuard } from "@/components/auth-guard";
import { SessionTimeout } from "@/components/session-timeout";

import { cn } from "@/lib/utils";
import "./globals.css";

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const _outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const _spaceG = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-g" });

export const metadata: Metadata = {
  title: "AgroFlow | V2 Integrated",
  description:
    "Sistema Central de Control Operativo AgroFlow.",
};

export const viewport: Viewport = {
  themeColor: "#f6f8fa",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="light">
      <head>
        <title>AgroFlow | Dashboard</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className={cn(
        "min-h-screen bg-[#f6f8fa] antialiased selection:bg-emerald-100 text-slate-900 font-['Inter']",
        _inter.variable,
        _outfit.variable,
        _spaceG.variable
      )}>
        <Providers>
          <AuthGuard>
            {children}
          </AuthGuard>
          
          <Toaster position="top-right" richColors theme="light" />
          <SessionTimeout />
        </Providers>
      </body>
    </html>
  );
}
