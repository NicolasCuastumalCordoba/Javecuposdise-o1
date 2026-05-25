-- Fix: Allow updating role column specifically
-- The current policy allows updates but we need to ensure role column is updatable

-- Drop old policy
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;

-- Create new policy that explicitly allows all updates to self profile
CREATE POLICY "profiles_update_self" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure role column is not null and has proper default
ALTER TABLE public.profiles
ALTER COLUMN role SET DEFAULT 'user';

-- Grant necessary permissions to authenticated users
GRANT UPDATE ON public.profiles TO authenticated;
GRANT USAGE ON TYPE public.user_role TO authenticated;
