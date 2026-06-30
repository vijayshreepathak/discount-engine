/**
 * Error alert with actionable guidance.
 */

const HINTS = {
  missing: 'Ensure all required columns are present in your CSV header row.',
  duplicate: 'Each rule_id must be unique. Remove or rename duplicate entries.',
  value: 'Check that numeric fields contain positive numbers without currency symbols.',
  scope: 'Scope must be brand, platform, or cart.',
}

function suggestFix(error) {
  const lower = error.toLowerCase()
  if (lower.includes('missing')) return HINTS.missing
  if (lower.includes('duplicate')) return HINTS.duplicate
  if (lower.includes('value') || lower.includes('number')) return HINTS.value
  if (lower.includes('scope')) return HINTS.scope
  return 'Review the row mentioned above and re-upload the corrected file.'
}

export default function ErrorBanner({ errors, title, onRetry }) {
  if (!errors?.length) return null

  return (
    <div className="alert alert--error" role="alert">
      <div className="alert__title">
        {title ?? `${errors.length} issue${errors.length > 1 ? 's' : ''} found`}
      </div>
      {errors.map((e, i) => (
        <div key={i} className="alert__row">
          <div>{e}</div>
          <div className="alert__hint">{suggestFix(e)}</div>
        </div>
      ))}
      {onRetry && (
        <button type="button" className="btn btn--ghost btn--sm" style={{ marginTop: 8 }} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
