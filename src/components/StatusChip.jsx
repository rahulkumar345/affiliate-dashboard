export default function StatusChip({ status }) {
  return <span className={`chip ${status}`}>{status}</span>;
}
