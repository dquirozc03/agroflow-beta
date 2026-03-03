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

  // Nuevos campos de posicionamiento (POSIC)
  etd: string;
  eta: string;
  week_eta: string;
  dias_tt: number;
  wk_debe_arribar: string;
  nave: string;
  pol: string;
  cliente: string;
  pod: string;
  po_number: string;
  aforo_planta: boolean;
  termog: string;
  flete: string;
  operador_logistico: string;
  naviera: string;
  ac_option: boolean;
  ct_option: boolean;
  fecha_llenado: string;
  hora_posicionamiento: string;
  planta_llenado: string;
  cultivo: string;
  tipo_caja: string;
  etiqueta: string;
  presentacion: string;
  cj_kg: string;
  total: string;
  es_reprogramado: boolean;

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

  etd: "",
  eta: "",
  week_eta: "",
  dias_tt: 0,
  wk_debe_arribar: "",
  nave: "",
  pol: "",
  cliente: "",
  pod: "",
  po_number: "",
  aforo_planta: false,
  termog: "",
  flete: "",
  operador_logistico: "",
  naviera: "",
  ac_option: false,
  ct_option: false,
  fecha_llenado: "",
  hora_posicionamiento: "",
  planta_llenado: "",
  cultivo: "",
  tipo_caja: "",
  etiqueta: "",
  presentacion: "",
  cj_kg: "",
  total: "",
  es_reprogramado: false,

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

