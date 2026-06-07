import type { ComparadorInput, ComparadorRow, Indicadores, SimulacionInput, SimulacionOutput } from "./types"

// Rutas relativas — apuntan a los API routes de Next.js (sin backend externo)
const BASE = ""

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 422) {
    const err = await res.json()
    throw new Error(err.detail?.[0]?.msg ?? "Datos inválidos")
  }
  if (res.status === 429) {
    throw new Error("Demasiadas solicitudes. Espera un momento.")
  }
  if (!res.ok) {
    throw new Error(`Error del servidor: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function simular(input: SimulacionInput): Promise<SimulacionOutput> {
  const res = await fetch(`${BASE}/api/simular`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(input),
  })
  return handleResponse<SimulacionOutput>(res)
}

export async function comparar(input: ComparadorInput): Promise<ComparadorRow[]> {
  const res = await fetch(`${BASE}/api/comparar`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(input),
  })
  const data = await handleResponse<{ filas: ComparadorRow[] }>(res)
  return data.filas
}

export async function getIndicadores(): Promise<Indicadores> {
  const res = await fetch(`${BASE}/api/indicadores`)
  return handleResponse<Indicadores>(res)
}
