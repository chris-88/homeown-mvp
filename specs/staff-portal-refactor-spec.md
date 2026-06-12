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

# Staff Portal Refactor — Agent Build Specification

**Audience:** AI coding agent  
**Purpose:** Refactor the staff portal with proper role taxonomy, a stage model that maps clearly to accountability, a role-tailored work queue, and a company overview page visible to all staff.  
**Supersedes:** All `/#/app/staff/*` page specs in `mvp-build-spec.md`. The schema, auth, deploy config, and design system from that spec are unchanged.  
**Companion specs (do not re-implement):** `circle-portal-spec.md` defines Circle CRM and DAC routes. `staff-management-spec.md` defines Team and Profile routes. This spec references those but does not repeat them.

---

## What This Replaces

| Old | New |
|-----|-----|
| Single staff dashboard | Company Overview + role-tailored My Queue |
| Client list (all clients, one view) | Prospects (pre-DAC) + Clients (post-DAC), both globally visible |
| Doc review page | Removed — document exceptions surface inline on client/prospect records |
| Generic `staff` + `admin` roles | Six granular roles (see below) |

---

## Role Taxonomy

Expand `profiles.role` and `staff_members.role` to six staff roles plus admin.

| Role | Who | Owns |
|------|-----|------|
| `admin` | Founder / ops lead | Everything; user management; compliance |
| `onboarding` | Onboarding / sales team | Prospect pipeline: `new_lead` → `eligible` |
| `finance` | Finance managers | DAC sizing, timing, capital reporting, prospect→DAC assignment |
| `purchasing_agent` | Property / purchasing agents | Assigned clients: `dac_assigned` → `contracts_signed` |
| `client_success` | Client success / servicing | In-home clients: `in_home` → `pathway_complete` |
| `circle_relations` | Circle relationship managers | Circle member engagement, subscription pipeline |

All six roles plus `admin` access `/#/app/staff/*`. Navigation and data are filtered by role.

---

## Database Migration 005

File: `supabase/migrations/005_staff_portal_refactor.sql`

```sql
-- ============================================================
-- ROLE CONSTRAINTS (update from migration 004)
-- ============================================================
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in (
    'client', 'circle',
    'admin', 'onboarding', 'finance', 'purchasing_agent', 'client_success', 'circle_relations'
  ));

alter table staff_members drop constraint if exists staff_members_role_check;
alter table staff_members add constraint staff_members_role_check
  check (role in (
    'admin', 'onboarding', 'finance', 'purchasing_agent', 'client_success', 'circle_relations'
  ));


-- ============================================================
-- CLIENTS TABLE — new columns
-- ============================================================
alter table clients
  add column if not exists dac_id          uuid references dacs(id),
  add column if not exists assigned_to     uuid references staff_members(id);

-- assigned_to = who is currently responsible for this person.
-- Changes at each handoff:
--   onboarding staff → (DAC assignment) → purchasing_agent → (in_home) → client_success


-- ============================================================
-- STAGE VALUES — update check constraints
-- lead_stage: Phase 1 (prospect pipeline, pre-DAC)
-- programme_stage: Phase 2 (property) + Phase 3 (servicing)
-- The split point is dac_id being set.
-- ============================================================

-- Note: Postgres does not support ALTER COLUMN ... SET CHECK directly;
-- drop and recreate as a table constraint.
alter table clients drop constraint if exists clients_lead_stage_check;
alter table clients drop constraint if exists clients_programme_stage_check;

alter table clients
  add constraint clients_lead_stage_check
    check (lead_stage in (
      'new_lead', 'in_discovery', 'pre_qual', 'in_review',
      'eligible', 'not_eligible', 'deferred'
    )),
  add constraint clients_programme_stage_check
    check (programme_stage in (
      -- Phase 2: purchasing_agent
      'dac_assigned', 'searching', 'sale_agreed', 'conveyancing', 'contracts_signed',
      -- Phase 3: client_success
      'in_home', 'servicing', 'exit_prep', 'option_window', 'pathway_complete', 'exited'
    ));


-- ============================================================
-- EVENTS — add stage_changed event type
-- ============================================================
-- No constraint change needed; event_type is free text.
-- Use event_type = 'stage_changed' with payload { from, to, field: 'lead_stage'|'programme_stage' }
-- This enables velocity metric computation.


-- ============================================================
-- RPC: get_pipeline_counts
-- Used by the company overview. Returns count per stage across
-- both lead_stage and programme_stage in a single call.
-- ============================================================
create or replace function get_pipeline_counts()
returns table (stage text, count bigint)
language sql security definer as $$
  select lead_stage as stage, count(*) as count
  from clients
  where dac_id is null
    and lead_stage not in ('not_eligible', 'deferred')
  group by lead_stage

  union all

  select programme_stage as stage, count(*) as count
  from clients
  where programme_stage is not null
  group by programme_stage
$$;


-- ============================================================
-- RPC: get_overview_metrics
-- Single call for all company overview aggregate stats.
-- ============================================================
create or replace function get_overview_metrics()
returns json
language sql security definer as $$
  select json_build_object(
    'in_home_count', (
      select count(*) from clients
      where programme_stage in ('in_home', 'servicing', 'exit_prep', 'option_window')
    ),
    'on_pathway_count', (
      select count(*) from clients
      where dac_id is not null
        and programme_stage not in ('pathway_complete', 'exited')
    ),
    'pathway_complete_count', (
      select count(*) from clients where programme_stage = 'pathway_complete'
    ),
    'total_prospects', (
      select count(*) from clients where dac_id is null
        and lead_stage not in ('not_eligible', 'deferred')
    ),
    'eligible_unassigned', (
      select count(*) from clients where lead_stage = 'eligible' and dac_id is null
    ),
    'circle_member_count', (
      select count(*) from circle_members
    ),
    'total_committed', (
      select coalesce(sum(amount), 0) from subscriptions
      where status in ('subscribed', 'funds_requested', 'funded', 'active')
    ),
    'total_funded', (
      select coalesce(sum(amount), 0) from subscriptions
      where status in ('funded', 'active')
    )
  )
$$;
```

