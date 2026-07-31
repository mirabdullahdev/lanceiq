import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE } from '../../lib/motion'
import { cn } from '../../lib/cn'

/**
 * Illustrative mock-ups of LanceWise's own interface. The client, the numbers
 * and the copy are invented examples of what the product outputs. They are
 * not real client data and are never presented as such.
 */

const JOB_POST = `The RFP seeks an AI-powered quality-assurance system that reviews glazing shop drawings against architectural, structural, manufacturer, and project documents to catch errors before fabrication and installation. The preferred solution should use a lean stack such as Airtable, n8n, cloud file storage, AI models, and Bluebeam, with human review, source-backed findings, and ongoing maintenance. RFP attached.`

/* ------------------------------------------------------------------ *
 * 01. Paste
 * ------------------------------------------------------------------ */

export function PasteStep() {
  const reduce = useReducedMotion()
  const [chars, setChars] = useState(reduce ? JOB_POST.length : 0)

  useEffect(() => {
    if (reduce) return
    setChars(0)
    // Types in bursts, the way a paste-then-settle feels, not one char at a time.
    const id = window.setInterval(() => {
      setChars((c) => {
        if (c >= JOB_POST.length) {
          window.clearInterval(id)
          return c
        }
        return Math.min(c + 4, JOB_POST.length)
      })
    }, 16)
    return () => window.clearInterval(id)
  }, [reduce])

  const done = chars >= JOB_POST.length

  return (
    <div className="rounded-2xl border border-rule bg-white/85 p-5 shadow-[0_18px_40px_-28px_rgba(46,125,50,0.5)] sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-[0.64rem] tracking-[0.16em] text-forest uppercase">
          Job post
        </span>
        <span className="tabular text-[0.7rem] text-slate">{chars} / 2000</span>
      </div>

      <p className="min-h-[11rem] text-[0.92rem] leading-relaxed text-ink">
        {JOB_POST.slice(0, chars)}
        {!done && (
          <motion.span
            aria-hidden="true"
            animate={{ opacity: [1, 0.15, 1] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
            className="ml-px inline-block h-[1.05em] w-[2px] translate-y-[0.16em] bg-forest"
          />
        )}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * 02. Decision
 * ------------------------------------------------------------------ */

type Tone = 'good' | 'ok' | 'bad'

const FACTORS: { label: string; value: string; weight: number; tone: Tone }[] = [
  { label: 'Client hire rate', value: '86%', weight: 0.86, tone: 'good' },
  /* The RFP names no budget, so the engine says so rather than inventing a
     number. A demo where every row scores green reads as a mock-up. */
  { label: 'Budget vs your floor', value: 'Not stated in RFP', weight: 0.4, tone: 'ok' },
  { label: 'Skill overlap with your profile', value: '91%', weight: 0.91, tone: 'good' },
  { label: 'Proposals already in', value: '6', weight: 0.7, tone: 'good' },
  { label: 'Post age', value: '3h', weight: 0.82, tone: 'good' },
  { label: 'Client lifetime spend', value: '$71k', weight: 0.88, tone: 'good' },
  { label: 'Payment verified', value: 'Yes', weight: 1, tone: 'good' },
  { label: 'Scope clarity', value: 'Maintenance undefined', weight: 0.38, tone: 'ok' },
  { label: 'Rehire signal', value: 'Repeat hires', weight: 0.8, tone: 'good' },
]

export function VerdictStep() {
  return (
    <div className="rounded-2xl border border-rule bg-white/85 p-5 shadow-[0_18px_40px_-28px_rgba(46,125,50,0.5)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-rule pb-5">
        <div>
          <span className="font-mono text-[0.64rem] tracking-[0.16em] text-forest uppercase">
            Decision
          </span>
          <div className="mt-2 flex items-center gap-3">
            <motion.span
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: EASE.spring, delay: 0.15 }}
              className="rounded-full bg-mint px-3.5 py-1 font-mono text-[0.72rem] font-semibold tracking-[0.14em] text-ink uppercase"
            >
              Apply
            </motion.span>
            <span className="text-[0.88rem] text-slate">12 connects, worth it</span>
          </div>
        </div>

        <div className="text-right">
          <span className="font-mono text-[0.62rem] tracking-[0.14em] text-slate uppercase">
            Confidence
          </span>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE.quint, delay: 0.25 }}
            className="tabular text-[2rem] leading-none font-semibold text-forest"
          >
            88%
          </motion.div>
        </div>
      </div>

      <ul className="mt-5 space-y-2.5">
        {FACTORS.map((f, i) => (
          <li key={f.label} className="flex items-center gap-3">
            <span className="w-[9.5rem] shrink-0 text-[0.79rem] text-slate sm:w-[12rem]">
              {f.label}
            </span>
            <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-haze">
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: f.weight }}
                transition={{ duration: 0.75, ease: EASE.quint, delay: 0.25 + i * 0.055 }}
                className={cn(
                  'block h-full origin-left rounded-full',
                  f.tone === 'good' ? 'bg-mint' : f.tone === 'ok' ? 'bg-[#e0b050]' : 'bg-ember',
                )}
              />
            </span>
            <span className="tabular w-[8.5rem] shrink-0 text-right text-[0.75rem] text-graphite">
              {f.value}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-5 border-t border-rule pt-4 text-[0.82rem] leading-relaxed text-slate">
        <span className="font-medium text-graphite">Why: </span>
        client is verified, had spent money, this is also not a very competitive job post, and your
        profile match to the job posting is greater than 86%
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * 03. Crafted proposal
 * ------------------------------------------------------------------ */

/* Split at the sentence break purely so the two blocks can stagger in.
   The wording is verbatim; join them back into one string if you'd rather it
   render as a single paragraph. */
const PROPOSAL = [
  "Having worked on construction and engineering document workflows, we're familiar with the challenges of dealing with multiple drawing revisions, conflicting specifications, manufacturer requirements, and maintaining a reliable audit trail.",
  'Accuracy and explainability are far more important than simply generating a large number of findings, so every issue raised by the system would be linked to supporting evidence instead of being a black-box recommendation.',
]

export function ProposalStep() {
  const reduce = useReducedMotion()
  return (
    <div className="rounded-2xl border border-rule bg-white/85 p-5 shadow-[0_18px_40px_-28px_rgba(46,125,50,0.5)] sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-4">
        <span className="font-mono text-[0.64rem] tracking-[0.16em] text-forest uppercase">
          Draft proposal
        </span>
        <span className="text-[0.75rem] text-slate">Matched to your last 4 winning proposals</span>
      </div>

      <div className="space-y-4">
        {PROPOSAL.map((line, i) => (
          <motion.p
            key={i}
            initial={reduce ? false : { opacity: 0, y: 10, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, ease: EASE.quint, delay: 0.2 + i * 0.35 }}
            className="text-[0.92rem] leading-relaxed text-ink"
          >
            {line}
          </motion.p>
        ))}
      </div>
    </div>
  )
}
