-- LanceWise waitlist.
--
-- Deliberately minimal: an email, when it arrived, and nothing else.

create extension if not exists citext;

create table if not exists public.waitlist (
  -- Sequential on purpose: this doubles as the "you're #N in line" position
  -- shown in the success panel. It leaks the total signup count, which is
  -- fine because we are deliberately telling each person their place.
  id bigint generated always as identity primary key,

  -- citext so Jordan@x.com and jordan@x.com collide on the unique index
  -- instead of becoming two rows and two welcome emails.
  email citext not null unique,

  created_at timestamptz not null default now()
);

create index if not exists waitlist_created_at_idx on public.waitlist (created_at desc);

comment on table public.waitlist is
  'Pre-launch signups. Written only by the subscribe edge function via the service role.';

-- Row Level Security on, and deliberately NO policies.
--
-- With RLS enabled and no policy present, the anon and authenticated roles can
-- do nothing at all: no select, no insert, no update. The edge function uses
-- the service_role key, which bypasses RLS entirely.
--
-- This is what stops a public key from being used to read your email list.
alter table public.waitlist enable row level security;
