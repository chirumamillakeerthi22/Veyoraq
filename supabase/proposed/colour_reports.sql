-- ============================================================================
-- PROPOSED, NOT APPLIED, AND NOT TESTED.
-- A proposal for your review. Saving it in the repository changes nothing in your
-- Supabase project. It only takes effect if pasted into the Supabase SQL Editor
-- and run, which should happen only after you approve it. It lives in
-- supabase/proposed/ so no tool can apply it by accident.
--
-- Purpose: let signed-in people keep their Colour Analysis reports (the validated
-- palette and explanation, never the photo) in their account so they follow them
-- across devices. Today reports are kept only in the visitor's own browser.
--
-- Creates ONE table with Row Level Security. Nothing existing is changed, and no
-- storage bucket is needed because no photo is stored.
-- ============================================================================

create table public.colour_reports (
  -- Generated in the browser, so saving the same report twice replaces the row.
  id          text primary key check (id ~ '^[A-Za-z0-9_-]{1,64}$'),

  user_id     uuid not null default auth.uid()
              references auth.users (id) on delete cascade,

  -- The validated analysis (undertone, season, swatches, combinations, advice).
  report      jsonb not null
              check (jsonb_typeof(report) = 'object' and pg_column_size(report) <= 16384),

  created_at  timestamptz not null default now()
);

create index colour_reports_user_created_idx
  on public.colour_reports (user_id, created_at desc);

-- A friendly limit of 50 reports per person.
create function public.enforce_colour_report_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.colour_reports where user_id = new.user_id) >= 50 then
    raise exception 'Saved report limit reached (50)' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger colour_reports_limit
  before insert on public.colour_reports
  for each row execute function public.enforce_colour_report_limit();

-- Each person can see, add and delete only their own reports. Signed-out visitors
-- (the "anon" role) get no access at all. Reports are added or removed, not edited.
alter table public.colour_reports enable row level security;
revoke all on table public.colour_reports from anon, authenticated;
grant select, insert, delete on table public.colour_reports to authenticated;

create policy "colour_reports: owner can read"
  on public.colour_reports for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "colour_reports: owner can add"
  on public.colour_reports for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "colour_reports: owner can delete"
  on public.colour_reports for delete to authenticated
  using ((select auth.uid()) = user_id);

-- After approval and applying, still to do (not part of this file):
--   * a Supabase-backed repository behind lib/fix-my-style/looks.ts
--   * a security test like supabase/tests/saved_outfits_security_test.sql
