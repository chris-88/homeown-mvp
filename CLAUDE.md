# Homeown MVP — Agent Instructions

> This file reflects the current build state as of 2026-06-11. The full original spec is in `mvp-build-spec.md`. The Circle Portal spec is in `circle-portal-spec.md`.

---

## What has been built

The project is **complete and building** (`npx vite build` passes). All surfaces are implemented:

- Public site: `/`, `/how-it-works`, `/faq`
- Calculator wizard: `/calc`, `/calc/results`, `/calc/save`
- Auth: login, logout, forgot password, sign-up, route guards
- Client portal: `/app/client` (dashboard, documents, property, timeline, profile)
- Staff portal: `/app/staff` (dashboard, clients list + detail, doc review, Circle CRM, DACs)
- Circle Portal: `/circle/join` (public join) + `/app/circle` (dashboard, opportunities, portfolio, documents, profile)

---

## Stack

- **Frontend:** Vite + React 18 + TypeScript, in `frontend/`
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`, `@theme inline`), shadcn/ui new-york style
- **Routing:** React Router v7, `createHashRouter` — all routes use `/#/` prefix
- **Data fetching:** TanStack Query v5 (`useQuery`, `useQueryClient`)
- **Forms:** React Hook Form + Zod
- **Backend:** Supabase (auth, Postgres, Storage bucket `documents`)
- **Icons:** lucide-react

---

## Language rules (non-negotiable)

Never use these words anywhere in the UI: **"rent"**, **"savings"**, **"AIP"**, **"deposit-free"**, **"balance"**

---

## Environment

- `.env.example` — template with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- `.env.local` — actual values (gitignored)
- Supabase client: `frontend/src/lib/supabase.ts`

---

## Database migrations

Run these in order in the Supabase SQL editor. All must be applied for the app to work.

| File | What it does |
|------|--------------|
| `supabase/migrations/001_initial.sql` | Core schema: profiles, clients, document_requests, property_cases, events, calculator_snapshots, consents. Auth trigger + `auth_role()` RPC. Both functions use `set search_path = public`. |
| `supabase/migrations/002_calc_wizard.sql` | Adds county, dublin_postcode, household_type, is_ftb, ghi, employment_type, eligible to calculator_snapshots |
| `supabase/migrations/006_target_price.sql` | Consolidates target_price_min/max → single `target_price integer`. Drops and recreates `save_calc_results` RPC (SECURITY DEFINER, handles client upsert + snapshot + consents + event atomically) |
| `supabase/migrations/007_drop_client_notes.sql` | Drops `clients.notes` (replaced by append-only events) |
| `supabase/migrations/008_circle_portal.sql` | Circle Portal: adds `circle` role, `circle_members`, `dacs`, `subscriptions`, `dac_documents`, `circle_member_documents`, `circle_member_notes` tables. Drops `clients.dac_reference`, adds `clients.dac_id` FK. Updates `handle_new_user` trigger for circle auto-assignment. Adds `get_circle_invite` RPC. |

Migrations 003, 004, 005 are superseded — do not run them if starting fresh; 006 already incorporates their changes.

---

## Key architectural patterns

### Auth trigger
`handle_new_user()` fires on `after insert on auth.users`. If the new user's email matches a `circle_members` record, it assigns `role = 'circle'` and links `circle_members.user_id`. Otherwise assigns `role = 'client'`. Uses `set search_path = public`.

### Role → portal routing
| Role | Portal |
|------|--------|
| `client` | `/#/app/client` |
| `staff` / `admin` | `/#/app/staff` |
| `circle` | `/#/app/circle` |

RouteGuard: `frontend/src/components/shared/RouteGuard.tsx`  
Login redirect: `frontend/src/pages/auth/LoginPage.tsx`

### SECURITY DEFINER RPCs
Any mutation callable by anon or circle roles must use a SECURITY DEFINER function with `set search_path = public`. The RLS upsert pattern (PostgREST checks both INSERT and UPDATE policies) makes direct table writes from anon unreliable. Use RPCs for public-facing saves.

