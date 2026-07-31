import { Fragment } from 'react'
import { motion } from 'framer-motion'
import { cutWord, stagger, viewportOnce } from '../../lib/motion'
import { cn } from '../../lib/cn'

type Props = {
  text: string
  className?: string
  /** Words rendered in forest green + italic, the emphasis in the line. */
  accent?: string[]
  as?: 'h1' | 'h2' | 'p'
  delay?: number
  stagger?: number
}

/* Both sides of the accent comparison go through this, so callers can pass
   `$3,000` and have it match the word `$3,000` in the sentence. */
const normalise = (w: string) => w.replace(/[.,—–?!"']/g, '').toLowerCase()

/**
 * Splits a line into words and wipes each one up behind a clip mask, so the
 * headline reads as if it is being typeset. The whole string stays as one
 * accessible label, so a screen reader gets the sentence, not nine spans.
 */
export function CutText({
  text,
  className,
  accent = [],
  as = 'h2',
  delay = 0,
  stagger: gap = 0.055,
}: Props) {
  const Tag = motion[as]
  const accentSet = new Set(accent.map(normalise))
  const words = text.split(' ')

  return (
    <Tag
      className={cn(className)}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      variants={stagger(gap, delay)}
      aria-label={text}
    >
      {words.map((word, i) => {
        const isAccent = accentSet.has(normalise(word))
        return (
          <Fragment key={`${word}-${i}`}>
            <span
              aria-hidden="true"
              className={cn(
                'inline-block overflow-hidden pb-[0.12em] align-bottom',
                /* Italic glyphs lean past their advance width, so this box is
                   narrower than the ink it holds and the overflow-hidden that
                   masks the wipe shears the last letter. Pad the mask, then
                   pull the same amount back off the margin so the padding
                   costs no layout width. */
                isAccent && 'pr-[0.16em] -mr-[0.16em]',
              )}
            >
              <motion.span
                variants={cutWord}
                className={cn(
                  'inline-block',
                  isAccent && 'text-forest italic [font-variation-settings:"SOFT"_40,"WONK"_1]',
                )}
              >
                {word}
              </motion.span>
            </span>
            {/* A real space, not a margin. Margins render the gap but leave no
                space character in the DOM, so selecting or copying a headline
                returned everythingruntogetherlikethis, and find-in-page could
                not match across words. */}
            {i < words.length - 1 ? ' ' : null}
          </Fragment>
        )
      })}
    </Tag>
  )
}
