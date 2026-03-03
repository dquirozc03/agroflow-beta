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

  // Campos CONTROL Sheet
  status_fcl: string;
  orden_beta_final: string;
  planta_empacadora: string;
  cultivo: string;

  booking_limpio: string;
  nave: string;

  etd_booking: string;
  eta_booking: string;
  week_eta_booking: string;
  dias_tt_booking: number;

  etd_final: string;
  eta_final: string;
  week_eta_real: string;
  dias_tt_real: number;
  week_debe_arribar: string;
  pol: string;

  o_beta_inicial: string;
  o_beta_cambio_1: string;
  motivo_cambio_1: string;
  o_beta_cambio_2: string;
  motivo_cambio_2: string;
  area_responsable: string;

  detalle_adicional: string;
  deposito_vacio: string;
  nro_contenedor: string;
  tipo_contenedor: string;

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

  status_fcl: "",
  orden_beta_final: "",
  planta_empacadora: "",
  cultivo: "",

  booking_limpio: "",
  nave: "",

  etd_booking: "",
  eta_booking: "",
  week_eta_booking: "",
  dias_tt_booking: 0,

  etd_final: "",
  eta_final: "",
  week_eta_real: "",
  dias_tt_real: 0,
  week_debe_arribar: "",
  pol: "",

  o_beta_inicial: "",
  o_beta_cambio_1: "",
  motivo_cambio_1: "",
  o_beta_cambio_2: "",
  motivo_cambio_2: "",
  area_responsable: "",

  detalle_adicional: "",
  deposito_vacio: "",
  nro_contenedor: "",
  tipo_contenedor: "",

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

