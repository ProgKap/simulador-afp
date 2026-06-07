"use client"

import { useState, useCallback, useEffect } from "react"
import { SimuladorForm } from "@/components/SimuladorForm"
import { ProyeccionChart } from "@/components/ProyeccionChart"
import { ComparativaTable } from "@/components/ComparativaTable"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { comparar, getIndicadores } from "@/lib/api"
import type { AFP, ComparadorRow, Indicadores, SimulacionInput, SimulacionOutput } from "@/lib/types"
import { INDICADORES_FALLBACK } from "@/lib/types"

export default function Home() {
  const [resultado,    setResultado]    = useState<SimulacionOutput | null>(null)
  const [comparador,   setComparador]   = useState<ComparadorRow[] | null>(null)
  const [afpActual,    setAfpActual]    = useState<AFP>("uno")
  const [copied,       setCopied]       = useState(false)
  const [indicadores,  setIndicadores]  = useState<Indicadores>(INDICADORES_FALLBACK)

  useEffect(() => {
    getIndicadores().then(setIndicadores).catch(() => null)
  }, [])

  const handleResultado = useCallback((r: SimulacionOutput, input: SimulacionInput) => {
    setResultado(r)
    setAfpActual(input.afp)
    setComparador(null)
    comparar({
      edad:               input.edad,
      sexo:               input.sexo,
      sueldo:             input.sueldo,
      fondo:              input.fondo,
      saldo_actual:       input.saldo_actual,
      crecimiento_sueldo: input.crecimiento_sueldo,
      apv_mensual:        input.apv_mensual,
    }).then(setComparador).catch(() => null)
  }, [])

  function handleShare() {
    if (!resultado) return
    const url = window.location.href.split("?")[0] + window.location.search
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", fontFamily: "var(--font-body)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        :root {
          --bg:           #F7F5F2;
          --bg-card:      #FFFFFF;
          --bg-muted:     #F0EDE8;
          --accent:       #1B4332;
          --accent-mid:   #2D6A4F;
          --accent-light: #D8F3DC;
          --accent-pale:  #F0FAF2;
          --gold:         #B5963A;
          --gold-light:   #FBF3DC;
          --text:         #1A1714;
          --text-muted:   #6B6560;
          --text-light:   #A09890;
          --border:       #E4E0D8;
          --border-dark:  #C8C2B8;
          --shadow:       0 1px 3px rgba(26,23,20,0.06), 0 4px 16px rgba(26,23,20,0.04);
          --shadow-lg:    0 8px 32px rgba(26,23,20,0.1);
          --font-display: 'Instrument Serif', serif;
          --font-body:    'DM Sans', sans-serif;
          --font-mono:    'DM Mono', monospace;
          --r:            14px;
          --r-sm:         8px;
          --r-lg:         20px;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); color: var(--text); }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }

        @media (max-width: 768px) {
          .layout-grid { grid-template-columns: 1fr !important; }
          .metrics-grid { grid-template-columns: 1fr 1fr !important; }
          .header-inner { padding: 0 16px !important; }
          .hero { margin-bottom: 24px !important; }
          .content-area { padding: 20px 16px !important; }
        }
      `}</style>

      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-card)",
        padding: "0 40px",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }} className="header-inner">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "28px", height: "28px",
            background: "var(--accent)", borderRadius: "6px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2L9.5 6H11.5L7 12L2.5 6H4.5L7 2Z" fill="white" fillOpacity="0.9"/>
            </svg>
          </div>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "17px", color: "var(--text)" }}>
            AFP Simulator
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "var(--accent-pale)", border: "1px solid var(--accent-light)",
            borderRadius: "20px", padding: "4px 12px",
          }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-mid)", animation: "pulse 2s infinite" }}/>
            <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--accent)", letterSpacing: "0.5px" }}>
              Datos reales 2026
            </span>
          </div>
          <a
            href="https://github.com/martinsilvasal5/afp-simulador"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: "5px",
              fontSize: "12px", color: "var(--text-muted)",
              textDecoration: "none", padding: "4px 10px",
              border: "1px solid var(--border)", borderRadius: "6px",
              background: "var(--bg)",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            GitHub
          </a>
        </div>
      </header>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }} className="content-area">

        {/* Hero */}
        <div style={{ marginBottom: "40px" }} className="hero">
          <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent-mid)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px" }}>
            Sistema Previsional Chileno
          </p>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 5vw, 52px)",
            fontWeight: 400,
            lineHeight: 1.15,
            maxWidth: "600px",
            marginBottom: "14px",
          }}>
            Descubre cuánto<br/>
            <em style={{ color: "var(--accent-mid)" }}>recibirás de pensión</em>
          </h1>
          <p style={{ fontSize: "15px", color: "var(--text-muted)", fontWeight: 300, maxWidth: "480px", lineHeight: 1.7 }}>
            Simulación con rentabilidades históricas reales, Monte Carlo y comisiones vigentes 2026.
            Open source — código en GitHub.
          </p>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "24px", alignItems: "start" }}
          className="layout-grid"
        >
          {/* Formulario */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            padding: "28px",
            boxShadow: "var(--shadow)",
            position: "sticky",
            top: "24px",
          }}>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>Tus datos</h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Ingresa tu información para calcular tu proyección
              </p>
            </div>
            <ErrorBoundary>
              <SimuladorForm onResultado={handleResultado} indicadores={indicadores} />
            </ErrorBoundary>
          </div>

          {/* Resultados */}
          {resultado ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Alerta PGU */}
              {resultado.pgu_elegible && (
                <div style={{
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  borderRadius: "var(--r)",
                  padding: "16px 18px",
                  display: "flex", gap: "14px",
                }}>
                  <span style={{ fontSize: "22px", flexShrink: 0 }}>🛡️</span>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#1d4ed8", marginBottom: "4px" }}>
                      Tu pensión estaría cubierta por la PGU
                    </p>
                    <p style={{ fontSize: "12px", color: "#3b82f6", lineHeight: 1.6 }}>
                      Tu proyección AFP (${resultado.pension_mensual.toLocaleString("es-CL")}/mes) es menor
                      a la Pensión Garantizada Universal (${resultado.pgu_monto.toLocaleString("es-CL")}/mes).
                      El Estado cubriría la diferencia — pero este beneficio puede cambiar con reformas.
                      Cotizar más (APV, mejor AFP) sigue siendo valioso.
                    </p>
                  </div>
                </div>
              )}

              {/* Métricas principales */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }} className="metrics-grid">
                <MetricCard
                  label={resultado.pgu_elegible ? "Pensión efectiva (con PGU)" : "Pensión estimada"}
                  value={`$${resultado.pension_efectiva.toLocaleString("es-CL")}`}
                  sub={`mensual a los ${resultado.edad_jubilacion} años`}
                  accent
                />
                <MetricCard
                  label="Saldo acumulado"
                  value={`$${Math.round(resultado.saldo_estimado / 1_000_000)}M`}
                  sub={`en ${resultado.anos_hasta_jubilacion} años`}
                  gold
                />
                <MetricCard
                  label="Escenario pesimista (p25)"
                  value={`$${resultado.pension_p25.toLocaleString("es-CL")}`}
                  sub="25% de simulaciones Monte Carlo"
                />
                <MetricCard
                  label="Escenario optimista (p75)"
                  value={`$${resultado.pension_p75.toLocaleString("es-CL")}`}
                  sub="75% de simulaciones Monte Carlo"
                />
              </div>

              {/* Contexto educativo */}
              <ContextoPension resultado={resultado} indicadores={indicadores} />

              {/* Costo comisión AFP */}
              <div style={{
                background: "var(--gold-light)", border: "1px solid #E8D49A",
                borderRadius: "var(--r)", padding: "14px 18px",
                display: "flex", alignItems: "center", gap: "12px",
              }}>
                <div style={{
                  width: "32px", height: "32px", background: "var(--gold)", borderRadius: "8px",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.5"/>
                    <path d="M7 4V7.5L9 9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "#7A6420", marginBottom: "2px" }}>
                    Total pagado en comisiones AFP
                  </p>
                  <p style={{ fontSize: "13px", color: "#5C4B18" }}>
                    ${Math.round(resultado.total_comisiones / 1_000_000).toLocaleString("es-CL")}M en comisiones
                    · {(resultado.comision_afp * 100).toFixed(2)}% anual sobre sueldo imponible
                  </p>
                  {resultado.total_apv > 0 && (
                    <p style={{ fontSize: "12px", color: "#7A6420", marginTop: "4px" }}>
                      + ${Math.round(resultado.total_apv / 1_000_000).toLocaleString("es-CL")}M aportado via APV (con bonificación fiscal)
                    </p>
                  )}
                </div>
              </div>

              {/* Gráfico */}
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)", padding: "28px", boxShadow: "var(--shadow)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                  <div>
                    <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "3px" }}>Evolución del saldo</h3>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      Proyección año a año hasta los {resultado.edad_jubilacion} años · en millones de pesos
                    </p>
                  </div>
                  {/* Share button */}
                  <button
                    onClick={handleShare}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: "6px 12px", borderRadius: "var(--r-sm)",
                      border: "1px solid var(--border)", background: "var(--bg)",
                      cursor: "pointer", fontSize: "12px", color: "var(--text-muted)",
                      transition: "all 0.15s", flexShrink: 0,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M10 2l4 4-4 4M14 6H6a4 4 0 000 8h1"/>
                    </svg>
                    {copied ? "¡Copiado!" : "Compartir"}
                  </button>
                </div>
                <ErrorBoundary>
                  <ProyeccionChart proyeccion={resultado.proyeccion_anual} />
                </ErrorBoundary>
              </div>

              {/* Comparador de AFPs */}
              {comparador && (
                <div style={{
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: "var(--r-lg)", padding: "28px", boxShadow: "var(--shadow)",
                }}>
                  <ErrorBoundary>
                    <ComparativaTable filas={comparador} afpActual={afpActual} />
                  </ErrorBoundary>
                </div>
              )}
              {!comparador && (
                <div style={{
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: "var(--r-lg)", padding: "28px", boxShadow: "var(--shadow)",
                  display: "flex", alignItems: "center", gap: "12px",
                }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid var(--accent-mid)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Calculando comparativa...</span>
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
              )}

              {/* Disclaimer */}
              <p style={{ fontSize: "11px", color: "var(--text-light)", lineHeight: 1.6, textAlign: "center" }}>
                Proyección basada en rentabilidades históricas 2002–2026 · Monte Carlo n=2.000 simulaciones ·
                No constituye asesoría financiera · Fuente: Superintendencia de Pensiones de Chile
              </p>
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, accent, gold }: {
  label: string; value: string; sub: string; accent?: boolean; gold?: boolean
}) {
  return (
    <div style={{
      background: accent ? "var(--accent)" : gold ? "var(--gold)" : "var(--bg-card)",
      border: accent || gold ? "none" : "1px solid var(--border)",
      borderRadius: "var(--r)", padding: "20px",
      boxShadow: accent || gold ? "var(--shadow-lg)" : "var(--shadow)",
    }}>
      <p style={{
        fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
        letterSpacing: "1px", marginBottom: "8px",
        color: accent || gold ? "rgba(255,255,255,0.6)" : "var(--text-muted)",
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: "var(--font-mono)", fontSize: "22px", fontWeight: 500,
        color: accent || gold ? "white" : "var(--text)",
        marginBottom: "4px", lineHeight: 1,
      }}>
        {value}
      </p>
      <p style={{ fontSize: "11px", color: accent || gold ? "rgba(255,255,255,0.5)" : "var(--text-light)" }}>
        {sub}
      </p>
    </div>
  )
}

const SUELDO_PROMEDIO = 800_000

function ContextoPension({ resultado, indicadores }: { resultado: SimulacionOutput; indicadores: Indicadores }) {
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

function EmptyState() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "400px",
      background: "var(--bg-card)", border: "1px dashed var(--border-dark)",
      borderRadius: "var(--r-lg)", gap: "16px",
    }}>
      <div style={{
        width: "56px", height: "56px", background: "var(--bg-muted)",
        borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M3 3v18h18" stroke="var(--text-light)" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M7 16l4-4 3 3 5-6" stroke="var(--accent-mid)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "4px" }}>
          Tu proyección aparecerá aquí
        </p>
        <p style={{ fontSize: "12px", color: "var(--text-light)" }}>
          Completa el formulario y haz clic en Calcular
        </p>
      </div>
    </div>
  )
}
