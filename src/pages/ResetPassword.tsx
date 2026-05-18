import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

function CrystalLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <path d="M28 4L50 18V38L28 52L6 38V18Z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M28 4L6 18H50Z" fill="rgba(255,255,255,0.3)"/>
      <line x1="6" y1="18" x2="28" y2="30" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2"/>
      <line x1="50" y1="18" x2="28" y2="30" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2"/>
      <circle cx="28" cy="30" r="3" fill="white"/>
    </svg>
  )
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase detecta o token de recuperação na URL automaticamente
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    // Verifica se já tem sessão de recovery ativa
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleReset() {
    setError('')
    if (!password.trim()) { setError('Digite a nova senha.'); return }
    if (password.length < 8) { setError('A senha deve ter no mínimo 8 caracteres.'); return }
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError('Erro ao redefinir senha. O link pode ter expirado. Solicite um novo.')
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/'), 3000)
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 18px', borderRadius: 14, fontSize: 15,
    color: '#E9E4FF', background: '#1E1840',
    border: '1px solid rgba(139,92,246,0.15)', outline: 'none',
    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#0D0B1A', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: #4A4268 !important; }
      `}</style>

      <div style={{ position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <header style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <svg width="26" height="26" viewBox="0 0 56 56" fill="none">
          <path d="M28 4L50 18V38L28 52L6 38V18Z" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinejoin="round"/>
          <circle cx="28" cy="30" r="2.5" fill="rgba(255,255,255,0.5)"/>
        </svg>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: 'rgba(255,255,255,0.6)' }}>Claramente</span>
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 24px 60px', position: 'relative', zIndex: 1 }}>

        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <CrystalLogo size={60} />
        </div>

        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: 'white', textAlign: 'center', marginBottom: 10, letterSpacing: -0.8 }}>
          Nova senha
        </h1>
        <p style={{ fontSize: 15, color: '#6B6480', textAlign: 'center', marginBottom: 36, maxWidth: 280, lineHeight: 1.6 }}>
          Escolha uma senha segura para sua conta
        </p>

        {success ? (
          <div style={{ width: '100%', maxWidth: 420, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔮</div>
            <p style={{ fontSize: 16, color: '#86EFAC', marginBottom: 8, fontWeight: 500 }}>Senha redefinida!</p>
            <p style={{ fontSize: 14, color: '#6B6480' }}>Redirecionando para o login...</p>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: 420, background: '#13102A', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 24, padding: '32px 24px', boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}>

            {!ready && (
              <div style={{ textAlign: 'center', padding: '12px 0 24px', color: '#6B6480', fontSize: 14 }}>
                Verificando link de recuperação...
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: '#6B6480', display: 'block', marginBottom: 8, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase' }}>Nova senha</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres" style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.background = '#231D4F' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.15)'; e.target.style.background = '#1E1840' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6B6480', display: 'block', marginBottom: 8, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase' }}>Confirmar senha</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Repita a nova senha"
                  onKeyDown={e => e.key === 'Enter' && handleReset()}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.background = '#231D4F' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.15)'; e.target.style.background = '#1E1840' }}
                />
              </div>

              {/* Indicador de força */}
              {password.length > 0 && (
                <div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2, transition: 'background 0.2s',
                        background: password.length >= i * 2
                          ? i <= 1 ? '#EF4444' : i <= 2 ? '#F59E0B' : i <= 3 ? '#8B5CF6' : '#22C55E'
                          : 'rgba(255,255,255,0.1)',
                      }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: '#6B6480' }}>
                    {password.length < 4 ? 'Muito curta' : password.length < 6 ? 'Fraca' : password.length < 8 ? 'Razoável' : 'Forte ✓'}
                  </p>
                </div>
              )}

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#FCA5A5', lineHeight: 1.5 }}>
                  {error}
                </div>
              )}

              <button onClick={handleReset} disabled={loading || !ready} style={{
                width: '100%', padding: '15px', borderRadius: 14, border: 'none',
                cursor: loading || !ready ? 'not-allowed' : 'pointer',
                background: loading || !ready ? '#2D1B69' : '#8B5CF6',
                color: 'white', fontSize: 15, fontWeight: 600, marginTop: 4,
                fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                boxShadow: loading || !ready ? 'none' : '0 8px 24px rgba(139,92,246,0.4)',
              }}>
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>

              <button onClick={() => navigate('/')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#6B6480', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                textAlign: 'center', padding: '4px',
              }}>
                ← Voltar ao login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}