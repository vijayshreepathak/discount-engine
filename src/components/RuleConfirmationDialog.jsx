/**
 * Premium confirmation modal with summary, validation, edit, and preview sections.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import RulePreviewCard from './RulePreviewCard.jsx'
import RuleExplanationCard from './RuleExplanationCard.jsx'
import ConfidenceIndicator from './ConfidenceIndicator.jsx'
import { validateRuleDraft, draftToDiscountRule } from '../validators/ruleValidator.js'
import { generateRuleId } from '../utils/generateRuleId.js'
import { buildConfidenceChecks, buildRuleBusinessImpact } from '../utils/buildRuleBusinessImpact.js'

export default function RuleConfirmationDialog({ draft: initialDraft, existingRules, onConfirm, onCancel }) {
  const [draft, setDraft] = useState({ ...initialDraft })
  const [errors, setErrors] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const dialogRef = useRef(null)
  const pendingRuleId = generateRuleId(existingRules)

  const normalized = useMemo(
    () => ({
      ...draft,
      value: Number(draft.value),
      minCartValue: draft.scope === 'cart' ? Number(draft.minCartValue) : null,
      stackable: Boolean(draft.stackable),
    }),
    [draft]
  )

  const validation = useMemo(
    () => validateRuleDraft(normalized, existingRules, pendingRuleId),
    [normalized, existingRules, pendingRuleId]
  )

  const confidence = useMemo(
    () => buildConfidenceChecks(normalized, validation.errors),
    [normalized, validation.errors]
  )

  const { impact, eligibility } = useMemo(
    () => buildRuleBusinessImpact(normalized),
    [normalized]
  )

  useEffect(() => {
    dialogRef.current?.focus()
    document.body.style.overflow = 'hidden'

    function onKey(e) {
      if (e.key === 'Escape') onCancel()
    }

    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onCancel])

  useEffect(() => {
    const root = dialogRef.current
    if (!root) return

    function onKeyDown(e) {
      if (e.key !== 'Tab') return
      const focusable = root.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    root.addEventListener('keydown', onKeyDown)
    return () => root.removeEventListener('keydown', onKeyDown)
  }, [isEditing, showAdvanced])

  function update(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }))
    setErrors([])
  }

  function handleConfirm() {
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }
    onConfirm(draftToDiscountRule(normalized, pendingRuleId))
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onCancel}>
      <div
        ref={dialogRef}
        className="modal modal--confirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rule-dialog-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header modal__header--split">
          <div>
            <h2 id="rule-dialog-title" className="modal__title">Confirm New Rule</h2>
            <p className="modal__desc">
              Review the AI-parsed rule. Edit if needed, then confirm to add it to your ruleset.
            </p>
          </div>
          <button
            type="button"
            className="modal__close"
            onClick={onCancel}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className="modal__scroll">
          <section className="modal__section" aria-label="Rule preview">
            <RulePreviewCard draft={draft} ruleId={pendingRuleId} />
          </section>

          <section className="modal__section" aria-label="Rule explanation">
            <RuleExplanationCard draft={draft} compact />
          </section>

          <section className="modal__section" aria-label="Validation status">
            <ConfidenceIndicator
              level={confidence.level}
              score={confidence.score}
              checks={confidence.checks}
              compact
            />
          </section>

          {isEditing && (
            <section className="modal__section modal__section--edit" aria-label="Edit rule">
              <div className="form-grid">
                <div className="field">
                  <label className="field__label" htmlFor="edit-scope">Scope</label>
                  <select
                    id="edit-scope"
                    className="field__input"
                    value={draft.scope}
                    onChange={(e) => update('scope', e.target.value)}
                  >
                    <option value="brand">Brand</option>
                    <option value="platform">Platform</option>
                    <option value="cart">Cart</option>
                  </select>
                </div>

                {draft.scope !== 'cart' && (
                  <div className="field">
                    <label className="field__label" htmlFor="edit-qualifier">
                      {draft.scope === 'brand' ? 'Brand Name' : 'Platform Name'}
                    </label>
                    <input
                      id="edit-qualifier"
                      className="field__input"
                      type="text"
                      value={draft.appliesTo}
                      onChange={(e) => update('appliesTo', e.target.value)}
                    />
                  </div>
                )}

                <div className="form-grid form-grid--2">
                  <div className="field">
                    <label className="field__label" htmlFor="edit-type">Discount Type</label>
                    <select
                      id="edit-type"
                      className="field__input"
                      value={draft.type}
                      onChange={(e) => update('type', e.target.value)}
                    >
                      <option value="percentage">Percentage</option>
                      <option value="flat">Flat (Rs.)</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="field__label" htmlFor="edit-value">Discount Value</label>
                    <input
                      id="edit-value"
                      className="field__input"
                      type="number"
                      min="0"
                      value={draft.value}
                      onChange={(e) => update('value', e.target.value)}
                    />
                  </div>
                </div>

                {draft.scope === 'cart' && (
                  <div className="field">
                    <label className="field__label" htmlFor="edit-threshold">Minimum Cart (Rs.)</label>
                    <input
                      id="edit-threshold"
                      className="field__input"
                      type="number"
                      min="0"
                      value={draft.minCartValue ?? ''}
                      onChange={(e) => update('minCartValue', e.target.value)}
                    />
                  </div>
                )}

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={draft.stackable}
                    onChange={(e) => update('stackable', e.target.checked)}
                  />
                  Stackable with other offers
                </label>
              </div>
            </section>
          )}

          <div className="modal__advanced">
            <button
              type="button"
              className="modal__advanced-toggle"
              onClick={() => setShowAdvanced((v) => !v)}
              aria-expanded={showAdvanced}
              aria-controls="rule-advanced-details"
            >
              <span className="modal__advanced-icon" aria-hidden>{showAdvanced ? '▼' : '▶'}</span>
              Advanced Details
            </button>

            {showAdvanced && (
              <div id="rule-advanced-details" className="modal__advanced-body">
                <div className="modal__advanced-block">
                  <h4 className="modal__advanced-label">Estimated behaviour</h4>
                  <p className="modal__advanced-text">{impact}</p>
                </div>

                <div className="modal__advanced-block">
                  <h4 className="modal__advanced-label">Eligibility</h4>
                  <div className="rule-explanation__grid">
                    <div className="rule-explanation__meta">
                      <span className="rule-explanation__meta-label">Scope</span>
                      <span className="badge badge--neutral">{draft.scope}</span>
                    </div>
                    <div className="rule-explanation__meta">
                      <span className="rule-explanation__meta-label">Eligibility</span>
                      <span className="rule-explanation__meta-value">{eligibility}</span>
                    </div>
                    <div className="rule-explanation__meta">
                      <span className="rule-explanation__meta-label">Stackable</span>
                      <span className={`badge ${draft.stackable ? 'badge--success' : 'badge--neutral'}`}>
                        {draft.stackable ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="modal__advanced-block">
                  <h4 className="modal__advanced-label">Validation checklist</h4>
                  <ul className="confidence__list">
                    {confidence.checks.map((check, i) => (
                      <li
                        key={i}
                        className={`confidence__item${check.ok ? ' confidence__item--ok' : ' confidence__item--fail'}`}
                      >
                        <span className="confidence__icon" aria-hidden>{check.ok ? '✓' : '✗'}</span>
                        <span>{check.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {errors.length > 0 && (
            <div className="alert alert--error modal__section" role="alert">
              {errors.map((e, i) => (
                <div key={i}>{e}</div>
              ))}
            </div>
          )}
        </div>

        <div className="modal__footer modal__footer--sticky">
          <button type="button" className="btn btn--outline modal__btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--secondary modal__btn"
            onClick={() => setIsEditing((v) => !v)}
          >
            {isEditing ? 'Hide Editor' : 'Edit'}
          </button>
          <button type="button" className="btn btn--primary modal__btn" onClick={handleConfirm}>
            Confirm & Add Rule
          </button>
        </div>
      </div>
    </div>
  )
}
