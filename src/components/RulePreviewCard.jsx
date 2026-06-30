/**
 * Premium rule preview with scope/type chips.
 */

import { formatCurrency } from '../utils/formatCurrency.js'
import { buildRuleExplanation } from '../validators/ruleValidator.js'

const SCOPE_LABELS = { brand: 'Brand', platform: 'Platform', cart: 'Cart' }

export default function RulePreviewCard({ draft, ruleId }) {
  const discountLabel =
    draft.type === 'percentage' ? `${draft.value}%` : formatCurrency(draft.value)

  return (
    <div className="preview-card preview-card--elevated">
      <div className="preview-card__eyebrow">Rule Preview</div>

      <div className="preview-card__chips">
        <span className="badge badge--neutral">{SCOPE_LABELS[draft.scope]}</span>
        <span className={`badge ${draft.type === 'percentage' ? 'badge--info' : 'badge--purple'}`}>
          {draft.type === 'percentage' ? 'Percentage' : 'Flat'}
        </span>
        <span className="badge badge--orange">{discountLabel} off</span>
        {draft.scope !== 'cart' && (
          <span className="badge badge--neutral">{draft.appliesTo}</span>
        )}
        {draft.scope === 'cart' && draft.minCartValue != null && (
          <span className="badge badge--warning">≥ {formatCurrency(draft.minCartValue)}</span>
        )}
        <span className={`badge ${draft.stackable ? 'badge--success' : 'badge--neutral'}`}>
          Stackable: {draft.stackable ? 'Yes' : 'No'}
        </span>
        {ruleId && <span className="badge badge--info">{ruleId}</span>}
      </div>

      <p className="preview-card__summary">{buildRuleExplanation(draft)}</p>
    </div>
  )
}
