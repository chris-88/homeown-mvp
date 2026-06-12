---
type: canonical
aliases: []
status: doing
owner: "[[Chris]]"
sensitivity:
  - internal
version: 0.2.0
tags:
  - technology
---

# Homeown MVP — Agent Build Specification

**Audience:** AI coding agent  
**Purpose:** Build a working POC of the Homeown client portal, staff portal, and public calculator. Read this document fully before writing any code.

---

## Context (Read First)

Homeown is a structured property ownership pathway service. Clients pay a monthly service fee (Domiter) and hold a 1% beneficial interest in a property from day one. At the end of a 60-month term they have the right (not obligation) to purchase the remaining 99% at a fixed discount via a standard regulated mortgage.

**Critical language rules — apply everywhere in the UI:**
- Never say "rent" — say "monthly service fee" or "Domiter"
- Never say "savings", "balance", "pot", "escrow", "repayments"
- Never say "deposit-free"
- Never say "AIP", "approval in principle", "pre-approval"
- The purchase at end of term is an **option** (right, not obligation)
- Entry assessment is a **programme participation assessment**, not a credit assessment
- Monthly payment is a **service fee**, not rent, not credit instalments

---

## Scope

Build these three surfaces:

1. **Public site** — minimal marketing + anonymous calculator
2. **Client portal** — onboarding, document upload, dashboard, timeline
3. **Staff portal** — document review queue, client management, stage transitions

**Out of scope for this POC:**
- Purchasing agent portal
- Messaging / support threads
- Payments / ledger / statements
- 4-eyes approval workflow (single-staff approval only)
- Programme breach tracking
- PDF generation (display data only)
- Email automation (UI actions only; no transactional email integration)
- Property case detail beyond status tracking
- Reports and CSV exports
- E-sign integration
- Any real payment processing

---

## Stack (Non-Negotiable)

| Layer              | Choice                                                              |
| ------------------ | ------------------------------------------------------------------- |
| Frontend framework | Vite + React 18 + TypeScript                                        |
| Styling            | Tailwind CSS v4 + shadcn/ui (new-york variant)                      |
| Icons              | lucide-react                                                        |
| Routing            | React Router v7 (hash mode: `createHashRouter`)                     |
| Data fetching      | TanStack Query v5                                                   |
| API + auth client  | `@supabase/supabase-js`                                             |
| Forms              | React Hook Form + Zod                                               |
| Backend            | Supabase (managed — free tier)                                      |
| Database           | Supabase Postgres (managed)                                         |
| File storage       | Supabase Storage (managed)                                          |
| Frontend hosting   | GitHub Pages                                                        |
| Local dev          | Vite dev server → hosted Supabase project (no local backend needed) |

---

## Hosting

| Surface                             | Host               |
| ----------------------------------- | ------------------ |
| Frontend SPA                        | GitHub Pages       |
| Backend (Postgres + auth + storage) | Supabase free tier |

**GitHub Pages deployment:**
- Build output: `dist/`
- Deploy via GitHub Actions to `gh-pages` branch
- Base path: set `base: './'` in `vite.config.ts` — hash routing means no 404-on-refresh issues
- Custom domain optional; `username.github.io/homeown` works fine for POC

---

## Repository Structure

```
homeown/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions: build + deploy to gh-pages
├── supabase/
│   └── migrations/
│       └── 001_initial.sql     # Full schema — paste into Supabase SQL editor
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── src/
│       ├── main.tsx
│       ├── router.tsx          # All routes defined here
│       ├── lib/
│       │   ├── supabase.ts     # Supabase client instance
│       │   ├── auth.tsx        # Auth context + hooks
│       │   └── utils.ts
│       ├── components/
│       │   ├── ui/             # shadcn/ui components (generated)
│       │   └── shared/         # App-level shared components
│       ├── pages/
│       │   ├── public/         # /, /how-it-works, /faq
│       │   ├── calc/           # /calc, /calc/results, /calc/save
│       │   ├── auth/           # /auth/login, /auth/logout
│       │   ├── client/         # /app/client/*
│       │   └── staff/          # /app/staff/*
│       └── types/
│           └── index.ts        # Shared TypeScript types
```

---

## Setup

### 1. Create Supabase project

