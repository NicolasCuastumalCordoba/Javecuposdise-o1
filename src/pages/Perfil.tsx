import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { supabase, Ride } from '../supabase'
import { toast } from 'sonner'

function Stars({ rating }: { rating: number }) {
  return (
    <span className="stars">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < Math.round(rating) ? 'star' : 'star-empty'} style={{ fontSize: '16px' }}>★</span>
      ))}
    </span>
  )
}

export default function Perfil() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const nav = useNavigate()
  const [myRides, setMyRides] = useState<Ride[]>([])
  const [editing, setEditing] = useState(false)
  const [phone, setPhone] = useState(profile?.phone || '')
  const [saving, setSaving] = useState(false)
  const [changingRole, setChangingRole] = useState(false)
  const [newRole, setNewRole] = useState<'driver' | 'user'>(profile?.role || 'user')

  useEffect(() => {
    if (profile?.role) {
      setNewRole(profile.role)
    }
  }, [profile?.role])

  useEffect(() => {
    if (!user) return
    let isMounted = true

    const loadMyRides = async () => {
      try {
        const { data, error } = await supabase
          .from('rides')
          .select('*')
          .eq('driver_id', user.id)
          .order('departure_time', { ascending: false })
          .limit(10)

        if (error) throw error
        if (isMounted) setMyRides((data || []) as Ride[])
      } catch (err) {
        console.error('Error cargando mis viajes:', err)
      }
    }

    loadMyRides()

    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel(`my_rides_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rides', filter: `driver_id=eq.${user.id}` },
        (payload) => {
          if (!isMounted) return
          if (payload.eventType === 'INSERT') {
            setMyRides(prev => [payload.new as Ride, ...prev].slice(0, 10))
          } else if (payload.eventType === 'UPDATE') {
            setMyRides(prev => prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r))
          } else if (payload.eventType === 'DELETE') {
            setMyRides(prev => prev.filter(r => r.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [user])

  async function savePhone() {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ phone }).eq('id', user.id)
    if (error) toast.error('Error al guardar')
    else {
      await refreshProfile()
      toast.success('Perfil actualizado ✓')
      setEditing(false)
    }
    setSaving(false)
  }

  async function changeRole() {
    if (!user) return
    setSaving(true)
    try {
      console.log(`[DEBUG] Intentando cambiar rol a: ${newRole}`)
      
      // Actualizar el rol en la base de datos
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole as any })
        .eq('id', user.id)
        .select()
      
      if (error) {
        console.error('[ERROR] Supabase error:', error)
        throw new Error(error.message || 'Error al actualizar rol en la BD')
      }
      
      console.log('[DEBUG] Rol actualizado en BD:', data)
      
      // Refrescar el contexto para obtener el nuevo rol
      await refreshProfile()
      
      toast.success(`Ahora eres ${newRole === 'driver' ? 'Conductor' : 'Pasajero'} ✓`)
      setChangingRole(false)
    } catch (err) {
      console.error('Error al cambiar rol:', err)
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error: ${errorMsg}`)
    } finally {
      setSaving(false)
    }
  }

  if (!profile) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
      <div className="spinner" style={{ borderTopColor: '#002855', borderColor: '#e5e7eb', margin: '0 auto 16px' }} />
      <p>Cargando perfil...</p>
    </div>
  )

  const activeRides = myRides.filter(r => r.status === 'active')
  const completedRides = myRides.filter(r => r.status === 'completed')

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #001a3a, #002855)', padding: '24px 20px 32px', color: '#fff', textAlign: 'center' }}>
        <div className="avatar avatar-xl" style={{ margin: '0 auto 14px', fontSize: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          {profile.avatar_initials}
        </div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>
          {profile.full_name}
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>
          {profile.career} · Semestre {profile.semester}
        </p>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginBottom: '8px' }}>
          Perfil: <strong>{profile.role === 'driver' ? 'Conductor' : 'Usuario'}</strong>
        </p>
        <Stars rating={profile.rating || 5} />
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
          {profile.rating?.toFixed(1) || '5.0'} promedio
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0', borderBottom: '1px solid #e5e7eb' }}>
        {[
          { label: 'Viajes', value: profile.trips_count || 0 },
          { label: 'Activos', value: activeRides.length },
          { label: 'Completados', value: completedRides.length },
        ].map(({ label, value }, i) => (
          <div key={label} style={{
            padding: '16px', textAlign: 'center',
            borderRight: i < 2 ? '1px solid #e5e7eb' : 'none'
          }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '24px', fontWeight: '800', color: '#002855' }}>{value}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', marginTop: '2px' }}>{label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <div className="page-content" style={{ padding: '16px', paddingBottom: '96px' }}>
        {/* Contact info */}
        <div style={{ background: '#f9fafb', borderRadius: '14px', padding: '16px', marginBottom: '14px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: '700', color: '#002855' }}>Información de contacto</h3>
            <button onClick={() => setEditing(!editing)} style={{ background: 'none', border: 'none', color: '#1a5eb8', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Instrument Sans, sans-serif' }}>
              {editing ? 'Cancelar' : '✏️ Editar'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '16px' }}>📧</span>
              <div>
                <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '600' }}>CORREO</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>{profile.email || user?.email}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '16px' }}>📱</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '600', marginBottom: '2px' }}>TELÉFONO</div>
                {editing ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input className="input" type="tel" placeholder="3XX XXX XXXX" value={phone}
                      onChange={e => setPhone(e.target.value)} style={{ padding: '8px 12px', fontSize: '14px' }} />
                    <button className="btn btn-primary btn-sm" onClick={savePhone} disabled={saving}>
                      {saving ? <span className="spinner" style={{ width: '14px', height: '14px' }} /> : 'Guardar'}
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', color: '#374151' }}>{profile.phone || 'No registrado'}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cambiar rol */}
        <div style={{ background: '#f0f7ff', borderRadius: '14px', padding: '16px', marginBottom: '14px', border: '1.5px solid #bfdbfe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: '700', color: '#002855' }}>Mi rol</h3>
            <button onClick={() => setChangingRole(!changingRole)} style={{ background: 'none', border: 'none', color: '#1a5eb8', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Instrument Sans, sans-serif' }}>
              {changingRole ? 'Cancelar' : '🔄 Cambiar'}
            </button>
          </div>

          {changingRole ? (
            <div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <button type="button" onClick={() => setNewRole('user')} style={{
                  flex: 1, padding: '12px', borderRadius: '10px', border: newRole === 'user' ? '2px solid #002855' : '1px solid #e5e7eb',
                  background: newRole === 'user' ? '#002855' : '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '13px',
                  color: newRole === 'user' ? '#fff' : '#6b7280', transition: 'all 0.2s'
                }}>
                  👤 Pasajero
                </button>
                <button type="button" onClick={() => setNewRole('driver')} style={{
                  flex: 1, padding: '12px', borderRadius: '10px', border: newRole === 'driver' ? '2px solid #002855' : '1px solid #e5e7eb',
                  background: newRole === 'driver' ? '#002855' : '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '13px',
                  color: newRole === 'driver' ? '#fff' : '#6b7280', transition: 'all 0.2s'
                }}>
                  🚗 Conductor
                </button>
              </div>
              <button className="btn btn-primary btn-full" onClick={changeRole} disabled={saving} style={{ height: '44px' }}>
                {saving ? <span className="spinner" /> : `Cambiar a ${newRole === 'driver' ? 'Conductor' : 'Pasajero'}`}
              </button>
            </div>
          ) : (
            <div style={{ fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>{profile.role === 'driver' ? '🚗' : '👤'}</span>
              <span style={{ fontWeight: '600' }}>{profile.role === 'driver' ? 'Conductor' : 'Pasajero'}</span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                {profile.role === 'driver' ? 'Puedes publicar viajes y también ser pasajero' : 'Puedes buscar y reservar viajes'}
              </span>
            </div>
          )}
        </div>

        {/* My rides */}
        {myRides.length > 0 && (
          <div>
            <h2 className="section-title">Mis viajes publicados</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myRides.map(ride => (
                <div key={ride.id}
                  onClick={() => nav(`/viaje/${ride.id}`)}
                  style={{
                    background: '#fff', borderRadius: '12px', padding: '14px',
                    border: '1.5px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#1a5eb8')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px' }}>
                      {ride.origin} → {ride.destination}
                    </span>
                    <span className={`badge ${ride.status === 'active' ? 'badge-green' : ride.status === 'cancelled' ? 'badge-red' : 'badge-navy'}`} style={{ fontSize: '10px' }}>
                      {ride.status === 'active' ? 'Activo' : ride.status === 'cancelled' ? 'Cancelado' : 'Completado'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {new Date(ride.departure_time).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {' · '}{ride.seats_available}/{ride.seats_total} cupos
                    {' · '}${ride.price.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sign out */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
          <button className="btn btn-ghost btn-full" onClick={() => { signOut(); toast('Hasta pronto 👋') }}
            style={{ color: '#9ca3af', fontSize: '14px' }}>
            🚪 Cerrar sesión
          </button>
          <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: '#d1d5db' }}>
            JaveCupos · Comunidad Javeriana Cali
          </p>
        </div>
      </div>
    </div>
  )
}
