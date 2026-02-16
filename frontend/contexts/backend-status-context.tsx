"use client";

import React, { createContext, useContext, useCallback, useState } from "react";
import { checkApiHealth } from "@/lib/api";

type BackendStatus = "idle" | "waking" | "online" | "offline";

type BackendStatusContextValue = {
  status: BackendStatus;
  isWaking: boolean;
  isOnline: boolean;
  wakeBackend: () => Promise<boolean>;
  retryCount: number;
};

const BackendStatusContext = createContext<BackendStatusContextValue | null>(null);

const MAX_RETRIES = 12; // ~60s con backoff
const INITIAL_DELAY_MS = 3000;
const MAX_DELAY_MS = 8000;

export function BackendStatusProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<BackendStatus>("idle");
  const [retryCount, setRetryCount] = useState(0);

  const wakeBackend = useCallback(async (): Promise<boolean> => {
    setStatus("waking");
    setRetryCount(0);

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      setRetryCount(attempt + 1);
      const ok = await checkApiHealth();
      if (ok) {
        setStatus("online");
        return true;
      }

      const delay = Math.min(
        INITIAL_DELAY_MS + attempt * 1500,
        MAX_DELAY_MS
      );
      await new Promise((r) => setTimeout(r, delay));
    }

    setStatus("offline");
    return false;
  }, []);

  const value: BackendStatusContextValue = {
    status,
    isWaking: status === "waking",
    isOnline: status === "online",
    wakeBackend,
    retryCount,
  };

  return (
    <BackendStatusContext.Provider value={value}>
      {children}
    </BackendStatusContext.Provider>
  );
}

export function useBackendStatus(): BackendStatusContextValue {
  const ctx = useContext(BackendStatusContext);
  if (!ctx) throw new Error("useBackendStatus must be used within BackendStatusProvider");
  return ctx;
}
