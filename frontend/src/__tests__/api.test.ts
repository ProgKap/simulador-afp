import { describe, it, expect, vi, beforeEach } from "vitest"
import { simular } from "@/lib/api"

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("simular", () => {
  it("retorna SimulacionOutput cuando la API responde 200", async () => {
    const mockOutput = {
      saldo_estimado: 98_000_000,
      pension_mensual: 408_333,
      pension_pesimista: 306_250,
      pension_optimista: 510_416,
      anos_hasta_jubilacion: 37,
      comision_afp: 0.0046,
      proyeccion_anual: [],
    }

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockOutput), { status: 200 })
    )

    const resultado = await simular({ edad: 28, sueldo: 1_200_000, afp: "uno", fondo: "C" })
    expect(resultado.saldo_estimado).toBe(98_000_000)
  })

  it("lanza error legible cuando la API retorna 429", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response("", { status: 429 })
    )

    await expect(
      simular({ edad: 28, sueldo: 1_200_000, afp: "uno", fondo: "C" })
    ).rejects.toThrow("Demasiadas solicitudes")
  })
})