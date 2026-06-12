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

# Calculator Wizard — Agent Build Specification

**Audience:** AI coding agent  
**Purpose:** Replace the single-field calculator in `mvp-build-spec.md` with a 4-step eligibility wizard.  
**Supersedes:** The `/#/calc`, `/#/calc/results`, and `/#/calc/save` page specs in `mvp-build-spec.md`. All other sections of that spec remain unchanged.

---

## What Changes

The existing `/calc` is a single property-price input. This replaces it with a 4-step wizard that collects property target, location, household composition, and household income — then gives a programme fit result and routes the user accordingly.

**The single eligibility gate is:**
```
GHI × 4 ≥ Strike Price
i.e. GHI × 4 ≥ Property Price × 0.9
```

This checks whether the target property is within a range where a regulated mortgage at exit is plausible under standard Irish LTI rules. It is not a Domiter affordability check — monthly service fee affordability is the client's decision, just as choosing what rent to pay is.

**Also changes:** property price range max — from €700,000 to €800,000.

---

## Database Changes (Migration 002)

Create `supabase/migrations/002_calc_wizard.sql`:

```sql
-- Extend calculator_snapshots with wizard fields
alter table calculator_snapshots
  add column if not exists county          text,
  add column if not exists dublin_postcode text,  -- null unless county = 'Dublin'
  add column if not exists household_type  text check (household_type in ('solo', 'couple')),
  add column if not exists is_ftb          boolean,
  add column if not exists ghi             integer,   -- annual gross household income in euros
  add column if not exists employment_type text check (employment_type in ('paye', 'self_employed', 'mixed')),
  add column if not exists eligible        boolean;   -- result of the GHI × 4 ≥ strike_price check
```

No new tables required. Mover prospects are stored as `clients` rows with `lead_stage = 'mover_interest'`.

---

## State Management

The wizard manages state in a single React context or component-level state object (do not use sessionStorage for step data — only persist to Supabase on the results screen):

```typescript
interface CalcWizardState {
  // Step 1
  propertyPrice: number            // 200000–800000
  entryStake: number               // computed: propertyPrice × 0.01
  monthlyDomiter: number           // computed: (propertyPrice × 0.082) / 12
  strikePrice: number              // computed: propertyPrice × 0.9
  // Step 2
  county: string
  dublinPostcode: string | null
  // Step 3
  householdType: 'solo' | 'couple'
  isFtb: boolean
  // Step 4
  ghi: number                      // annual, euros
  employmentType: 'paye' | 'self_employed' | 'mixed'
  // Derived
  eligible: boolean                // ghi × 4 >= strikePrice
  maxPropertyForIncome: number     // ghi × 4 / 0.9  (shown when not eligible)
}
```

The three computed values from Step 1 update live as `propertyPrice` changes:
```typescript
entryStake = propertyPrice * 0.01
monthlyDomiter = (propertyPrice * 0.082) / 12
strikePrice = propertyPrice * 0.9
```

Eligibility is computed on completing Step 4:
```typescript
eligible = (ghi * 4) >= strikePrice
maxPropertyForIncome = Math.floor((ghi * 4) / 0.9 / 5000) * 5000  // round down to nearest €5k
```

---

## Routes

Same routes as before. Content of each changes as specified below.

| Route | Purpose |
|-------|---------|
| `/#/calc` | 4-step wizard |
| `/#/calc/results` | Results (3 variants: eligible / income gap / mover) |
| `/#/calc/save` | Lead capture — name, email, consent |

---

## `/#/calc` — 4-Step Wizard

Show a progress indicator at the top (Step 1 of 4, Step 2 of 4, etc.). Back/Next navigation between steps. Do not validate future steps until the user reaches them.

---

### Step 1 — Property Target

**Heading:** "What property price are you targeting?"

**Inputs:**
- Slider: min €200,000, max €800,000, step €5,000. Default: €350,000.
- Number input (synced with slider): formatted as `€XXX,XXX`. Accepts manual entry; clamps to min/max on blur.

**Live output panel** (updates on every slider/input change, no submit required):

| Label | Value |
|-------|-------|
| Monthly service fee (Domiter) | `€X,XXX / month` |
| Entry Stake | `€X,XXX (1% of property price)` |
| Purchase option price | `€XXX,XXX (fixed at 10% below today's price)` |

Show a small note below the panel:
> "These figures are illustrative. The monthly service fee is your choice — Homeown does not assess whether it suits your budget."

