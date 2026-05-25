import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { toast } from 'sonner'

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const redirectTo = `${window.location.origin}/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) {
      toast.error('Error', { description: error.message })
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: '800', color: '#002855', marginBottom: '6px' }}>
          Recuperar contraseña
        </h2>
        {!sent ? (
          <>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '20px' }}>
              Escribe tu correo y te enviamos un enlace para restablecer tu contraseña.
            </p>
            <form onSubmit={handleSend}>
              <div className="input-group">
                <label className="input-label">Correo institucional</label>
                <div className="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>
                  <input className="input" type="email" placeholder="usuario@javerianacali.edu.co"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ height: '46px' }}>
                {loading ? <span className="spinner" /> : 'Enviar enlace'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📧</div>
            <p style={{ fontWeight: '700', fontSize: '15px', color: '#002855', marginBottom: '6px' }}>¡Correo enviado!</p>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '20px' }}>
              Revisa tu bandeja en <strong>{email}</strong> y haz clic en el enlace.
            </p>
            <button className="btn btn-outline btn-full" onClick={onClose}>Cerrar</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Welcome() {
  const nav = useNavigate()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)

  const [rEmail, setREmail] = useState('')
  const [rPass, setRPass] = useState('')
  const [rName, setRName] = useState('')
  const [rCareer, setRCareer] = useState('')
  const [rSemester, setRSemester] = useState('1')
  const [rRole, setRRole] = useState<'driver' | 'user'>('user')
  const [showRPass, setShowRPass] = useState(false)

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
    if (!email || !pass) {
      toast.error('Campos requeridos', { description: 'Por favor ingresa correo y contraseña.' })
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Credenciales inválidas', { description: 'El correo o contraseña son incorrectos.' })
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Correo no confirmado', { description: 'Revisa tu bandeja de entrada para confirmar tu correo.' })
      } else {
        toast.error('Error al iniciar sesión', { description: error.message })
      }
    } else {
      toast.success('¡Bienvenido!', { description: 'Ingresando a JaveCupos...' })
      // Navegar a Home después de login exitoso
      setTimeout(() => nav('/home'), 500)
    }
    setLoading(false)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    
    // Validar formato de correo
    if (!rEmail.endsWith('@javerianacali.edu.co') && !rEmail.endsWith('@uao.edu.co')) {
      toast.error('Solo correos institucionales', { description: 'Usa tu correo @javerianacali.edu.co o @uao.edu.co' })
      return
    }
    
    // Validar campos
    if (!rName || !rPass || !rCareer) {
      toast.error('Campos requeridos', { description: 'Por favor completa todos los campos.' })
      return
    }

    if (rPass.length < 6) {
      toast.error('Contraseña débil', { description: 'La contraseña debe tener al menos 6 caracteres.' })
      return
    }

    setLoading(true)
    const initials = rName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    
    const { data, error } = await supabase.auth.signUp({
      email: rEmail,
      password: rPass,
      options: {
        data: { 
          full_name: rName, 
          career: rCareer, 
          semester: parseInt(rSemester), 
          avatar_initials: initials 
        }
      }
    })
    
    if (error) {
      toast.error('Error al registrarse', { description: error.message })
      setLoading(false)
      return
    }

    if (data.user) {
      // Intentar crear el perfil
      try {
        await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: rName,
          email: rEmail,
          career: rCareer,
          semester: parseInt(rSemester),
          avatar_initials: initials,
          role: rRole,
          rating: 0,
          trips_count: 0
        })
      } catch (err) {
        console.log('Perfil creado por trigger o ya existe')
      }

      // Auto-login después de registro
      setTimeout(async () => {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: rEmail, password: rPass })
        if (signInError) {
          toast.error('Error al iniciar sesión', { description: signInError.message })
        } else {
          toast.success('¡Bienvenido!', { description: 'Ingresando a JaveCupos...' })
          setTimeout(() => nav('/home'), 500)
        }
      }, 1000)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100svh', background: 'linear-gradient(160deg, #001a3a 0%, #002855 40%, #003875 70%, #1a5eb8 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px 0', width: '100%', maxWidth: '430px' }}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }} className="fade-in">
          <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #C8973A, #e0b055)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 32px rgba(200,151,58,0.4)', fontSize: '36px', fontWeight: '800', color: '#002855', fontFamily: 'Syne, sans-serif' }}>
            JC
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '32px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px', marginBottom: '8px' }}>
            Jave<span style={{ color: '#C8973A' }}>Cupos</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '15px' }}>
            Comparte viajes con la comunidad javeriana
          </p>
        </div>
        <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }} className="fade-in">
          {[['🚗', 'Viajes seguros'], ['🤝', 'Comunidad'], ['💰', 'Ahorra plata']].map(([ico, lbl]) => (
            <div key={lbl} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', marginBottom: '4px' }}>{ico}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', fontWeight: '500' }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '430px', background: '#fff', borderRadius: '28px 28px 0 0', padding: '12px 24px 40px', boxShadow: '0 -8px 40px rgba(0,26,58,0.35)' }} className="slide-up">
        <div style={{ width: '36px', height: '4px', background: '#e5e7eb', borderRadius: '2px', margin: '0 auto 24px' }} />

        <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '12px', padding: '4px', marginBottom: '24px' }}>
          {(['login', 'register'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontFamily: 'Instrument Sans, sans-serif', fontSize: '14px', fontWeight: '600', background: tab === t ? '#002855' : 'transparent', color: tab === t ? '#fff' : '#6b7280', transition: 'all 0.2s' }}>
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
                <input className="input" type="email" placeholder="usuario@javerianacali.edu.co" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Contraseña</label>
              <div className="input-icon" style={{ position: 'relative' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input className="input" type={showPass ? "text" : "password"} placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} required />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}>
                  {showPass ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  )}
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'right', marginBottom: '16px', marginTop: '-8px' }}>
              <button type="button" onClick={() => setShowForgot(true)} style={{ background: 'none', border: 'none', color: '#1a5eb8', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Instrument Sans, sans-serif' }}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ height: '48px', fontSize: '15px' }}>
              {loading ? <span className="spinner" /> : 'Entrar a JaveCupos'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: '4px' }}>
            <div className="input-group">
              <label className="input-label">Nombre completo</label>
              <input className="input" type="text" placeholder="Tu nombre completo" value={rName} onChange={e => setRName(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">Correo institucional</label>
              <input className="input" type="email" placeholder="usuario@javerianacali.edu.co" value={rEmail} onChange={e => setREmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">Contraseña</label>
              <div className="input-icon" style={{ position: 'relative' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input className="input" type={showRPass ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={rPass} onChange={e => setRPass(e.target.value)} minLength={6} required />
                <button type="button" onClick={() => setShowRPass(!showRPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}>
                  {showRPass ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  )}
                </button>
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Carrera</label>
              <select className="input" value={rCareer} onChange={e => setRCareer(e.target.value)} required style={{ appearance: 'none' }}>
                <option value="">Selecciona tu carrera</option>
                {careers.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Semestre</label>
              <select className="input" value={rSemester} onChange={e => setRSemester(e.target.value)} required style={{ appearance: 'none' }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(s => <option key={s} value={s}>Semestre {s}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">¿Qué quieres hacer?</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setRRole('user')} style={{
                  flex: 1, padding: '12px', borderRadius: '10px', border: rRole === 'user' ? '2px solid #002855' : '1px solid #e5e7eb',
                  background: rRole === 'user' ? '#f0f7ff' : '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '13px',
                  color: rRole === 'user' ? '#002855' : '#6b7280', transition: 'all 0.2s'
                }}>
                  👤 Ser pasajero
                </button>
                <button type="button" onClick={() => setRRole('driver')} style={{
                  flex: 1, padding: '12px', borderRadius: '10px', border: rRole === 'driver' ? '2px solid #002855' : '1px solid #e5e7eb',
                  background: rRole === 'driver' ? '#f0f7ff' : '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '13px',
                  color: rRole === 'driver' ? '#002855' : '#6b7280', transition: 'all 0.2s'
                }}>
                  🚗 Ser conductor
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px', fontStyle: 'italic' }}>
                {rRole === 'driver' ? 'Puedes publicar viajes y también ser pasajero en otros.' : 'Puedes buscar y reservar viajes disponibles.'}
              </p>
            </div>
            <button className="btn btn-gold btn-full" type="submit" disabled={loading} style={{ height: '48px', fontSize: '15px' }}>
              {loading ? <span className="spinner" /> : 'Crear cuenta'}
            </button>
          </form>
        )}
        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#9ca3af' }}>
          Solo para la comunidad Javeriana Cali & UAO 🏫
        </p>
      </div>
    </div>
  )
}