-- What hurts most on Upwork.
--
-- Deliberately NOT joined to public.waitlist: no email, no foreign key, no
-- shared id. Responses are anonymous, which is both the simpler data model
-- and the honest one — nothing here can be traced back to a signup.
--
-- The cost of that choice: you can count what people struggle with, but you
-- cannot email a specific person about their answer.

create table if not exists public.challenge_responses (
  id bigint generated always as identity primary key,

  -- One of the preset options, or free text if the visitor typed their own.
  challenge text not null check (length(challenge) between 1 and 300),

  created_at timestamptz not null default now()
);

create index if not exists challenge_responses_created_at_idx
  on public.challenge_responses (created_at desc);

comment on table public.challenge_responses is
  'Anonymous product-research answers. Not linked to waitlist signups by design.';

-- Same posture as waitlist: RLS on, no policies, so only the service role
-- inside the edge function can write. Nothing readable with a public key.
alter table public.challenge_responses enable row level security;