---

## Navigation Structure

The left sidebar renders based on `profile.role`. Section headers are visual dividers only.

```
Homeown Staff
─────────────────────────
  Overview                   ← all roles (first item; default landing)
─────────────────────────
  My Queue                   ← all roles (role-tailored work queue)
─────────────────────────
  Prospects                  ← onboarding ✓ | finance ✓(r) | admin ✓ | others —
  Clients                    ← purchasing_agent ✓ | client_success ✓ | finance ✓(r) | admin ✓ | onboarding —
─────────────────────────
  Circle CRM                 ← circle_relations ✓ | finance ✓(r) | admin ✓ | others —
  DACs                       ← finance ✓ | purchasing_agent ✓(r) | circle_relations ✓(r) | admin ✓
─────────────────────────
  Team                       ← admin only
─────────────────────────
  Profile                    ← all roles
  Sign out
```

✓ = full access (read + write within role scope)  
✓(r) = read-only  
— = hidden

**Default route:** `/#/app/staff` redirects to `/#/app/staff/overview`.

---

## Routes

| Route | Access | Page |
|-------|--------|------|
| `/#/app/staff` | All staff | Redirect → `/overview` |
| `/#/app/staff/overview` | All staff | Company overview |
| `/#/app/staff/queue` | All staff | My work queue (role-tailored) |
| `/#/app/staff/prospects` | onboarding, finance, admin | All prospects |
| `/#/app/staff/prospects/:id` | onboarding, finance, admin | Prospect detail |
| `/#/app/staff/clients` | purchasing_agent, client_success, finance, admin | All clients |
| `/#/app/staff/clients/:id` | purchasing_agent, client_success, finance, admin | Client detail |
| `/#/app/staff/circle` | As defined in `circle-portal-spec.md` | |
| `/#/app/staff/dacs` | As defined in `circle-portal-spec.md` | |
| `/#/app/staff/team` | As defined in `staff-management-spec.md` | |
| `/#/app/staff/profile` | As defined in `staff-management-spec.md` | |

---

## Page Specifications

---

### `/#/app/staff/overview` — Company Overview

Visible to all staff. No write actions on this page — read only.

**Page title:** "Homeown" (no subtitle — let the numbers speak)

