/**
 * Animated number display for KPI cards (presentation only).
 * @param {number} value
 * @param {number} durationMs
 */
import { useEffect, useState } from 'react'

export function useAnimatedNumber(value, durationMs = 500) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const start = display
    const diff = value - start
    if (diff === 0) return

    const startTime = performance.now()

    function tick(now) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + diff * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [value, durationMs])

  return display
}
