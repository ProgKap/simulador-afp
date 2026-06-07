import type { ComparadorRow, ProyeccionAnual, SimulacionOutput } from "./types"

// ── Constantes ────────────────────────────────────────────────────────────────

export const COMISIONES: Record<string, number> = {
  uno:       0.0046,
  modelo:    0.0058,
  planvital: 0.0116,
  habitat:   0.0127,
  capital:   0.0144,
  cuprum:    0.0144,
  provida:   0.0145,
}

export const AFP_LABELS: Record<string, string> = {
  uno:       "AFP Uno",
  modelo:    "AFP Modelo",
  planvital: "AFP PlanVital",
  habitat:   "AFP Hábitat",
  capital:   "AFP Capital",
  cuprum:    "AFP Cuprum",
  provida:   "AFP ProVida",
}

// Rentabilidades REALES (descontada inflación ~3.5% histórica Chile)
// Fuente: SP Chile serie 2002-2024, ajustadas por IPC promedio
const RENTABILIDAD: Record<string, number> = {
  A: 0.036,  // 7.2% nominal - 3.5% inflación
  B: 0.022,  // 5.8% - 3.5%
  C: 0.010,  // 4.5% - 3.5%
  D: 0.001,  // 3.1% - 3.5% ≈ 0 (preservación de capital)
  E: 0.001,  // 2.3% - 3.5% ≈ 0 (instrumento de bajo riesgo)
}

// Volatilidad real (igual que nominal en términos relativos)
const VOLATILIDAD: Record<string, number> = {
  A: 0.115, B: 0.085, C: 0.055, D: 0.035, E: 0.015,
}

export const EDAD_JUBILACION: Record<string, number> = { hombre: 65, mujer: 60 }
const ESPERANZA_VIDA: Record<string, number>         = { hombre: 20, mujer: 27 }

export const PGU_MONTO = 214_296
const APV_BONIFICACION_RATE = 0.15
const APV_BONIFICACION_UTM  = 6

// Tope imponible: DL 3.500 Art. 14 — solo se cotiza sobre máximo 82.6 UF/mes
// Con UF ≈ $37.800 (junio 2026) → $3.122.280/mes
export const TOPE_IMPONIBLE_UF = 82.6
export const UF_FALLBACK       = 37_800
export const TOPE_IMPONIBLE    = Math.round(TOPE_IMPONIBLE_UF * UF_FALLBACK) // ~$3.122.280

// ── Helpers matemáticos ───────────────────────────────────────────────────────

function randomNormal(): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

// ── APV Tipo A ────────────────────────────────────────────────────────────────

function apvEfectivoMensual(apvMensual: number, utmValor: number): number {
  if (apvMensual <= 0) return 0
  const apvAnual        = apvMensual * 12
  const topeBonificacion = APV_BONIFICACION_UTM * utmValor
  const bonificacion     = Math.min(apvAnual * APV_BONIFICACION_RATE, topeBonificacion)
  return apvMensual + bonificacion / 12
}

// ── Flujos anuales ────────────────────────────────────────────────────────────

function buildFlujos(
  sueldo: number,
  crecimientoSueldo: number,
  comision: number,
  apvMensual: number,
  anos: number,
  utmValor: number,
  topeImponible: number = TOPE_IMPONIBLE,
): { cotizaciones: number[]; costos: number[]; apvList: number[] } {
  const apvEfectivoAnual = apvEfectivoMensual(apvMensual, utmValor) * 12
  const cotizaciones: number[] = []
  const costos: number[]       = []
  const apvList: number[]      = []

  for (let i = 0; i < anos; i++) {
    const s = sueldo * Math.pow(1 + crecimientoSueldo, i)
    // Tope imponible: DL 3.500 Art. 14 — cotización y comisión solo sobre el tope
    const sImponible = Math.min(s, topeImponible)
    cotizaciones.push(sImponible * 0.10 * 12)
    costos.push(sImponible * comision * 12)
    apvList.push(apvEfectivoAnual)
  }

  return { cotizaciones, costos, apvList }
}

