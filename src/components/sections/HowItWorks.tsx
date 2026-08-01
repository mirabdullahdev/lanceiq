import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { CutText } from '../ui/CutText'
import { cn } from '../../lib/cn'
import { EASE } from '../../lib/motion'
import { PasteStep, VerdictStep, ProposalStep } from '../demo/steps'

const STEPS = [
  {
    id: 'paste',
    title: 'Paste the post',
    blurb:
      "Copy the job description straight off Upwork. You don't need to connect your Upwork account. It's a textarea.",
    Panel: PasteStep,
  },
  {
    id: 'verdict',
    title: 'Read the verdict',
    blurb:
      'Nine-plus signals, from client history to budget fit against your rate to how crowded the post already is, collapse into one call with the reasoning shown. Data from winning proposals feeds the engine, so it learns what converts.',
    Panel: VerdictStep,
  },
  {
    id: 'proposal',
    title: 'Crafted Proposal',
    blurb:
      "If it's worth bidding, the draft is already there, built from proposals that got replies and then bent toward how you write. Edit and send.",
    Panel: ProposalStep,
  },
] as const

const DWELL_MS = 7000

export function HowItWorks() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduce = useReducedMotion()
  const { ref, inView } = useInView({ threshold: 0.35 })
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const uid = useId()

  // Only advances while the section is actually on screen and un-paused.
  useEffect(() => {
    if (!inView || paused || reduce) return
    const t = window.setTimeout(() => setActive((i) => (i + 1) % STEPS.length), DWELL_MS)
    return () => window.clearTimeout(t)
  }, [active, inView, paused, reduce])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!delta) return
    e.preventDefault()
    setPaused(true)
    setActive((i) => {
      const next = (i + delta + STEPS.length) % STEPS.length
      tabRefs.current[next]?.focus()
      return next
    })
  }, [])

  const current = STEPS[active]!

  return (
    <section id="how" className="scroll-mt-24 bg-paper py-[clamp(5rem,11vw,9rem)]">
      <div ref={ref} className="mx-auto max-w-[76rem] px-[var(--gutter)]">

        <div className="max-w-[46rem]">
          <CutText
            text="Job Decision Engine"
            accent={['Engine']}
            className="text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.04] font-semibold"
          />
        </div>

        <div
          className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-16"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Steps rail */}
          <div role="tablist" aria-label="Product walkthrough" onKeyDown={onKeyDown} className="flex flex-col">
            {STEPS.map((step, i) => {
              const on = i === active
              return (
                <button
                  key={step.id}
                  ref={(el) => {
                    tabRefs.current[i] = el
                  }}
                  role="tab"
                  id={`${uid}-tab-${step.id}`}
                  aria-selected={on}
                  aria-controls={`${uid}-panel-${step.id}`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => {
                    setActive(i)
                    setPaused(true)
                  }}
                  /* The active rail is a border colour change, not a
                     `layoutId` element. A shared-layout animation makes framer
                     measure both positions and animate between them — layout
                     work, every seven seconds, forever. A colour transition
                     looks near-identical and costs nothing. */
                  className={cn(
                    'group relative border-l-2 py-5 pr-2 pl-6 text-left transition-colors duration-400',
                    '[transition-timing-function:var(--ease-out-quint)]',
                    on ? 'border-forest' : 'border-rule hover:border-rule-strong',
                  )}
                >
                  <span
                    className={cn(
                      'block font-display text-[1.3rem] font-semibold transition-colors duration-300',
                      on ? 'text-graphite' : 'text-slate group-hover:text-graphite',
                    )}
                  >
                    {step.title}
                  </span>
                  {/* Always rendered, dimmed when inactive.
                      This used to animate `height: 0 -> auto`, which is a
                      layout animation: it reflows the column on every frame,
                      every seven seconds. Keeping all three in the flow means
                      no reflow, no collapse, no layout shift — and you can
                      read all three steps at once, which is better anyway. */}
                  <span
                    className={cn(
                      'mt-2.5 block max-w-[34ch] text-[0.88rem] leading-relaxed transition-opacity duration-400',
                      on ? 'text-slate opacity-100' : 'text-slate opacity-45',
                    )}
                  >
                    {step.blurb}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Panel */}
          <div
            role="tabpanel"
            id={`${uid}-panel-${current.id}`}
            aria-labelledby={`${uid}-tab-${current.id}`}
            tabIndex={0}
            className="relative min-h-[26rem] rounded-3xl border border-rule bg-tint p-4 sm:p-7"
          >
            <div
              aria-hidden="true"
              className="hairline-grid absolute inset-0 rounded-3xl opacity-45 [mask-image:radial-gradient(75%_75%_at_50%_45%,#000,transparent_78%)]"
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: EASE.quint }}
                className="relative"
              >
                <current.Panel />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
