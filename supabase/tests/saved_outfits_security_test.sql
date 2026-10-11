-- ============================================================================
-- SECURITY TEST for public.saved_outfits. NOT RUN YET.
--
-- Run this in the Supabase SQL Editor AFTER the migration has been applied.
--
-- It is built to leave nothing behind: it ends by raising an error on purpose,
-- and Postgres rolls back everything the script did, including the two
-- temporary test users it creates. A message beginning "ALL SECURITY TESTS
-- PASSED" is the success result. Any other message is a failure to report.
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
  -- Two temporary users (removed by the rollback at the end).
  insert into auth.users (id, instance_id, aud, role, email)
  values
    (user_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test-a@example.invalid'),
    (user_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test-b@example.invalid');

  -- ---- Act as user A ------------------------------------------------------
  perform set_config('request.jwt.claims',
                     json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  -- 1. A can save an outfit (user_id is filled in automatically).
  insert into public.saved_outfits (name, outfit)
  values ('A first', '{"name":"A first"}'::jsonb);

  -- 2. A can read their own outfit.
  select count(*) into seen from public.saved_outfits;
  if seen <> 1 then
    raise exception 'FAIL 2: user A should see 1 of their own rows, saw %', seen;
  end if;

  -- 3. A cannot save an outfit on behalf of B.
  failed := false;
  begin
    insert into public.saved_outfits (user_id, name, outfit)
    values (user_b, 'forged', '{"x":1}'::jsonb);
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'FAIL 3: user A was able to insert a row owned by user B';
  end if;

  -- 4. A cannot edit a saved outfit (no update permission).
  failed := false;
  begin
    update public.saved_outfits set name = 'changed';
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'FAIL 4: user A was able to update a saved outfit';
  end if;

  -- 5. Oversized outfit data is refused.
  failed := false;
  begin
    insert into public.saved_outfits (name, outfit)
    values ('big', jsonb_build_object('blob', repeat('x', 9000)));
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'FAIL 5: an outfit larger than 8 KB was accepted';
  end if;

  -- 6. The 100-outfit limit applies (A already has 1, add 99 more, then one more).
  for i in 1..99 loop
    insert into public.saved_outfits (name, outfit)
    values ('filler ' || i, '{"x":1}'::jsonb);
  end loop;
  failed := false;
  begin
    insert into public.saved_outfits (name, outfit) values ('one too many', '{"x":1}'::jsonb);
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'FAIL 6: user A was able to exceed 100 saved outfits';
  end if;

  execute 'reset role';

  -- ---- Act as user B ------------------------------------------------------
  perform set_config('request.jwt.claims',
                     json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  -- 7. B cannot see any of A's outfits.
  select count(*) into seen from public.saved_outfits;
  if seen <> 0 then
    raise exception 'FAIL 7: user B can see % of user A''s rows', seen;
  end if;

  -- 8. B cannot delete A's outfits.
  delete from public.saved_outfits;
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'FAIL 8: user B deleted % of user A''s rows', affected;
  end if;

  execute 'reset role';

  -- ---- Act as a signed-out visitor ---------------------------------------
  perform set_config('request.jwt.claims', '', true);
  execute 'set local role anon';

  -- 9. A signed-out visitor cannot read the table at all.
  failed := false;
  begin
    perform 1 from public.saved_outfits limit 1;
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'FAIL 9: a signed-out visitor was able to read saved outfits';
  end if;

  execute 'reset role';

  -- ---- Back as the owner: A's data must still be there --------------------
  select count(*) into seen from public.saved_outfits where user_id = user_a;
  if seen <> 100 then
    raise exception 'FAIL 10: expected user A to still have 100 rows, found %', seen;
  end if;

  -- Success. Raising an error here is deliberate: it rolls back everything above.
  raise exception 'ALL SECURITY TESTS PASSED (10 of 10). Nothing was saved: this script always rolls back.';
end;
$$;
