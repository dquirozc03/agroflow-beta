import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { getStoredToken } from "@/lib/api";

type ScannerStatus = "disconnected" | "connecting" | "connected";

export function useScannerBridge(
    sessionId: string | null,
    onScan: (data: string) => void
) {
    const [status, setStatus] = useState<ScannerStatus>("disconnected");
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!sessionId) return;

        // Conectar WebSocket
        // Detectar URL del backend
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        // Construir URL del WebSocket
        let wsUrl = backendUrl.replace(/^http/, "ws"); // http -> ws, https -> wss
        if (!wsUrl.startsWith("ws")) {
            // Si por alguna razón no tiene protocolo, asumir ws:// o wss:// según ubicación window
            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            wsUrl = `${protocol}//${backendUrl}`;
        }

        // Asegurarse de que no termine en slash
        wsUrl = wsUrl.replace(/\/$/, "");

        const url = `${wsUrl}/api/v1/scanner/ws/${sessionId}`;

        setStatus("connecting");
        const ws = new WebSocket(url);

        ws.onopen = () => {
            setStatus("connected");
            // toast.success("Puente de escáner conectado");
        };

        ws.onmessage = (event) => {
            const data = event.data;
            if (data) {
                onScan(data);
            }
        };

        ws.onclose = () => {
            setStatus("disconnected");
        };

        ws.onerror = (err) => {
            console.error("WS Error", err);
            setStatus("disconnected");
        };

        wsRef.current = ws;

        return () => {
            ws.close();
        };
    }, [sessionId, onScan]);

    return { status };
}
