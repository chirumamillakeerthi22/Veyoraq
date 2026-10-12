-- Records which audience (women or men) a wishlist product was classified for.
--
-- Additive and non-destructive: one new nullable column. Existing rows keep NULL
-- ("not recorded") and are never relabelled. No policy changes are needed, because
-- the existing owner-only row level security already covers every column.
--
-- PROPOSED. Not applied until the owner runs it in the Supabase SQL Editor.

alter table public.wishlist_items
  add column if not exists audience text
  check (audience is null or audience in ('women', 'men'));
