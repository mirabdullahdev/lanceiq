import { cn } from '../../lib/cn'

/**
 * The mark is a 3×3 lattice of job nodes with exactly one lit — the same
 * idea as the hero field, reduced to 16px. Most jobs are noise; one is worth
 * your connects.
 */
export function LatticeMark({ className }: { className?: string }) {
  const dots = [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => [c, r] as const))
  return (
    <svg viewBox="0 0 20 20" className={cn('h-5 w-5', className)} aria-hidden="true" focusable="false">
      <g>
        {dots.map(([c, r]) => {
          const lit = c === 2 && r === 0
          return (
            <circle
              key={`${c}-${r}`}
              cx={4 + c * 6}
              cy={4 + r * 6}
              r={lit ? 2.6 : 1.15}
              fill={lit ? 'var(--color-mint)' : 'var(--color-rule-strong)'}
            />
          )
        })}
      </g>
      <path
        d="M4 16 L10 10 L16 4"
        fill="none"
        stroke="var(--color-forest)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-baseline gap-2', className)}>
      <LatticeMark className="translate-y-[3px]" />
      <span className="font-display text-[1.35rem] leading-none font-semibold tracking-[-0.03em] text-graphite">
        Lance
        <span className="text-forest">Wise</span>
      </span>
    </span>
  )
}
