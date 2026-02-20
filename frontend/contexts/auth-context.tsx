"use client";

import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from "react";
import type { UserRole } from "@/lib/constants";
import {
  apiLogin,
  apiMe,
  getStoredToken,
  setStoredToken,
  setOnUnauthorized,
  isBackendUnreachable,
} from "@/lib/api";
import { useBackendStatus } from "@/contexts/backend-status-context";

const STORAGE_KEY = "nexo-auth";

type AuthUser = {
  usuario: string;
  nombre: string;
  rol: UserRole;
  requiere_cambio_password: boolean;
};

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
};

type AuthContextValue = AuthState & {
  login: (usuario: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (parsed?.usuario && parsed?.rol) return parsed;
  } catch {
    // ignore
  }
  return null;
}

function saveStoredUser(user: AuthUser | null) {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { wakeBackend } = useBackendStatus();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setStoredToken(null);
    saveStoredUser(null);
  }, []);

  useEffect(() => {
    setOnUnauthorized(logout);
  }, [logout]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      saveStoredUser(null);
      setIsLoading(false);
      return;
    }

    const tryAuth = (): Promise<void> =>
      apiMe()
        .then((me) => {
          const u: AuthUser = {
            usuario: me.usuario,
            nombre: me.nombre,
            rol: me.rol as UserRole,
            requiere_cambio_password: me.requiere_cambio_password,
          };
          setUser(u);
          saveStoredUser(u);
        })
        .catch((e) => {
          if (isBackendUnreachable(e)) {
            return wakeBackend().then((ok) => {
              if (ok) return tryAuth();
              setStoredToken(null);
              setUser(null);
              saveStoredUser(null);
            });
          }
          setStoredToken(null);
          setUser(null);
          saveStoredUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });

    tryAuth();
  }, [wakeBackend]);

  const login = useCallback(
    async (usuario: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await apiLogin(usuario.trim(), password);
        setStoredToken(res.access_token);
        const u: AuthUser = {
          usuario: res.usuario,
          nombre: res.nombre,
          rol: res.rol as UserRole,
          requiere_cambio_password: res.requiere_cambio_password,
        };
        setUser(u);
        saveStoredUser(u);
        return { ok: true };
      } catch (e: unknown) {
        if (isBackendUnreachable(e)) {
          const woken = await wakeBackend();
          if (woken) {
            try {
              const res = await apiLogin(usuario.trim(), password);
              setStoredToken(res.access_token);
              const u: AuthUser = {
                usuario: res.usuario,
                nombre: res.nombre,
                rol: res.rol as UserRole,
                requiere_cambio_password: res.requiere_cambio_password,
              };
              setUser(u);
              saveStoredUser(u);
              return { ok: true };
            } catch (retryErr: unknown) {
              const retryMsg = String((retryErr as any)?.body?.detail ?? (retryErr as Error)?.message ?? "");
              const retryStatus = (retryErr as any)?.status;
              if (retryStatus === 423) {
                return { ok: false, error: retryMsg || "Cuenta bloqueada. Contacte al administrador." };
              }
              return { ok: false, error: retryMsg.includes("Intentos restantes") ? retryMsg : "Credenciales incorrectas. Revisa usuario y contraseña." };
            }
          }
          return {
            ok: false,
            error: "El servidor no responde. Intenta de nuevo en unos minutos.",
          };
        }
        const msg = String((e as any)?.body?.detail ?? (e as Error)?.message ?? "");
        const status = (e as any)?.status;
        if (status === 423) {
          return { ok: false, error: msg || "Cuenta bloqueada. Contacte al administrador." };
        }
        const text =
          (msg.includes("Intentos restantes") ? msg : null) ??
          (msg.toLowerCase().includes("usuario o contraseña") || msg.toLowerCase().includes("incorrectos")
            ? "Credenciales incorrectas. Revisa tu usuario y contraseña e intenta de nuevo."
            : msg || "Credenciales incorrectas. Revisa tu usuario y contraseña e intenta de nuevo.");
        return { ok: false, error: text };
      }
    },
    [wakeBackend]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
