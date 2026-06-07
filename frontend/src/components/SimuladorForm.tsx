"use client"

import { useState, useEffect } from "react"
import { simular } from "@/lib/api"
import type { AFP, Fondo, Indicadores, Sexo, SimulacionInput, SimulacionOutput } from "@/lib/types"
import { INDICADORES_FALLBACK } from "@/lib/bcch"

interface Props {
  onResultado: (resultado: SimulacionOutput, input: SimulacionInput) => void
  indicadores?: Indicadores
}

const AFP_OPTIONS: { value: AFP; label: string; comision: string }[] = [
  { value: "uno",       label: "AFP Uno",       comision: "0.46%" },
  { value: "modelo",    label: "AFP Modelo",    comision: "0.58%" },
  { value: "planvital", label: "AFP PlanVital",  comision: "1.16%" },
  { value: "habitat",   label: "AFP Hábitat",   comision: "1.27%" },
  { value: "capital",   label: "AFP Capital",   comision: "1.44%" },
  { value: "cuprum",    label: "AFP Cuprum",    comision: "1.44%" },
  { value: "provida",   label: "AFP ProVida",   comision: "1.45%" },
]

const FONDO_OPTIONS: { value: Fondo; label: string; desc: string }[] = [
  { value: "A", label: "Fondo A", desc: "Mayor riesgo y rentabilidad" },
  { value: "B", label: "Fondo B", desc: "Riesgo alto" },
  { value: "C", label: "Fondo C", desc: "Riesgo moderado" },
  { value: "D", label: "Fondo D", desc: "Riesgo bajo" },
  { value: "E", label: "Fondo E", desc: "Sin riesgo de mercado" },
]

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  fontSize: "14px",
  fontFamily: "var(--font-body)",
  color: "var(--text)",
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-sm)",
  outline: "none",
  transition: "border-color 0.15s",
  appearance: "none" as const,
}

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.8px",
  marginBottom: "6px",
  display: "block",
}

function parseNumber(value: string): number {
  return parseInt(value.replace(/\./g, "").replace(/,/g, ""), 10) || 0
}

