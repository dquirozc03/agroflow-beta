"use client";

import { Truck, Container } from "lucide-react";

export function TruckLoader() {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-2">
            <div className="relative h-16 w-full max-w-[300px] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-transparent via-white/5 to-transparent shadow-inner">
                {/* Road markings */}
                <div className="absolute bottom-0 h-1 w-full bg-slate-700/50">
                    <div className="h-full w-full animate-[slide_1s_linear_infinite] bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,#fbbf24_20px,#fbbf24_40px)] opacity-60"></div>
                </div>

                {/* Moving Truck Assembly */}
                <div className="absolute bottom-1 right-1/2 flex translate-x-1/2 items-end animate-bounce-slight">
                    {/* Trailer (Container) */}
                    <div className="relative -mr-1 z-10">
                        <Container className="h-10 w-10 text-slate-300 drop-shadow-md" strokeWidth={1.5} fill="rgba(255,255,255,0.1)" />
                    </div>

                    {/* Tractor Head */}
                    <div className="relative z-20 text-primary drop-shadow-[0_0_10px_rgba(124,197,70,0.6)]">
                        <Truck className="h-10 w-10 scale-x-[-1]" strokeWidth={1.5} />
                        {/* Speed lines */}
                        <div className="absolute -right-4 top-2 flex flex-col gap-1 opacity-60">
                            <div className="h-0.5 w-4 rounded-full bg-primary/80 animate-pulse"></div>
                            <div className="h-0.5 w-6 rounded-full bg-primary/50 animate-pulse delay-75"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading Text Below */}
            <span className="animate-pulse text-xs font-bold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
                Verificando Credenciales...
            </span>

            <style jsx>{`
        @keyframes slide {
          from { background-position: 0 0; }
          to { background-position: -40px 0; }
        }
        @keyframes bounce-slight {
          0%, 100% { transform: translate(50%, 0); }
          50% { transform: translate(50%, -1px); }
        }
        .animate-bounce-slight {
          animation: bounce-slight 0.5s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
}
