/**
 * KPI card with icon and animated counter.
 */

import { useAnimatedNumber } from '../../hooks/useAnimatedNumber.js'

const ICONS = {
  items: '📦',
  rules: '⚡',
  stacked: '🔗',
  savings: '💰',
  percent: '📊',
  final: '✨',
}

export default function KpiCard({ label, value, prefix = '', suffix = '', accent = false, green = false, icon = 'items' }) {
  const animated = useAnimatedNumber(typeof value === 'number' ? value : 0)

  return (
    <div className="kpi">
      <div className="kpi__top">
        <span className="kpi__icon" aria-hidden>{ICONS[icon] ?? '📊'}</span>
        <span className="kpi__label">{label}</span>
      </div>
      <div className={`kpi__value${accent ? ' kpi__value--accent' : ''}${green ? ' kpi__value--green' : ''}`}>
        {prefix}
        {typeof value === 'number' ? animated.toLocaleString('en-IN') : value}
        {suffix}
      </div>
    </div>
  )
}
