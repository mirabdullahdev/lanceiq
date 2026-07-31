/**
 * LanceWise waitlist endpoint.
 *
 * Deployed with --no-verify-jwt, so it is genuinely public. That is fine:
 * requiring the anon key would add no security, because the anon key ships
 * inside any browser bundle that calls it.
 *
 * What it does:
 *   1. validates the payload
 *   2. inserts into public.waitlist using the service role (bypasses RLS)
 *   3. sends the welcome email with the discount code via Resend
 *
 * The service role key and the Resend key live in Supabase function secrets
 * and never reach the browser.
 *
 * Deploy:  supabase functions deploy subscribe --no-verify-jwt
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'

/* Deliberately permissive: the authority on whether an address exists is the
   delivery attempt, not a regex. This only rejects obvious garbage. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'LanceWise <hello@lancewise.com>'
const DISCOUNT_CODE = Deno.env.get('DISCOUNT_CODE') ?? 'EARLY30'
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''

type Payload = {
  email?: unknown
  name?: unknown
  challenge?: unknown
  company?: unknown
}

function corsHeaders(origin: string): Record<string, string> {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : (ALLOWED_ORIGINS[0] ?? '')
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  })
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin') ?? ''
  const cors = corsHeaders(origin)

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors)

  // Not a security boundary — curl ignores Origin. It only stops the endpoint
  // being embedded in someone else's page.
  if (origin && ALLOWED_ORIGINS.length > 0 && !ALLOWED_ORIGINS.includes(origin)) {
    return json({ error: 'Origin not allowed' }, 403, cors)
  }

  let body: Payload
  try {
    body = (await req.json()) as Payload
  } catch {
    return json({ error: 'Malformed JSON' }, 400, cors)
  }

  // Honeypot. Answer as though it worked so the bot does not learn anything.
  if (typeof body.company === 'string' && body.company.length > 0) {
    return json({ status: 'joined', position: null }, 200, cors)
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return json({ error: 'Invalid email' }, 400, cors)
  }

  // Accepted from the form and used to personalise the welcome email, but not
  // stored: the waitlist table holds email only.
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : ''

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    // Injected automatically by Supabase. Bypasses RLS, which is exactly why
    // it must never leave this function.
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  const { data, error } = await supabase
    .from('waitlist')
    .insert({ email })
    .select('id')
    .single()

  if (error) {
    // 23505 = unique_violation. Already on the list, so say so rather than
    // sending a second welcome email.
    if (error.code === '23505') {
      return json({ status: 'already', emailed: Boolean(RESEND_API_KEY) }, 409, cors)
    }
    console.error('waitlist insert failed', error)
    return json({ error: 'Could not save signup' }, 502, cors)
  }

  const position = data?.id ?? null

  // Send after responding: the visitor should see success as soon as they are
  // on the list, not after Resend's SMTP handoff.
  const send = deliverWelcome(email, name)
  if (typeof EdgeRuntime !== 'undefined' && 'waitUntil' in EdgeRuntime) {
    ;(EdgeRuntime as { waitUntil(p: Promise<unknown>): void }).waitUntil(send)
  } else {
    await send
  }

  // Tells the UI whether to promise an email at all. Without a Resend key
  // nothing is sent, and a success panel saying "check your inbox" would be
  // a straightforward lie. Reporting it means the copy corrects itself the
  // moment the key is configured, with no code change and nothing to remember.
  return json({ status: 'joined', position, emailed: Boolean(RESEND_API_KEY) }, 200, cors)
})

/* ------------------------------------------------------------------ */

async function deliverWelcome(email: string, name: string) {
  if (!RESEND_API_KEY) return
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        // Same address twice never sends twice, even if a retry fires.
        'Idempotency-Key': `welcome-${email}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: "You're on the LanceWise waitlist",
        html: welcomeHtml(name, DISCOUNT_CODE),
        text: welcomeText(name, DISCOUNT_CODE),
      }),
    })

    if (!res.ok) {
      // Delivery state is no longer tracked on the row, so a failure is only
      // visible here. `supabase functions logs subscribe` is the audit trail.
      const detail = await res.text().catch(() => '')
      console.error('welcome email rejected', res.status, detail)
    }
  } catch (err) {
    console.error('welcome email failed', err)
  }
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  )
}

function welcomeText(name: string, code: string) {
  const hi = name ? `Hi ${name},` : 'Hi,'
  return `${hi}

You're on the LanceWise waitlist.

Your code: ${code}
It takes 30% off your first 3 months, counted from the day you upgrade rather than from launch day.

We're still building. You'll hear from us when there's something real to show, not every Tuesday.

If you have a minute: what's the single most frustrating thing about bidding on Upwork right now? Reply to this email. A person reads it.

The LanceWise team`
}

function welcomeHtml(name: string, code: string) {
  const hi = name ? `Hi ${escapeHtml(name)},` : 'Hi,'
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f8fff9;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fff9;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid rgba(46,125,50,0.14);border-radius:16px;">
<tr><td style="padding:36px 34px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;font-size:15px;line-height:1.6;">

<p style="margin:0 0 22px;font-size:20px;font-weight:600;color:#2d2d2d;">Lance<span style="color:#2e7d32;">Wise</span></p>

<p style="margin:0 0 16px;">${hi}</p>
<p style="margin:0 0 16px;">You're on the waitlist. Here's the code we promised:</p>

<p style="margin:0 0 8px;padding:16px;background:#72db97;border-radius:12px;text-align:center;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:22px;font-weight:600;letter-spacing:0.12em;color:#1a1a1a;">${escapeHtml(code)}</p>
<p style="margin:0 0 24px;font-size:13px;color:#55605a;text-align:center;">30% off your first 3 months, counted from the day you upgrade rather than from launch day.</p>

<p style="margin:0 0 16px;">We're still building. You'll hear from us when there's something real to show, not every Tuesday.</p>

<p style="margin:0 0 16px;">If you have a minute: what's the single most frustrating thing about bidding on Upwork right now? Just reply to this email. A person reads it.</p>

<p style="margin:24px 0 0;color:#55605a;">The LanceWise team</p>

<p style="margin:28px 0 0;padding-top:18px;border-top:1px solid rgba(46,125,50,0.14);font-size:12px;color:#55605a;">
You're getting this because you joined the LanceWise waitlist. Not affiliated with Upwork Global Inc.
</p>

</td></tr></table>
</td></tr></table>
</body></html>`
}

declare const EdgeRuntime: unknown
