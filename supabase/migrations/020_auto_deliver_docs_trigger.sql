-- Auto document delivery: DB trigger → auto-deliver-docs edge function
-- Fires when lead_stage changes on the clients table.

-- Enable pg_net if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Trigger function: fires on lead_stage change
CREATE OR REPLACE FUNCTION public.on_lead_stage_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_employment_type text;
  v_payload         jsonb;
  v_url             text := 'https://najwebcqktwgzcvnyvgu.supabase.co/functions/v1/auto-deliver-docs';
BEGIN
  -- Skip if stage did not change
  IF OLD.lead_stage IS NOT DISTINCT FROM NEW.lead_stage THEN
    RETURN NEW;
  END IF;

  -- Fetch employment type from latest calculator snapshot
  SELECT employment_type INTO v_employment_type
  FROM public.calculator_snapshots
  WHERE client_id = NEW.id
  ORDER BY created_at DESC
  LIMIT 1;

  v_payload := jsonb_build_object(
    'client_id',       NEW.id::text,
    'old_stage',       OLD.lead_stage,
    'new_stage',       NEW.lead_stage,
    'employment_type', COALESCE(v_employment_type, 'paye')
  );

  PERFORM net.http_post(
    url     := v_url,
    body    := v_payload,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lead_stage_change_trigger ON public.clients;

CREATE TRIGGER lead_stage_change_trigger
  AFTER UPDATE OF lead_stage ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.on_lead_stage_change();
