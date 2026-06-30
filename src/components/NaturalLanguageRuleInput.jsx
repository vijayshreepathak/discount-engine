/**
 * Primary AI rule creation — visually distinct featured section.
 */

import { lazy, Suspense, useState } from 'react'
import { parseNaturalLanguageRule } from '../services/llmService.js'
import ThinkingDots from './ui/ThinkingDots.jsx'

const RuleConfirmationDialog = lazy(() => import('./RuleConfirmationDialog.jsx'))

const EXAMPLES = [
  '20% off Natura Casa',
  'Rs.100 off Amazon India',
  '10% off orders above Rs.5000',
]

const MAX_CHARS = 500

export default function NaturalLanguageRuleInput({ existingRules, onRuleConfirmed, onToast }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [ambiguityOptions, setAmbiguityOptions] = useState([])
  const [pendingDraft, setPendingDraft] = useState(null)
  const [lastPrompt, setLastPrompt] = useState('')

  async function handleParse() {
    setError(null)
    setAmbiguityOptions([])
    setLoading(true)
    setLastPrompt(input.trim())

    const result = await parseNaturalLanguageRule(input)
    setLoading(false)

    if (!result.success) {
      setError(result.error)
      if (result.options?.length) setAmbiguityOptions(result.options)
      onToast?.(result.error, result.code === 'ambiguity' ? 'warning' : 'error')
      return
    }

    setPendingDraft(result.draft)
  }

  function handleConfirm(rule) {
    onRuleConfirmed(rule, lastPrompt)
    setPendingDraft(null)
    setInput('')
    onToast?.(`Rule ${rule.ruleId} added`, 'success')
  }

  return (
    <>
      <section className="ai-card ai-card--primary" aria-labelledby="ai-rule-heading">
        <div className="ai-card__header">
          <div className="ai-card__title-group">
            <h3 id="ai-rule-heading" className="ai-card__heading">Create Rule with AI</h3>
          </div>
        </div>

        <p className="ai-card__desc">
          Describe a discount in plain language. We parse it, you review and confirm before anything is applied.
        </p>

        {loading && (
          <div className="ai-card__thinking" role="status" aria-live="polite">
            <ThinkingDots />
            <span>Interpreting your rule</span>
          </div>
        )}

        <label htmlFor="nl-rule-input" className="sr-only">Describe discount rule</label>
        <textarea
          id="nl-rule-input"
          className={`textarea textarea--featured${error ? ' textarea--error' : ''}`}
          value={input}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) { setInput(e.target.value); setError(null) }
          }}
          placeholder="Describe your discount naturally…"
          disabled={loading}
          aria-describedby={error ? 'nl-rule-error' : 'nl-rule-hint'}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleParse() }}
        />

        <div className="textarea-footer" id="nl-rule-hint">
          <span>{loading ? 'Processing' : 'Ctrl+Enter to parse'}</span>
          <span>{input.length}/{MAX_CHARS}</span>
        </div>

        <div className="ai-card__suggestions">
          <span className="ai-card__suggestions-label">Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              className="chip"
              onClick={() => { setInput(ex); setError(null) }}
              disabled={loading}
            >
              {ex}
            </button>
          ))}
        </div>

        {error && (
          <div id="nl-rule-error" className="alert alert--error" role="alert">
            <div className="alert__title">{ambiguityOptions.length ? 'Needs clarification' : 'Could not parse rule'}</div>
            {error}
            {ambiguityOptions.length > 0 && (
              <div className="alert__suggestions">
                <div className="alert__hint">Did you mean:</div>
                {ambiguityOptions.map((opt) => (
                  <button key={opt} type="button" className="chip" onClick={() => { setInput(opt); setError(null); setAmbiguityOptions([]) }}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="ai-card__actions">
          <button type="button" className="btn btn--primary btn--parse" onClick={handleParse} disabled={loading || !input.trim()} aria-busy={loading}>
            {loading ? <><span className="spinner" aria-hidden /> Parsing</> : 'Parse Rule'}
          </button>
          <p className="ai-card__powered">Powered by Anthropic Claude</p>
        </div>
      </section>

      {pendingDraft && (
        <Suspense fallback={<div className="modal-overlay"><div className="modal modal--loading" aria-busy="true" /></div>}>
          <RuleConfirmationDialog
            draft={pendingDraft}
            existingRules={existingRules}
            onConfirm={handleConfirm}
            onCancel={() => setPendingDraft(null)}
          />
        </Suspense>
      )}
    </>
  )
}
