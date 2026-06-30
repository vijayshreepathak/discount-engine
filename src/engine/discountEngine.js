/**
 * discountEngine.js
 *
 * Pure discount calculation logic. No UI, no side effects.
 * Operates only on typed plain objects — no knowledge of React, CSV, PDF, or LLM.
 *
 * Data shapes:
 *
 * DiscountRule {
 *   ruleId:       string
 *   scope:        "brand" | "platform" | "cart"
 *   appliesTo:    string       — platform/brand name; optional for cart rules
 *   type:         "percentage" | "flat"
 *   value:        number
 *   stackable:    boolean
 *   minCartValue: number | undefined — required when scope is "cart"
 * }
 *
 * CartItem {
 *   itemId, product, brand, platform, basePrice
 * }
 *
 * DiscountResult {
 *   itemId, product, brand, platform, basePrice, finalPrice,
 *   totalDiscount, appliedRules[], skippedRules[], reasoning, status
 * }
 *
 * CartSummary {
 *   subtotalBeforeOffer, cartDiscount, finalTotal, appliedCartRules[],
 *   explanation
 * }
 */

import { STATUS } from '../constants/statusLabels.js'
import { formatCurrency } from '../utils/formatCurrency.js'

/**
 * Returns true if the rule applies to this cart item (brand/platform scope only).
 */
export function ruleMatchesItem(item, rule) {
  if (rule.scope === 'cart') return false

  const normalise = (s) => s.trim().toLowerCase()
  if (rule.scope === 'brand') {
    return normalise(item.brand) === normalise(rule.appliesTo)
  }
  if (rule.scope === 'platform') {
    return normalise(item.platform) === normalise(rule.appliesTo)
  }
  return false
}

/**
 * Calculates the rupee discount a rule gives on a given price.
 * Uses the current price (not original base) — critical for stacked percentages.
 */
export function calculateDiscountAmount(price, rule) {
  if (rule.type === 'percentage') {
    return Math.round(price * rule.value / 100)
  }
  if (rule.type === 'flat') {
    return rule.value
  }
  return 0
}

/**
 * Applies flat discounts first, then percentage discounts sequentially.
 * Assignment stacking order: all flats → all percentages.
 */
function applyStackedRules(basePrice, rules) {
  let price = basePrice
  const flats = rules.filter((r) => r.type === 'flat')
  const percentages = rules.filter((r) => r.type === 'percentage')

  for (const rule of flats) {
    price -= calculateDiscountAmount(price, rule)
  }
  for (const rule of percentages) {
    price -= calculateDiscountAmount(price, rule)
  }

  return Math.max(0, Math.round(price))
}

/**
 * Picks the rule yielding the largest rupee saving on basePrice.
 * Tie-breaks deterministically by ruleId (lexicographic) for reproducibility.
 */
function pickMaxSavingRule(basePrice, rules) {
  const sorted = [...rules].sort((a, b) => {
    const diff =
      calculateDiscountAmount(basePrice, b) - calculateDiscountAmount(basePrice, a)
    if (diff !== 0) return diff
    return a.ruleId.localeCompare(b.ruleId)
  })
  return { winner: sorted[0], skipped: sorted.slice(1) }
}

/**
 * Builds assignment-style reasoning for a single applied rule.
 */
function singleRuleExplanation(rule) {
  if (rule.type === 'percentage') {
    return `${rule.ruleId} (${rule.value}% off)`
  }
  return `${rule.ruleId} (-${formatCurrency(rule.value)})`
}

/**
 * Builds reasoning when multiple rules are stacked.
 */
function stackedExplanation(rules) {
  return rules
    .map((rule) => {
      if (rule.type === 'flat') {
        return `${rule.ruleId} (-${formatCurrency(rule.value)})`
      }
      return `${rule.ruleId} stacked (-${rule.value}%)`
    })
    .join(' + ')
}

/**
 * Builds reasoning when the best non-stackable rule wins among several.
 */
function maxDiscountExplanation(winner, basePrice, skipped) {
  const winnerSaving = calculateDiscountAmount(basePrice, winner)
  if (skipped.length === 0) {
    return singleRuleExplanation(winner)
  }
  const runnerUp = skipped[0]
  const runnerUpSaving = calculateDiscountAmount(basePrice, runnerUp)
  return `${winner.ruleId} wins (${formatCurrency(winnerSaving)} saving > ${formatCurrency(runnerUpSaving)})`
}

/**
 * Applies item-level discount rules to a single cart item.
 *
 * Stacking rule (assignment spec):
 *   If ANY applicable rule is stackable → apply ALL applicable rules (flat then %).
 *   Otherwise → pick the single rule with maximum rupee saving.
 */
