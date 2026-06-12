-- Consolidate target_price_min / target_price_max → target_price
-- A prospect has one target property price, not a band.

alter table clients
  add column if not exists target_price integer;

-- Preserve any existing data
update clients
  set target_price = coalesce(target_price_min, target_price_max)
  where target_price is null
    and (target_price_min is not null or target_price_max is not null);

alter table clients
  drop column if exists target_price_min,
  drop column if exists target_price_max;

-- Update save_calc_results to use single target_price param
drop function if exists public.save_calc_results(text,text,text,text,text,integer,integer,integer,integer,numeric,integer,text,text,text,boolean,integer,text,boolean,text,text);

create or replace function public.save_calc_results(
  p_first_name       text,
  p_last_name        text,
  p_email            text,
  p_lead_stage       text,
  p_target_areas     text,
  p_target_price     integer,
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
  insert into clients (
    first_name, last_name, email, lead_stage, target_areas, target_price
  )
  values (
    p_first_name, p_last_name, p_email, p_lead_stage, p_target_areas, p_target_price
  )
  on conflict (email) do update set
    first_name   = excluded.first_name,
    last_name    = excluded.last_name,
    lead_stage   = excluded.lead_stage,
    target_areas = coalesce(excluded.target_areas,  clients.target_areas),
    target_price = coalesce(excluded.target_price,  clients.target_price),
    updated_at   = now()
  returning id into v_client_id;

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

  insert into consents (client_id, consent_type, granted, user_agent)
  values
    (v_client_id, 'contact',        true, p_user_agent),
    (v_client_id, 'privacy_notice', true, p_user_agent);

  insert into events (client_id, event_type, visibility)
  values (v_client_id, 'results_saved', 'internal');

  return v_client_id;
end;
$$;