**Next button:** enabled once `propertyPrice` is within range.

---

### Step 2 — Location

**Heading:** "Where are you looking to buy?"

**Inputs:**
- County (required): dropdown of all 26 Republic of Ireland counties, alphabetical order.
- Dublin postcode (conditional, required if county = "Dublin"): dropdown. Values:
  `D1, D2, D3, D4, D5, D6, D6W, D7, D8, D9, D10, D11, D12, D13, D14, D15, D16, D17, D18, D20, D22, D24`

Location is data collection only — not an eligibility gate.

**Next button:** enabled once county is selected (and postcode if Dublin).

---

### Step 3 — Household

**Heading:** "Tell us about your household"

**Input 1 — Household type** (radio cards, required):
- "Just me" → `householdType = 'solo'`
- "Me and my partner" → `householdType = 'couple'`

**Input 2 — First-time buyer** (radio cards, required):
- "Yes — I've never owned a home" → `isFtb = true`
- "No — I currently own or have previously owned a home" → `isFtb = false`

**If `isFtb = false`:** do not show Step 4. Next button routes to `/#/calc/results` directly with the mover variant. Set a flag in state: `variant = 'mover'`.

**If `isFtb = true`:** Next proceeds to Step 4.

---

### Step 4 — Income

**Heading:** "What is your household's gross annual income?"

**Small framing copy above inputs:**
> "To complete the pathway, you purchase the property via a regulated mortgage at the end of the term. We use your income to check whether the property is within a range where a regulated mortgage at exit is a realistic outcome — not to assess whether you can afford the monthly service fee."

**Inputs:**
- Gross household income (required): number input, formatted as `€XXX,XXX`. If `householdType = 'couple'`, label is "Combined gross annual income (both applicants)". If `solo`, label is "Gross annual income".
- Employment type (required): radio or select
  - "Employed (PAYE)" → `paye`
  - "Self-employed" → `self_employed`
  - "Mix of both" → `mixed`

**On Next:** compute `eligible` and `maxPropertyForIncome`, then navigate to `/#/calc/results`.

Also insert a row into `calculator_snapshots`:
```typescript
const anonId = sessionStorage.getItem('anon_id') ?? crypto.randomUUID()
sessionStorage.setItem('anon_id', anonId)

const { data } = await supabase.from('calculator_snapshots').insert({
  anon_session_id: anonId,
  property_price: propertyPrice,
  entry_stake: entryStake,
  monthly_domiter: monthlyDomiter,
  strike_price: strikePrice,
  county,
  dublin_postcode: dublinPostcode ?? null,
  household_type: householdType,
  is_ftb: isFtb,
  ghi,
  employment_type: employmentType,
  eligible,
  saved: false
}).select().single()

sessionStorage.setItem('snapshot_id', data.id)
```

---

## `/#/calc/results` — Results Screen

Read state from the wizard context (or sessionStorage fallback). Render one of three variants.

---

### Variant A — Eligible (`eligible = true` and `isFtb = true`)

**Heading:** "The programme looks like a fit"

Show results card:

| Label | Value |
|-------|-------|
| Target property | `€XXX,XXX` |
| Monthly service fee (Domiter) | `€X,XXX / month` |
| Entry Stake | `€X,XXX` |
| Purchase option price | `€XXX,XXX` |
| Term | `60 months` |

**Required disclaimer** (display below card, verbatim):
> "Homeown does not provide mortgage credit. The purchase option is a right, not an obligation. Mortgage approval at end of term is subject to an independent regulated lender's assessment and is not guaranteed. Monthly payments are a service fee, not rent and not credit repayments. This self-assessment is not an eligibility determination — programme participation is confirmed only after document verification."

**CTAs:**
- Primary: "Save my results and book a call" → `/#/calc/save` (variant: `eligible`)
- Secondary: "Adjust my figures" → back to `/#/calc` (restore state)

---

### Variant B — Income Gap (`eligible = false` and `isFtb = true`)

**Heading:** "Your target price may be out of reach at exit"

**Body copy:**
> "Based on standard mortgage lending parameters, a household income of €[GHI formatted] would typically support a regulated mortgage of up to €[GHI × 4 formatted]. For this property, the purchase option price at the end of the term would be €[strikePrice formatted], which is above that range."
>
> "Based on your income, the programme works best for properties up to approximately €[maxPropertyForIncome formatted]."

