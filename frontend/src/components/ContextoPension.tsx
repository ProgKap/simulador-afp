import type { Indicadores, SimulacionOutput } from "@/lib/types"

const SUELDO_PROMEDIO = 800_000

interface Props {
  resultado:   SimulacionOutput
  indicadores: Indicadores
}

export function ContextoPension({ resultado, indicadores }: Props) {
  const pension      = resultado.pension_efectiva
  const sueldoMinimo = indicadores.salario_minimo
  const vsSMin       = ((pension / sueldoMinimo) * 100).toFixed(0)
  const vsProm       = ((pension / SUELDO_PROMEDIO) * 100).toFixed(0)
  const tasaRee      = ((pension / (resultado.total_cotizacion / (resultado.anos_hasta_jubilacion * 12))) * 100).toFixed(0)

  return (
    <div style={{
      background: "var(--bg-muted)", border: "1px solid var(--border)",
      borderRadius: "var(--r)", padding: "18px 20px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
          ¿Qué significa esta pensión?
        </p>
        {indicadores.fuente === "bcch" && (
          <span style={{
            fontSize: "10px", color: "var(--accent-mid)", fontWeight: 600,
            background: "var(--accent-pale)", border: "1px solid var(--accent-light)",
            borderRadius: "10px", padding: "2px 8px", letterSpacing: "0.3px",
          }}>
            Datos BCCH en vivo
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <ContextRow
          icon="📊"
          text={`Equivale al ${vsSMin}% del sueldo mínimo ($${sueldoMinimo.toLocaleString("es-CL")}) y al ${vsProm}% del sueldo promedio chileno`}
        />
        <ContextRow
          icon="🔄"
          text={`Tasa de reemplazo estimada: ${tasaRee}% de tu sueldo actual`}
          highlight={parseInt(tasaRee) < 50}
          highlightMsg="Bajo el 50% de reemplazo — considera APV para complementar"
        />
        <ContextRow
          icon="📅"
          text={`Jubilando a los ${resultado.edad_jubilacion} años, con ~${resultado.edad_jubilacion === 65 ? "20" : "27"} años de vida esperados en retiro`}
        />
        {resultado.total_apv > 0 && (
          <ContextRow
            icon="✅"
            text={`Tu APV aportará $${Math.round(resultado.total_apv / 1_000_000).toLocaleString("es-CL")}M adicionales al saldo final`}
          />
        )}
      </div>
    </div>
  )
}

function ContextRow({ icon, text, highlight, highlightMsg }: {
  icon: string; text: string; highlight?: boolean; highlightMsg?: string
}) {
  return (
    <div>
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
        <span style={{ fontSize: "14px", flexShrink: 0, marginTop: "1px" }}>{icon}</span>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>{text}</p>
      </div>
      {highlight && highlightMsg && (
        <p style={{
          fontSize: "11px", color: "#b45309", fontWeight: 500,
          marginLeft: "22px", marginTop: "3px",
          background: "#fffbeb", padding: "3px 8px",
          borderRadius: "4px", display: "inline-block",
        }}>
          ⚠ {highlightMsg}
        </p>
      )}
    </div>
  )
}
