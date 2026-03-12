CREATE TABLE IF NOT EXISTS public.ai_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    presentation_id UUID REFERENCES public.presentations(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    tokens_used INTEGER NOT NULL,
    cost_usd NUMERIC NOT NULL,
    duration_ms INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schema Reload function for automation
CREATE OR REPLACE FUNCTION public.reload_schema() RETURNS void AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

-- If policy exists, skip or use OR REPLACE if possible (Supabase requires DROP/CREATE)
DROP POLICY IF EXISTS "Admins can view all ai_logs" ON public.ai_logs;
-- Allow anyone to INSERT (since it's a log, we want to capture everything)
-- But in reality, our server-side admin client SHOULD bypass this.
-- Adding this as a fallback in case the key is misconfigured.
DROP POLICY IF EXISTS "Anyone can insert ai_logs" ON public.ai_logs;
CREATE POLICY "Anyone can insert ai_logs"
    ON public.ai_logs
    FOR INSERT
    WITH CHECK (true);

-- Admins can view all ai_logs
DROP POLICY IF EXISTS "Admins can view all ai_logs" ON public.ai_logs;
CREATE POLICY "Admins can view all ai_logs"
    ON public.ai_logs
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND users.role = 'admin'
      )
    );

-- Trigger reload immediately after script runs
NOTIFY pgrst, 'reload schema';

-- Trigger reload immediately after script runs
NOTIFY pgrst, 'reload schema';
