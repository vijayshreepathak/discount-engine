/**
 * Extracts and parses JSON from raw LLM response text.
 * Handles accidental markdown fences without exposing raw errors to users.
 */

/**
 * Strips markdown code fences if the model wrapped JSON despite instructions.
 * @param {string} text
 * @returns {string}
 */
export function stripMarkdownFences(text) {
  const trimmed = text.trim()
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fenceMatch ? fenceMatch[1].trim() : trimmed
}

/**
 * Parses LLM response text into a plain object.
 * @param {string} rawText
 * @returns {{ ok: true, data: object } | { ok: false, error: string }}
 */
export function parseLlmJson(rawText) {
  if (!rawText || !String(rawText).trim()) {
    return { ok: false, error: 'The AI returned an empty response. Please try again.' }
  }

  try {
    const cleaned = stripMarkdownFences(String(rawText))
    const data = JSON.parse(cleaned)

    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      return { ok: false, error: 'The AI response was not a valid rule object. Please rephrase your rule.' }
    }

    return { ok: true, data }
  } catch {
    return {
      ok: false,
      error: 'Could not parse the AI response as JSON. Please rephrase your rule with clear scope and discount type.',
    }
  }
}
