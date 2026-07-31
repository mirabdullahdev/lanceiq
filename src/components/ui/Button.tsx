import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'ghost'

const base =
  'group relative inline-flex items-center justify-center gap-2 rounded-full font-medium ' +
  'transition-[transform,box-shadow,background-color,border-color] duration-400 ' +
  '[transition-timing-function:var(--ease-out-quint)] ' +
  'active:translate-y-px disabled:pointer-events-none disabled:opacity-55'

const variants: Record<Variant, string> = {
  /* Mint is a surface, never text. Near-black on #72DB97 clears AA with room
     to spare, and it looks far less generic than white-on-green. */
  primary:
    'bg-mint text-ink shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_10px_24px_-12px_rgba(46,125,50,0.65)] ' +
    'hover:-translate-y-0.5 hover:bg-[#65d18c] hover:shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_18px_34px_-14px_rgba(46,125,50,0.7)]',
  ghost:
    'border border-rule-strong bg-white/60 text-graphite backdrop-blur-sm ' +
    'hover:-translate-y-0.5 hover:border-forest/40 hover:bg-haze',
}

const sizes = {
  md: 'h-11 px-5 text-[0.9rem]',
  lg: 'h-[3.25rem] px-7 text-[0.975rem]',
} as const

type Props = ComponentPropsWithoutRef<'button'> & {
  variant?: Variant
  size?: keyof typeof sizes
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', className, children, ...rest }: Props) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  )
}

type LinkProps = ComponentPropsWithoutRef<'a'> & {
  variant?: Variant
  size?: keyof typeof sizes
  children: ReactNode
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: LinkProps) {
  return (
    <a className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </a>
  )
}

/** The arrow that nudges on hover. Used inside button labels. */
export function Nudge() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4 transition-transform duration-400 [transition-timing-function:var(--ease-out-quint)] group-hover:translate-x-1"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M2.5 8h11m0 0L9.5 4m4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
