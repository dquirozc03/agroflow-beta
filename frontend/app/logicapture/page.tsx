"use client";

import React, { useState } from "react";
import { 
  Scan, 
  Container, 
  BookOpen, 
  Truck, 
  ShieldCheck, 
  Thermometer, 
  Hash, 
  Plus,
  FileText,
  BadgeCheck,
  Zap,
  Target,
  Layers,
  BarChart3,
  Search,
  CheckCircle2,
  AlertCircle,
  Download,
  MoreHorizontal,
  ChevronRight,
  User,
  Activity,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";

// --- Componentes UX Shadcn Lite (Dashboard Version) ---

function StatCard({ title, value, icon: Icon, trend, trendValue }: any) {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200/60 shadow-sm transition-all hover:bg-slate-50 relative group">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-tight">{title}</h4>
        <Icon className="h-4 w-4 text-slate-400 group-hover:text-black transition-colors" />
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        <div className="flex items-center gap-1.5">
           <span className={cn("text-[10px] font-bold", trend === "up" ? "text-emerald-500" : "text-rose-500")}>
              {trend === "up" ? "+" : "-"}{trendValue}%
           </span>
           <span className="text-[10px] text-slate-400 font-medium">from last month</span>
        </div>
      </div>
    </div>
  );
}

function OperationItem({ name, id, amount, status }: any) {
  return (
    <div className="flex items-center justify-between py-4 group hover:bg-slate-50/50 px-2 rounded-lg transition-all cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="h-9 w-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 font-bold text-[10px] group-hover:bg-slate-200">
           {name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 leading-none">{name}</p>
          <p className="text-xs text-slate-400 font-medium mt-1.5">{id}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn("text-sm font-bold", status === "up" ? "text-emerald-600" : "text-slate-900")}>
           {status === "up" ? "+" : ""}{amount}
        </p>
      </div>
    </div>
  );
}

// --- Dashboard Principal: LogiCapture Pro (Shadcn Edition) ---

export default function LogicCaptureShadcnPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* SIDEBAR FIJO (SHADCN ADMIN) */}
      <AppSidebar />

      {/* CONTENIDO CENTRAL */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader />

        <main className="flex-1 overflow-y-auto p-10 lc-scroll">
          <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            
            {/* Header Title & Action (Shadcn Format) */}
            <div className="flex items-center justify-between">
               <h1 className="text-3xl font-bold text-slate-900 tracking-tight italic">Dashboard</h1>
               <button className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                  <Download className="h-4 w-4" />
                  Download
               </button>
            </div>

            {/* Sub-Tabs Navigation (Capsule Format) */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/50 border border-slate-200/60 rounded-xl w-fit">
               {["Overview", "Analytics", "Reports", "Notifications"].map((tab) => (
                 <button 
                   key={tab}
                   onClick={() => setActiveTab(tab.toLowerCase())}
                   className={cn(
                     "px-6 py-1.5 rounded-lg text-xs font-bold transition-all",
                     activeTab === tab.toLowerCase() 
                       ? "bg-white text-black shadow-sm border border-slate-200/50" 
                       : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                   )}
                 >
                   {tab}
                 </button>
               ))}
            </div>

            {/* Operative Stats Grid (The 4 Top Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <StatCard title="Total Scans" value="12,456" icon={Activity} trend="up" trendValue="20.1" />
               <StatCard title="Active Scanners" value="+2350" icon={Users} trend="up" trendValue="180.1" />
               <StatCard title="Successful OCR" value="+12,234" icon={CheckCircle2} trend="up" trendValue="19" />
               <StatCard title="Active Now" value="+573" icon={TrendingUp} trend="up" trendValue="201" />
            </div>

            {/* Main Content Area (Two Columns Layout) */}
            <div className="grid grid-cols-12 gap-6">
               
               {/* IZQUIERDA: Overview Chart (Shadcn Style) */}
               <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-slate-200/60 p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">System Overview</h3>
                    <MoreHorizontal className="h-4 w-4 text-slate-300" />
                  </div>
                  
                  {/* Gráfica de Barras Negras (Referencia Calcada) */}
                  <div className="h-64 w-full flex items-end justify-between gap-4 pt-10 px-4">
                     {[80, 45, 100, 60, 30, 90, 55, 20, 85, 40, 70, 10].map((h, i) => (
                       <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                          <div className="w-full bg-black rounded-t-md group-hover:bg-slate-800 transition-all relative overflow-hidden" style={{ height: `${h}%` }}>
                             <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i]}
                          </span>
                       </div>
                     ))}
                  </div>
               </div>

               {/* DERECHA: Recent Registries (Recent Sales Format) */}
               <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-slate-200/60 p-8 shadow-sm flex flex-col">
                  <div className="flex flex-col mb-8">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Últimos Registros</h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-1 font-headline">Operativa de hoy: 265 capturas exitosas.</p>
                  </div>
                  
                  <div className="divide-y divide-slate-100 overflow-y-auto pr-2 lc-scroll flex-1">
                     <OperationItem name="Olivia Martin" id="CN-BETA-0988" amount="$1,999.00" status="up" />
                     <OperationItem name="Jackson Lee" id="BK-STICH-102" amount="$39.00" status="normal" />
                     <OperationItem name="Isabella Nguyen" id="DAM-ALPHA-90" amount="$299.00" status="up" />
                     <OperationItem name="William Kim" id="OB-BETA-772" amount="$99.00" status="normal" />
                     <OperationItem name="Sofia Davis" id="CN-BETA-1022" amount="$39.00" status="up" />
                  </div>
                  
                  <button className="mt-8 text-[11px] font-bold text-slate-400 hover:text-black transition-colors uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                     View All Activity <ChevronRight className="h-3 w-3" />
                  </button>
               </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