---

#### Section 1 — Mission Numbers (hero, full width)

Three large stat blocks side by side. Largest typography on the page.

```
Families in their home     On the pathway     Pathways complete
        X                        X                   X
```

- **Families in their home**: `in_home_count` from `get_overview_metrics()` — clients with `programme_stage IN ('in_home', 'servicing', 'exit_prep', 'option_window')`
- **On the pathway**: `on_pathway_count` — clients with `dac_id IS NOT NULL` and not completed/exited
- **Pathways complete**: `pathway_complete_count` — clients with `programme_stage = 'pathway_complete'`

At zero, show `—` not `0`. The structure of the machine should be visible before it has clients.

---

#### Section 2 — The Pipeline

A horizontal stage funnel. Each box is a stage; the number inside is the count of clients/prospects at that stage. Read from left to right — a person flows through every box on their journey to a home.

Render in three colour-coded groups matching the three phases:

**Phase 1 — Prospect (muted/neutral)**
```
New Lead → Discovery → Pre-qual → In Review → Eligible
   X           X           X          X          X
```

**Phase 2 — Property (primary)**
```
DAC Assigned → Searching → Sale Agreed → Conveyancing → Contracts Signed
      X            X            X              X                X
```

**Phase 3 — In Home (success/green)**
```
In Home → Servicing → Exit Prep → Option Window → Complete
    X         X           X            X              X
```

Data: call `get_pipeline_counts()`. Map stage slug to display label (see label table below).

Below the funnel, two small inline counters in muted style:
- Not eligible: X  
- Deferred: X

These are honest accountability numbers — people the service couldn't reach today.

---

#### Section 3 — DAC Lifecycle

**Heading:** "The Capital Engine"

Four groups rendered as a horizontal card row. If a group has no DACs, show a faint placeholder ("No DACs yet").

**Planning** (`status IN ('draft', 'upcoming')`):
Per card: DAC name, geographic focus, target sub amount, estimated open date.

**Fundraising** (`status = 'open'`):
Per card: DAC name, coupon rate, progress bar (actual committed ÷ target sub), close date, number of subscriptions. This is the most important group — highlight it.

**Live** (`status = 'closed'` with in-home clients):
Per card: DAC name, number of clients in-home (join `clients` where `dac_id = dac.id` and `programme_stage IN ('in_home', 'servicing', 'exit_prep', 'option_window')`), start date, months remaining on average.

**Matured** (`status = 'matured'`):
Compact list only: name, client count, maturity date.

---

#### Section 4 — Circle Health

**Heading:** "The Circle"

Four inline stats in a single card:

```
X Members     €X Committed     €X Deployed     X Active DACs
```

- Members: `circle_member_count`
- Committed: `total_committed` (sum of subscriptions where status ≠ soft_commit)
- Deployed: `total_funded`
- Active DACs: count of `dacs` where `status IN ('open', 'closed')`

---

#### Section 5 — Velocity

**Heading:** "The Machine"

Small metrics row. For POC, compute from `updated_at` as a rough proxy. Add a note in the UI: *"Based on time at current stage — improves as event history builds."*

| Metric | Computation |
|--------|-------------|
| Avg. days: lead → eligible | Mean of `(now - created_at)` for clients at `lead_stage = 'eligible'` |
| Avg. days: assigned → in home | Mean of `(updated_at - created_at)` for clients at `programme_stage = 'in_home'` with `dac_id` set |
| Prospects in pipeline | `total_prospects` from overview metrics |
| Eligible awaiting DAC | `eligible_unassigned` from overview metrics |

---

### `/#/app/staff/queue` — My Work Queue

Each role sees a different version of this page. The data queries differ; the layout structure is the same: a primary action list + a context panel.

