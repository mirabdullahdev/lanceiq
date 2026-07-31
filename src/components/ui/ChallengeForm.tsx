import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CHALLENGES, sendChallenge } from '../../lib/feedback'
import { EASE } from '../../lib/motion'
import { cn } from '../../lib/cn'

type State = 'idle' | 'sending' | 'done' | 'error'

/**
 * A second, separate form. Its own endpoint, its own table, no email
 * attached — a response cannot be tied back to a signup.
 *
 * One tap submits. There is no Submit button on purpose: this is asked after
 * the visitor has already converted, so every extra click is response rate
 * thrown away for no benefit.
 */
export function ChallengeForm({ className }: { className?: string }) {
  const [state, setState] = useState<State>('idle')
  const [picked, setPicked] = useState<string | null>(null)

  const choose = async (challenge: string) => {
    if (state === 'sending' || state === 'done') return
    setPicked(challenge)
    setState('sending')
    try {
      await sendChallenge(challenge)
      setState('done')
    } catch {
      // Nothing is lost that the visitor cares about, so this stays quiet.
      // They already got what they came for: a place on the list.
      setState('error')
    }
  }

  return (
    <div className={cn('border-t border-rule pt-5', className)}>
      <AnimatePresence mode="wait">
        {state === 'done' || state === 'error' ? (
          <motion.p
            key="thanks"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE.quint }}
            role="status"
            className="text-[0.85rem] leading-relaxed text-slate"
          >
            {state === 'done' ? (
              <>
                Noted, thank you. That goes straight into what we build first.
              </>
            ) : (
              <>That didn't send, but no matter. Your spot on the list is safe.</>
            )}
          </motion.p>
        ) : (
          <motion.div
            key="ask"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE.quint }}
          >
            <p className="text-[0.85rem] font-medium text-graphite">
              One thing, while you're here: what hurts most right now?
            </p>
            <p className="mt-1 mb-3.5 text-[0.78rem] text-slate">
              Anonymous, and not attached to your email. One tap.
            </p>

            <ul className="flex flex-wrap gap-2">
              {CHALLENGES.map((c) => {
                const active = picked === c
                return (
                  <li key={c}>
                    <button
                      type="button"
                      onClick={() => choose(c)}
                      disabled={state === 'sending'}
                      aria-busy={active && state === 'sending'}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-left text-[0.78rem] leading-snug',
                        'transition-[background-color,border-color,transform] duration-300',
                        '[transition-timing-function:var(--ease-out-quint)]',
                        'hover:-translate-y-px hover:border-forest/40 hover:bg-haze',
                        'disabled:pointer-events-none',
                        active
                          ? 'border-transparent bg-mint text-ink'
                          : 'border-rule bg-white/60 text-slate',
                      )}
                    >
                      {c}
                    </button>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
