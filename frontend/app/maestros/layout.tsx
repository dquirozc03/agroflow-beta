"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";

export default function MaestrosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f6f8fa]">
      {/* SIDEBAR FIJO */}
      <AppSidebar />

      {/* CONTENIDO CENTRAL */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader />

        <main className="flex-1 overflow-y-auto p-10 lc-scroll pt-2">
          <div className="max-w-[1500px] mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
