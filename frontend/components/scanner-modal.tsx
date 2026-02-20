"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Smartphone, Check, Copy } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useScannerBridge } from "@/hooks/use-scanner-bridge";
import { toast } from "sonner";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onScan: (data: string) => void;
}

export function ScannerModal({ open, onOpenChange, onScan }: Props) {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [scanUrl, setScanUrl] = useState("");
    const [customHost, setCustomHost] = useState("");
    const [editing, setEditing] = useState(false);

    // Generar ID único al abrir
    useEffect(() => {
        if (open && !sessionId) {
            const id = uuidv4();
            setSessionId(id);
            // Detectar host actual
            const host = window.location.host; // localhost:3000
            const protocol = window.location.protocol;
            setCustomHost(host);
            setScanUrl(`${protocol}//${host}/scanner/${id}`);
        }
    }, [open, sessionId]);

    // Actualizar URL cuando cambia el host custom
    useEffect(() => {
        if (sessionId && customHost) {
            const protocol = window.location.protocol;
            setScanUrl(`${protocol}//${customHost}/scanner/${sessionId}`);
        }
    }, [customHost, sessionId]);

    const { status } = useScannerBridge(sessionId, (data) => {
        toast.info(`Recibido: ${data}`);
        onScan(data);
    });

    const handleCopy = () => {
        navigator.clipboard.writeText(scanUrl);
        toast.success("URL copiada");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-primary" />
                        Vincular Celular
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center space-y-4 py-2">
                    {sessionId ? (
                        <div className="relative flex items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                            <QRCodeSVG
                                value={scanUrl}
                                size={200}
                                level="H"
                                includeMargin
                                className="rounded-lg"
                            />
                            {status === "connected" && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-[2px] dark:bg-black/90">
                                    <div className="flex flex-col items-center gap-2 text-emerald-600 dark:text-emerald-400 animate-in zoom-in duration-300">
                                        <Check className="h-12 w-12" />
                                        <span className="font-bold text-lg">¡Conectado!</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                    )}

                    <div className="text-center space-y-1 w-full px-8">
                        {editing ? (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                <input
                                    className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={customHost}
                                    onChange={(e) => setCustomHost(e.target.value)}
                                    placeholder="Ej: 192.168.1.5:3000"
                                />
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(false)}>
                                    <Check className="h-3 w-3" />
                                </Button>
                            </div>
                        ) : (
                            <div
                                onClick={() => setEditing(true)}
                                className="text-xs text-muted-foreground cursor-pointer hover:text-primary hover:underline flex items-center justify-center gap-1"
                                title="Clic para editar IP"
                            >
                                <span>Host: {customHost}</span>
                            </div>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Asegúrate que el celular y PC estén en la misma red.
                        </p>
                    </div>

                    <div className="flex w-full items-center gap-2 mt-2">
                        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleCopy}>
                            <Copy className="mr-2 h-3 w-3" />
                            Copiar
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => onOpenChange(false)}
                        >
                            Cerrar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
