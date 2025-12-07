-- Add participants column to evaluations table
ALTER TABLE public.evaluations 
ADD COLUMN participantes TEXT[] DEFAULT '{}'::TEXT[];