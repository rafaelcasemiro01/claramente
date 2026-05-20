import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

const RULES = [
  { label: 'Mínimo 8 caracteres',          ok: (p: string) => p.length >= 8 },
  { label: 'Uma letra maiúscula',           ok: (p: string) => /[A-Z]/.test(p) },
  { label: 'Um número',                     ok: (p: string) => /[0-9]/.test(p) },
  { label: 'Um caractere especial (!@#$%)', ok: (p: string) => /[!@#$%^&*]/.test(p) },
]

function strength(p: string) {
  const n = RULES.filter(r => r.ok(p)).length
  const map = ['', 'Muito fraca', 'Fraca', 'Boa', 'Forte']
  const col  = ['#E8E8E8', '#EF4444', '#F59E0B', '#8B5CF6', '#22C55E']
  return { score: n, label: map[n] || '', color: col[n] || '#E8E8E8' }
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady]     = useState(false)
  const [checking, setChecking] = useState(true)
  const [pw, setPw]           = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)
  const [busy, setBusy]       = useState(false)
  const [pwFocus, setPwFocus] = useState(false)

  const st = strength(pw)

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
    const failed = RULES.find(r => !r.ok(pw))
    if (failed) { setError(`Senha inválida: ${failed.label}.`); return }
    if (pw !== confirm) { setError('As senhas não coincidem.'); return }
    setBusy(true)
    const { error: e } = await supabase.auth.updateUser({ password: pw })
    if (e) {
      setError('Erro ao redefinir. O link pode ter expirado.')
    } else {
      setDone(true)
      await supabase.auth.signOut()
      setTimeout(() => navigate('/'), 2500)
    }
    setBusy(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', height: 42, padding: '0 12px',
    border: '1px solid #E2E2E2', borderRadius: 8,
    fontSize: 14, fontFamily: "'Inter',sans-serif",
    color: '#0F0F0F', background: '#FFFFFF', outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }
  const focus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#7C3AED'
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'
  }
  const blur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#E2E2E2'
    e.currentTarget.style.boxShadow = 'none'
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { -webkit-font-smoothing: antialiased; }
        @keyframes fIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ width: '100%', maxWidth: 400, animation: 'fIn 0.35s ease' }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: '#F4F0FF', border: '1px solid #E2D9FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 56 56" fill="none">
              <path d="M28 4L50 18V38L28 52L6 38V18Z" fill="rgba(124,58,237,0.15)" stroke="#7C3AED" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M28 4L6 18H50Z" fill="rgba(124,58,237,0.28)"/>
              <line x1="6" y1="18" x2="28" y2="30" stroke="rgba(124,58,237,0.55)" strokeWidth="1.2"/>
              <line x1="50" y1="18" x2="28" y2="30" stroke="rgba(124,58,237,0.55)" strokeWidth="1.2"/>
              <circle cx="28" cy="30" r="3" fill="#7C3AED"/>
            </svg>
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#0F0F0F', letterSpacing: -0.4 }}>Claramente</span>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 14, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#0F0F0F', marginBottom: 6, letterSpacing: -0.3 }}>Nova senha</p>
          <p style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.6, marginBottom: 24 }}>Escolha uma senha segura para sua conta.</p>

          {checking && <p style={{ textAlign: 'center', color: '#9B9B9B', fontSize: 13, padding: '20px 0' }}>Verificando link...</p>}

          {!checking && !ready && (
            <div style={{ padding: '14px', borderRadius: 8, background: '#FFF5F5', border: '1px solid #FED7D7', fontSize: 13, color: '#C53030', textAlign: 'center' }}>
              Link inválido ou expirado.
              <button onClick={() => navigate('/')} style={{ display: 'block', margin: '12px auto 0', height: 36, padding: '0 20px', borderRadius: 8, border: 'none', background: '#7C3AED', color: '#FFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                Solicitar novo link
              </button>
            </div>
          )}

          {done && (
            <div style={{ padding: '14px', borderRadius: 8, background: '#F0FFF4', border: '1px solid #C6F6D5', fontSize: 13, color: '#276749', textAlign: 'center' }}>
              ✓ Senha redefinida! Redirecionando...
            </div>
          )}

          {!checking && ready && !done && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0F0F0F', marginBottom: 6 }}>Nova senha</label>
                <input type="password" value={pw} onChange={e => setPw(e.target.value)} onFocus={e => { focus(e); setPwFocus(true) }} onBlur={blur} placeholder="Crie uma senha forte" style={inp} />
                {pwFocus && pw.length > 0 && (
                  <div style={{ marginTop: 8, padding: 12, background: '#FAFAFA', borderRadius: 8, border: '1px solid #E8E8E8' }}>
                    <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
                      {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= st.score ? st.color : '#E8E8E8', transition: 'background 0.2s' }} />)}
                    </div>
                    {st.label && <p style={{ fontSize: 11, fontWeight: 500, color: st.color, marginBottom: 8 }}>{st.label}</p>}
                    {RULES.map(r => {
                      const passed = r.ok(pw)
                      return (
                        <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                          <div style={{ width: 15, height: 15, borderRadius: '50%', flexShrink: 0, background: passed ? 'rgba(34,197,94,0.12)' : '#F4F4F5', border: `1px solid ${passed ? '#22C55E' : '#E2E2E2'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {passed && <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          <span style={{ fontSize: 11, color: passed ? '#22C55E' : '#9B9B9B' }}>{r.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0F0F0F', marginBottom: 6 }}>Confirmar senha</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleReset() }} placeholder="Repita a nova senha"
                  style={{ ...inp, borderColor: confirm.length > 3 ? (confirm === pw ? '#22C55E' : '#EF4444') : '#E2E2E2' }}
                  onFocus={focus} onBlur={blur}
                />
                {confirm.length > 3 && (
                  <p style={{ fontSize: 11, marginTop: 4, color: confirm === pw ? '#22C55E' : '#EF4444' }}>
                    {confirm === pw ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
                  </p>
                )}
              </div>

              {error && <div style={{ padding: '10px 12px', borderRadius: 8, background: '#FFF5F5', border: '1px solid #FED7D7', fontSize: 13, color: '#C53030' }}>{error}</div>}

              <button onClick={handleReset} disabled={busy} style={{ width: '100%', height: 42, borderRadius: 8, border: 'none', background: busy ? '#C4B5FD' : '#7C3AED', color: '#FFF', fontSize: 14, fontWeight: 600, fontFamily: "'Inter',sans-serif", cursor: busy ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
                {busy ? 'Salvando...' : 'Salvar nova senha'}
              </button>

              <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9B9B9B', fontSize: 13, fontFamily: "'Inter',sans-serif", textAlign: 'center', padding: 0 }}>
                ← Voltar ao login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}