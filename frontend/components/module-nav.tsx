"use client";

import Link from "next/link";
import { ClipboardList, TableProperties, History } from "lucide-react";

type Tab = "captura" | "bandeja" | "historial";

const links: { tab: Tab; label: string; href: string; icon: React.ElementType }[] = [
  { tab: "captura", label: "Captura", href: "/?tab=captura", icon: ClipboardList },
  { tab: "bandeja", label: "Bandeja SAP", href: "/?tab=bandeja", icon: TableProperties },
  { tab: "historial", label: "Historial", href: "/?tab=historial", icon: History },
];

type Props = {
  currentTab: Tab;
  showCapturaBandeja: boolean;
};

export function ModuleNav({ currentTab, showCapturaBandeja }: Props) {
  const toShow = showCapturaBandeja
    ? links
    : links.filter((l) => l.tab === "historial");

  if (toShow.length <= 1) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
      <span className="text-xs font-medium text-muted-foreground">Ir a:</span>
      {toShow.map(({ tab, label, href, icon: Icon }) => (
        <Link
          key={tab}
          href={href}
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
            currentTab === tab
              ? "bg-primary/15 text-primary font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </Link>
      ))}
    </div>
  );
}
