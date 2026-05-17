import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import Landing from '@/pages/Landing'
import Home from '@/pages/Home'
import Reports from '@/pages/Reports'
import Profile from '@/pages/Profile'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D0B1A' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 36, height: 36,
          border: '2px solid rgba(139,92,246,0.2)',
          borderTop: '2px solid #8B5CF6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px',
        }} />
        <p style={{ color: '#6B6480', fontSize: 14, fontFamily: 'sans-serif' }}>
          Carregando...
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <Routes>
      <Route path="/"          element={user ? <Navigate to="/app" replace /> : <Landing />} />
      <Route path="/app"       element={user ? <Home />    : <Navigate to="/" replace />} />
      <Route path="/relatorios" element={user ? <Reports /> : <Navigate to="/" replace />} />
      <Route path="/perfil"    element={user ? <Profile /> : <Navigate to="/" replace />} />
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}