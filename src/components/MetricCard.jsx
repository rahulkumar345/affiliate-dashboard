export default function MetricCard({ label, value, hint = null, hintUp = false }) {
  return (
    <div className="card metric">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {hint ? <div className={`hint${hintUp ? ' up' : ''}`}>{hint}</div> : null}
    </div>
  );
}
