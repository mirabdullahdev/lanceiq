import { motion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'
import { rise, stagger, viewportOnce } from '../../lib/motion'

/**
 * Static map instead of `motion(as)` at render time — calling the motion
 * factory inside a render creates a fresh component type on every pass,
 * which remounts the subtree and kills the animation.
 */
const TAGS = {
  div: motion.div,
  p: motion.p,
  li: motion.li,
  span: motion.span,
  h2: motion.h2,
  h3: motion.h3,
  figure: motion.figure,
} as const

type TagName = keyof typeof TAGS

type RevealProps = {
  children: ReactNode
  className?: string
  as?: TagName
  variants?: Variants
}

/** Single element that wipes up into place when it scrolls into view. */
export function Reveal({ children, className, as = 'div', variants = rise }: RevealProps) {
  const Tag = TAGS[as]
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      variants={variants}
    >
      {children}
    </Tag>
  )
}

/** Orchestrates children — the children supply their own variants. */
export function RevealGroup({
  children,
  className,
  gap = 0.075,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  gap?: number
  delay?: number
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      variants={stagger(gap, delay)}
    >
      {children}
    </motion.div>
  )
}
