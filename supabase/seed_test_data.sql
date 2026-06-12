-- ============================================================
-- seed_test_data.sql
-- Full pipeline test data for all stages and all portals.
--
-- INSTRUCTIONS:
-- 1. Run this against your Supabase project from the SQL editor
--    (or: supabase db execute --file supabase/seed_test_data.sql)
-- 2. Staff members have user_id = NULL — to activate one, create
--    their auth user via Dashboard → Authentication → Add User,
--    using the email in staff_members. The trigger will link them.
-- 3. Do NOT run this in production.
-- ============================================================

-- ─── Wipe test data (preserves auth.users and profiles) ──────
TRUNCATE
  subscriptions,
  circle_member_notes,
  circle_member_documents,
  dac_documents,
  circle_members,
  document_requests,
  property_cases,
  calculator_snapshots,
  events,
  clients,
  dacs,
  staff_members
RESTART IDENTITY CASCADE;

-- ─── Fixed UUIDs ─────────────────────────────────────────────
DO $$
DECLARE
  -- Staff
  s_onboarding       UUID := 'b1000000-0000-0000-0000-000000000001';
  s_finance          UUID := 'b1000000-0000-0000-0000-000000000002';
  s_purchasing       UUID := 'b1000000-0000-0000-0000-000000000003';
  s_client_success   UUID := 'b1000000-0000-0000-0000-000000000004';
  s_circle_relations UUID := 'b1000000-0000-0000-0000-000000000005';

  -- DACs
  dac1_id            UUID := 'd1000000-0000-0000-0000-000000000001';  -- Open / fundraising
  dac2_id            UUID := 'd1000000-0000-0000-0000-000000000002';  -- Closed / live

  -- Prospects (Phase 1)
  p_new1             UUID := 'c1000000-0000-0000-0000-000000000001';
  p_new2             UUID := 'c1000000-0000-0000-0000-000000000002';
  p_disc1            UUID := 'c1000000-0000-0000-0000-000000000003';
  p_disc2            UUID := 'c1000000-0000-0000-0000-000000000004';
  p_prequal1         UUID := 'c1000000-0000-0000-0000-000000000005';
  p_prequal2         UUID := 'c1000000-0000-0000-0000-000000000006';
  p_review1          UUID := 'c1000000-0000-0000-0000-000000000007';
  p_review2          UUID := 'c1000000-0000-0000-0000-000000000008';
  p_eligible1        UUID := 'c1000000-0000-0000-0000-000000000009';
  p_eligible2        UUID := 'c1000000-0000-0000-0000-000000000010';
  p_notelig          UUID := 'c1000000-0000-0000-0000-000000000011';
  p_deferred         UUID := 'c1000000-0000-0000-0000-000000000012';

  -- Phase 2 clients (DAC 1)
  c_dac_assigned     UUID := 'c1000000-0000-0000-0000-000000000021';
  c_searching        UUID := 'c1000000-0000-0000-0000-000000000022';
  c_sale_agreed      UUID := 'c1000000-0000-0000-0000-000000000023';
  c_conveyancing     UUID := 'c1000000-0000-0000-0000-000000000024';
  c_contracts        UUID := 'c1000000-0000-0000-0000-000000000025';

  -- Phase 3 clients (DAC 2)
  c_in_home          UUID := 'c1000000-0000-0000-0000-000000000031';
  c_servicing        UUID := 'c1000000-0000-0000-0000-000000000032';
  c_exit_prep        UUID := 'c1000000-0000-0000-0000-000000000033';
  c_option_window    UUID := 'c1000000-0000-0000-0000-000000000034';

  -- Circle members
  cm1                UUID := 'e1000000-0000-0000-0000-000000000001';
  cm2                UUID := 'e1000000-0000-0000-0000-000000000002';
  cm3                UUID := 'e1000000-0000-0000-0000-000000000003';
  cm4                UUID := 'e1000000-0000-0000-0000-000000000004';
  cm5                UUID := 'e1000000-0000-0000-0000-000000000005';

BEGIN

-- ─── 1. Staff members ────────────────────────────────────────
INSERT INTO staff_members (id, first_name, last_name, email, role, job_title, active) VALUES
  (s_onboarding,       'Sara',    'O''Brien',   'sara.obrien@homeown.ie',   'onboarding',       'Onboarding Specialist', true),
  (s_finance,          'Michael', 'Keane',      'michael.keane@homeown.ie', 'finance',           'Finance Manager',       true),
  (s_purchasing,       'Patrick', 'Walsh',      'patrick.walsh@homeown.ie', 'purchasing_agent', 'Purchasing Agent',      true),
  (s_client_success,   'Aoife',   'Murphy',     'aoife.murphy@homeown.ie',  'client_success',   'Client Success Manager',true),
  (s_circle_relations, 'James',   'Connolly',   'james.connolly@homeown.ie','circle_relations', 'Circle Relations',      true);

