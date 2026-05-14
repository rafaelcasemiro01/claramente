import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

type Mode = 'login' | 'signup'

function CrystalLogo({ size = 48, light = false }: { size?: number; light?: boolean }) {
  const c = light ? 'white' : '#8B5CF6'
  const cf = light ? 'rgba(255,255,255,0.25)' : 'rgba(139,92,246,0.15)'
  const cl = light ? 'rgba(255,255,255,0.6)' : 'rgba(139,92,246,0.6)'
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <path d="M28 4L50 18V38L28 52L6 38V18Z" fill={cf} stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M28 4L6 18H50Z" fill={light ? 'rgba(255,255,255,0.35)' : 'rgba(139,92,246,0.35)'}/>
      <line x1="6"  y1="18" x2="28" y2="30" stroke={cl} strokeWidth="1.2"/>
      <line x1="50" y1="18" x2="28" y2="30" stroke={cl} strokeWidth="1.2"/>
      <line x1="28" y1="30" x2="28" y2="52" stroke={light ? 'rgba(255,255,255,0.35)' : 'rgba(139,92,246,0.35)'} strokeWidth="1"/>
      <circle cx="28" cy="30" r="3" fill={c}/>
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

  async function handleSubmit() {
    setError(''); setSuccess(''); setLoading(true)
    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError('E-mail ou senha incorretos.')
    } else {
      if (!name.trim()) { setError('Informe seu nome.'); setLoading(false); return }
      if (password.length < 8) { setError('Senha: mínimo 8 caracteres.'); setLoading(false); return }
      const { error } = await signUp(email, password, name)
      if (error) setError('Erro ao criar conta.')
      else setSuccess('Conta criada! Verifique seu e-mail.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0D0B1A', fontFamily: "'DM Sans', 'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: #4A4268 !important; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #1E1840 inset !important; -webkit-text-fill-color: #E9E4FF !important; }
      `}</style>

      {/* Glow de fundo */}
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <header style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
        <CrystalLogo size={32} light />
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: 'white', letterSpacing: -0.3 }}>Claramente</span>
      </header>

      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 24px 60px', position: 'relative', zIndex: 1 }}>

        {/* Logo central */}
        <div style={{ marginBottom: 28, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' }} />
          <CrystalLogo size={72} light />
        </div>

        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 42, color: 'white', textAlign: 'center', marginBottom: 12, letterSpacing: -1, lineHeight: 1.1 }}>
          Claramente
        </h1>
        <p style={{ fontSize: 16, color: '#9B8FCC', textAlign: 'center', marginBottom: 48, lineHeight: 1.6, maxWidth: 300 }}>
          Seu espaço sagrado de introspecção,<br />autoconhecimento e transmutação interior
        </p>

        {/* Card de auth */}
        <div style={{ width: '100%', maxWidth: 420, background: '#13102A', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 24, padding: '8px', boxShadow: '0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.05)' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', background: '#0D0B1A', borderRadius: 18, padding: '4px', marginBottom: 24 }}>
            {(['login', 'signup'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }} style={{
                flex: 1, padding: '11px 0', borderRadius: 14, border: 'none',
                cursor: 'pointer', fontSize: 14, fontWeight: 500, transition: 'all 0.2s',
                fontFamily: "'DM Sans', sans-serif",
                background: mode === m ? '#8B5CF6' : 'transparent',
                color: mode === m ? 'white' : '#6B6480',
                boxShadow: mode === m ? '0 4px 12px rgba(139,92,246,0.4)' : 'none',
              }}>
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          {/* Campos */}
          <div style={{ padding: '0 8px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'signup' && (
              <div>
                <label style={{ fontSize: 12, color: '#6B6480', display: 'block', marginBottom: 8, fontWeight: 500, letterSpacing: 0.3 }}>NOME</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Como você quer ser chamado?" style={{
                  width: '100%', padding: '14px 18px', borderRadius: 14, fontSize: 15, color: '#E9E4FF',
                  background: '#1E1840', border: '1px solid rgba(139,92,246,0.15)', outline: 'none',
                  fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.background = '#231D4F' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.15)'; e.target.style.background = '#1E1840' }} />
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, color: '#6B6480', display: 'block', marginBottom: 8, fontWeight: 500, letterSpacing: 0.3 }}>E-MAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" style={{
                width: '100%', padding: '14px 18px', borderRadius: 14, fontSize: 15, color: '#E9E4FF',
                background: '#1E1840', border: '1px solid rgba(139,92,246,0.15)', outline: 'none',
                fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.background = '#231D4F' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.15)'; e.target.style.background = '#1E1840' }} />
            </div>

            <div>
              <label style={{ fontSize: 12, color: '#6B6480', display: 'block', marginBottom: 8, fontWeight: 500, letterSpacing: 0.3 }}>SENHA</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Mínimo 8 caracteres' : '••••••••'}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} style={{
                  width: '100%', padding: '14px 18px', borderRadius: 14, fontSize: 15, color: '#E9E4FF',
                  background: '#1E1840', border: '1px solid rgba(139,92,246,0.15)', outline: 'none',
                  fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.background = '#231D4F' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.15)'; e.target.style.background = '#1E1840' }} />
            </div>

            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#FCA5A5' }}>{error}</div>}
            {success && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#86EFAC' }}>{success}</div>}

            <button onClick={handleSubmit} disabled={loading} style={{
              width: '100%', padding: '16px', borderRadius: 16, border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? '#3B2E6E' : '#8B5CF6',
              color: 'white', fontSize: 15, fontWeight: 600, marginTop: 4,
              fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', letterSpacing: 0.2,
              boxShadow: loading ? 'none' : '0 8px 24px rgba(139,92,246,0.4)',
            }}
            onMouseEnter={e => { if (!loading) (e.target as HTMLElement).style.background = '#7C3AED' }}
            onMouseLeave={e => { if (!loading) (e.target as HTMLElement).style.background = '#8B5CF6' }}>
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </div>
        </div>

        <p style={{ marginTop: 20, fontSize: 13, color: '#4A4268', textAlign: 'center' }}>
          Não substitui acompanhamento psicológico profissional.
        </p>
      </div>
    </div>
  )
}