import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import Landing from '@/pages/Landing'
import Home from '@/pages/Home'
import Reports from '@/pages/Reports'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:40, height:40, border:'3px solid #e6f4ed', borderTop:'3px solid #2d7a4a', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 12px'}}></div>
        <p style={{color:'#3d8b5a', fontSize:14}}>Carregando...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/app" replace /> : <Landing />} />
      <Route path="/app" element={user ? <Home /> : <Navigate to="/" replace />} />
      <Route path="/relatorios" element={user ? <Reports /> : <Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}