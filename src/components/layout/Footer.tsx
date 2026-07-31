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

export function Footer() {
  return (
    <footer className="border-t border-rule bg-paper">
      <div className="mx-auto max-w-[76rem] px-[var(--gutter)] py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-[32ch]">
            <Wordmark />
            <p className="mt-4 text-[0.85rem] leading-relaxed text-slate">
              A decision engine for freelancers who'd rather know than hope.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-10 gap-y-6">
            <ul className="space-y-2.5 text-[0.85rem]">
              <li className="font-mono text-[0.66rem] tracking-[0.16em] text-forest uppercase">
                Page
              </li>
              <li>
                <FooterLink href="#problem">The problem</FooterLink>
              </li>
              <li>
                <FooterLink href="#how">How it works</FooterLink>
              </li>
              <li>
                <FooterLink href="#features">What you get</FooterLink>
              </li>
              <li>
                <FooterLink href="#waitlist">Join the waitlist</FooterLink>
              </li>
            </ul>

            <ul className="space-y-2.5 text-[0.85rem]">
              <li className="font-mono text-[0.66rem] tracking-[0.16em] text-forest uppercase">
                Company
              </li>
              <li>
                <FooterLink href="#">Privacy policy</FooterLink>
              </li>
              <li>
                <FooterLink href="#">Terms</FooterLink>
              </li>
              <li>
                <FooterLink href="mailto:hello@lancewise.com">hello@lancewise.com</FooterLink>
              </li>
            </ul>

            <ul className="space-y-2.5">
              <li className="font-mono text-[0.66rem] tracking-[0.16em] text-forest uppercase">
                Elsewhere
              </li>
              <li className="flex gap-2 pt-0.5">
                {SOCIALS.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    rel="me noopener noreferrer"
                    target="_blank"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-rule text-slate transition-colors duration-400 [transition-timing-function:var(--ease-out-quint)] hover:border-rule-strong hover:bg-haze hover:text-forest"
                  >
                    <Icon />
                  </a>
                ))}
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-rule pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.79rem] text-slate">
            © {YEAR} LanceWise. Not affiliated with, endorsed by, or connected to Upwork Global Inc.
          </p>
          <p className="font-mono text-[0.72rem] tracking-wide text-slate">
            Built between client deadlines, which is rather the point.
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      className="text-slate transition-colors duration-300 hover:text-graphite hover:underline hover:decoration-rule-strong hover:underline-offset-4"
    >
      {children}
    </a>
  )
}
