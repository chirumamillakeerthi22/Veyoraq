-- ============================================================================
-- PROPOSED, NOT APPLIED.
-- This file is a proposal for review. Saving it in the repository changes
-- nothing in your Supabase database. It only takes effect when it is pasted
-- into the Supabase SQL Editor and run.
--
-- Purpose: let signed-in users save outfit ideas ("Saved Styles").
-- Creates ONE table, with Row Level Security so each user can only ever see,
-- add or delete their own rows.
-- ============================================================================

-- 1. The table ---------------------------------------------------------------
create table public.saved_outfits (
  id         uuid primary key default gen_random_uuid(),

  -- The owner. Filled in automatically from the signed-in user, and removed
  -- automatically if that user's account is deleted.
  user_id    uuid not null default auth.uid()
             references auth.users (id) on delete cascade,

  -- Short display name (the outfit's name from the AI).
  name       text not null check (char_length(name) between 1 and 50),

  -- The validated outfit (name, summary, palette, pieces, tips) as JSON, so the
  -- picture can be redrawn later. Capped at 8 KB so one row cannot be abused.
  outfit     jsonb not null
             check (jsonb_typeof(outfit) = 'object' and pg_column_size(outfit) <= 8192),

  -- The questionnaire choices that produced it (occasion, styles, colours,
  -- budget tier, currency). The free-text notes are deliberately NOT stored.
  answers    jsonb
             check (answers is null
                    or (jsonb_typeof(answers) = 'object' and pg_column_size(answers) <= 1024)),

  created_at timestamptz not null default now()
);

-- Policies and the "my saved outfits" list both filter by user, newest first.
create index saved_outfits_user_created_idx
  on public.saved_outfits (user_id, created_at desc);

-- 2. A friendly limit of 100 saved outfits per user ---------------------------
-- Keeps the free database small and stops runaway scripts. A trigger gives a
-- clear error message, unlike a policy, which would only say "not allowed".
create function public.enforce_saved_outfit_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.saved_outfits where user_id = new.user_id) >= 100 then
    raise exception 'Saved outfit limit reached (100)' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger saved_outfits_limit
  before insert on public.saved_outfits
  for each row execute function public.enforce_saved_outfit_limit();

-- 3. Security: who may do what ------------------------------------------------
alter table public.saved_outfits enable row level security;

-- Start from nothing, then grant only what is needed.
-- There is NO update grant: saved outfits cannot be edited, only added or removed.
-- The "anon" role (signed-out visitors) gets no access at all.
revoke all on table public.saved_outfits from anon, authenticated;
grant select, insert, delete on table public.saved_outfits to authenticated;

create policy "Users can view their own saved outfits"
  on public.saved_outfits
  for select
  to authenticated
  using ( (select auth.uid()) = user_id );

create policy "Users can save outfits for themselves"
  on public.saved_outfits
  for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "Users can delete their own saved outfits"
  on public.saved_outfits
  for delete
  to authenticated
  using ( (select auth.uid()) = user_id );
