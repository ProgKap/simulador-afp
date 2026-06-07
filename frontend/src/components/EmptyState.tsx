export function EmptyState() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "clamp(160px, 30vw, 400px)",
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
