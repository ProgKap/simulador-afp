import type { Indicadores } from "./types"

const BCCH_URL = "https://si3.bcentral.cl/SieteRestWS/SieteRestWS.ashx"

const SERIES = {
  utm: "F047.UTM.IND.N.M",
  ipc: "F028.LBS.IPC.Z.Z.T.M",
}

// PGU vigente — actualizar aquí cuando el Gobierno cambie el monto legal
export const PGU_VIGENTE = 214_296

export const INDICADORES_FALLBACK: Indicadores = {
  utm_valor:      68_306,
  ipc_mensual:    0.003,
  ipc_anual:      0.035,
  salario_minimo: 500_000,
  pgu_monto:      PGU_VIGENTE,
  fuente:         "fallback",
}

async function fetchSeries(user: string, pass: string, series: string): Promise<number | null> {
  const today         = new Date().toISOString().split("T")[0]
  const threeMonths   = new Date(Date.now() - 90 * 86_400_000).toISOString().split("T")[0]
  const params        = new URLSearchParams({
    user, pass, function: "GetSeries",
    timeseries: series, firstdate: threeMonths, lastdate: today,
  })

  try {
    const res  = await fetch(`${BCCH_URL}?${params}`, { next: { revalidate: 86400 } })
    const buf  = await res.arrayBuffer()
    const text = new TextDecoder("latin1").decode(buf)
    const data = JSON.parse(text)

    if (data.Codigo !== 0) return null

    const obs: { valor?: string }[] = data.Series?.Obs ?? []
    for (let i = obs.length - 1; i >= 0; i--) {
      const val = parseFloat((obs[i].valor ?? "").replace(",", "."))
      if (!isNaN(val)) return val
    }
    return null
  } catch {
    return null
  }
}

export async function getIndicadores(user?: string, pass?: string): Promise<Indicadores> {
  // pgu_monto is always the statutory value — no external API has it
  const result: Indicadores = { ...INDICADORES_FALLBACK }

  if (!user || !pass) return result

  const [utmRaw, ipcRaw] = await Promise.all([
    fetchSeries(user, pass, SERIES.utm),
    fetchSeries(user, pass, SERIES.ipc),
  ])

  if (utmRaw !== null && utmRaw > 50_000) {
    result.utm_valor = Math.round(utmRaw)
    result.fuente    = "bcch"
  }
  if (ipcRaw !== null) {
    result.ipc_mensual = ipcRaw / 100
    result.ipc_anual   = Math.round(((1 + ipcRaw / 100) ** 12 - 1) * 10000) / 10000
    if (result.fuente !== "bcch") result.fuente = "bcch_partial"
  }

  return result
}
