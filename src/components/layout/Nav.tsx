import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Wordmark } from '../ui/Wordmark'
import { ButtonLink } from '../ui/Button'
import { cn } from '../../lib/cn'
import { EASE } from '../../lib/motion'

const LINKS = [
  { href: '#problem', label: 'The problem' },
  { href: '#how', label: 'How it works' },
  { href: '#features', label: 'What you get' },
]

export function Nav() {
  const [lifted, setLifted] = useState(false)

  useEffect(() => {
    // Threshold is one viewport-ish so the bar only solidifies once the hero
    // canvas is behind you — no flicker at the top of the page.
    const onScroll = () => setLifted(window.scrollY > 64)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, ease: EASE.quint, delay: 0.15 }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={cn(
          'transition-[background-color,border-color,backdrop-filter,box-shadow] duration-500',
          '[transition-timing-function:var(--ease-out-quint)]',
          lifted
            ? 'border-b border-rule bg-white/78 shadow-[0_1px_24px_-14px_rgba(46,125,50,0.5)] backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        <nav
          aria-label="Primary"
          className="mx-auto flex h-[4.5rem] max-w-[76rem] items-center justify-between px-[var(--gutter)]"
        >
          <a href="#top" className="rounded-md" aria-label="LanceWise, back to top">
            <Wordmark />
          </a>

          <ul className="hidden items-center gap-9 md:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="group relative text-[0.875rem] text-slate transition-colors duration-300 hover:text-graphite"
                >
                  {l.label}
                  <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-forest/50 transition-[width] duration-400 [transition-timing-function:var(--ease-out-quint)] group-hover:w-full" />
                </a>
              </li>
            ))}
          </ul>

          <ButtonLink href="#waitlist" size="md" className="px-4 text-[0.85rem] sm:px-5">
            Join the waitlist
          </ButtonLink>
        </nav>
      </div>
    </motion.header>
  )
}
