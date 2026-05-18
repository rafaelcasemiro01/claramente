import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

interface PasswordRule { label: string; test: (p: string) => boolean }

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'Mínimo 8 caracteres', test: p => p.length >= 8 },
  { label: 'Uma letra maiúscula (A-Z)', test: p => /[A-Z]/.test(p) },
  { label: 'Um número (0-9)', test: p => /[0-9]/.test(p) },
  { label: 'Um caractere especial (!@#$%&*)', test: p => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
]

function passwordStrength(p: string) {
  const passed = PASSWORD_RULES.filter(r => r.test(p)).length
  if (passed <= 1) return { score: 1, label: 'Muito fraca', color: '#EF4444' }
  if (passed === 2) return { score: 2, label: 'Fraca', color: '#F59E0B' }
  if (passed === 3) return { score: 3, label: 'Boa', color: '#8B5CF6' }
  return { score: 4, label: 'Forte ✓', color: '#22C55E' }
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    // Verificar se existe sessão de recuperação (token na URL)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionReady(true)
        setCheckingSession(false)
      }
    })

    // Checar sessão existente
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true)
      }
      setCheckingSession(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleReset() {
    setError('')
    const failedRules = PASSWORD_RULES.filter(r => !r.test(password))
    if (failedRules.length > 0) { setError(`Senha inválida: ${failedRules[0].label}.`); return }
    if (password !== confirm) { setError('As senhas não coincidem.'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError('Erro ao redefinir. O link pode ter expirado — solicite um novo.')
    } else {
      setSuccess(true)
      await supabase.auth.signOut()
      setTimeout(() => navigate('/'), 3000)
    }
    setLoading(false)
  }

  const strength = password.length > 0 ? passwordStrength(password) : null

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 18px', borderRadius: 14, fontSize: 15,
    color: '#E9E4FF', background: '#1E1840',
    border: '1px solid rgba(139,92,246,0.15)', outline: 'none',
    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#0D0B1A', fontFamily: "'DM Sans', sans-serif", alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: #4A4268 !important; }
      `}</style>

      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 24, position: 'relative', zIndex: 1 }}>
        <svg width="52" height="52" viewBox="0 0 56 56" fill="none" style={{ marginBottom: 12 }}>
          <path d="M28 4L50 18V38L28 52L6 38V18Z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M28 4L6 18H50Z" fill="rgba(255,255,255,0.3)"/>
          <line x1="6" y1="18" x2="28" y2="30" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2"/>
          <line x1="50" y1="18" x2="28" y2="30" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2"/>
          <circle cx="28" cy="30" r="3" fill="white"/>
        </svg>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: 'white', letterSpacing: -0.8, marginBottom: 8 }}>
          Nova senha
        </h1>
        <p style={{ fontSize: 14, color: '#6B6480' }}>Escolha uma senha segura para sua conta</p>
      </div>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Verificando sessão */}
        {checkingSession && (
          <div style={{ background: '#13102A', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 20, padding: '32px', textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, border: '2px solid rgba(139,92,246,0.2)', borderTop: '2px solid #8B5CF6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: '#6B6480', fontSize: 14 }}>Verificando link...</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Link inválido */}
        {!checkingSession && !sessionReady && (
          <div style={{ background: '#13102A', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 20, padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <p style={{ color: '#FCA5A5', fontSize: 15, marginBottom: 8, fontWeight: 500 }}>Link inválido ou expirado</p>
            <p style={{ color: '#6B6480', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
              Este link de recuperação expirou ou já foi usado. Solicite um novo.
            </p>
            <button onClick={() => navigate('/')} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: '#8B5CF6', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              Solicitar novo link
            </button>
          </div>
        )}

        {/* Sucesso */}
        {success && (
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔮</div>
            <p style={{ fontSize: 16, color: '#86EFAC', marginBottom: 6, fontWeight: 500 }}>Senha redefinida!</p>
            <p style={{ fontSize: 13, color: '#6B6480' }}>Redirecionando para o login...</p>
          </div>
        )}

        {/* Formulário */}
        {!checkingSession && sessionReady && !success && (
          <div style={{ background: '#13102A', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 20, padding: '28px 24px', boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div>
                <label style={{ fontSize: 11, color: '#6B6480', display: 'block', marginBottom: 8, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase' }}>Nova senha</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Crie uma senha forte" style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.background = '#231D4F' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.15)'; e.target.style.background = '#1E1840' }}
                />

                {/* Checklist */}
                {password.length > 0 && (
                  <div style={{ marginTop: 10, background: 'rgba(139,92,246,0.06)', borderRadius: 12, padding: '12px 14px', border: '0.5px solid rgba(139,92,246,0.15)' }}>
                    {strength && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, transition: 'background 0.3s', background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.08)' }} />
                          ))}
                        </div>
                        <span style={{ fontSize: 11, color: strength.color }}>{strength.label}</span>
                      </div>
                    )}
                    {PASSWORD_RULES.map(rule => {
                      const ok = rule.test(password)
                      return (
                        <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                          <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, background: ok ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${ok ? '#22C55E' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                            {ok && <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          <span style={{ fontSize: 11, color: ok ? '#86EFAC' : '#6B6480', transition: 'color 0.2s' }}>{rule.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#6B6480', display: 'block', marginBottom: 8, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase' }}>Confirmar nova senha</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Repita a nova senha"
                  onKeyDown={e => e.key === 'Enter' && handleReset()} style={{
                    ...inputStyle,
                    borderColor: confirm.length > 0 ? (confirm === password ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)') : 'rgba(139,92,246,0.15)',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.background = '#231D4F' }}
                  onBlur={e => { e.target.style.borderColor = confirm.length > 0 ? (confirm === password ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)') : 'rgba(139,92,246,0.15)'; e.target.style.background = '#1E1840' }}
                />
                {confirm.length > 0 && (
                  <p style={{ fontSize: 11, color: confirm === password ? '#86EFAC' : '#FCA5A5', marginTop: 5, transition: 'color 0.2s' }}>
                    {confirm === password ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
                  </p>
                )}
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#FCA5A5', lineHeight: 1.5 }}>
                  {error}
                </div>
              )}

              <button onClick={handleReset} disabled={loading} style={{
                width: '100%', padding: '15px', borderRadius: 14, border: 'none', marginTop: 4,
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? '#2D1B69' : '#8B5CF6',
                color: 'white', fontSize: 15, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(139,92,246,0.4)',
              }}>
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>

              <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6480', fontSize: 13, fontFamily: "'DM Sans', sans-serif", textAlign: 'center', padding: '4px' }}>
                ← Voltar ao login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}