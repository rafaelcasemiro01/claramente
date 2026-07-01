// src/App.tsx
// ─────────────────────────────────────────────────────────────────────
// Roteamento + loader inicial + onboarding gate.
// GUEST-FIRST: visitantes entram direto no /app (chat) sem login.
// A porta "/" leva o visitante ao app; o login clássico continua em "/entrar".
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

      {/* Login clássico continua acessível aqui. */}
      <Route path="/entrar" element={
        user ? <Navigate to={mustOnboard ? '/onboarding' : '/app'} replace/> : <Landing/>
      }/>

      {/* Porta de entrada: visitante vai direto ao app (guest-first). */}
      <Route path="/" element={
        user
          ? <Navigate to={mustOnboard ? '/onboarding' : '/app'} replace/>
          : <Navigate to="/app" replace/>
      }/>

      <Route path="/onboarding" element={
        !user
          ? <Navigate to="/entrar" replace/>
          : (mustOnboard ? <Onboarding/> : <Navigate to="/app" replace/>)
      }/>

      {/* Chat: acessível a visitante E a usuário logado. */}
      <Route path="/app" element={
        mustOnboard ? <Navigate to="/onboarding" replace/> : <Home/>
      }/>

      {/* Relatórios e Perfil continuam exigindo conta. */}
      <Route path="/relatorios" element={
        !user
          ? <Navigate to="/app" replace/>
          : (mustOnboard ? <Navigate to="/onboarding" replace/> : <Reports/>)
      }/>
      <Route path="/perfil" element={
        !user
          ? <Navigate to="/app" replace/>
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
