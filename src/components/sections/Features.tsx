import { useState, type ComponentType } from 'react'
import { motion } from 'framer-motion'
import { CutText } from '../ui/CutText'
import { Reveal, RevealGroup } from '../ui/Reveal'
import { useTilt } from '../../hooks/useTilt'
import { cardIn } from '../../lib/motion'
import { cn } from '../../lib/cn'
import {
  VerdictFlip,
  VoiceSwap,
  RoiLine,
  ScoreClimb,
  FeedbackLoop,
  CrowdBars,
  SafeShield,
} from '../features/visuals'

type Feature = {
  title: string
  benefit: string
  detail: string
  Visual: ComponentType
  /** Bento spans — the grid is deliberately uneven. */
  span: string
}

const FEATURES: Feature[] = [
  {
    title: 'Know which jobs to attack',
    benefit: "Stop paying to enter contests you were never going to win.",
    detail:
      'The Decision Agent weighs 9+ signals: hire history, budget against your floor, how crowded the post is, how stale it is. All of it checked against data from proposals that won, so you get one call with a confidence score and its reasoning.',
    Visual: VerdictFlip,
    span: 'lg:col-span-3',
  },
  {
    title: 'Get Winning Proposals',
    benefit: 'Get read instead of skimmed and closed.',
    detail:
      "Drafts are built from proposals that got replies, then shaped to how you write. No opener about being excited. No paragraph the client has read forty times today.",
    Visual: VoiceSwap,
    span: 'lg:col-span-3',
  },
  {
    title: 'Track what connects return',
    benefit: 'Find out what your money has been buying.',
    detail:
      'Every decision is logged against what happened next: viewed, replied, interviewed, hired. Your cost per reply stops being a feeling.',
    Visual: RoiLine,
    span: 'lg:col-span-2',
  },
  {
    title: 'Your profile, audited',
    benefit: 'Get invited instead of ignored.',
    detail:
      'A scored read of your headline, overview and portfolio, with fixes ordered by what will move the needle first, not a checklist of forty tips.',
    Visual: ScoreClimb,
    span: 'lg:col-span-2',
  },
  {
    title: 'It learns your wins',
    benefit: 'Every application makes the next one sharper.',
    detail:
      'Log the outcome and it feeds back in. The system gets better at your niche, your rate band, your kind of client, rather than at freelancing in general.',
    Visual: FeedbackLoop,
    span: 'lg:col-span-2',
  },
  {
    title: 'Get in before the post gets crowded',
    benefit: 'Being early is half of winning on Upwork.',
    detail:
      "Reading a post properly takes ten minutes you don't have, so the jobs worth having are buried under proposals by the time you reach them. A verdict takes seconds, which is the difference between being proposal number four and number forty.",
    Visual: CrowdBars,
    span: 'lg:col-span-4',
  },
  {
    title: 'Nothing connected to your account',
    benefit: 'Your Upwork account is never in our hands.',
    detail:
      'Please note that LanceWise is not connected to your Upwork account in any way.',
    Visual: SafeShield,
    span: 'lg:col-span-2',
  },
]

export function Features() {
  return (
    <section
      id="features"
      className="scroll-mt-24 border-t border-rule bg-paper py-[clamp(5rem,11vw,9rem)]"
    >
      <div className="mx-auto max-w-[76rem] px-[var(--gutter)]">

        <div className="grid gap-x-16 gap-y-6 lg:grid-cols-[1.15fr_1fr] lg:items-end">
          <CutText
            text="Turn a guessing game into a repeatable process."
            accent={['process.']}
            className="text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.04] font-semibold"
          />
          <Reveal as="p" className="max-w-[46ch] text-[0.98rem] leading-relaxed text-slate">
            Seven things, and every one of them exists because a freelancer we know kept losing
            money to it. Nothing here is a feature looking for a problem.
          </Reveal>
        </div>

        <RevealGroup gap={0.09} className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} depth={i % 3} />
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}

function FeatureCard({ feature, depth }: { feature: Feature; depth: number }) {
  const { ref, onPointerEnter, onPointerMove, onPointerLeave, rotateX, rotateY, shiftX, shiftY } =
    useTilt(4.5)
  // Bumping the key remounts the visual, which replays its entrance.
  const [replay, setReplay] = useState(0)
  const { Visual } = feature

  return (
    <motion.article
      variants={cardIn(depth)}
      className={cn('group [perspective:1200px]', feature.span)}
    >
      <motion.div
        ref={ref}
        onPointerEnter={(e) => {
          onPointerEnter(e)
          setReplay((r) => r + 1)
        }}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className={cn(
          'glass flex h-full flex-col rounded-2xl p-6 sm:p-7',
          /* The card tilts to the pointer, so it reads as an object you are
             manipulating. A text I-beam over it suggests an editable field,
             which is the wrong affordance. Text stays selectable — only the
             cursor shape changes. */
          'cursor-default',
          'transition-[box-shadow,border-color] duration-500 [transition-timing-function:var(--ease-out-quint)]',
          'group-hover:border-rule-strong group-hover:shadow-[0_1px_2px_rgba(46,125,50,0.05),0_28px_54px_-26px_rgba(46,125,50,0.42)]',
        )}
      >
        <motion.div style={{ x: shiftX, y: shiftY, translateZ: 36 }} className="mb-6">
          <Visual key={replay} />
        </motion.div>

        <motion.div style={{ x: shiftX, translateZ: 18 }} className="mt-auto">
          <h3 className="font-display text-[1.28rem] leading-snug font-semibold">{feature.title}</h3>
          <p className="mt-2 text-[0.92rem] font-medium text-forest">{feature.benefit}</p>
          <p className="mt-3 text-[0.88rem] leading-relaxed text-slate">{feature.detail}</p>
        </motion.div>
      </motion.div>
    </motion.article>
  )
}
