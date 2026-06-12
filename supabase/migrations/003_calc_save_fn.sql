-- ============================================================
-- CALC SAVE RPC
-- Called by anonymous users from the calc save page.
-- Runs as SECURITY DEFINER (postgres) to bypass RLS on the
-- clients upsert — no anon UPDATE policy exists by design.
-- ============================================================

create or replace function public.save_calc_results(
  p_first_name       text,
  p_last_name        text,
  p_email            text,
  p_lead_stage       text,
  p_target_areas     text,
  p_target_price_min integer,
  p_target_price_max integer,
  p_snapshot_id      uuid,
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
    first_name, last_name, email, lead_stage,
    target_areas, target_price_min, target_price_max
  )
  values (
    p_first_name, p_last_name, p_email, p_lead_stage,
    p_target_areas, p_target_price_min, p_target_price_max
  )
  on conflict (email) do update set
    first_name        = excluded.first_name,
    last_name         = excluded.last_name,
    lead_stage        = excluded.lead_stage,
    target_areas      = coalesce(excluded.target_areas,     clients.target_areas),
    target_price_min  = coalesce(excluded.target_price_min, clients.target_price_min),
    target_price_max  = coalesce(excluded.target_price_max, clients.target_price_max),
    updated_at        = now()
  returning id into v_client_id;

  insert into consents (client_id, consent_type, granted, user_agent)
  values
    (v_client_id, 'contact',        true, p_user_agent),
    (v_client_id, 'privacy_notice', true, p_user_agent);

  if p_snapshot_id is not null then
    update calculator_snapshots
    set client_id = v_client_id, saved = true
    where id = p_snapshot_id;
  end if;

  insert into events (client_id, event_type, visibility)
  values (v_client_id, 'results_saved', 'internal');

  return v_client_id;
end;
$$;
