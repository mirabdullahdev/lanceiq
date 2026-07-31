import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { CutText } from '../ui/CutText'
import { WaitlistForm } from '../ui/WaitlistForm'
import { LatticeStill } from '../three/LatticeStill'
import { useHeavyVisuals } from '../../hooks/useHeavyVisuals'
import { EASE } from '../../lib/motion'
import { OFFER } from '../../config/site'

const HeroField = lazy(() => import('../three/HeroField'))

export function Hero() {
  const webgl = useHeavyVisuals()
  // The canvas stops rendering the moment the hero leaves the viewport.
  const { ref: heroRef, inView } = useInView({ threshold: 0 })

  return (
    <section id="top" ref={heroRef} className="relative isolate overflow-hidden">
      {/* Light wash — the page's only gradient, and it's one hue. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[radial-gradient(120%_85%_at_78%_18%,#f0fbf4_0%,#f8fff9_38%,#ffffff_72%)]"
      />

      {/* The lattice, behind two masks.
          The radial one alone left the field at roughly 40% strength straight
          through the headline, which made the copy hard to read. The outer
          linear mask clears the left third — the whole text column — so the
          field is only really present in the open space to the right. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.16)_30%,rgba(0,0,0,0.55)_54%,#000_78%)]"
      >
        <div className="h-full w-full opacity-90 [mask-image:radial-gradient(105%_105%_at_70%_45%,#000_20%,rgba(0,0,0,0.62)_55%,transparent_88%)]">
          {webgl ? (
            <Suspense fallback={<LatticeStill />}>
              <HeroField active={inView} />
            </Suspense>
          ) : (
            <LatticeStill />
          )}
        </div>
      </div>

      <div className="mx-auto flex min-h-[100svh] max-w-[76rem] flex-col justify-center px-[var(--gutter)] pt-32 pb-16">
        <CutText
          as="h1"
          text="Stop gambling on Upwork. Start winning with data."
          accent={['data']}
          delay={0.15}
          stagger={0.06}
          className="max-w-[17ch] text-[clamp(2.6rem,6.4vw,5rem)] leading-[0.98] font-semibold"
        />

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: EASE.quint, delay: 0.7 }}
          className="mt-7 max-w-[46ch] text-[clamp(1rem,1.5vw,1.15rem)] leading-relaxed text-slate"
        >
          LanceWise reads a job post and tells you whether it's worth your connects, drafts the
          proposal in your own voice, and keeps a running tally of what every connect earned you.
          Join the waitlist and lock in {OFFER.discount} off for your first{' '}
          {OFFER.months} months.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: EASE.quint, delay: 0.85 }}
          className="mt-9 flex max-w-[34rem] flex-col gap-4"
        >
          <WaitlistForm layout="inline" />
          <a
            href="#how"
            className="group inline-flex w-fit items-center gap-2 text-[0.875rem] font-medium text-graphite"
          >
            <span className="border-b border-rule-strong pb-0.5 transition-colors duration-300 group-hover:border-forest">
              See how it works
            </span>
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-400 [transition-timing-function:var(--ease-out-quint)] group-hover:translate-y-0.5" aria-hidden="true">
              <path
                d="M8 2.5v11m0 0 4-4m-4 4-4-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  )
}
