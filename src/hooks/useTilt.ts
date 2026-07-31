import { useRef } from 'react'
import { useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'

/**
 * Pointer-driven 3D tilt for cards.
 *
 * Only reacts to a real mouse — `pointerType === 'touch'` is ignored, so on
 * phones the card never gets stuck in a tilted state after a tap.
 */
export function useTilt(maxDeg = 5) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  const px = useMotionValue(0)
  const py = useMotionValue(0)

  const config = { stiffness: 180, damping: 22, mass: 0.6 }
  const sx = useSpring(px, config)
  const sy = useSpring(py, config)

  const rotateX = useTransform(sy, [-0.5, 0.5], [maxDeg, -maxDeg])
  const rotateY = useTransform(sx, [-0.5, 0.5], [-maxDeg, maxDeg])

  // Inner content drifts a few px further than the card — parallax depth.
  const shiftX = useTransform(sx, [-0.5, 0.5], [-6, 6])
  const shiftY = useTransform(sy, [-0.5, 0.5], [-4, 4])

  /* Measured once on enter, not on every move. getBoundingClientRect forces
     a synchronous layout, and doing that per pointermove across a grid of
     cards is a steady stream of forced reflows for a decorative effect. */
  const rect = useRef<DOMRect | null>(null)

  const onPointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType === 'touch') return
    rect.current = ref.current?.getBoundingClientRect() ?? null
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType === 'touch') return
    const r = rect.current
    if (!r) return
    px.set((e.clientX - r.left) / r.width - 0.5)
    py.set((e.clientY - r.top) / r.height - 0.5)
  }

  const onPointerLeave = () => {
    rect.current = null
    px.set(0)
    py.set(0)
  }

  return { ref, onPointerEnter, onPointerMove, onPointerLeave, rotateX, rotateY, shiftX, shiftY }
}
