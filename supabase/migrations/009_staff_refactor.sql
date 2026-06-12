-- ============================================================
-- 009_staff_refactor.sql
-- Staff portal refactor: granular roles, new stage model,
-- staff_members table, assignment columns, RPCs
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 0. UTILITY FUNCTION (idempotent)
-- ─────────────────────────────────────────────────────────────

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- ─────────────────────────────────────────────────────────────
-- 1. CREATE staff_members TABLE
-- ─────────────────────────────────────────────────────────────

create table if not exists staff_members (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  user_id         uuid references auth.users(id) on delete set null,
  created_by      uuid references auth.users(id) on delete set null,
  first_name      text not null,
  last_name       text not null,
  display_name    text,
  email           text not null unique,
  phone           text,
  job_title       text,
  role            text not null check (role in ('admin','onboarding','finance','purchasing_agent','client_success','circle_relations')),
  avatar_path     text,
  active          boolean not null default true
);

alter table staff_members enable row level security;

-- Staff can read all members; admin can write
create policy "staff_members: staff read all"
  on staff_members for select
  using (auth_role() not in ('client','circle'));

create policy "staff_members: admin insert"
  on staff_members for insert
  with check (auth_role() = 'admin');

create policy "staff_members: admin update"
  on staff_members for update
  using (auth_role() = 'admin');

-- Staff can update own record (for profile page)
create policy "staff_members: own update"
  on staff_members for update
  using (user_id = auth.uid());

create policy "staff_members: admin delete"
  on staff_members for delete
  using (auth_role() = 'admin');

create trigger staff_members_updated_at
  before update on staff_members
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 2. UPDATE profiles.role CONSTRAINT
-- ─────────────────────────────────────────────────────────────

-- First migrate existing 'staff' role to 'admin'
update profiles set role = 'admin' where role = 'staff';

-- Drop and recreate role constraint
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('client','circle','admin','onboarding','finance','purchasing_agent','client_success','circle_relations'));

-- ─────────────────────────────────────────────────────────────
-- 3. REMAP STAGE VALUES (data migration)
-- ─────────────────────────────────────────────────────────────

-- Drop existing stage check constraints before modifying data
alter table clients drop constraint if exists clients_lead_stage_check;
alter table clients drop constraint if exists clients_programme_stage_check;

-- Remap old lead_stage values → new slugs
update clients set lead_stage = 'new_lead'      where lead_stage = 'registered';
update clients set lead_stage = 'in_discovery'  where lead_stage in ('call_booked','call_complete');
update clients set lead_stage = 'pre_qual'       where lead_stage in ('pre_qual_requested','pre_qual_submitted');
update clients set lead_stage = 'in_review'      where lead_stage = 'pre_qual_review';
update clients set lead_stage = 'deferred'       where lead_stage = 'mover_interest';
-- eligible, not_eligible, deferred already correct (deferred may have been above)

-- Remap old programme_stage values → new slugs
-- Old onboarding stages → Phase 1 equivalents (they had no DAC yet)
update clients set lead_stage = 'in_review', programme_stage = null
  where programme_stage in ('onboarding_docs_requested','onboarding_under_review');
update clients set lead_stage = 'eligible', programme_stage = null
  where programme_stage = 'limit_letter_ready';

-- Old Phase 2 renames
update clients set programme_stage = 'dac_assigned'       where programme_stage = 'onboarding_docs_requested';
update clients set programme_stage = 'conveyancing'        where programme_stage in ('valuation_in_progress','approval_notice_issued');
update clients set programme_stage = 'contracts_signed'    where programme_stage = 'committed';

-- Old Phase 3 renames
update clients set programme_stage = 'servicing'           where programme_stage = 'servicing_active';
update clients set programme_stage = 'pathway_complete'    where programme_stage = 'completed';
-- searching, sale_agreed, in_home, exit_prep, option_window, exited stay unchanged