-- ─── 2. DACs ─────────────────────────────────────────────────
INSERT INTO dacs (id, name, cohort_label, status, description, geographic_focus,
  property_count, target_sub_amount, target_senior_amount, coupon_rate,
  no_call_months, term_months, open_date, close_date, purchasing_agent_id) VALUES
(
  dac1_id, 'Homeown DAC 001', '2026-A', 'open',
  'First cohort — Dublin commuter belt. Target 8 properties across Kildare and Meath.',
  'Dublin commuter belt',
  8, 1600000, 6400000, 8.50,
  12, 18,
  '2026-03-01', NULL,
  s_purchasing
),
(
  dac2_id, 'Homeown DAC 000', '2025-A', 'closed',
  'Pilot cohort — fully subscribed and live. Properties in Louth and Meath.',
  'Louth / Meath',
  4, 800000, 3200000, 8.00,
  12, 18,
  '2025-06-01', '2025-09-30',
  s_purchasing
);

-- ─── 3. Prospects — Phase 1 ───────────────────────────────────
INSERT INTO clients (id, first_name, last_name, email, phone, lead_stage, target_price, target_areas, household_size, assigned_to) VALUES
  -- new_lead
  (p_new1,    'Ciarán',  'Sullivan',    'ciaran.sullivan@example.com',    '087-1234567', 'new_lead',     320000, 'Kildare',       3, s_onboarding),
  (p_new2,    'Rachel',  'Byrne',       'rachel.byrne@example.com',       '086-2345678', 'new_lead',     340000, 'Meath',         2, NULL),
  -- in_discovery
  (p_disc1,   'Tom',     'Gallagher',   'tom.gallagher@example.com',      '085-3456789', 'in_discovery', 295000, 'Wicklow',       4, s_onboarding),
  (p_disc2,   'Fiona',   'Kelly',       'fiona.kelly@example.com',        '087-4567890', 'in_discovery', 310000, 'Kildare',       2, s_onboarding),
  -- pre_qual
  (p_prequal1,'Liam',    'O''Donoghue', 'liam.odonoghue@example.com',     '086-5678901', 'pre_qual',     330000, 'Meath',         3, s_onboarding),
  (p_prequal2,'Siobhán', 'Burke',       'siobhan.burke@example.com',      '085-6789012', 'pre_qual',     280000, 'Louth',         2, s_onboarding),
  -- in_review
  (p_review1, 'David',   'McCarthy',    'david.mccarthy@example.com',     '087-7890123', 'in_review',    350000, 'Dublin',        3, s_onboarding),
  (p_review2, 'Emma',    'Fitzgerald',  'emma.fitzgerald@example.com',    '086-8901234', 'in_review',    300000, 'Kildare',       2, s_onboarding),
  -- eligible
  (p_eligible1,'Conor',  'O''Neill',    'conor.oneill@example.com',       '085-9012345', 'eligible',     325000, 'Meath',         3, s_onboarding),
  (p_eligible2,'Marie',  'Riordan',     'marie.riordan@example.com',      '087-0123456', 'eligible',     290000, 'Louth',         2, s_finance),
  -- terminal
  (p_notelig, 'Alan',    'Higgins',     'alan.higgins@example.com',       '086-1234560', 'not_eligible', 500000, 'South Dublin',  1, NULL),
  (p_deferred,'Sandra',  'Walsh',       'sandra.walsh@example.com',       '085-2345601', 'deferred',     315000, 'Wicklow',       3, s_onboarding);

-- Deferred_until for Sandra
UPDATE clients SET deferred_until = '2026-09-01' WHERE id = p_deferred;

-- ─── 4. Phase 2 clients — DAC 001 ────────────────────────────
INSERT INTO clients (id, first_name, last_name, email, phone, lead_stage, programme_stage, dac_id, target_price, target_areas, household_size, assigned_to) VALUES
  (c_dac_assigned, 'Declan',  'Murphy',     'declan.murphy@example.com',     '087-3456780', 'eligible', 'dac_assigned',     dac1_id, 310000, 'Kildare', 3, s_purchasing),
  (c_searching,    'Sarah',   'Quinn',       'sarah.quinn@example.com',       '086-4567801', 'eligible', 'searching',        dac1_id, 295000, 'Meath',   2, s_purchasing),
  (c_sale_agreed,  'Brian',   'Dempsey',     'brian.dempsey@example.com',     '085-5678012', 'eligible', 'sale_agreed',      dac1_id, 285000, 'Meath',   3, s_purchasing),
  (c_conveyancing, 'Niamh',   'O''Sullivan', 'niamh.osullivan@example.com',   '087-6789023', 'eligible', 'conveyancing',     dac1_id, 320000, 'Kildare', 2, s_purchasing),
  (c_contracts,    'John',    'Brennan',     'john.brennan@example.com',      '086-7890034', 'eligible', 'contracts_signed', dac1_id, 340000, 'Louth',   4, s_purchasing);

