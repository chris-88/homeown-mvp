-- Property phase: expand property_cases, programme_stage trigger, regression fix

-- ── 1. Expand property_cases ──────────────────────────────────────────────────

ALTER TABLE public.property_cases
  -- Submission fields
  ADD COLUMN IF NOT EXISTS listing_url    text,
  ADD COLUMN IF NOT EXISTS property_type  text,   -- house/apartment/duplex
  ADD COLUMN IF NOT EXISTS bedrooms       integer,
  ADD COLUMN IF NOT EXISTS ber_rating     text,
  ADD COLUMN IF NOT EXISTS client_notes   text,

  -- Go/no-go review (staff)
  ADD COLUMN IF NOT EXISTS gonogo_decision    text,     -- go/conditional_go/no_go
  ADD COLUMN IF NOT EXISTS gonogo_reviewed_by uuid REFERENCES public.staff_members(id),
  ADD COLUMN IF NOT EXISTS gonogo_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS gonogo_notes       text,
  ADD COLUMN IF NOT EXISTS gonogo_checks      jsonb DEFAULT '{}'::jsonb,

  -- Bid tracking
  ADD COLUMN IF NOT EXISTS offer_price         integer,
  ADD COLUMN IF NOT EXISTS offer_submitted_at  timestamptz,
  ADD COLUMN IF NOT EXISTS bid_status          text,    -- offer_submitted/accepted/outbid/vendor_withdrawn
  ADD COLUMN IF NOT EXISTS bid_notes           text,

  -- Sale agreed details
  ADD COLUMN IF NOT EXISTS vendor_name         text,
  ADD COLUMN IF NOT EXISTS vendor_solicitor    text,
  ADD COLUMN IF NOT EXISTS homeown_solicitor   text,

  -- Fallthrough
  ADD COLUMN IF NOT EXISTS fallthrough_reason  text,   -- vendor_pullout/structural/title/chain/outbid/other
  ADD COLUMN IF NOT EXISTS active              boolean DEFAULT true;

-- ── 2. Fix on_lead_stage_change: suppress automation on stage regressions ─────

CREATE OR REPLACE FUNCTION public.on_lead_stage_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_employment_type text;
  v_payload         jsonb;
  v_url             text := 'https://najwebcqktwgzcvnyvgu.supabase.co/functions/v1/auto-deliver-docs';
  stage_order       text[] := ARRAY['new_lead','in_discovery','pre_qual','in_review','eligible'];
  old_idx           int;
  new_idx           int;
BEGIN
  IF OLD.lead_stage IS NOT DISTINCT FROM NEW.lead_stage THEN
    RETURN NEW;
  END IF;

  -- Suppress automation on regressions (e.g. eligible → in_review after fallthrough fix)
  old_idx := array_position(stage_order, OLD.lead_stage);
  new_idx := array_position(stage_order, NEW.lead_stage);
  IF new_idx IS NOT NULL AND old_idx IS NOT NULL AND new_idx <= old_idx THEN
    RETURN NEW;
  END IF;

  SELECT employment_type INTO v_employment_type
  FROM public.calculator_snapshots
  WHERE client_id = NEW.id
  ORDER BY created_at DESC LIMIT 1;

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

-- ── 3. on_programme_stage_change: dac_assigned notification ───────────────────

CREATE OR REPLACE FUNCTION public.on_programme_stage_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_payload jsonb;
  v_url     text := 'https://najwebcqktwgzcvnyvgu.supabase.co/functions/v1/auto-programme-notify';
BEGIN
  IF OLD.programme_stage IS NOT DISTINCT FROM NEW.programme_stage THEN
    RETURN NEW;
  END IF;

  v_payload := jsonb_build_object(
    'client_id',    NEW.id::text,
    'old_stage',    OLD.programme_stage,
    'new_stage',    NEW.programme_stage
  );

  PERFORM net.http_post(
    url     := v_url,
    body    := v_payload,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS programme_stage_change_trigger ON public.clients;

CREATE TRIGGER programme_stage_change_trigger
  AFTER UPDATE OF programme_stage ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.on_programme_stage_change();
