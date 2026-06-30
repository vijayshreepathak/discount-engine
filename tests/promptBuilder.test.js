/**
 * Tests for the natural-language rule parsing prompt builder.
 */

import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, buildUserMessage, buildChatMessages } from '../src/services/promptBuilder.js'

describe('promptBuilder', () => {
  it('system prompt requires JSON-only output', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('Return ONLY valid JSON')
    expect(prompt).toContain('No markdown')
    expect(prompt).toContain('scope')
    expect(prompt).toContain('discountType')
    expect(prompt).toContain('discountValue')
    expect(prompt).toContain('minCartValue')
    expect(prompt).toContain('stackable')
  })

  it('includes few-shot supported examples', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('20% off Natura Casa products')
    expect(prompt).toContain('Rs.150 off Amazon India')
    expect(prompt).toContain('10% off orders above Rs.5000')
  })

  it('includes unsupported examples with error response', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('Buy one get one')
    expect(prompt).toContain('"error"')
    expect(prompt).toContain('Free shipping')
  })

  it('includes ambiguity example', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('20 off clothes')
    expect(prompt).toContain('"ambiguity"')
  })

  it('buildUserMessage wraps input', () => {
    expect(buildUserMessage('  test rule  ')).toContain('test rule')
  })

  it('buildChatMessages returns system + user roles', () => {
    const messages = buildChatMessages('hello')
    expect(messages).toHaveLength(2)
    expect(messages[0].role).toBe('system')
    expect(messages[1].role).toBe('user')
  })
})
