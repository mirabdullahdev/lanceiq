import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { CutText } from '../ui/CutText'
import { SectionLabel } from '../ui/SectionLabel'
import { Reveal, RevealGroup } from '../ui/Reveal'
import { WaitlistForm } from '../ui/WaitlistForm'
import { useCountUp } from '../../hooks/useCountUp'
import { OFFER, WAITLIST_COUNT } from '../../config/site'
import { cardIn, fade } from '../../lib/motion'

const PERKS = [
  {
    k: `${OFFER.discount} off, ${OFFER.months} months`,
    v: 'Counted from the day you upgrade rather than from launch day, so it does not quietly expire while you wait.',
  },
  {
    k: 'First access',
    v: 'Waitlist goes in before public signup, in the order people joined.',
  },
  {
    k: 'Shape what gets built',
    v: 'The problem you flag when you sign up feeds straight into what we build first. Early users set the priorities.',
  },
]

export function Waitlist() {
  return (
    <section
      id="waitlist"
      className="relative scroll-mt-24 overflow-hidden border-t border-rule bg-graphite py-[clamp(5rem,11vw,9rem)]"
    >
      {/* Texture as two background layers rather than an SVG.
          This was a 435-element inline <svg> behind a mask-image — hundreds of
          DOM nodes and a masked compositing layer, for what reads as a field
          of faint dots. A tiled radial-gradient costs one paint and no DOM. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle,rgba(114,219,151,0.30)_1px,transparent_1px)] bg-[size:26px_26px] opacity-70 [mask-image:radial-gradient(85%_75%_at_50%_35%,#000,transparent_78%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_120%,rgba(114,219,151,0.22),transparent_65%)]"
      />

      <div className="relative mx-auto max-w-[76rem] px-[var(--gutter)]">
        <Reveal>
          <SectionLabel index="05" tone="dark">
            The offer
          </SectionLabel>
        </Reveal>

        <div className="mt-10 grid gap-x-16 gap-y-12 lg:grid-cols-[1fr_minmax(0,30rem)] lg:items-start">
          <div>
            <CutText
              text={`Join the waitlist to get ${OFFER.discount} for First ${OFFER.months} months`}
              className="max-w-[15ch] text-[clamp(2rem,4.6vw,3.6rem)] leading-[1.04] font-semibold text-white [&_span]:text-white"
            />

            <Reveal variants={fade}>
              <p className="mt-7 max-w-[48ch] text-[1.02rem] leading-relaxed text-white/65">
                Launching soon, be among the early users and get access to new features early plus
                premium benefits, you will be notified when our product is live.
              </p>
            </Reveal>

            <RevealGroup gap={0.09} className="mt-9 max-w-[36rem] space-y-4">
              {PERKS.map((p, i) => (
                <motion.div key={p.k} variants={cardIn(i)} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-mint"
                  />
                  <p className="text-[0.92rem] leading-relaxed text-white/55">
                    <span className="font-medium text-white">{p.k}. </span>
                    {p.v}
                  </p>
                </motion.div>
              ))}
            </RevealGroup>

            <JoinedCounter />
          </div>

          <Reveal>
            <div className="rounded-3xl border border-white/12 bg-white/95 p-6 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-8">
              <h3 className="font-display text-[1.5rem] leading-snug font-semibold">
                Save your spot
              </h3>
              <p className="mt-2 mb-7 text-[0.88rem] leading-relaxed text-slate">
                Email is the only thing we need. The rest just helps us build the right
                thing first.
              </p>
              {/* Same call to action as the hero, so the page asks for the
                  signup in one voice rather than two. */}
              <WaitlistForm layout="full" submitLabel={`Secure ${OFFER.discount} off`} />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/**
 * Renders a real signup count, or nothing at all. It never invents one and no
 * longer leaves a placeholder in its place: set WAITLIST_COUNT in
 * config/site.ts (or return one from the worker) and the counter appears.
 */
function JoinedCounter() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.6 })
  const count = useCountUp(WAITLIST_COUNT ?? 0, inView)

  if (WAITLIST_COUNT === null) return null

  return (
    <Reveal variants={fade}>
      <p ref={ref} className="mt-9 flex items-baseline gap-3">
        <span className="tabular text-[2.4rem] leading-none font-semibold text-mint">
          {count.toLocaleString('en-US')}
        </span>
        <span className="text-[0.9rem] text-white/55">freelancers already waiting</span>
      </p>
    </Reveal>
  )
}
