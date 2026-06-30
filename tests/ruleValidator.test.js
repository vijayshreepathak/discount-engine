/**
 * Tests for rule validation and duplicate detection.
 */

import { describe, it, expect } from 'vitest'
import {
  mapLlmResponseToDraft,
  validateRuleDraft,
  validateLlmResponse,
  isDuplicateDefinition,
  draftToDiscountRule,
  buildRuleExplanation,
} from '../src/validators/ruleValidator.js'

describe('mapLlmResponseToDraft', () => {
  it('maps a valid brand percentage rule', () => {
    const result = mapLlmResponseToDraft({
      scope: 'Brand',
      qualifier: 'Natura Casa',
      discountType: 'Percentage',
      discountValue: 20,
      minCartValue: null,
      stackable: false,
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.draft.scope).toBe('brand')
      expect(result.draft.type).toBe('percentage')
      expect(result.draft.value).toBe(20)
    }
  })

  it('requires minCartValue for cart scope', () => {
    const result = mapLlmResponseToDraft({
      scope: 'Cart',
      qualifier: 'Entire cart',
      discountType: 'Percentage',
      discountValue: 10,
      stackable: false,
    })
    expect(result.ok).toBe(false)
  })

  it('rejects percentage over 100', () => {
    const result = mapLlmResponseToDraft({
      scope: 'Brand',
      qualifier: 'X',
      discountType: 'Percentage',
      discountValue: 150,
      stackable: false,
    })
    expect(result.ok).toBe(false)
  })
})

describe('validateLlmResponse', () => {
  it('returns error for unsupported BOGO', () => {
    const result = validateLlmResponse({ error: 'BOGO not supported' })
    expect(result.status).toBe('error')
  })

  it('returns ambiguity for unclear wording', () => {
    const result = validateLlmResponse({
      ambiguity: { message: 'Rs.20 or 20%?', options: ['Rs.20', '20%'] },
    })
    expect(result.status).toBe('ambiguity')
    expect(result.options).toHaveLength(2)
  })
})

describe('validateRuleDraft', () => {
  const existing = [
    { ruleId: 'RULE-001', scope: 'brand', appliesTo: 'Natura Casa', type: 'flat', value: 150, stackable: false },
  ]

  it('detects duplicate rule definitions', () => {
    const draft = { scope: 'brand', appliesTo: 'Natura Casa', type: 'flat', value: 150, stackable: false, minCartValue: null }
    const { valid, errors } = validateRuleDraft(draft, existing)
    expect(valid).toBe(false)
    expect(errors.some((e) => e.includes('duplicate'))).toBe(true)
  })

  it('passes a unique rule', () => {
    const draft = { scope: 'platform', appliesTo: 'Flipkart', type: 'percentage', value: 10, stackable: true, minCartValue: null }
    const { valid } = validateRuleDraft(draft, existing)
    expect(valid).toBe(true)
  })
})

describe('isDuplicateDefinition', () => {
  it('matches functionally identical rules', () => {
    const a = { scope: 'brand', appliesTo: 'X', type: 'flat', value: 100, stackable: false, minCartValue: null }
    const b = { scope: 'brand', appliesTo: 'x', type: 'flat', value: 100, stackable: false, minCartValue: null }
    expect(isDuplicateDefinition(a, b)).toBe(true)
  })
})

describe('draftToDiscountRule', () => {
  it('maps draft to engine DiscountRule shape', () => {
    const rule = draftToDiscountRule(
      { scope: 'cart', appliesTo: 'Entire cart', type: 'percentage', value: 10, stackable: false, minCartValue: 5000 },
      'RULE-005'
    )
    expect(rule.ruleId).toBe('RULE-005')
    expect(rule.minCartValue).toBe(5000)
    expect(rule.appliesTo).toBe('Entire cart')
  })
})

describe('buildRuleExplanation', () => {
  it('describes cart threshold rules', () => {
    const text = buildRuleExplanation({
      scope: 'cart',
      appliesTo: 'Entire cart',
      type: 'percentage',
      value: 10,
      stackable: false,
      minCartValue: 5000,
    })
    expect(text).toContain('5,000')
    expect(text).toContain('10%')
  })
})
