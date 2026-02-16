// frontend/lib/api.ts
// Cliente API profesional para LogiCapture
// - Usa /api/v1/* (same-origin) y pasa por el gateway de Next (app/api/v1/[...path]/route.ts)
// - Envía Authorization: Bearer <token> cuando hay sesión
// - En 401 dispara onUnauthorized (logout)

const TOKEN_KEY = "nexo-token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
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

/** True si el error indica backend dormido/inaccesible (Render Free, etc.). */
export function isBackendUnreachable(e: unknown): boolean {
  if (e instanceof ApiError) {
    if (e.status === 502 || e.status === 503) return true;
    if (e.status === 500) {
      const msg = String(e.body?.detail ?? e.message ?? "").toLowerCase();
      if (msg.includes("internal server error") || msg.includes("no se pudo conectar")) return true;
    }
  }
  if (e instanceof TypeError && (e.message?.includes("fetch") || e.message?.includes("Failed to fetch")))
    return true;
  const msg = String((e as Error)?.message ?? "");
  return msg.includes("fetch") || msg.includes("Failed") || msg.includes("network") || msg === "";
}

async function parseBody(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  try {
    return await res.text();
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = `/api/v1${p}`;
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
    const msg =
      (typeof body === "string" && body) ||
      body?.detail ||
      `API error ${res.status} ${res.statusText}`;
    throw new ApiError(msg, res.status, body);
  }

  const body = await parseBody(res);
  return body as T;
}

function json<T>(path: string, data?: any, method: string = "GET") {
  return request<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: data ? JSON.stringify(data) : undefined,
  });
}

// ======================
// AUTH (login real)
// ======================
export type LoginResponse = {
  access_token: string;
  token_type: string;
  usuario: string;
  nombre: string;
  rol: string;
};

export type MeResponse = { usuario: string; nombre: string; rol: string };

export async function apiLogin(usuario: string, password: string): Promise<LoginResponse> {
  const res = await json<LoginResponse>("/auth/login", { usuario, password }, "POST");
  return res;
}

export async function apiMe(): Promise<MeResponse> {
  return request<MeResponse>("/auth/me", { method: "GET" });
}

// ======================
// Chat (consultas en lenguaje natural)
// ======================
export async function chatPregunta(pregunta: string): Promise<{ respuesta: string }> {
  return json<{ respuesta: string }>("/chat/pregunta", { pregunta }, "POST");
}

// ======================
// HEALTH (para AppHeader)
// Backend real: GET /api/v1/health  (app/routers/health.py)
// ======================
export async function checkApiHealth(): Promise<boolean> {
  try {
    const r = await request<{ ok: boolean; db_ok?: boolean }>(`/health`, {
      method: "GET",
    });
    return Boolean(r?.ok);
  } catch {
    return false;
  }
}

// ======================
// REFERENCIAS POR BOOKING
// Backend real: GET /api/v1/ref/booking/{booking}
// ======================
export type BookingRefs = {
  booking: string;
  o_beta: string | null;
  awb: string | null;
  dam: string | null;
};

export async function getBookingRefs(booking: string): Promise<BookingRefs> {
  const b = encodeURIComponent((booking || "").trim());
  return request<BookingRefs>(`/ref/booking/${b}`, { method: "GET" });
}

// ======================
// REGISTROS OPERATIVOS
// Backend real:
// - POST   /api/v1/registros
// - POST   /api/v1/registros/{id}/cerrar   (histórico: alias de PROCESAR)
// - POST   /api/v1/registros/{id}/procesar (dominio)
// - GET    /api/v1/registros/{id}/sap
// - PATCH  /api/v1/registros/{id}/editar
// - POST   /api/v1/registros/{id}/anular
// - GET    /api/v1/registros/historial
// - GET    /api/v1/registros/procesados   (para Bandeja SAP > Procesados)
// ======================
export type RegistroCreatePayload = {
  o_beta?: string | null;
  booking?: string | null;
  awb?: string | null;

  dni: string;
  placas: string;

  ruc?: string | null;
  codigo_sap?: string | null;

  termografos?: string | null;
  ps_beta?: string | null;
  ps_aduana?: string | null;
  ps_operador?: string | null;

  senasa?: string | null;
  ps_linea?: string | null;
};

