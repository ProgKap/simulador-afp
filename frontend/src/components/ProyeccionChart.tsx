"use client"

import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts"
import type { ProyeccionAnual } from "@/lib/types"

interface Props {
  proyeccion: ProyeccionAnual[]
}

const M = 1_000_000

export function ProyeccionChart({ proyeccion }: Props) {
  const data = proyeccion.map((p) => ({
    ano:      p.ano,
    saldo:    +(p.saldo    / M).toFixed(2),
    banda_lo: +(p.saldo_p25 / M).toFixed(2),
    banda_hi: +(p.saldo_p75 / M).toFixed(2),
  }))

  // recharts band trick: render hi area over white lo area to create fill-between effect
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
        <LegendItem color="var(--accent-mid)" label="Proyección base (rentabilidad histórica)" />
        <LegendItem color="var(--accent-light)" label="Rango probable p25–p75" band />
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="ano"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v}M`}
            width={52}
          />
          <Tooltip
            content={<CustomTooltip />}
          />
          {/* Banda superior — rellena hasta p75 */}
          <Area
            type="monotone"
            dataKey="banda_hi"
            fill="var(--accent-light)"
            fillOpacity={0.55}
            stroke="none"
            legendType="none"
            isAnimationActive={false}
          />
          {/* Banda inferior — tapa con el fondo blanco para crear el efecto "entre" */}
          <Area
            type="monotone"
            dataKey="banda_lo"
            fill="var(--bg-card)"
            fillOpacity={1}
            stroke="none"
            legendType="none"
            isAnimationActive={false}
          />
          {/* Línea de proyección base */}
          <Line
            type="monotone"
            dataKey="saldo"
            stroke="var(--accent-mid)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "var(--accent)" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number; dataKey: string }[]
  label?: number
}) {
  if (!active || !payload?.length) return null
  const base   = payload.find(p => p.dataKey === "saldo")?.value
  const bandLo = payload.find(p => p.dataKey === "banda_lo")?.value
  const bandHi = payload.find(p => p.dataKey === "banda_hi")?.value

  return (
    <div style={{
      background: "white", border: "1px solid #e2e8f0",
      borderRadius: "8px", padding: "10px 14px", fontSize: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    }}>
      <p style={{ fontWeight: 600, marginBottom: "6px", color: "#1e293b" }}>Año {label}</p>
      {base != null && (
        <p style={{ color: "var(--accent-mid)" }}>Base: <strong>${base?.toFixed(1)}M</strong></p>
      )}
      {bandLo != null && bandHi != null && (
        <p style={{ color: "#94a3b8", marginTop: "3px" }}>
          Rango: ${bandLo?.toFixed(1)}M – ${bandHi?.toFixed(1)}M
        </p>
      )}
    </div>
  )
}

function LegendItem({ color, label, band }: { color: string; label: string; band?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      {band ? (
        <div style={{ width: "16px", height: "10px", background: color, borderRadius: "2px", opacity: 0.6 }} />
      ) : (
        <div style={{ width: "16px", height: "2px", background: color, borderRadius: "1px" }} />
      )}
      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{label}</span>
    </div>
  )
}
