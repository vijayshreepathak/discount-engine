/**
 * Visual savings breakdown: Base → Savings → Final with progress bar.
 * Presentation only — uses pre-calculated result values.
 */

import { formatCurrency } from '../utils/formatCurrency.js'

export default function SavingsBreakdown({ baseTotal, totalSavings, finalTotal }) {
  const pct = baseTotal > 0 ? Math.min(100, (totalSavings / baseTotal) * 100) : 0

  return (
    <div className="savings-viz" aria-label="Savings breakdown">
      <div className="savings-viz__flow">
        <div className="savings-viz__step">
          <span className="savings-viz__label">Base Total</span>
          <span className="savings-viz__amount">{formatCurrency(baseTotal)}</span>
        </div>
        <div className="savings-viz__arrow" aria-hidden>↓</div>
        <div className="savings-viz__step savings-viz__step--savings">
          <span className="savings-viz__label">Total Savings</span>
          <span className="savings-viz__amount savings-viz__amount--green">
            -{formatCurrency(totalSavings)}
          </span>
        </div>
        <div className="savings-viz__arrow" aria-hidden>↓</div>
        <div className="savings-viz__step savings-viz__step--final">
          <span className="savings-viz__label">Final Total</span>
          <span className="savings-viz__amount savings-viz__amount--accent">
            {formatCurrency(finalTotal)}
          </span>
        </div>
      </div>

      <div className="savings-viz__bar-wrap">
        <div className="savings-viz__bar-labels">
          <span>You saved {pct.toFixed(1)}%</span>
          <span>{formatCurrency(totalSavings)} off</span>
        </div>
        <div className="savings-viz__bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="savings-viz__bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}