Show a link/button: "Adjust my target price" → back to `/#/calc` (restore state, update slider to `maxPropertyForIncome`).

**Secondary CTA:** "Stay in touch" → `/#/calc/save` (variant: `income_gap`)
- On save: `lead_stage = 'registered'`, show message: "We'll be in touch as your circumstances change or new programme bands open up."

---

### Variant C — Mover (`isFtb = false`)

**Heading:** "We're working on it for movers"

**Body copy:**
> "The Homeown programme currently serves first-time buyers. We're building out the pathway for people looking to move — if that's you, leave your details and we'll be in touch when it opens."

**CTA:** "Keep me posted" → `/#/calc/save` (variant: `mover`)

---

## `/#/calc/save` — Lead Capture

The save screen works the same for all three variants, with messaging adjusted.

**Heading:**
- Eligible: "Save your results"
- Income gap / mover: "Stay in touch"

**Form fields:**
- First name (required)
- Last name (required)
- Email (required)
- Checkbox: "I agree to be contacted about the Homeown pathway" (required)
- Checkbox: "I agree to the privacy notice" (required)

**On submit:**
```typescript
// 1. Upsert clients row
const leadStage = variant === 'mover' ? 'mover_interest' : 'registered'
const { data: client } = await supabase
  .from('clients')
  .upsert({
    first_name,
    last_name,
    email,
    lead_stage: leadStage,
    target_areas: county + (dublinPostcode ? ` ${dublinPostcode}` : ''),
    target_price_min: variant === 'mover' ? null : propertyPrice,
    target_price_max: variant === 'mover' ? null : propertyPrice,
  }, { onConflict: 'email' })
  .select().single()

// 2. Insert consents (one per checkbox)

// 3. Link snapshot to client
await supabase
  .from('calculator_snapshots')
  .update({ client_id: client.id, saved: true })
  .eq('id', sessionStorage.getItem('snapshot_id'))

// 4. Insert event
await supabase.from('events').insert({
  client_id: client.id,
  event_type: 'results_saved',
  visibility: 'internal'
})
```

**Success state** (same page, replace form):

- Eligible: "Thanks [first_name] — we'll be in touch to book your discovery call."
- Income gap: "Thanks [first_name] — we'll reach out as things change."
- Mover: "Thanks [first_name] — we'll be in touch when the mover pathway opens."

---

## Language Rules (Calculator-Specific)

In addition to the global language rules in `mvp-build-spec.md`:

| Forbidden | Use instead |
|-----------|-------------|
| "You can afford X" | "The programme works best for properties up to X" |
| "Affordability check" | "Programme exit fit" or "programme fit indicator" |
| "Mortgage pre-approval" / "AIP" | Never use — not applicable at this stage |
| "Approved" / "pre-qualified" | "The programme looks like a fit" |
| "Deposit" | "Entry Stake" |
| "Savings" | Never use |
| Anything implying Domiter is assessed for affordability | Domiter affordability is not assessed |

The income question must never be framed as "can you afford the monthly payment." The framing is always about exit mortgage plausibility.

---

## Acceptance Criteria (Calculator)

Replace the single calculator criterion in `mvp-build-spec.md` with these:

1. Property price slider updates Domiter, Entry Stake, and Strike Price live with no page reload or submit
2. Dublin postcode selector appears if and only if county = "Dublin"
3. Non-FTB path bypasses Step 4, routes to mover results variant, and on save creates a `clients` row with `lead_stage = 'mover_interest'`
4. GHI × 4 < Strike Price → income gap variant shown with correct `maxPropertyForIncome` figure
5. GHI × 4 ≥ Strike Price + `isFtb = true` → eligible variant shown with results card and disclaimer verbatim
6. "Adjust my target price" on income-gap screen restores wizard state and pre-sets slider to `maxPropertyForIncome`
7. On save: `calculator_snapshots` row is linked to `clients` row via `client_id`; `saved = true`; `county`, `ghi`, `eligible`, and all other wizard fields are persisted on the snapshot
8. On save: two `consents` rows are created (one per checkbox)
9. Disclaimer text on eligible results screen matches verbatim spec exactly
10. No instance of "affordability", "approved", "pre-approved", "AIP", "deposit", or "savings" anywhere in the calculator flow

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2026-06-11 | 1.0.0 | Initial spec — replaces single-field calc in mvp-build-spec.md v0.2.0 |
