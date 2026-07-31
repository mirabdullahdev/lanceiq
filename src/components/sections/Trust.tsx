import { motion } from 'framer-motion'
import { CutText } from '../ui/CutText'
import { SectionLabel } from '../ui/SectionLabel'
import { Reveal, RevealGroup } from '../ui/Reveal'
import { LatticeMark } from '../ui/Wordmark'
import { cardIn, fade } from '../../lib/motion'

/** The four things LanceWise does, stated plainly. */
const CAPABILITIES = [
  {
    part: 'Job decisions',
    detail: 'Paste a Job Post, then let our agent recommend you with the reasoning behind it.',
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
        <Reveal>
          <SectionLabel index="04">Who's building this</SectionLabel>
        </Reveal>

        {/* Headline and story share the full width, so the story reads as a
            column beside the title rather than a narrow strip under it. */}
        <div className="mt-10 grid gap-x-16 gap-y-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
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

        <Reveal>
          <h3 className="ledger-label mt-16">Our features</h3>
        </Reveal>

        <RevealGroup gap={0.1} className="mt-10 grid gap-x-10 gap-y-11 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* The place a testimonial wall would go, and why there isn't one.
            Set as a full-width pull quote rather than a small card, because
            it is the most load-bearing sentence in the section. */}
        <Reveal>
          <figure className="mt-16 grid gap-8 border-t border-rule pt-12 lg:grid-cols-[1fr_17rem] lg:gap-16">
            <blockquote className="font-display text-[clamp(1.4rem,2.7vw,2.05rem)] leading-[1.32] font-medium text-graphite">
              There are no testimonials on this page yet, because nobody outside our testing group
              has used it. When there are quotes here, they'll be real people with real names who
              agreed to be quoted.
            </blockquote>
            <figcaption className="text-[0.85rem] leading-relaxed text-slate lg:pt-2">
              <LatticeMark className="h-6 w-6" />
              <span className="mt-4 block font-medium text-graphite">The LanceWise team</span>
              <span className="mt-1 block">Still small enough to reply to you personally</span>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  )
}
