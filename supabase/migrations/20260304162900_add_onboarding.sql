-- Add onboarding flag to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Add org profile fields collected during onboarding
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS company_size text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS industry text;

-- Change the trigger function to ensure new users have onboarding_completed = false
-- (Although the default is false, being explicit doesn't hurt, but the previous trigger works fine.
-- Wait, the previous trigger just does an insert. Let's make sure it handles the new columns if needed, 
-- but actually `onboarding_completed` defaults to false so the existing trigger `public.handle_new_user` 
-- will automatically result in onboarding_completed = false. I will just replace the function to be safe if anything else was needed)

-- Update existing seeded users to be assumed already onboarded so their dashboard doesn't break
UPDATE public.users SET onboarding_completed = true WHERE email IN ('admin@acmecorp.com', 'manager@acmecorp.com');
