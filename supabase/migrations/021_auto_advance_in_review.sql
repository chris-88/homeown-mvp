-- Auto-advance pre_qual → in_review when all documents are submitted.
-- Fires after a document_request status changes to needs_review or approved.
-- If no documents remain in requested/rejected state, advances the client
-- to in_review — which chains into on_lead_stage_change() → in-review email.

CREATE OR REPLACE FUNCTION public.on_document_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_lead_stage    text;
  v_pending_count integer;
BEGIN
  -- Only act on uploads (status moving to needs_review or approved)
  IF NEW.status NOT IN ('needs_review', 'approved') THEN
    RETURN NEW;
  END IF;

  -- Only relevant when client is in pre_qual
  SELECT lead_stage INTO v_lead_stage
  FROM public.clients
  WHERE id = NEW.client_id;

  IF v_lead_stage IS DISTINCT FROM 'pre_qual' THEN
    RETURN NEW;
  END IF;

  -- Count docs still outstanding (requested or rejected)
  SELECT COUNT(*) INTO v_pending_count
  FROM public.document_requests
  WHERE client_id = NEW.client_id
    AND status IN ('requested', 'rejected');

  -- All docs submitted — advance stage
  IF v_pending_count = 0 THEN
    UPDATE public.clients
    SET lead_stage = 'in_review'
    WHERE id = NEW.client_id
      AND lead_stage = 'pre_qual';

    INSERT INTO public.events (client_id, event_type, payload, visibility)
    VALUES (
      NEW.client_id,
      'stage_changed',
      jsonb_build_object(
        'from', 'pre_qual',
        'to',   'in_review',
        'note', 'Auto-advanced: all documents submitted'
      ),
      'internal'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS document_status_change_trigger ON public.document_requests;

CREATE TRIGGER document_status_change_trigger
  AFTER UPDATE OF status ON public.document_requests
  FOR EACH ROW EXECUTE FUNCTION public.on_document_status_change();
