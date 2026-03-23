// frontend/lib/api.ts
// Cliente API AgroFlow V2 - Limpio y Compatible
// Mantiene solo la lógica de autenticación y peticiones base.

const TOKEN_KEY = "nexo-token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}

let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(cb: () => void) {
  onUnauthorized = cb;
}

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** True si el error indica backend dormido/inaccesible. */
export function isBackendUnreachable(e: unknown): boolean {
  if (e instanceof ApiError) {
    if (e.status === 502 || e.status === 503) return true;
  }
  if (e instanceof TypeError && (e.message?.includes("fetch") || e.message?.includes("Failed to fetch")))
    return true;
  const msg = String((e as Error)?.message ?? "").toLowerCase();
  return msg.includes("fetch") || msg.includes("failed") || msg.includes("network");
}

async function parseBody(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try { return await res.json(); } catch { return null; }
  }
  try { return await res.text(); } catch { return null; }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = cleanPath.startsWith("/api/v1") ? cleanPath : `/api/v1${cleanPath}`;
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });

  if (res.status === 401) {
    onUnauthorized?.();
  }

  if (!res.ok) {
    const body = await parseBody(res);
    let msg = `Error ${res.status}: ${res.statusText}`;
    if (body?.detail) {
      msg = Array.isArray(body.detail) ? body.detail[0]?.msg : body.detail;
    }
    throw new ApiError(msg, res.status, body);
  }

  return parseBody(res);
}

// === ENDPOINTS DE AUTENTICACION ===

export interface LoginResponse {
  access_token: string;
  token_type: string;
  usuario: string; // ID o username según backend
  nombre: string;
  rol: string;
  requiere_cambio_password: boolean;
}

/** Inicia sesión en el backend */
export async function apiLogin(usuario: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, password }),
  });
}

/** Verifica si el backend está vivo */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch("/health");
    return res.ok;
  } catch {
    return false;
  }
}

/** Obtiene datos del usuario actual mediante el token */
export async function apiMe(): Promise<any> {
  return request<any>("/auth/me");
}
