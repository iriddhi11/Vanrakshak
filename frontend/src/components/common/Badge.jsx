const TONES = {
  High: 'high', Medium: 'medium', Low: 'low',
  Open: 'warn', Reviewed: 'ok', Dismissed: 'neutral', Escalated: 'danger',
  Pending: 'medium', 'Under Review': 'info', Verified: 'ok', Closed: 'neutral',
  Active: 'ok', Processing: 'info', Archived: 'neutral', Testing: 'warn', Retired: 'neutral',
  Planned: 'info', 'In Progress': 'warn', Completed: 'ok',
  Healthy: 'ok', Moderate: 'warn', Stressed: 'danger', Inactive: 'neutral', Maintenance: 'warn',
};

export default function Badge({ value, tone }) {
  if (!value) return null;
  return <span className={`badge badge-${tone || TONES[value] || 'neutral'}`}>{value}</span>;
}
