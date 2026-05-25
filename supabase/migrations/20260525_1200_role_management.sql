-- Migration: Add role ENUM and column to profiles
-- Date: 2026-05-25
-- Purpose: Support driver/user role management

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('driver', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role column to profiles table if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';

-- Create index for faster role queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role) WHERE role IS NOT NULL;

-- Update existing profiles: sync role based on is_driver column
UPDATE public.profiles
SET role = CASE WHEN is_driver = true THEN 'driver'::user_role ELSE 'user'::user_role END
WHERE role IS NULL OR (role = 'user' AND is_driver = true);

-- Add NOT NULL constraint
ALTER TABLE public.profiles
ALTER COLUMN role SET NOT NULL;

-- Grant permissions
GRANT ALL PRIVILEGES ON TYPE user_role TO authenticated, anon;
