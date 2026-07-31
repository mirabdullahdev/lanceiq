import { useEffect, useId, useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { CutText } from '../ui/CutText'
import { Reveal } from '../ui/Reveal'
import { useCountUp } from '../../hooks/useCountUp'
import { BURN_MODEL } from '../../config/site'
import { setBurn } from '../../state/burnStore'
import { EASE, fade } from '../../lib/motion'

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function Problem() {
  const [proposals, setProposals] = useState<number>(BURN_MODEL.proposalsPerWeek)
  const [connects, setConnects] = useState<number>(BURN_MODEL.connectsPerProposal)
  const [touched, setTouched] = useState(false)

  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.4 })

  const annual = Math.round(
    proposals * connects * BURN_MODEL.weeksPerYear * BURN_MODEL.connectPriceUsd,
  )
  const connectsPerYear = proposals * connects * BURN_MODEL.weeksPerYear

  // Counts up on first view; after that the slider drives it directly, or the
  // number would re-animate on every drag and feel broken.
  const animated = useCountUp(annual, inView && !touched)
  const shown = touched ? annual : animated

  // Publish to the floating chip so it carries their number, not a made-up one.
  useEffect(() => {
    if (touched) setBurn(annual)
  }, [annual, touched])

  return (
    <section
      id="problem"
      className="relative scroll-mt-24 overflow-hidden border-y border-rule bg-tint py-[clamp(5rem,11vw,9rem)]"
    >
      <div
        aria-hidden="true"
        className="hairline-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(80%_70%_at_50%_40%,#000,transparent_75%)]"
      />

      <div className="relative mx-auto max-w-[76rem] px-[var(--gutter)]">

        <div className="grid gap-x-16 gap-y-12 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-start">
          <div>
            <CutText
              text="Freelancers burn $3,000 a year on connects that never pay off"
              accent={['$3,000']}
              className="max-w-[17ch] text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.04] font-semibold"
            />

            <Reveal variants={fade}>
              <div className="mt-8 max-w-[52ch] space-y-5 text-[1.02rem] leading-relaxed text-slate">
                <p>
                  You read the job listing, it looks fine, so you apply, write a proposal, hit
                  submit, and don't get a response.
                </p>
                <p>
                  Do that week after week and the money stops being trivial. But the money isn't
                  even the worst part. It's that you have{' '}
                  <span className="font-medium text-graphite">
                    no idea which of those proposals were ever winnable
                  </span>
                  , so next week you do exactly the same thing and hope.
                </p>
                <p className="text-graphite">That's not a business. That's a slot machine.</p>
              </div>
            </Reveal>
          </div>

          {/* The receipt. Their numbers, their arithmetic, nothing invented. */}
          <Reveal>
            <figure ref={ref} className="glass rounded-2xl p-6 sm:p-8">
              <Slider
                label="Proposals a week"
                value={proposals}
                min={2}
                max={40}
                onChange={(v) => {
                  setProposals(v)
                  setTouched(true)
                }}
              />
              <Slider
                label="Connects per proposal"
                value={connects}
                min={4}
                max={30}
                onChange={(v) => {
                  setConnects(v)
                  setTouched(true)
                }}
              />

              <dl className="mt-7 space-y-2.5 border-t border-rule pt-5 text-[0.83rem]">
                <Row k="Price per connect" v={`$${BURN_MODEL.connectPriceUsd.toFixed(2)}`} />
                <Row k="Weeks worked" v={String(BURN_MODEL.weeksPerYear)} />
                <Row k="Connects a year" v={connectsPerYear.toLocaleString('en-US')} />
              </dl>

              <div className="mt-5 flex items-end justify-between border-t-2 border-rule-strong pt-5">
                <span className="max-w-[9rem] text-[0.83rem] leading-snug text-slate">
                  Spent on connects, every year
                </span>
                <motion.span
                  key={shown}
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25, ease: EASE.quint }}
                  className="tabular text-[clamp(1.75rem,3.4vw,2.5rem)] leading-none font-semibold text-forest"
                >
                  {usd.format(shown)}
                </motion.span>
              </div>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="flex flex-1 items-baseline gap-3 text-slate">
        <span className="shrink-0">{k}</span>
        {/* Dotted leader, like a printed invoice. */}
        <span
          aria-hidden="true"
          className="h-px flex-1 translate-y-[-0.2em] bg-[repeating-linear-gradient(to_right,var(--color-rule)_0_2px,transparent_2px_5px)]"
        />
      </dt>
      <dd className="tabular shrink-0 text-graphite">{v}</dd>
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  const id = useId()
  return (
    <div className="mb-5">
      <div className="mb-1 flex items-baseline justify-between">
        <label htmlFor={id} className="text-[0.83rem] text-slate">
          {label}
        </label>
        <output htmlFor={id} className="tabular text-[0.95rem] font-semibold text-graphite">
          {value}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}
