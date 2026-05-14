import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

type Mode = 'login' | 'signup'

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
      if (error) setError('Erro ao criar conta. Tente outro e-mail.')
      else setSuccess('Conta criada! Verifique seu e-mail para confirmar.')
    }
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh', display:'flex', flexDirection:'column', background:'#f7f5f0'}}>

      {/* Hero superior */}
      <div style={{
        background: 'linear-gradient(160deg, #1a4a2e 0%, #2d7a4a 60%, #3d9e60 100%)',
        padding: '52px 32px 48px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 4,
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5"/>
            <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5"/>
          </svg>
        </div>
        <h1 style={{fontFamily:'Lora, serif', fontSize: 32, fontWeight: 600, color: 'white', margin: 0, letterSpacing: -0.5}}>
          Claramente
        </h1>
        <p style={{fontSize: 15, color: 'rgba(255,255,255,0.8)', margin: 0, textAlign: 'center', lineHeight: 1.5, maxWidth: 260}}>
          Seu espaço seguro de introspecção e autoconhecimento
        </p>
      </div>

      {/* Card de formulário */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', padding: '0 20px 32px'}}>
        <div style={{
          background: 'white',
          borderRadius: 24,
          padding: '32px 24px',
          marginTop: -24,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          flex: 1,
          maxWidth: 440,
          width: '100%',
          alignSelf: 'center',
        }}>

          {/* Tabs */}
          <div style={{display: 'flex', background: '#f7f5f0', borderRadius: 12, padding: 4, marginBottom: 28}}>
            {(['login', 'signup'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, fontWeight: 500,
                  transition: 'all 0.2s',
                  background: mode === m ? 'white' : 'transparent',
                  color: mode === m ? '#1a4a2e' : '#888',
                  boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                }}>
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
            {mode === 'signup' && (
              <div>
                <label style={{fontSize: 13, color: '#5f5e5a', display: 'block', marginBottom: 6, fontWeight: 500}}>Nome</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Como podemos te chamar?"
                  style={{
                    width: '100%', padding: '13px 16px', borderRadius: 12, fontSize: 15,
                    border: '1.5px solid #e8e5e0', outline: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif',
                    background: '#fafaf8', boxSizing: 'border-box', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#2d7a4a'}
                  onBlur={e => e.target.style.borderColor = '#e8e5e0'}
                />
              </div>
            )}

            <div>
              <label style={{fontSize: 13, color: '#5f5e5a', display: 'block', marginBottom: 6, fontWeight: 500}}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: 12, fontSize: 15,
                  border: '1.5px solid #e8e5e0', outline: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif',
                  background: '#fafaf8', boxSizing: 'border-box', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#2d7a4a'}
                onBlur={e => e.target.style.borderColor = '#e8e5e0'}
              />
            </div>

            <div>
              <label style={{fontSize: 13, color: '#5f5e5a', display: 'block', marginBottom: 6, fontWeight: 500}}>Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Mínimo 8 caracteres' : '••••••••'}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: 12, fontSize: 15,
                  border: '1.5px solid #e8e5e0', outline: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif',
                  background: '#fafaf8', boxSizing: 'border-box', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#2d7a4a'}
                onBlur={e => e.target.style.borderColor = '#e8e5e0'}
              />
            </div>

            {error && (
              <div style={{background: '#fff1f0', border: '1px solid #ffccc7', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#cf1322'}}>
                {error}
              </div>
            )}
            {success && (
              <div style={{background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#389e0d'}}>
                {success}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading}
              style={{
                width: '100%', padding: '15px', borderRadius: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? '#9dd4b8' : 'linear-gradient(135deg, #2d7a4a, #1a4a2e)',
                color: 'white', fontSize: 15, fontWeight: 600,
                fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(45,122,74,0.3)',
                marginTop: 4,
              }}>
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </div>

          <p style={{textAlign: 'center', fontSize: 13, color: '#888', marginTop: 24, marginBottom: 0}}>
            Não substitui acompanhamento psicológico profissional.
          </p>
        </div>
      </div>
    </div>
  )
}