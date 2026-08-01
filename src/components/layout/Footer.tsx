import { Wordmark } from '../ui/Wordmark'
import { SITE } from '../../config/site'

const YEAR = new Date().getFullYear()

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

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.5-3.9 3.77-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z"
      />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16ZM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.13 1.38C1.35 2.68.93 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13.67.67 1.34 1.08 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.13-1.38.67-.67 1.08-1.34 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.72-1.46-1.38-2.13C21.32 1.35 20.65.93 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm7.85-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z"
      />
    </svg>
  )
}

const SOCIALS = [
  { href: SITE.linkedin, label: 'LanceWise on LinkedIn', Icon: LinkedInIcon },
  { href: SITE.facebook, label: 'LanceWise on Facebook', Icon: FacebookIcon },
  { href: SITE.instagram, label: 'LanceWise on Instagram', Icon: InstagramIcon },
]

const PAGE_LINKS = [
  { href: '#problem', label: 'The problem' },
  { href: '#how', label: 'How it works' },
  { href: '#features', label: 'What you get' },
  { href: '#waitlist', label: 'Join the waitlist' },
]

const COMPANY_LINKS = [
  /* Standalone static pages in public/, not routes. Two documents do not
     justify a router, and as plain HTML they load without the bundle.
     Explicit .html so they resolve identically on Cloudflare Pages and on
     S3 + CloudFront, which does not do extensionless matching. */
  { href: '/privacy.html', label: 'Privacy policy' },
  { href: '/terms.html', label: 'Terms' },
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
