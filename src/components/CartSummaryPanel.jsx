/**
 * Cart summary panel — professional order breakdown aligned with assignment output.
 */

import { useState } from 'react'
import { formatCurrency } from '../utils/formatCurrency.js'

export default function CartSummaryPanel({
  cartSummary,
  itemSavings,
  rulesAppliedCount,
  itemCount,
  baseTotal,
}) {
  const [collapsed, setCollapsed] = useState(false)

  const totalSavings = itemSavings + cartSummary.cartDiscount
  const subtotal = cartSummary.subtotalBeforeOffer
  const pctSaved = baseTotal > 0 ? ((totalSavings / baseTotal) * 100).toFixed(1) : '0'

  return (
    <div className="summary" aria-labelledby="order-summary-heading">
      <div className="summary__header">
        <h3 id="order-summary-heading" className="summary__title">Order Summary</h3>
        <button
          type="button"
          className="collapsible__toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-controls="order-summary-details"
        >
          {collapsed ? 'Show details' : 'Hide details'}
        </button>
      </div>

      {!collapsed && (
        <div id="order-summary-details" className="summary__body">
          <div className="summary__row">
            <span>Items</span>
            <span>{itemCount}</span>
          </div>
          <div className="summary__row">
            <span>Rules applied</span>
            <span>{rulesAppliedCount}</span>
          </div>
          {baseTotal > subtotal && (
            <div className="summary__row">
              <span>Original cart value</span>
              <span>{formatCurrency(baseTotal)}</span>
            </div>
          )}
          <div className="summary__row summary__row--emphasis">
            <span>Cart total before offer</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {itemSavings > 0 && (
            <div className="summary__row summary__row--savings">
              <span>Item savings</span>
              <span>−{formatCurrency(itemSavings)}</span>
            </div>
          )}
          {cartSummary.cartDiscount > 0 && (
            <div className="summary__row summary__row--savings">
              <span>
                Cart offer
                {cartSummary.appliedCartRules.length > 0 && (
                  <span className="summary__rule-ids"> ({cartSummary.appliedCartRules.join(', ')})</span>
                )}
              </span>
              <span>−{formatCurrency(cartSummary.cartDiscount)}</span>
            </div>
          )}
          <div className="summary__row summary__row--savings">
            <span>Total savings ({pctSaved}%)</span>
            <span>−{formatCurrency(totalSavings)}</span>
          </div>
          {cartSummary.explanation && (
            <p className="summary__note">{cartSummary.explanation}</p>
          )}
        </div>
      )}

      <div className="summary__final">
        <span className="summary__final-label">Final Cart Total</span>
        <span className="summary__final-amount">{formatCurrency(cartSummary.finalTotal)}</span>
      </div>
    </div>
  )
}
