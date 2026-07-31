import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useBurn } from '../../state/burnStore'
import { EASE } from '../../lib/motion'
import { cn } from '../../lib/cn'

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

/** Above this, the chip turns ember. Roughly a month of most people's rent. */
const ALARM_AT = 2000

/**
 * A persistent reminder of the visitor's connect spend — their own figure
 * from the calculator above, not a global "connects wasted today" ticker.
 * A fake live feed would be the single most obviously invented thing we could
 * put on the page, and this audience would spot it instantly.
 *
 * Appears only once they have actually moved a slider, and it can be closed.
 */
export function BurnChip() {
  const { annual, touched } = useBurn()
  const [dismissed, setDismissed] = useState(false)
  const [pastProblem, setPastProblem] = useState(false)

  useEffect(() => {
    const section = document.getElementById('problem')
    if (!section) return
    // Show it once the problem section has scrolled off the top — the point
    // where they've read the argument and are moving on.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        setPastProblem(entry.boundingClientRect.top < 0 && !entry.isIntersecting)
      },
      { threshold: 0 },
    )
    io.observe(section)
    return () => io.disconnect()
  }, [])

  const visible = touched && pastProblem && !dismissed
  const hot = annual >= ALARM_AT

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.5, ease: EASE.quint }}
          aria-label="Your estimated annual connect spend"
          className="glass-blur fixed bottom-5 left-5 z-40 hidden max-w-[19rem] rounded-2xl p-4 pr-3 sm:block"
        >
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={cn(
                'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                hot ? 'bg-ember' : 'bg-mint',
              )}
            />
            <div className="min-w-0">
              <p className="font-mono text-[0.62rem] tracking-[0.14em] text-slate uppercase">
                Your connect spend
              </p>
              <p
                className={cn(
                  'tabular mt-0.5 text-[1.4rem] leading-none font-semibold',
                  hot ? 'text-ember' : 'text-forest',
                )}
              >
                {usd.format(annual)}
                <span className="ml-1 text-[0.8rem] font-normal text-slate">/ year</span>
              </p>
              <a
                href="#waitlist"
                className="mt-2 inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-graphite underline decoration-rule-strong underline-offset-4 transition-colors hover:decoration-forest"
              >
                Spend it on better bets
              </a>
            </div>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss connect spend reminder"
              className="-mt-1 -mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate transition-colors hover:bg-haze hover:text-graphite"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
