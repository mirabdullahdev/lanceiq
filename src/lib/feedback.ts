import { FEEDBACK_ENDPOINT } from '../config/site'

/**
 * Product research, kept entirely separate from the waitlist: its own table,
 * its own endpoint, and no email attached. A response cannot be traced back
 * to a signup, by design.
 */

export const CHALLENGES = [
  'I burn connects and hear nothing back',
  'My proposals take too long to write',
  "I can't tell which jobs are worth bidding on",
  'My profile gets no invites',
  'I have no idea what my connects earn',
] as const

export async function sendChallenge(challenge: string): Promise<void> {
  const res = await fetch(FEEDBACK_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challenge }),
  })
  if (!res.ok) throw new Error(`feedback rejected: ${res.status}`)
}
