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
  title: "AgroFlow | V2 Integrated",
  description:
    "Sistema Central de Control Operativo BETA.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
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
        <title>AgroFlow | V2</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className={cn(
        "min-h-screen bg-white antialiased selection:bg-emerald-100 text-slate-900",
        _inter.variable,
        _publicSans.variable,
        _jetbrains.variable,
        _outfit.variable,
        _outfit.className
      )}>
        <Providers>
          {/* Ajuste: Solo aplicamos Flex al layout una vez autenticado, para no romper el Login */}
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
