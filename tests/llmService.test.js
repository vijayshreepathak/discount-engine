/**
 * Tests for LLM service — uses injected mock responses, no network.
 */

import { describe, it, expect } from 'vitest'
import { parseNaturalLanguageRule, LlmServiceError } from '../src/services/llmService.js'
import { parseLlmJson, stripMarkdownFences } from '../src/utils/parseLlmJson.js'

describe('parseLlmJson', () => {
  it('parses clean JSON', () => {
    const result = parseLlmJson('{"scope":"Brand","qualifier":"X","discountType":"Flat","discountValue":50,"stackable":false}')
    expect(result.ok).toBe(true)
  })

  it('strips markdown fences', () => {
    const fenced = '```json\n{"scope":"Brand","qualifier":"X","discountType":"Flat","discountValue":50,"stackable":false}\n```'
    expect(stripMarkdownFences(fenced)).not.toContain('```')
    const result = parseLlmJson(fenced)
    expect(result.ok).toBe(true)
  })

  it('rejects malformed JSON', () => {
    const result = parseLlmJson('not json at all')
    expect(result.ok).toBe(false)
  })
})

describe('parseNaturalLanguageRule', () => {
  it('rejects empty input', async () => {
    const result = await parseNaturalLanguageRule('')
    expect(result.success).toBe(false)
    expect(result.code).toBe('empty')
  })

  it('parses a valid brand rule via mock LLM', async () => {
    const mockResponse = JSON.stringify({
      scope: 'Brand',
      qualifier: 'Natura Casa',
      discountType: 'Percentage',
      discountValue: 20,
      minCartValue: null,
      stackable: false,
    })

    const result = await parseNaturalLanguageRule('20% off Natura Casa', {
      callLlm: async () => mockResponse,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.draft.scope).toBe('brand')
      expect(result.draft.value).toBe(20)
    }
  })

  it('returns error for unsupported BOGO', async () => {
    const result = await parseNaturalLanguageRule('buy one get one', {
      callLlm: async () => JSON.stringify({ error: 'BOGO not supported' }),
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('BOGO')
  })

  it('returns ambiguity without guessing', async () => {
    const result = await parseNaturalLanguageRule('20 off products', {
      callLlm: async () =>
        JSON.stringify({
          ambiguity: {
            message: 'Did you mean Rs.20 or 20%?',
            options: ['Rs.20 flat', '20% off'],
          },
        }),
    })
    expect(result.success).toBe(false)
    expect(result.code).toBe('ambiguity')
    expect(result.options).toHaveLength(2)
  })

  it('handles malformed JSON from LLM', async () => {
    const result = await parseNaturalLanguageRule('test', {
      callLlm: async () => 'Here is your rule: invalid',
    })
    expect(result.success).toBe(false)
    expect(result.code).toBe('validation')
  })
})

describe('LlmServiceError', () => {
  it('carries error code', () => {
    const err = new LlmServiceError('missing key', 'config')
    expect(err.code).toBe('config')
  })
})
