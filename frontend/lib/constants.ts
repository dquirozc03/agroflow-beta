/**
 * Nombre del sistema (área comercial / exportaciones).
 */
export const SYSTEM_NAME = "AgroFlow";

export const MODULE_LOGICAPTURE = "LogiCapture";

/** Empresa de software que desarrolla el sistema. */
export const COMPANY_NAME = "Nexora Technologies";

/** Roles de usuario (alineados con backend donde aplique). */
export type UserRole =
  | "administrador"
  | "supervisor_facturacion"
  | "facturador"
  | "documentaria"
  | "gerencia";

export const ROLE_LABELS: Record<UserRole, string> = {
  administrador: "Administrador",
  supervisor_facturacion: "Supervisor de facturación",
  facturador: "Facturador",
  documentaria: "Documentaría",
  gerencia: "Gerencia",
};

/** Puede ver pestañas Captura y Bandeja SAP (no solo Historial). */
export function canSeeCapturaAndBandeja(role: UserRole | string): boolean {
  return role !== "documentaria";
}

/** Puede editar registros procesados (backend exige admin/editor). */
export function canEditRegistros(role: UserRole | string): boolean {
  return role === "administrador" || role === "supervisor_facturacion";
}

/** Puede anular registros (facturadores sí, documentaria no usa Bandeja). */
export function canAnularRegistros(role: UserRole | string): boolean {
  return role !== "documentaria";
}

export function canSeeAuditoria(role: UserRole | string): boolean {
  return role === "administrador" || role === "gerencia" || role === "supervisor_facturacion";
}
