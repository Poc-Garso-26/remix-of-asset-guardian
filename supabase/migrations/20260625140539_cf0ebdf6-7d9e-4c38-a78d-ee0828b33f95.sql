ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS qr_code_url text,
  ADD COLUMN IF NOT EXISTS qr_code_generated_at timestamptz;