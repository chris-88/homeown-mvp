---
type: canonical
aliases: []
status: doing
owner: "[[Chris]]"
sensitivity:
  - internal
version: 1.0.0
tags:
  - technology
---

# Circle Portal — Agent Build Specification

**Audience:** AI coding agent  
**Purpose:** Add a Circle investor portal and extend the staff portal with Circle CRM and DAC management.  
**Extends:** `mvp-build-spec.md` v0.2.0. All existing routes, schema, and behaviour are unchanged. This spec adds new routes and tables on top.

---

## What This Adds

- A new `circle` role with its own authenticated portal
- Invite-only onboarding: staff creates a member record → portal displays a join URL → member visits the URL and sets a password → account is linked automatically
- Circle members can view open DAC opportunities and self-subscribe
- Staff can subscribe on a member's behalf (concierge) and manage subscription status through the fund management lifecycle
- All DAC and member documents live in the portal — it is the single source of truth
- Staff portal gains: Circle CRM, DAC management, and a Circle summary on the dashboard

---

## Auth: New Role

Add `circle` to the `profiles.role` check constraint. Update `auth_role()` as needed.

After login:
- `role = 'circle'` → redirect to `/#/app/circle`

Route guards: wrap all `/#/app/circle/*` routes with a guard that requires `role = 'circle'`. Redirect to `/#/auth/login` if unauthenticated; redirect to `/#/app/client` or `/#/app/staff` if wrong role.

---

## Database Migration 003

File: `supabase/migrations/003_circle_portal.sql`

```sql
-- Update role constraint to include circle
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('client', 'staff', 'admin', 'circle'));


-- ============================================================
-- CIRCLE MEMBERS
-- ============================================================
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
  source      text,  -- how they came to Homeown
  notes       text   -- internal staff only; excluded from circle RLS
);

alter table circle_members enable row level security;

create policy "circle_members: staff all"
  on circle_members for all using (auth_role() = 'staff');

create policy "circle_members: circle read own"
  on circle_members for select
  using (user_id = auth.uid());


-- ============================================================
-- DACS
-- ============================================================
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
  coupon_rate           numeric(5,2),  -- annual %, e.g. 8.50
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


-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table if not exists subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  circle_member_id    uuid not null references circle_members(id),
  dac_id              uuid not null references dacs(id),
  amount              integer not null,         -- euros
  coupon_rate_locked  numeric(5,2),             -- rate at time of subscription
  initiated_by        text not null
                      check (initiated_by in ('member', 'staff')),
  staff_actor_id      uuid references auth.users(id),  -- set if initiated_by = 'staff'
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
      select id from circle_members where user_id = auth.uid()
    )
  );

create policy "subscriptions: circle insert own for open dacs"
  on subscriptions for insert
  with check (
    auth_role() = 'circle'
    and circle_member_id in (
      select id from circle_members where user_id = auth.uid()
    )
    and dac_id in (
      select id from dacs where status = 'open'
    )
    and initiated_by = 'member'
  );


-- ============================================================
-- DAC DOCUMENTS
-- ============================================================
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
    and dac_id in (select id from dacs where status != 'draft')
  );


-- ============================================================
-- CIRCLE MEMBER DOCUMENTS
-- ============================================================
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
      select id from circle_members where user_id = auth.uid()
    )
  );


-- ============================================================
-- UPDATED handle_new_user TRIGGER
-- Replaces the version from migration 001.
-- When a new auth user signs up, check if their email is a known
-- Circle member. If so, assign role = 'circle' and link the record.
-- Otherwise assign role = 'client' as before.
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  if exists (select 1 from public.circle_members where email = new.email) then
    insert into profiles (id, role) values (new.id, 'circle')
    on conflict (id) do nothing;
    update public.circle_members set user_id = new.id where email = new.email;
  else
    insert into profiles (id, role) values (new.id, 'client')
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;


-- ============================================================
-- RPC: get_circle_invite
-- Used by the public join page to look up a member by ID.
-- Returns only name, email, and whether they have already joined.
-- Security definer so anon callers cannot read the full table.
-- ============================================================
create or replace function get_circle_invite(member_id uuid)
returns table (first_name text, email text, already_joined boolean)
language sql security definer as $$
  select first_name, email, (user_id is not null) as already_joined
  from circle_members
  where id = member_id;
$$;
```

