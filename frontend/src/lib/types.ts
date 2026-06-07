export type AFP    = "uno" | "modelo" | "planvital" | "habitat" | "capital" | "cuprum" | "provida"
export type Fondo  = "A" | "B" | "C" | "D" | "E"
export type Sexo   = "hombre" | "mujer"

export interface SimulacionInput {
  edad:                number
  sexo:                Sexo
  sueldo:              number
  afp:                 AFP
  fondo:               Fondo
  saldo_actual?:       number
  crecimiento_sueldo?: number
  apv_mensual?:        number
}

export interface ComparadorInput {
  edad:                number
  sexo:                Sexo
  sueldo:              number
  fondo:               Fondo
  saldo_actual?:       number
  crecimiento_sueldo?: number
  apv_mensual?:        number
}

export interface ProyeccionAnual {
  ano:                  number
  saldo:                number
  saldo_p25:            number
  saldo_p75:            number
  cotizacion_anual:     number
  costo_comision_anual: number
  apv_anual:            number
}

export interface PercentilesSaldo {
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
}

export interface SimulacionOutput {
  saldo_estimado:        number
  pension_mensual:       number
  pension_efectiva:      number
  pension_pesimista:     number
  pension_optimista:     number
  pension_p10:           number
  pension_p25:           number
  pension_p75:           number
  pension_p90:           number
  anos_hasta_jubilacion: number
  edad_jubilacion:       number
  comision_afp:          number
  total_comisiones:      number
  total_cotizacion:      number
  total_apv:             number
  pgu_elegible:          boolean
  pgu_monto:             number
  pgu_suplemento:        number
  proyeccion_anual:      ProyeccionAnual[]
  percentiles_saldo:     PercentilesSaldo
}

export interface ComparadorRow {
  afp:                  AFP
  label:                string
  comision_pct:         number
  pension_mensual:      number
  pension_efectiva:     number
  total_comisiones:     number
  saldo_estimado:       number
  pgu_elegible:         boolean
  sobrecosto_vs_minima: number
}

export interface Indicadores {
  utm_valor:      number
  ipc_mensual:    number
  ipc_anual:      number
  salario_minimo: number
  pgu_monto:      number
  fuente:         "bcch" | "bcch_partial" | "fallback"
}

