import type { Transition, Variants } from 'framer-motion'

/**
 * One animation vocabulary for the whole page, and one hard rule:
 *
 *   ONLY `opacity` and `transform` ARE EVER ANIMATED.
 *
 * Those two are the only properties a browser can animate on the compositor
 * without touching layout or paint. Everything else — clip-path, filter,
 * box-shadow, background-color, width/height — forces a repaint on every
 * single frame.
 *
 * This file used to animate `clip-path` on every heading word, which meant a
 * nine-word headline ran nine simultaneous repaint loops, and the page had
 * six such headlines. That was the page's jank.
 *
 * The "wipe up behind a mask" look is unchanged: the parent span keeps its
 * `overflow-hidden`, so a plain translateY still reveals the word from behind
 * a clipped edge. Same effect, none of the cost.
 */

export const EASE = {
  quint: [0.22, 1, 0.36, 1],
  spring: [0.34, 1.56, 0.64, 1],
  drift: [0.45, 0.05, 0.25, 1],
} as const

/* Fires earlier and only once. `amount: 0.35` meant a tall section had to be
   a third visible before anything moved, so content arrived late and the
   animation was still running while you scrolled past it. */
export const viewportOnce = { once: true, amount: 0.15, margin: '0px 0px -8% 0px' } as const

/** Container that orchestrates children instead of animating itself. */
export const stagger = (staggerChildren = 0.045, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
})

/** The page's default entrance. Transform + opacity only. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE.quint },
  },
}

/** Softer variant for body copy that follows a heading. */
export const fade: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE.quint } },
}

/** Per-word reveal used by <CutText>. The parent's overflow does the masking. */
export const cutWord: Variants = {
  hidden: { opacity: 0, y: '0.55em' },
  show: {
    opacity: 1,
    y: '0em',
    transition: { duration: 0.42, ease: EASE.quint },
  },
}

/** Cards enter from slightly different depths so the grid feels orchestrated. */
export const cardIn = (depth: number): Variants => ({
  hidden: { opacity: 0, y: 20 + depth * 4 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE.quint },
  },
})

export const hoverLift: Transition = { duration: 0.3, ease: EASE.quint }
