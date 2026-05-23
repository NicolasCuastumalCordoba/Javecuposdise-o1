import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { supabase, Ride } from '../supabase'
import { toast } from 'sonner'

function timeAgo(dt: string) {
  const d = new Date(dt)
  const now = new Date()
  const diff = (d.getTime() - now.getTime()) / 60000
  if (diff < 0) return 'Ya salió'
  if (diff < 60) return `En ${Math.round(diff)} min`
  if (diff < 1440) return `En ${Math.round(diff / 60)} h`
  return d.toLocaleDateString('es-CO', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="stars" style={{ fontSize: '12px' }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < Math.round(rating) ? 'star' : 'star-empty'}>★</span>
      ))}
      <span style={{ marginLeft: '3px', color: '#6b7280', fontSize: '11px' }}>{rating.toFixed(1)}</span>
    </span>
  )
}

export default function Home() {
  const { user, profile, signOut } = useAuth()
  const nav = useNavigate()
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'

  useEffect(() => {
    supabase
      .from('rides')
      .select('*, profiles(full_name, avatar_initials, rating, career)')
      .eq('status', 'active')
      .gte('departure_time', new Date().toISOString())
      .order('departure_time', { ascending: true })
      .limit(5)
      .then(({ data }) => {
        setRides((data || []) as Ride[])
        setLoading(false)
      })
  }, [])

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #001a3a 0%, #002855 60%, #003875 100%)',
        padding: '20px 20px 32px', color: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '2px' }}>{greeting} 👋</p>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: '800' }}>
              {profile?.full_name?.split(' ')[0] || 'Estudiante'}
            </h1>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginTop: '2px' }}>
              {profile?.career?.split(' ')[0] || 'Javeriana Cali'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="avatar" style={{ fontSize: '16px' }}>
              {profile?.avatar_initials || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <button onClick={() => { signOut(); toast('Hasta pronto 👋') }}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Stats chips */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { label: `${profile?.trips_count || 0} viajes`, icon: '🚗' },
            { label: `${profile?.rating?.toFixed(1) || '—'} ⭐`, icon: '' },
            { label: profile?.role === 'driver' ? 'Conductor' : 'Usuario', icon: '👤' },
          ].map(({ label }) => (
            <span key={label} style={{
              background: 'rgba(255,255,255,0.12)', borderRadius: '20px',
              padding: '5px 12px', fontSize: '12px', fontWeight: '600',
              color: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)'
            }}>
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="page-content" style={{ paddingBottom: '96px' }}>
        {/* Quick actions */}
        <div style={{ padding: '20px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button
            onClick={() => nav('/publicar')}
            style={{
              background: 'linear-gradient(135deg, #002855, #1a5eb8)',
              borderRadius: '16px', border: 'none', padding: '20px 16px',
              color: '#fff', cursor: 'pointer', textAlign: 'left',
              boxShadow: '0 4px 20px rgba(0,40,85,0.25)', transition: 'transform 0.15s'
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🚗</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '15px' }}>Ofrecer viaje</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>Publica tu ruta</div>
          </button>

          <button
            onClick={() => nav('/buscar')}
            style={{
              background: 'linear-gradient(135deg, #8a5a00, #C8973A)',
              borderRadius: '16px', border: 'none', padding: '20px 16px',
              color: '#fff', cursor: 'pointer', textAlign: 'left',
              boxShadow: '0 4px 20px rgba(200,151,58,0.3)', transition: 'transform 0.15s'
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔍</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '15px' }}>Buscar cupo</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>Encuentra ruta</div>
          </button>
        </div>

        {/* Mis solicitudes pendientes */}
        <PendingRequests userId={user?.id || ''} />

        {/* Viajes disponibles */}
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Viajes disponibles</h2>
            <button onClick={() => nav('/buscar')} style={{
              background: 'none', border: 'none', color: '#1a5eb8', fontSize: '13px',
              fontWeight: '600', cursor: 'pointer', fontFamily: 'Instrument Sans, sans-serif'
            }}>Ver todos →</button>
          </div>

          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
              <div className="spinner" style={{ borderTopColor: '#002855', borderColor: '#e5e7eb', margin: '0 auto' }} />
            </div>
          ) : rides.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2z"/>
                <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
              </svg>
              <h3>Sin viajes por ahora</h3>
              <p style={{ fontSize: '13px' }}>¡Sé el primero en publicar una ruta!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rides.map(ride => (
                <RideCard key={ride.id} ride={ride} onClick={() => nav(`/viaje/${ride.id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PendingRequests({ userId }: { userId: string }) {
  const [requests, setRequests] = useState<{ id: string; status: string; rides: { origin: string; destination: string; departure_time: string } | null }[]>([])
  const nav = useNavigate()

  useEffect(() => {
    if (!userId) return
    supabase
      .from('ride_requests')
      .select('id, status, rides(origin, destination, departure_time)')
      .eq('passenger_id', userId)
      .eq('status', 'pending')
      .limit(3)
      .then(({ data }) => setRequests((data || []) as unknown as typeof requests))
  }, [userId])

  if (requests.length === 0) return null

  return (
    <div style={{ padding: '16px 16px 0' }}>
      <h2 className="section-title">Mis solicitudes</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {requests.map(req => (
          <div key={req.id} style={{
            background: '#fffbf0', border: '1.5px solid #f5e6c8',
            borderRadius: '12px', padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <div style={{ fontSize: '20px' }}>⏳</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', fontSize: '13px' }}>
                {req.rides?.origin} → {req.rides?.destination}
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                {req.rides?.departure_time ? timeAgo(req.rides.departure_time) : ''}
              </div>
            </div>
            <span className="badge badge-gold">Pendiente</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RideCard({ ride, onClick }: { ride: Ride; onClick: () => void }) {
  const p = ride.profiles as unknown as { full_name: string; avatar_initials: string; rating: number; career: string } | undefined
  return (
    <div className="ride-card" onClick={onClick}>
      <div className="ride-route" style={{ marginBottom: '12px' }}>
        <div className="route-point">
          <div className="route-dot route-dot-origin">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="4"/></svg>
          </div>
          <span style={{ fontWeight: '600', fontSize: '14px', flex: 1 }}>{ride.origin}</span>
          <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
            {new Date(ride.departure_time).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="route-point">
          <div className="route-dot route-dot-dest">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
          <span style={{ fontSize: '14px', flex: 1, color: '#374151' }}>{ride.destination}</span>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#C8973A' }}>
            ${ride.price.toLocaleString()}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
          {p?.avatar_initials || '?'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: '600' }}>{p?.full_name || 'Conductor'}</div>
          <Stars rating={p?.rating || 5} />
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>
            {ride.seats_available} cupo{ride.seats_available !== 1 ? 's' : ''}
          </span>
          <span className="badge badge-green" style={{ fontSize: '10px', padding: '2px 8px' }}>
            {timeAgo(ride.departure_time)}
          </span>
        </div>
      </div>
    </div>
  )
}
