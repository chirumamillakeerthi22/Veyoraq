-- ============================================================================
-- PROPOSED, NOT APPLIED, AND NOT TESTED.
-- This file is a proposal for your review. Saving it in the repository changes
-- nothing in your Supabase project. It only takes effect if it is pasted into the
-- Supabase SQL Editor and run, which should happen only after you approve it.
-- It lives in supabase/proposed/ (not supabase/migrations/) so no tool can apply
-- it by accident.
--
-- Purpose: let signed-in people keep the looks they save in FIX My Style in their
-- account, so they follow them across devices. Today looks are kept only in the
-- visitor's own browser (see lib/fix-my-style/looks.ts).
--
-- Creates:
--   1. public.fix_looks   one row per saved look (the written advice only)
--   2. a PRIVATE storage bucket "looks" for the original and styled photos
-- Everything is locked to the signed-in owner by Row Level Security. Signed-out
-- visitors (the "anon" role) get no access at all. Nothing existing is changed.
-- ============================================================================

-- 1. Saved looks ---------------------------------------------------------------
create table public.fix_looks (
  -- Generated in the browser, so saving the same look twice (a retry) replaces the
  -- row instead of duplicating it.
  id          text primary key check (id ~ '^[A-Za-z0-9_-]{1,64}$'),

  user_id     uuid not null default auth.uid()
              references auth.users (id) on delete cascade,

  -- The validated advice (assessment, items, improvements, additions) as JSON.
  advice      jsonb not null
              check (jsonb_typeof(advice) = 'object' and pg_column_size(advice) <= 8192),

  -- Paths inside the private bucket, always "<user_id>/<look id>-original.jpg" and
  -- "<user_id>/<look id>-styled.jpg". Never public addresses.
  original_path text not null check (original_path = user_id::text || '/' || id || '-original.jpg'),
  styled_path   text check (styled_path is null or styled_path = user_id::text || '/' || id || '-styled.jpg'),

  created_at  timestamptz not null default now()
);

create index fix_looks_user_created_idx on public.fix_looks (user_id, created_at desc);

-- 2. A friendly limit of 100 looks per person ------------------------------------
create function public.enforce_fix_look_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.fix_looks where user_id = new.user_id) >= 100 then
    raise exception 'Saved look limit reached (100)' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger fix_looks_limit
  before insert on public.fix_looks
  for each row execute function public.enforce_fix_look_limit();

-- 3. Row Level Security: each person sees and changes only their own rows -------
alter table public.fix_looks enable row level security;
revoke all on table public.fix_looks from anon, authenticated;
-- Looks are added or removed, never edited.
grant select, insert, delete on table public.fix_looks to authenticated;

create policy "fix_looks: owner can read"
  on public.fix_looks for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "fix_looks: owner can add"
  on public.fix_looks for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "fix_looks: owner can delete"
  on public.fix_looks for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 4. Private photo storage ---------------------------------------------------------
-- public = false: there is no public address for a photo. Files are limited to
-- 1.5 MB and to JPEG/PNG/WebP, matching the app's own checks.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('looks', 'looks', false, 1572864, array['image/jpeg','image/png','image/webp']);

-- A person may only touch files inside a folder named after their own user id.
create policy "looks photos: owner can read"
  on storage.objects for select to authenticated
  using (bucket_id = 'looks' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "looks photos: owner can add"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'looks' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "looks photos: owner can delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'looks' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ----------------------------------------------------------------------------
-- After approval and applying, still to do (not part of this file):
--   * a Supabase-backed LooksRepository (the app already uses the interface in
--     lib/fix-my-style/looks.ts)
--   * a security test like supabase/tests/saved_outfits_security_test.sql
--   * deleting a look must also delete its photo files from the bucket
-- ----------------------------------------------------------------------------
