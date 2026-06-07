"use client"

import { useState, useCallback, useEffect } from "react"
import { SimuladorForm }    from "@/components/SimuladorForm"
import { ProyeccionChart }  from "@/components/ProyeccionChart"
import { ComparativaTable } from "@/components/ComparativaTable"
import { ErrorBoundary }    from "@/components/ErrorBoundary"
import { MetricCard }       from "@/components/MetricCard"
import { ContextoPension }  from "@/components/ContextoPension"
import { PguDesglose }      from "@/components/PguDesglose"
import { EmptyState }       from "@/components/EmptyState"
import { comparar, getIndicadores } from "@/lib/api"
import type { AFP, ComparadorRow, Indicadores, SimulacionInput, SimulacionOutput } from "@/lib/types"
import { INDICADORES_FALLBACK } from "@/lib/bcch"

type MobileTab = "form" | "results"

export default function Home() {
  const [resultado,   setResultado]   = useState<SimulacionOutput | null>(null)
  const [comparador,  setComparador]  = useState<ComparadorRow[] | null>(null)
  const [afpActual,   setAfpActual]   = useState<AFP>("uno")
  const [copied,      setCopied]      = useState(false)
  const [indicadores, setIndicadores] = useState<Indicadores>(INDICADORES_FALLBACK)
  const [mobileTab,   setMobileTab]   = useState<MobileTab>("form")

  useEffect(() => {
    getIndicadores().then(setIndicadores).catch(() => null)
  }, [])

  const handleResultado = useCallback((r: SimulacionOutput, input: SimulacionInput) => {
    setResultado(r)
    setAfpActual(input.afp)
    setComparador(null)
    setMobileTab("results")
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
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="app-root">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="app-header">
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
          <div className="live-badge header-badge">
            <div className="live-dot" />
            <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--accent)", letterSpacing: "0.5px" }}>
              Datos reales 2026
            </span>
          </div>
          <a
            className="github-btn"
            href="https://github.com/ProgKap/simulador-afp"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            GitHub
          </a>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="content-area">

        {/* Hero */}
        <div className="hero">
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
            Proyección previsional con rentabilidades históricas reales, análisis probabilístico y comisiones vigentes 2026.{" "}
            <a
              href="https://github.com/ProgKap/simulador-afp"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent-mid)", textDecoration: "underline", textDecorationColor: "var(--accent-light)" }}
            >
              código en GitHub
            </a>.
          </p>
        </div>

        {/* Mobile tabs — invisible on desktop via CSS */}
        <div className="mobile-tabs">
          <button
            className={`tab-btn${mobileTab === "form" ? " tab-active" : ""}`}
            onClick={() => setMobileTab("form")}
          >
            Datos
          </button>
          <button
            className={`tab-btn${mobileTab === "results" ? " tab-active" : ""}`}
            onClick={() => setMobileTab("results")}
          >
            Resultados
            {resultado && <span className="tab-dot" />}
          </button>
        </div>

        {/* Main grid */}
        <div className="layout-grid">

          {/* ── Formulario ─────────────────────────────────── */}
          <div className={`form-panel${mobileTab !== "form" ? " mobile-hidden" : ""}`}>
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

          {/* ── Resultados ─────────────────────────────────── */}
          <div
            id="resultados"
            className={mobileTab !== "results" ? "mobile-hidden" : ""}
          >
            {resultado ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* Métricas principales */}
                <div className="metrics-grid">
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
                    sub="Percentil 25 — escenario conservador"
                  />
                  <MetricCard
                    label="Escenario optimista (p75)"
                    value={`$${resultado.pension_p75.toLocaleString("es-CL")}`}
                    sub="Percentil 75 — escenario favorable"
                  />
                </div>

                {/* Gráfico */}
                <div className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <div>
                      <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "3px" }}>Evolución del saldo</h3>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        Proyección año a año hasta los {resultado.edad_jubilacion} años · en millones de pesos
                      </p>
                    </div>
                    <button
                      onClick={handleShare}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "6px 12px", borderRadius: "var(--r-sm)",
                        border: "1px solid var(--border)", background: "var(--bg)",
                        cursor: "pointer", fontSize: "12px", color: "var(--text-muted)",
                        transition: "all 0.15s", flexShrink: 0, fontFamily: "var(--font-body)",
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

                {/* Desglose PGU */}
                <PguDesglose resultado={resultado} />

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

                {/* Comparador de AFPs */}
                {comparador ? (
                  <div className="card">
                    <ErrorBoundary>
                      <ComparativaTable filas={comparador} afpActual={afpActual} />
                    </ErrorBoundary>
                  </div>
                ) : (
                  <div className="card" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div className="spinner" />
                    <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Calculando comparativa...</span>
                  </div>
                )}

                {/* Disclaimer */}
                <p style={{ fontSize: "11px", color: "var(--text-light)", lineHeight: 1.6, textAlign: "center" }}>
                  Proyección en pesos de hoy (rentabilidades reales, descontada inflación ~3,5%) · Análisis probabilístico con 2.000 escenarios · Se aplica tope imponible DL 3.500 ·
                  No constituye asesoría financiera · Fuente: Superintendencia de Pensiones de Chile
                </p>

              </div>
            ) : (
              <EmptyState />
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
