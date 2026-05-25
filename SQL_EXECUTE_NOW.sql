-- ============================================
-- MIGRACIÓN: Agregar columna 'role' a profiles
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Paso 1: Crear el tipo ENUM si no existe
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('driver', 'user');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Paso 2: Agregar la columna 'role' a la tabla profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';

-- Paso 3: Crear índice para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON public.profiles (role) 
WHERE role IS NOT NULL;

-- Paso 4: Sincronizar roles existentes basado en is_driver
UPDATE public.profiles
SET role = CASE 
    WHEN is_driver = true THEN 'driver'::user_role 
    ELSE 'user'::user_role 
END
WHERE role = 'user';

-- Paso 5: Agregar restricción NOT NULL
ALTER TABLE public.profiles
ALTER COLUMN role SET NOT NULL;

-- Paso 6: Dar permisos
GRANT ALL PRIVILEGES ON TYPE user_role TO authenticated, anon;

-- ✅ Listo! La migración completó exitosamente.
-- Ahora cierra esta pestaña y recarga tu app en el navegador.
