/**
 * Tests for local rule ID generation.
 */

import { describe, it, expect } from 'vitest'
import { generateRuleId } from '../src/utils/generateRuleId.js'

describe('generateRuleId', () => {
  it('starts at RULE-001 when no rules exist', () => {
    expect(generateRuleId([])).toBe('RULE-001')
  })

  it('increments from highest existing ID', () => {
    const rules = [
      { ruleId: 'RULE-001' },
      { ruleId: 'RULE-003' },
      { ruleId: 'RULE-02' },
    ]
    expect(generateRuleId(rules)).toBe('RULE-004')
  })

  it('handles legacy RULE-01 format', () => {
    expect(generateRuleId([{ ruleId: 'RULE-01' }, { ruleId: 'RULE-04' }])).toBe('RULE-005')
  })
})
