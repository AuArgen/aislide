-- Migration to enhance ai_logs table
ALTER TABLE public.ai_logs 
ADD COLUMN IF NOT EXISTS client_prompt TEXT,
ADD COLUMN IF NOT EXISTS full_prompt TEXT,
ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT false;

-- Update existing rows (optional, but good for consistency)
UPDATE public.ai_logs 
SET client_prompt = prompt,
    full_prompt = prompt 
WHERE client_prompt IS NULL;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
