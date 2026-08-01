import { Wordmark } from '../ui/Wordmark'
import { SITE } from '../../config/site'

const YEAR = new Date().getFullYear()

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M17.53 3h3.02l-6.6 7.54L21.75 21h-5.99l-4.69-6.13L5.7 21H2.68l7.06-8.07L2.25 3h6.14l4.24 5.6L17.53 3Zm-1.06 16.2h1.67L7.6 4.71H5.81L16.47 19.2Z"
      />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.65h.05a4.17 4.17 0 0 1 3.75-2.06c4 0 4.75 2.64 4.75 6.07V21h-4v-5.4c0-1.29-.02-2.94-1.79-2.94-1.8 0-2.07 1.4-2.07 2.85V21h-4V9Z"
      />
    </svg>
  )
}

const SOCIALS = [
  { href: SITE.twitter, label: 'LanceWise on X', Icon: XIcon },
  { href: SITE.linkedin, label: 'LanceWise on LinkedIn', Icon: LinkedInIcon },
]

const PAGE_LINKS = [
  { href: '#problem', label: 'The problem' },
  { href: '#how', label: 'How it works' },
  { href: '#features', label: 'What you get' },
  { href: '#waitlist', label: 'Join the waitlist' },
]

const COMPANY_LINKS = [
  { href: '#', label: 'Privacy policy' },
  { href: '#', label: 'Terms' },
  { href: 'mailto:hello@lancewise.com', label: 'hello@lancewise.com' },
]

export function Footer() {
  return (
    /* Set in Poppins and tightened considerably. The previous version used
       2.5-unit gaps between links, 14-unit section padding and mono uppercase
       column headings, which left the columns looking loose and unrelated.
       Everything here is deliberately close together so each column reads as
       one block. */
    <footer className="border-t border-rule bg-paper font-[family-name:var(--font-footer)]">
      <div className="mx-auto max-w-[76rem] px-[var(--gutter)] py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-[30ch]">
            <Wordmark />
            <p className="mt-3 text-[0.82rem] leading-snug text-slate">
              A decision engine for freelancers who'd rather know than hope.
            </p>
            <div className="mt-4 flex gap-2">
              {SOCIALS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  rel="me noopener noreferrer"
                  target="_blank"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-rule text-slate transition-colors duration-300 hover:border-rule-strong hover:bg-haze hover:text-forest"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Footer" className="flex gap-x-14 gap-y-7 max-sm:flex-col">
            <FooterColumn title="Page" links={PAGE_LINKS} />
            <FooterColumn title="Company" links={COMPANY_LINKS} />
          </nav>
        </div>

        <div className="mt-9 flex flex-col gap-2 border-t border-rule pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.76rem] text-slate">
            © {YEAR} LanceWise. Not affiliated with, endorsed by, or connected to Upwork Global Inc.
          </p>
          <p className="text-[0.76rem] text-slate/80">
            Built between client deadlines, which is rather the point.
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { href: string; label: string }[]
}) {
  return (
    <div>
      <p className="mb-2 text-[0.72rem] font-medium tracking-wide text-graphite">{title}</p>
      <ul className="space-y-1">
        {links.map((l) => (
          <li key={l.label}>
            <FooterLink href={l.href}>{l.label}</FooterLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      className="inline-block py-0.5 text-[0.82rem] text-slate transition-colors duration-300 hover:text-forest"
    >
      {children}
    </a>
  )
}