export async function createRegistro(
  payload: RegistroCreatePayload,
): Promise<{ id: number }> {
  return json<{ id: number }>(`/registros`, payload, "POST");
}

// Lo que tu backend devuelve hoy en cerrar/procesar:
// {"estado":"procesado","awbs_liberados":true} o {"estado":"ya estaba procesado"}
export type ProcesarResponse = {
  estado: string;
  awbs_liberados?: boolean;
};

export async function cerrarRegistro(registroId: number): Promise<ProcesarResponse> {
  return json<ProcesarResponse>(`/registros/${registroId}/cerrar`, undefined, "POST");
}

// Opcional PRO: usa el endpoint de dominio (alias)
export async function procesarRegistro(registroId: number): Promise<ProcesarResponse> {
  return json<ProcesarResponse>(`/registros/${registroId}/procesar`, undefined, "POST");
}

export type SapFila = Record<string, any>;
export async function getRegistroSap(registroId: number): Promise<SapFila> {
  return request<SapFila>(`/registros/${registroId}/sap`, { method: "GET" });
}

/**
 * Campos editables en /registros/{id}/editar
 */
export type EditCampoRegistro =
  | "booking"
  | "awb"
  | "dni_chofer"
  | "transportista"
  | "termografos"
  | "precintos";

/**
 * Mapa de rol de usuario (auth) al valor que espera el backend (X-User-Role).
 * administrador -> admin, supervisor_facturacion -> editor.
 */
export function getBackendRoleForEdit(role: string | undefined): string | null {
  if (!role) return null;
  if (role === "administrador") return "admin";
  if (role === "supervisor_facturacion") return "editor";
  return null;
}

export async function editarRegistro(
  registroId: number,
  campo: EditCampoRegistro,
  data: Record<string, unknown>,
  motivo?: string,
  userRole?: string,
) {
  const backendRole = userRole ? getBackendRoleForEdit(userRole) : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (backendRole) headers["X-User-Role"] = backendRole;

  return request(
    `/registros/${registroId}/editar`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ campo, data, motivo: motivo ?? null }),
    },
  );
}

/** True si el usuario puede editar registros según su rol de auth. */
export function puedeEditarRegistros(userRole: string | undefined): boolean {
  return userRole === "administrador" || userRole === "supervisor_facturacion";
}

export async function anularRegistro(registroId: number, motivo: string) {
  return json(`/registros/${registroId}/anular`, { motivo }, "POST");
}

export type RegistroListado = {
  id: number;
  fecha_registro: string;
  estado: string;
  booking?: string | null;
  o_beta?: string | null;
  awb?: string | null;
  dam?: string | null;
  dni?: string | null;
  chofer?: string | null;
  transportista?: string | null;
};

export type HistorialResponse = {
  items: RegistroListado[];
  total: number;
};

export async function listRegistros(params?: {
  desde?: string; // YYYY-MM-DD
  hasta?: string; // YYYY-MM-DD
  limit?: number;
  offset?: number;
}): Promise<HistorialResponse> {
  const qs = new URLSearchParams();
  if (params?.desde) qs.set("desde", params.desde);
  if (params?.hasta) qs.set("hasta", params.hasta);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return request<HistorialResponse>(`/registros/historial${suffix}`, {
    method: "GET",
  });
}

// ======================
// PROCESADOS (para Bandeja SAP > Procesados)
// Backend real: GET /api/v1/registros/procesados?fecha=YYYY-MM-DD&limit=...&offset=...
// ======================
export type ProcesadoSapItem = {
  registro_id: number;
  estado: string | null;
  processed_at: string | null;

  // Campos estilo SAP (tu UI usa getAny(...,"BOOKING", etc))
  FECHA: string;
  O_BETA: string;
  BOOKING: string;
  AWB: string;
  MARCA: string;
  PLACAS: string;
  DNI: string;
  CHOFER: string;
  LICENCIA: string;
  TERMOGRAFOS: string;
  CODIGO_SAP: string;
  TRANSPORTISTA: string;
  PS_BETA: string;
  PS_ADUANA: string;
  PS_OPERADOR: string;
  SENASA_PS_LINEA: string;
  N_DAM: string;
  P_REGISTRAL: string;
  CER_VEHICULAR: string;
};

