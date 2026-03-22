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
  | "gerencia"
  | "asistente_comercial";

export const ROLE_LABELS: Record<UserRole, string> = {
  administrador: "Administrador",
  supervisor_facturacion: "Supervisor de facturación",
  facturador: "Facturador",
  documentaria: "Documentaría",
  gerencia: "Gerencia",
  asistente_comercial: "Asistente Comercial",
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

/** Puede ver el módulo de Auditoría (Admin, Gerencia y Supervisor). */
export function canSeeAuditoria(role: UserRole | string): boolean {
  return role === "administrador" || role === "gerencia" || role === "supervisor_facturacion";
}

/** Puede gestionar usuarios (Solo Admin). */
export function canManageUsers(role: UserRole | string): boolean {
  return role === "administrador";
}

/**
 * Filtro de visibilidad para Asistente Comercial.
 * Si es asistente_comercial, solo puede ver Dashboard e IE.
 */
export function canSeeModule(role: UserRole | string, moduleName: string): boolean {
  if (role === "asistente_comercial") {
    return moduleName === "Dashboard" || moduleName === "Instrucciones de Embarque";
  }
  // Para los demás roles, se ocultan según sus reglas previas
  if (moduleName === "Auditoría") return canSeeAuditoria(role);
  if (moduleName === "Usuarios") return canManageUsers(role);
  if (moduleName === "LogiCapture") return role !== "documentaria";
  if (moduleName === "Facturas Logísticas") return role !== "asistente_comercial"; // Ya cubierto arriba pero por claridad
  if (moduleName === "Packing List OGL") return true; // Visible para todos de momento

  return true;
}
