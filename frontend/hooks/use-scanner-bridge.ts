import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { getStoredToken } from "@/lib/api";

type ScannerStatus = "disconnected" | "connecting" | "connected" | "linked";

export function useScannerBridge(
    sessionId: string | null,
    onScan: (data: string) => void
) {
    const [status, setStatus] = useState<ScannerStatus>("disconnected");
    const wsRef = useRef<WebSocket | null>(null);
    const onScanRef = useRef(onScan);

    // Actualizar la ref sin disparar el efecto
    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    useEffect(() => {
        if (!sessionId) return;

        let reconnectTimer: number | null = null;
        let isCleaningUp = false;

        const connect = () => {
            if (isCleaningUp) return;

            // Conectar WebSocket
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            let wsUrl = backendUrl.replace(/^http/, "ws");
            if (!wsUrl.startsWith("ws")) {
                const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
                wsUrl = `${protocol}//${backendUrl}`;
            }
            wsUrl = wsUrl.replace(/\/$/, "");
            const url = `${wsUrl}/api/v1/scanner/ws/${sessionId}`;

            setStatus("connecting");
            const ws = new WebSocket(url);

            ws.onopen = () => {
                setStatus("connected");
                if (reconnectTimer) {
                    window.clearTimeout(reconnectTimer);
                    reconnectTimer = null;
                }
            };

            ws.onmessage = (event) => {
                const data = event.data;
                if (!data) return;

                if (data === "__LINKED__") {
                    setStatus("linked");
                    toast.success("¡Dispositivo vinculado!");
                    return;
                }

                onScanRef.current(data);
            };

            ws.onclose = () => {
                setStatus("disconnected");
                // Reconectar después de 3 segundos si no estamos desmontando
                if (!isCleaningUp) {
                    reconnectTimer = window.setTimeout(connect, 3000);
                }
            };

            ws.onerror = (err) => {
                console.error("WS Error", err);
                ws.close();
            };

            wsRef.current = ws;
        };

        connect();

        return () => {
            isCleaningUp = true;
            if (reconnectTimer) window.clearTimeout(reconnectTimer);
            if (wsRef.current) wsRef.current.close();
        };
    }, [sessionId]); // onScan eliminado de aquí

    return { status };
}
