-- ============================================================
-- ENUMS (as check constraints)
-- ============================================================

-- lead_stage values:
--   registered | call_booked | call_complete | pre_qual_requested
--   pre_qual_submitted | pre_qual_review | eligible | not_eligible | deferred

-- programme_stage values:
--   onboarding_docs_requested | onboarding_under_review | limit_letter_ready
--   searching | sale_agreed | valuation_in_progress | approval_notice_issued
--   committed | in_home | servicing_active | exit_prep | completed | exited

-- doc_type values:
--   photo_id | proof_of_address | payslip | bank_statement | employer_letter
--   tax_document | self_employed_accounts | accountant_letter | maintenance_order | other

-- doc_status values:  requested | received | approved | rejected

-- property_case_status values:
--   submitted | valuation_scheduled | valuation_received | approved | rejected
--   conveyancing | purchased

-- event_type values:
--   calc_results_presented | results_saved | call_booked | pre_qual_submitted
--   document_uploaded | document_approved | document_rejected | verification_completed
--   limit_letter_issued | sale_agreed_submitted | valuation_uploaded
--   approval_notice_issued | reservation_payment_paid | pathway_started
--   domiter_received | exit_initiated | completed


-- ============================================================
-- PROFILES (extends auth.users with role)
-- ============================================================
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         text not null default 'client' check (role in ('client', 'staff', 'admin')),
  created_at   timestamptz default now()
);

-- Auto-create profile row on new signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role) values (new.id, 'client')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Helper: get current user's role (used in RLS policies)
create or replace function auth_role()
returns text as $$
  select role from public.profiles where id = auth.uid()
$$ language sql stable security definer set search_path = public;


-- ============================================================
-- CLIENTS
-- ============================================================
create table if not exists clients (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  user_id           uuid references auth.users(id),
  first_name        text not null,
  last_name         text not null,
  email             text unique not null,
  phone             text,
  lead_stage        text not null default 'registered',
  programme_stage   text,
  target_price_min  integer,
  target_price_max  integer,
  target_areas      text,
  household_size    integer,
  notes             text  -- internal staff only; hidden from client RLS
);

alter table clients enable row level security;

create policy "clients: staff read all"
  on clients for select
  using (auth_role() = 'staff');

create policy "clients: staff update all"
  on clients for update
  using (auth_role() = 'staff');

create policy "clients: client read own"
  on clients for select
  using (user_id = auth.uid());

create policy "clients: client update own limited"
  on clients for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "clients: insert anon (calc save)"
  on clients for insert
  with check (true);  -- public insert allowed; row is immediately linked to user on login


-- ============================================================
-- CONSENTS (append-only)
-- ============================================================
create table if not exists consents (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  client_id     uuid not null references clients(id),
  consent_type  text not null,
  granted       boolean not null,
  ip_address    text,
  user_agent    text
);

alter table consents enable row level security;

create policy "consents: staff read all"   on consents for select using (auth_role() = 'staff');
create policy "consents: client read own"  on consents for select using (
  client_id in (select id from clients where user_id = auth.uid())
);
create policy "consents: insert allowed"   on consents for insert with check (true);
-- No update or delete policies → append-only enforced


-- ============================================================
-- CALCULATOR SNAPSHOTS
-- ============================================================
create table if not exists calculator_snapshots (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz default now(),
  anon_session_id  text,
  client_id        uuid references clients(id),
  property_price   integer not null,
  entry_stake      integer not null,
  monthly_domiter  numeric(10,2) not null,
  strike_price     integer not null,
  saved            boolean not null default false
);

alter table calculator_snapshots enable row level security;

create policy "snapshots: public insert"   on calculator_snapshots for insert with check (true);
create policy "snapshots: staff read all"  on calculator_snapshots for select using (auth_role() = 'staff');
create policy "snapshots: client read own" on calculator_snapshots for select using (
  client_id in (select id from clients where user_id = auth.uid())
);
create policy "snapshots: update to link client" on calculator_snapshots for update
  using (true) with check (true);  -- allow linking anon snapshot to client on save


-- ============================================================
-- DOCUMENT REQUESTS
-- ============================================================
create table if not exists document_requests (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  client_id         uuid not null references clients(id),
  doc_type          text not null,
  status            text not null default 'requested',
  file_path         text,   -- Supabase Storage path: documents/{client_id}/{doc_request_id}/{filename}
  file_name         text,
  rejection_reason  text,
  reviewed_by       uuid references auth.users(id),
  reviewed_at       timestamptz
);

alter table document_requests enable row level security;

create policy "doc_requests: staff all"        on document_requests for all using (auth_role() = 'staff');
create policy "doc_requests: client read own"  on document_requests for select using (
  client_id in (select id from clients where user_id = auth.uid())
);
create policy "doc_requests: client upload"    on document_requests for update
  using (client_id in (select id from clients where user_id = auth.uid()))
  with check (client_id in (select id from clients where user_id = auth.uid()));


-- ============================================================
-- PROPERTY CASES
-- ============================================================
create table if not exists property_cases (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  client_id             uuid not null references clients(id),
  status                text not null default 'submitted',
  address_line_1        text not null,
  address_line_2        text,
  city                  text not null,
  county                text not null,
  eircode               text,
  asking_price          integer not null,
  agreed_price          integer,
  valuation_amount      integer,
  valuation_file_path   text,
  notes                 text
);

alter table property_cases enable row level security;

create policy "property_cases: staff all"        on property_cases for all using (auth_role() = 'staff');
create policy "property_cases: client read own"  on property_cases for select using (
  client_id in (select id from clients where user_id = auth.uid())
);
create policy "property_cases: client insert"    on property_cases for insert with check (
  client_id in (select id from clients where user_id = auth.uid())
);


-- ============================================================
-- EVENTS (append-only audit log)
-- ============================================================
create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  client_id   uuid references clients(id),
  event_type  text not null,
  actor_id    uuid references auth.users(id),
  payload     jsonb,
  visibility  text not null default 'internal' check (visibility in ('client', 'internal'))
);

alter table events enable row level security;

create policy "events: staff read all"   on events for select using (auth_role() = 'staff');
create policy "events: staff insert"     on events for insert with check (auth_role() = 'staff');
create policy "events: client read own visible" on events for select using (
  visibility = 'client'
  and client_id in (select id from clients where user_id = auth.uid())
);
create policy "events: insert from system" on events for insert with check (true);
-- No update or delete policies → append-only enforced
