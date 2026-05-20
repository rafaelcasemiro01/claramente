import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

type Tab = 'login' | 'signup' | 'forgot'

const RULES = [
  { label: 'Mínimo 8 caracteres',          ok: (p: string) => p.length >= 8 },
  { label: 'Uma letra maiúscula',           ok: (p: string) => /[A-Z]/.test(p) },
  { label: 'Um número',                     ok: (p: string) => /[0-9]/.test(p) },
  { label: 'Um caractere especial (!@#$%)', ok: (p: string) => /[!@#$%^&*]/.test(p) },
]

function strength(p: string) {
  const n = RULES.filter(r => r.ok(p)).length
  const map = [
    { score: 0, label: '',           color: '#E8E8E8' },
    { score: 1, label: 'Muito fraca', color: '#EF4444' },
    { score: 2, label: 'Fraca',       color: '#F59E0B' },
    { score: 3, label: 'Boa',         color: '#8B5CF6' },
    { score: 4, label: 'Forte',       color: '#22C55E' },
  ]
  return map[n]
}

function checkEmail(v: string) {
  if (!v) return { ok: false, msg: '' }
  if (!v.includes('@')) return { ok: false, msg: 'E-mail deve conter @' }
  const [, domain] = v.split('@')
  if (!domain || !domain.includes('.')) return { ok: false, msg: 'Domínio inválido (ex: gmail.com)' }
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  if (!re.test(v)) return { ok: false, msg: 'Formato inválido' }
  return { ok: true, msg: '' }
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { -webkit-font-smoothing: antialiased; }
  @keyframes fIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  input:-webkit-autofill { -webkit-box-shadow:0 0 0 100px #fff inset!important; -webkit-text-fill-color:#0F0F0F!important; }
`

export default function Landing() {
  const { signIn, signUp } = useAuth()
  const [tab, setTab]       = useState<Tab>('login')
  const [name, setName]     = useState('')
  const [email, setEmail]   = useState('')
  const [pw, setPw]         = useState('')
  const [error, setError]   = useState('')
  const [info, setInfo]     = useState('')
  const [busy, setBusy]     = useState(false)
  const [pwFocus, setPwFocus] = useState(false)

  const ev = checkEmail(email)
  const st = strength(pw)

  function reset() { setError(''); setInfo(''); setPw(''); setPwFocus(false) }
  function switchTab(t: Tab) { reset(); setTab(t) }

  async function submit() {
    setError(''); setInfo(''); setBusy(true)

    if (!ev.ok && email) { setError(ev.msg || 'E-mail inválido.'); setBusy(false); return }
    if (!email) { setError('Informe seu e-mail.'); setBusy(false); return }

    try {
      if (tab === 'forgot') {
        const { error: e } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (e) setError('Erro ao enviar link.')
        else setInfo('Link enviado! Verifique sua caixa de entrada.')

      } else if (tab === 'login') {
        if (!pw) { setError('Informe sua senha.'); setBusy(false); return }
        const { error: e } = await signIn(email, pw)
        if (e) setError('E-mail ou senha incorretos.')

      } else {
        if (!name.trim()) { setError('Informe seu nome.'); setBusy(false); return }
        const failedRule = RULES.find(r => !r.ok(pw))
        if (failedRule) { setError(`Senha inválida: ${failedRule.label}.`); setBusy(false); return }
        const { error: e } = await signUp(email, pw, name.trim())
        if (e) {
          const msg = (e as { message?: string }).message ?? ''
          setError(msg.toLowerCase().includes('already') ? 'E-mail já cadastrado.' : 'Erro ao criar conta.')
        } else {
          setInfo('Conta criada! Faça login.')
          switchTab('login')
        }
      }
    } catch {
      setError('Erro inesperado. Tente novamente.')
    }
    setBusy(false)
  }

  // ─── shared input style ──────────────────────────────────────
  const inp: React.CSSProperties = {
    width: '100%', height: 42, padding: '0 12px',
    border: '1px solid #E2E2E2', borderRadius: 8,
    fontSize: 14, fontWeight: 400, fontFamily: "'Inter',sans-serif",
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
      <style>{CSS}</style>

      <div style={{ width: '100%', maxWidth: 400, animation: 'fIn 0.35s ease' }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: '#F4F0FF', border: '1px solid #E2D9FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 56 56" fill="none">
              <path d="M28 4L50 18V38L28 52L6 38V18Z" fill="rgba(124,58,237,0.15)" stroke="#7C3AED" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M28 4L6 18H50Z" fill="rgba(124,58,237,0.28)"/>
              <line x1="6"  y1="18" x2="28" y2="30" stroke="rgba(124,58,237,0.55)" strokeWidth="1.2"/>
              <line x1="50" y1="18" x2="28" y2="30" stroke="rgba(124,58,237,0.55)" strokeWidth="1.2"/>
              <circle cx="28" cy="30" r="3" fill="#7C3AED"/>
            </svg>
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#0F0F0F', letterSpacing: -0.4 }}>Claramente</span>
        </div>

        {/* Card */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

          {/* Tabs */}
          {tab !== 'forgot' && (
            <div style={{ display: 'flex', borderBottom: '1px solid #E8E8E8' }}>
              {(['login', 'signup'] as Tab[]).map(t => (
                <button key={t} onClick={() => switchTab(t)} style={{ flex: 1, height: 44, border: 'none', cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: tab === t ? 600 : 400, color: tab === t ? '#7C3AED' : '#6B6B6B', background: tab === t ? '#FFFFFF' : '#FAFAFA', borderBottom: tab === t ? '2px solid #7C3AED' : '2px solid transparent', transition: 'all 0.15s' }}>
                  {t === 'login' ? 'Entrar' : 'Criar conta'}
                </button>
              ))}
            </div>
          )}

          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Forgot header */}
            {tab === 'forgot' && (
              <div>
                <button onClick={() => switchTab('login')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B6B', fontSize: 13, fontFamily: "'Inter',sans-serif", marginBottom: 14, padding: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                  </svg>
                  Voltar ao login
                </button>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#0F0F0F', marginBottom: 4 }}>Recuperar senha</p>
                <p style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.6 }}>Enviaremos um link para redefinição.</p>
              </div>
            )}

            {/* Name */}
            {tab === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0F0F0F', marginBottom: 6 }}>Nome</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Como quer ser chamado?" style={inp} onFocus={focus} onBlur={blur} />
              </div>
            )}

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0F0F0F', marginBottom: 6 }}>E-mail</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submit() }}
                placeholder="seu@email.com"
                style={{ ...inp, borderColor: email.length > 4 ? (ev.ok ? '#22C55E' : '#E2E2E2') : '#E2E2E2' }}
                onFocus={focus} onBlur={blur}
              />
              {email.length > 4 && ev.msg && (
                <p style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{ev.msg}</p>
              )}
            </div>

            {/* Password */}
            {tab !== 'forgot' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#0F0F0F' }}>Senha</label>
                  {tab === 'login' && (
                    <button onClick={() => switchTab('forgot')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: '#7C3AED', fontFamily: "'Inter',sans-serif", padding: 0 }}>
                      Esqueceu?
                    </button>
                  )}
                </div>
                <input
                  type="password" value={pw}
                  onChange={e => setPw(e.target.value)}
                  onFocus={e => { focus(e); setPwFocus(true) }}
                  onBlur={blur}
                  onKeyDown={e => { if (e.key === 'Enter') submit() }}
                  placeholder={tab === 'signup' ? 'Crie uma senha forte' : '••••••••'}
                  style={inp}
                />

                {/* Password strength — signup only */}
                {tab === 'signup' && pwFocus && pw.length > 0 && (
                  <div style={{ marginTop: 10, padding: 12, background: '#FAFAFA', borderRadius: 8, border: '1px solid #E8E8E8' }}>
                    <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= st.score ? st.color : '#E8E8E8', transition: 'background 0.2s' }} />
                      ))}
                    </div>
                    {st.label && <p style={{ fontSize: 11, fontWeight: 500, color: st.color, marginBottom: 8 }}>{st.label}</p>}
                    {RULES.map(r => {
                      const passed = r.ok(pw)
                      return (
                        <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                          <div style={{ width: 15, height: 15, borderRadius: '50%', flexShrink: 0, background: passed ? 'rgba(34,197,94,0.12)' : '#F4F4F5', border: `1px solid ${passed ? '#22C55E' : '#E2E2E2'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                            {passed && (
                              <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                                <polyline points="2,6 5,9 10,3" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <span style={{ fontSize: 11, color: passed ? '#22C55E' : '#9B9B9B' }}>{r.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Feedback */}
            {error && (
              <div style={{ padding: '10px 12px', borderRadius: 8, background: '#FFF5F5', border: '1px solid #FED7D7', fontSize: 13, color: '#C53030' }}>
                {error}
              </div>
            )}
            {info && (
              <div style={{ padding: '10px 12px', borderRadius: 8, background: '#F0FFF4', border: '1px solid #C6F6D5', fontSize: 13, color: '#276749' }}>
                {info}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={submit}
              disabled={busy}
              style={{ width: '100%', height: 42, borderRadius: 8, border: 'none', background: busy ? '#C4B5FD' : '#7C3AED', color: '#FFF', fontSize: 14, fontWeight: 600, fontFamily: "'Inter',sans-serif", cursor: busy ? 'not-allowed' : 'pointer', transition: 'all 0.15s', marginTop: 2 }}
              onMouseEnter={e => { if (!busy) e.currentTarget.style.background = '#6D28D9' }}
              onMouseLeave={e => { if (!busy) e.currentTarget.style.background = '#7C3AED' }}
            >
              {busy ? 'Aguarde...' : tab === 'login' ? 'Entrar' : tab === 'signup' ? 'Criar conta' : 'Enviar link'}
            </button>

            {tab === 'signup' && (
              <p style={{ fontSize: 11, color: '#9B9B9B', textAlign: 'center', lineHeight: 1.6 }}>
                Ao criar conta você concorda com o uso dos seus dados conforme a LGPD.
              </p>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#9B9B9B', marginTop: 20 }}>
          Não substitui acompanhamento psicológico profissional.
        </p>
      </div>
    </div>
  )
}