// ── Monte Carlo ───────────────────────────────────────────────────────────────

interface MCResult {
  p10: number; p25: number; p50: number; p75: number; p90: number
  bandasP25: number[]; bandasP75: number[]
}

function monteCarlo(
  saldoInicial: number,
  cotizaciones: number[],
  apvList: number[],
  rentabilidad: number,
  volatilidad: number,
  n = 2000,
): MCResult {
  const anos   = cotizaciones.length
  const flujos = cotizaciones.map((c, i) => c + apvList[i])

  const saldosPorAnio: number[][] = Array.from({ length: anos }, () => [])
  const saldosFinales: number[]   = []

  for (let sim = 0; sim < n; sim++) {
    let saldo = saldoInicial
    for (let i = 0; i < anos; i++) {
      saldo = (saldo + flujos[i]) * (1 + rentabilidad + volatilidad * randomNormal())
      saldosPorAnio[i].push(saldo)
    }
    saldosFinales.push(saldo)
  }

  saldosFinales.sort((a, b) => a - b)

  const bandasP25 = saldosPorAnio.map(yr => {
    yr.sort((a, b) => a - b)
    return Math.round(percentile(yr, 25))
  })
  const bandasP75 = saldosPorAnio.map(yr => {
    yr.sort((a, b) => a - b)
    return Math.round(percentile(yr, 75))
  })

  return {
    p10: Math.round(percentile(saldosFinales, 10)),
    p25: Math.round(percentile(saldosFinales, 25)),
    p50: Math.round(percentile(saldosFinales, 50)),
    p75: Math.round(percentile(saldosFinales, 75)),
    p90: Math.round(percentile(saldosFinales, 90)),
    bandasP25,
    bandasP75,
  }
}

// ── API pública ───────────────────────────────────────────────────────────────

export interface SimulacionParams {
  edad:                number
  sexo:                string
  sueldo:              number
  afp:                 string
  fondo:               string
  saldo_actual?:       number
  crecimiento_sueldo?: number
  apv_mensual?:        number
  utm_valor?:          number
  densidad_cotizacion?: number  // 0-1, default 1.0 (100%). Promedio Chile ~0.72
}

