/**
 * Every environment-dependent string lives here. Nothing else in the app
 * should hardcode a domain, an endpoint, or a headline number.
 */

/**
 * Canonical origin, no trailing slash.
 * Single source of truth: set VITE_SITE_ORIGIN in .env — index.html reads the
 * same variable via Vite's %VITE_*% substitution. Keep public/CNAME in sync.
 */
export const SITE_ORIGIN = import.meta.env['VITE_SITE_ORIGIN'] ?? 'https://lancewise.com'

export const SITE = {
  name: 'LanceWise',
  origin: SITE_ORIGIN,
  title: 'LanceWise | Stop gambling on Upwork. Start winning with data.',
  description:
    'LanceWise tells you which Upwork jobs are worth your connects, writes proposals that sound like you, and tracks what every connect earns. Join the waitlist for 30% off your first 3 months.',
  ogImage: `${SITE_ORIGIN}/og.png`,
  twitter: 'https://x.com/lancewise',
  linkedin: 'https://www.linkedin.com/company/lancewise',
} as const

/**
 * Supabase edge function that inserts the signup and sends the welcome email.
 * See supabase/README.md. Override per-environment in .env.local.
 */
export const WAITLIST_ENDPOINT =
  import.meta.env['VITE_WAITLIST_ENDPOINT'] ??
  'https://ytdqfhkwbnoadimmemdi.supabase.co/functions/v1/subscribe'

/**
 * Separate endpoint writing to a separate table. Anonymous product research,
 * deliberately not joined to a waitlist signup.
 */
export const FEEDBACK_ENDPOINT =
  import.meta.env['VITE_FEEDBACK_ENDPOINT'] ??
  'https://ytdqfhkwbnoadimmemdi.supabase.co/functions/v1/feedback'

/** Plausible is loaded only when this is set. Empty string = no analytics, no cookie banner. */
export const PLAUSIBLE_DOMAIN = import.meta.env['VITE_PLAUSIBLE_DOMAIN'] ?? ''

export const OFFER = {
  discount: '30%',
  months: 3,
} as const

/**
 * Public signup count.
 *
 * Deliberately null until there is a real number to show. The counter
 * component renders an honest "building in public" state instead of a
 * fabricated one. Set this to a real integer — or better, have the worker
 * return it — the day you actually have signups.
 */
export const WAITLIST_COUNT: number | null = null

/**
 * Inputs for the connect-burn estimate in the problem section.
 * These are stated on the page so the arithmetic is auditable rather than
 * presented as a live telemetry feed, which it is not.
 *
 * The defaults are set so the calculator opens at roughly $3,060, which is
 * what the section headline claims. If you change the headline number, change
 * these too, or the receipt sitting directly beneath it will contradict it.
 */
export const BURN_MODEL = {
  connectPriceUsd: 0.15,
  connectsPerProposal: 17,
  proposalsPerWeek: 25,
  weeksPerYear: 48,
} as const

export const ANNUAL_BURN_USD = Math.round(
  BURN_MODEL.connectPriceUsd *
    BURN_MODEL.connectsPerProposal *
    BURN_MODEL.proposalsPerWeek *
    BURN_MODEL.weeksPerYear,
)
