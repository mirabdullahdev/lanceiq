import type { Transition, Variants } from 'framer-motion'

/**
 * One easing vocabulary for the whole page.
 * `quint` is the workhorse — it decelerates hard, which reads as weight.
 * Nothing here uses plain ease-in-out.
 */
export const EASE = {
  quint: [0.22, 1, 0.36, 1],
  spring: [0.34, 1.56, 0.64, 1],
  drift: [0.45, 0.05, 0.25, 1],
} as const

export const viewportOnce = { once: true, amount: 0.35 } as const

/** Container that orchestrates children instead of animating itself. */
export const stagger = (staggerChildren = 0.075, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
})

/**
 * The page's default entrance: rise + a clip that wipes upward, so the
 * element looks like it is being set in type rather than sliding in.
 */
export const rise: Variants = {
  hidden: { opacity: 0, y: 22, clipPath: 'inset(0% 0% 100% 0%)' },
  show: {
    opacity: 1,
    y: 0,
    clipPath: 'inset(0% 0% -8% 0%)',
    transition: { duration: 0.85, ease: EASE.quint },
  },
}

/** Softer variant for body copy that follows a heading. */
export const fade: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE.quint } },
}

/** Per-word cut used by <CutText>. */
export const cutWord: Variants = {
  hidden: { opacity: 0, y: '0.42em', clipPath: 'inset(0% 0% 105% 0%)' },
  show: {
    opacity: 1,
    y: '0em',
    clipPath: 'inset(-25% -8% -25% 0%)',
    transition: { duration: 0.72, ease: EASE.quint },
  },
}

/** Cards enter from slightly different depths so the grid feels orchestrated. */
export const cardIn = (depth: number): Variants => ({
  hidden: { opacity: 0, y: 34 + depth * 6, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease: EASE.quint },
  },
})

export const hoverLift: Transition = { duration: 0.4, ease: EASE.quint }
