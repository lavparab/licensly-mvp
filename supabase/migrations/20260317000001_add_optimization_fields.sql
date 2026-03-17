-- Add required fields for AI recommendations
ALTER TABLE public.optimization_recommendations
ADD COLUMN title text,
ADD COLUMN description text,
ADD COLUMN platform text;
