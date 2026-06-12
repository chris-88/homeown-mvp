-- 008_circle_portal.sql
-- Adds Circle investor portal: role, tables, notes, RPCs, clients.dac_id FK

-- ── Role constraint ──────────────────────────────────────────────────────────
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('client', 'staff', 'admin', 'circle'));


-- ── CIRCLE MEMBERS ───────────────────────────────────────────────────────────
create table if not exists circle_members (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  user_id     uuid references auth.users(id),
  first_name  text not null,
  last_name   text not null,
  email       text unique not null,
  phone       text,
  address     text,
  kyc_status  text not null default 'pending'
              check (kyc_status in ('pending', 'in_progress', 'complete', 'failed')),
  source      text
);

alter table circle_members enable row level security;

create policy "circle_members: staff all"
  on circle_members for all using (auth_role() = 'staff');

create policy "circle_members: circle read own"
  on circle_members for select
  using (user_id = auth.uid());


-- ── DACS ─────────────────────────────────────────────────────────────────────
create table if not exists dacs (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  created_by            uuid references auth.users(id),
  name                  text not null,
  cohort_label          text,
  status                text not null default 'draft'
                        check (status in ('draft', 'upcoming', 'open', 'closed', 'matured')),
  description           text,
  geographic_focus      text,
  property_count        integer,
  target_sub_amount     integer,    -- euros
  target_senior_amount  integer,    -- euros
  coupon_rate           numeric(5,2),
  no_call_months        integer not null default 12,
  term_months           integer not null default 18,
  open_date             date,
  close_date            date,
  notes                 text
);

alter table dacs enable row level security;

create policy "dacs: staff all"
  on dacs for all using (auth_role() = 'staff');

create policy "dacs: circle read non-draft"
  on dacs for select
  using (auth_role() = 'circle' and status != 'draft');


-- ── SUBSCRIPTIONS ────────────────────────────────────────────────────────────
create table if not exists subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  circle_member_id    uuid not null references circle_members(id),
  dac_id              uuid not null references dacs(id),
  amount              integer not null,
  coupon_rate_locked  numeric(5,2),
  initiated_by        text not null
                      check (initiated_by in ('member', 'staff')),
  staff_actor_id      uuid references auth.users(id),
  status              text not null default 'soft_commit'
                      check (status in (
                        'soft_commit', 'subscribed', 'funds_requested',
                        'funded', 'active', 'redeeming', 'redeemed', 'withdrawn'
                      )),
  committed_at        timestamptz,
  funds_requested_at  timestamptz,
  funded_at           timestamptz,
  maturity_date       date,
  notes               text
);

alter table subscriptions enable row level security;

create policy "subscriptions: staff all"
  on subscriptions for all using (auth_role() = 'staff');

create policy "subscriptions: circle read own"
  on subscriptions for select
  using (
    circle_member_id in (
      select id from public.circle_members where user_id = auth.uid()
    )
  );

create policy "subscriptions: circle insert own for open dacs"
  on subscriptions for insert
  with check (
    auth_role() = 'circle'
    and circle_member_id in (
      select id from public.circle_members where user_id = auth.uid()
    )
    and dac_id in (
      select id from public.dacs where status = 'open'
    )
    and initiated_by = 'member'
  );


-- ── DAC DOCUMENTS ────────────────────────────────────────────────────────────
create table if not exists dac_documents (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  dac_id       uuid not null references dacs(id),
  name         text not null,
  doc_type     text not null
               check (doc_type in (
                 'info_memo', 'bond_instrument', 'subscription_agreement',
                 'reporting_pack', 'other'
               )),
  file_path    text not null,
  file_name    text not null,
  uploaded_by  uuid references auth.users(id)
);

alter table dac_documents enable row level security;

create policy "dac_documents: staff all"
  on dac_documents for all using (auth_role() = 'staff');

create policy "dac_documents: circle read"
  on dac_documents for select
  using (
    auth_role() = 'circle'
    and dac_id in (select id from public.dacs where status != 'draft')
  );


-- ── CIRCLE MEMBER DOCUMENTS ──────────────────────────────────────────────────
create table if not exists circle_member_documents (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz default now(),
  circle_member_id  uuid not null references circle_members(id),
  doc_type          text not null
                    check (doc_type in (
                      'kyc', 'signed_subscription', 'reporting_pack',
                      'correspondence', 'other'
                    )),
  name              text not null,
  file_path         text not null,
  file_name         text not null,
  uploaded_by       uuid references auth.users(id)
);

alter table circle_member_documents enable row level security;

create policy "circle_member_documents: staff all"
  on circle_member_documents for all using (auth_role() = 'staff');

create policy "circle_member_documents: circle read own"
  on circle_member_documents for select
  using (
    circle_member_id in (
      select id from public.circle_members where user_id = auth.uid()
    )
  );


-- ── CIRCLE MEMBER NOTES (append-only, staff-only) ────────────────────────────
create table if not exists circle_member_notes (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz default now(),
  circle_member_id  uuid not null references circle_members(id),
  actor_id          uuid references auth.users(id),
  text              text not null
);

alter table circle_member_notes enable row level security;

create policy "circle_member_notes: staff insert"
  on circle_member_notes for insert
  with check (auth_role() = 'staff');

create policy "circle_member_notes: staff select"
  on circle_member_notes for select
  using (auth_role() = 'staff');


-- ── CLIENTS: replace dac_reference with FK to dacs ───────────────────────────
alter table clients
  add column if not exists dac_id uuid references dacs(id);

alter table clients
  drop column if exists dac_reference;


-- ── UPDATED handle_new_user TRIGGER ─────────────────────────────────────────
-- Detects known Circle member emails and assigns circle role automatically.
create or replace function handle_new_user()
returns trigger as $$
begin
  if exists (select 1 from public.circle_members where email = new.email) then
    insert into public.profiles (id, role) values (new.id, 'circle')
    on conflict (id) do nothing;
    update public.circle_members set user_id = new.id where email = new.email;
  else
    insert into public.profiles (id, role) values (new.id, 'client')
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;


-- ── RPC: get_circle_invite ───────────────────────────────────────────────────
-- Called by the public join page. Returns only name, email, and joined status.
create or replace function get_circle_invite(member_id uuid)
returns table (first_name text, email text, already_joined boolean)
language sql security definer set search_path = public as $$
  select first_name, email, (user_id is not null) as already_joined
  from public.circle_members
  where id = member_id;
$$;
