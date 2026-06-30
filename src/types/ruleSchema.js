/**
 * Schema definitions for LLM rule-parsing responses.
 * The LLM speaks this dialect; validators map it to engine DiscountRule objects.
 */

/** @typedef {'Brand' | 'Platform' | 'Cart'} LlmScopeLabel */
/** @typedef {'Flat' | 'Percentage'} LlmDiscountTypeLabel */

/**
 * @typedef {Object} LlmAmbiguity
 * @property {string} message - User-facing clarification question
 * @property {string[]} [options] - Suggested interpretations
 */

/**
 * Raw JSON shape returned by the LLM (before engine normalisation).
 * @typedef {Object} LlmRuleResponse
 * @property {string} [scope] - Brand | Platform | Cart
 * @property {string} [qualifier] - Brand/platform name or "Entire cart"
 * @property {string} [discountType] - Flat | Percentage
 * @property {number} [discountValue]
 * @property {number|null} [minCartValue]
 * @property {boolean} [stackable]
 * @property {string} [error] - Set when rule type is unsupported
 * @property {LlmAmbiguity} [ambiguity] - Set when wording is ambiguous
 */

/**
 * Editable draft shown in the confirmation dialog (pre-engine mapping).
 * @typedef {Object} RuleDraft
 * @property {import('../types.js').RuleScope} scope
 * @property {string} appliesTo
 * @property {import('../types.js').DiscountType} type
 * @property {number} value
 * @property {boolean} stackable
 * @property {number|null} minCartValue
 */

const SCOPE_MAP = {
  brand: 'brand',
  platform: 'platform',
  cart: 'cart',
}

const TYPE_MAP = {
  flat: 'flat',
  percentage: 'percentage',
}

/**
 * Normalises LLM scope strings to engine scope values.
 * @param {string} raw
 * @returns {import('../types.js').RuleScope | null}
 */
export function normalizeScope(raw) {
  if (!raw) return null
  return SCOPE_MAP[String(raw).trim().toLowerCase()] ?? null
}

/**
 * Normalises LLM discount type strings to engine type values.
 * @param {string} raw
 * @returns {import('../types.js').DiscountType | null}
 */
export function normalizeDiscountType(raw) {
  if (!raw) return null
  const key = String(raw).trim().toLowerCase()
  return TYPE_MAP[key] ?? null
}

/**
 * Parses stackable from LLM output (boolean or yes/no string).
 * @param {unknown} raw
 * @returns {boolean}
 */
export function normalizeStackable(raw) {
  if (typeof raw === 'boolean') return raw
  const s = String(raw ?? 'false').trim().toLowerCase()
  return s === 'true' || s === 'yes' || s === '1'
}

export { SCOPE_MAP, TYPE_MAP }