### Append-only notes
- Client notes: `events` table, `event_type = 'staff_note'`, `visibility = 'internal'`, `payload: { text }`. No UPDATE/DELETE policies on events.
- Circle member notes: `circle_member_notes` table (separate). Staff INSERT/SELECT only. No circle/client policies.

### File storage
Private Supabase Storage bucket: `documents`

| Content | Path |
|---------|------|
| Client document | `clients/{client_id}/{doc_request_id}/{filename}` |
| DAC document | `dac/{dac_id}/{dac_document_id}/{filename}` |
| Circle member document | `circle/{circle_member_id}/{doc_id}/{filename}` |

Generate signed URLs with 300s expiry on download click.

### Circle member invite flow
1. Staff creates `circle_members` record → join URL shown: `{origin}/#/circle/join?id={member_id}`
2. Member visits URL → calls `get_circle_invite` RPC → sets password via `supabase.auth.signUp()`
3. Trigger auto-assigns `circle` role and links `circle_members.user_id`
4. Member signed in immediately (email confirmation must be OFF in Supabase Dashboard)

---

## Key files

```
frontend/src/
  router.tsx                          — all routes (hash mode)
  types/index.ts                      — all TypeScript types + label constants
  lib/
    supabase.ts                       — Supabase client
    auth.tsx                          — AuthContext, useAuth hook
    calcWizard.tsx                    — Calculator wizard context
    utils.ts                          — cn(), formatDate(), formatCurrency()
  components/shared/
    RouteGuard.tsx                    — role-based route protection
    PublicNav.tsx                     — public site nav
  pages/
    public/                           — HomePage, HowItWorksPage, FaqPage
    calc/                             — CalcPage (4-step wizard), ResultsPage, SavePage
    auth/                             — LoginPage, SignUpPage, ForgotPage, LogoutPage
    client/                           — ClientLayout + 5 pages
    circle/
      CircleLayout.tsx                — sidebar nav, RouteGuard requiredRole="circle"
      join/JoinPage.tsx               — public invite accept page
      DashboardPage.tsx
      OpportunitiesPage.tsx
      DacDetailPage.tsx               — DAC detail + subscribe form
      PortfolioPage.tsx
      SubscriptionDetailPage.tsx      — status stepper
      DocumentsPage.tsx
      ProfilePage.tsx
    staff/
      StaffLayout.tsx                 — sidebar nav (Dashboard, Clients, Doc review, Circle CRM, DACs)
      DashboardPage.tsx               — stats + Circle summary card + pathway table + action queues
      ClientListPage.tsx
      ClientDetailPage.tsx            — Overview (calc results, DAC select, stage mgmt), Docs, Property, Timeline
      DocReviewPage.tsx
      circle/
        CircleListPage.tsx
        CircleMemberNewPage.tsx       — creates member + shows invite URL
        CircleMemberDetailPage.tsx    — Overview (KYC, notes), Investments (concierge sub), Documents
      dacs/
        DacListPage.tsx
        DacNewPage.tsx
        DacDetailPage.tsx             — Fundamentals (edit), Documents (upload/delete), Subscriptions (summary bar)

supabase/
  migrations/                         — SQL files (run 001, 002, 006, 007, 008)
  seed.sql                            — reference only; create auth users via Supabase Dashboard
```

---

## Auth bootstrapping (important)

Do **not** INSERT directly into `auth.users` via SQL — GoTrue uses `$2b$` bcrypt; pgcrypto produces `$2a$`, making passwords unverifiable. Also, direct inserts miss required GoTrue columns and produce broken records.

Create users via: **Supabase Dashboard → Authentication → Users → Add user**

Then run the seed SQL to update profiles and insert client records.

To make a user staff: `UPDATE profiles SET role = 'staff' WHERE id = '<uuid>';`

---

## Supabase settings to configure

- **Authentication → Email → Confirm email:** OFF (required for Circle invite flow to work without email confirmation step)
- **Storage:** Create private bucket named `documents`

---

## What to work on next

The MVP is feature-complete per `mvp-build-spec.md` and `circle-portal-spec.md`. Possible next steps:

- End-to-end testing of the Circle invite + join flow
- Deploy configuration (GitHub Actions workflow is in `.github/`)
- Supabase project provisioning and running all migrations
- Seed data for demos
