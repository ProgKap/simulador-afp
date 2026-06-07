import type { SimulacionOutput } from "@/lib/types"

interface Props {
  resultado: SimulacionOutput
}

export function PguDesglose({ resultado }: Props) {
  const { pension_mensual, pension_efectiva, pgu_monto, pgu_suplemento, pgu_elegible } = resultado

  // No aplica — texto simple
  if (!pgu_elegible) {
    return (
      <p style={{ fontSize: "12px", color: "var(--text-light)", padding: "2px 0" }}>
        PGU no aplica · tu pensión AFP (${pension_mensual.toLocaleString("es-CL")}) supera el umbral de ${pgu_monto.toLocaleString("es-CL")}/mes
      </p>
    )
  }

  // Sí aplica — indicador grande
  return (
    <div style={{
      background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
      borderRadius: "var(--r-lg)",
      padding: "24px 28px",
      boxShadow: "0 8px 32px rgba(29,78,216,0.25)",
      color: "white",
    }}>
      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1L10.5 6H15L11.5 9.5L13 14.5L8 11.5L3 14.5L4.5 9.5L1 6H5.5L8 1Z" fill="white" fillOpacity="0.9"/>
        </svg>
        <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", opacity: 0.75 }}>
          Pensión Garantizada Universal (PGU)
        </span>
      </div>

      {/* Suma */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
        <SumaLinea label="Pensión AFP (cuenta individual)" value={`$${pension_mensual.toLocaleString("es-CL")}`} />
        <SumaLinea label="Suplemento del Estado" value={`+ $${pgu_suplemento.toLocaleString("es-CL")}`} highlight />
        <div style={{ height: "1px", background: "rgba(255,255,255,0.25)", margin: "2px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, opacity: 0.9 }}>Total mensual</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "28px", fontWeight: 700 }}>
            ${pension_efectiva.toLocaleString("es-CL")}
          </span>
        </div>
      </div>

      {/* Nota */}
      <p style={{ fontSize: "11px", opacity: 0.65, lineHeight: 1.5 }}>
        El Estado garantiza ${pgu_monto.toLocaleString("es-CL")}/mes. Puede cambiar con reformas legislativas — seguir cotizando y aportar APV sigue siendo valioso.
      </p>
    </div>
  )
}

function SumaLinea({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "12px", opacity: highlight ? 0.9 : 0.65 }}>{label}</span>
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 600,
        opacity: highlight ? 1 : 0.8,
        background: highlight ? "rgba(255,255,255,0.15)" : "transparent",
        padding: highlight ? "2px 8px" : "0",
        borderRadius: "4px",
      }}>
        {value}
      </span>
    </div>
  )
}