-- Add new constraints
alter table clients add constraint clients_lead_stage_check
  check (lead_stage in ('new_lead','in_discovery','pre_qual','in_review','eligible','not_eligible','deferred'));

alter table clients add constraint clients_programme_stage_check
  check (programme_stage in ('dac_assigned','searching','sale_agreed','conveyancing','contracts_signed','in_home','servicing','exit_prep','option_window','pathway_complete','exited'));

-- ─────────────────────────────────────────────────────────────
-- 4. ADD NEW COLUMNS
-- ─────────────────────────────────────────────────────────────

-- clients: assignment + deferral date
alter table clients
  add column if not exists assigned_to    uuid references staff_members(id) on delete set null,
  add column if not exists deferred_until date;

-- circle_members: assignment
alter table circle_members
  add column if not exists assigned_to uuid references staff_members(id) on delete set null;

-- dacs: purchasing agent
alter table dacs
  add column if not exists purchasing_agent_id uuid references staff_members(id) on delete set null;

-- ─────────────────────────────────────────────────────────────
-- 5. UPDATE document_requests status: received → needs_review
-- ─────────────────────────────────────────────────────────────

alter table document_requests drop constraint if exists document_requests_status_check;

update document_requests set status = 'needs_review' where status = 'received';

alter table document_requests add constraint document_requests_status_check
  check (status in ('requested','needs_review','approved','rejected'));

-- ─────────────────────────────────────────────────────────────
-- 6. CREATE RPCs
-- ─────────────────────────────────────────────────────────────

-- get_staff_invite: called anonymously when a new staff member follows their join link
create or replace function get_staff_invite(member_id uuid)
returns json
language plpgsql security definer set search_path = public as $$
declare
  rec staff_members%rowtype;
begin
  select * into rec from staff_members where id = member_id;
  if not found then
    return json_build_object('valid', false, 'reason', 'not_found');
  end if;
  if rec.user_id is not null then
    return json_build_object('valid', false, 'reason', 'already_joined');
  end if;
  return json_build_object(
    'valid',      true,
    'first_name', rec.first_name,
    'last_name',  rec.last_name,
    'email',      rec.email,
    'role',       rec.role
  );
end;
$$;

grant execute on function get_staff_invite(uuid) to anon, authenticated;

-- get_pipeline_counts: funnel data for the overview page
create or replace function get_pipeline_counts()
returns table (stage text, count bigint)
language sql security definer set search_path = public as $$
  select lead_stage::text as stage, count(*)::bigint as count
  from clients
  where lead_stage is not null
  group by lead_stage

  union all

  select programme_stage::text as stage, count(*)::bigint as count
  from clients
  where programme_stage is not null
  group by programme_stage;
$$;

grant execute on function get_pipeline_counts() to authenticated;

-- get_overview_metrics: aggregate stats for overview page mission numbers
create or replace function get_overview_metrics()
returns json
language plpgsql security definer set search_path = public as $$
declare
  result json;
begin
  select json_build_object(
    'total_prospects',       (select count(*) from clients where dac_id is null and lead_stage not in ('not_eligible')),
    'eligible_unassigned',   (select count(*) from clients where lead_stage = 'eligible' and dac_id is null),
    'on_pathway_count',      (select count(*) from clients where programme_stage in ('in_home','servicing','exit_prep','option_window')),
    'pathway_complete_count',(select count(*) from clients where programme_stage = 'pathway_complete'),
    'circle_member_count',   (select count(*) from circle_members),
    'circle_kyc_complete',   (select count(*) from circle_members where kyc_status = 'complete'),
    'total_committed',       (select coalesce(sum(amount),0) from subscriptions where status not in ('soft_commit','withdrawn')),
    'total_funded',          (select coalesce(sum(amount),0) from subscriptions where status in ('funded','active','redeeming','redeemed')),
    'open_dac_count',        (select count(*) from dacs where status = 'open')
  ) into result;
  return result;
end;
$$;

