export default function StatCard({ title, value, desc, color = 'teal', valueStyle = {} }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-title">{title}</div>
      <div className="stat-value" style={valueStyle}>{value}</div>
      <div className="stat-desc">{desc}</div>
    </div>
  )
}
