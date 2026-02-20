"use client";

import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { toast } from "sonner";
import { Loader2, Wifi, WifiOff, Camera, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Props {
    params: {
        id: string; // session_id
    };
}

export default function ScannerMobilePage({ params }: Props) {
    const [lastResult, setLastResult] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [flash, setFlash] = useState(false);
    const lastResultRef = useRef<string | null>(null);
    const isSendingRef = useRef(false);
    const lastScanTime = useRef<number>(0);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const router = useRouter();

    // Audio context for beeps
    const playSound = (type: "success" | "error") => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === "success") {
                osc.type = "sine";
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            } else {
                osc.type = "square";
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            }

            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {
            console.warn("Audio feedback error:", e);
        }
    };

    useEffect(() => {
        // Flag to prevent double init in strict mode
        let mounted = true;
        const elementId = "reader";

        // Cleanup previo por seguridad
        if (scannerRef.current) {
            scannerRef.current.clear().catch(() => { });
            scannerRef.current = null;
        }

        const initScanner = () => {
            if (!document.getElementById(elementId)) return;

            try {
                const scanner = new Html5QrcodeScanner(
                    elementId,
                    {
                        fps: 15,
                        qrbox: { width: 300, height: 200 },
                        formatsToSupport: [
                            Html5QrcodeSupportedFormats.QR_CODE,
                            Html5QrcodeSupportedFormats.CODE_128,
                            Html5QrcodeSupportedFormats.CODE_39,
                            Html5QrcodeSupportedFormats.EAN_13,
                            Html5QrcodeSupportedFormats.UPC_A,
                            Html5QrcodeSupportedFormats.PDF_417
                        ],
                        useBarCodeDetectorIfSupported: true,
                        showTorchButtonIfSupported: true,
                        aspectRatio: 1.0,
                    },
                    false
                );

                scanner.render(
                    (decodedText) => {
                        if (mounted) handleScan(decodedText);
                    },
                    (error) => {
                        // ignore
                    }
                );

                if (mounted) scannerRef.current = scanner;
            } catch (err) {
                console.error("Error init scanner:", err);
                toast.error("Error iniciando cámara");
            }
        };

        // Small timeout to ensure DOM is ready
        const timer = setTimeout(initScanner, 100);

        return () => {
            mounted = false;
            clearTimeout(timer);
            if (scannerRef.current) {
                scannerRef.current.clear().catch((e) => console.warn("Scanner clear error", e));
                scannerRef.current = null;
            }
        };
    }, []);

    // Enviar señal de vínculo al PC al entrar
    useEffect(() => {
        const sendLinkSignal = async () => {
            try {
                await fetch(`/api/v1/scanner/push/${params.id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ data: "__LINKED__" }),
                });
            } catch (e) {
                console.error("Failed to send link signal", e);
            }
        };
        sendLinkSignal();
    }, [params.id]);

    const handleScan = async (text: string) => {
        const now = Date.now();

        // 🛡️ CONTROL REFORZADO DE DUPLICADOS (Sincrónico con Refs)
        if (text === lastResultRef.current && now - lastScanTime.current < 5000) return;
        if (isSendingRef.current && text === lastResultRef.current) return;

        // Feedback visual/sonoro
        navigator.vibrate?.(200);
        setFlash(true);
        setTimeout(() => setFlash(false), 500);
        playSound("success");

        lastResultRef.current = text;
        setLastResult(text);

        isSendingRef.current = true;
        setSending(true);

        lastScanTime.current = now;

        const toastId = `mob-scan-${text}`;

        try {
            const res = await fetch(`/api/v1/scanner/push/${params.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: text }),
            });

            if (res.ok) {
                toast.success(`Enviado: ${text}`, { id: toastId });
            } else {
                playSound("error");
                toast.error("Error enviando al PC", { id: `err-${text}` });
            }
        } catch {
            playSound("error");
            toast.error("Error de conexión", { id: "conn-err" });
        } finally {
            // Permitir volver a enviar después de un pequeño respiro (para UI)
            setTimeout(() => {
                setSending(false);
                isSendingRef.current = false;
            }, 1000);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white px-safe">
            <div className="pt-[env(safe-area-inset-top)] bg-slate-900 border-b border-white/10 shrink-0">
                <div className="p-4 flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white shrink-0">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div className="flex flex-col items-center min-w-0 px-2">
                        <span className="font-bold text-base truncate">AgroFlow Scanner</span>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <Wifi className="h-3 w-3" /> Conectado a PC
                        </span>
                    </div>
                    <div className="w-10" /> {/* Spacer */}
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center p-4 relative overflow-hidden">
                {/* Flash overlay */}
                <div className={`absolute inset-0 z-50 pointer-events-none transition-colors duration-300 ${flash ? 'bg-emerald-500/40' : 'bg-transparent'}`} />

                {/* Lector */}
                <div id="reader" className="w-full max-w-md overflow-hidden rounded-xl border-2 border-emerald-500/50 shadow-2xl bg-black" />

                <div className="mt-8 text-center space-y-4">
                    <div className="h-16 flex items-center justify-center">
                        {sending ? (
                            <div className="flex flex-col items-center gap-2 text-emerald-400 animate-pulse">
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <span className="text-sm font-medium">Enviando...</span>
                            </div>
                        ) : lastResult ? (
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-xs text-slate-400">Último escaneo:</span>
                                <span className="text-xl font-mono font-bold text-white bg-white/10 px-4 py-2 rounded-lg break-all">
                                    {lastResult}
                                </span>
                            </div>
                        ) : (
                            <p className="text-slate-400 text-sm max-w-[200px]">
                                Apunta la cámara al código DNI, Precinto o Código de Barras.
                            </p>
                        )}
                    </div>
                </div>

                {/* Decoración */}
                <div className="absolute bottom-4 text-[10px] text-slate-600">
                    ID de Sesión: {params.id.slice(0, 8)}...
                </div>
            </div>
        </div>
    );
}
