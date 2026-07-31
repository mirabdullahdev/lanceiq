# Supabase

Postgres is the **system of record** for the waitlist. Resend is delivery only.
That split is deliberate: a Resend audience cannot be queried, ordered, or
asked "what did people say hurts most on Upwork", and this table can.

```
supabase/
  migrations/20260731000000_waitlist.sql   the table + RLS
  functions/subscribe/index.ts             the public endpoint
```

## What you need

Three things, and **you set all of them yourself** — do not paste any of them
into a chat window:

1. A Supabase project (free tier is fine). Note its **project ref**, the
   `xxxxxxxx` in `https://xxxxxxxx.supabase.co`.
2. A **Resend API key** with send permission.
3. The Supabase CLI: `npm i -g supabase`, then `supabase login`.

## Setup

```bash
supabase link --project-ref <your-project-ref>
supabase db push                     # creates the waitlist table
```

Set the function secrets. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are
injected automatically, so only these three are yours to provide:

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxx
supabase secrets set FROM_EMAIL="LanceWise <hello@lancewise.com>"
supabase secrets set DISCOUNT_CODE=EARLY30
supabase secrets set ALLOWED_ORIGINS="https://lancewise.com,https://www.lancewise.com,http://localhost:4173,http://localhost:5173"
```

Deploy the endpoint:

```bash
supabase functions deploy subscribe --no-verify-jwt
```

Then set `VITE_WAITLIST_ENDPOINT` to
`https://<project-ref>.supabase.co/functions/v1/subscribe` in `.env` and in the
GitHub repository variables.

`--no-verify-jwt` is correct here. The alternative is requiring the anon key,
which ships inside the browser bundle and is therefore public — it would add
ceremony, not security. The real protections are the origin allowlist, the
honeypot, the unique index on email, and RLS.

## Before you send any marketing email

Verify `lancewise.com` in Resend and add the SPF, DKIM and DMARC records.
Until that is done, mail lands in spam.

The welcome email is **transactional** — the visitor asked for it. Anything you
send afterwards is marketing, which means CAN-SPAM applies: every broadcast
needs a working unsubscribe link and a real postal address.

## Security model

RLS is enabled on `waitlist` with **no policies at all**. With RLS on and no
policy, the `anon` and `authenticated` roles can do nothing — no select, no
insert. The edge function uses the service role, which bypasses RLS.

This is what stops the public anon key from being used to read your email list.
If you later add a public signup count, expose the `waitlist_count` view rather
than granting any access to the table itself.

## What the table stores

`id`, `email`, `created_at`. That is the whole schema.

Two consequences worth knowing:

**The form's "name" and "what hurts most on Upwork" answers are not saved.**
Name is still used to personalise the welcome email, then discarded; the
challenge answer is dropped entirely. If you want either of them back it is one
column and one line in the function — but until then, those two form fields
collect nothing, and the waitlist section's promise that your answer "feeds
straight into what we build first" has nothing behind it.

**Welcome-email delivery is not tracked on the row.** A send that Resend
rejects is only visible in `supabase functions logs subscribe`, not by querying
the table.

## Useful queries

```sql
-- Signups per day
select date_trunc('day', created_at) as day, count(*)
from waitlist group by 1 order by 1 desc;

-- Total, for the counter in config/site.ts
select count(*) from waitlist;

-- Export
select email from waitlist order by id;
```
