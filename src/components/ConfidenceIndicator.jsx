/**
 * Confidence panel with overall score and validation checklist.
 */

const LEVEL_LABEL = {
  valid: { label: 'Validated', className: 'confidence--valid', badge: 'badge--success' },
  warn: { label: 'Needs Clarification', className: 'confidence--warn', badge: 'badge--warning' },
  invalid: { label: 'Rejected', className: 'confidence--invalid', badge: 'badge--danger' },
}

export default function ConfidenceIndicator({ level, score = 0, checks, compact = false }) {
  const meta = LEVEL_LABEL[level] ?? LEVEL_LABEL.invalid

  return (
    <div className={`confidence ${meta.className}`}>
      <div className="confidence__header">
        <div>
          <span className="confidence__title">Overall Confidence</span>
          <span className={`badge ${meta.badge}`}>{meta.label}</span>
        </div>
        <div className="confidence__score" aria-label={`Confidence score ${score} percent`}>
          {score}%
        </div>
      </div>
      <div className="confidence__bar" role="presentation">
        <div className="confidence__bar-fill" style={{ width: `${score}%` }} />
      </div>
      {!compact && (
        <ul className="confidence__list">
          {checks.map((check, i) => (
            <li key={i} className={`confidence__item${check.ok ? ' confidence__item--ok' : ' confidence__item--fail'}`}>
              <span className="confidence__icon" aria-hidden>{check.ok ? '✓' : '✗'}</span>
              <span>{check.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
