-- ============================================================================
-- PROPOSED, NOT APPLIED. Needs the owner's explicit approval first.
--
-- Saving this file in the repository changes nothing in your Supabase database.
-- It only takes effect when it is pasted into the Supabase SQL Editor and run.
--
-- Purpose: the Wishlist page ("individual items to revisit or buy"), separate from
-- Saved Styles (complete outfits). No wishlist table exists in the project yet, and
-- there is no product catalogue yet, so nothing can be added to it until products
-- exist. This table is ready for when they do.
--
-- Every column except name is optional, so the page shows only what is known.
-- Row Level Security: a signed-in user can only see, add and delete their own rows.
-- ============================================================================

create table public.wishlist_items (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid()
                 references auth.users (id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 120),
  image_url      text check (image_url is null or image_url like 'https://%'),
  price_amount   numeric(12, 2) check (price_amount is null or price_amount >= 0),
  price_currency char(3),
  retailer       text check (retailer is null or char_length(retailer) <= 80),
  product_url    text check (product_url is null or product_url like 'https://%'),
  created_at     timestamptz not null default now(),
  -- a price needs both an amount and its currency, or neither
  constraint wishlist_price_complete
    check ((price_amount is null) = (price_currency is null))
);

create index wishlist_items_user_created_idx
  on public.wishlist_items (user_id, created_at desc);

-- The same product cannot be wishlisted twice by the same person.
create unique index wishlist_items_user_product_key
  on public.wishlist_items (user_id, product_url)
  where product_url is not null;

-- A friendly limit of 200 items per user, with a clear error message.
create function public.enforce_wishlist_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.wishlist_items where user_id = new.user_id) >= 200 then
    raise exception 'Wishlist limit reached (200)' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger wishlist_items_limit
  before insert on public.wishlist_items
  for each row execute function public.enforce_wishlist_limit();

alter table public.wishlist_items enable row level security;

-- Nothing for signed-out visitors; no update permission (remove and re-add instead).
revoke all on table public.wishlist_items from anon, authenticated;
grant select, insert, delete on table public.wishlist_items to authenticated;

create policy "Users can view their own wishlist"
  on public.wishlist_items for select to authenticated
  using ( (select auth.uid()) = user_id );

create policy "Users can add to their own wishlist"
  on public.wishlist_items for insert to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "Users can remove from their own wishlist"
  on public.wishlist_items for delete to authenticated
  using ( (select auth.uid()) = user_id );
