import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabase'
import { toast } from 'sonner'

const COMMON_ORIGINS = [
  'Javeriana Cali', 'Ciudad Jardín', 'Meléndez', 'Limonar',
  'Granada', 'San Fernando', 'El Peñón', 'Versalles',
  'Chipichape', 'Norte de Cali', 'Univalle'
]

export default function Publicar() {
  const { user, profile } = useAuth()
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    origin: '',
    destination: '',
    departure_time: '',
    seats_total: '3',
    price: '',
    vehicle: '',
    notes: '',
  })

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    const dt = new Date(form.departure_time)
    if (dt <= new Date()) {
      toast.error('La hora de salida debe ser en el futuro')
      return
    }

    setLoading(true)
    const { error } = await supabase.from('rides').insert({
      driver_id: user.id,
      origin: form.origin,
      destination: form.destination,
      departure_time: dt.toISOString(),
      seats_total: parseInt(form.seats_total),
      seats_available: parseInt(form.seats_total),
      price: parseFloat(form.price),
      vehicle: form.vehicle,
      notes: form.notes || null,
      status: 'active',
    })

    if (error) {
      toast.error('Error al publicar', { description: error.message })
    } else {
      toast.success('¡Viaje publicado! 🚗', { description: 'Los estudiantes ya pueden solicitar cupo.' })
      nav('/home')
    }
    setLoading(false)
  }

  // min datetime = now + 10 min
  const minDt = new Date(Date.now() + 10 * 60000).toISOString().slice(0, 16)

  if (profile && profile.role !== 'driver') {
    return (
      <div className="page-content" style={{ padding: '20px 16px 96px' }}>
        <div style={{ background: '#fff5f5', border: '1px solid #f5c2c7', borderRadius: '18px', padding: '20px', marginTop: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#991b1b' }}>Acceso restringido</h2>
          <p style={{ color: '#7f1d1d', marginTop: '12px' }}>
            Tu perfil está registrado como <strong>usuario</strong>. Solo los conductores pueden publicar viajes.
          </p>
          <p style={{ color: '#7f1d1d', marginTop: '8px' }}>
            Si quieres ofrecer viajes, regístrate como conductor o actualiza tu perfil.
          </p>
          <button className="btn btn-primary btn-full" onClick={() => nav('/perfil')} style={{ marginTop: '18px' }}>
            Ver mi perfil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ background: '#002855', padding: '16px 20px 20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button onClick={() => nav(-1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5m0 0 7 7m-7-7 7-7"/>
          </svg>
        </button>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: '800' }}>Publicar viaje</h1>
      </div>

      <div className="page-content" style={{ padding: '20px 16px 96px' }}>
        <form onSubmit={handleSubmit}>
          {/* Route section */}
          <div style={{ background: '#f9fafb', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
            <h2 className="section-title" style={{ fontSize: '14px', marginBottom: '14px' }}>📍 Ruta</h2>

            <div className="input-group">
              <label className="input-label">Punto de salida</label>
              <select className="input" value={form.origin} onChange={e => set('origin', e.target.value)} required
                style={{ appearance: 'none' }}>
                <option value="">¿Desde dónde sales?</option>
                {COMMON_ORIGINS.map(o => <option key={o} value={o}>{o}</option>)}
                <option value="Otro">Otro (escribe abajo)</option>
              </select>
            </div>
            {form.origin === 'Otro' && (
              <div className="input-group">
                <label className="input-label">Especifica el origen</label>
                <input className="input" type="text" placeholder="Barrio o sector" required
                  onChange={e => set('origin', e.target.value)} />
              </div>
            )}

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Destino</label>
              <select className="input" value={form.destination} onChange={e => set('destination', e.target.value)} required
                style={{ appearance: 'none' }}>
                <option value="">¿A dónde vas?</option>
                {COMMON_ORIGINS.filter(o => o !== form.origin).map(o => <option key={o} value={o}>{o}</option>)}
                <option value="Otro">Otro (escribe abajo)</option>
              </select>
            </div>
            {form.destination === 'Otro' && (
              <div className="input-group" style={{ marginBottom: 0, marginTop: '12px' }}>
                <label className="input-label">Especifica el destino</label>
                <input className="input" type="text" placeholder="Barrio o sector" required
                  onChange={e => set('destination', e.target.value)} />
              </div>
            )}
          </div>

          {/* Time & seats */}
          <div style={{ background: '#f9fafb', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
            <h2 className="section-title" style={{ fontSize: '14px', marginBottom: '14px' }}>🕐 Cuándo y cuántos</h2>

            <div className="input-group">
              <label className="input-label">Hora de salida</label>
              <input className="input" type="datetime-local" min={minDt}
                value={form.departure_time} onChange={e => set('departure_time', e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Cupos disponibles</label>
                <select className="input" value={form.seats_total} onChange={e => set('seats_total', e.target.value)}
                  style={{ appearance: 'none' }}>
                  {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} cupo{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Precio por cupo</label>
                <div className="input-icon">
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '14px', fontWeight: '600' }}>$</span>
                  <input className="input" type="number" placeholder="5000" min="0" step="500"
                    value={form.price} onChange={e => set('price', e.target.value)} required
                    style={{ paddingLeft: '28px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle & notes */}
          <div style={{ background: '#f9fafb', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
            <h2 className="section-title" style={{ fontSize: '14px', marginBottom: '14px' }}>🚘 Vehículo</h2>

            <div className="input-group">
              <label className="input-label">Descripción del carro</label>
              <input className="input" type="text" placeholder="Ej: Renault Sandero rojo, placa ABC-123"
                value={form.vehicle} onChange={e => set('vehicle', e.target.value)} required />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Notas adicionales (opcional)</label>
              <textarea className="input" placeholder="Ej: Salgo de la portería principal, acepto mascotas pequeñas..."
                value={form.notes} onChange={e => set('notes', e.target.value)}
                rows={3} style={{ resize: 'none' }} />
            </div>
          </div>

          {/* Preview */}
          {form.origin && form.destination && form.price && (
            <div style={{ background: 'linear-gradient(135deg, #002855, #1a5eb8)', borderRadius: '16px', padding: '16px', marginBottom: '20px', color: '#fff' }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', fontWeight: '600' }}>VISTA PREVIA</p>
              <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>
                {form.origin} → {form.destination}
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>
                {form.seats_total} cupos · ${parseFloat(form.price || '0').toLocaleString()} por cupo
              </div>
            </div>
          )}

          <button className="btn btn-gold btn-full" type="submit" disabled={loading}
            style={{ height: '52px', fontSize: '16px', borderRadius: '14px' }}>
            {loading ? <span className="spinner" /> : '🚗 Publicar viaje'}
          </button>
        </form>
      </div>
    </div>
  )
}
