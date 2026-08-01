-- Abuse resistance for the public signup endpoint.
--
-- The endpoint accepts anonymous POSTs and, for each accepted one, sends a
-- real email from lancewise.com. An unthrottled loop therefore does not just
-- fill this table with junk — it generates thousands of hard bounces against
-- a domain with almost no sending history, and bounce rate is what mailbox
-- providers score. Past roughly 5%, Gmail routes the domain to spam by
-- default, and the launch announcement lands nowhere. That damage cannot be
-- cleaned up afterwards, which is why this is enforced before the send.

create table if not exists public.rate_limit (
  -- SHA-256 of the caller's IP with a secret salt. Never the address itself.
  --
  -- A raw IP is personal data; a salted hash is only a comparison key and
  -- cannot be reversed into one. Salting matters specifically because the
  -- entire IPv4 space is small enough to brute-force an unsalted hash.
  -- It also keeps the privacy policy's "we do not collect your IP address"
  -- true, which is worth more than the convenience of storing it.
  key text primary key,

  window_start timestamptz not null default now(),
  count integer not null default 1
);

create index if not exists rate_limit_window_idx on public.rate_limit (window_start);

alter table public.rate_limit enable row level security;

comment on table public.rate_limit is
  'Fixed-window request counters keyed by salted IP hash. Written only by check_rate_limit().';

/*
 * Returns true when the caller is still under the limit.
 *
 * The count and the window reset happen inside a single INSERT .. ON CONFLICT
 * statement so the whole thing is atomic. A read-then-write version would let
 * two simultaneous requests both read count = 4, both decide they were under
 * the limit of 5, and both proceed — which is precisely the situation an
 * attacker creates by firing in parallel.
 */
create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer default 5,
  p_window interval default interval '1 hour'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.rate_limit as rl (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
    set count = case
          when rl.window_start < now() - p_window then 1
          else rl.count + 1
        end,
        window_start = case
          when rl.window_start < now() - p_window then now()
          else rl.window_start
        end
  returning rl.count into v_count;

  -- Opportunistic housekeeping on roughly one call in a hundred, so the table
  -- stays small without needing a scheduled job.
  if random() < 0.01 then
    delete from public.rate_limit where window_start < now() - (p_window * 2);
  end if;

  return v_count <= p_limit;
end;
$$;

/*
 * Lock the function down, then hand it back to service_role explicitly.
 *
 * Functions are granted EXECUTE to PUBLIC by default, and service_role
 * inherits that. Revoking from PUBLIC therefore takes it away from
 * service_role too — and because PostgREST only advertises functions the
 * calling role may execute, the RPC then disappears from the schema cache and
 * fails with PGRST202 "could not find the function". The grant below is not
 * optional.
 */
revoke all on function public.check_rate_limit(text, integer, interval) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, interval) to service_role;

-- Refresh PostgREST's cache now rather than waiting for it to notice.
notify pgrst, 'reload schema';
