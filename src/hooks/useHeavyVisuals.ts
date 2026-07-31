import { useEffect, useState } from 'react'

/**
 * Decides whether this device gets the WebGL hero.
 *
 * Deliberately conservative. The lattice is the same picture either way, so
 * a phone losing the canvas loses motion, not meaning — and gains about
 * 400kb of JS it never has to parse. Also waits for idle so three.js never
 * competes with first paint.
 */
export function useHeavyVisuals() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const wide = window.matchMedia('(min-width: 768px)')
    const coarse = window.matchMedia('(pointer: coarse)')

    const evaluate = () => {
      if (reduce.matches || !wide.matches || coarse.matches) return false
      // Low-memory devices lie about width often enough to be worth checking.
      const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
      if (typeof mem === 'number' && mem < 4) return false
      try {
        const c = document.createElement('canvas')
        return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'))
      } catch {
        return false
      }
    }

    let idle: number | undefined
    const schedule = () => {
      const ok = evaluate()
      if (!ok) {
        setEnabled(false)
        return
      }
      const ric = window.requestIdleCallback
      idle = ric
        ? ric(() => setEnabled(true), { timeout: 2200 })
        : window.setTimeout(() => setEnabled(true), 900)
    }

    schedule()

    const onChange = () => {
      setEnabled(false)
      schedule()
    }
    reduce.addEventListener('change', onChange)
    wide.addEventListener('change', onChange)

    return () => {
      reduce.removeEventListener('change', onChange)
      wide.removeEventListener('change', onChange)
      if (idle !== undefined) {
        if (window.cancelIdleCallback) window.cancelIdleCallback(idle)
        else window.clearTimeout(idle)
      }
    }
  }, [])

  return enabled
}
