/**
 * csvParser.js
 *
 * Converts raw CSV text into typed objects the discount engine expects.
 * Parsing only — no discount logic, no UI dependencies.
 *
 * Expected rules.csv columns:
 *   rule_id, scope, applies_to, type, value, stackable [, min_cart_value]
 *
 * Expected cart.csv columns:
 *   item_id, product, brand, platform, base_price
 *
 * Column aliases (assignment brief) are normalised automatically.
 */

import Papa from 'papaparse'

/** Normalises CSV header names to snake_case internal keys. */
function normaliseHeader(header) {
  return header
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/^ruleid$/, 'rule_id')
    .replace(/^itemid$/, 'item_id')
    .replace(/^qualifier$/, 'applies_to')
    .replace(/^discounttype$/, 'discount_type')
    .replace(/^discountvalue$/, 'value')
    .replace(/^baseprice$|^price$/, 'base_price')
    .replace(/^mincartvalue$|^threshold$|^condition$/, 'min_cart_value')
}

/**
 * Parses stackable field from CSV string to boolean.
 */
function parseStackable(value) {
  const s = String(value).trim().toLowerCase()
  return s === 'true' || s === '1' || s === 'yes'
}

/**
 * Parses the raw text of rules.csv into DiscountRule objects.
 * @returns {{ data: import('../types.js').DiscountRule[], errors: string[] }}
 */
export function parseRulesCSV(csvText) {
  if (!csvText || !csvText.trim()) {
    return { data: [], errors: ['Empty CSV file'] }
  }

  const { data: rows, errors: parseErrors } = Papa.parse(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: normaliseHeader,
  })

  if (parseErrors.length > 0) {
    return { data: [], errors: parseErrors.map((e) => e.message) }
  }

  const data = []
  const errors = []
  const seenIds = new Set()

  rows.forEach((row, i) => {
    const rowNum = i + 2
    const ruleId = row.rule_id?.trim()

    if (!ruleId) {
      errors.push(`Row ${rowNum}: missing field — rule_id`)
      return
    }

    if (seenIds.has(ruleId)) {
      errors.push(`Row ${rowNum}: duplicate rule_id "${ruleId}"`)
      return
    }
    seenIds.add(ruleId)

    if (!row.scope) {
      errors.push(`Row ${rowNum}: missing field — scope`)
      return
    }

    const scope = row.scope.trim().toLowerCase()
    if (scope !== 'brand' && scope !== 'platform' && scope !== 'cart') {
      errors.push(`Row ${rowNum}: scope must be "brand", "platform", or "cart", got "${row.scope}"`)
      return
    }

    const typeRaw = (row.type ?? row.discount_type ?? '').trim().toLowerCase()
    if (!typeRaw) {
      errors.push(`Row ${rowNum}: missing field — type`)
      return
    }
    if (typeRaw !== 'percentage' && typeRaw !== 'flat') {
      errors.push(`Row ${rowNum}: type must be "percentage" or "flat", got "${typeRaw}"`)
      return
    }

    const valueRaw = row.value ?? row.discount_value
    if (valueRaw === undefined || valueRaw === '') {
      errors.push(`Row ${rowNum}: missing field — value`)
      return
    }

    const value = parseFloat(valueRaw)
    if (isNaN(value) || value <= 0) {
      errors.push(`Row ${rowNum}: value must be a positive number, got "${valueRaw}"`)
      return
    }

    if (typeRaw === 'percentage' && value > 100) {
      errors.push(`Row ${rowNum}: percentage value cannot exceed 100, got "${valueRaw}"`)
      return
    }

    if (row.stackable === undefined || row.stackable === '') {
      errors.push(`Row ${rowNum}: missing field — stackable`)
      return
    }

    const stackable = parseStackable(row.stackable)

    if (scope !== 'cart' && !row.applies_to?.trim()) {
      errors.push(`Row ${rowNum}: missing field — applies_to (required for brand/platform rules)`)
      return
    }

    let minCartValue
    if (scope === 'cart') {
      const thresholdRaw = row.min_cart_value
      if (thresholdRaw === undefined || thresholdRaw === '') {
        errors.push(`Row ${rowNum}: missing field — min_cart_value (required for cart rules)`)
        return
      }
      minCartValue = parseFloat(thresholdRaw)
      if (isNaN(minCartValue) || minCartValue < 0) {
        errors.push(`Row ${rowNum}: min_cart_value must be a non-negative number, got "${thresholdRaw}"`)
        return
      }
    }

    const rule = {
      ruleId,
      scope,
      appliesTo: row.applies_to?.trim() ?? '',
      type: typeRaw,
      value,
      stackable,
    }

    if (scope === 'cart') {
      rule.minCartValue = minCartValue
    }

    data.push(rule)
  })

  return { data, errors }
}

/**
 * Maps a single parsed CSV row object to a CartItem.
 * Shared by CSV and PDF parsers to avoid duplicated mapping logic.
 * @returns {{ item: import('../types.js').CartItem | null, error: string | null }}
 */
export function mapCartRow(row, rowNum) {
  const itemId = row.item_id?.trim()
  const product = row.product?.trim()
  const brand = row.brand?.trim()
  const platform = row.platform?.trim()
  const priceRaw = row.base_price ?? row.price

  const missing = []
  if (!itemId) missing.push('item_id')
  if (!product) missing.push('product')
  if (!brand) missing.push('brand')
  if (!platform) missing.push('platform')
  if (priceRaw === undefined || priceRaw === '') missing.push('base_price')

  if (missing.length > 0) {
    return { item: null, error: `Row ${rowNum}: missing fields — ${missing.join(', ')}` }
  }

  const basePrice = parseFloat(String(priceRaw).replace(/[₹Rs.,\s]/gi, ''))
  if (isNaN(basePrice) || basePrice <= 0) {
    return { item: null, error: `Row ${rowNum}: base_price must be a positive number, got "${priceRaw}"` }
  }

  return {
    item: {
      itemId,
      product,
      brand,
      platform,
      basePrice: Math.round(basePrice),
    },
    error: null,
  }
}

/**
 * Parses cart CSV text into CartItem objects.
 * @returns {{ data: import('../types.js').CartItem[], errors: string[] }}
 */
export function parseCartCSV(csvText) {
  if (!csvText || !csvText.trim()) {
    return { data: [], errors: ['Empty CSV file'] }
  }

  const { data: rows, errors: parseErrors } = Papa.parse(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: normaliseHeader,
  })

  if (parseErrors.length > 0) {
    return { data: [], errors: parseErrors.map((e) => e.message) }
  }

  const data = []
  const errors = []

  rows.forEach((row, i) => {
    const { item, error } = mapCartRow(row, i + 2)
    if (error) {
      errors.push(error)
      return
    }
    data.push(item)
  })

  return { data, errors }
}
