// API response types for LogiCapture

export interface BookingRef {
  booking?: string;
  o_beta?: string | null;
  dam?: string | null;
  awb?: string | null;
  // additional fields from refs
  [key: string]: unknown;
}

export interface OcrResult {
  mejor_valor: string;
  candidatos: string[];
  texto?: string; // opcional (debug)
}

export interface RegistroPayload {
  // estos pueden ser null si no se tienen al momento de crear
  o_beta?: string | null;
  booking?: string | null;
  awb?: string | null;

  // obligatorios operativos
  dni: string;
  placas: string;

  // al menos uno de los dos
  ruc?: string | null;
  codigo_sap?: string | null;

  // unicidad / precintos (opcionales pero recomendados según semáforo)
  termografos?: string | null;
  ps_beta?: string | null;
  ps_aduana?: string | null;
  ps_operador?: string | null;

  // senasa/linea (opcionales; backend calcula senasa_ps_linea)
  senasa?: string | null;
  ps_linea?: string | null;
}

export interface RegistroResponse {
  id: number;
  [key: string]: unknown;
}

export interface DuplicateItem {
  tipo: string;
  valor: string;
  mensaje?: string;
}

export interface DuplicateErrorDetail {
  duplicados: DuplicateItem[];
}

export interface DuplicateError {
  detail: DuplicateErrorDetail;
}

export interface SapRow {
  registro_id: number;
  [key: string]: unknown;
}

export type SemaforoStatus = "rojo" | "amarillo" | "verde";

export interface FormState {
  booking: string;
  o_beta: string;
  awb: string;
  dam: string;

  dni: string;
  placas_tracto: string;
  placas_carreta: string;

  /** Transportista asociado al vehículo (por placas); solo lectura. */
  transportista: {
    id: number;
    codigo_sap: string;
    nombre_transportista: string;
    ruc: string;
    partida_registral?: string | null;
  } | null;
  codigo_sap: string;

  ps_beta_items: string[];
  termografos_items: string[];

  ps_aduana: string;
  ps_operador: string;

  senasa: string;
  ps_linea: string;
}

export const initialFormState: FormState = {
  booking: "",
  o_beta: "",
  awb: "",
  dam: "",

  dni: "",
  placas_tracto: "",
  placas_carreta: "",

  transportista: null,
  codigo_sap: "",

  ps_beta_items: [],
  termografos_items: [],

  ps_aduana: "",
  ps_operador: "",

  senasa: "",
  ps_linea: "",
};

export interface RegistroListado {
  id: number;
  fecha_registro: string; // ISO
  booking?: string | null;
  o_beta?: string | null;
  awb?: string | null;
  dam?: string | null;
  estado: string;

  chofer_id: number;
  vehiculo_id: number;
  transportista_id: number;
}

