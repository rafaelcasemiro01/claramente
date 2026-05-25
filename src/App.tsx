// src/App.tsx
// ─────────────────────────────────────────────────────────────────────
// Roteamento + loader inicial + onboarding gate.
// Se o usuário estiver logado mas NÃO completou o onboarding,
// é redirecionado para /onboarding antes de acessar o app.
// ─────────────────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import Landing from '@/pages/Landing'
import Home from '@/pages/Home'
import Reports from '@/pages/Reports'
import Profile from '@/pages/Profile'
import ResetPassword from '@/pages/ResetPassword'
import Onboarding from '@/pages/Onboarding'
import { ClaramenteLogo } from '@/components/Logo'

/** Decide se o usuário deve completar o onboarding. */
function needsOnboarding(profile: unknown): boolean {
  const p = profile as { onboarding_completed?: boolean } | null | undefined
  // Só redireciona se a coluna existir E for explicitamente false.
  // Se vier undefined (coluna não criada ainda), não redireciona — evita prender o user.
  return p?.onboarding_completed === false
}

function AppRoutes() {
  const { user, profile, loading } = useAuth() as ReturnType<typeof useAuth> & { profile: unknown }

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

  const mustOnboard = !!user && needsOnboarding(profile)

  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPassword/>}/>
      <Route path="/" element={
        user
          ? <Navigate to={mustOnboard ? '/onboarding' : '/app'} replace/>
          : <Landing/>
      }/>
      <Route path="/onboarding" element={
        !user
          ? <Navigate to="/" replace/>
          : (mustOnboard ? <Onboarding/> : <Navigate to="/app" replace/>)
      }/>
      <Route path="/app" element={
        !user
          ? <Navigate to="/" replace/>
          : (mustOnboard ? <Navigate to="/onboarding" replace/> : <Home/>)
      }/>
      <Route path="/relatorios" element={
        !user
          ? <Navigate to="/" replace/>
          : (mustOnboard ? <Navigate to="/onboarding" replace/> : <Reports/>)
      }/>
      <Route path="/perfil" element={
        !user
          ? <Navigate to="/" replace/>
          : (mustOnboard ? <Navigate to="/onboarding" replace/> : <Profile/>)
      }/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
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
