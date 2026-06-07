import { NextRequest, NextResponse } from "next/server"
import { calcularSimulacion, COMISIONES, EDAD_JUBILACION } from "@/lib/simulator"
import { getIndicadores } from "@/lib/bcch"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ detail: "JSON inválido" }, { status: 400 })
  }

  const { edad, sexo, sueldo, afp, fondo, saldo_actual, crecimiento_sueldo, apv_mensual } = body

  // Validación
  if (typeof edad !== "number" || typeof sueldo !== "number") {
    return NextResponse.json({ detail: [{ msg: "edad y sueldo son requeridos" }] }, { status: 422 })
  }
  if (!["hombre", "mujer"].includes(sexo as string)) {
    return NextResponse.json({ detail: [{ msg: "sexo debe ser hombre o mujer" }] }, { status: 422 })
  }
  if (!COMISIONES[afp as string]) {
    return NextResponse.json({ detail: [{ msg: "AFP inválida" }] }, { status: 422 })
  }
  if (!["A", "B", "C", "D", "E"].includes(fondo as string)) {
    return NextResponse.json({ detail: [{ msg: "fondo inválido" }] }, { status: 422 })
  }
  const edadMax = EDAD_JUBILACION[sexo as string] - 1
  if (edad < 18 || edad > edadMax) {
    return NextResponse.json({ detail: [{ msg: `edad debe estar entre 18 y ${edadMax}` }] }, { status: 422 })
  }
  if (sueldo < 460_000) {
    return NextResponse.json({ detail: [{ msg: "sueldo mínimo $460.000" }] }, { status: 422 })
  }

  const indicadores = await getIndicadores(
    process.env.BCCH_USER,
    process.env.BCCH_PASS,
  )

  const resultado = calcularSimulacion({
    edad,
    sexo:               sexo as string,
    sueldo,
    afp:                afp as string,
    fondo:              fondo as string,
    saldo_actual:       (saldo_actual as number) ?? 0,
    crecimiento_sueldo: (crecimiento_sueldo as number) ?? 0.02,
    apv_mensual:        (apv_mensual as number) ?? 0,
    utm_valor:          indicadores.utm_valor,
  })

  return NextResponse.json(resultado)
}