grant execute on function get_overview_metrics() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 7. UPDATE handle_new_user TRIGGER
-- New priority chain: circle_members → staff_members → client
-- ─────────────────────────────────────────────────────────────

create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  circle_rec  circle_members%rowtype;
  staff_rec   staff_members%rowtype;
begin
  -- Priority 1: Circle member invite
  select * into circle_rec
  from circle_members
  where email = new.email and user_id is null
  limit 1;

  if found then
    insert into profiles (id, role) values (new.id, 'circle');
    update circle_members set user_id = new.id where id = circle_rec.id;
    return new;
  end if;

  -- Priority 2: Staff member invite
  select * into staff_rec
  from staff_members
  where email = new.email and user_id is null
  limit 1;

  if found then
    insert into profiles (id, role) values (new.id, staff_rec.role);
    update staff_members set user_id = new.id where id = staff_rec.id;
    return new;
  end if;

  -- Default: new client/prospect
  insert into profiles (id, role) values (new.id, 'client');
  insert into clients (user_id, first_name, last_name, email, lead_stage)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.email,
    'new_lead'
  );

  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 8. FIX EXISTING RLS POLICIES
-- Old policies checked auth_role() = 'staff' which no longer
-- exists. Replace with NOT IN ('client','circle') so all granular
-- staff roles (admin, onboarding, finance, etc.) are covered.
-- ─────────────────────────────────────────────────────────────

-- clients
drop policy if exists "clients: staff read all" on clients;
drop policy if exists "clients: staff update all" on clients;
create policy "clients: staff read all" on clients for select using (auth_role() not in ('client','circle'));
create policy "clients: staff update all" on clients for update using (auth_role() not in ('client','circle'));

-- dacs
drop policy if exists "dacs: staff all" on dacs;
create policy "dacs: staff all" on dacs for all using (auth_role() not in ('client','circle'));

-- document_requests
drop policy if exists "doc_requests: staff all" on document_requests;
create policy "doc_requests: staff all" on document_requests for all using (auth_role() not in ('client','circle'));

-- events
drop policy if exists "events: staff read all" on events;
drop policy if exists "events: staff insert" on events;
create policy "events: staff read all" on events for select using (auth_role() not in ('client','circle'));
create policy "events: staff insert" on events for insert with check (auth_role() not in ('client','circle'));

-- property_cases
drop policy if exists "property_cases: staff all" on property_cases;
create policy "property_cases: staff all" on property_cases for all using (auth_role() not in ('client','circle'));

-- calculator_snapshots
drop policy if exists "snapshots: staff read all" on calculator_snapshots;
create policy "snapshots: staff read all" on calculator_snapshots for select using (auth_role() not in ('client','circle'));

-- consents
drop policy if exists "consents: staff read all" on consents;
create policy "consents: staff read all" on consents for select using (auth_role() not in ('client','circle'));

-- circle_members
drop policy if exists "circle_members: staff all" on circle_members;
create policy "circle_members: staff all" on circle_members for all using (auth_role() not in ('client','circle'));

-- circle_member_documents
drop policy if exists "circle_member_documents: staff all" on circle_member_documents;
create policy "circle_member_documents: staff all" on circle_member_documents for all using (auth_role() not in ('client','circle'));

-- circle_member_notes
drop policy if exists "circle_member_notes: staff select" on circle_member_notes;
drop policy if exists "circle_member_notes: staff insert" on circle_member_notes;
create policy "circle_member_notes: staff select" on circle_member_notes for select using (auth_role() not in ('client','circle'));
create policy "circle_member_notes: staff insert" on circle_member_notes for insert with check (auth_role() not in ('client','circle'));

-- dac_documents
drop policy if exists "dac_documents: staff all" on dac_documents;
create policy "dac_documents: staff all" on dac_documents for all using (auth_role() not in ('client','circle'));

-- subscriptions
drop policy if exists "subscriptions: staff all" on subscriptions;
create policy "subscriptions: staff all" on subscriptions for all using (auth_role() not in ('client','circle'));
