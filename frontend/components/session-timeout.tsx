"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// 15 minutos en milisegundos
const TIMEOUT_MS = 15 * 60 * 1000;

export function SessionTimeout() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const handleLogout = useCallback(() => {
        if (!user) return;
        toast.warning("Sesión cerrada por inactividad.");
        logout();
        router.replace("/login");
    }, [user, logout, router]);

    const resetTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        if (user) {
            timerRef.current = setTimeout(handleLogout, TIMEOUT_MS);
        }
    }, [user, handleLogout]);

    useEffect(() => {
        if (!user) return;

        // Eventos a monitorear
        const events = ["mousemove", "mousedown", "click", "scroll", "keypress"];

        // Iniciar timer
        resetTimer();

        // Agregar listeners
        const handleActivity = () => resetTimer();

        events.forEach((event) => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [user, resetTimer]);

    return null; // Componente lógico, no renderiza nada visual
}
