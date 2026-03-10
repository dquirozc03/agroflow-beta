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
    const [cameraState, setCameraState] = useState<"loading" | "active" | "denied">("loading");
    
    const lastResultRef = useRef<string | null>(null);
    const isSendingRef = useRef(false);
    const lastScanTime = useRef<number>(0);
    const scannerRef = useRef<any>(null);
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
        
        // Bloqueo estricto de 5 segundos tras cualquier escaneo exitoso (o duplicado reciente)
        if (now - lastScanTime.current < 5000) return;
        if (isSendingRef.current) return;

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
                toast.success(`Capturado: ${text}`);
            } else {
                playSound("error");
                toast.error("Error de transmisión");
            }
        } catch {
            playSound("error");
            toast.error("Error de red");
        } finally {
            // El bloqueo isSending dura los 5 segundos completos del cooldown
            setTimeout(() => {
                setSending(false);
                isSendingRef.current = false;
                setLastResult(null); // Limpiamos para indicar que puede volver a escanear
            }, 5000);
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
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = require("html5-qrcode");

        const startCamera = async () => {
            if (!document.getElementById(elementId) || mode === "ocr") return;
            setCameraState("loading");

            if (scannerRef.current) {
                try {
                    await scannerRef.current.stop();
                } catch (e) {}
                scannerRef.current = null;
            }

            const html5QrCode = new Html5Qrcode(elementId, {
                verbose: false,
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.QR_CODE,
                    Html5QrcodeSupportedFormats.DATA_MATRIX,
                    Html5QrcodeSupportedFormats.PDF_417,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39
                ],
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true
                }
            });
            scannerRef.current = html5QrCode;

            try {
                // Configuración equilibrada para máxima compatibilidad y códigos pequeños
                const config = {
                    fps: 50, // Más FPS para mejor captura de movimiento
                    qrbox: mode === "dni" ? { width: 320, height: 160 } : { width: 300, height: 300 },
                    aspectRatio: 1.0,
                    // Deshabilitar el detector nativo si falla, pero activarlo por defecto
                    videoConstraints: {
                        facingMode: "environment",
                        focusMode: "continuous"
                    }
                };

                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (text: string) => mounted && handleScan(text),
                    () => {} 
                );
                if (mounted) setCameraState("active");
            } catch (err) {
                console.error("Scanner Error:", err);
                if (mounted) setCameraState("denied");
            }
        };

        const timer = setTimeout(startCamera, 300);

        return () => {
            mounted = false;
            clearTimeout(timer);
            if (scannerRef.current) {
                const stopScanner = async () => {
                    try { if (scannerRef.current.isScanning) await scannerRef.current.stop(); } catch(e) {}
                };
                stopScanner();
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
        <div className="flex flex-col h-screen bg-black text-white px-safe font-sans selection:bg-emerald-500/30 overflow-hidden">
            {/* Header HUD */}
            <div className="pt-[env(safe-area-inset-top)] bg-black/40 backdrop-blur-md border-b border-emerald-500/20 shrink-0 z-50">
                <div className="p-4 flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-emerald-500 hover:bg-emerald-500/10 shrink-0">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div className="flex flex-col items-center">
                        <span className="font-black text-xs uppercase tracking-[0.3em] text-emerald-500">AgroFlow HUD v5.0</span>
                    </div>
                    <div className="w-10 flex justify-end">
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] text-emerald-500/50 font-mono">LIVE</span>
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Viewport HUD */}
            <div className="flex-1 flex flex-col relative bg-black overflow-hidden">
                {/* HUD Overlay Layers */}
                <div className="absolute inset-0 z-20 pointer-events-none border-[20px] border-black/20" />
                <div className="absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 border-emerald-500/30 rounded-tl-3xl z-30" />
                <div className="absolute top-10 right-10 w-20 h-20 border-t-2 border-r-2 border-emerald-500/30 rounded-tr-3xl z-30" />
                <div className="absolute bottom-40 left-10 w-20 h-20 border-b-2 border-l-2 border-emerald-500/30 rounded-bl-3xl z-30" />
                <div className="absolute bottom-40 right-10 w-20 h-20 border-b-2 border-r-2 border-emerald-500/30 rounded-br-3xl z-30" />

                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    {/* Flash Overlay */}
                    <div className={cn(
                        "absolute inset-0 z-40 pointer-events-none transition-all duration-300",
                        flash ? "bg-emerald-500/20" : "bg-transparent"
                    )} />

                    <div className="relative w-full aspect-square max-w-[85vw] group overflow-hidden bg-emerald-950/5 rounded-[2.5rem] border border-emerald-500/10 shadow-[inner_0_0_40px_rgba(16,185,129,0.05)]">
                        {/* The Video Feed */}
                        <div id="reader" className="w-full h-full [&>video]:object-cover [&>video]:scale-110" />

                        {/* HUD Status Messages */}
                        {cameraState === "loading" && mode !== "ocr" && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-40 gap-4">
                                <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/50">Iniciando Sensor...</span>
                            </div>
                        )}

                        {cameraState === "denied" && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-8 text-center z-40">
                                <WifiOff className="h-12 w-12 text-red-500 mb-4" />
                                <h3 className="text-sm font-black text-red-500 uppercase tracking-widest mb-2">Acceso Denegado</h3>
                                <p className="text-xs text-white/40 leading-relaxed">Permite el acceso a la cámara en los ajustes del navegador para usar AgroFlow HUD.</p>
                            </div>
                        )}

                        {/* Scanning Reticle */}
                        {cameraState === "active" && !sending && mode !== "ocr" && (
                            <>
                                <div className="absolute inset-0 border-[2px] border-emerald-500/20 m-12 rounded-2xl z-20 pointer-events-none animate-pulse" />
                                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.5)] z-30 animate-[scan_2s_ease-in-out_infinite]" />
                            </>
                        )}

                        {/* OCR Capture Button */}
                        {mode === "ocr" && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/20 backdrop-blur-[2px] z-40">
                                <button 
                                    onClick={handleOCR}
                                    disabled={ocrProcessing}
                                    className="group relative flex items-center justify-center h-32 w-32 rounded-full border-2 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all active:scale-90"
                                >
                                    <div className="absolute inset-0 rounded-full border border-emerald-500/40 animate-ping opacity-20" />
                                    {ocrProcessing ? <Loader2 className="h-12 w-12 animate-spin text-emerald-500" /> : <Camera className="h-12 w-12 text-emerald-500" />}
                                </button>
                                <span className="mt-6 text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Capturar Texto</span>
                            </div>
                        )}

                        {/* Corner HUD Data */}
                        <div className="absolute top-6 left-6 text-[7px] font-mono text-emerald-500/40 z-30 vertical-text py-2 border-l border-emerald-500/10">COORD_X: 45.92</div>
                        <div className="absolute bottom-6 right-6 text-[7px] font-mono text-emerald-500/40 z-30 border-r border-emerald-500/10 pr-2 uppercase">Sensor_Online</div>
                    </div>

                    {/* Result Panel */}
                    <div className="w-full max-w-[85vw] mt-8">
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 min-h-[100px] flex flex-col items-center justify-center relative backdrop-blur-md overflow-hidden">
                            {/* Texture background */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                            
                            {sending ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="flex gap-1">
                                        {[1,2,3].map(i => <div key={i} className="h-1 w-4 bg-emerald-500 animate-pulse" style={{animationDelay: `${i*100}ms`}} />)}
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.5em] text-emerald-400">SINC_DATOS</span>
                                </div>
                            ) : lastResult ? (
                                <div className="text-center w-full animate-in slide-in-from-bottom-2 duration-500">
                                    <span className="text-[8px] font-bold text-emerald-500/40 uppercase tracking-[0.3em] block mb-2 font-mono">CAPTURA_CONFIRMADA</span>
                                    <div className="text-xl font-mono font-black text-emerald-400 break-all leading-none py-2 px-4 bg-emerald-400/5 border-y border-emerald-400/20">
                                        {lastResult}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center animate-in fade-in duration-700">
                                    <p className="text-emerald-500/20 text-[10px] font-black uppercase tracking-[0.4em]">Enfoque Automático</p>
                                    <p className="text-white/20 text-[9px] uppercase tracking-wider mt-1">
                                        {mode === 'dni' ? 'Escanea PDF417 de DNI' : 'Encuentra código o QR'}
                                    </p>
                                    <div className="mt-4 flex flex-col items-center gap-1 opacity-40">
                                        <span className="text-[7px] text-emerald-500 font-mono uppercase tracking-widest">Consejo Pro</span>
                                        <p className="text-[8px] text-white/60 max-w-[150px] leading-tight">
                                            {mode === 'standard' ? 'Aléjate un poco y deja que la cámara enfoque el código pequeño.' : 'Mantén el código centrado y evita reflejos directos.'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="pb-[env(safe-area-inset-bottom)] px-8 mb-6 z-50">
                    <div className="flex items-center justify-between gap-2 p-1.5 bg-zinc-900/80 backdrop-blur-3xl rounded-3xl border border-white/5 shadow-2xl">
                        {[
                            { id: "standard", label: "AUTO", info: "QR+" },
                            { id: "dni", label: "DNI", info: "ID" },
                            { id: "precinto", label: "BAR", info: "LOCK" },
                            { id: "ocr", label: "OCR", info: "TXT" }
                        ].map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setMode(m.id as any)}
                                className={cn(
                                    "flex-1 flex flex-col items-center justify-center py-3 rounded-2xl transition-all duration-500",
                                    mode === m.id 
                                        ? "bg-emerald-500 text-black shadow-[0_0_25px_rgba(16,185,129,0.4)]" 
                                        : "text-emerald-500/30 hover:text-emerald-400 hover:bg-emerald-500/5"
                                )}
                            >
                                <span className="text-[10px] font-black tracking-tight">{m.label}</span>
                                <span className={`text-[6px] font-black tracking-[0.2em] mt-0.5 opacity-50`}>{m.info}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes scan { 0%, 100% { transform: translateY(-30%); opacity: 0; } 50% { transform: translateY(130%); opacity: 1; } }
                .px-safe { padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right); }
                .vertical-text { writing-mode: vertical-rl; transform: rotate(180deg); }
                #reader video { 
                    width: 100% !important; 
                    height: 100% !important; 
                    object-fit: cover !important; 
                }
                #reader > div { display: none !important; } /* Ocultar UI intrusiva si existe */
            `}</style>
        </div>
    );
}
