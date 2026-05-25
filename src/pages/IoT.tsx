import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../AuthContext'
import { supabase, Ride } from '../supabase'

// Simula ruta GPS del conductor: Ciudad 2000 → Javeriana Cali (15 minutos)
function useSimulatedLocation(ride: Ride | null) {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null)
  const [progress, setProgress] = useState(0) // 0 a 1 (0% a 100%)
  const frameRef = useRef(0)

  useEffect(() => {
    if (!ride) return

    // Ruta: Ciudad 2000 → Javeriana Cali
    const start = { lat: 3.4020, lng: -76.5085 }  // Ciudad 2000
    const end = { lat: 3.3702, lng: -76.5340 }    // Javeriana Cali
    
    // Simula 15 minutos = 900 segundos
    // Actualizamos cada 1500ms = 1.5 segundos
    // 900 / 1.5 = 600 steps
    let step = 0
    const totalSteps = 600

    const interval = setInterval(() => {
      step += 1
      const p = Math.min(step / totalSteps, 1.0) // 0 a 1
      setProgress(p)
      
      // Interpolación lineal entre inicio y fin
      setPos({
        lat: start.lat + (end.lat - start.lat) * p,
        lng: start.lng + (end.lng - start.lng) * p,
      })
      frameRef.current = p
      
      if (p >= 1.0) clearInterval(interval) // Detener al llegar
    }, 1500)

    return () => clearInterval(interval)
  }, [ride])

  return { pos, progress }
}