-- ─── 5. Phase 3 clients — DAC 002 ────────────────────────────
INSERT INTO clients (id, first_name, last_name, email, phone, lead_stage, programme_stage, dac_id, pathway_start_date, target_price, household_size, assigned_to) VALUES
  (c_in_home,      'Karen',   'Doyle',      'karen.doyle@example.com',       '085-8901045', 'eligible', 'in_home',      dac2_id, '2026-03-15', 295000, 3, s_client_success),
  (c_servicing,    'Patrick', 'Whelan',     'patrick.whelan@example.com',    '087-9012056', 'eligible', 'servicing',    dac2_id, '2025-10-01', 280000, 2, s_client_success),
  (c_exit_prep,    'Mary',    'Connolly',   'mary.connolly@example.com',     '086-0123067', 'eligible', 'exit_prep',    dac2_id, '2025-07-01', 310000, 4, s_client_success),
  (c_option_window,'Stephen', 'Ryan',       'stephen.ryan@example.com',      '085-1234078', 'eligible', 'option_window',dac2_id, '2025-04-01', 325000, 2, s_client_success);

-- ─── 6. Events / staff notes ─────────────────────────────────

-- Discovery call booked for Tom
INSERT INTO events (client_id, event_type, payload, visibility, created_at) VALUES
  (p_disc1, 'staff_note', '{"text":"Called Tom. Good candidate — high motivation, solid income. Booking formal discovery."}', 'internal', NOW() - INTERVAL '8 days'),
  (p_disc1, 'stage_changed', '{"from":"new_lead","to":"in_discovery"}', 'internal', NOW() - INTERVAL '9 days');

-- Pre-qual submitted for Liam
INSERT INTO events (client_id, event_type, payload, visibility, created_at) VALUES
  (p_prequal1, 'stage_changed', '{"from":"in_discovery","to":"pre_qual"}', 'internal', NOW() - INTERVAL '5 days'),
  (p_prequal1, 'staff_note', '{"text":"Pre-qual pack received. Checking payslips and bank statements."}', 'internal', NOW() - INTERVAL '4 days');

-- Review stage note for David
INSERT INTO events (client_id, event_type, payload, visibility, created_at) VALUES
  (p_review1, 'stage_changed', '{"from":"pre_qual","to":"in_review"}', 'internal', NOW() - INTERVAL '3 days'),
  (p_review1, 'staff_note', '{"text":"Documents look solid. Minor gap in employment history — chasing HR letter."}', 'internal', NOW() - INTERVAL '2 days');

-- Phase 2 events for Brian (sale agreed)
INSERT INTO events (client_id, event_type, payload, visibility, created_at) VALUES
  (c_sale_agreed, 'stage_changed', '{"from":"dac_assigned","to":"searching"}', 'internal', NOW() - INTERVAL '30 days'),
  (c_sale_agreed, 'stage_changed', '{"from":"searching","to":"sale_agreed"}', 'internal', NOW() - INTERVAL '7 days'),
  (c_sale_agreed, 'staff_note', '{"text":"Sale agreed at €285k on 14 Meadow Close, Trim, Co. Meath. Solicitors instructed."}', 'internal', NOW() - INTERVAL '6 days');

-- Phase 3 events for Karen (in home)
INSERT INTO events (client_id, event_type, payload, visibility, created_at) VALUES
  (c_in_home, 'stage_changed', '{"from":"contracts_signed","to":"in_home"}', 'internal', NOW() - INTERVAL '88 days'),
  (c_in_home, 'staff_note', '{"text":"Keys handed over 15 March. Monthly service fee DD confirmed. Insurance in place."}', 'internal', NOW() - INTERVAL '87 days'),
  (c_in_home, 'staff_note', '{"text":"Month 3 check-in call complete. Everything on track."}', 'internal', NOW() - INTERVAL '3 days');

-- Exit prep note for Mary
INSERT INTO events (client_id, event_type, payload, visibility, created_at) VALUES
  (c_exit_prep, 'stage_changed', '{"from":"servicing","to":"exit_prep"}', 'internal', NOW() - INTERVAL '14 days'),
  (c_exit_prep, 'staff_note', '{"text":"Option window approaching in approx 4 months. Sent exit pack. Awaiting mortgage broker introduction."}', 'internal', NOW() - INTERVAL '10 days');

