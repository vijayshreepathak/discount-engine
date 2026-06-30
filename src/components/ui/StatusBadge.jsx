/**
 * Status badge for discount result rows.
 * Maps exact assignment status strings to color variants.
 */

const STATUS_CLASS = {
  'Discount applied': 'status-badge--applied',
  Stacked: 'status-badge--stacked',
  'Max discount': 'status-badge--max',
  'No offer': 'status-badge--none',
}

export default function StatusBadge({ status }) {
  const cls = STATUS_CLASS[status] ?? 'status-badge--none'
  return <span className={`badge ${cls}`}>{status}</span>
}
