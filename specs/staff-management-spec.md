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

# Staff Management — Agent Build Specification

**Audience:** AI coding agent  
**Purpose:** Add staff profile management and admin-controlled staff creation.  
**Extends:** `mvp-build-spec.md` v0.2.0 and `circle-portal-spec.md` v1.0.0. Applies on top of both. Does not modify any existing routes, schema, or behaviour.

---

## What This Adds

- A `staff_members` table holding profile detail for all staff users
- Admin-only team management: create staff, assign role (staff/admin), deactivate
- Join flow for new staff: same URL pattern as Circle (`/#/staff/join?id=`)
- Staff self-service profile page: update display name, phone, avatar
- `admin` role can access a Team section in the staff portal; `staff` role cannot

---

## Roles Clarification

The existing `profiles.role` has `staff` and `admin` as distinct values. Both roles access `/#/app/staff/*`. The distinction is:

| Role | Can do |
|------|--------|
| `staff` | All existing staff portal actions |
| `admin` | Everything `staff` can do + Team management (create/edit/deactivate staff members) |

Guard `/#/app/staff/team/*` routes so only `admin` can access them. Show the Team nav item only to admins.

---

## Database Migration 004

File: `supabase/migrations/004_staff_management.sql`

```sql
-- ============================================================
-- STAFF MEMBERS
-- ============================================================
create table if not exists staff_members (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  user_id       uuid references auth.users(id),
  created_by    uuid references auth.users(id),
  first_name    text not null,
  last_name     text not null,
  display_name  text,           -- short name the staff member chooses
  email         text unique not null,
  phone         text,
  job_title     text,
  role          text not null default 'staff'
                check (role in ('staff', 'admin')),
  avatar_path   text,           -- Supabase Storage path
  active        boolean not null default true
);

alter table staff_members enable row level security;

-- Admin: full access
create policy "staff_members: admin all"
  on staff_members for all
  using (auth_role() = 'admin');

-- Staff: read all members (useful for knowing the team)
create policy "staff_members: staff read all"
  on staff_members for select
  using (auth_role() in ('staff', 'admin'));

-- Staff: update own record (display_name, phone, avatar_path only — enforced in UI)
create policy "staff_members: staff update own"
  on staff_members for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ============================================================
-- UPDATED handle_new_user TRIGGER
-- Extends the version from migration 003.
-- Priority: circle_members → staff_members → default client.
-- Reads role from staff_members so admin-level staff get the right role.
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
declare
  v_staff_role text;
begin
  if exists (select 1 from public.circle_members where email = new.email) then
    insert into profiles (id, role) values (new.id, 'circle')
    on conflict (id) do nothing;
    update public.circle_members set user_id = new.id where email = new.email;

  elsif exists (select 1 from public.staff_members where email = new.email) then
    select role into v_staff_role from public.staff_members where email = new.email;
    insert into profiles (id, role) values (new.id, v_staff_role)
    on conflict (id) do nothing;
    update public.staff_members set user_id = new.id where email = new.email;

  else
    insert into profiles (id, role) values (new.id, 'client')
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer;


-- ============================================================
-- RPC: get_staff_invite
-- Used by the public join page. Returns minimal fields only.
-- ============================================================
create or replace function get_staff_invite(member_id uuid)
returns table (first_name text, email text, already_joined boolean)
language sql security definer as $$
  select first_name, email, (user_id is not null) as already_joined
  from staff_members
  where id = member_id;
$$;
```

---

## Supabase Storage

Reuse the existing private `documents` bucket.

| Content | Path |
|---------|------|
| Staff avatar | `staff/{user_id}/avatar/{filename}` |

Only one file per staff member is needed. On new upload, overwrite the previous file at the same path (or use a fixed filename like `avatar.jpg`).

For display, generate a signed URL (300s expiry) each time the avatar is rendered.

---

## Bootstrap: First Admin User

The first admin cannot be created via the portal (there is no admin yet to do so). Create it manually once after running the migrations:

1. In Supabase dashboard → Authentication → Users: create `admin@homeown.ie` with a password
2. Run:
   ```sql
   update profiles set role = 'admin' where id = '<user-uuid>';
   insert into staff_members (user_id, first_name, last_name, email, role)
   values ('<user-uuid>', 'Admin', 'User', 'admin@homeown.ie', 'admin');
   ```

After this, the admin can create all other staff through the portal.

---

## Routes

### Public (no auth required)

| Route | Page |
|-------|------|
| `/#/staff/join` | New staff join — set password to activate account |

### Staff Portal additions (`/#/app/staff/...`)

| Route | Access | Page |
|-------|--------|------|
| `/#/app/staff/profile` | All staff | Personal profile (edit own details + avatar) |
| `/#/app/staff/team` | Admin only | Team list |
| `/#/app/staff/team/new` | Admin only | Create staff member |
| `/#/app/staff/team/:id` | Admin only | Staff member detail + edit |

---

## Page Specifications — Public

### `/#/staff/join` — Staff Join

Identical pattern to `/#/circle/join`. Reads `?id=` param, calls `get_staff_invite` RPC.

Three states:

**Invalid ID:** "This link is invalid or has expired. Please contact your administrator."

**Already joined:** "You've already set up your account." + "Sign in →" link to `/#/auth/login`.

