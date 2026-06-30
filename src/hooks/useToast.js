/**
 * Global toast state hook for app-wide notifications.
 */
import { useCallback, useState } from 'react'

let idCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((message, variant = 'success', duration = 4000) => {
    const id = ++idCounter
    setToasts((prev) => [...prev, { id, message, variant, duration }])
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
    return id
  }, [dismiss])

  return { toasts, show, dismiss }
}