function MapView({ lat, lng, origin, destination }: { lat: number; lng: number; origin: string; destination: string }) {
  // Mapa estático via OpenStreetMap tile + pin SVG overlay
  const zoom = 14
  const tileUrl = `https://tile.openstreetmap.org/${zoom}/${lon2tile(lng, zoom)}/${lat2tile(lat, zoom)}.png`

  function lon2tile(lon: number, z: number) { return Math.floor((lon + 180) / 360 * Math.pow(2, z)) }
  function lat2tile(lat: number, z: number) { return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z)) }

  return (
    <div style={{ position: 'relative', height: '220px', borderRadius: '16px', overflow: 'hidden', background: '#e8f0fb' }}>
      {/* OSM iframe embed (no API key needed) */}
      <iframe
        title="mapa"
        style={{ width: '100%', height: '100%', border: 'none' }}
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02}%2C${lat - 0.015}%2C${lng + 0.02}%2C${lat + 0.015}&layer=mapnik&marker=${lat}%2C${lng}`}
      />
      {/* Overlay labels */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
        <span style={{ background: 'rgba(0,40,85,0.85)', color: '#fff', fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px', backdropFilter: 'blur(4px)' }}>
          📍 {origin}
        </span>
        <span style={{ background: 'rgba(200,151,58,0.9)', color: '#fff', fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' }}>
          🏁 {destination}
        </span>
      </div>
      {/* Live badge */}
      <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: '#dc2626', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'pulse 1s infinite' }} />
        EN VIVO
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  )
}

function SeatsIndicator({ available, total }: { available: number; total: number }) {
  return (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', border: '1.5px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '14px', color: '#002855' }}>
          💺 Cupos disponibles
        </span>
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: '800', color: available > 0 ? '#38a169' : '#dc2626' }}>
          {available}/{total}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{
            flex: 1, height: '36px', borderRadius: '10px',
            background: i < (total - available) ? '#002855' : i < total ? '#e5e7eb' : '#e5e7eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', transition: 'background 0.3s'
          }}>
            {i < (total - available) ? '🧑' : '○'}
          </div>
        ))}
      </div>
      <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px', textAlign: 'center' }}>
        {available === 0 ? 'Sin cupos — viaje lleno' : `${available} cupo${available > 1 ? 's' : ''} libre${available > 1 ? 's' : ''}`}
      </p>
    </div>
  )
}

function ETACard({ progress, lat, lng }: { progress: number; lat: number | null; lng: number | null }) {
  // ETA: quedan 15 minutos * (1 - progress)
  const remainingMinutes = Math.round(15 * (1 - progress))
  const javeLat = 3.3702, javeLng = -76.5340

  return (
    <div style={{ background: 'linear-gradient(135deg, #002855, #1a5eb8)', borderRadius: '16px', padding: '16px', color: '#fff' }}>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: '4px' }}>TIEMPO ESTIMADO DE LLEGADA</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '36px', fontWeight: '800' }}>
          {remainingMinutes}
        </span>
        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>min</span>
      </div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
        Progreso: {Math.round(progress * 100)}% • {Math.round((progress) * 15)} min transcurridos
      </div>
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: '#C8973A', width: `${progress * 100}%`, transition: 'width 0.3s' }} />
      </div>
      <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
        📡 GPS: {lat?.toFixed(4)}, {lng?.toFixed(4)}
      </div>
    </div>
  )
}

export default function IoT() {
  const { user } = useAuth()
  const [activeRide, setActiveRide] = useState<Ride | null>(null)
  const [myRequests, setMyRequests] = useState<Ride[]>([])
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'tracking' | 'info'>('tracking')

  const simData = useSimulatedLocation(selectedRide)
  const simPos = simData?.pos || null
  const progress = simData?.progress || 0

  useEffect(() => {
    if (!user) return

    // Mi viaje activo como conductor
    supabase.from('rides').select('*').eq('driver_id', user.id).eq('status', 'active')
      .maybeSingle().then(({ data }: { data: unknown }) => { if (data) setActiveRide(data as Ride) })
    // Viajes donde tengo cupo aceptado
    supabase.from('ride_requests')
      .select('rides(*)')
      .eq('passenger_id', user.id)
      .eq('status', 'accepted')
      .then(({ data }: { data: unknown[] | null }) => {
        const rides = (data || []).map((r: unknown) => (r as { rides: Ride | null }).rides).filter(Boolean) as Ride[]
        setMyRequests(rides)
        if (rides.length > 0) setSelectedRide(rides[0])
        setLoading(false)
      })
  }, [user])

  const displayRide = selectedRide || activeRide

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #001a3a, #002855)', padding: '16px 16px 20px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <span style={{ fontSize: '22px' }}>📡</span>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: '800' }}>Seguimiento IoT</h1>
          <span style={{ marginLeft: 'auto', background: 'rgba(56,161,105,0.2)', border: '1px solid #38a169', color: '#68d391', fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>
            ● EN VIVO
          </span>
        </div>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginLeft: '32px' }}>
          Ubicación GPS en tiempo real de tu viaje
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
        {(['tracking', 'info'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '12px', border: 'none', cursor: 'pointer',
            fontFamily: 'Instrument Sans, sans-serif', fontSize: '13px', fontWeight: '600',
            background: tab === t ? '#fff' : 'transparent',
            color: tab === t ? '#002855' : '#9ca3af',
            borderBottom: tab === t ? '2px solid #002855' : '2px solid transparent',
            transition: 'all 0.15s'
          }}>
            {t === 'tracking' ? '🗺️ Mapa en vivo' : 'ℹ️ Info del viaje'}
          </button>
        ))}
      </div>

      <div className="page-content" style={{ padding: '16px', paddingBottom: '96px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="spinner" style={{ borderTopColor: '#002855', borderColor: '#e5e7eb', margin: '0 auto' }} />
          </div>
        ) : !displayRide ? (
          <NoRideState />
        ) : tab === 'tracking' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} className="fade-in">
            {/* Ride selector si hay varios */}
            {myRequests.length > 1 && (
              <div>
                <p style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600', marginBottom: '8px' }}>TUS VIAJES ACTIVOS</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {myRequests.map(r => (
                    <button key={r.id} onClick={() => setSelectedRide(r)} style={{
                      padding: '10px 14px', borderRadius: '10px', border: `1.5px solid ${selectedRide?.id === r.id ? '#002855' : '#e5e7eb'}`,
                      background: selectedRide?.id === r.id ? '#f0f4ff' : '#fff',
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'Instrument Sans, sans-serif',
                      fontSize: '13px', fontWeight: '600', color: '#002855'
                    }}>
                      🚗 {r.origin} → {r.destination}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mapa */}
            <MapView
              lat={simPos?.lat ?? 3.3702}
              lng={simPos?.lng ?? -76.5340}
              origin={displayRide.origin}
              destination={displayRide.destination}
            />

            {/* ETA */}
            <ETACard progress={progress} lat={simPos?.lat ?? null} lng={simPos?.lng ?? null} />

            {/* Cupos */}
            <SeatsIndicator available={displayRide.seats_available} total={displayRide.seats_total} />

            {/* IoT explanation chip */}
            <div style={{ background: '#f0f9ff', borderRadius: '12px', padding: '12px 14px', border: '1px solid #bae6fd', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>💡</span>
              <p style={{ fontSize: '12px', color: '#0369a1', lineHeight: 1.5 }}>
                <strong>Cómo funciona:</strong> El celular del conductor actúa como nodo IoT —
                reporta su ubicación GPS vía 4G/5G a la nube. Los pasajeros reciben actualizaciones
                en tiempo real sin intervención humana.
              </p>
            </div>
          </div>
        ) : (
          <IotInfoTab ride={displayRide} />
        )}
      </div>
    </div>
  )
}

function IotInfoTab({ ride }: { ride: Ride }) {
  const dt = new Date(ride.departure_time)
  const items = [
    { icon: '📍', label: 'Origen', value: ride.origin },
    { icon: '🏁', label: 'Destino', value: ride.destination },
    { icon: '🕐', label: 'Salida', value: dt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) },
    { icon: '💺', label: 'Cupos', value: `${ride.seats_available} disponibles de ${ride.seats_total}` },
    { icon: '💰', label: 'Precio', value: `$${ride.price.toLocaleString()} por cupo` },
    { icon: '🚘', label: 'Vehículo', value: ride.vehicle },
  ]

  const techs = [
    { icon: '📡', name: 'GPS / Geolocalización', desc: 'Posición del conductor en tiempo real via API del celular' },
    { icon: '☁️', name: 'Computación en nube', desc: 'Supabase almacena y distribuye los datos del viaje' },
    { icon: '📶', name: 'Comunicación 4G/5G', desc: 'Canal de transmisión entre conductor y pasajeros' },
    { icon: '📱', name: 'Celular como nodo IoT', desc: 'El smartphone es sensor (GPS) y actuador (solicita cupo) al mismo tiempo' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} className="fade-in">
      <div style={{ background: '#fff', borderRadius: '16px', border: '1.5px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ background: '#002855', padding: '12px 16px' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: '700' }}>DETALLES DEL VIAJE</p>
        </div>
        {items.map(({ icon, label, value }) => (
          <div key={label} style={{ display: 'flex', gap: '12px', padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>{icon}</span>
            <div>
              <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '600' }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="section-title">Tecnologías IoT en este viaje</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {techs.map(({ icon, name, desc }) => (
            <div key={name} style={{ background: '#fff', borderRadius: '12px', padding: '14px', border: '1.5px solid #e5e7eb', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                {icon}
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#002855', marginBottom: '2px' }}>{name}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.4 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #8a5a00, #C8973A)', borderRadius: '16px', padding: '16px', color: '#fff' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '800', fontSize: '14px', marginBottom: '6px' }}>
          🔮 Trabajo futuro: OBD-II
        </div>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
          Integrar un dispositivo OBD-II bajo el timón del conductor para reportar
          velocidad, frenadas y comportamiento de manejo — premiando conductores seguros
          con mejor ranking automáticamente.
        </p>
      </div>
    </div>
  )
}

function NoRideState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="empty-state">
        <span style={{ fontSize: '48px' }}>📡</span>
        <h3>Sin viaje activo</h3>
        <p style={{ fontSize: '13px' }}>Cuando tengas un cupo aceptado o un viaje publicado, verás el seguimiento IoT aquí.</p>
      </div>

      {/* Explicación IoT aunque no haya viaje */}
      <div style={{ background: '#f9fafb', borderRadius: '16px', padding: '16px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: '800', color: '#002855', marginBottom: '12px' }}>
          ¿Qué es IoT en JaveCupos?
        </h3>
        <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, marginBottom: '12px' }}>
          El Internet de las Cosas (IoT) conecta el celular del conductor como un nodo inteligente:
          reporta su posición GPS, los cupos disponibles y el estado del viaje —
          todo en tiempo real para los pasajeros dentro del campus.
        </p>
        {[
          ['🔒', 'Seguridad y trazabilidad', 'Registro real de quién conduce y quiénes van adentro'],
          ['🌿', 'Menos carros, mejor coordinación', 'Evita que varios carros salgan casi vacíos a la misma zona'],
          ['⚠️', 'Limitación: depende de señal', 'Sin conexión 4G/5G, el sistema no puede actualizar posición'],
        ].map(([ico, title, desc]) => (
          <div key={title as string} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{ico}</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#002855' }}>{title}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}