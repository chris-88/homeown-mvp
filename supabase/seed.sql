-- ============================================================
-- SEED — development test accounts
-- ============================================================
--
-- Step 1: Create both users via Supabase Dashboard
--   Authentication → Users → Add user
--   client@homeown.test   (any password)
--   staff@homeown.test    (any password)
--
-- Step 2: Copy the UUIDs from the Dashboard and paste them below,
--   then run this file in the SQL editor.
--
-- DO NOT insert directly into auth.users — GoTrue manages required
-- internal columns and direct inserts produce corrupted records.
-- ============================================================

-- Paste the UUIDs from the Dashboard here:
do $$
declare
  client_uuid uuid := '<client-uuid-from-dashboard>';
  staff_uuid  uuid := '<staff-uuid-from-dashboard>';
begin

  -- Promote staff user (trigger already created profile with role='client')
  update profiles set role = 'staff' where id = staff_uuid;

  -- Create client record linked to the client auth user
  insert into clients (user_id, first_name, last_name, email, lead_stage)
  values (client_uuid, 'Test', 'Client', 'client@homeown.test', 'registered')
  on conflict (user_id) do nothing;

end $$;
