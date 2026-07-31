import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * Counts to `target` once `active` flips true. Uses rAF rather than an
 * interval so it stays on the compositor's clock, and honours
 * prefers-reduced-motion by jumping straight to the final value.
 */
export function useCountUp(target: number, active: boolean, durationMs = 1600) {
  const reduce = useReducedMotion()
  const [value, setValue] = useState(0)
  const frame = useRef<number>(0)

  useEffect(() => {
    if (!active) return
    if (reduce) {
      setValue(target)
      return
    }

    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1)
      // easeOutQuint — matches the page's motion vocabulary.
      const eased = 1 - Math.pow(1 - t, 5)
      setValue(Math.round(target * eased))
      if (t < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target, active, durationMs, reduce])

  return value
}
