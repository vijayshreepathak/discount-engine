/**
 * Exports rules array to CSV for download (presentation utility).
 */

/**
 * @param {import('../types.js').DiscountRule[]} rules
 * @returns {string}
 */
export function buildRulesCsv(rules) {
  const headers = ['rule_id', 'scope', 'applies_to', 'type', 'value', 'min_cart_value', 'stackable']
  const rows = rules.map((r) => [
    r.ruleId,
    r.scope,
    r.appliesTo ?? '',
    r.type,
    r.value,
    r.minCartValue ?? '',
    r.stackable,
  ])
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

/**
 * @param {import('../types.js').DiscountRule[]} rules
 */
export function downloadRulesCsv(rules) {
  const csv = buildRulesCsv(rules)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `opptra-rules-${Date.now()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