-- ─── 7. Document requests ─────────────────────────────────────
-- For David (in_review) — some uploaded, some pending
INSERT INTO document_requests (client_id, doc_type, status) VALUES
  (p_review1, 'photo_id',         'approved'),
  (p_review1, 'proof_of_address', 'approved'),
  (p_review1, 'payslip',          'needs_review'),
  (p_review1, 'bank_statement',   'needs_review'),
  (p_review1, 'employer_letter',  'requested');

-- For Niamh (conveyancing) — all approved
INSERT INTO document_requests (client_id, doc_type, status) VALUES
  (c_conveyancing, 'photo_id',         'approved'),
  (c_conveyancing, 'proof_of_address', 'approved'),
  (c_conveyancing, 'payslip',          'approved'),
  (c_conveyancing, 'bank_statement',   'approved');

-- ─── 8. Property case for Brian (sale agreed) ─────────────────
INSERT INTO property_cases (client_id, status, address_line_1, city, county, eircode, asking_price, agreed_price) VALUES
  (c_sale_agreed, 'submitted', '14 Meadow Close', 'Trim', 'Meath', 'C15 XY99', 290000, 285000);

-- ─── 9. Circle members ────────────────────────────────────────
INSERT INTO circle_members (id, first_name, last_name, email, phone, kyc_status, source, assigned_to) VALUES
  (cm1, 'Anthony', 'Moran',    'anthony.moran@example.com',    '087-5551001', 'complete',    'Referral',     s_circle_relations),
  (cm2, 'Lucy',    'Chen',     'lucy.chen@example.com',        '086-5552002', 'complete',    'LinkedIn',     s_circle_relations),
  (cm3, 'Michael', 'O''Brien', 'michael.obrien.ci@example.com','085-5553003', 'complete',    'Event',        s_circle_relations),
  (cm4, 'Claire',  'Burke',    'claire.burke@example.com',     '087-5554004', 'in_progress', 'Referral',     s_circle_relations),
  (cm5, 'Robert',  'Smyth',    'robert.smyth@example.com',     '086-5555005', 'pending',     'Website',      s_circle_relations);

-- ─── 10. Subscriptions ───────────────────────────────────────

-- DAC 001 (open — fundraising): Anthony soft commit, Lucy subscribed, Michael subscribed
INSERT INTO subscriptions (circle_member_id, dac_id, amount, initiated_by, status, committed_at) VALUES
  (cm1, dac1_id, 50000,  'member', 'soft_commit', NULL),
  (cm2, dac1_id, 75000,  'member', 'subscribed',  NOW() - INTERVAL '20 days'),
  (cm3, dac1_id, 100000, 'member', 'subscribed',  NOW() - INTERVAL '15 days');

-- DAC 002 (closed — live): Claire and Robert are active
INSERT INTO subscriptions (circle_member_id, dac_id, amount, initiated_by, status, committed_at, funds_requested_at, funded_at, coupon_rate_locked) VALUES
  (cm4, dac2_id, 150000, 'staff',  'active', NOW() - INTERVAL '9 months', NOW() - INTERVAL '8 months', NOW() - INTERVAL '7 months', 8.00),
  (cm5, dac2_id, 200000, 'member', 'active', NOW() - INTERVAL '9 months', NOW() - INTERVAL '8 months', NOW() - INTERVAL '7 months', 8.00);

-- ─── 11. Circle member notes ─────────────────────────────────
INSERT INTO circle_member_notes (circle_member_id, text) VALUES
  (cm1, 'Introductory call complete. Anthony is interested in DAC 001 but wants to review the info memo first.'),
  (cm1, 'Sent information memorandum. Following up in 1 week.'),
  (cm2, 'Lucy is fully KYC complete. Subscribed €75k to DAC 001. Excellent investor.'),
  (cm4, 'KYC docs received. Awaiting bank reference letter to complete.'),
  (cm4, 'DAC 002 investment confirmed. Monthly reporting pack sent.');

END $$;

-- ─── Summary ─────────────────────────────────────────────────
SELECT 'staff_members' AS table_name, count(*) FROM staff_members
UNION ALL SELECT 'dacs', count(*) FROM dacs
UNION ALL SELECT 'clients (prospects)', count(*) FROM clients WHERE dac_id IS NULL
UNION ALL SELECT 'clients (phase 2)', count(*) FROM clients WHERE programme_stage IN ('dac_assigned','searching','sale_agreed','conveyancing','contracts_signed')
UNION ALL SELECT 'clients (phase 3)', count(*) FROM clients WHERE programme_stage IN ('in_home','servicing','exit_prep','option_window','pathway_complete','exited')
UNION ALL SELECT 'circle_members', count(*) FROM circle_members
UNION ALL SELECT 'subscriptions', count(*) FROM subscriptions
UNION ALL SELECT 'events', count(*) FROM events
UNION ALL SELECT 'document_requests', count(*) FROM document_requests;