**Layout:**
- Left (2/3 width): My assigned items, ordered by longest at current stage
- Right (1/3 width): Adjacent pipeline context (what's coming toward me / leaving me)

---

#### Queue — `onboarding`

**My items:** clients where `assigned_to = current_staff_member.id` AND `lead_stage IN ('new_lead', 'in_discovery', 'pre_qual', 'in_review')`

Per row: name, current stage badge, days at current stage, doc exception badge (count of `needs_review` documents).

**Context panel:**
- Eligible awaiting DAC assignment: count + link to Prospects filtered to `eligible`
- Not eligible this week: count
- Deferred due for review: clients where `lead_stage = 'deferred'` and `deferred_until <= today` (requires a `deferred_until` date field — see note below)

---

#### Queue — `finance`

**My items:** eligible clients with no `dac_id` (the handoff queue)

Per row: client name, date reached eligible, target property area, target price band.

**Context panel:**
- Open DAC fundraising: per open DAC, target vs committed progress bar
- Eligible clients by target area: group count to help with DAC geographic matching

---

#### Queue — `purchasing_agent`

**My items:** clients where `assigned_to = current_staff_member.id` AND `programme_stage IN ('dac_assigned', 'searching', 'sale_agreed', 'conveyancing', 'contracts_signed')`

Per row: name, stage badge, days at stage, property address (if submitted), doc exception badge.

**Context panel:**
- My DAC: which DAC they're assigned to, how many clients in it, properties in conveyancing count
- Approaching in_home: clients at `contracts_signed` (about to leave their queue)

---

#### Queue — `client_success`

**My items:** clients where `assigned_to = current_staff_member.id` AND `programme_stage IN ('in_home', 'servicing', 'exit_prep', 'option_window')`

Per row: name, stage badge, months in-home, next check-in date (if tracked), doc exception badge.

**Context panel:**
- Exit prep approaching: clients in `servicing` who are past month 48 (compute from `pathway_started` event date if available, else `updated_at` proxy)
- Option window active: clients at `option_window`

---

#### Queue — `circle_relations`

**My items:** Circle members where `assigned_to = current_staff_member.id` on `circle_members`

> **Note:** Add `assigned_to uuid references staff_members(id)` to `circle_members` table as part of this migration. (Add to migration 005 SQL above.)

Per row: member name, total committed, last note date, subscription status summary.

**Context panel:**
- Subscription pipeline: soft commits pending confirmation
- Upcoming DAC close dates (urgency for engagement)

---

#### Queue — `admin`

Four summary cards linking to each queue:
- Onboarding queue: count of unactioned prospects (days > 3 at current stage)
- Finance queue: eligible unassigned count
- Property queue: clients at stage with no recent update (days > 7)
- Circle queue: members with no note in 14 days

---

### `/#/app/staff/prospects` — All Prospects

All staff can view; `onboarding` and `admin` can take actions.

**Header:** "Prospects" with count badge.

**Filters:**
- Stage (multi-select from Phase 1 stages)
- Assigned to (staff member select — `onboarding` role only)
- Date registered (date range)

**Table columns:**
| Column | Notes |
|--------|-------|
| Name | Link → `/prospects/:id` |
| Stage | Badge with colour per stage group |
| Assigned to | Staff member name or "Unassigned" |
| Days at stage | Computed from `updated_at` |
| Doc exceptions | Count of `needs_review` docs — orange badge if > 0 |
| Registered | `created_at` formatted |

**Stage badge colours:**
- `new_lead` → secondary
- `in_discovery`, `pre_qual`, `in_review` → default (blue tint)
- `eligible` → success (green) — these are ready for DAC assignment
- `not_eligible` → destructive (red)
- `deferred` → secondary (muted)

**Action for `onboarding` / `admin`:** "Add prospect" button → creates a minimal `clients` row with `lead_stage = 'new_lead'` and assigned to current user.

---

### `/#/app/staff/prospects/:id` — Prospect Detail

Two-column layout: main content left, sidebar right.

**Left — main content:**

**Stage management** (onboarding + admin only):
- Current stage displayed prominently
- "Advance stage" button — opens a modal with the next stage pre-selected, optional note. On confirm: PATCH `clients.lead_stage`, insert `events: { event_type: 'stage_changed', payload: { from, to, field: 'lead_stage' }, visibility: 'internal' }`
- Cannot regress stage (forward only, admin override excepted)

**Document exceptions:**
List of `document_requests` where `status = 'needs_review'`. Per row: doc type label, uploaded date, Approve / Reject buttons (same behaviour as original spec). If none: "No documents awaiting review."

**Notes:**
Internal notes textarea, auto-save on blur. Visible to all staff, editable by assigned staff + admin.

**Timeline:**
Append-only log of all events for this client. Staff-only visibility. Show: date, event label, actor name.

**Right — sidebar:**

**Client details:** name, email, phone, target area, target price band, household type, employment type, GHI (from calculator snapshot if saved).

**Assigned to** (onboarding + admin): staff member select. On change: PATCH `clients.assigned_to`, insert event.

**Assign to DAC** (finance + admin only — shown only when `lead_stage = 'eligible'`):
- Select DAC (open DACs only)
- Select purchasing agent (staff members with `role = 'purchasing_agent'`)
- On confirm:
  ```typescript
  await supabase.from('clients').update({
    dac_id: selectedDacId,
    programme_stage: 'dac_assigned',
    assigned_to: selectedAgentStaffMemberId,
  }).eq('id', clientId)

  await supabase.from('events').insert({
    client_id: clientId,
    event_type: 'stage_changed',
    payload: { from: 'eligible', to: 'dac_assigned', field: 'programme_stage', dac_id: selectedDacId },
    visibility: 'internal'
  })
  ```
  After this action, the client no longer appears in Prospects and appears in Clients.

---

### `/#/app/staff/clients` — All Clients

All staff can view. Write access scoped by role (see below).

**Header:** "Clients" with count badge.

**Filters:**
- Stage (multi-select from Phase 2 + 3 stages)
- DAC (select from all DACs)
- Assigned to (staff member)
- Phase (quick filter: "Property" Phase 2 / "In Home" Phase 3)

**Table columns:**
| Column | Notes |
|--------|-------|
| Name | Link → `/clients/:id` |
| Stage | Badge |
| DAC | DAC name |
| Assigned to | Staff member name |
| Days at stage | From `updated_at` |
| Doc exceptions | Badge if > 0 |
| Property | Address if submitted, else "—" |

**Phase 2 stage badge colours:**
- `dac_assigned` → default (blue)
- `searching` → default
- `sale_agreed` → default (amber)
- `conveyancing` → default (amber)
- `contracts_signed` → success

**Phase 3 stage badge colours:**
- `in_home`, `servicing` → success (green)
- `exit_prep`, `option_window` → default (amber — attention needed)
- `pathway_complete` → success (strong)
- `exited` → secondary

---

### `/#/app/staff/clients/:id` — Client Detail

Same two-column layout as prospect detail. Tabs for complex sections.

**Left — tabs:**

**Overview tab:**
- Stage management (purchasing_agent for Phase 2 stages; client_success for Phase 3 stages; admin for all)
- Document exceptions (same as prospect detail)
- Notes

**Property tab:**
- Fetch `property_cases` for this client
- If none: "No property submitted yet."
- Per property case: address, asking price, agreed price, status, valuation amount if received
- Staff with `purchasing_agent` role + admin: can update property case status
- "Issue approval notice" button (when valuation received): advances `programme_stage → approval_notice_issued` — wait, this stage isn't in the new Phase 2 list. Rationalise: `conveyancing` covers this. When the conveyancing is clear and property is approved, staff advances to `contracts_signed`.

**Timeline tab:**
All events for this client (internal visibility), ordered newest first. Date, event label, actor.

**Right — sidebar:**

**Client details:** name, email, phone, target area, household type, GHI.

**DAC:** DAC name (link to `/dacs/:id`).

**Assigned to** (admin only can reassign at this stage): current assignee shown, editable by admin.

**Reassign to client success** (purchasing_agent + admin — shown when `programme_stage = 'contracts_signed'`):
- Select client success manager
- On confirm: PATCH `assigned_to`, insert stage_changed event

---

## Stage Labels (Display Names)

Use these display labels everywhere in the UI. Never show the raw slug.

| Slug | Display label |
|------|---------------|
| `new_lead` | New lead |
| `in_discovery` | In discovery |
| `pre_qual` | Pre-qualification |
| `in_review` | Under review |
| `eligible` | Eligible |
| `not_eligible` | Not eligible |
| `deferred` | Deferred |
| `dac_assigned` | DAC assigned |
| `searching` | Property search |
| `sale_agreed` | Sale agreed |
| `conveyancing` | Conveyancing |
| `contracts_signed` | Contracts signed |
| `in_home` | In home |
| `servicing` | Pathway active |
| `exit_prep` | Exit preparation |
| `option_window` | Option window |
| `pathway_complete` | Pathway complete |
| `exited` | Exited |

---

## Role-Based Write Access Summary

| Action | admin | onboarding | finance | purchasing_agent | client_success |
|--------|:-----:|:----------:|:-------:|:----------------:|:--------------:|
| Create prospect | ✓ | ✓ | — | — | — |
| Assign prospect to staff | ✓ | ✓ | — | — | — |
| Advance Phase 1 stage | ✓ | ✓ | — | — | — |
| Assign to DAC | ✓ | — | ✓ | — | — |
| Advance Phase 2 stage | ✓ | — | — | ✓ | — |
| Reassign to client success | ✓ | — | — | ✓ | — |
| Advance Phase 3 stage | ✓ | — | — | — | ✓ |
| Approve / reject documents | ✓ | ✓ (own) | — | ✓ (own) | ✓ (own) |
| Edit internal notes | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Additional Schema Note: `deferred_until`

The onboarding queue references clients deferred until a specific date. Add this to migration 005:

```sql
alter table clients
  add column if not exists deferred_until date;
```

When onboarding sets a client to `deferred`, they set `deferred_until`. The work queue surfaces these when `deferred_until <= current_date`.

---

## Data Access (RLS Approach)

As noted in `staff-roles-and-permissions.md`: keep DB-level RLS coarse (staff vs non-staff) and enforce role-granular filtering at the application layer. All authenticated staff can read the `clients` table; role-specific write operations are enforced in the UI and query layer.

Exception: `dac_id`-scoped access for `purchasing_agent` must be enforced in every query (not just navigation) to prevent URL-based access to clients in a different DAC. Add this to all client queries for the `purchasing_agent` role:

```typescript
if (profile.role === 'purchasing_agent') {
  query = query.eq('dac_id', staffMember.assigned_dac_id)
  // staffMember.assigned_dac_id: fetch from a dacs query where purchasing_agent_id = staffMember.id
}
```

> **Note:** This requires `dacs.purchasing_agent_id uuid references staff_members(id)` — add to migration 005.

```sql
alter table dacs
  add column if not exists purchasing_agent_id uuid references staff_members(id);
```

---

## Acceptance Criteria

**Overview page:**
1. All three mission numbers (in home / on pathway / complete) show correct counts from live DB data
2. Pipeline funnel shows count at every stage; zero states show `—` not `0`
3. DAC lifecycle cards group correctly by status; fundraising group shows progress bar
4. Circle health row shows correct aggregate totals
5. Page is accessible to all staff roles and read-only for all

**Work queue:**
6. `onboarding` user sees only their assigned prospects in Phase 1 stages; context panel shows eligible unassigned count
7. `finance` user sees eligible unassigned prospects; context panel shows open DAC progress
8. `purchasing_agent` user sees only clients assigned to them in Phase 2 stages
9. `client_success` user sees only clients assigned to them in Phase 3 stages
10. `admin` sees summary cards for all four queues

**Prospects:**
11. Prospects list shows only clients where `dac_id IS NULL`
12. "Assign to DAC" action (finance / admin) sets `dac_id`, `programme_stage = 'dac_assigned'`, `assigned_to = selected agent` — client disappears from Prospects and appears in Clients
13. Stage advance inserts a `stage_changed` event with `{ from, to, field }` payload
14. `purchasing_agent` and `client_success` users do not see Prospects in nav

**Clients:**
15. Clients list shows only clients where `dac_id IS NOT NULL`
16. `purchasing_agent` user only sees clients in their assigned DAC
17. Phase 2 stage advances only available to `purchasing_agent` + `admin`
18. Phase 3 stage advances only available to `client_success` + `admin`

**Navigation:**
19. Nav items render correctly per role — no Team link for non-admin, no Prospects for purchasing_agent/client_success, etc.
20. `/#/app/staff` redirects to `/#/app/staff/overview`

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2026-06-12 | 1.0.0 | Initial spec — full staff portal refactor |
