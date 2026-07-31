-- Per-signup discount code.
--
-- Replaces the single shared EARLY30 code. A shared code cannot be revoked
-- without punishing everyone, cannot be attributed to a person, and leaks the
-- moment one recipient posts it publicly. A per-row code fixes all three.

-- 30-character alphabet: digits and uppercase letters, minus 0/O, 1/I/L and U.
-- Those are the pairs people mistype when reading a code off a screen, and
-- dropping U removes most accidental profanity.
--
-- 8 characters over 30 symbols is ~6.5e11 combinations. Long enough that
-- guessing a valid code is not worth anyone's time, short enough to retype.
create or replace function public.gen_waitlist_code()
returns text
language plpgsql
volatile
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTVWXYZ';
  candidate text;
begin
  loop
    candidate := '';
    for _i in 1..8 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    -- Re-roll on collision. The unique index below is still the real
    -- guarantee: this check can race, the index cannot.
    exit when not exists (select 1 from public.waitlist where code = candidate);
  end loop;
  return candidate;
end;
$$;

alter table public.waitlist
  add column if not exists code text not null default public.gen_waitlist_code();

-- Named explicitly so the edge function can tell a code collision apart from
-- a duplicate email, and retry the one but not the other.
create unique index if not exists waitlist_code_key on public.waitlist (code);

-- Redemption state. Without this a code works forever and for everyone: the
-- first person to redeem theirs can post it publicly and it stays valid.
--
-- At launch, redeeming is:
--   update public.waitlist
--      set redeemed_at = now()
--    where code = $1 and redeemed_at is null
--   returning email;
--
-- Zero rows back means the code is either wrong or already spent, and the
-- single statement makes that check atomic — two people racing the same code
-- cannot both win.
alter table public.waitlist
  add column if not exists redeemed_at timestamptz;

create index if not exists waitlist_unredeemed_idx
  on public.waitlist (code) where redeemed_at is null;
