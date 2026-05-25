import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, Ride } from '../supabase'
import { useAuth } from '../AuthContext'
import { RideCard } from './Home'

function timeAgo(dt: string) {
  const d = new Date(dt)
  const now = new Date()
  const diff = (d.getTime() - now.getTime()) / 60000
  if (diff < 0) return 'Ya salió'
  if (diff < 60) return `En ${Math.round(diff)} min`
  return `En ${Math.round(diff / 60)} h`
}

export default function Buscar() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'todos' | 'manana' | 'tarde' | 'noche'>('todos')

  // Función para validar si un viaje cumple con los filtros actuales
  const meetsFilters = (ride: Ride): boolean => {
    if (ride.status !== 'active' || ride.driver_id === user?.id) return false
    if (new Date(ride.departure_time) < new Date()) return false
    
    if (query.trim()) {
      const q = query.toLowerCase()
      const matches = ride.origin.toLowerCase().includes(q) || ride.destination.toLowerCase().includes(q)
      if (!matches) return false
    }

    if (filter !== 'todos') {
      const hour = new Date(ride.departure_time).getHours()
      if (filter === 'manana' && (hour < 6 || hour >= 12)) return false
      if (filter === 'tarde' && (hour < 12 || hour >= 18)) return false
      if (filter === 'noche' && (hour < 18 || hour >= 24)) return false
    }

    return true
  }

  // Cargar viajes iniciales
  useEffect(() => {
    let isMounted = true
    const abortController = new AbortController()

    const loadRides = async () => {
      try {
        setLoading(true)
        let q = supabase
          .from('rides')
          .select('*, profiles(full_name, avatar_initials, rating, career)')
          .eq('status', 'active')
          .gte('departure_time', new Date().toISOString())
          .order('departure_time', { ascending: true })

        // Excluir viajes del usuario actual
        if (user?.id) {
          q = q.neq('driver_id', user.id)
        }

        if (query.trim()) {
          q = q.or(`origin.ilike.%${query}%,destination.ilike.%${query}%`)
        }

        const now = new Date()
        if (filter === 'manana') {
          const start = new Date(now); start.setHours(6, 0, 0, 0)
          const end = new Date(now); end.setHours(12, 0, 0, 0)
          q = q.gte('departure_time', start.toISOString()).lte('departure_time', end.toISOString())
        } else if (filter === 'tarde') {
          const start = new Date(now); start.setHours(12, 0, 0, 0)
          const end = new Date(now); end.setHours(18, 0, 0, 0)
          q = q.gte('departure_time', start.toISOString()).lte('departure_time', end.toISOString())
        } else if (filter === 'noche') {
          const start = new Date(now); start.setHours(18, 0, 0, 0)
          const end = new Date(now); end.setHours(23, 59, 0, 0)
          q = q.gte('departure_time', start.toISOString()).lte('departure_time', end.toISOString())
        }

        const { data, error } = await q.limit(30)

        if (error) throw error
        if (isMounted) setRides((data || []) as Ride[])
      } catch (err) {
        console.error('Error cargando viajes:', err)
        if (isMounted) setRides([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadRides()

    return () => {
      isMounted = false
      abortController.abort()
    }
  }, [query, filter, user?.id])

  // Suscribción a cambios en tiempo real (solo una, reutilizable)
  useEffect(() => {
    if (!user?.id) return
    let isMounted = true

    const subscription = supabase
      .channel(`rides_search_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rides' },
        (payload) => {
          if (!isMounted) return

          if (payload.eventType === 'DELETE') {
            setRides(prev => prev.filter(r => r.id !== payload.old.id))
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Ride
            if (meetsFilters(updated)) {
              setRides(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r))
            } else {
              setRides(prev => prev.filter(r => r.id !== updated.id))
            }
          } else if (payload.eventType === 'INSERT') {
            const newRide = payload.new as Ride
            if (meetsFilters(newRide)) {
              setRides(prev => [...prev, newRide].sort((a, b) => 
                new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime()
              ))
            }
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [user?.id, query, filter])

  return (
    <div>
      <div style={{ background: '#002855', padding: '16px 16px 20px', color: '#fff' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: '800', marginBottom: '14px' }}>
          Buscar viajes 🔍
        </h1>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="input" placeholder="Buscar por origen o destino..."
            value={query} onChange={e => setQuery(e.target.value)}
            style={{ paddingLeft: '44px', background: 'rgba(255,255,255,0.95)' }}
          />
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', overflowX: 'auto', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        {([
          ['todos', 'Todos'],
          ['manana', '☀️ Mañana'],
          ['tarde', '🌤 Tarde'],
          ['noche', '🌙 Noche'],
        ] as const).map(([k, lbl]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            flexShrink: 0, padding: '6px 14px', borderRadius: '20px', border: 'none',
            cursor: 'pointer', fontFamily: 'Instrument Sans, sans-serif', fontSize: '13px', fontWeight: '600',
            background: filter === k ? '#002855' : '#fff',
            color: filter === k ? '#fff' : '#374151',
            boxShadow: filter === k ? '0 2px 8px rgba(0,40,85,0.2)' : '0 1px 3px rgba(0,0,0,0.08)',
            transition: 'all 0.15s'
          }}>{lbl}</button>
        ))}
      </div>

      <div className="page-content" style={{ padding: '16px', paddingBottom: '96px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="spinner" style={{ borderTopColor: '#002855', borderColor: '#e5e7eb', margin: '0 auto' }} />
          </div>
        ) : rides.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <h3>Sin resultados</h3>
            <p style={{ fontSize: '13px' }}>Intenta con otra búsqueda o filtro</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px', fontWeight: '500' }}>
              {rides.length} viaje{rides.length !== 1 ? 's' : ''} encontrado{rides.length !== 1 ? 's' : ''}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rides.map(ride => (
                <RideCard key={ride.id} ride={ride} onClick={() => nav(`/viaje/${ride.id}`)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