---

## Supabase Storage

Reuse the existing private `documents` bucket. Use these path conventions:

| Content | Path |
|---------|------|
| DAC document | `dac/{dac_id}/{dac_document_id}/{filename}` |
| Circle member document | `circle/{circle_member_id}/{circle_member_document_id}/{filename}` |

Generate signed URLs with 300-second expiry (same pattern as client documents).

---

## Member Join Flow

No Edge Function or server-side invite API is needed. The flow is:

1. Staff creates a `circle_members` record in the portal
2. The portal displays the join URL once the record is saved:
   `{SITE_URL}/#/circle/join?id={circle_member_id}`
3. Staff copies and shares the URL with the member (email, WhatsApp, however)
4. Member visits the URL, sees their name pre-filled, sets a password
5. `supabase.auth.signUp({ email, password })` fires
6. The updated `handle_new_user()` trigger (in migration 003) detects that the email exists in `circle_members`, sets `profiles.role = 'circle'`, and links `circle_members.user_id` — all automatically
7. Member is signed in and redirected to `/#/app/circle`

**Supabase setting:** Disable email confirmation in Supabase Dashboard → Authentication → Settings → "Enable email confirmations" = OFF. Otherwise the member must click a confirmation email before they can log in, which adds unnecessary friction for a private placement portal.

**Security model:** The join URL is unguessable (UUID member ID). Staff shares it privately. If someone visits the URL with an invalid or already-used ID, the join page handles it gracefully.

---

## Routes

### Public (no auth required)

| Route | Page |
|-------|------|
| `/#/circle/join` | Member join — set password to activate account |

### Circle Portal (`/#/app/circle/...`)

All require auth + `circle` role.

| Route | Page |
|-------|------|
| `/#/app/circle` | Dashboard |
| `/#/app/circle/opportunities` | Open and upcoming DACs |
| `/#/app/circle/opportunities/:dacId` | DAC detail + subscribe |
| `/#/app/circle/portfolio` | My subscriptions |
| `/#/app/circle/portfolio/:subscriptionId` | Subscription detail |
| `/#/app/circle/documents` | My documents |
| `/#/app/circle/profile` | My profile |

### Staff additions (`/#/app/staff/...`)

| Route | Page |
|-------|------|
| `/#/app/staff/circle` | Circle CRM list |
| `/#/app/staff/circle/new` | Create member + generate invite |
| `/#/app/staff/circle/:id` | Member detail |
| `/#/app/staff/dacs` | DAC list |
| `/#/app/staff/dacs/new` | Create DAC |
| `/#/app/staff/dacs/:id` | DAC detail |

---

## Page Specifications — Public

### `/#/circle/join` — Member Join

Public route (no auth required). Reads the `id` query parameter.

On load, call the `get_circle_invite` RPC:
```typescript
const { data } = await supabase.rpc('get_circle_invite', { member_id: id })
```

Three states:

**Invalid ID (data is empty):**
Show: "This link is invalid or has expired. Please contact your Homeown relationship manager."

**Already joined (`data.already_joined = true`):**
Show: "You've already set up your account." with a "Sign in →" link to `/#/auth/login`.

**Valid and not yet joined:**
Show:
- Heading: "Welcome to the Homeown Circle, [first_name]"
- Sub-heading: "Set a password to access your investor portal."
- Email field: pre-filled with `data.email`, read-only
- Password field (required, min 8 characters)
- Confirm password field (must match)
- Submit button: "Create my account"

On submit:
```typescript
const { error } = await supabase.auth.signUp({ email: data.email, password })
if (!error) {
  // Sign in immediately (email confirmation is disabled)
  await supabase.auth.signInWithPassword({ email: data.email, password })
  navigate('/#/app/circle')
}
```

