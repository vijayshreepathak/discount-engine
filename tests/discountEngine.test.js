/**
 * Assignment sample regression tests.
 * Validates exact prices, statuses, and cart-level discount from the brief.
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { describe, it, expect } from 'vitest'
import { parseRulesCSV, parseCartCSV } from '../src/engine/csvParser.js'
import { processCart } from '../src/engine/discountEngine.js'
import { STATUS } from '../src/constants/statusLabels.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sampleDir = join(__dirname, '../sample-data')

function loadSample() {
  const rules = parseRulesCSV(readFileSync(join(sampleDir, 'rules.csv'), 'utf8')).data
  const cart = parseCartCSV(readFileSync(join(sampleDir, 'cart.csv'), 'utf8')).data
  return processCart(cart, rules)
}

describe('Assignment sample data', () => {
  const { items, cartSummary } = loadSample()
  const byId = Object.fromEntries(items.map((r) => [r.itemId, r]))

  it('ITEM-01 — max discount picks 15% over flat Rs.150', () => {
    expect(byId['ITEM-01'].finalPrice).toBe(1104)
    expect(byId['ITEM-01'].status).toBe(STATUS.MAX_DISCOUNT)
    expect(byId['ITEM-01'].reasoning).toContain('RULE-01 wins')
  })

  it('ITEM-02 — stacked flat + percentage', () => {
    expect(byId['ITEM-02'].finalPrice).toBe(629)
    expect(byId['ITEM-02'].status).toBe(STATUS.STACKED)
    expect(byId['ITEM-02'].appliedRules).toEqual(['RULE-02', 'RULE-03'])
  })

  it('ITEM-03 — single percentage discount', () => {
    expect(byId['ITEM-03'].finalPrice).toBe(509)
    expect(byId['ITEM-03'].status).toBe(STATUS.DISCOUNT_APPLIED)
  })

  it('ITEM-04 — no matching rules', () => {
    expect(byId['ITEM-04'].finalPrice).toBe(2499)
    expect(byId['ITEM-04'].status).toBe(STATUS.NO_OFFER)
  })

  it('ITEM-05 — single percentage discount', () => {
    expect(byId['ITEM-05'].finalPrice).toBe(382)
    expect(byId['ITEM-05'].status).toBe(STATUS.DISCOUNT_APPLIED)
  })

  it('ITEM-06 — single stackable rule still shows Discount applied', () => {
    expect(byId['ITEM-06'].finalPrice).toBe(809)
    expect(byId['ITEM-06'].status).toBe(STATUS.DISCOUNT_APPLIED)
    expect(byId['ITEM-06'].reasoning).toBe('RULE-03 (10% off)')
  })

  it('Cart subtotal before offer is Rs.5,932', () => {
    expect(cartSummary.subtotalBeforeOffer).toBe(5932)
  })

  it('Cart offer RULE-04 applies 10% → Rs.593 off', () => {
    expect(cartSummary.cartDiscount).toBe(593)
    expect(cartSummary.finalTotal).toBe(5339)
    expect(cartSummary.appliedCartRules).toContain('RULE-04')
  })
})

describe('Stacking edge cases', () => {
  it('when any rule is stackable, all matching rules stack (not just stackable ones)', () => {
    const item = {
      itemId: 'T-01',
      product: 'Test',
      brand: 'BrandA',
      platform: 'PlatformX',
      basePrice: 1000,
    }
    const rules = [
      { ruleId: 'R1', scope: 'brand', appliesTo: 'BrandA', type: 'flat', value: 100, stackable: false },
      { ruleId: 'R2', scope: 'platform', appliesTo: 'PlatformX', type: 'percentage', value: 10, stackable: true },
    ]
    const { items } = processCart([item], rules)
    // Flat 100 then 10% of 900 = 90 → final 810
    expect(items[0].finalPrice).toBe(810)
    expect(items[0].status).toBe(STATUS.STACKED)
  })

  it('tie on savings breaks deterministically by ruleId', () => {
    const item = {
      itemId: 'T-02',
      product: 'Test',
      brand: 'B',
      platform: 'P',
      basePrice: 1000,
    }
    const rules = [
      { ruleId: 'R-A', scope: 'brand', appliesTo: 'B', type: 'flat', value: 100, stackable: false },
      { ruleId: 'R-B', scope: 'platform', appliesTo: 'P', type: 'flat', value: 100, stackable: false },
    ]
    const { items } = processCart([item], rules)
    expect(items[0].appliedRules).toEqual(['R-A'])
    expect(items[0].status).toBe(STATUS.MAX_DISCOUNT)
  })
})

describe('Cart threshold edge cases', () => {
  it('does not apply cart discount when below threshold', () => {
    const item = { itemId: 'X', product: 'X', brand: 'B', platform: 'P', basePrice: 1000 }
    const rules = [
      { ruleId: 'C1', scope: 'cart', appliesTo: '', type: 'percentage', value: 10, minCartValue: 5000, stackable: false },
    ]
    const { cartSummary } = processCart([item], rules)
    expect(cartSummary.cartDiscount).toBe(0)
    expect(cartSummary.finalTotal).toBe(1000)
    expect(cartSummary.explanation).toContain('not applied')
  })

  it('applies cart discount when exactly at threshold', () => {
    const item = { itemId: 'X', product: 'X', brand: 'B', platform: 'P', basePrice: 4000 }
    const rules = [
      { ruleId: 'C1', scope: 'cart', appliesTo: '', type: 'percentage', value: 10, minCartValue: 4000, stackable: false },
    ]
    const { cartSummary } = processCart([item], rules)
    expect(cartSummary.cartDiscount).toBe(400)
    expect(cartSummary.finalTotal).toBe(3600)
  })
})

describe('CSV parser validation', () => {
  it('rejects duplicate rule IDs', () => {
    const csv = `rule_id,scope,applies_to,type,value,stackable
R1,brand,B,flat,10,false
R1,platform,P,flat,20,false`
    const { data, errors } = parseRulesCSV(csv)
    expect(data).toHaveLength(1)
    expect(errors.some((e) => e.includes('duplicate'))).toBe(true)
  })

  it('requires min_cart_value for cart scope', () => {
    const csv = `rule_id,scope,applies_to,type,value,stackable
R1,cart,,percentage,10,false`
    const { errors } = parseRulesCSV(csv)
    expect(errors.some((e) => e.includes('min_cart_value'))).toBe(true)
  })
})
