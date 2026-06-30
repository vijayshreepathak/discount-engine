/**
 * LLM service for natural-language rule parsing.
 * Pure service layer — no React, no discount engine, no CSV parsing.
 *
 * Calls Anthropic Claude Messages API, parses JSON, validates schema.
 * Returns a RuleDraft for user confirmation — never inserts rules directly.
 */

import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt, buildUserMessage } from './promptBuilder.js'
import { parseLlmJson } from '../utils/parseLlmJson.js'
import { validateLlmResponse } from '../validators/ruleValidator.js'

const DEFAULT_MODEL = 'claude-sonnet-4-6'
const DEFAULT_TIMEOUT_MS = 30_000

/** Maps shorthand / deprecated model ids to SDK-valid model names (v0.107.0). */
const MODEL_ALIASES = {
  'claude-sonnet-4': 'claude-sonnet-4-6',
  'claude-sonnet-4-0': 'claude-sonnet-4-6',
  'claude-sonnet-4-20250514': 'claude-sonnet-4-6',
  'claude-sonnet-4-5': 'claude-sonnet-4-5-20250929',
}

/**
 * @typedef {Object} ParseRuleSuccess
 * @property {true} success
 * @property {import('../types/ruleSchema.js').RuleDraft} draft
 */

/**
 * @typedef {Object} ParseRuleFailure
 * @property {false} success
 * @property {string} error
 * @property {string[]} [options] - Present when ambiguity detected
 * @property {'ambiguity'|'validation'|'network'|'config'|'empty'} [code]
 */

/**
 * Resolves API key from environment (Vite injects import.meta.env at build time).
 * @returns {string|undefined}
 */
export function getApiKey() {
  return typeof import.meta !== 'undefined' ? import.meta.env?.VITE_ANTHROPIC_API_KEY : undefined
}

/**
 * Resolves Claude model from environment with Sonnet 4 default.
 * @returns {string}
 */
export function getModel() {
  const fromEnv =
    typeof import.meta !== 'undefined' ? import.meta.env?.VITE_ANTHROPIC_MODEL : undefined
  return resolveModel(fromEnv ?? DEFAULT_MODEL)
}

/**
 * Normalises model id to a value accepted by the Messages API.
 * @param {string} model
 * @returns {string}
 */
export function resolveModel(model) {
  const trimmed = model?.trim()
  if (!trimmed) return DEFAULT_MODEL
  return MODEL_ALIASES[trimmed] ?? trimmed
}

/**
 * Creates an Anthropic client for browser usage.
 * @param {string} apiKey
 * @returns {Anthropic}
 */
export function createAnthropicClient(apiKey) {
  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
    timeout: DEFAULT_TIMEOUT_MS,
  })
}

/**
 * Calls Claude with the built system + user prompt.
 * Injectable client enables unit testing without network.
 * @param {string} userInput
 * @param {{ apiKey?: string, model?: string, timeoutMs?: number, client?: Anthropic }} [options]
 * @returns {Promise<string>} Raw response content
 */
export async function callLlmApi(userInput, options = {}) {
  const apiKey = options.apiKey ?? getApiKey()
  if (!apiKey) {
    throw new LlmServiceError(
      'Anthropic API key not configured. Add VITE_ANTHROPIC_API_KEY to your .env file.',
      'config'
    )
  }

  const anthropic = options.client ?? createAnthropicClient(apiKey)
  const model = resolveModel(options.model ?? getModel())

  const requestBody = {
    model,
    max_tokens: 1024,
    temperature: 0,
    system: buildSystemPrompt(),
    messages: [{ role: 'user', content: buildUserMessage(userInput) }],
  }

  try {
    const message = await anthropic.messages.create(requestBody)

    const content = message.content
      ?.filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim()

    if (!content) {
      throw new LlmServiceError('Claude returned an empty response. Please try again.', 'empty')
    }

    return content
  } catch (err) {
    if (err instanceof LlmServiceError) throw err

    if (err instanceof Anthropic.AuthenticationError) {
      throw new LlmServiceError(
        'Claude API Error: Invalid API key. Check VITE_ANTHROPIC_API_KEY.',
        'config'
      )
    }

    if (err instanceof Anthropic.RateLimitError) {
      throw new LlmServiceError(
        'Claude API Error: Rate limit exceeded. Please wait and try again.',
        'network'
      )
    }

    if (err instanceof Anthropic.NotFoundError) {
      const detail = err.error?.error?.message ?? err.message
      throw new LlmServiceError(
        `Claude API Error: Model not found (${detail}). Set VITE_ANTHROPIC_MODEL to a valid id such as claude-sonnet-4-6.`,
        'network'
      )
    }

    if (err instanceof Anthropic.APIError) {
      const detail = err.error?.error?.message ?? err.message
      throw new LlmServiceError(
        `Claude API Error: Claude unavailable (${err.status}${detail ? `: ${detail}` : ''}). Please try again later.`,
        'network'
      )
    }

    if (err?.name === 'AbortError' || err?.message?.includes('timeout')) {
      throw new LlmServiceError('Request timed out. Please try again.', 'network')
    }

    throw new LlmServiceError(
      'Claude API Error: Network error while contacting Claude. Please check your connection.',
      'network'
    )
  }
}

/**
 * Custom error with a machine-readable code for UI handling.
 */
export class LlmServiceError extends Error {
  /**
   * @param {string} message
   * @param {'config'|'network'|'validation'|'empty'|'ambiguity'} code
   */
  constructor(message, code) {
    super(message)
    this.name = 'LlmServiceError'
    this.code = code
  }
}

/**
 * Parses natural language into a validated RuleDraft.
 * The draft MUST be confirmed by the user before entering the engine.
 *
 * @param {string} userInput
 * @param {{ apiKey?: string, client?: Anthropic, callLlm?: (input: string) => Promise<string> }} [options]
 * @returns {Promise<ParseRuleSuccess|ParseRuleFailure>}
 */
export async function parseNaturalLanguageRule(userInput, options = {}) {
  if (!userInput?.trim()) {
    return { success: false, error: 'Please describe a discount rule before parsing.', code: 'empty' }
  }

  try {
    const rawContent = options.callLlm
      ? await options.callLlm(userInput.trim())
      : await callLlmApi(userInput.trim(), options)

    const parsed = parseLlmJson(rawContent)
    if (!parsed.ok) {
      return { success: false, error: parsed.error, code: 'validation' }
    }

    const validated = validateLlmResponse(parsed.data)

    if (validated.status === 'error') {
      return { success: false, error: validated.message, code: 'validation' }
    }

    if (validated.status === 'ambiguity') {
      return {
        success: false,
        error: validated.message,
        options: validated.options,
        code: 'ambiguity',
      }
    }

    return { success: true, draft: validated.draft }
  } catch (err) {
    const message =
      err instanceof LlmServiceError
        ? err.message
        : 'Something went wrong while parsing your rule. Please try again.'
    const code = err instanceof LlmServiceError ? err.code : 'network'
    return { success: false, error: message, code }
  }
}