The trigger handles all role assignment and `circle_members.user_id` linking automatically — no additional client-side work required.

---

## Page Specifications — Circle Portal

### `/#/app/circle` — Dashboard

Fetch `circle_members` where `user_id = auth.uid()`. Fetch all `subscriptions` for this member.

Show:
- Greeting: "Welcome, [first_name]"
- Summary cards:
  - **Total committed** — sum of `amount` where `status IN ('subscribed', 'funds_requested', 'funded', 'active')`
  - **Active investments** — count of subscriptions where `status = 'active'`
  - **Open opportunities** — count of `dacs` where `status = 'open'`
- Recent subscriptions list (last 3, with status badge and DAC name)
- CTA cards: "View opportunities" → `/opportunities`, "My portfolio" → `/portfolio`

---

### `/#/app/circle/opportunities` — Opportunities

Fetch `dacs` where `status IN ('upcoming', 'open')`.

Per DAC card:
- Name + cohort label
- Status badge (`upcoming` = secondary, `open` = default/green)
- Geographic focus
- Property count
- Coupon rate (annual %)
- Target sub amount + raised so far (compute from `subscriptions` sum where `status NOT IN ('soft_commit', 'withdrawn')`)
- Close date
- "View details" button → `/:dacId`

Also show a section for `closed` DACs below (historical, no subscribe action).

---

### `/#/app/circle/opportunities/:dacId` — DAC Detail + Subscribe

Fetch the `dac` record. Fetch `dac_documents` for this DAC. Fetch any existing subscription this member has for this DAC.

**DAC terms panel:**
- Name, cohort label, status badge
- Geographic focus, property count
- Coupon rate (annual %), term, no-call period
- Target sub amount, amount raised, amount remaining
- Open date, close date
- Description / notes (if set)

**Documents section:**
List `dac_documents`. Per row: name, type label, download button (generate signed URL on click).

**Subscribe section:**
Show only if `dac.status = 'open'` AND member has no existing subscription for this DAC.

Form:
- Amount (€, integer, required)
- Coupon rate display: "Current rate: X% per annum (locked at subscription)" — read-only, populated from `dac.coupon_rate`
- Checkbox: "I have read the available documents and wish to register this subscription" (required)

On submit:
```typescript
await supabase.from('subscriptions').insert({
  circle_member_id: member.id,
  dac_id: dacId,
  amount,
  coupon_rate_locked: dac.coupon_rate,
  initiated_by: 'member',
  status: 'soft_commit',
  committed_at: new Date().toISOString(),
})
```

Show confirmation: "Your subscription of €[amount] has been registered. A member of the team will be in touch to confirm next steps."

If member already has a subscription for this DAC: show the existing subscription status instead of the form.

---

### `/#/app/circle/portfolio` — My Portfolio

Fetch all `subscriptions` for this member, joined to `dacs`.

Table columns: DAC name, amount (€), coupon rate, status badge, committed date, maturity date.

Status badge colours:
- `soft_commit` → secondary
- `subscribed` → default
- `funds_requested` → default (amber tint or warning variant)
- `funded` / `active` → success
- `redeeming` / `redeemed` → secondary
- `withdrawn` → destructive

Click row → `/portfolio/:subscriptionId`

---

### `/#/app/circle/portfolio/:subscriptionId` — Subscription Detail

Fetch subscription + DAC + `dac_documents`.

Show:
- DAC name and terms (coupon rate, term, no-call)
- My commitment: amount, locked rate, status
- Status timeline (horizontal stepper or vertical list):
  `Soft Commit → Subscribed → Funds Requested → Funded → Active → Redeemed`
  Highlight the current step; show dates for completed steps.
- Staff notes (if any — read-only for member)
- Documents: same `dac_documents` list as on the DAC detail page

---

### `/#/app/circle/documents` — My Documents

Fetch all `circle_member_documents` for this member.

Table: name, type label, uploaded date, download button.
Generate signed URL on download click.

---

### `/#/app/circle/profile` — My Profile

Fetch `circle_members` where `user_id = auth.uid()`.

