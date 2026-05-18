import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

type Mode = 'login' | 'signup' | 'forgot'

interface PasswordRule {
  label: string
  test: (p: string) => boolean
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'Mínimo 8 caracteres', test: p => p.length >= 8 },
  { label: 'Uma letra maiúscula (A-Z)', test: p => /[A-Z]/.test(p) },
  { label: 'Um número (0-9)', test: p => /[0-9]/.test(p) },
  { label: 'Um caractere especial (!@#$%&*)', test: p => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
]

function passwordStrength(p: string): { score: number; label: string; color: string } {
  const passed = PASSWORD_RULES.filter(r => r.test(p)).length
  if (passed <= 1) return { score: 1, label: 'Muito fraca', color: '#EF4444' }
  if (passed === 2) return { score: 2, label: 'Fraca', color: '#F59E0B' }
  if (passed === 3) return { score: 3, label: 'Boa', color: '#8B5CF6' }
  return { score: 4, label: 'Forte ✓', color: '#22C55E' }
}

function CrystalLogo({ size = 60 }: { size?: number }) {
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

export default function Landing() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRules, setShowRules] = useState(false)

  function switchMode(m: Mode) {
    setMode(m); setError(''); setSuccess(''); setPassword(''); setShowRules(false)
  }

  const strength = password.length > 0 ? passwordStrength(password) : null

  async function handleSubmit() {
    setError(''); setSuccess(''); setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError('E-mail ou senha incorretos.')

    } else if (mode === 'signup') {
      if (!name.trim()) { setError('Informe seu nome.'); setLoading(false); return }

      // Validar senha com todas as regras
      const failedRules = PASSWORD_RULES.filter(r => !r.test(password))
      if (failedRules.length > 0) {
        setError(`Senha inválida: ${failedRules[0].label}.`)
        setLoading(false); return
      }

      const { error } = await signUp(email, password, name)
      if (error) {
        const msg = (error as { message?: string })?.message || ''
        if (msg.includes('already registered') || msg.includes('already exists')) {
          setError('Este e-mail já está cadastrado. Tente fazer login.')
        } else {
          setError('Erro ao criar conta. Tente novamente.')
        }
      } else {
        // Volta para login com mensagem de sucesso
        setSuccess('Conta criada com sucesso! Faça login para entrar.')
        setName('')
        setPassword('')
        setMode('login')
      }

    } else if (mode === 'forgot') {
      if (!email.trim()) { setError('Informe seu e-mail.'); setLoading(false); return }
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) {
        setError('Erro ao enviar e-mail. Verifique o endereço.')
      } else {
        setSuccess('Link enviado! Verifique sua caixa de entrada e spam.')
      }
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
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #1E1840 inset !important;
          -webkit-text-fill-color: #E9E4FF !important;
        }
        @media (max-width: 480px) {
          .land-card { padding: 20px 16px !important; }
          .land-title { font-size: 32px !important; }
        }
      `}</style>

      <div style={{ position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '80vw', maxWidth: 500, height: '60vh', borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <header style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
        <svg width="24" height="24" viewBox="0 0 56 56" fill="none">
          <path d="M28 4L50 18V38L28 52L6 38V18Z" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinejoin="round"/>
          <circle cx="28" cy="30" r="2.5" fill="rgba(255,255,255,0.5)"/>
        </svg>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>Claramente</span>
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px 40px', position: 'relative', zIndex: 1 }}>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 14 }}>
            <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)' }} />
            <CrystalLogo size={56} />
          </div>
          <h1 className="land-title" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 38, color: 'white', letterSpacing: -1, lineHeight: 1.1, marginBottom: 8 }}>
            Claramente
          </h1>
          <p style={{ fontSize: 14, color: '#6B6480', lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>
            Seu espaço sagrado de introspecção e autoconhecimento
          </p>
        </div>

        <div className="land-card" style={{ width: '100%', maxWidth: 420, background: '#13102A', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}>

          {mode !== 'forgot' && (
            <div style={{ display: 'flex', background: '#0D0B1A', padding: '6px', gap: 4 }}>
              {(['login', 'signup'] as Mode[]).map(m => (
                <button key={m} onClick={() => switchMode(m)} style={{
                  flex: 1, padding: '11px 0', borderRadius: 14, border: 'none',
                  cursor: 'pointer', fontSize: 14, fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                  background: mode === m ? '#8B5CF6' : 'transparent',
                  color: mode === m ? 'white' : '#6B6480',
                  boxShadow: mode === m ? '0 4px 12px rgba(139,92,246,0.4)' : 'none',
                }}>
                  {m === 'login' ? 'Entrar' : 'Criar conta'}
                </button>
              ))}
            </div>
          )}

          <div style={{ padding: '24px 20px 20px' }}>

            {mode === 'forgot' && (
              <div style={{ marginBottom: 20 }}>
                <button onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6480', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                  </svg>
                  Voltar ao login
                </button>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: 'white', marginBottom: 6 }}>Recuperar senha</h2>
                <p style={{ fontSize: 13, color: '#6B6480', lineHeight: 1.6 }}>Enviaremos um link para criar uma nova senha.</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {mode === 'signup' && (
                <div>
                  <label style={{ fontSize: 11, color: '#6B6480', display: 'block', marginBottom: 8, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase' }}>Nome</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Como você quer ser chamado?" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.background = '#231D4F' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.15)'; e.target.style.background = '#1E1840' }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: 11, color: '#6B6480', display: 'block', marginBottom: 8, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase' }}>E-mail</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.background = '#231D4F' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.15)'; e.target.style.background = '#1E1840' }}
                />
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={{ fontSize: 11, color: '#6B6480', fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase' }}>Senha</label>
                    {mode === 'login' && (
                      <button onClick={() => switchMode('forgot')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#8B5CF6', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <input type="password" value={password}
                    onChange={e => { setPassword(e.target.value); if (mode === 'signup') setShowRules(true) }}
                    onFocus={() => { if (mode === 'signup') setShowRules(true) }}
                    placeholder={mode === 'signup' ? 'Crie uma senha forte' : '••••••••'}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()} style={inputStyle}
                    onFocusCapture={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.background = '#231D4F' }}
                    onBlurCapture={e => { e.target.style.borderColor = 'rgba(139,92,246,0.15)'; e.target.style.background = '#1E1840' }}
                  />

                  {/* Regras de senha — aparece no signup */}
                  {mode === 'signup' && showRules && (
                    <div style={{ marginTop: 10, background: 'rgba(139,92,246,0.06)', borderRadius: 12, padding: '12px 14px', border: '0.5px solid rgba(139,92,246,0.15)' }}>
                      {/* Barra de força */}
                      {password.length > 0 && strength && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, transition: 'background 0.3s', background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.08)' }} />
                            ))}
                          </div>
                          <span style={{ fontSize: 11, color: strength.color }}>{strength.label}</span>
                        </div>
                      )}
                      {/* Checklist */}
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
              )}

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#FCA5A5', lineHeight: 1.5 }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#86EFAC', lineHeight: 1.5 }}>
                  {success}
                </div>
              )}

              <button onClick={handleSubmit} disabled={loading} style={{
                width: '100%', padding: '15px', borderRadius: 14, border: 'none', marginTop: 4,
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? '#2D1B69' : '#8B5CF6',
                color: 'white', fontSize: 15, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(139,92,246,0.4)',
              }}>
                {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar link de recuperação'}
              </button>

              {mode === 'signup' && (
                <p style={{ fontSize: 11, color: '#4A4268', textAlign: 'center', lineHeight: 1.6 }}>
                  Ao criar conta você concorda com o uso responsável dos seus dados conforme a LGPD.
                </p>
              )}
            </div>
          </div>
        </div>

        <p style={{ marginTop: 16, fontSize: 12, color: '#4A4268', textAlign: 'center' }}>
          Não substitui acompanhamento psicológico profissional.
        </p>
      </div>
    </div>
  )
}