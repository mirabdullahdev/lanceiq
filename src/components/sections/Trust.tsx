import { motion } from 'framer-motion'
import { CutText } from '../ui/CutText'
import { Reveal, RevealGroup } from '../ui/Reveal'
import { cardIn, fade } from '../../lib/motion'

/** The four things LanceWise does, stated plainly. */
const CAPABILITIES = [
  {
    part: 'Job decisions',
    detail:
      'Paste a Job Post, then let our agent give you a recommendation with the reasoning behind it.',
  },
  {
    part: 'Proposal drafts',
    detail: 'Get the proposal crafted expertly by AI.',
  },
  {
    part: 'Connect tracking',
    detail: 'Every decision logged against what happened next, down to your cost per reply.',
  },
  {
    part: 'Profile review',
    detail: 'Your profile compared against Top-Rated profiles.',
  },
]

export function Trust() {
  return (
    <section className="relative overflow-hidden border-t border-rule bg-tint py-[clamp(5rem,11vw,9rem)]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(90%_60%_at_15%_0%,rgba(114,219,151,0.12),transparent_60%)]"
      />

      <div className="relative mx-auto max-w-[76rem] px-[var(--gutter)]">

        {/* Headline and story share the full width, so the story reads as a
            column beside the title rather than a narrow strip under it. */}
        <div className="grid gap-x-16 gap-y-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <CutText
            text="LanceWise came out of a simple frustration"
            accent={['frustration']}
            className="max-w-[15ch] text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.04] font-semibold"
          />

          <Reveal variants={fade}>
            <div className="max-w-[58ch] space-y-5 text-[1.02rem] leading-relaxed text-slate">
              <p>
                Freelancers are asked to pay to apply, with less information than the person they're
                applying to.
              </p>
              <p>
                We spent months working out how to fix that. What predicts a reply, what a wasted
                connect looks like before you spend it, and how to show the reasoning instead of
                handing down a score. Our goal is narrow and we'd rather keep it that way: help good
                freelancers stop paying for bad bets.
              </p>
            </div>
          </Reveal>
        </div>

        <RevealGroup gap={0.1} className="mt-16 grid gap-x-10 gap-y-11 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map(({ part, detail }, i) => (
            <motion.div
              key={part}
              variants={cardIn(i % 2)}
              className="border-t border-rule-strong pt-5"
            >
              <h4 className="font-display text-[1.18rem] leading-snug font-semibold text-graphite">
                {part}
              </h4>
              <p className="mt-2.5 text-[0.89rem] leading-relaxed text-slate">{detail}</p>
            </motion.div>
          ))}
        </RevealGroup>

        <Reveal variants={fade}>
          <p className="mt-12 max-w-[52ch] text-[0.85rem] leading-relaxed text-slate">
            Built for Upwork first, because that's where the connect economics hurt most.
          </p>
        </Reveal>

      </div>
    </section>
  )
}
