interface Props {
  label: string
  value: string
  sub:   string
  accent?: boolean
  gold?:   boolean
}

export function MetricCard({ label, value, sub, accent, gold }: Props) {
  const cls = ["metric-card", accent ? "is-accent" : gold ? "is-gold" : ""].filter(Boolean).join(" ")
  return (
    <div className={cls}>
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      <p className="metric-sub">{sub}</p>
    </div>
  )
}
