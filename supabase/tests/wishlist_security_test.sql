-- ============================================================================
-- SECURITY TEST for public.wishlist_items. NOT RUN YET.
--
-- Run this in the Supabase SQL Editor AFTER
-- supabase/migrations/20261012000000_wishlist_items.sql has been applied.
--
-- It leaves nothing behind: it ends by raising an error on purpose, and Postgres
-- rolls back everything the script did, including the two temporary test users.
-- A message beginning "ALL SECURITY TESTS PASSED" is the success result. Any other
-- message is a failure to report.
-- ============================================================================
do $$
declare
  user_a   uuid := gen_random_uuid();
  user_b   uuid := gen_random_uuid();
  seen     int;
  affected int;
  failed   boolean;
  i        int;
begin
  insert into auth.users (id, instance_id, aud, role, email)
  values
    (user_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test-a@example.invalid'),
    (user_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test-b@example.invalid');

  -- ---- Act as user A ------------------------------------------------------
  perform set_config('request.jwt.claims',
                     json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  -- 1. A can add an item (user_id is filled in automatically).
  insert into public.wishlist_items (name, product_url, price_amount, price_currency)
  values ('Linen shirt', 'https://shop.example/linen-shirt', 1999, 'INR');

  -- 2. A can read their own item.
  select count(*) into seen from public.wishlist_items;
  if seen <> 1 then
    raise exception 'FAIL 2: user A should see 1 of their own rows, saw %', seen;
  end if;

  -- 3. A cannot add an item on behalf of B.
  failed := false;
  begin
    insert into public.wishlist_items (user_id, name) values (user_b, 'forged');
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'FAIL 3: user A was able to insert a row owned by user B';
  end if;

  -- 4. A cannot edit an item (no update permission).
  failed := false;
  begin
    update public.wishlist_items set name = 'changed';
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'FAIL 4: user A was able to update a wishlist item';
  end if;

  -- 5. The same product cannot be wishlisted twice.
  failed := false;
  begin
    insert into public.wishlist_items (name, product_url)
    values ('Linen shirt again', 'https://shop.example/linen-shirt');
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'FAIL 5: the same product was added twice';
  end if;

  -- 6. An insecure or malformed link is refused.
  failed := false;
  begin
    insert into public.wishlist_items (name, product_url) values ('Bad link', 'http://shop.example/x');
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'FAIL 6: a non-https product link was accepted';
  end if;

  -- 7. A price needs both an amount and a currency.
  failed := false;
  begin
    insert into public.wishlist_items (name, price_amount) values ('Half a price', 500);
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'FAIL 7: an amount without a currency was accepted';
  end if;

  -- 8. The 200-item limit is enforced.
  failed := false;
  begin
    for i in 2..201 loop
      insert into public.wishlist_items (name) values ('Item ' || i);
    end loop;
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'FAIL 8: user A exceeded the 200-item limit';
  end if;

  -- ---- Act as user B ------------------------------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claims',
                     json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  -- 9. B cannot see A's items.
  select count(*) into seen from public.wishlist_items;
  if seen <> 0 then
    raise exception 'FAIL 9: user B can see % of user A''s items', seen;
  end if;

  -- 10. B cannot delete A's items.
  delete from public.wishlist_items;
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'FAIL 10: user B deleted % of user A''s items', affected;
  end if;

  -- ---- Signed-out visitor (the anon role) ----------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
  execute 'set local role anon';

  -- 11. A signed-out visitor can neither read nor write.
  failed := false;
  begin
    perform 1 from public.wishlist_items;
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'FAIL 11: the anon role could read wishlist_items';
  end if;

  failed := false;
  begin
    insert into public.wishlist_items (name) values ('anon');
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'FAIL 12: the anon role could insert into wishlist_items';
  end if;

  execute 'reset role';
  raise exception 'ALL SECURITY TESTS PASSED (12 of 12). Nothing was kept: this error rolls the test back on purpose.';
end;
$$;
