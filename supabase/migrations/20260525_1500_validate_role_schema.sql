-- Validación completa del esquema de role
-- Este script asegura que la columna 'role' esté correctamente configurada

-- 1. Verificar y crear el tipo ENUM si no existe
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('driver', 'user');
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;

-- 2. Verificar que la columna existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN role public.user_role DEFAULT 'user';
    END IF;
END $$;

-- 3. Asegurar que es NOT NULL
ALTER TABLE public.profiles
ALTER COLUMN role SET NOT NULL;

-- 4. Actualizar valores existentes basado en is_driver
UPDATE public.profiles
SET role = CASE 
    WHEN is_driver = true THEN 'driver'::public.user_role
    ELSE 'user'::public.user_role
END
WHERE role IS NULL OR (is_driver = true AND role = 'user'::public.user_role);

-- 5. Crear índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 6. Verificar y corregir las políticas RLS
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;

CREATE POLICY "profiles_update_self" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 7. Logs para debugging
DO $$ 
BEGIN
    RAISE NOTICE 'Schema validation completed. profiles.role status:';
    RAISE NOTICE 'Column type: %', (
        SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    );
    RAISE NOTICE 'Sample profiles with role: %', (
        SELECT COUNT(*) FROM public.profiles WHERE role IS NOT NULL
    );
END $$;
