/**
 * Generates sequential rule IDs locally — never trusts AI-assigned IDs.
 * Format: RULE-001, RULE-002, …
 */

const ID_PATTERN = /^RULE-(\d+)$/i

/**
 * Extracts the numeric suffix from a rule ID, if it matches RULE-NNN.
 * @param {string} ruleId
 * @returns {number|null}
 */
function parseRuleNumber(ruleId) {
  const match = String(ruleId).trim().match(ID_PATTERN)
  return match ? parseInt(match[1], 10) : null
}

/**
 * Returns the next available rule ID given existing rules.
 * Scans all RULE-NNN IDs and increments the highest found.
 * @param {import('../types.js').DiscountRule[]} existingRules
 * @returns {string}
 */
export function generateRuleId(existingRules = []) {
  let max = 0

  for (const rule of existingRules) {
    const num = parseRuleNumber(rule.ruleId)
    if (num != null && num > max) max = num
  }

  return `RULE-${String(max + 1).padStart(3, '0')}`
}
