-- ============================================================================
-- SECURITY TEST for public.colour_reports. NOT RUN YET.
--
-- Run this in the Supabase SQL Editor now that supabase/proposed/colour_reports.sql
-- has been applied. It is built to leave nothing behind: it ends by raising an
-- error on purpose, and Postgres rolls back everything the script did, including
-- the two temporary test users it creates. A message beginning
-- "ALL SECURITY TESTS PASSED" is the success result. Any other message is a
-- failure to report.
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

  -- 1. A can save a report (user_id is filled in automatically).
  insert into public.colour_reports (id, report) values ('a-one', '{"summary":"A"}'::jsonb);

  -- 2. A can read their own report.
  select count(*) into seen from public.colour_reports;
  if seen <> 1 then
    raise exception 'FAIL 2: user A should see 1 of their own rows, saw %', seen;
  end if;

  -- 3. A cannot save a report on behalf of B.
  failed := false;
  begin
    insert into public.colour_reports (id, user_id, report)
    values ('forged', user_b, '{"x":1}'::jsonb);
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'FAIL 3: user A was able to insert a row owned by user B';
  end if;

  -- 4. A cannot edit a report (no update permission).
  failed := false;
  begin
    update public.colour_reports set report = '{"x":2}'::jsonb;
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'FAIL 4: user A was able to update a report';
  end if;

  -- 5. A report that is not a JSON object is refused.
  failed := false;
  begin
    insert into public.colour_reports (id, report) values ('arr', '[1,2]'::jsonb);
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'FAIL 5: a non-object report was accepted';
  end if;

  -- 6. An oversized report is refused (limit 16 KB).
  failed := false;
  begin
    insert into public.colour_reports (id, report)
    values ('big', jsonb_build_object('pad', repeat('x', 20000)));
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'FAIL 6: an oversized report was accepted';
  end if;

  -- 7. An id with unsafe characters is refused.
  failed := false;
  begin
    insert into public.colour_reports (id, report) values ('bad id!', '{"x":1}'::jsonb);
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'FAIL 7: an unsafe id was accepted';
  end if;

  -- 8. The 50-report limit is enforced.
  failed := false;
  begin
    for i in 2..51 loop
      insert into public.colour_reports (id, report) values ('a-' || i, '{"x":1}'::jsonb);
    end loop;
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'FAIL 8: user A exceeded the 50-report limit';
  end if;

  -- ---- Act as user B ------------------------------------------------------
  -- (switch back first, then become B)
  execute 'reset role';
  perform set_config('request.jwt.claims',
                     json_build_object('sub', user_b, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  -- 9. B cannot see A's reports.
  select count(*) into seen from public.colour_reports;
  if seen <> 0 then
    raise exception 'FAIL 9: user B can see % of user A''s reports', seen;
  end if;

  -- 10. B cannot delete A's reports.
  delete from public.colour_reports where id = 'a-one';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'FAIL 10: user B deleted % of user A''s reports', affected;
  end if;

  -- ---- Signed-out visitor (the anon role) ----------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
  execute 'set local role anon';

  -- 11. A signed-out visitor can neither read nor write.
  failed := false;
  begin
    perform 1 from public.colour_reports;
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'FAIL 11: the anon role could read colour_reports';
  end if;

  failed := false;
  begin
    insert into public.colour_reports (id, report) values ('anon', '{"x":1}'::jsonb);
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'FAIL 12: the anon role could insert into colour_reports';
  end if;

  -- Everything passed. Raise on purpose so ALL of the above is rolled back.
  execute 'reset role';
  raise exception 'ALL SECURITY TESTS PASSED (12 of 12). Nothing was kept: this error rolls the test back on purpose.';
end;
$$;
