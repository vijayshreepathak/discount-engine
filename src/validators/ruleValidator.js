/**
 * Validates LLM-parsed rule drafts before they enter the discount engine.
 * Pure validation — no React, no API calls, no discount calculations.
 */

import {
  normalizeScope,
  normalizeDiscountType,
  normalizeStackable,
} from '../types/ruleSchema.js'

/**
 * @typedef {import('../types/ruleSchema.js').RuleDraft} RuleDraft
 * @typedef {import('../types.js').DiscountRule} DiscountRule
 */

/**
 * Maps a validated draft to the engine's DiscountRule shape.
 * @param {RuleDraft} draft
 * @param {string} ruleId - Locally generated ID
 * @returns {DiscountRule}
 */
export function draftToDiscountRule(draft, ruleId) {
  /** @type {DiscountRule} */
  const rule = {
    ruleId,
    scope: draft.scope,
    appliesTo: draft.appliesTo,
    type: draft.type,
    value: draft.value,
    stackable: draft.stackable,
  }

  if (draft.scope === 'cart' && draft.minCartValue != null) {
    rule.minCartValue = draft.minCartValue
  }

  return rule
}

/**
 * Builds a human-readable explanation for the confirmation preview.
 * @param {RuleDraft} draft
 * @returns {string}
 */
export function buildRuleExplanation(draft) {
  const discount =
    draft.type === 'percentage'
      ? `${draft.value}% off`
      : `${draft.value} rupees off`

  if (draft.scope === 'cart') {
    return `Apply ${discount} to the entire cart when total ≥ Rs.${draft.minCartValue?.toLocaleString('en-IN') ?? '?'}.`
  }

  const target = draft.scope === 'brand' ? `brand "${draft.appliesTo}"` : `platform "${draft.appliesTo}"`
  const stackNote = draft.stackable ? ' Can stack with other offers.' : ' Does not stack.'
  return `Apply ${discount} to all items on ${target}.${stackNote}`
}

/**
 * Checks whether two rules are functionally identical (duplicate definition).
 * @param {RuleDraft|DiscountRule} a
 * @param {RuleDraft|DiscountRule} b
 * @returns {boolean}
 */
export function isDuplicateDefinition(a, b) {
  const scopeA = a.scope
  const scopeB = b.scope
  const appliesA = (a.appliesTo ?? '').trim().toLowerCase()
  const appliesB = (b.appliesTo ?? '').trim().toLowerCase()
  const typeA = a.type
  const typeB = b.type
  const minA = a.minCartValue ?? null
  const minB = b.minCartValue ?? null

  return (
    scopeA === scopeB &&
    appliesA === appliesB &&
    typeA === typeB &&
    a.value === b.value &&
    minA === minB &&
    !!a.stackable === !!b.stackable
  )
}

/**
 * Maps raw LLM JSON to a RuleDraft (schema-level, not business duplicate check).
 * @param {import('../types/ruleSchema.js').LlmRuleResponse} raw
 * @returns {{ ok: true, draft: RuleDraft } | { ok: false, errors: string[] }}
 */
export function mapLlmResponseToDraft(raw) {
  const errors = []

  const scope = normalizeScope(raw.scope)
  if (!scope) errors.push('Scope must be Brand, Platform, or Cart.')

  const type = normalizeDiscountType(raw.discountType)
  if (!type) errors.push('Discount type must be Flat or Percentage.')

  const value = Number(raw.discountValue)
  if (raw.discountValue == null || isNaN(value) || value <= 0) {
    errors.push('Discount value must be a positive number.')
  } else if (type === 'percentage' && value > 100) {
    errors.push('Percentage discount cannot exceed 100%.')
  }

  let appliesTo = raw.qualifier != null ? String(raw.qualifier).trim() : ''
  let minCartValue = null

  if (scope === 'cart') {
    appliesTo = appliesTo || 'Entire cart'
    const min = Number(raw.minCartValue)
    if (raw.minCartValue == null || isNaN(min) || min < 0) {
      errors.push('Cart rules require a minimum cart value (minCartValue).')
    } else {
      minCartValue = min
    }
  } else if (scope === 'brand' || scope === 'platform') {
    if (!appliesTo) {
      errors.push(`A ${scope} name (qualifier) is required.`)
    }
  }

  if (errors.length > 0) return { ok: false, errors }

  return {
    ok: true,
    draft: {
      scope,
      appliesTo,
      type,
      value,
      stackable: normalizeStackable(raw.stackable),
      minCartValue,
    },
  }
}

/**
 * Validates a user-edited draft before saving to the engine.
 * @param {RuleDraft} draft
 * @param {DiscountRule[]} existingRules
 * @param {string} [pendingRuleId] - ID being assigned (for duplicate-id check on edit)
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateRuleDraft(draft, existingRules = [], pendingRuleId = '') {
  const errors = []

  if (!draft.scope || !['brand', 'platform', 'cart'].includes(draft.scope)) {
    errors.push('Please select a valid scope (Brand, Platform, or Cart).')
  }

  if (!draft.type || !['flat', 'percentage'].includes(draft.type)) {
    errors.push('Please select Flat or Percentage discount type.')
  }

  const value = Number(draft.value)
  if (isNaN(value) || value <= 0) {
    errors.push('Discount value must be a positive number.')
  } else if (draft.type === 'percentage' && value > 100) {
    errors.push('Percentage cannot exceed 100%.')
  }

  if (draft.scope === 'cart') {
    const min = Number(draft.minCartValue)
    if (draft.minCartValue == null || isNaN(min) || min < 0) {
      errors.push('Cart rules require a minimum cart threshold.')
    }
  } else if (!draft.appliesTo?.trim()) {
    errors.push(`${draft.scope === 'brand' ? 'Brand' : 'Platform'} name is required.`)
  }

  for (const existing of existingRules) {
    if (pendingRuleId && existing.ruleId === pendingRuleId) continue
    if (isDuplicateDefinition(draft, existing)) {
      errors.push(`This rule duplicates existing rule ${existing.ruleId}.`)
      break
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validates raw LLM response including error/ambiguity handling.
 * @param {object} raw
 * @returns {{ status: 'error', message: string } | { status: 'ambiguity', message: string, options: string[] } | { status: 'ok', draft: RuleDraft }}
 */
export function validateLlmResponse(raw) {
  if (raw.error) {
    return { status: 'error', message: String(raw.error) }
  }

  if (raw.ambiguity?.message) {
    return {
      status: 'ambiguity',
      message: raw.ambiguity.message,
      options: Array.isArray(raw.ambiguity.options) ? raw.ambiguity.options : [],
    }
  }

  const mapped = mapLlmResponseToDraft(raw)
  if (!mapped.ok) {
    return { status: 'error', message: mapped.errors.join(' ') }
  }

  return { status: 'ok', draft: mapped.draft }
}