export function applyDiscounts(item, rules) {
  const itemRules = rules.filter((r) => r.scope !== 'cart')
  const matchingRules = itemRules.filter((r) => ruleMatchesItem(item, r))

  const base = {
    itemId: item.itemId,
    product: item.product,
    brand: item.brand,
    platform: item.platform,
    basePrice: item.basePrice,
  }

  if (matchingRules.length === 0) {
    return {
      ...base,
      finalPrice: item.basePrice,
      totalDiscount: 0,
      appliedRules: [],
      skippedRules: [],
      reasoning: 'No rules match',
      status: STATUS.NO_OFFER,
    }
  }

  const anyStackable = matchingRules.some((r) => r.stackable)

  if (anyStackable) {
    const finalPrice = applyStackedRules(item.basePrice, matchingRules)
    const appliedRules = matchingRules.map((r) => r.ruleId)

    if (matchingRules.length === 1) {
      return {
        ...base,
        finalPrice,
        totalDiscount: item.basePrice - finalPrice,
        appliedRules,
        skippedRules: [],
        reasoning: singleRuleExplanation(matchingRules[0]),
        status: STATUS.DISCOUNT_APPLIED,
      }
    }

    return {
      ...base,
      finalPrice,
      totalDiscount: item.basePrice - finalPrice,
      appliedRules,
      skippedRules: [],
      reasoning: stackedExplanation(matchingRules),
      status: STATUS.STACKED,
    }
  }

  if (matchingRules.length === 1) {
    const rule = matchingRules[0]
    const finalPrice = Math.max(
      0,
      Math.round(item.basePrice - calculateDiscountAmount(item.basePrice, rule))
    )
    return {
      ...base,
      finalPrice,
      totalDiscount: item.basePrice - finalPrice,
      appliedRules: [rule.ruleId],
      skippedRules: [],
      reasoning: singleRuleExplanation(rule),
      status: STATUS.DISCOUNT_APPLIED,
    }
  }

  const { winner, skipped } = pickMaxSavingRule(item.basePrice, matchingRules)
  const finalPrice = Math.max(
    0,
    Math.round(item.basePrice - calculateDiscountAmount(item.basePrice, winner))
  )

  return {
    ...base,
    finalPrice,
    totalDiscount: item.basePrice - finalPrice,
    appliedRules: [winner.ruleId],
    skippedRules: skipped.map((r) => r.ruleId),
    reasoning: maxDiscountExplanation(winner, item.basePrice, skipped),
    status: STATUS.MAX_DISCOUNT,
  }
}

/**
 * Evaluates cart-level rules against the post-item-discount subtotal.
 * Returns cart offer details including threshold messaging.
 */
export function applyCartDiscount(subtotal, cartRules) {
  if (!cartRules.length) {
    return {
      subtotalBeforeOffer: subtotal,
      cartDiscount: 0,
      finalTotal: subtotal,
      appliedCartRules: [],
      explanation: null,
    }
  }

  const eligible = cartRules.filter((r) => subtotal >= (r.minCartValue ?? 0))
  const ineligible = cartRules.filter((r) => subtotal < (r.minCartValue ?? 0))

  if (eligible.length === 0) {
    const below = ineligible[0]
    return {
      subtotalBeforeOffer: subtotal,
      cartDiscount: 0,
      finalTotal: subtotal,
      appliedCartRules: [],
      explanation: below
        ? `Cart total ${formatCurrency(subtotal)} (< ${formatCurrency(below.minCartValue)}), so cart discount ${below.ruleId} not applied.`
        : null,
    }
  }

  const anyStackable = eligible.some((r) => r.stackable)

  let cartDiscount = 0
  let appliedCartRules = []
  let explanationParts = []

  if (anyStackable) {
    let price = subtotal
    const flats = eligible.filter((r) => r.type === 'flat')
    const percentages = eligible.filter((r) => r.type === 'percentage')
    for (const rule of [...flats, ...percentages]) {
      const amount = calculateDiscountAmount(price, rule)
      price -= amount
      cartDiscount += amount
      appliedCartRules.push(rule.ruleId)
      if (rule.type === 'percentage') {
        explanationParts.push(
          `${rule.ruleId} (${rule.value}% off entire cart)`
        )
      } else {
        explanationParts.push(`${rule.ruleId} (-${formatCurrency(rule.value)})`)
      }
    }
  } else if (eligible.length === 1) {
    const rule = eligible[0]
    cartDiscount = calculateDiscountAmount(subtotal, rule)
    appliedCartRules = [rule.ruleId]
    explanationParts.push(
      `${rule.ruleId} applies (${formatCurrency(subtotal)} ≥ ${formatCurrency(rule.minCartValue)} → ${rule.value}% off) → -${formatCurrency(cartDiscount)}`
    )
  } else {
    const { winner, skipped } = pickMaxSavingRule(subtotal, eligible)
    cartDiscount = calculateDiscountAmount(subtotal, winner)
    appliedCartRules = [winner.ruleId]
    explanationParts.push(
      `${winner.ruleId} wins (${formatCurrency(calculateDiscountAmount(subtotal, winner))} saving > ${formatCurrency(calculateDiscountAmount(subtotal, skipped[0]))})`
    )
  }

  const finalTotal = Math.max(0, Math.round(subtotal - cartDiscount))

  return {
    subtotalBeforeOffer: subtotal,
    cartDiscount,
    finalTotal,
    appliedCartRules,
    explanation: explanationParts.length
      ? `Cart Offer — ${explanationParts.join('; ')}`
      : null,
  }
}

/**
 * Processes the full cart: item-level discounts then cart-level offers.
 * @returns {{ items: DiscountResult[], cartSummary: CartSummary }}
 */
export function processCart(cartItems, rules) {
  const itemRules = rules.filter((r) => r.scope !== 'cart')
  const cartRules = rules.filter((r) => r.scope === 'cart')

  const items = cartItems.map((item) => applyDiscounts(item, itemRules))
  const subtotal = items.reduce((sum, r) => sum + r.finalPrice, 0)
  const cartSummary = applyCartDiscount(subtotal, cartRules)

  return { items, cartSummary }
}

/**
 * Sums final prices across item results (pre-cart-offer subtotal).
 */
export function cartTotal(results) {
  const items = Array.isArray(results) ? results : results.items ?? []
  return items.reduce((sum, r) => sum + r.finalPrice, 0)
}
