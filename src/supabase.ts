import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zvhceuqqepcbntmnzqow.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_VAJIZd6bcjiOnuGttg2sfg_IcBbAEkN'

// Crear cliente Supabase con configuración optimizada para múltiples sesiones
// Cada navegador/pestaña tendrá su propia sesión independiente
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Permite que cada pestaña/navegador maneje su propia sesión de forma independiente
    persistSession: true,
    // Sincroniza cambios de autenticación entre pestañas del mismo navegador (opcional)
    detectSessionInUrl: true,
    // Configurar storage para localStorage (por defecto)
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  // Configuración de red optimizada para confiabilidad
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
})

export type Profile = {
  id: string
  full_name: string
  email: string
  career: string
  semester: number
  phone?: string
  avatar_initials: string
  rating: number
  trips_count: number
  role: 'driver' | 'user'
}

export type Ride = {
  id: string
  driver_id: string
  origin: string
  destination: string
  departure_time: string
  seats_total: number
  seats_available: number
  price: number
  vehicle: string
  notes?: string
  status: 'active' | 'completed' | 'cancelled'
  profiles?: Profile
}

export type RideRequest = {
  id: string
  ride_id: string
  passenger_id: string
  status: 'pending' | 'accepted' | 'rejected'
  rides?: Ride
}

/**
 * Limpia el caché de esquema de Supabase y reinicia la sesión
 * Útil cuando hay errores de "Could not find column in schema cache"
 */
export async function clearSupabaseCache() {
  try {
    console.log('[CACHE] Limpiando caché de Supabase...')
    
    // Obtener la sesión actual
    const { data: { session } } = await supabase.auth.getSession()
    
    // Limpiar todos los tokens y caché del localStorage
    const keys = Object.keys(window.localStorage)
    keys.forEach(key => {
      if (key.includes('sb-') || key.includes('supabase')) {
        console.log(`[CACHE] Eliminando: ${key}`)
        window.localStorage.removeItem(key)
      }
    })
    
    // Si había sesión activa, permitir que se reinicie
    if (session) {
      console.log('[CACHE] Sesión detectada, iniciando reinicio...')
      // Dar tiempo para que se limpie
      await new Promise(resolve => setTimeout(resolve, 1000))
      // La sesión se restablecerá automáticamente
      window.location.reload()
    } else {
      console.log('[CACHE] Sin sesión activa, caché limpiado')
    }
    
    return { success: true, message: 'Caché limpiado exitosamente' }
  } catch (err) {
    console.error('[CACHE] Error al limpiar:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' }
  }
}
