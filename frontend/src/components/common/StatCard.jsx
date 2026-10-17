export default function StatCard({ icon: Icon, value, label, tone = '' }) {
  return (
    <div className={`card stat-card ${tone ? `tone-${tone}` : ''}`}>
      <div className="stat-icon" aria-hidden="true">{Icon && <Icon size={22} />}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
