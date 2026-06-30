/**
 * Builds human-readable business impact copy for rule preview UI.
 * Presentation layer only — no discount calculations.
 */

/**
 * @param {import('../types/ruleSchema.js').RuleDraft} draft
 * @returns {{ summary: string, impact: string }}
 */
export function buildRuleBusinessImpact(draft) {
  const discount =
    draft.type === 'percentage'
      ? `${draft.value}% off`
      : `Rs.${draft.value} off`

  let summary
  let impact

  if (draft.scope === 'brand') {
    summary = `This rule automatically applies ${discount} to every ${draft.appliesTo} product.`
    impact = `Whenever a qualifying ${draft.appliesTo} item appears in the cart, this rule becomes eligible.${
      draft.stackable
        ? ' Because the rule is stackable, it may combine with platform or brand discounts for greater savings.'
        : ' Because it is non-stackable, the engine selects whichever single offer saves the customer the most.'
    }`
  } else if (draft.scope === 'platform') {
    summary = `This rule automatically applies ${discount} to all ${draft.appliesTo} platform items.`
    impact = `Every cart item sold on ${draft.appliesTo} will be evaluated. ${
      draft.stackable
        ? 'Stackable rules combine with other stackable offers — flat discounts first, then percentages.'
        : 'Non-stackable — compared against other matching rules; best rupee saving wins.'
    }`
  } else {
    summary = `This rule applies ${discount} to the entire cart when the order total reaches ${draft.minCartValue != null ? `Rs.${draft.minCartValue.toLocaleString('en-IN')}` : 'the threshold'}.`
    impact =
      'Cart-level offers run after all item discounts. If the post-item subtotal is below the threshold, this rule will not activate and the customer pays the item-discounted total.'
  }

  const eligibility =
    draft.scope === 'cart'
      ? `Eligible when cart subtotal ≥ Rs.${draft.minCartValue?.toLocaleString('en-IN') ?? '?'}`
      : draft.scope === 'brand'
        ? `Eligible when item brand matches "${draft.appliesTo}"`
        : `Eligible when item platform matches "${draft.appliesTo}"`

  return { summary, impact, eligibility }
}

/**
 * Computes confidence checks and score for UI display (not engine validation).
 * @param {import('../types/ruleSchema.js').RuleDraft} draft
 * @param {string[]} [validationErrors]
 * @returns {{ level: 'valid'|'warn'|'invalid', score: number, checks: { ok: boolean, text: string }[] }}
 */
export function buildConfidenceChecks(draft, validationErrors = []) {
  const checks = [
    {
      ok: validationErrors.length === 0,
      text: validationErrors.length === 0 ? 'Schema valid' : validationErrors[0],
    },
    { ok: true, text: 'Supported rule type' },
    {
      ok: ['brand', 'platform', 'cart'].includes(draft.scope),
      text: 'Valid scope',
    },
    {
      ok: draft.value > 0 && (draft.type !== 'percentage' || draft.value <= 100),
      text: 'Valid discount value',
    },
    { ok: true, text: 'Compatible with engine' },
  ]

  if (draft.scope !== 'cart' && !draft.appliesTo?.trim()) {
    checks.push({ ok: false, text: 'Qualifier required' })
  }

  const passed = checks.filter((c) => c.ok).length
  const score = Math.round((passed / checks.length) * 100)

  const level =
    validationErrors.length > 0 || checks.some((c) => !c.ok)
      ? score >= 60
        ? 'warn'
        : 'invalid'
      : 'valid'

  return { level, score, checks }
}