1. Go to supabase.com → New project
2. Name: `homeown-poc`, region: EU West (Ireland)
3. Copy the project URL and anon public key from Settings → API

### 2. Frontend environment

Create `frontend/.env.local`:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Create `frontend/.env.example` (commit this, not `.env.local`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### 3. Apply database schema

Paste the contents of `supabase/migrations/001_initial.sql` into the Supabase SQL editor and run it. The migration is idempotent (`create table if not exists`).

### 4. Configure Supabase Storage

In Supabase dashboard → Storage:
- Create a bucket named `documents`
- Set to **private** (not public)
- Files will be accessed via signed URLs generated by the Supabase client

### 5. Create test users

In Supabase dashboard → Authentication → Users:
- Create `client@test.homeown.ie` — after creation, run:
  ```sql
  update profiles set role = 'client' where id = '<user-uuid>';
  ```
- Create `staff@test.homeown.ie` — after creation, run:
  ```sql
  update profiles set role = 'staff' where id = '<user-uuid>';
  ```

Also manually create a `clients` record for the test client user and link it:
```sql
insert into clients (user_id, first_name, last_name, email, lead_stage)
values ('<client-user-uuid>', 'Test', 'Client', 'client@test.homeown.ie', 'registered');
```

---

## Database Schema

File: `supabase/migrations/001_initial.sql`

```sql
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
  insert into profiles (id, role) values (new.id, 'client')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Helper: get current user's role (used in RLS policies)
create or replace function auth_role()
returns text as $$
  select role from profiles where id = auth.uid()
$$ language sql stable security definer;


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
```

---

## Routes

All routes use hash routing (`/#/...`).

### Public

| Route | Page | Purpose |
|-------|------|---------|
| `/#/` | Home | Hero, how it works, CTA to calculator |
| `/#/how-it-works` | How It Works | 4-step visual pathway explanation |
| `/#/faq` | FAQ | Common questions, plain English answers |
| `/#/calc` | Calculator | Anonymous property price input |
| `/#/calc/results` | Results | Show Domiter, Entry Stake, Strike Price |
| `/#/calc/save` | Save Results | Capture name + email, create client record |

### Auth

| Route | Page | Purpose |
|-------|------|---------|
| `/#/auth/login` | Login | Email + password |
| `/#/auth/forgot` | Forgot Password | Request reset link |
| `/#/auth/logout` | Logout | Clear session, redirect to login |

### Client Portal (`/#/app/client/...`)

All routes require auth + `client` role.

| Route | Page | Purpose |
|-------|------|---------|
| `/#/app/client` | Dashboard | Current stage, next action, progress |
| `/#/app/client/documents` | Documents | Upload docs, see status per doc |
| `/#/app/client/property` | Property | Submit sale agreed property |
| `/#/app/client/timeline` | Timeline | Chronological log of key events |
| `/#/app/client/profile` | Profile | Name, email, target area, household size |

### Staff Portal (`/#/app/staff/...`)

All routes require auth + `staff` role.

| Route | Page | Purpose |
|-------|------|---------|
| `/#/app/staff` | Dashboard | Queues: docs to review, stages to action |
| `/#/app/staff/clients` | Client List | All clients, filterable by stage |
| `/#/app/staff/clients/:id` | Client Detail | Full client view — docs, timeline, property, actions |
| `/#/app/staff/documents` | Doc Review Queue | All documents with status: received |

---

## Page Specifications

### `/#/calc` — Calculator

Inputs:
- Property price (number input, €, min €200,000 max €700,000)

On submit: compute and store in component state:
```
entry_stake = property_price * 0.01
monthly_domiter = (property_price * 0.082) / 12
strike_price = property_price * 0.90
```

Also insert a row into `calculator_snapshots` immediately:
```typescript
await supabase.from('calculator_snapshots').insert({
  anon_session_id: sessionStorage.getItem('anon_id') ?? crypto.randomUUID(),
  property_price,
  entry_stake,
  monthly_domiter,
  strike_price,
  saved: false
})
```
Store the returned `id` in sessionStorage as `snapshot_id`. Store `anon_session_id` in sessionStorage as `anon_id`.

Redirect to `/#/calc/results`.

### `/#/calc/results` — Results

Display (read from component state passed via router or sessionStorage):
- **Property price** — as entered, formatted as €
- **Your share from day one** — entry_stake formatted as € + "1% beneficial interest"
- **Monthly service fee (Domiter)** — monthly_domiter formatted as €/month
- **Purchase option price** — strike_price formatted as € + "(10% below today's price)"
- **Term** — "60 months"

Required disclaimer (verbatim, display prominently below the figures):
> "Homeown does not provide mortgage credit. The purchase option is a right, not an obligation. Mortgage approval at end of term is subject to an independent regulated lender's assessment and is not guaranteed. Monthly payments are a service fee, not rent and not credit repayments."

CTAs:
- Primary: "Save my results and book a call" → `/#/calc/save`
- Secondary: "Adjust figures" → back to `/#/calc`

### `/#/calc/save` — Save Results

Form fields:
- First name (required)
- Last name (required)
- Email (required)
- Checkbox: "I agree to be contacted about the Homeown pathway" (required)
- Checkbox: "I agree to the privacy notice" (required)

On submit:
1. Upsert `clients` row (conflict on `email`):
   ```typescript
   const { data: client } = await supabase
     .from('clients')
     .upsert({ first_name, last_name, email, lead_stage: 'registered' }, { onConflict: 'email' })
     .select().single()
   ```
2. Insert two rows into `consents` (one per checkbox)
3. Update `calculator_snapshots` where `id = snapshot_id`: set `client_id = client.id`, `saved = true`
4. Insert into `events`: `{ client_id: client.id, event_type: 'results_saved', visibility: 'internal' }`
5. Redirect to a success screen (same page, show confirmation state):
   > "Thanks [first_name] — we'll be in touch to book your discovery call."

### `/#/app/client` — Client Dashboard

Fetch the `clients` row where `user_id = auth.uid()`.

Show:
- Greeting: "Welcome, [first_name]"
- **Current stage label** and **next step** based on `programme_stage` (see table below)
- **Progress stepper**: Registered → Documents → Eligible → Property → Contracts → In Home

Stage labels and next-step copy:

| programme_stage | Label | Next Step copy |
|----------------|-------|----------------|
| `null` (pre-onboarding) | Getting Started | Your account is being set up. We'll send you next steps shortly. |
| `onboarding_docs_requested` | Documents Requested | Please upload your required documents. |
| `onboarding_under_review` | Documents Under Review | We're reviewing your documents. We'll be in touch shortly. |
| `limit_letter_ready` | Eligible | Your Homeown Eligibility Letter is ready. You can now begin your property search. |
| `searching` | Searching | You're eligible to proceed. When you find a property and have sale agreed, submit it below. |
| `sale_agreed` | Sale Agreed | Your property has been submitted. We're progressing your case. |
| `approval_notice_issued` | Approval Confirmed | Your property has been approved. Please confirm your insurance and direct debit. |
| `committed` | Committed | Everything is in place. Completion is being arranged. |
| `in_home` | In Home | You're in your home. Keep your insurance and monthly service fee up to date. |
| `servicing_active` | Pathway Active | Your pathway is active. Keep your insurance and payments up to date. |

### `/#/app/client/documents` — Documents

Fetch all `document_requests` where `client_id = client.id`.

Per document row:
- Human-readable doc type label
- Status badge (Requested / Received / Approved / Rejected)
- If `requested`: show file upload input
- If `rejected`: show `rejection_reason` in red
- If `approved`: show green check

On file upload:
1. Upload to Supabase Storage:
   ```typescript
   const path = `${client.id}/${docRequest.id}/${file.name}`
   await supabase.storage.from('documents').upload(path, file)
   ```
2. Update `document_requests`: `{ file_path: path, file_name: file.name, status: 'received', updated_at: now }`
3. Insert `events`: `{ event_type: 'document_uploaded', client_id, visibility: 'internal' }`
4. Refetch the document list

### `/#/app/client/property` — Property Submission

Only render this page if `programme_stage` is `searching` or `limit_letter_ready`. Otherwise show: "This page will be available once you are eligible to search."

Form fields:
- Address line 1 (required)
- Address line 2 (optional)
- City (required)
- County (required — dropdown of Irish counties)
- Eircode (optional)
- Asking price in € (required)
- Agreed price in € (required)

On submit:
1. Insert into `property_cases` with `status: 'submitted'`
2. Update `clients`: `{ programme_stage: 'sale_agreed', updated_at: now }`
3. Insert `events`: `{ event_type: 'sale_agreed_submitted', client_id, visibility: 'internal' }`
4. Show confirmation: "Your property has been submitted. We'll review it and be in touch."

### `/#/app/client/timeline` — Timeline

Fetch `events` where `client_id = client.id AND visibility = 'client'`, ordered by `created_at DESC`.

Per event row: formatted date, human-readable event label mapped from `event_type`.

Event type → label mapping:
```
results_saved            → "You saved your calculator results"
limit_letter_issued      → "Your Eligibility Letter is ready"
sale_agreed_submitted    → "You submitted a property"
approval_notice_issued   → "Your property has been approved"
document_approved        → "A document was approved"
document_rejected        → "A document needs attention"
pathway_started          → "Your pathway is now active"
```

### `/#/app/staff` — Staff Dashboard

**Queue 1 — Documents to Review**
Fetch `document_requests` joined to `clients` where `status = 'received'`, order by `created_at ASC`.
Show count + list: client full name, doc type label, uploaded date.
Click → `/#/app/staff/clients/:id`.

**Queue 2 — Stages to Action**
Fetch `clients` where `programme_stage IN ('onboarding_under_review', 'sale_agreed', 'valuation_received')`, order by `updated_at ASC`.
Show count + list: client full name, stage label, last updated.
Click → `/#/app/staff/clients/:id`.

### `/#/app/staff/clients` — Client List

Table of all `clients`. Columns: full name, email, lead_stage, programme_stage, created_at.
Filters: lead_stage (select), programme_stage (select).
Click row → `/#/app/staff/clients/:id`.

### `/#/app/staff/clients/:id` — Client Detail

Four tabs: **Overview**, **Documents**, **Property**, **Timeline**.

**Overview tab:**
- Display: name, email, phone, target price band, target areas, household size
- Editable dropdowns: `lead_stage`, `programme_stage` — PATCH on change, insert `events` on stage change
- Internal notes: textarea, auto-save on blur (PATCH `clients.notes`)
- Button: "Create onboarding checklist" — inserts the standard document requests (see below); disabled if requests already exist

When `programme_stage` is set to `limit_letter_ready`:
- Insert `events`: `{ event_type: 'limit_letter_issued', visibility: 'client' }` — this appears on the client's timeline

**Documents tab:**
- List all `document_requests` for this client
- Per row: doc type label, status badge, view file button (if uploaded — generate signed URL from Supabase Storage), approve/reject buttons (shown only if status is `received`)
- **Approve**: PATCH `{ status: 'approved', reviewed_by: auth.uid(), reviewed_at: now }` → insert `events: document_approved` (visibility: client)
- **Reject**: open a modal to enter rejection reason → PATCH `{ status: 'rejected', rejection_reason, reviewed_by, reviewed_at }` → insert `events: document_rejected` (visibility: client)
- After all required docs have `status = 'approved'`: show **"Mark as Verified"** button → PATCH `clients.programme_stage = 'limit_letter_ready'` + insert events

Generate Supabase Storage signed URL for file preview:
```typescript
const { data } = await supabase.storage
  .from('documents')
  .createSignedUrl(doc.file_path, 300) // 5-minute expiry
```

**Property tab:**
- Fetch `property_cases` for this client
- Display: address, asking price, agreed price, status badge
- Editable status dropdown (staff can advance)
- If `status = 'valuation_received'` and `valuation_amount` is set: show **"Issue Approval Notice"** button → PATCH `clients.programme_stage = 'approval_notice_issued'` + insert `events: approval_notice_issued` (visibility: client)

**Timeline tab:**
- Fetch all `events` for this client (all visibility), order by `created_at DESC`
- Show: date, event type label, visibility tag (Client-visible / Internal), actor name if available

### `/#/app/staff/documents` — Doc Review Queue

Full-page version of Queue 1 from dashboard. Inline approve/reject actions without navigating to client detail. Same behaviour as Documents tab above.

---

## Standard Document Checklist

When staff clicks "Create onboarding checklist", insert these `document_requests` rows (all `status: 'requested'`):

| doc_type | Rows |
|----------|------|
| `photo_id` | 1 |
| `proof_of_address` | 1 |
| `payslip` | 2 |
| `bank_statement` | 3 |
| `employer_letter` | 1 |

Also PATCH `clients.programme_stage = 'onboarding_docs_requested'` and insert `events: { event_type: 'pre_qual_submitted', visibility: 'internal' }`.

---

## Auth Implementation

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

**Login:**
```typescript
const { error } = await supabase.auth.signInWithPassword({ email, password })
```

**Get current user + role:**
```typescript
const { data: { user } } = await supabase.auth.getUser()
const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
```

**Auth context** (`src/lib/auth.tsx`): React context that stores `user`, `profile` (role), and `client` (the `clients` row for client-role users). Expose a `useAuth()` hook. On mount, call `supabase.auth.getSession()` and subscribe to `onAuthStateChange`.

**After login redirect:**
- `role = 'client'` → `/#/app/client`
- `role = 'staff'` or `'admin'` → `/#/app/staff`

**Route guards**: wrap portal routes in a component that checks `useAuth()`. Redirect to `/#/auth/login` if unauthenticated; redirect to appropriate portal if wrong role.

**Logout:**
```typescript
await supabase.auth.signOut()
```

---

## GitHub Actions Deploy

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci
        working-directory: frontend

      - name: Build
        run: npm run build
        working-directory: frontend
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: frontend/dist
```

Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as repository secrets in GitHub → Settings → Secrets.

In `vite.config.ts`, set:
```typescript
base: './'
```

---

## Design System

Use shadcn/ui defaults throughout. Do not add a custom colour palette or custom font. The goal is a clean, generic, white-label starting point that can be tweaked later — not a finished brand.

**Setup:** initialise shadcn/ui with the `new-york` style and `neutral` base colour. Accept all other defaults.

```bash
npx shadcn@latest init
# style: new-york
# base colour: neutral
# CSS variables: yes
```

This gives you the full shadcn/ui token system (`--background`, `--foreground`, `--primary`, `--muted`, `--border`, etc.) out of the box. Do not override these in `index.css` for the POC.

### Component conventions

- Status badges: use shadcn `Badge` with variant mapping:
  - `requested` → `secondary`
  - `received` → `default`
  - `approved` → `default` + green class override (or a custom `success` variant if you add one)
  - `rejected` → `destructive`
- Layout: left sidebar navigation in portals; top nav on public site
- Max content width: `max-w-2xl` (client portal), `max-w-6xl` (staff portal)
- Use shadcn `Card`, `Table`, `Tabs`, `Dialog`, `Form` components — do not build custom equivalents
- Generous whitespace; avoid packing content into dense layouts

### Tone

- Calm and professional — not startup-loud
- Plain English throughout
- All copy must comply with language rules (see Context section above)

---

## Acceptance Criteria

The POC is done when:

1. **Calculator** — enter a property price, see Domiter / Entry Stake / Strike Price with correct figures, disclaimer displayed verbatim
2. **Lead capture** — save results with name + email creates a `clients` row and `consents` rows in Supabase
3. **Client login** — test client logs in, lands on dashboard showing stage label and next-step copy
4. **Document upload** — client can upload a file; status changes to `received` and file appears in Supabase Storage
5. **Staff dashboard** — staff logs in, sees queue counts for docs to review and stages to action
6. **Doc approval** — staff approves a document; client sees updated status on their documents page
7. **Doc rejection** — staff rejects with a reason; client sees the rejection reason
8. **Stage advance** — staff changes a client's `programme_stage`; client dashboard reflects the change immediately on next load
9. **Timeline** — client sees their client-visible events in chronological order
10. **Property submission** — client at `searching` stage submits a property; `property_cases` row created, stage advances to `sale_agreed`
11. **GitHub Pages deploy** — `git push` to `main` triggers deploy; site is live at GitHub Pages URL
12. **No forbidden language** — no instances of "rent", "savings", "AIP", "deposit-free", "balance", "repayments" anywhere in the UI

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2026-06-10 | 0.1.0 | Initial agent build spec (Directus backend) |
| 2026-06-10 | 0.2.0 | Backend swapped to Supabase; GitHub Pages deploy added; Docker removed |
