"use client"

import type { AFP, ComparadorRow } from "@/lib/types"

const AFP_LABELS: Record<AFP, string> = {
  uno:       "AFP Uno",
  modelo:    "AFP Modelo",
  planvital: "AFP PlanVital",
  habitat:   "AFP Hábitat",
  capital:   "AFP Capital",
  cuprum:    "AFP Cuprum",
  provida:   "AFP ProVida",
}

interface Props {
  filas:      ComparadorRow[]
  afpActual:  AFP
}

export function ComparativaTable({ filas, afpActual }: Props) {
  const maxComision = Math.max(...filas.map(f => f.total_comisiones))
  const minComision = Math.min(...filas.map(f => f.total_comisiones))

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "3px" }}>
          Comparador de AFPs
        </h3>
        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Con el mismo perfil, todas las AFPs dan la misma pensión.
          La diferencia real está en cuánto le pagas a la AFP en comisiones.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {filas.map((fila, i) => {
          const esMasBarata  = fila.total_comisiones === minComision
          const esMasCara    = fila.total_comisiones === maxComision
          const esActual     = fila.afp === afpActual
          const barWidth     = ((fila.total_comisiones - minComision) / (maxComision - minComision || 1)) * 100

          return (
            <div
              key={fila.afp}
              style={{
                borderRadius: "var(--r-sm)",
                border: esActual
                  ? "1.5px solid var(--accent-mid)"
                  : esMasBarata
                    ? "1px solid #86efac"
                    : "1px solid var(--border)",
                background: esActual
                  ? "var(--accent-pale)"
                  : esMasBarata
                    ? "#f0fdf4"
                    : "var(--bg-card)",
                padding: "12px 14px",
                transition: "all 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                {/* Rank */}
                <span style={{
                  width: "20px", height: "20px", borderRadius: "50%",
                  background: esMasBarata ? "#16a34a" : esMasCara ? "#dc2626" : "var(--bg-muted)",
                  color: esMasBarata || esMasCara ? "white" : "var(--text-muted)",
                  fontSize: "10px", fontWeight: 700, display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {i + 1}
                </span>

                <span style={{
                  fontSize: "13px",
                  fontWeight: esActual ? 600 : 400,
                  color: esActual ? "var(--accent)" : "var(--text)",
                  flex: 1,
                }}>
                  {AFP_LABELS[fila.afp]}
                  {esActual && (
                    <span style={{
                      marginLeft: "6px", fontSize: "10px",
                      background: "var(--accent)", color: "white",
                      padding: "1px 6px", borderRadius: "10px", fontWeight: 500,
                    }}>
                      tu AFP
                    </span>
                  )}
                </span>

                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "11px",
                  color: "var(--text-muted)", fontWeight: 500,
                }}>
                  {(fila.comision_pct * 100).toFixed(2)}%
                </span>

                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "13px",
                  fontWeight: 600,
                  color: esMasBarata ? "#16a34a" : esMasCara ? "#dc2626" : "var(--text)",
                  minWidth: "80px", textAlign: "right",
                }}>
                  ${Math.round(fila.total_comisiones / 1_000_000).toLocaleString("es-CL")}M
                </span>
              </div>

              {/* Barra visual de costo relativo */}
              <div style={{ background: "var(--bg-muted)", borderRadius: "4px", height: "4px", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${Math.max(barWidth, 3)}%`,
                  background: esMasBarata ? "#16a34a" : esMasCara ? "#dc2626" : "var(--accent-mid)",
                  borderRadius: "4px",
                  transition: "width 0.4s ease",
                }} />
              </div>

              {fila.sobrecosto_vs_minima > 0 && (
                <p style={{ fontSize: "11px", color: "#dc2626", marginTop: "5px" }}>
                  +${Math.round(fila.sobrecosto_vs_minima / 1_000_000).toLocaleString("es-CL")}M extra
                  vs AFP más barata
                </p>
              )}
              {esMasBarata && (
                <p style={{ fontSize: "11px", color: "#16a34a", marginTop: "5px", fontWeight: 500 }}>
                  Menor costo de comisión
                </p>
              )}
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: "11px", color: "var(--text-light)", marginTop: "12px", lineHeight: 1.6 }}>
        Las cifras son el total de comisiones pagadas a lo largo de tu vida laboral.
        La pensión base es idéntica en todas las AFP porque el 10% obligatorio va siempre
        íntegro a tu cuenta individual.
      </p>
    </div>
  )
}
