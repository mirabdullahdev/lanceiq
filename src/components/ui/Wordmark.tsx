import { cn } from '../../lib/cn'

/**
 * The brand mark.
 *
 * Fixed dimensions on the <img> rather than height alone: without an intrinsic
 * size the browser reserves no space for it, and the wordmark next to it jumps
 * sideways the moment the image decodes. Being in the header makes that a
 * visible layout shift on every cold load.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt=""
      width={320}
      height={306}
      decoding="async"
      className={cn('h-7 w-auto', className)}
    />
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="font-display text-[1.35rem] leading-none font-semibold tracking-[-0.03em] text-graphite">
        Lance
        <span className="text-forest">Wise</span>
      </span>
    </span>
  )
}
