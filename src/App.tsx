import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './AuthContext'
import Welcome from './pages/Welcome'
import Home from './pages/Home'
import Buscar from './pages/Buscar'
import Publicar from './pages/Publicar'
import ViajeDetalle from './pages/ViajeDetalle'
import Perfil from './pages/Perfil'

function BottomNav() {
  const { pathname } = useLocation()

  const items = [
    {
      to: '/home', label: 'Inicio',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#002855' : 'none'} stroke={active ? '#002855' : '#9ca3af'} strokeWidth="2">
          <path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/>
        </svg>
      )
    },
    {
      to: '/buscar', label: 'Buscar',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#002855' : '#9ca3af'} strokeWidth={active ? 2.5 : 2}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      )
    },
    {
      to: '/publicar', label: 'Publicar',
      icon: (_active: boolean) => (
        <div style={{
          width: '44px', height: '44px', borderRadius: '14px',
          background: 'linear-gradient(135deg, #C8973A, #e0b055)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(200,151,58,0.4)',
          marginBottom: '2px', marginTop: '-12px'
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </div>
      )
    },
    {
      to: '/perfil', label: 'Perfil',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#002855' : 'none'} stroke={active ? '#002855' : '#9ca3af'} strokeWidth="2">
          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      )
    },
  ]

  return (
    <nav className="bottom-nav">
      {items.map(({ to, label, icon }) => {
        const active = pathname === to || (to !== '/home' && pathname.startsWith(to))
        return (
          <NavLink key={to} to={to} className={`nav-item${active ? ' active' : ''}`}>
            {icon(active)}
            <span style={{ fontSize: '10px', fontWeight: active ? '700' : '500' }}>{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{
      minHeight: '100svh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #001a3a, #002855)'
    }}>
      <div style={{
        fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: '800',
        color: '#fff', marginBottom: '24px'
      }}>
        Jave<span style={{ color: '#C8973A' }}>Cupos</span>
      </div>
      <div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#C8973A', width: '32px', height: '32px' }} />
    </div>
  )

  if (!user) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppShell() {
  const { pathname } = useLocation()
  const showNav = ['/home', '/buscar', '/publicar', '/perfil'].some(p => pathname === p || pathname.startsWith('/viaje'))

  return (
    <div className="shell">
      <div className="shell-inner">
        <div className="page-content" style={{ flex: 1, paddingBottom: showNav ? '72px' : 0 }}>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/home" element={<AuthGuard><Home /></AuthGuard>} />
            <Route path="/buscar" element={<AuthGuard><Buscar /></AuthGuard>} />
            <Route path="/publicar" element={<AuthGuard><Publicar /></AuthGuard>} />
            <Route path="/viaje/:id" element={<AuthGuard><ViajeDetalle /></AuthGuard>} />
            <Route path="/perfil" element={<AuthGuard><Perfil /></AuthGuard>} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
        {showNav && <BottomNav />}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontFamily: 'Instrument Sans, sans-serif',
              borderRadius: '12px',
            }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
