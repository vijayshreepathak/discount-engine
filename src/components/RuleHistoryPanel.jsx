/**
 * Rule history panel with timeline, undo, copy, and export actions.
 * Presentation and state display only.
 */

import { formatCurrency } from '../utils/formatCurrency.js'

/**
 * @param {{
 *   aiRules: { rule: object, prompt?: string, addedAt: number }[],
 *   onUndo?: () => void,
 *   onCopyJson?: () => void,
 *   onCopyPrompt?: () => void,
 *   onExport?: () => void,
 *   canUndo?: boolean,
 * }} props
 */
export default function RuleHistoryPanel({
  aiRules = [],
  onUndo,
  onCopyJson,
  onCopyPrompt,
  onExport,
  canUndo,
}) {
  if (!aiRules.length && !canUndo) return null

  return (
    <div className="rule-history">
      <div className="rule-history__header">
        <h3 className="rule-history__title">Recent AI Rules</h3>
        <div className="rule-history__actions">
          {canUndo && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={onUndo}>
              Undo last
            </button>
          )}
          <button type="button" className="btn btn--ghost btn--sm" onClick={onCopyJson} disabled={!aiRules.length}>
            Copy JSON
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onCopyPrompt} disabled={!aiRules.length}>
            Copy prompt
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onExport}>
            Export rules
          </button>
        </div>
      </div>

      {aiRules.length > 0 ? (
        <ol className="rule-history__timeline">
          {[...aiRules].reverse().slice(0, 5).map((entry, i) => (
            <li key={entry.rule.ruleId + entry.addedAt} className="rule-history__entry">
              <span className="rule-history__dot" aria-hidden />
              <div>
                <div className="rule-history__rule-id">{entry.rule.ruleId}</div>
                <div className="rule-history__detail">
                  {entry.rule.scope} ·{' '}
                  {entry.rule.type === 'percentage'
                    ? `${entry.rule.value}%`
                    : formatCurrency(entry.rule.value)}
                  {entry.rule.appliesTo ? ` · ${entry.rule.appliesTo}` : ''}
                </div>
                {entry.prompt && (
                  <div className="rule-history__prompt">&ldquo;{entry.prompt}&rdquo;</div>
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rule-history__empty">AI-created rules will appear here.</p>
      )}
    </div>
  )
}
