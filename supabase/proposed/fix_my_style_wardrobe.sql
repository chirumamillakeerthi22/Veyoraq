-- ============================================================================
-- PROPOSED, NOT APPLIED.
-- This file is a proposal for your review. Saving it in the repository changes
-- nothing in your Supabase project. It only takes effect if it is pasted into
-- the Supabase SQL Editor and run, which should happen only after you approve it.
-- It lives in supabase/proposed/ (not supabase/migrations/) so no tool can
-- apply it by accident.
--
-- Purpose: let signed-in people keep their FIX My Style wardrobe and saved
-- outfits in their account, so it follows them across devices.
--
-- Until this is approved and applied, FIX My Style keeps everything on the
-- person's own device (IndexedDB) and works without an account.
--
-- STATUS: written but NOT tested. It has never been run against a database.
-- A security test (like supabase/tests/saved_outfits_security_test.sql) should be
-- written and passed before anything depends on it.
--
-- This creates:
--   1. public.wardrobe_items   one row per garment (details only, not the photo)
--   2. public.fix_outfits      one row per saved outfit
--   3. a PRIVATE storage bucket "wardrobe" for the garment photos
-- Every table and the bucket are locked to the signed-in owner by Row Level
-- Security. Signed-out visitors (the "anon" role) get no access at all.
--
-- Not included on purpose: nothing changes saved_outfits or any existing table.
-- ============================================================================

-- 1. Garments ----------------------------------------------------------------
create table public.wardrobe_items (
  -- The browser generates this id, so saving the same item twice (a retry)
  -- replaces the row instead of duplicating it.
  id          text primary key check (id ~ '^[A-Za-z0-9_-]{1,64}$'),

  user_id     uuid not null default auth.uid()
              references auth.users (id) on delete cascade,

  name        text not null check (char_length(name) between 1 and 60),
  category    text not null
              check (category in ('tops','bottoms','dresses','outerwear','shoes','bags','accessories')),
  colours     text[] not null default '{}' check (cardinality(colours) <= 3),
  pattern     text,
  material    text,
  style       text,
  seasons     text[] not null default '{}' check (cardinality(seasons) <= 4),
  occasions   text[] not null default '{}' check (cardinality(occasions) <= 6),

  -- Where the photo is in the private bucket, always "<user_id>/<item id>.jpg".
  -- Never a public address. Checked against the row's own columns.
  photo_path  text not null check (photo_path = user_id::text || '/' || id || '.jpg'),
  suggested_by_ai boolean not null default false,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index wardrobe_items_user_created_idx
  on public.wardrobe_items (user_id, created_at desc);

-- 2. Saved outfits -----------------------------------------------------------
create table public.fix_outfits (
  -- Derived from the item ids and title in the browser, so the same
  -- combination always has the same id.
  id          text primary key check (char_length(id) between 1 and 200),

  user_id     uuid not null default auth.uid()
              references auth.users (id) on delete cascade,

  title       text not null check (char_length(title) between 1 and 50),
  -- The validated outfit (item ids, layering, why it works, additions) as JSON.
  outfit      jsonb not null
              check (jsonb_typeof(outfit) = 'object' and pg_column_size(outfit) <= 8192),

  created_at  timestamptz not null default now()
);

create index fix_outfits_user_created_idx
  on public.fix_outfits (user_id, created_at desc);

-- 3. Friendly limits (keeps the free database small, stops runaway scripts) -----
create function public.enforce_wardrobe_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_table_name = 'wardrobe_items'
     and (select count(*) from public.wardrobe_items where user_id = new.user_id) >= 200 then
    raise exception 'Wardrobe limit reached (200 items)' using errcode = 'P0001';
  end if;
  if tg_table_name = 'fix_outfits'
     and (select count(*) from public.fix_outfits where user_id = new.user_id) >= 200 then
    raise exception 'Saved outfit limit reached (200)' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger wardrobe_items_limit
  before insert on public.wardrobe_items
  for each row execute function public.enforce_wardrobe_limit();

create trigger fix_outfits_limit
  before insert on public.fix_outfits
  for each row execute function public.enforce_wardrobe_limit();

-- 4. Row Level Security: each person sees and changes only their own rows ------
alter table public.wardrobe_items enable row level security;
alter table public.fix_outfits enable row level security;

revoke all on table public.wardrobe_items from anon, authenticated;
revoke all on table public.fix_outfits from anon, authenticated;
grant select, insert, update, delete on table public.wardrobe_items to authenticated;
-- Saved outfits are added or removed, never edited.
grant select, insert, delete on table public.fix_outfits to authenticated;

create policy "wardrobe_items: owner can read"
  on public.wardrobe_items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "wardrobe_items: owner can add"
  on public.wardrobe_items for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "wardrobe_items: owner can change"
  on public.wardrobe_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "wardrobe_items: owner can delete"
  on public.wardrobe_items for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "fix_outfits: owner can read"
  on public.fix_outfits for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "fix_outfits: owner can add"
  on public.fix_outfits for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "fix_outfits: owner can delete"
  on public.fix_outfits for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 5. Private photo storage ---------------------------------------------------
-- A PRIVATE bucket (public = false): there is no public address for a photo.
-- Files are limited to 1.5 MB and to JPEG/PNG/WebP, matching the app's checks.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wardrobe', 'wardrobe', false, 1572864, array['image/jpeg','image/png','image/webp']);

-- A person may only touch files inside a folder named after their own user id.
create policy "wardrobe photos: owner can read"
  on storage.objects for select to authenticated
  using (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "wardrobe photos: owner can add"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "wardrobe photos: owner can replace"
  on storage.objects for update to authenticated
  using (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "wardrobe photos: owner can delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ----------------------------------------------------------------------------
-- After approval and applying, still to do (not part of this file):
--   * a Supabase-backed WardrobeRepository (the app already talks to a
--     repository interface, see lib/fix-my-style/store.ts)
--   * a security test like supabase/tests/saved_outfits_security_test.sql
--   * deleting a garment must also delete its photo file from the bucket
-- ----------------------------------------------------------------------------
