-- Phone number and appointment datetime captured from Cal.com webhook
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone         text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS appointment_at timestamptz;
