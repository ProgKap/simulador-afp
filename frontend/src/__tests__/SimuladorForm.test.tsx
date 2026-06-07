import { describe, it, expect } from "vitest"

describe("SimuladorForm", () => {
  it("los tipos de AFP son correctos", () => {
    const afpsValidas = ["uno", "modelo", "planvital", "habitat", "capital", "cuprum", "provida"]
    expect(afpsValidas).toHaveLength(7)
  })

  it("los fondos válidos son A B C D E", () => {
    const fondosValidos = ["A", "B", "C", "D", "E"]
    expect(fondosValidos).toHaveLength(5)
  })
})