// src/App.tsx
// ─────────────────────────────────────────────────────────────────────
// Roteamento + loader inicial. Loader retematizado para o cream warm.
// Nenhuma mudança na lógica de rotas.
// ─────────────────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import Landing from '@/pages/Landing'
import Home from '@/pages/Home'
import Reports from '@/pages/Reports'
import Profile from '@/pages/Profile'
import ResetPassword from '@/pages/ResetPassword'
import { ClaramenteLogo } from '@/components/Logo'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#faf6f0',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ filter: 'drop-shadow(0 8px 24px rgba(196,131,106,0.4))', marginBottom: 22 }}>
          <ClaramenteLogo size={56} mode="light" breathing/>
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          border: '2px solid rgba(196,131,106,0.18)',
          borderTopColor: '#c4836a',
          animation: 'spinSoft 1s linear infinite',
          margin: '0 auto 12px',
        }}/>
        <p style={{ color: '#8a7a6e', fontSize: 13, fontStyle: 'italic' }}>Um instante…</p>
      </div>
      <style>{`@keyframes spinSoft { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPassword/>}/>
      <Route path="/"           element={user ? <Navigate to="/app" replace/>  : <Landing/>}/>
      <Route path="/app"        element={user ? <Home/>     : <Navigate to="/" replace/>}/>
      <Route path="/relatorios" element={user ? <Reports/>  : <Navigate to="/" replace/>}/>
      <Route path="/perfil"     element={user ? <Profile/>  : <Navigate to="/" replace/>}/>
      <Route path="*"           element={<Navigate to="/" replace/>}/>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes/>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