export function SimuladorForm({ onResultado, indicadores = INDICADORES_FALLBACK }: Props) {
  const [sexo,    setSexo]    = useState<Sexo>("hombre")
  const [edad,    setEdad]    = useState<string>("28")
  const [sueldo,  setSueldo]  = useState<string>("1000000")
  const [afp,     setAfp]     = useState<AFP>("uno")
  const [fondo,   setFondo]   = useState<Fondo>("C")
  const [saldo,   setSaldo]   = useState<string>("0")
  const [apv,     setApv]     = useState<string>("0")
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const edadMax = sexo === "mujer" ? 59 : 64

  // Pre-fill form from URL params (permalink sharing)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get("sexo")   && ["hombre","mujer"].includes(p.get("sexo")!))
      setSexo(p.get("sexo") as Sexo)
    if (p.get("edad"))   setEdad(p.get("edad")!)
    if (p.get("sueldo")) setSueldo(p.get("sueldo")!)
    if (p.get("afp")    && AFP_OPTIONS.some(o => o.value === p.get("afp")))
      setAfp(p.get("afp") as AFP)
    if (p.get("fondo")  && FONDO_OPTIONS.some(o => o.value === p.get("fondo")))
      setFondo(p.get("fondo") as Fondo)
    if (p.get("saldo"))  setSaldo(p.get("saldo")!)
    if (p.get("apv"))    setApv(p.get("apv")!)
  }, [])

  async function handleSubmit() {
    const edadNum   = parseInt(edad, 10)
    const sueldoNum = parseNumber(sueldo)

    if (!edadNum || edadNum < 18 || edadNum > edadMax) {
      setError(`La edad debe estar entre 18 y ${edadMax} años`)
      return
    }
    if (!sueldoNum || sueldoNum < 460_000) {
      setError("El sueldo debe ser al menos $460.000")
      return
    }

    setError(null)
    setLoading(true)

    try {
      const input: SimulacionInput = {
        edad:        edadNum,
        sexo,
        sueldo:      sueldoNum,
        afp,
        fondo,
        saldo_actual: parseNumber(saldo),
        apv_mensual:  parseNumber(apv),
      }
      const resultado = await simular(input)
      onResultado(resultado, input)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al calcular")
    } finally {
      setLoading(false)
    }
  }

  function moneyField(
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
  ) {
    return (
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
          fontSize: "13px", color: "var(--text-muted)", fontWeight: 500,
        }}>$</span>
        <input
          type="text"
          value={value ? Number(parseNumber(value)).toLocaleString("es-CL") : ""}
          onChange={(e) => {
            const raw = e.target.value.replace(/\./g, "")
            if (/^\d*$/.test(raw)) onChange(raw)
          }}
          onFocus={(e)  => e.target.style.borderColor = "var(--accent-mid)"}
          onBlur={(e)   => e.target.style.borderColor = "var(--border)"}
          style={{ ...inputStyle, paddingLeft: "28px" }}
          placeholder={placeholder}
        />
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

      {/* Sexo */}
      <div>
        <label style={labelStyle}>Sexo</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {(["hombre", "mujer"] as Sexo[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                setSexo(s)
                const max = s === "mujer" ? 59 : 64
                if (parseInt(edad, 10) > max) setEdad(String(max))
              }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "8px", padding: "11px 12px",
                borderRadius: "var(--r-sm)",
                border: sexo === s ? "1px solid var(--accent-mid)" : "1px solid var(--border)",
                background: sexo === s ? "var(--accent-pale)" : "var(--bg)",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: "16px", lineHeight: 1 }}>
                {s === "hombre" ? "♂" : "♀"}
              </span>
              <span style={{
                fontSize: "13px",
                fontWeight: sexo === s ? 600 : 400,
                color: sexo === s ? "var(--accent)" : "var(--text)",
              }}>
                {s === "hombre" ? "Hombre" : "Mujer"}
              </span>
              <span style={{
                fontSize: "10px",
                color: sexo === s ? "var(--accent-mid)" : "var(--text-light)",
                fontFamily: "var(--font-mono)", fontWeight: 500,
              }}>
                {s === "hombre" ? "jubila 65" : "jubila 60"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Edad */}
      <div>
        <label style={labelStyle}>Edad actual</label>
        <input
          type="number"
          min={18}
          max={edadMax}
          value={edad}
          onChange={(e) => setEdad(e.target.value === "" ? "" : e.target.value)}
          onFocus={(e) => e.target.style.borderColor = "var(--accent-mid)"}
          onBlur={(e)  => e.target.style.borderColor = "var(--border)"}
          style={inputStyle}
          placeholder="28"
        />
      </div>

      {/* Sueldo */}
      <div>
        <label style={labelStyle}>Sueldo mensual bruto</label>
        {moneyField(sueldo, setSueldo, "1.000.000")}
      </div>

      {/* AFP */}
      <div>
        <label style={labelStyle}>AFP</label>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {AFP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setAfp(opt.value)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 12px", borderRadius: "var(--r-sm)",
                border: afp === opt.value ? "1px solid var(--accent-mid)" : "1px solid var(--border)",
                background: afp === opt.value ? "var(--accent-pale)" : "var(--bg)",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              <span style={{
                fontSize: "13px",
                fontWeight: afp === opt.value ? 600 : 400,
                color: afp === opt.value ? "var(--accent)" : "var(--text)",
              }}>
                {opt.label}
              </span>
              <span style={{
                fontSize: "11px", fontFamily: "var(--font-mono)",
                color: afp === opt.value ? "var(--accent-mid)" : "var(--text-light)",
                fontWeight: 500,
              }}>
                {opt.comision}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Fondo */}
      <div>
        <label style={labelStyle}>Fondo de inversión</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
          {FONDO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFondo(opt.value)}
              title={opt.desc}
              style={{
                padding: "8px 4px", borderRadius: "var(--r-sm)", textAlign: "center",
                border: fondo === opt.value ? "1px solid var(--accent-mid)" : "1px solid var(--border)",
                background: fondo === opt.value ? "var(--accent)" : "var(--bg)",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              <span style={{
                fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-mono)",
                color: fondo === opt.value ? "white" : "var(--text)",
              }}>
                {opt.value}
              </span>
            </button>
          ))}
        </div>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
          {FONDO_OPTIONS.find(f => f.value === fondo)?.desc}
        </p>
      </div>

      {/* Saldo actual */}
      <div>
        <label style={labelStyle}>
          Saldo actual en AFP{" "}
          <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(opcional)</span>
        </label>
        {moneyField(saldo, setSaldo, "0")}
      </div>

      {/* APV mensual */}
      <div>
        <label style={labelStyle}>
          APV mensual — Tipo A{" "}
          <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(opcional)</span>
        </label>
        {moneyField(apv, setApv, "0")}
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "5px", lineHeight: 1.5 }}>
          El Estado bonifica el +15% de tus aportes. Máximo{" "}
          ${(6 * indicadores.utm_valor).toLocaleString("es-CL")}/año de bonificación
          {indicadores.fuente === "bcch" && (
            <span style={{ color: "var(--accent-mid)", marginLeft: "4px" }}>· UTM BCCH</span>
          )}
        </p>
      </div>

      {error && (
        <div style={{
          background: "#FEF2F2", border: "1px solid #FECACA",
          borderRadius: "var(--r-sm)", padding: "10px 14px",
          fontSize: "13px", color: "#DC2626",
        }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: "100%", padding: "13px",
          background: loading ? "var(--accent-mid)" : "var(--accent)",
          color: "white", border: "none", borderRadius: "var(--r-sm)",
          fontSize: "14px", fontWeight: 600, fontFamily: "var(--font-body)",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.15s", letterSpacing: "0.3px",
        }}
      >
        {loading ? "Calculando..." : "Calcular pensión"}
      </button>
    </div>
  )
}
