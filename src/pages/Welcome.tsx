import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { toast } from 'sonner'
import { useAuth } from '../AuthContext'

export default function Welcome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)

  // Login state
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')

  // Register state
  const [rEmail, setREmail] = useState('')
  const [rPass, setRPass] = useState('')
  const [rName, setRName] = useState('')
  const [rCareer, setRCareer] = useState('')
  const [rSemester, setRSemester] = useState('1')
  const [rRole, setRRole] = useState<'user' | 'driver'>('user')

  const careers = [
    'Ingeniería de Sistemas y Computación',
    'Ingeniería Industrial',
    'Ingeniería Civil',
    'Ingeniería Electrónica',
    'Administración de Empresas',
    'Contaduría Pública',
    'Comunicación Social',
    'Derecho',
    'Medicina',
    'Psicología',
    'Arquitectura',
    'Diseño Industrial',
  ]

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) {
      toast.error('Credenciales incorrectas', { description: 'Verifica tu correo y contraseña.' })
      setLoading(false)
      return
    }
    setLoading(false)
    navigate('/home')
  }

  async function handleForgotPassword() {
    if (!email) {
      toast.error('Ingresa tu correo para recuperar la contraseña')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)

    if (error) {
      toast.error('No se pudo enviar el correo', { description: error.message })
    } else {
      toast.success('Revisa tu correo', { description: 'Te enviamos un link para restablecer tu contraseña.' })
    }
  }

  if (user) return <Navigate to="/home" replace />

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!rEmail.endsWith('@javerianacali.edu.co')) {
      toast.error('Solo correos Javeriana', { description: 'Usa tu correo @javerianacali.edu.co' })
      return
    }
    setLoading(true)
    const initials = rName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    const { error } = await supabase.auth.signUp({
      email: rEmail,
      password: rPass,
      options: {
        data: {
          full_name: rName,
          career: rCareer,
          semester: parseInt(rSemester),
          role: rRole,
          avatar_initials: initials,
        }
      }
    })
    if (error) {
      toast.error('Error al registrarse', { description: error.message })
    } else {
      toast.success('¡Cuenta creada!', { description: 'Revisa tu correo para confirmar.' })
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100svh', background: 'linear-gradient(160deg, #001a3a 0%, #002855 40%, #003875 70%, #1a5eb8 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '0' }}>
      {/* Top branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px 0', width: '100%', maxWidth: '430px' }}>
        {/* Logo area */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }} className="fade-in">
          <div style={{
            width: '80px', height: '80px', background: 'linear-gradient(135deg, #C8973A, #e0b055)',
            borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', boxShadow: '0 8px 32px rgba(200,151,58,0.4)',
            fontSize: '36px', fontWeight: '800', color: '#002855',
            fontFamily: 'Syne, sans-serif'
          }}>
            JC
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '32px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px', marginBottom: '8px' }}>
            Jave<span style={{ color: '#C8973A' }}>Cupos</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '15px', fontFamily: 'Instrument Sans, sans-serif' }}>
            Comparte viajes con la comunidad javeriana
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }} className="fade-in">
          {[['🚗', 'Viajes seguros'], ['🤝', 'Comunidad', ], ['💰', 'Ahorra plata']].map(([ico, lbl]) => (
            <div key={lbl} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', marginBottom: '4px' }}>{ico}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', fontWeight: '500' }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom sheet */}
      <div style={{
        width: '100%', maxWidth: '430px',
        background: '#fff', borderRadius: '28px 28px 0 0',
        padding: '12px 24px 40px',
        boxShadow: '0 -8px 40px rgba(0,26,58,0.35)'
      }} className="slide-up">
        <div style={{ width: '36px', height: '4px', background: '#e5e7eb', borderRadius: '2px', margin: '0 auto 24px' }} />

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '12px', padding: '4px', marginBottom: '24px' }}>
          {(['login', 'register'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                fontFamily: 'Instrument Sans, sans-serif', fontSize: '14px', fontWeight: '600',
                background: tab === t ? '#002855' : 'transparent',
                color: tab === t ? '#fff' : '#6b7280',
                transition: 'all 0.2s'
              }}
            >
              {t === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          ))}
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label className="input-label">Correo institucional</label>
              <div className="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>
                <input
                  className="input" type="email" placeholder="usuario@javerianacali.edu.co"
                  value={email} onChange={e => setEmail(e.target.value)} required
                />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Contraseña</label>
              <div className="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input
                  className="input" type="password" placeholder="••••••••"
                  value={pass} onChange={e => setPass(e.target.value)} required
                />
              </div>
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}
              style={{ marginTop: '4px', height: '48px', fontSize: '15px' }}>
              {loading ? <span className="spinner" /> : 'Entrar a JaveCupos'}
            </button>
            <button type="button" onClick={handleForgotPassword}
              style={{ marginTop: '10px', width: '100%', border: 'none', background: 'transparent', color: '#1a5eb8', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: '4px' }}>
            <div className="input-group">
              <label className="input-label">Nombre completo</label>
              <input className="input" type="text" placeholder="Tu nombre completo"
                value={rName} onChange={e => setRName(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">Correo institucional</label>
              <input className="input" type="email" placeholder="usuario@javerianacali.edu.co"
                value={rEmail} onChange={e => setREmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">Contraseña</label>
              <input className="input" type="password" placeholder="Mínimo 6 caracteres"
                value={rPass} onChange={e => setRPass(e.target.value)} minLength={6} required />
            </div>
            <div className="input-group">
              <label className="input-label">Carrera</label>
              <select className="input" value={rCareer} onChange={e => setRCareer(e.target.value)} required
                style={{ appearance: 'none' }}>
                <option value="">Selecciona tu carrera</option>
                {careers.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Semestre</label>
              <select className="input" value={rSemester} onChange={e => setRSemester(e.target.value)} required
                style={{ appearance: 'none' }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(s => (
                  <option key={s} value={s}>Semestre {s}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Tipo de cuenta</label>
              <select className="input" value={rRole} onChange={e => setRRole(e.target.value as 'user' | 'driver')} required
                style={{ appearance: 'none' }}>
                <option value="user">Usuario (buscar viajes)</option>
                <option value="driver">Conductor (ofrecer viajes)</option>
              </select>
            </div>
            <button className="btn btn-gold btn-full" type="submit" disabled={loading}
              style={{ height: '48px', fontSize: '15px' }}>
              {loading ? <span className="spinner" /> : 'Crear cuenta'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#9ca3af' }}>
          Solo para la comunidad Javeriana Cali 🏫
        </p>
      </div>
    </div>
  )
}
