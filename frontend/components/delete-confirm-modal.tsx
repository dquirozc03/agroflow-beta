"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Trash2, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  isLoading?: boolean;
  showSuccess?: boolean;
}

export function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirmar Eliminación", 
  message = "¿Está seguro de eliminar este registro? Esta acción no se puede deshacer.",
  isLoading = false,
  showSuccess = false
}: DeleteConfirmModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl z-[160] animate-in zoom-in-95 focus:outline-none">
          
          <div className="flex flex-col items-center text-center space-y-4">
             {showSuccess ? (
               <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center space-y-4 py-4">
                 <div className="h-20 w-20 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center shadow-sm">
                   <CheckCircle2 className="h-10 w-10" />
                 </div>
                 <div>
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Registro Eliminado</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Los datos han sido borrados con éxito</p>
                 </div>
               </div>
             ) : (
               <>
                 <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center shadow-inner mb-2">
                    <AlertTriangle className="h-8 w-8" />
                 </div>
                 
                 <div>
                    <Dialog.Title className="text-xl font-extrabold tracking-tighter text-[#022c22]">
                      {title}
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">
                      {message}
                    </Dialog.Description>
                 </div>

                 <div className="flex flex-col w-full gap-3 pt-4">
                    <button
                      onClick={onConfirm}
                      disabled={isLoading}
                      className="w-full h-12 bg-rose-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Eliminar Ahora
                    </button>
                    <button
                      onClick={onClose}
                      disabled={isLoading}
                      className="w-full h-12 bg-slate-50 text-slate-500 rounded-xl font-bold hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                 </div>
               </>
             )}
          </div>

          <Dialog.Close className="absolute top-6 right-6 h-8 w-8 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-300 transition-all outline-none">
             <X className="h-4 w-4" />
          </Dialog.Close>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
