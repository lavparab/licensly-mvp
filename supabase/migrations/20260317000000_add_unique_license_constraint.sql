-- Add unique constraint for sync Engine upsert
ALTER TABLE public.licenses
ADD CONSTRAINT unique_org_platform_plan UNIQUE (org_id, platform, plan_name);
