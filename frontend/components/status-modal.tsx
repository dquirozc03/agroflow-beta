"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, CheckCircle2, AlertCircle, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "success" | "error" | "info";
  title: string;
  message: string;
  buttonText?: string;
}

export function StatusModal({ 
  isOpen, 
  onClose, 
  type = "success", 
  title, 
  message,
  buttonText = "Entendido"
}: StatusModalProps) {
  
  const config = {
    success: {
      icon: CheckCircle2,
      color: "emerald",
      bg: "bg-emerald-50",
      text: "text-emerald-500",
      btn: "bg-emerald-600 hover:bg-[#022c22]"
    },
    error: {
      icon: AlertCircle,
      color: "rose",
      bg: "bg-rose-50",
      text: "text-rose-500",
      btn: "bg-rose-600 hover:bg-rose-700"
    },
    info: {
      icon: Info,
      color: "indigo",
      bg: "bg-indigo-50",
      text: "text-indigo-500",
      btn: "bg-indigo-600 hover:bg-indigo-700"
    }
  }[type];

  const Icon = config.icon;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-[#022c22]/40 backdrop-blur-md z-[200] animate-in fade-in transition-all duration-500" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[400px] bg-white rounded-[2.5rem] p-10 shadow-[0_30px_100px_-20px_rgba(2,44,34,0.4)] z-[210] animate-in zoom-in-95 focus:outline-none border-0 overflow-hidden font-['Outfit']">
          
          <div className="flex flex-col items-center text-center space-y-6">
             <div className={cn("h-20 w-20 rounded-[2rem] flex items-center justify-center shadow-inner mb-2 animate-in slide-in-from-bottom-4 duration-700", config.bg, config.text)}>
                <Icon className="h-10 w-10" />
             </div>
             
             <div className="space-y-2">
                <Dialog.Title className={cn("text-2xl font-black tracking-tighter uppercase", type === "error" ? "text-rose-600" : "text-[#022c22]")}>
                  {title}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-slate-500 font-bold leading-relaxed uppercase tracking-tight px-4">
                  {message}
                </Dialog.Description>
             </div>

             <div className="w-full pt-4">
                <button
                  onClick={onClose}
                  className={cn(
                    "w-full h-14 text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-emerald-900/10",
                    config.btn
                  )}
                >
                  {buttonText}
                </button>
             </div>
          </div>

          <Dialog.Close className="absolute top-8 right-8 h-8 w-8 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-300 transition-all outline-none">
             <X className="h-4 w-4" />
          </Dialog.Close>

          {/* Decorative bar */}
          <div className={cn("absolute bottom-0 left-0 w-full h-1.5", type === "success" ? "bg-emerald-500" : type === "error" ? "bg-rose-500" : "bg-indigo-500")} />

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
