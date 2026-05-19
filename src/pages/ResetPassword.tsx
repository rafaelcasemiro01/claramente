import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

const PW_RULES = [
  { label: 'Mínimo 8 caracteres',          test: (p: string) => p.length >= 8 },
  { label: 'Uma letra maiúscula',           test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Um número',                     test: (p: string) => /[0-9]/.test(p) },
  { label: 'Um caractere especial (!@#$%)', test: (p: string) => /[!@#$%^&*(),.?]/.test(p) },
]

function pwStrength(p: string) {
  const n = PW_RULES.filter(r => r.test(p)).length
  if (n <= 1) return { score: 1, label: 'Muito fraca', color: '#EF4444' }
  if (n === 2) return { score: 2, label: 'Fraca',      color: '#F59E0B' }
  if (n === 3) return { score: 3, label: 'Boa',        color: '#8B5CF6' }
  return              { score: 4, label: 'Forte',       color: '#22C55E' }
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [pw, setPw]       = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)
  const [ready, setReady]     = useState(false)
  const [checking, setChecking] = useState(true)

  const strength = pw.length > 0 ? pwStrength(pw) : null

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setReady(true); setChecking(false)
      }
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
      setChecking(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleReset() {
    setError('')
    const failed = PW_RULES.filter(r => !r.test(pw))
    if (failed.length > 0) { setError(`Senha inválida: ${failed[0].label}.`); return }
    if (pw !== confirm) { setError('As senhas não coincidem.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) setError('Erro ao redefinir. O link pode ter expirado.')
    else { setSuccess(true); await supabase.auth.signOut(); setTimeout(() => navigate('/'), 2500) }
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', height: 42, padding: '0 12px', borderRadius: 8,
    border: '1px solid #E2E2E2', background: '#FFFFFF', outline: 'none',
    fontSize: 14, fontWeight: 400, fontFamily: "'Inter',sans-serif",
    color: '#0F0F0F', transition: 'border-color 0.15s, box-shadow 0.15s',
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', fontFamily: "'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0;} body{-webkit-font-smoothing:antialiased;} @keyframes fIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ width: '100%', maxWidth: 400, animation: 'fIn 0.35s ease' }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F4F0FF', border: '1px solid #E2D9FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 56 56" fill="none">
              <path d="M28 4L50 18V38L28 52L6 38V18Z" fill="rgba(124,58,237,0.15)" stroke="#7C3AED" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M28 4L6 18H50Z" fill="rgba(124,58,237,0.3)"/>
              <line x1="6" y1="18" x2="28" y2="30" stroke="rgba(124,58,237,0.6)" strokeWidth="1.2"/>
              <line x1="50" y1="18" x2="28" y2="30" stroke="rgba(124,58,237,0.6)" strokeWidth="1.2"/>
              <circle cx="28" cy="30" r="3" fill="#7C3AED"/>
            </svg>
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#0F0F0F', letterSpacing: -0.4 }}>Claramente</span>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 14, padding: '28px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0F0F0F', marginBottom: 6, letterSpacing: -0.3 }}>Nova senha</h2>
          <p style={{ fontSize: 13, fontWeight: 400, color: '#6B6B6B', marginBottom: 24, lineHeight: 1.6 }}>Escolha uma senha segura para sua conta.</p>

          {checking && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#9B9B9B', fontSize: 13 }}>Verificando link...</div>
          )}

          {!checking && !ready && (
            <div style={{ padding: '16px', borderRadius: 8, background: '#FFF5F5', border: '1px solid #FED7D7', fontSize: 13, color: '#C53030', textAlign: 'center', marginBottom: 16 }}>
              Link inválido ou expirado.
              <button onClick={() => navigate('/')} style={{ display: 'block', margin: '10px auto 0', padding: '8px 20px', borderRadius: 8, border: 'none', background: '#7C3AED', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                Solicitar novo link
              </button>
            </div>
          )}

          {success && (
            <div style={{ padding: '16px', borderRadius: 8, background: '#F0FFF4', border: '1px solid #C6F6D5', fontSize: 13, color: '#276749', textAlign: 'center' }}>
              Senha redefinida! Redirecionando...
            </div>
          )}

          {!checking && ready && !success && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0F0F0F', marginBottom: 6 }}>Nova senha</label>
                <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Crie uma senha forte" style={inp}
                  onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = '#E2E2E2'; e.target.style.boxShadow = 'none' }}
                />
                {pw.length > 0 && strength && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                      {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength.score ? strength.color : '#E8E8E8' }} />)}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 500, color: strength.color }}>{strength.label}</span>
                  </div>
                )}
                {pw.length > 0 && (
                  <div style={{ marginTop: 8, padding: '10px', background: '#FAFAFA', borderRadius: 8, border: '1px solid #E8E8E8' }}>
                    {PW_RULES.map(r => {
                      const ok = r.test(pw)
                      return (
                        <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <div style={{ width: 14, height: 14, borderRadius: '50%', background: ok ? 'rgba(34,197,94,0.12)' : '#F4F4F5', border: `1px solid ${ok ? '#22C55E' : '#E2E2E2'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {ok && <svg width="7" height="7" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          <span style={{ fontSize: 11, color: ok ? '#22C55E' : '#9B9B9B' }}>{r.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0F0F0F', marginBottom: 6 }}>Confirmar senha</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReset()}
                  placeholder="Repita a nova senha"
                  style={{ ...inp, borderColor: confirm.length > 3 ? (confirm === pw ? '#22C55E' : '#EF4444') : '#E2E2E2' }}
                  onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)' }}
                  onBlur={e => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = confirm.length > 3 ? (confirm === pw ? '#22C55E' : '#EF4444') : '#E2E2E2' }}
                />
                {confirm.length > 3 && (
                  <p style={{ fontSize: 11, color: confirm === pw ? '#22C55E' : '#EF4444', marginTop: 4 }}>
                    {confirm === pw ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
                  </p>
                )}
              </div>

              {error && <div style={{ padding: '10px 12px', borderRadius: 8, background: '#FFF5F5', border: '1px solid #FED7D7', fontSize: 13, color: '#C53030' }}>{error}</div>}

              <button onClick={handleReset} disabled={loading} style={{ width: '100%', height: 42, borderRadius: 8, border: 'none', background: loading ? '#C4B5FD' : '#7C3AED', color: '#FFFFFF', fontSize: 14, fontWeight: 600, fontFamily: "'Inter',sans-serif", cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>

              <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9B9B9B', fontSize: 13, fontFamily: "'Inter',sans-serif", textAlign: 'center' }}>
                ← Voltar ao login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}