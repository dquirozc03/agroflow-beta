/**
 * Nombre del sistema (área comercial / exportaciones).
 */
export const SYSTEM_NAME = "AgroFlow";

export const MODULE_LOGICAPTURE = "LogiCapture";

/** Empresa de software que desarrolla el sistema. */
export const COMPANY_NAME = "Nexora Technologies";

/** URL base para llamadas al backend (Render o Local) */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/** Roles de usuario (alineados con backend donde aplique). */
export type UserRole =
  | "ADMIN"
  | "SUPERVISOR DOCUMENTARIO"
  | "SUPERVISOR"
  | "DOCUMENTARIO"
  | "FACTURADOR"
  | "ASISTENTE COMERCIAL";

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  "SUPERVISOR DOCUMENTARIO": "Supervisor de Documentación",
  SUPERVISOR: "Supervisor",
  DOCUMENTARIO: "Documentario",
  FACTURADOR: "Facturador",
  "ASISTENTE COMERCIAL": "Asistente Comercial",
};

/** Puede ver pestañas Captura y Bandeja SAP (no solo Historial). */
export function canSeeCapturaAndBandeja(role: UserRole | string): boolean {
  return role !== "DOCUMENTARIO";
}

/** Puede editar registros procesados (backend exige admin/editor). */
export function canEditRegistros(role: UserRole | string): boolean {
  return role === "ADMIN" || role === "SUPERVISOR";
}

/** Puede anular registros (facturadores sí, documentaria no usa Bandeja). */
export function canAnularRegistros(role: UserRole | string): boolean {
  return role !== "DOCUMENTARIO";
}

/** Puede ver el módulo de Auditoría (Admin, Gerencia y Supervisor). */
export function canSeeAuditoria(role: UserRole | string): boolean {
  return role === "ADMIN" || role === "SUPERVISOR";
}

/** Puede gestionar usuarios (Solo Admin). */
export function canManageUsers(role: UserRole | string): boolean {
  return role === "ADMIN";
}

/**
 * Filtro de visibilidad para Asistente Comercial.
 * Si es asistente_comercial, solo puede ver Dashboard e IE.
 */
export function canSeeModule(role: UserRole | string, moduleName: string): boolean {
  if (role === "ASISTENTE COMERCIAL") {
    return moduleName === "Dashboard" || moduleName === "Instrucciones de Embarque";
  }
  // Para los demás roles, se ocultan según sus reglas previas
  if (moduleName === "Auditoría") return canSeeAuditoria(role);
  if (moduleName === "Usuarios") return canManageUsers(role);
  if (moduleName === "LogiCapture") return role !== "DOCUMENTARIO";
  if (moduleName === "Facturas Logísticas") return role !== "asistente_comercial"; // Ya cubierto arriba pero por claridad
  if (moduleName === "Packing List OGL") return true; // Visible para todos de momento

  return true;
}
