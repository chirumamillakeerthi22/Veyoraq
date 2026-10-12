-- ============================================================================
-- TEST for the audience column on public.wishlist_items. NOT RUN YET.
--
-- Run it in the Supabase SQL Editor AFTER
-- supabase/migrations/20261013000000_wishlist_item_audience.sql has been applied.
-- It rolls itself back on purpose; "ALL AUDIENCE TESTS PASSED" is the success result.
-- ============================================================================
do $$
declare
  user_a uuid := gen_random_uuid();
  failed boolean;
  seen   int;
begin
  insert into auth.users (id, instance_id, aud, role, email)
  values (user_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test-aud@example.invalid');

  perform set_config('request.jwt.claims',
                     json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  -- 1. Both valid audiences, and "not recorded", are accepted.
  insert into public.wishlist_items (name, product_url, audience)
  values ('Women item', 'https://shop.example/w', 'women'),
         ('Men item',   'https://shop.example/m', 'men'),
         ('Old item',   'https://shop.example/o', null);

  select count(*) into seen from public.wishlist_items;
  if seen <> 3 then
    raise exception 'FAIL 1: expected 3 rows, saw %', seen;
  end if;

  -- 2. Anything else is rejected.
  failed := false;
  begin
    insert into public.wishlist_items (name, product_url, audience)
    values ('Bad', 'https://shop.example/b', 'kids');
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'FAIL 2: an invalid audience value was accepted';
  end if;

  -- 3. The audience cannot be edited after the fact (no update grant).
  failed := false;
  begin
    update public.wishlist_items set audience = 'men' where audience = 'women';
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'FAIL 3: the audience of a saved item could be edited';
  end if;

  execute 'reset role';
  raise exception 'ALL AUDIENCE TESTS PASSED (3 of 3). Nothing was kept: this error rolls the test back on purpose.';
end;
$$;
