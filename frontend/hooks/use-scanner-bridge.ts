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
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        // Ajustar si backend está en otro puerto/host (en dev es localhost:8000)
        // Pero si usamos next rewrite /api -> backend, el WS quizás necesite URL directa.
        // Asumiremos que /api/v1/scanner/ws/... esta mapeado o usamos la URL del backend directa.
        // Para simplificar local: localhost:8000
        // EN PRODUCCION: Usar URL relativa o configurada.

        // HACK LOCAL: Asumir puerto 8000 si estamos en localhost:3000
        const backendHost = "localhost:8000";
        const url = `ws://${backendHost}/api/v1/scanner/ws/${sessionId}`;

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
