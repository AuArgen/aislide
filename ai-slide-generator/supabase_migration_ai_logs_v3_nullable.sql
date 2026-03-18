-- Migration to make ai_logs columns nullable for start-state logging
ALTER TABLE public.ai_logs 
ALTER COLUMN response DROP NOT NULL,
ALTER COLUMN tokens_used DROP NOT NULL,
ALTER COLUMN cost_usd DROP NOT NULL,
ALTER COLUMN duration_ms DROP NOT NULL;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
