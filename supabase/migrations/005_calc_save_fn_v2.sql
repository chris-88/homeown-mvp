-- ============================================================
-- CALC SAVE RPC v2
-- Replaces the v1 function. Now inserts the snapshot itself
-- (as SECURITY DEFINER) so the anon role RLS limitation on
-- calculator_snapshots is bypassed entirely. The CalcPage
-- pre-insert is kept for analytics but is no longer required
-- for the save flow to work.
--
-- Run migration 002 before this one (adds snapshot columns).
-- ============================================================

-- Drop old signature (param list changed)
drop function if exists public.save_calc_results(text,text,text,text,text,integer,integer,uuid,text);

create or replace function public.save_calc_results(
  -- Contact details
  p_first_name       text,
  p_last_name        text,
  p_email            text,
  p_lead_stage       text,
  p_target_areas     text,
  p_target_price_min integer,
  p_target_price_max integer,
  -- Calculator snapshot data
  p_property_price   integer,
  p_entry_stake      integer,
  p_monthly_domiter  numeric,
  p_strike_price     integer,
  p_county           text,
  p_dublin_postcode  text,
  p_household_type   text,
  p_is_ftb           boolean,
  p_ghi              integer,
  p_employment_type  text,
  p_eligible         boolean,
  -- Tracking
  p_anon_session_id  text,
  p_user_agent       text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
begin
  -- Upsert client record
  insert into clients (
    first_name, last_name, email, lead_stage,
    target_areas, target_price_min, target_price_max
  )
  values (
    p_first_name, p_last_name, p_email, p_lead_stage,
    p_target_areas, p_target_price_min, p_target_price_max
  )
  on conflict (email) do update set
    first_name       = excluded.first_name,
    last_name        = excluded.last_name,
    lead_stage       = excluded.lead_stage,
    target_areas     = coalesce(excluded.target_areas,     clients.target_areas),
    target_price_min = coalesce(excluded.target_price_min, clients.target_price_min),
    target_price_max = coalesce(excluded.target_price_max, clients.target_price_max),
    updated_at       = now()
  returning id into v_client_id;

  -- Insert snapshot linked directly to the client
  insert into calculator_snapshots (
    client_id, anon_session_id,
    property_price, entry_stake, monthly_domiter, strike_price,
    county, dublin_postcode, household_type, is_ftb,
    ghi, employment_type, eligible, saved
  ) values (
    v_client_id, p_anon_session_id,
    p_property_price, p_entry_stake, p_monthly_domiter, p_strike_price,
    p_county, p_dublin_postcode, p_household_type, p_is_ftb,
    p_ghi, p_employment_type, p_eligible, true
  );

  -- Consents (append-only)
  insert into consents (client_id, consent_type, granted, user_agent)
  values
    (v_client_id, 'contact',        true, p_user_agent),
    (v_client_id, 'privacy_notice', true, p_user_agent);

  -- Audit event
  insert into events (client_id, event_type, visibility)
  values (v_client_id, 'results_saved', 'internal');

  return v_client_id;
end;
$$;
