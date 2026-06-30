/**
 * Shared type definitions (JSDoc) for the discount engine domain.
 * Used across parsers, engine, and services for consistent contracts.
 */

/**
 * @typedef {'brand' | 'platform' | 'cart'} RuleScope
 */

/**
 * @typedef {'percentage' | 'flat'} DiscountType
 */

/**
 * @typedef {Object} DiscountRule
 * @property {string} ruleId
 * @property {RuleScope} scope
 * @property {string} appliesTo
 * @property {DiscountType} type
 * @property {number} value
 * @property {boolean} stackable
 * @property {number} [minCartValue] - Required when scope is "cart"
 */

/**
 * @typedef {Object} CartItem
 * @property {string} itemId
 * @property {string} product
 * @property {string} brand
 * @property {string} platform
 * @property {number} basePrice
 */

/**
 * @typedef {Object} DiscountResult
 * @property {string} itemId
 * @property {string} product
 * @property {string} brand
 * @property {string} platform
 * @property {number} basePrice
 * @property {number} finalPrice
 * @property {number} totalDiscount
 * @property {string[]} appliedRules
 * @property {string[]} skippedRules
 * @property {string} reasoning
 * @property {string} status
 */

/**
 * @typedef {Object} CartSummary
 * @property {number} subtotalBeforeOffer
 * @property {number} cartDiscount
 * @property {number} finalTotal
 * @property {string[]} appliedCartRules
 * @property {string|null} explanation
 */

/**
 * @typedef {Object} ProcessCartResult
 * @property {DiscountResult[]} items
 * @property {CartSummary} cartSummary
 */

export {}
