/**
 * Toast notification — top-right, animated, accessible.
 */

const ICONS = { success: '✓', error: '!', warning: '⚠', info: 'i' }

export default function Toast({ message, variant = 'success', onDismiss }) {
  return (
    <div className={`toast toast--${variant}`} role="alert" aria-live="polite">
      <span className="toast__icon" aria-hidden>
        {ICONS[variant] ?? 'i'}
      </span>
      <div className="toast__message">{message}</div>
      <button type="button" className="toast__close" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null
  return (
    <div className="toast-container" aria-label="Notifications">
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} variant={t.variant} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  )
}
