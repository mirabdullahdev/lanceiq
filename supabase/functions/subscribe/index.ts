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
/* No DISCOUNT_CODE env var any more: every signup gets its own code, generated
   by a column default in Postgres and returned by the insert. */
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''

/* Rate limiting. Five accepted signups per IP per hour: a real person signs
   up once, so five leaves room for an office, a campus or a phone on carrier
   NAT sharing one address, while a script is stopped after five. */
const RATE_LIMIT = Number(Deno.env.get('RATE_LIMIT') ?? '5')

/* Falls back to the service role key, which is always present and secret, so
   the hash is never unsalted even if RATE_LIMIT_SALT is never configured.
   An unsalted IP hash is trivially reversible — IPv4 is only 4 billion
   values, which is minutes of brute force. */
const RATE_LIMIT_SALT =
  Deno.env.get('RATE_LIMIT_SALT') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? 'lancewise'

/**
 * The caller's address.
 *
 * Supabase Edge Functions sit behind Cloudflare, which sets
 * `cf-connecting-ip` itself and strips any client-supplied copy — so it is
 * both present and unspoofable here. That is the value we want.
 *
 * The X-Forwarded-For fallback takes the FIRST entry. Taking the last entry
 * is the usual anti-spoofing advice, but on this platform the chain looks
 * like `client, client, 13.248.106.53` where the final hop is Supabase's own
 * gateway — shared by every visitor. Keying on that would put the entire
 * internet in one bucket and lock everyone out after five signups.
 */
function clientIp(req: Request): string | null {
  const direct = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-real-ip')
  if (direct) return direct.trim()

  const forwarded = req.headers.get('x-forwarded-for')
  if (!forwarded) return null
  const first = forwarded.split(',')[0]?.trim()
  return first || null
}

async function rateLimitKey(ip: string): Promise<string> {
  const data = new TextEncoder().encode(`${RATE_LIMIT_SALT}:${ip}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

type Payload = {
  email?: unknown
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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    // Injected automatically by Supabase. Bypasses RLS, which is exactly why
    // it must never leave this function.
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  /*
   * Rate limit — deliberately placed here.
   *
   * After validation, so somebody mistyping their address four times does not
   * burn their own quota. Before the insert and before Resend, so a blocked
   * request costs no row and, more importantly, sends no mail.
   */
  const ip = clientIp(req)
  if (ip) {
    const { data: allowed, error: rlError } = await supabase.rpc('check_rate_limit', {
      p_key: await rateLimitKey(ip),
      p_limit: RATE_LIMIT,
    })

    if (rlError) {
      /* Fail open. If the limiter itself is broken, turning away real signups
         is a worse outcome than briefly losing the throttle — this protects
         reputation, it is not an access control. Logged so it is visible. */
      console.error('rate limit check failed, allowing request', rlError)
    } else if (allowed === false) {
      return json(
        { error: 'Too many signups from this network. Try again in an hour.' },
        429,
        cors,
      )
    }
  }

  /*
   * The discount code is generated by a column default in Postgres, and the
   * unique index on it is the real guarantee. A collision is astronomically
   * unlikely (~6.5e11 possibilities) but it is not impossible, and if it ever
   * happened the naive handler would tell a brand new signup they were
   * "already on the list" — the worst possible wrong answer. So we look at
   * *which* constraint failed and retry only the code.
   */
  let data: { id: number; code: string } | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await supabase.from('waitlist').insert({ email }).select('id, code').single()

    if (!res.error) {
      data = res.data as { id: number; code: string }
      break
    }

    if (res.error.code === '23505') {
      const detail = `${res.error.message} ${res.error.details ?? ''}`
      if (detail.includes('waitlist_code_key')) continue // re-roll the code
      // Otherwise it is the email index: genuinely already on the list.
      return json({ status: 'already', emailed: Boolean(RESEND_API_KEY) }, 409, cors)
    }

    console.error('waitlist insert failed', res.error)
    return json({ error: 'Could not save signup' }, 502, cors)
  }

  if (!data) {
    console.error('waitlist insert failed: could not allocate a unique code')
    return json({ error: 'Could not save signup' }, 502, cors)
  }

  const position = data.id
  const code = data.code

  // Send after responding: the visitor should see success as soon as they are
  // on the list, not after Resend's SMTP handoff.
  const send = deliverWelcome(email, code)
  if (typeof EdgeRuntime !== 'undefined' && 'waitUntil' in EdgeRuntime) {
    ;(EdgeRuntime as { waitUntil(p: Promise<unknown>): void }).waitUntil(send)
  } else {
    await send
  }

  // Tells the UI whether to promise an email at all. Without a Resend key
  // nothing is sent, and a success panel saying "check your inbox" would be
  // a straightforward lie. Reporting it means the copy corrects itself the
  // moment the key is configured, with no code change and nothing to remember.
  // `code` is returned so the success panel can show it on screen. Email is
  // not a reliable delivery channel — it lands in spam, it is mistyped, it
  // bounces — and the visitor should never lose their code to that.
  return json({ status: 'joined', position, code, emailed: Boolean(RESEND_API_KEY) }, 200, cors)
})

/* ------------------------------------------------------------------ */

async function deliverWelcome(email: string, code: string) {
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
        html: welcomeHtml(code),
        text: welcomeText(code),
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

/*
 * Deliberately plain, in both formats.
 *
 * The previous version was a nested-table layout with a mint-filled block and
 * 22px letter-spaced type — the exact visual grammar Gmail reads as bulk
 * marketing, which is a large part of why it landed in Promotions. This one
 * is paragraphs of text at body size, the way a person writes an email.
 *
 * No greeting name: the hero form (where most signups happen) never collects
 * one, so personalisation was inconsistent anyway.
 */

function welcomeText(code: string) {
  return `Hi,

You're officially on the LanceWise waitlist.

Your code is ${code}. Enjoy 30% off your first 3 months. We are confident that our app will provide value and will be genuinely useful.

We're excited to have you with us. You'll be among the first to get access, and we'll let you know as soon as it's available.

Thanks for joining us early. We can't wait for you to experience LanceWise.

Enjoy.

—
You're receiving this because you joined the LanceWise waitlist.
LanceWise is not affiliated with Upwork Global Inc.`
}

function welcomeHtml(code: string) {
  return `<!doctype html>
<html><body style="margin:0;padding:24px 16px;background:#ffffff;">
<div style="max-width:520px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;font-size:15px;line-height:1.65;">

<p style="margin:0 0 16px;">Hi,</p>

<p style="margin:0 0 16px;">You're officially on the LanceWise waitlist.</p>

<p style="margin:0 0 16px;">Your code is <strong style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:0.06em;">${escapeHtml(
    code,
  )}</strong>. Enjoy 30% off your first 3 months. We are confident that our app will provide value and will be genuinely useful.</p>

<p style="margin:0 0 16px;">We're excited to have you with us. You'll be among the first to get access, and we'll let you know as soon as it's available.</p>

<p style="margin:0 0 16px;">Thanks for joining us early. We can't wait for you to experience LanceWise.</p>

<p style="margin:0 0 24px;">Enjoy.</p>

<p style="margin:0;padding-top:16px;border-top:1px solid #e5e5e5;font-size:12px;color:#666666;">
You're receiving this because you joined the LanceWise waitlist.<br>
LanceWise is not affiliated with Upwork Global Inc.
</p>

</div>
</body></html>`
}

declare const EdgeRuntime: unknown