Display (read-only): name, email, phone, address, KYC status.

Note: "To update your details, please contact your Homeown relationship manager."

---

## Page Specifications — Staff Additions

### Staff Dashboard — Circle Summary Card

Add a Circle card alongside the existing doc review and stage queues.

Fetch:
- Total Circle members (count of `circle_members`)
- Total soft-committed (sum of `subscriptions.amount` where `status = 'soft_commit'`)
- Total funded (sum of `subscriptions.amount` where `status IN ('funded', 'active')`)
- Open DAC target gap: for each `dac` with `status = 'open'`, compute `target_sub_amount - sum(subscriptions where status NOT IN ('soft_commit', 'withdrawn'))`

Show: member count, total committed (soft + hard), total funded, gap on active DAC. Link to `/#/app/staff/circle`.

---

### `/#/app/staff/circle` — Circle CRM List

Table of all `circle_members`.

Columns: full name, email, KYC status badge, total invested (sum of funded/active subscriptions), DAC count, joined date.

Filters: KYC status (select).

Actions:
- "Add member" button → `/#/app/staff/circle/new`
- Click row → `/#/app/staff/circle/:id`

---

### `/#/app/staff/circle/new` — Create Member

Form:
- First name (required)
- Last name (required)
- Email (required)
- Phone (optional)

On submit:
```typescript
const { data: member } = await supabase
  .from('circle_members')
  .insert({ first_name, last_name, email, phone: phone ?? null })
  .select().single()
```

On success: show the join URL in a read-only input with a copy-to-clipboard button:
```
{window.location.origin}/#/circle/join?id={member.id}
```

Message: "Member created. Share this link with [first_name] — they'll use it to set their password and access the portal."

Primary button: "Go to member record" → `/#/app/staff/circle/{member.id}`.
Secondary button: "Add another member" → reset the form.

---

### `/#/app/staff/circle/:id` — Member Detail

Three tabs: **Overview**, **Investments**, **Documents**

**Overview tab:**
- Display: name, email, phone, address, source, joined date
- Editable: KYC status (select: pending / in_progress / complete / failed) — PATCH on change
- Internal notes: textarea, auto-save on blur
- "Resend invite" button — calls Edge Function with `resend: true` flag (or staff copies invite link from Supabase dashboard for POC)

**Investments tab:**

List all subscriptions for this member (joined to DAC names).

Table: DAC name, amount, locked rate, status, initiated by, committed date, funded date.

**Add subscription (concierge):**
Button: "Add subscription on behalf of member"
Form (dialog/modal):
- DAC (select from all non-draft DACs)
- Amount (€, integer)
- Initial status (select: soft_commit / subscribed)
- Notes (optional)

On submit:
```typescript
await supabase.from('subscriptions').insert({
  circle_member_id: memberId,
  dac_id: selectedDacId,
  amount,
  coupon_rate_locked: selectedDac.coupon_rate,
  initiated_by: 'staff',
  staff_actor_id: currentUser.id,
  status: initialStatus,
  committed_at: new Date().toISOString(),
  notes,
})
```

**Status management (per subscription row):**
Each subscription row has a status dropdown. Staff can advance the status forward. On change, PATCH the subscription with the new status and the relevant timestamp:
- → `subscribed` : no extra timestamp
- → `funds_requested` : set `funds_requested_at = now()`
- → `funded` : set `funded_at = now()`
- → `active` : no extra timestamp
- → `redeeming` / `redeemed` : no extra timestamp
- → `withdrawn` : no extra timestamp

**Documents tab:**
Upload document for this member:
- Form: name (required), doc type (select), file upload
- On submit: upload to `circle/{member_id}/{new_uuid}/{filename}`, insert `circle_member_documents` row

List existing documents: name, type, uploaded date, download (signed URL).

---

### `/#/app/staff/dacs` — DAC List

Table of all `dacs`.

Columns: name, cohort label, status badge, coupon rate, target sub, amount raised (computed from subscriptions), close date.

"Create DAC" button → `/#/app/staff/dacs/new`

