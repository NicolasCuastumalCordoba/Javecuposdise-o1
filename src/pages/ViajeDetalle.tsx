import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { supabase, Ride } from '../supabase'
import { toast } from 'sonner'

function Stars({ rating }: { rating: number }) {
  return (
    <span className="stars">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < Math.round(rating) ? 'star' : 'star-empty'}>★</span>
      ))}
      <span style={{ marginLeft: '4px', fontSize: '13px', color: '#6b7280' }}>{rating?.toFixed(1)}</span>
    </span>
  )
}

export default function ViajeDetalle() {
  const { id } = useParams()
  const { user } = useAuth()
  const nav = useNavigate()
  const [ride, setRide] = useState<Ride | null>(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [myRequest, setMyRequest] = useState<{ status: string } | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const driver = ride?.profiles as unknown as { full_name: string; avatar_initials: string; rating: number; career: string; trips_count: number } | undefined
  const isDriver = user?.id === ride?.driver_id

  useEffect(() => {
    if (!id) return
    let isMounted = true

    const loadRide = async () => {
      try {
        const { data, error } = await supabase
          .from('rides')
          .select('*, profiles(full_name, avatar_initials, rating, career, trips_count)')
          .eq('id', id)
          .single()

        if (error) throw error
        if (isMounted) {
          setRide(data as Ride)
          setLoading(false)
        }
      } catch (err) {
        console.error('Error cargando viaje:', err)
        if (isMounted) setLoading(false)
      }
    }

    loadRide()

    if (user) {
      const loadMyRequest = async () => {
        try {
          const { data, error } = await supabase
            .from('ride_requests')
            .select('status')
            .eq('ride_id', id)
            .eq('passenger_id', user.id)
            .maybeSingle()

          if (error) throw error
          if (isMounted) setMyRequest(data)
        } catch (err) {
          console.error('Error cargando mi solicitud:', err)
        }
      }

      loadMyRequest()
    }

    // Suscribirse a cambios en tiempo real del viaje Y de mis solicitudes
    const subscription = supabase
      .channel(`ride_${id}_updates`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${id}` },
        (payload) => {
          if (isMounted) setRide(prev => prev ? { ...prev, ...payload.new } : null)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ride_requests', filter: `ride_id=eq.${id}` },
        (payload) => {
          if (isMounted && user?.id === (payload.new as any)?.passenger_id) {
            setMyRequest({ status: (payload.new as any)?.status || (payload.old as any)?.status })
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [id, user])

  async function requestRide() {
    if (!user || !ride) return
    setRequesting(true)
    try {
      const { error } = await supabase.from('ride_requests').insert({
        ride_id: ride.id,
        passenger_id: user.id,
        status: 'pending',
      })

      if (error) {
        if (error.code === '23505') {
          toast.error('Ya solicitaste este viaje')
        } else {
          throw error
        }
      } else {
        setMyRequest({ status: 'pending' })
        toast.success('¡Solicitud enviada! ⏳', { description: 'El conductor revisará tu solicitud.' })
      }
    } catch (err) {
      console.error('Error solicitando viaje:', err)
      toast.error('Error al solicitar viaje')
    }
    setRequesting(false)
  }

  async function cancelRide() {
    if (!user || !ride || !isDriver) return
    setCancelling(true)
    try {
      const { error } = await supabase.from('rides').update({ status: 'cancelled' }).eq('id', ride.id)
      if (error) throw error
      toast.success('Viaje cancelado')
      nav('/home')
    } catch (err) {
      console.error('Error cancelando viaje:', err)
      toast.error('Error al cancelar viaje')
    }
    setCancelling(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', height: '100svh', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ borderTopColor: '#002855', borderColor: '#e5e7eb', width: '32px', height: '32px' }} />
    </div>
  )

  if (!ride) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <p>Viaje no encontrado</p>
      <button className="btn btn-outline" onClick={() => nav(-1)} style={{ marginTop: '16px' }}>Volver</button>
    </div>
  )

  const dt = new Date(ride.departure_time)

  return (
    <div>
      {/* Header gradient */}
      <div style={{ background: 'linear-gradient(135deg, #001a3a, #002855)', padding: '16px 16px 24px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button onClick={() => nav(-1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5m0 0 7 7m-7-7 7-7"/></svg>
          </button>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: '800' }}>Detalle del viaje</h1>
          {ride.status === 'active' ? (
            <span className="badge badge-green" style={{ marginLeft: 'auto' }}>Activo</span>
          ) : (
            <span className="badge badge-red" style={{ marginLeft: 'auto' }}>{ride.status}</span>
          )}
        </div>

        {/* Route display */}
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff', flexShrink: 0 }} />
            <span style={{ fontWeight: '700', fontSize: '16px', flex: 1 }}>{ride.origin}</span>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
              {dt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#C8973A', flexShrink: 0 }} />
            <span style={{ fontSize: '15px', flex: 1, color: 'rgba(255,255,255,0.85)' }}>{ride.destination}</span>
          </div>
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
              📅 {dt.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
        </div>
      </div>

      <div className="page-content" style={{ padding: '16px', paddingBottom: '100px' }}>
        {/* Key info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
          {[
            { icon: '💰', label: 'Precio', value: `$${ride.price.toLocaleString()}` },
            { icon: '💺', label: 'Cupos', value: `${ride.seats_available} / ${ride.seats_total}` },
            { icon: '🚘', label: 'Vehículo', value: ride.vehicle?.split(' ')[0] || 'N/A' },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ background: '#f9fafb', borderRadius: '12px', padding: '14px 12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '22px', marginBottom: '4px' }}>{icon}</div>
              <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#002855', marginTop: '2px' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Vehicle detail */}
        <div style={{ background: '#f9fafb', borderRadius: '14px', padding: '14px 16px', marginBottom: '14px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600', marginBottom: '4px' }}>VEHÍCULO</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>🚗 {ride.vehicle}</div>
        </div>

        {/* Notes */}
        {ride.notes && (
          <div style={{ background: '#fffbf0', borderRadius: '14px', padding: '14px 16px', marginBottom: '14px', border: '1.5px solid #f5e6c8' }}>
            <div style={{ fontSize: '12px', color: '#8a5a00', fontWeight: '600', marginBottom: '4px' }}>NOTAS DEL CONDUCTOR</div>
            <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.5 }}>{ride.notes}</p>
          </div>
        )}

        {/* Driver card */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', border: '1.5px solid #e5e7eb', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,40,85,0.06)' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600', marginBottom: '12px' }}>CONDUCTOR</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="avatar avatar-lg">
              {driver?.avatar_initials || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '16px', color: '#002855' }}>
                {driver?.full_name}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{driver?.career}</div>
              <div style={{ marginTop: '4px' }}>
                <Stars rating={driver?.rating || 5} />
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '800', fontSize: '20px', color: '#002855' }}>
                {driver?.trips_count || 0}
              </div>
              <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '600' }}>VIAJES</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        {isDriver ? (
          <div>
            <PassengerList rideId={ride.id} />
            {ride.status === 'active' && (
              <button className="btn btn-danger btn-full" onClick={cancelRide} disabled={cancelling}
                style={{ marginTop: '12px', height: '48px' }}>
                {cancelling ? <span className="spinner" /> : '❌ Cancelar viaje'}
              </button>
            )}
          </div>
        ) : (
          <div>
            {ride.status !== 'active' ? (
              <div style={{ background: '#f8d7da', borderRadius: '12px', padding: '14px', textAlign: 'center', color: '#721c24', fontWeight: '600' }}>
                Este viaje ya no está disponible
              </div>
            ) : ride.seats_available === 0 ? (
              <div style={{ background: '#f3f4f6', borderRadius: '12px', padding: '14px', textAlign: 'center', color: '#6b7280', fontWeight: '600' }}>
                Sin cupos disponibles
              </div>
            ) : myRequest ? (
              <div style={{
                borderRadius: '14px', padding: '16px', textAlign: 'center',
                background: myRequest.status === 'accepted' ? '#d4edda' : myRequest.status === 'rejected' ? '#f8d7da' : '#fff3cd',
                color: myRequest.status === 'accepted' ? '#155724' : myRequest.status === 'rejected' ? '#721c24' : '#856404',
                fontWeight: '700', fontSize: '15px',
                border: `1.5px solid ${myRequest.status === 'accepted' ? '#c3e6cb' : myRequest.status === 'rejected' ? '#f5c6cb' : '#ffeeba'}`
              }}>
                {myRequest.status === 'accepted' ? '✅ ¡Cupo confirmado!' : myRequest.status === 'rejected' ? '❌ Solicitud rechazada' : '⏳ Solicitud pendiente'}
              </div>
            ) : (
              <button className="btn btn-gold btn-full" onClick={requestRide} disabled={requesting}
                style={{ height: '52px', fontSize: '16px', borderRadius: '14px' }}>
                {requesting ? <span className="spinner" /> : `💺 Solicitar cupo · $${ride.price.toLocaleString()}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function PassengerList({ rideId }: { rideId: string }) {
  const [requests, setRequests] = useState<{ id: string; status: string; passenger_id: string; profiles: { full_name: string; avatar_initials: string; career: string } | null }[]>([])
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('ride_requests')
      .select('id, status, passenger_id, profiles(full_name, avatar_initials, career)')
      .eq('ride_id', rideId)
      .then(({ data }) => setRequests((data || []) as unknown as typeof requests))
  }, [rideId])

  async function updateStatus(reqId: string, status: 'accepted' | 'rejected') {
    setUpdating(reqId)
    try {
      // 1. Actualizar estado de la solicitud
      const { error } = await supabase.from('ride_requests').update({ status }).eq('id', reqId)
      if (error) throw error

      // 2. Si es aceptar, restar un cupo
      if (status === 'accepted') {
        const { data: ride, error: rideError } = await supabase
          .from('rides')
          .select('seats_available')
          .eq('id', rideId)
          .single()
        
        if (rideError) throw rideError
        
        const newSeatsAvailable = Math.max(0, ride.seats_available - 1)
        const { error: updateError } = await supabase
          .from('rides')
          .update({ seats_available: newSeatsAvailable })
          .eq('id', rideId)
        
        if (updateError) throw updateError
      }

      // 3. Si es rechazar, sumar un cupo (opcional, pero consistente)
      if (status === 'rejected') {
        const { data: ride, error: rideError } = await supabase
          .from('rides')
          .select('seats_available, seats_total')
          .eq('id', rideId)
          .single()
        
        if (rideError) throw rideError
        
        const newSeatsAvailable = Math.min(ride.seats_total, ride.seats_available + 1)
        const { error: updateError } = await supabase
          .from('rides')
          .update({ seats_available: newSeatsAvailable })
          .eq('id', rideId)
        
        if (updateError) throw updateError
      }

      setRequests(rs => rs.map(r => r.id === reqId ? { ...r, status } : r))
      toast.success(status === 'accepted' ? '✅ Pasajero aceptado' : '❌ Solicitud rechazada')
    } catch (err) {
      console.error('Error actualizando solicitud:', err)
      toast.error('Error al actualizar solicitud')
    }
    setUpdating(null)
  }

  if (requests.length === 0) return (
    <div style={{ background: '#f9fafb', borderRadius: '14px', padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
      <p style={{ fontSize: '14px' }}>Aún no hay solicitudes para tu viaje</p>
    </div>
  )

  return (
    <div>
      <h3 className="section-title">Solicitudes ({requests.length})</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {requests.map(req => (
          <div key={req.id} style={{ background: '#fff', borderRadius: '12px', padding: '14px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '13px' }}>
              {req.profiles?.avatar_initials || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>{req.profiles?.full_name}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>{req.profiles?.career}</div>
            </div>
            {req.status === 'pending' ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-sm btn-gold" onClick={() => updateStatus(req.id, 'accepted')}
                  disabled={updating === req.id} style={{ padding: '6px 12px', fontSize: '12px' }}>
                  ✓
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => updateStatus(req.id, 'rejected')}
                  disabled={updating === req.id} style={{ padding: '6px 12px', fontSize: '12px', background: '#fee2e2', color: '#dc2626', border: 'none' }}>
                  ✗
                </button>
              </div>
            ) : (
              <span className={`badge ${req.status === 'accepted' ? 'badge-green' : 'badge-red'}`}>
                {req.status === 'accepted' ? '✅ Aceptado' : '❌ Rechazado'}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
