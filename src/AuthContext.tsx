import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, Profile } from './supabase'

type AuthCtx = {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({
  user: null, profile: null, loading: true,
  signOut: async () => {}, refreshProfile: async () => {}
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(uid: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single()
      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Error cargando perfil:', error)
        }
        setProfile(null)
      } else if (data) {
        setProfile(data as Profile)
      }
    } catch (err) {
      console.error('Excepción al cargar perfil:', err)
      setProfile(null)
    }
  }

  async function refreshProfile() {
    if (user) await loadProfile(user.id)
  }

  useEffect(() => {
    // Inicializar: obtener sesión actual si existe
    // Cada navegador/pestaña tiene su propia sesión en localStorage
    let isMounted = true

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return
      
      if (error) {
        console.error('Error obteniendo sesión inicial:', error)
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      const u = session?.user ?? null
      setUser(u)
      
      if (u) {
        loadProfile(u.id).finally(() => {
          if (isMounted) setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    // Escuchar cambios de autenticación (login, logout, etc.)
    // Estos eventos son específicos para ESTA sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      const u = session?.user ?? null
      setUser(u)
      
      if (u) {
        await loadProfile(u.id)
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }
  

  return (
    <Ctx.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)