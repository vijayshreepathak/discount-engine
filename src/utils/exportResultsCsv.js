/**
 * Exports discount results to CSV for download (presentation utility).
 * Does not modify or recalculate — formats existing result data only.
 */

/**
 * Escapes a CSV field value.
 * @param {string | number} value
 */
function csvCell(value) {
  const str = String(value ?? '')
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * @param {{ items: object[], cartSummary: object }} results
 * @returns {string} CSV content
 */
export function buildResultsCsv(results) {
  const exportedAt = new Date().toISOString()
  const itemHeaders = [
    'itemId',
    'product',
    'brand',
    'platform',
    'basePrice',
    'finalPrice',
    'savings',
    'appliedRules',
    'status',
    'explanation',
  ]

  const itemRows = results.items.map((r) => [
    r.itemId,
    r.product,
    r.brand,
    r.platform,
    r.basePrice,
    r.finalPrice,
    r.totalDiscount,
    r.appliedRules.join(' + ') || '—',
    r.status,
    r.reasoning,
  ])

  const lines = [
    'section,field,value',
    `meta,exported_at,${exportedAt}`,
    '',
    itemHeaders.join(','),
    ...itemRows.map((row) => row.map(csvCell).join(',')),
    '',
    'section,metric,amount_inr',
    `summary,cart_subtotal,${results.cartSummary.subtotalBeforeOffer}`,
    `summary,cart_offer,${results.cartSummary.cartDiscount}`,
    `summary,final_total,${results.cartSummary.finalTotal}`,
    `summary,cart_rules,"${results.cartSummary.appliedCartRules.join(' + ') || '—'}"`,
  ]

  if (results.cartSummary.explanation) {
    lines.push(`summary,cart_explanation,${csvCell(results.cartSummary.explanation)}`)
  }

  return lines.join('\n')
}

/**
 * Triggers browser download of results CSV.
 * @param {{ items: object[], cartSummary: object }} results
 */
export function downloadResultsCsv(results) {
  const csv = buildResultsCsv(results)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `opptra-discount-results-${Date.now()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
