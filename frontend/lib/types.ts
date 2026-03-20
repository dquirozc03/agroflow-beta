// API response types for LogiCapture

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

  // Variables Extra de Formulario (si DB devuelve null)
  vehiculo_marca: string;
  vehiculo_cert_tracto: string;
  vehiculo_cert_carreta: string;
  vehiculo_config: string;
  vehiculo_largo_t: string;
  vehiculo_ancho_t: string;
  vehiculo_alto_t: string;
  vehiculo_largo_c: string;
  vehiculo_ancho_c: string;
  vehiculo_alto_c: string;

  /** True si la DB requiere que el usuario rellene propiedades faltantes */
  requiere_datos_vehiculo: boolean;

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

  vehiculo_marca: "",
  vehiculo_cert_tracto: "",
  vehiculo_cert_carreta: "",
  vehiculo_config: "",
  vehiculo_largo_t: "",
  vehiculo_ancho_t: "",
  vehiculo_alto_t: "",
  vehiculo_largo_c: "",
  vehiculo_ancho_c: "",
  vehiculo_alto_c: "",
  requiere_datos_vehiculo: false,

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
