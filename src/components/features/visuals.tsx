import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useCountUp } from '../../hooks/useCountUp'
import { EASE } from '../../lib/motion'
import { cn } from '../../lib/cn'

/**
 * One small, purpose-built animation per feature. Each plays once when it
 * scrolls in — the parent card replays it on hover by bumping a key.
 * Nothing here loops forever; seven perpetual animations would be noise.
 */

const shell = 'relative flex h-28 w-full items-center justify-center overflow-hidden'

/* 01 — the verdict flips from Skip to Apply */
export function VerdictFlip() {
  const reduce = useReducedMotion()
  return (
    <div className={shell}>
      <div className="[perspective:900px]">
        <motion.div
          initial={reduce ? false : { rotateY: 0 }}
          animate={{ rotateY: 180 }}
          transition={{ duration: 1.1, ease: EASE.quint, delay: 0.35 }}
          className="relative h-[3.4rem] w-[9.5rem] [transform-style:preserve-3d]"
        >
          <Face className="border-rule bg-mist text-slate">Skip</Face>
          <Face className="border-transparent bg-mint text-ink [transform:rotateY(180deg)]">
            Apply
          </Face>
        </motion.div>
      </div>
    </div>
  )
}

function Face({ className, children }: { className: string; children: string }) {
  return (
    <span
      className={`absolute inset-0 flex items-center justify-center rounded-xl border font-mono text-[0.8rem] font-semibold tracking-[0.18em] uppercase [backface-visibility:hidden] ${className}`}
    >
      {children}
    </span>
  )
}

/* 02 — template copy struck through, real copy arrives underneath */
export function VoiceSwap() {
  return (
    <div className={`${shell} flex-col items-start justify-center gap-2 px-1`}>
      <div className="relative w-full">
        <span className="block text-[0.8rem] text-slate">
          "I am excited to apply for this position…"
        </span>
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, ease: EASE.quint, delay: 0.4 }}
          className="absolute top-1/2 left-0 h-px w-full origin-left bg-ember/70"
        />
      </div>
      <motion.span
        initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.75, ease: EASE.quint, delay: 0.9 }}
        className="block text-[0.85rem] leading-snug font-medium text-graphite"
      >
        "Every issue links to its source, not a black-box score."
      </motion.span>
    </div>
  )
}

/* 03 — return on connects, drawn as a line that actually gets drawn */
export function RoiLine() {
  const pts = [0, 14, 9, 26, 22, 41, 38, 58, 72]
  const d = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i / (pts.length - 1)) * 100} ${72 - p}`)
    .join(' ')

  return (
    <div className={shell}>
      <svg viewBox="0 0 100 76" className="h-full w-full" aria-hidden="true" preserveAspectRatio="none">
        <defs>
          <linearGradient id="roi-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#72db97" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#72db97" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[18, 36, 54].map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="var(--color-rule)" strokeWidth="0.5" />
        ))}
        <motion.path
          d={`${d} L 100 76 L 0 76 Z`}
          fill="url(#roi-fill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.1 }}
        />
        <motion.path
          d={d}
          fill="none"
          stroke="var(--color-forest)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: EASE.quint, delay: 0.3 }}
        />
      </svg>
    </div>
  )
}

/* 04 — profile score climbing */
export function ScoreClimb() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 })
  const score = useCountUp(94, inView, 1500)
  const shown = inView ? Math.max(62, score) : 62
  const circumference = 2 * Math.PI * 30

  return (
    <div ref={ref} className={shell}>
      <svg viewBox="0 0 76 76" className="h-24 w-24 -rotate-90" aria-hidden="true">
        <circle cx="38" cy="38" r="30" fill="none" stroke="var(--color-haze)" strokeWidth="5" />
        <circle
          cx="38"
          cy="38"
          r="30"
          fill="none"
          stroke="var(--color-mint)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - shown / 100)}
        />
      </svg>
      <span className="tabular absolute text-[1.4rem] font-semibold text-graphite">{shown}</span>
    </div>
  )
}

/* 05 — the outcome loop closing on itself */
export function FeedbackLoop() {
  const labels = ['Apply', 'Outcome', 'Sharper']
  return (
    <div className={shell}>
      <svg viewBox="0 0 120 92" className="h-full" aria-hidden="true">
        <motion.circle
          cx="60"
          cy="46"
          r="30"
          fill="none"
          stroke="var(--color-forest)"
          strokeWidth="1.2"
          strokeOpacity="0.5"
          strokeDasharray="4 5"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: -90 }}
          style={{ transformOrigin: '60px 46px' }}
          transition={{ duration: 1.3, ease: EASE.quint, delay: 0.25 }}
        />
        {labels.map((label, i) => {
          const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3
          const cx = 60 + Math.cos(a) * 30
          const cy = 46 + Math.sin(a) * 30
          return (
            <motion.g
              key={label}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: EASE.spring, delay: 0.5 + i * 0.22 }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            >
              <circle cx={cx} cy={cy} r="5" fill="var(--color-mint)" />
              <text
                x={cx}
                y={cy + (i === 0 ? -11 : 16)}
                textAnchor="middle"
                className="fill-slate font-mono text-[8px] tracking-wide"
              >
                {label}
              </text>
            </motion.g>
          )
        })}
      </svg>
    </div>
  )
}

/* 06 — how fast a good post fills up, and where you want to be standing.
   Vertical bars deliberately: the other two chart-ish visuals on this page
   are a line and a dial, so this one has to read differently at a glance. */
export function CrowdBars() {
  const bars = [12, 28, 45, 60, 74, 85, 93, 100]
  return (
    <div className="flex h-28 w-full flex-col justify-end gap-2.5">
      <div className="flex h-[4.5rem] items-end gap-1.5">
        {bars.map((b, i) => (
          <motion.span
            key={i}
            initial={{ height: '0%' }}
            animate={{ height: `${b}%` }}
            transition={{ duration: 0.7, ease: EASE.quint, delay: 0.15 + i * 0.07 }}
            className={cn('flex-1 rounded-t-[3px]', i < 2 ? 'bg-mint' : 'bg-haze')}
          />
        ))}
      </div>
      <div className="flex items-baseline justify-between font-mono text-[0.62rem] tracking-wide">
        <span className="text-forest">You, first hours</span>
        <span className="text-slate">By hour 24</span>
      </div>
    </div>
  )
}

/* 07 — nothing connected, nothing to breach */
export function SafeShield() {
  return (
    <div className={shell}>
      <svg viewBox="0 0 64 72" className="h-[4.6rem]" aria-hidden="true">
        <motion.path
          d="M32 4 58 14v22c0 16-11 27-26 32C17 63 6 52 6 36V14L32 4Z"
          fill="rgba(114,219,151,0.14)"
          stroke="var(--color-forest)"
          strokeWidth="1.4"
          strokeOpacity="0.55"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: EASE.quint, delay: 0.2 }}
        />
        <motion.path
          d="M21 36 29 44 44 27"
          fill="none"
          stroke="var(--color-forest)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: EASE.quint, delay: 1 }}
        />
      </svg>
    </div>
  )
}
