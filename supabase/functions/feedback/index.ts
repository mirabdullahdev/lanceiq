/**
 * LanceWise product-research endpoint.
 *
 * Takes one answer to "what hurts most on Upwork" and stores it anonymously
 * in public.challenge_responses. It accepts no email and writes nothing that
 * could tie a response back to a waitlist signup — that separation is the
 * point, not an oversight.
 *
 * Deploy:  supabase functions deploy feedback --no-verify-jwt
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

type Payload = { challenge?: unknown; company?: unknown }

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

  if (origin && ALLOWED_ORIGINS.length > 0 && !ALLOWED_ORIGINS.includes(origin)) {
    return json({ error: 'Origin not allowed' }, 403, cors)
  }

  let body: Payload
  try {
    body = (await req.json()) as Payload
  } catch {
    return json({ error: 'Malformed JSON' }, 400, cors)
  }

  // Honeypot. Answer as though it worked so the bot learns nothing.
  if (typeof body.company === 'string' && body.company.length > 0) {
    return json({ status: 'recorded' }, 200, cors)
  }

  const challenge = typeof body.challenge === 'string' ? body.challenge.trim().slice(0, 300) : ''
  if (!challenge) return json({ error: 'Empty response' }, 400, cors)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  const { error } = await supabase.from('challenge_responses').insert({ challenge })

  if (error) {
    console.error('challenge insert failed', error)
    return json({ error: 'Could not save response' }, 502, cors)
  }

  return json({ status: 'recorded' }, 200, cors)
})
