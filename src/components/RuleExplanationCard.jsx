/**
 * Rich rule explanation card with business summary and eligibility.
 */

import { buildRuleBusinessImpact } from '../utils/buildRuleBusinessImpact.js'
import { formatCurrency } from '../utils/formatCurrency.js'

export default function RuleExplanationCard({ draft, compact = false }) {
  const { summary, impact, eligibility } = buildRuleBusinessImpact(draft)

  const discountHighlight =
    draft.type === 'percentage'
      ? `${draft.value}% off`
      : `${formatCurrency(draft.value)} off`

  return (
    <div className="rule-explanation">
      <h3 className="rule-explanation__title">Rule Explanation</h3>

      <p className="rule-explanation__highlight">
        This rule automatically applies{' '}
        <strong className="rule-explanation__discount">{discountHighlight}</strong>
        {draft.scope === 'cart' ? ' to the entire cart.' : ` to ${draft.appliesTo} products.`}
      </p>

      <p className="rule-explanation__body">{summary}</p>

      {!compact && (
        <>
          <div className="rule-explanation__grid">
            <div className="rule-explanation__meta">
              <span className="rule-explanation__meta-label">Scope</span>
              <span className="badge badge--neutral">{draft.scope}</span>
            </div>
            <div className="rule-explanation__meta">
              <span className="rule-explanation__meta-label">Eligibility</span>
              <span className="rule-explanation__meta-value">{eligibility}</span>
            </div>
            <div className="rule-explanation__meta">
              <span className="rule-explanation__meta-label">Stackable</span>
              <span className={`badge ${draft.stackable ? 'badge--success' : 'badge--neutral'}`}>
                {draft.stackable ? 'Yes' : 'No'}
              </span>
            </div>
          </div>

          <p className="rule-explanation__impact">
            <strong>Estimated behaviour:</strong> {impact}
          </p>
        </>
      )}
    </div>
  )
}