**Valid, not yet joined:**
- Heading: "Welcome to Homeown, [first_name]! Set a password to access the team portal."
- Email: pre-filled, read-only
- Password (required, min 8 characters)
- Confirm password
- Submit: "Create my account"

On submit:
```typescript
await supabase.auth.signUp({ email: data.email, password })
await supabase.auth.signInWithPassword({ email: data.email, password })
navigate('/#/app/staff')
```

Trigger handles role assignment and `staff_members.user_id` linking automatically.

---

## Page Specifications — Staff Portal

### `/#/app/staff/profile` — My Profile

Available to all staff. Fetch `staff_members` where `user_id = auth.uid()`.

**Display (read-only — admin-controlled):**
- Full name
- Email
- Job title
- Role (Staff / Admin)

**Editable by staff member:**
- Display name — text input, optional. Shown as their preferred short name throughout the portal (e.g. in audit events, doc review attribution). Falls back to first name if not set.
- Phone — text input
- Profile picture — file upload (image only: jpg, png, webp; max 2MB)

**Avatar upload behaviour:**
```typescript
const path = `staff/${user.id}/avatar/${file.name}`
await supabase.storage.from('documents').upload(path, file, { upsert: true })
await supabase.from('staff_members').update({ avatar_path: path }).eq('user_id', user.id)
```

Show current avatar above the upload control. If `avatar_path` is set, render via signed URL.

**Save button:** PATCH `staff_members` with `{ display_name, phone, avatar_path, updated_at: now() }`.

---

### `/#/app/staff/team` — Team List

Admin only. Fetch all `staff_members`.

Table columns:
- Avatar (small circle image via signed URL, or initials fallback)
- Name (`display_name` if set, otherwise `first_name last_name`)
- Email
- Job title
- Role badge (`Staff` / `Admin`)
- Status badge (`Active` / `Inactive`)
- Joined (formatted `created_at`)

Actions per row:
- Click → `/#/app/staff/team/:id`

Top-right button: "Add team member" → `/#/app/staff/team/new`

---

### `/#/app/staff/team/new` — Create Staff Member

Admin only.

Form:
- First name (required)
- Last name (required)
- Email (required)
- Job title (optional)
- Phone (optional)
- Role (select: Staff / Admin — default: Staff)

On submit:
```typescript
const { data: member } = await supabase
  .from('staff_members')
  .insert({
    first_name,
    last_name,
    email,
    job_title: jobTitle ?? null,
    phone: phone ?? null,
    role,
    created_by: currentUser.id,
  })
  .select().single()
```

On success: show join URL with copy button:
```
{window.location.origin}/#/staff/join?id={member.id}
```

Message: "Team member created. Share this link with [first_name] — they'll use it to set their password and access the portal."

Buttons: "Go to team member" → `/#/app/staff/team/{member.id}` | "Add another" → reset form.

---

### `/#/app/staff/team/:id` — Staff Member Detail

Admin only. Fetch `staff_members` by ID.

**Display (read-only):**
- Name, email, joined date, created by

**Editable by admin:**
- Job title
- Role (select: Staff / Admin)
- Active (toggle)

**Save button:** PATCH `{ job_title, role, active, updated_at: now() }`.

**Deactivation note:** Setting `active = false` marks the member as inactive in the portal UI. To prevent login entirely, the user must also be disabled in Supabase Dashboard → Authentication → Users. Note this in the UI: *"To disable portal access, deactivate the user in the Supabase dashboard in addition to marking them inactive here."*

**View-only section:** show the member's current `display_name`, `phone`, and avatar (if set) as set by the staff member themselves.

---

## Staff Portal Navigation Update

Add to the existing staff sidebar:

- **Profile** (`/#/app/staff/profile`) — visible to all staff, always shown at the bottom of the nav
- **Team** (`/#/app/staff/team`) — visible to `admin` role only

---

## Staff Name Display Throughout the Portal

Anywhere a staff actor's name is shown (doc review attribution, events, client notes), use:
```typescript
member.display_name ?? member.first_name
```

This applies to: the doc review queue (reviewed by), the client timeline (actor name), and staff detail pages.

---

## Acceptance Criteria

1. Admin visits `/#/app/staff/team/new`, creates a staff member → `staff_members` row inserted → join URL shown with UUID
2. New staff member visits join URL → enters password → trigger assigns correct role (`staff` or `admin`) and links `user_id` → redirected to `/#/app/staff`
3. Staff member visits `/#/app/staff/profile` → updates display name and phone → changes persisted
4. Staff member uploads an avatar → image stored in Supabase Storage at `staff/{user_id}/avatar/{filename}` → avatar shown on profile page via signed URL
5. Team list shows avatar (or initials fallback), name, job title, role badge, and active status for all staff
6. Admin can change a staff member's role between Staff and Admin → `staff_members.role` updated → `profiles.role` updated to match
7. Admin deactivates a staff member → `active = false` → member appears with Inactive badge in team list
8. `/#/app/staff/team/*` routes return a 403/redirect for users with `role = 'staff'` — not accessible to non-admins
9. Team nav item is not visible to users with `role = 'staff'`
10. Staff name shown in doc review attribution and client events uses `display_name` if set, otherwise `first_name`

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2026-06-11 | 1.0.0 | Initial spec — staff management + profile |
