-- Add role enum type if not exists
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('driver', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role column to profiles table if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';

-- Create index for faster role queries
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);

-- Update existing profiles based on is_driver column
UPDATE public.profiles
SET role = CASE WHEN is_driver = true THEN 'driver'::user_role ELSE 'user'::user_role END
WHERE role = 'user' AND is_driver = true;

-- Add constraint to ensure role is not null
ALTER TABLE public.profiles
ALTER COLUMN role SET NOT NULL;
