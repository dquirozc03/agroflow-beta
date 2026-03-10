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
            // Conectar WebSocket
            const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
            let backendUrl = process.env.NEXT_PUBLIC_API_URL || (isLocal ? "localhost:8000" : "agroflow-api.onrender.com");
            
            // Limpiar protocolo si viene incluido
            backendUrl = backendUrl.replace(/^https?:\/\//, "");
            
            // Determinar protocolo seguro (wss) si estamos en producción/SSL
            const protocol = (window.location.protocol === "https:" || !isLocal) ? "wss:" : "ws:";
            const wsUrl = `${protocol}//${backendUrl.replace(/\/$/, "")}`;
            const url = `${wsUrl}/api/v1/scanner/ws/${sessionId}`;

            console.log("Scanner Bridge: Intentando conectar a ->", url);
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
                console.error("Scanner Bridge: Error en WebSocket", err);
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