Click row → `/#/app/staff/dacs/:id`

---

### `/#/app/staff/dacs/new` — Create DAC

Form with all DAC fields. Status defaults to `draft`.

Fields:
- Name (required)
- Cohort label
- Status (select — default: draft)
- Description (textarea)
- Geographic focus
- Property count (integer)
- Target sub amount (€)
- Target senior amount (€)
- Coupon rate (%, 2 decimal places)
- No-call period (months, default 12)
- Term (months, default 18)
- Open date (date picker)
- Close date (date picker)
- Notes (textarea)

On submit: INSERT, redirect to `/#/app/staff/dacs/:newId`.

---

### `/#/app/staff/dacs/:id` — DAC Detail

Three tabs: **Fundamentals**, **Documents**, **Subscriptions**

**Fundamentals tab:**
Editable form (all fields from create). Auto-save or save button — save button preferred for clarity. PATCH on save.

Status dropdown governs visibility to Circle members: `draft` is staff-only, anything else is visible to Circle members.

**Documents tab:**
Upload a document to this DAC:
- Name (required)
- Doc type (select: info_memo / bond_instrument / subscription_agreement / reporting_pack / other)
- File upload

On submit: upload to `dac/{dac_id}/{new_uuid}/{filename}`, insert `dac_documents` row.

List existing: name, type label, uploaded date, download (signed URL), delete button.

**Subscriptions tab:**
Table of all subscriptions for this DAC.

Columns: member name, amount, locked rate, status badge, initiated by, committed date, funded date.

Summary bar at top:
- Target: €[target_sub_amount]
- Committed (subscribed+): €[sum]
- Funded: €[sum of funded/active]
- Gap: €[target - committed]

"Add subscription" button → same concierge form as on the member detail page, pre-filled with this DAC.

---

## Subscription Status Lifecycle Reference

```
soft_commit       Member or staff registers interest; no funds committed
    ↓
subscribed        Terms confirmed; member is committed to transfer
    ↓
funds_requested   Staff has issued wire/transfer instructions to member
    ↓
funded            Funds received in DAC account
    ↓
active            DAC is live and operational; coupon accruing
    ↓
redeeming         Redemption notice issued (after no-call period if applicable)
    ↓
redeemed          Principal and final coupon returned to member

withdrawn         Member withdrew before funding; terminal state from any pre-funded status
```

---

## Acceptance Criteria (Circle Portal)

1. Staff creates a Circle member via the form → `circle_members` row inserted → join URL displayed with member's UUID as `?id=` param
2. Member visits join URL → sees their name and pre-filled email → sets password → `supabase.auth.signUp()` fires → trigger assigns `role = 'circle'` and links `circle_members.user_id` → member lands on `/#/app/circle` dashboard
3. Member views open DAC on opportunities page, sees coupon rate and amount remaining (correctly computed from subscriptions)
4. Member submits subscription → `subscriptions` row created with `initiated_by = 'member'`, `status = 'soft_commit'`, `coupon_rate_locked` set from DAC
5. Member with existing subscription for a DAC sees status instead of subscribe form
6. Staff creates subscription on behalf of member (concierge) → `initiated_by = 'staff'`, `staff_actor_id` set
7. Staff advances subscription status → correct timestamp fields populated (e.g. `funded_at` set when status → `funded`)
8. Staff uploads document to a DAC → Circle members can download it from both the opportunity detail and their subscription detail page
9. Staff uploads document to a member → member can see and download it in their documents section; other Circle members cannot
10. `draft` DACs are invisible to Circle members; `upcoming` and `open` DACs are visible
11. Staff Circle CRM shows correct total invested per member (sum of funded + active subscriptions only)
12. Staff DAC subscriptions tab shows correct gap between target and committed amount
13. Circle member cannot see or access another member's subscriptions or documents (RLS enforced)
14. Staff dashboard Circle summary card shows live member count, committed total, funded total, and open DAC gap

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2026-06-11 | 1.0.0 | Initial spec — Circle portal + staff Circle CRM + DAC management |
