-- ============================================================================
-- PROPOSED, NOT APPLIED. Needs the owner's explicit approval first.
--
-- Purpose: make it impossible, at the database level, for the same look to be saved
-- twice by the same person. The app already prevents this (it checks the database
-- before saving, one save at a time per browser tab); this adds a guarantee that also
-- holds when two tabs or two devices save at the same moment.
--
-- THIS CHANGES AN EXISTING TABLE. Review step 1 before running anything.
-- ============================================================================

-- Step 1: look for existing duplicates. Run this on its own first; it only reads.
-- If it returns rows, the index in step 3 will fail until they are dealt with.
--
-- select user_id, md5(outfit::text) as outfit_hash, count(*) as copies
-- from public.saved_outfits
-- group by user_id, md5(outfit::text)
-- having count(*) > 1;

-- Step 2 (ONLY if step 1 returned rows, and only after reviewing them): keep the
-- oldest copy of each duplicated look and delete the newer ones. This DELETES data.
--
-- delete from public.saved_outfits a
-- using public.saved_outfits b
-- where a.user_id = b.user_id
--   and md5(a.outfit::text) = md5(b.outfit::text)
--   and a.created_at > b.created_at;

-- Step 3: the rule itself. jsonb is stored in a normalised form, so the same look
-- always produces the same text and therefore the same hash.
create unique index saved_outfits_user_outfit_key
  on public.saved_outfits (user_id, md5(outfit::text));
