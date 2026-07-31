import { cn } from '../../lib/cn'

/** `01 / THE PROBLEM ————————` — the ledger rule that binds the page together. */
export function SectionLabel({
  index,
  children,
  tone = 'light',
  className,
}: {
  index: string
  children: string
  /** `dark` = sitting on the dark closing section. */
  tone?: 'light' | 'dark'
  className?: string
}) {
  /* The index is content, so it has to clear AA: forest/55 came out at
     2.2:1 on white and mint/55 at 3.5:1 on the dark section. Full strength
     is 5.2:1 and 8.0:1. The slash is decorative and aria-hidden, so it can
     stay quiet. */
  const dim = tone === 'dark' ? 'text-mint' : 'text-forest'
  const faint = tone === 'dark' ? 'text-mint/45' : 'text-forest/45'

  return (
    <div className={cn('ledger-label', tone === 'dark' && 'ledger-label-invert', className)}>
      <span className={cn('tabular', dim)}>{index}</span>
      <span aria-hidden="true" className={faint}>
        /
      </span>
      <span>{children}</span>
    </div>
  )
}
