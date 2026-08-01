import { z } from 'zod'
import { WAITLIST_ENDPOINT } from '../config/site'

export const waitlistSchema = z.object({
  name: z
    .string()
    .trim()
    .max(80, 'That name is longer than we can store.')
    .optional()
    .or(z.literal('')),
  email: z.email('That email address does not look right.').max(254),
  /** Honeypot. Real people never fill this; bots almost always do. */
  company: z.string().max(0).optional().or(z.literal('')),
})

export type WaitlistInput = z.infer<typeof waitlistSchema>

export type WaitlistResult =
  | { status: 'joined'; position: number | null; emailed: boolean; code: string | null }
  | { status: 'already'; emailed: boolean }

export class WaitlistError extends Error {}

/**
 * Posts to the Supabase edge function, which owns the Resend key, inserts the
 * row and sends the welcome email. Nothing secret reaches this bundle.
 *
 * `emailed` reports whether a welcome email will actually be sent. Until a
 * Resend key is configured it is false, and the success panel says so instead
 * of telling people to check an inbox that will stay empty.
 */
export async function joinWaitlist(input: WaitlistInput): Promise<WaitlistResult> {
  // A filled honeypot gets a silent, successful-looking no-op.
  if (input.company) return { status: 'joined', position: null, emailed: false, code: null }

  let res: Response
  try {
    res = await fetch(WAITLIST_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        name: input.name?.trim() || undefined,
      }),
    })
  } catch {
    throw new WaitlistError(
      "We couldn't reach the server. Check your connection and try once more.",
    )
  }

  if (res.status === 409) {
    const body = (await res.json().catch(() => ({}))) as { emailed?: boolean }
    return { status: 'already', emailed: body.emailed === true }
  }

  /* Rate limited. Without this branch a 429 would fall through to "that
     address was rejected", sending someone off to re-check an address that
     was never the problem. */
  if (res.status === 429) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new WaitlistError(
      body.error ?? 'Too many signups from this network. Try again in an hour.',
    )
  }

  if (!res.ok) {
    throw new WaitlistError(
      res.status >= 500
        ? 'Our end fell over. Give it a minute and try again.'
        : 'That address was rejected. Mind double-checking it?',
    )
  }

  const data = (await res.json().catch(() => ({}))) as {
    position?: number
    emailed?: boolean
    code?: string
  }
  return {
    status: 'joined',
    position: typeof data.position === 'number' ? data.position : null,
    emailed: data.emailed === true,
    code: typeof data.code === 'string' ? data.code : null,
  }
}