export type ProcesadosResponse = {
  items: ProcesadoSapItem[];
  total: number;
};

export async function listProcesados(params: {
  fecha: string; // YYYY-MM-DD
  limit?: number;
  offset?: number;
}): Promise<ProcesadosResponse> {
  const qs = new URLSearchParams();
  qs.set("fecha", params.fecha);
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.offset != null) qs.set("offset", String(params.offset));
  return request<ProcesadosResponse>(`/registros/procesados?${qs.toString()}`, {
    method: "GET",
  });
}

// ======================
// Dashboard estadísticas
// ======================
export type DashboardStatsPorDia = {
  fecha: string;
  total: number;
  pendientes: number;
  procesados: number;
  anulados: number;
};

export type DashboardStatsPorEstado = { estado: string; total: number };
export type DashboardStatsPorTransportista = { nombre: string; total: number };

export type DashboardStatsResponse = {
  por_dia: DashboardStatsPorDia[];
  por_estado: DashboardStatsPorEstado[];
  por_transportista: DashboardStatsPorTransportista[];
  total_registros: number;
};

export async function getDashboardStats(params?: {
  desde?: string;
  hasta?: string;
  dias?: number;
}): Promise<DashboardStatsResponse> {
  const qs = new URLSearchParams();
  if (params?.desde) qs.set("desde", params.desde);
  if (params?.hasta) qs.set("hasta", params.hasta);
  if (params?.dias != null) qs.set("dias", String(params.dias));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return request<DashboardStatsResponse>(`/registros/dashboard-stats${suffix}`, { method: "GET" });
}

// ======================
// OCR
// Backend real: POST /api/v1/ocr/extraer?tipo=...
// ======================
export type TipoOCR =
  | "DNI"
  | "PS_BETA"
  | "TERMOGRAFO"
  | "BOOKING"
  | "O_BETA"
  | "AWB";

export type OcrResponse = {
  tipo: TipoOCR;
  texto: string;
  valores_detectados: string[];
  mejor_valor: string | null;
};

export async function extractOcr(tipo: TipoOCR, file: File): Promise<OcrResponse> {
  const fd = new FormData();
  fd.append("archivo", file);

  return request<OcrResponse>(`/ocr/extraer?tipo=${encodeURIComponent(tipo)}`, {
    method: "POST",
    body: fd,
  });
}

// ======================
// VEHÍCULOS (por placas, con transportista asociado)
// Backend real: GET /api/v1/vehiculos/por-placas?placas=...
// ======================
export type Transportista = {
  id: number;
  ruc: string;
  codigo_sap: string;
  nombre_transportista: string;
  partida_registral?: string | null;
  estado?: string | null;
};

export type VehiculoConTransportista = {
  id: number;
  placa_tracto: string;
  placa_carreta: string | null;
  placas: string;
  marca: string | null;
  cert_vehicular: string | null;
  transportista: Transportista | null;
  /** True si la placa carreta pertenece a otro transportista (el que manda es el del tracto). */
  carreta_distinto_transportista: boolean;
  /** Nombre del transportista de la carreta cuando es distinto. */
  carreta_transportista_nombre: string | null;
};

/**
 * Busca por placa TRACTO (obligatoria) y opcional CARRETA.
 * El transportista es el del tracto. Si la carreta es de otro transportista, viene la alerta.
 */
export async function getVehiculoPorTractoCarreta(
  tracto: string,
  carreta?: string | null,
): Promise<VehiculoConTransportista> {
  const qs = new URLSearchParams();
  qs.set("tracto", (tracto || "").trim().toUpperCase());
  if (carreta && (carreta as string).trim()) {
    qs.set("carreta", (carreta as string).trim().toUpperCase());
  }
  return request<VehiculoConTransportista>(`/vehiculos/por-placas?${qs.toString()}`, {
    method: "GET",
  });
}

// ======================
// TRANSPORTISTAS
// Backend real: GET /api/v1/transportistas/buscar?texto=...
// ======================
export async function searchTransportistas(
  texto: string,
  limit: number = 20,
): Promise<Transportista[]> {
  const qs = new URLSearchParams();
  qs.set("texto", (texto || "").trim());
  qs.set("limit", String(limit));
  return request<Transportista[]>(`/transportistas/buscar?${qs.toString()}`, {
    method: "GET",
  });
}
