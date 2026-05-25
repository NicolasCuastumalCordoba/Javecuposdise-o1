import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { toast } from 'sonner'

export default function ResetPassword() {
  const nav = useNavigate()
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // supabase-js v2 procesa automáticamente el hash con el token
    // Solo necesitamos esperar a que la sesión esté disponible
    const hash = window.location.hash
    if (!hash.includes('access_token')) {
      setError('Accede a esta página desde el enlace que llegó a tu correo.')
      return
    }

    // Escuchar el evento PASSWORD_RECOVERY que dispara supabase automáticamente
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setReady(true)
      } else if (event === 'SIGNED_IN' && session) {
        // También funciona si ya hay sesión activa con token de recovery
        setReady(true)
      }
    })

    // Fallback: intentar getSession directamente
    setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setReady(true)
        else if (!ready) setError('El enlace expiró o ya fue usado. Solicita uno nuevo.')
      })
    }, 1500)

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPass !== confirm) { toast.error('Las contraseñas no coinciden'); return }
    if (newPass.length < 6) { toast.error('Mínimo 6 caracteres'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) {
      toast.error('No se pudo actualizar', { description: error.message })
    } else {
      toast.success('¡Contraseña actualizada! 🔐')
      setTimeout(() => nav('/home'), 1500)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100svh',
      background: 'linear-gradient(160deg, #001a3a 0%, #002855 50%, #1a5eb8 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      <div style={{
        width: '100%', maxWidth: '400px', background: '#fff',
        borderRadius: '24px', padding: '32px 28px',
        boxShadow: '0 20px 60px rgba(0,26,58,0.4)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'linear-gradient(135deg, #C8973A, #e0b055)',
            borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            fontFamily: 'Syne, sans-serif', fontWeight: '800', fontSize: '22px', color: '#002855'
          }}>JC</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: '800', color: '#002855' }}>
            Nueva contraseña
          </h1>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
            Elige una contraseña segura para tu cuenta
          </p>
        </div>

        {error ? (
          <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
            <p style={{ fontSize: '14px', color: '#991b1b', fontWeight: '500' }}>{error}</p>
            <button className="btn btn-outline" onClick={() => nav('/')} style={{ marginTop: '14px', fontSize: '13px' }}>
              Volver al inicio
            </button>
          </div>
        ) : !ready ? (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <div className="spinner" style={{ borderTopColor: '#002855', borderColor: '#e5e7eb', margin: '0 auto 12px', width: '28px', height: '28px' }} />
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>Verificando enlace...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Nueva contraseña</label>
              <div className="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input className="input" type="password" placeholder="Mínimo 6 caracteres"
                  value={newPass} onChange={e => setNewPass(e.target.value)} minLength={6} required />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Confirmar contraseña</label>
              <div className="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/><rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input className="input" type="password" placeholder="Repite la contraseña"
                  value={confirm} onChange={e => setConfirm(e.target.value)} minLength={6} required />
              </div>
            </div>
            {confirm && newPass !== confirm && (
              <p style={{ fontSize: '12px', color: '#dc2626', marginBottom: '12px', marginTop: '-8px' }}>
                ⚠️ Las contraseñas no coinciden
              </p>
            )}
            <button className="btn btn-primary btn-full" type="submit"
              disabled={loading || newPass !== confirm}
              style={{ height: '48px', fontSize: '15px', marginTop: '4px' }}>
              {loading ? <span className="spinner" /> : '🔐 Actualizar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}