export function calcularSimulacion(p: SimulacionParams): SimulacionOutput {
  const comision        = COMISIONES[p.afp]
  const rentabilidad    = RENTABILIDAD[p.fondo]
  const volatilidad     = VOLATILIDAD[p.fondo]
  const edadJubilacion  = EDAD_JUBILACION[p.sexo]
  const anos            = edadJubilacion - p.edad
  const mesesRetiro     = ESPERANZA_VIDA[p.sexo] * 12
  const saldoInicial    = p.saldo_actual          ?? 0
  const crecimiento     = p.crecimiento_sueldo    ?? 0.02
  const apvMensual      = p.apv_mensual           ?? 0
  const utmValor        = p.utm_valor             ?? 68_306
  const densidad        = p.densidad_cotizacion   ?? 1.0

  const { cotizaciones, costos, apvList } = buildFlujos(
    p.sueldo, crecimiento, comision, apvMensual, anos, utmValor,
  )

  // Aplicar densidad: si cotiza solo el X% de los meses, el aporte efectivo se reduce
  const cotizacionesEfectivas = cotizaciones.map(c => c * densidad)

  const mc = monteCarlo(saldoInicial, cotizacionesEfectivas, apvList, rentabilidad, volatilidad)

  // Proyección determinística año a año
  const proyeccion: ProyeccionAnual[] = []
  let saldo = saldoInicial
  for (let i = 0; i < anos; i++) {
    saldo = (saldo + cotizacionesEfectivas[i] + apvList[i]) * (1 + rentabilidad)
    proyeccion.push({
      ano:                  p.edad + 1 + i,
      saldo:                Math.round(saldo),
      saldo_p25:            mc.bandasP25[i],
      saldo_p75:            mc.bandasP75[i],
      cotizacion_anual:     Math.round(cotizacionesEfectivas[i]),
      costo_comision_anual: Math.round(costos[i] * densidad),
      apv_anual:            Math.round(apvList[i]),
    })
  }

  const saldoFinal      = proyeccion.at(-1)?.saldo ?? 0
  const pension         = Math.floor(saldoFinal / mesesRetiro)
  const totalComisiones = Math.round(costos.map(c => c * densidad).reduce((a, b) => a + b, 0))
  const totalCotizacion = Math.round(cotizacionesEfectivas.reduce((a, b) => a + b, 0))
  const totalApv        = Math.round(apvList.reduce((a, b) => a + b, 0))
  const pguElegible     = pension < PGU_MONTO

  return {
    saldo_estimado:        saldoFinal,
    pension_mensual:       pension,
    pension_efectiva:      pguElegible ? PGU_MONTO : pension,
    pension_pesimista:     Math.floor(mc.p25 / mesesRetiro),
    pension_optimista:     Math.floor(mc.p75 / mesesRetiro),
    pension_p10:           Math.floor(mc.p10 / mesesRetiro),
    pension_p25:           Math.floor(mc.p25 / mesesRetiro),
    pension_p75:           Math.floor(mc.p75 / mesesRetiro),
    pension_p90:           Math.floor(mc.p90 / mesesRetiro),
    anos_hasta_jubilacion: anos,
    edad_jubilacion:       edadJubilacion,
    comision_afp:          comision,
    total_comisiones:      totalComisiones,
    total_cotizacion:      totalCotizacion,
    total_apv:             totalApv,
    pgu_elegible:          pguElegible,
    pgu_monto:             PGU_MONTO,
    proyeccion_anual:      proyeccion,
    percentiles_saldo:     { p10: mc.p10, p25: mc.p25, p50: mc.p50, p75: mc.p75, p90: mc.p90 },
  }
}

export function compararAFPs(p: Omit<SimulacionParams, "afp">): ComparadorRow[] {
  const edadJubilacion = EDAD_JUBILACION[p.sexo]
  const anos           = edadJubilacion - p.edad
  const mesesRetiro    = ESPERANZA_VIDA[p.sexo] * 12
  const rentabilidad   = RENTABILIDAD[p.fondo]
  const saldoInicial   = p.saldo_actual       ?? 0
  const crecimiento    = p.crecimiento_sueldo ?? 0.02
  const apvMensual     = p.apv_mensual        ?? 0
  const utmValor       = p.utm_valor          ?? 68_306

  const filas: ComparadorRow[] = Object.entries(COMISIONES).map(([afp, comision]) => {
    const { cotizaciones, costos, apvList } = buildFlujos(
      p.sueldo, crecimiento, comision, apvMensual, anos, utmValor,
    )
    let saldo = saldoInicial
    for (let i = 0; i < anos; i++) {
      saldo = (saldo + cotizaciones[i] + apvList[i]) * (1 + rentabilidad)
    }
    const totalComisiones = Math.round(costos.reduce((a, b) => a + b, 0))
    const pension         = Math.floor(saldo / mesesRetiro)
    const pguElegible     = pension < PGU_MONTO

    return {
      afp:                  afp as ComparadorRow["afp"],
      label:                AFP_LABELS[afp],
      comision_pct:         comision,
      pension_mensual:      pension,
      pension_efectiva:     pguElegible ? PGU_MONTO : pension,
      total_comisiones:     totalComisiones,
      saldo_estimado:       Math.round(saldo),
      pgu_elegible:         pguElegible,
      sobrecosto_vs_minima: 0,
    }
  })

  filas.sort((a, b) => a.total_comisiones - b.total_comisiones)
  const minimo = filas[0].total_comisiones

  return filas.map(f => ({ ...f, sobrecosto_vs_minima: f.total_comisiones - minimo }))
}
