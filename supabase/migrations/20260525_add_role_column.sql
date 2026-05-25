-- Add is_driver column to profiles table (if not exists)
-- This is used to track if a profile is a driver
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_driver boolean NOT NULL DEFAULT false;

-- Create index for faster driver queries
CREATE INDEX IF NOT EXISTS profiles_is_driver_idx ON public.profiles (is_driver);
