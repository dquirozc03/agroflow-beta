"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";

export default function OperacionesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layout transparente: cada página de operaciones gestiona su propio layout.
  // La página de Instrucciones de Embarque ya incluye AppSidebar + AppHeader.
  // La página de Packing List usa su propio layout interno.
  return <>{children}</>;
}
