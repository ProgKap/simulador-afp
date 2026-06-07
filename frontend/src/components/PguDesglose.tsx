import type { SimulacionOutput } from "@/lib/types"

interface Props {
  resultado: SimulacionOutput
}

export function PguDesglose({ resultado }: Props) {
  const { pension_mensual, pension_efectiva, pgu_monto, pgu_suplemento, pgu_elegible } = resultado

  return (
    <div style={{
      background: pgu_elegible ? "#EFF6FF" : "var(--bg-card)",
      border: pgu_elegible ? "1.5px solid #93C5FD" : "1px solid var(--border)",
      borderRadius: "var(--r)",
      padding: "18px 20px",
      boxShadow: "var(--shadow)",
    }}>
      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <div style={{
          width: "30px", height: "30px", borderRadius: "8px", flexShrink: 0,
          background: pgu_elegible ? "#3B82F6" : "var(--bg-muted)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L10.5 6H15L11.5 9.5L13 14.5L8 11.5L3 14.5L4.5 9.5L1 6H5.5L8 1Z"
              fill={pgu_elegible ? "white" : "var(--text-light)"} />
          </svg>
        </div>
        <div>
          <p style={{ fontSize: "13px", fontWeight: 600, color: pgu_elegible ? "#1D4ED8" : "var(--text)" }}>
            Pensión Garantizada Universal (PGU)
          </p>
          <p style={{ fontSize: "11px", color: pgu_elegible ? "#3B82F6" : "var(--text-muted)" }}>
            {pgu_elegible
              ? "El Estado cubre la diferencia hasta el mínimo garantizado"
              : "Tu pensión supera el umbral — la PGU no aplica"}
          </p>
        </div>
      </div>

      {/* Desglose suma */}
      <div style={{
        background: pgu_elegible ? "white" : "var(--bg-muted)",
        borderRadius: "var(--r-sm)",
        padding: "14px 16px",
        display: "flex", flexDirection: "column", gap: "8px",
      }}>
        <SumaRow
          label="Pensión AFP (cuenta individual)"
          value={`$${pension_mensual.toLocaleString("es-CL")}`}
          color="var(--text)"
        />
        <SumaRow
          label={pgu_elegible ? "Suplemento del Estado (PGU)" : "Suplemento Estado (no aplica)"}
          value={`+$${pgu_suplemento.toLocaleString("es-CL")}`}
          color={pgu_elegible ? "#2563EB" : "var(--text-light)"}
        />
        <div style={{ height: "1px", background: pgu_elegible ? "#BFDBFE" : "var(--border)", margin: "2px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: pgu_elegible ? "#1D4ED8" : "var(--text)" }}>
            Total mensual
          </span>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: 700,
            color: pgu_elegible ? "#1D4ED8" : "var(--text)",
          }}>
            ${pension_efectiva.toLocaleString("es-CL")}
          </span>
        </div>
      </div>

      <p style={{ fontSize: "11px", color: pgu_elegible ? "#3B82F6" : "var(--text-light)", marginTop: "10px", lineHeight: 1.5 }}>
        PGU vigente: <strong>${pgu_monto.toLocaleString("es-CL")}/mes</strong>
        {pgu_elegible
          ? " · El Estado garantiza este mínimo. Puede cambiar por reformas legislativas."
          : " · Tu cuenta individual supera este umbral."}
      </p>
    </div>
  )
}

function SumaRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 500, color }}>
        {value}
      </span>
    </div>
  )
}
