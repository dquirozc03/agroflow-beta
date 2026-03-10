"use client";

import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { toast } from "sonner";
import { Loader2, Wifi, WifiOff, Camera, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Props {
    params: {
        id: string; // session_id
    };
}

export default function ScannerMobilePage({ params }: Props) {
    const [lastResult, setLastResult] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [flash, setFlash] = useState(false);
    const [mode, setMode] = useState<"standard" | "dni" | "precinto" | "ocr">("standard");
    const [ocrProcessing, setOcrProcessing] = useState(false);
    
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

    const handleScan = async (text: string) => {
        const now = Date.now();
        if (text === lastResultRef.current && now - lastScanTime.current < 5000) return;
        if (isSendingRef.current && text === lastResultRef.current) return;

        navigator.vibrate?.(200);
        setFlash(true);
        setTimeout(() => setFlash(false), 500);
        playSound("success");

        lastResultRef.current = text;
        setLastResult(text);
        isSendingRef.current = true;
        setSending(true);
        lastScanTime.current = now;

        try {
            const res = await fetch(`/api/v1/scanner/push/${params.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: text }),
            });

            if (res.ok) {
                toast.success(`Enviado: ${text}`);
            } else {
                playSound("error");
                toast.error("Error enviando al PC");
            }
        } catch {
            playSound("error");
            toast.error("Error de conexión");
        } finally {
            setTimeout(() => {
                setSending(false);
                isSendingRef.current = false;
            }, 1000);
        }
    };

    const handleOCR = async () => {
        if (ocrProcessing) return;
        setOcrProcessing(true);
        toast.info("Analizando imagen (OCR)...");
        
        try {
            await new Promise(r => setTimeout(r, 2000));
            const mockExtractedText = "PRE-" + Math.floor(100000 + Math.random() * 900000);
            handleScan(mockExtractedText);
            toast.success("Texto extraído!");
        } catch (e) {
            toast.error("Error OCR");
        } finally {
            setOcrProcessing(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        const elementId = "reader";

        if (scannerRef.current) {
            scannerRef.current.clear().catch(() => { });
            scannerRef.current = null;
        }

        const formatsMap = {
            standard: [Html5QrcodeSupportedFormats.QR_CODE, Html5QrcodeSupportedFormats.CODE_128],
            dni: [Html5QrcodeSupportedFormats.PDF_417, Html5QrcodeSupportedFormats.CODE_39],
            precinto: [Html5QrcodeSupportedFormats.QR_CODE, Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.CODE_39, Html5QrcodeSupportedFormats.EAN_13],
            ocr: []
        };

        const initScanner = () => {
            if (!document.getElementById(elementId) || mode === "ocr") return;

            try {
                const scanner = new Html5QrcodeScanner(
                    elementId,
                    {
                        fps: 20,
                        qrbox: mode === "dni" ? { width: 320, height: 160 } : { width: 260, height: 260 },
                        formatsToSupport: formatsMap[mode] as any,
                        useBarCodeDetectorIfSupported: true,
                        showTorchButtonIfSupported: true,
                        aspectRatio: 1.0,
                    },
                    false
                );

                scanner.render((text) => mounted && handleScan(text), () => {});
                if (mounted) scannerRef.current = scanner;
            } catch (err) {
                console.error(err);
                toast.error("Error cámara");
            }
        };

        const timer = setTimeout(initScanner, 200);

        return () => {
            mounted = false;
            clearTimeout(timer);
            if (scannerRef.current) {
                scannerRef.current.clear().catch(() => {});
                scannerRef.current = null;
            }
        };
    }, [mode]);

    useEffect(() => {
        fetch(`/api/v1/scanner/push/${params.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: "__LINKED__" }),
        }).catch(() => {});
    }, [params.id]);

    return (
        <div className="flex flex-col h-screen bg-black text-white px-safe font-sans selection:bg-emerald-500/30">
            {/* Header HUD Style */}
            <div className="pt-[env(safe-area-inset-top)] bg-black/40 backdrop-blur-md border-b border-emerald-500/20 shrink-0 z-50">
                <div className="p-4 flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-emerald-500 hover:bg-emerald-500/10 shrink-0">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div className="flex flex-col items-center min-w-0 px-2">
                        <span className="font-black text-sm uppercase tracking-[0.2em] text-emerald-500">AgroFlow HUD v4.5</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-bold text-emerald-400/70 uppercase tracking-widest">
                                SESSION_{params.id.slice(0, 6).toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <div className="w-10 flex justify-end">
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] text-emerald-500/50 font-mono">LIVE</span>
                            <Wifi className="h-3 w-3 text-emerald-500 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main HUD Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-black to-black">
                
                {/* HUD Decorations */}
                <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-emerald-500/40 rounded-tl-lg pointer-events-none" />
                <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-emerald-500/40 rounded-tr-lg pointer-events-none" />
                <div className="absolute bottom-32 left-8 w-12 h-12 border-b-2 border-l-2 border-emerald-500/40 rounded-bl-lg pointer-events-none" />
                <div className="absolute bottom-32 right-8 w-12 h-12 border-b-2 border-r-2 border-emerald-500/40 rounded-br-lg pointer-events-none" />

                <div className="flex-1 flex flex-col justify-center items-center p-6 z-10">
                    <div className={`absolute inset-0 z-40 pointer-events-none transition-all duration-500 ${flash ? 'bg-emerald-500/30 shadow-[inset_0_0_100px_rgba(16,185,129,0.4)]' : 'bg-transparent'}`} />

                    <div className="relative w-full max-w-sm group">
                        {!sending && mode !== "ocr" && (
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] z-30 animate-[scan_3s_ease-in-out_infinite] opacity-50" />
                        )}

                        <div id="reader" className={cn(
                            "w-full aspect-square overflow-hidden rounded-2xl border-2 border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.05)] bg-black transition-all duration-500 flex items-center justify-center",
                            sending && "scale-[0.98] border-emerald-500 opacity-50",
                            mode === "ocr" && "border-dashed"
                        )}>
                            {mode === "ocr" && (
                                <button 
                                    onClick={handleOCR}
                                    disabled={ocrProcessing}
                                    className="flex flex-col items-center gap-4 text-emerald-500 hover:scale-110 transition-transform active:scale-95 disabled:opacity-50"
                                >
                                    {ocrProcessing ? <Loader2 className="h-16 w-16 animate-spin" /> : <Camera className="h-16 w-16" />}
                                    <span className="text-xs font-black uppercase tracking-widest bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">Capturar Texto</span>
                                </button>
                            )}
                        </div>
                        
                        <div className="absolute -top-3 left-4 bg-black px-2 text-[8px] font-bold text-emerald-500 uppercase tracking-widest border border-emerald-500/20">SYS_AUTH_OK</div>
                        <div className="absolute -bottom-3 right-4 bg-black px-2 text-[8px] font-bold text-emerald-500 uppercase tracking-widest border border-emerald-500/20">{mode.toUpperCase()}_LINK</div>
                    </div>

                    <div className="w-full max-w-sm mt-10">
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 min-h-[80px] flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-sm">
                            {sending ? (
                                <div className="flex flex-col items-center gap-2 text-emerald-400">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Transmitiendo...</span>
                                </div>
                            ) : lastResult ? (
                                <div className="text-center animate-in zoom-in duration-300">
                                    <span className="text-[9px] font-bold text-emerald-500/50 uppercase tracking-widest block mb-1">DATA_OUT</span>
                                    <span className="text-lg font-mono font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded border border-emerald-400/20 break-all leading-tight">
                                        {lastResult}
                                    </span>
                                </div>
                            ) : (
                                <div className="text-center space-y-1">
                                    <p className="text-emerald-400/40 text-[10px] font-bold uppercase tracking-widest">Ready to scan</p>
                                    <p className="text-slate-500 text-[9px] uppercase tracking-tight">Focaliza {mode === 'dni' ? 'el código DNI' : mode === 'precinto' ? 'el código de PRECINTO' : 'el elemento'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pb-[env(safe-area-inset-bottom)] px-6 mb-4 z-50">
                    <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-1.5 rounded-2xl flex items-center justify-between gap-1 shadow-2xl">
                        {[
                            { id: "standard", label: "AUTO", desc: "QR/128" },
                            { id: "dni", label: "DNI", desc: "PDF417" },
                            { id: "precinto", label: "BAR", desc: "MULTI" },
                            { id: "ocr", label: "OCR", desc: "TEXT" }
                        ].map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setMode(m.id as any)}
                                className={cn(
                                    "flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl transition-all duration-500 border border-transparent",
                                    mode === m.id 
                                        ? "bg-emerald-500 text-black border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                                        : "text-emerald-500/40 hover:text-emerald-400 hover:bg-emerald-500/5"
                                )}
                            >
                                <span className="text-[10px] font-black tracking-tighter">{m.label}</span>
                                <span className={`text-[7px] font-bold tracking-widest mt-0.5 ${mode === m.id ? 'opacity-80' : 'opacity-30'}`}>{m.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes scan { 0%, 100% { top: 0; } 50% { top: 100%; } }
                .px-safe { padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right); }
            `}</style>
        </div>
    );
}
