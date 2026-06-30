/**
 * Animated processing timeline shown after discount calculation.
 * Presentation only — steps reflect completed pipeline stages.
 */

const STEPS = [
  'Loaded Rules',
  'Loaded Cart',
  'Matched Rules',
  'Selected Best Discounts',
  'Applied Stackable Rules',
  'Applied Cart Offer',
  'Final Total Calculated',
]

export default function ProcessingTimeline({ visible, activeStep = STEPS.length }) {
  if (!visible) return null

  return (
    <div className="timeline" role="status" aria-label="Calculation pipeline">
      <div className="timeline__title">Processing Pipeline</div>
      <ol className="timeline__list">
        {STEPS.map((step, i) => {
          const done = i < activeStep
          const current = i === activeStep - 1
          return (
            <li
              key={step}
              className={`timeline__item${done ? ' timeline__item--done' : ''}${current ? ' timeline__item--current' : ''}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="timeline__check" aria-hidden>
                {done ? '✓' : i + 1}
              </span>
              <span>{step}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export { STEPS }
