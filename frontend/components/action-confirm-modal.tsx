"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, HelpCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: "danger" | "warning" | "info";
}

export function ActionConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isLoading = false,
  variant = "info"
}: ActionConfirmModalProps) {
  
  const variants = {
    danger: "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-900/10",
    warning: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-900/10",
    info: "bg-[#022c22] hover:bg-emerald-600 text-white shadow-emerald-900/10"
  };

  const iconColors = {
    danger: "bg-rose-50 text-rose-500",
    warning: "bg-amber-50 text-amber-500",
    info: "bg-emerald-50 text-emerald-500"
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-[#022c22]/40 backdrop-blur-md z-[200] animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl z-[210] animate-in zoom-in-95 focus:outline-none border-0 font-['Outfit']">
          
          <div className="flex flex-col items-center text-center space-y-6">
             <div className={cn("h-20 w-20 rounded-3xl flex items-center justify-center shadow-inner mb-2", iconColors[variant])}>
                <HelpCircle className="h-10 w-10" />
             </div>
             
             <div className="space-y-2">
                <Dialog.Title className={cn("text-2xl font-black tracking-tighter uppercase", variant === "danger" ? "text-rose-600" : "text-[#022c22]")}>
                  {title}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-slate-500 font-bold leading-relaxed uppercase tracking-tight px-6 italic">
                  {message}
                </Dialog.Description>
             </div>

             <div className="flex flex-col w-full gap-3 pt-6">
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={cn(
                    "w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2",
                    variants[variant]
                  )}
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {confirmText}
                </button>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="w-full h-14 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-slate-100 transition-all active:scale-95"
                >
                  {cancelText}
                </button>
             </div>
          </div>

          <Dialog.Close className="absolute top-8 right-8 h-8 w-8 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-300 transition-all outline-none">
             <X className="h-4 w-4" />
          </Dialog.Close>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
