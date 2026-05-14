import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

type Mode = 'login' | 'signup'

const ClaramenteLogo = ({ size = 48, color = '#7C3AED' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 4L42 15V33L24 44L6 33V15Z" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M24 4L6 15H42L24 4Z" fill={color} fillOpacity="0.25"/>
    <path d="M6 15L24 26M42 15L24 26" stroke={color} strokeWidth="1.2" strokeOpacity="0.7"/>
    <path d="M24 26L24 44" stroke={color} strokeWidth="1.2" strokeOpacity="0.5"/>
    <circle cx="24" cy="26" r="2.5" fill={color}/>
  </svg>
)

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

  const inputStyle = {
    width: '100%', padding: '13px 16px', borderRadius: 12, fontSize: 15,
    border: '1.5px solid #E8E4F5', outline: 'none',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    background: '#FAFAFA', boxSizing: 'border-box' as const,
    color: '#1E1B2E', transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  return (
    <div style={{minHeight:'100vh', display:'flex', flexDirection:'column', background:'#F5F3FF'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(145deg, #2D1B69 0%, #5B21B6 50%, #7C3AED 100%)',
        padding: '56px 32px 52px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Círculos decorativos */}
        <div style={{position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(167,139,250,0.15)', pointerEvents:'none'}}/>
        <div style={{position:'absolute', bottom:-40, left:-40, width:150, height:150, borderRadius:'50%', background:'rgba(139,92,246,0.1)', pointerEvents:'none'}}/>

        <ClaramenteLogo size={60} color="white" />
        <h1 style={{fontFamily:'Lora, serif', fontSize: 34, fontWeight: 600, color:'white', margin:0, letterSpacing:-0.5}}>
          Claramente
        </h1>
        <p style={{fontSize:15, color:'rgba(255,255,255,0.75)', margin:0, textAlign:'center', lineHeight:1.6, maxWidth:280}}>
          Seu espaço seguro de introspecção, autoconhecimento e transmutação interior
        </p>
      </div>

      {/* Card */}
      <div style={{flex:1, display:'flex', flexDirection:'column', padding:'0 20px 40px'}}>
        <div style={{
          background:'white', borderRadius:24, padding:'32px 24px',
          marginTop:-28, boxShadow:'0 8px 32px rgba(109,40,217,0.10)',
          maxWidth:440, width:'100%', alignSelf:'center',
          border: '1px solid #EDE9FE',
        }}>

          {/* Tabs */}
          <div style={{display:'flex', background:'#F5F3FF', borderRadius:12, padding:4, marginBottom:28}}>
            {(['login','signup'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
                style={{
                  flex:1, padding:'10px 0', borderRadius:10, border:'none', cursor:'pointer',
                  fontFamily:'Plus Jakarta Sans, sans-serif', fontSize:14, fontWeight:500,
                  transition:'all 0.2s',
                  background: mode===m ? 'white' : 'transparent',
                  color: mode===m ? '#6D28D9' : '#9CA3AF',
                  boxShadow: mode===m ? '0 2px 8px rgba(109,40,217,0.12)' : 'none',
                }}>
                {m==='login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <div style={{display:'flex', flexDirection:'column', gap:16}}>
            {mode==='signup' && (
              <div>
                <label style={{fontSize:13, color:'#6D6A8A', display:'block', marginBottom:6, fontWeight:500}}>Seu nome</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Como podemos te chamar?" style={inputStyle}
                  onFocus={e => { e.target.style.borderColor='#7C3AED'; e.target.style.boxShadow='0 0 0 3px rgba(124,58,237,0.08)' }}
                  onBlur={e => { e.target.style.borderColor='#E8E4F5'; e.target.style.boxShadow='none' }}
                />
              </div>
            )}
            <div>
              <label style={{fontSize:13, color:'#6D6A8A', display:'block', marginBottom:6, fontWeight:500}}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" style={inputStyle}
                onFocus={e => { e.target.style.borderColor='#7C3AED'; e.target.style.boxShadow='0 0 0 3px rgba(124,58,237,0.08)' }}
                onBlur={e => { e.target.style.borderColor='#E8E4F5'; e.target.style.boxShadow='none' }}
              />
            </div>
            <div>
              <label style={{fontSize:13, color:'#6D6A8A', display:'block', marginBottom:6, fontWeight:500}}>Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode==='signup' ? 'Mínimo 8 caracteres' : '••••••••'}
                onKeyDown={e => e.key==='Enter' && handleSubmit()} style={inputStyle}
                onFocus={e => { e.target.style.borderColor='#7C3AED'; e.target.style.boxShadow='0 0 0 3px rgba(124,58,237,0.08)' }}
                onBlur={e => { e.target.style.borderColor='#E8E4F5'; e.target.style.boxShadow='none' }}
              />
            </div>

            {error && <div style={{background:'#FFF1F0', border:'1px solid #FFCCC7', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#CF1322'}}>{error}</div>}
            {success && <div style={{background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#166534'}}>{success}</div>}

            <button onClick={handleSubmit} disabled={loading} style={{
              width:'100%', padding:'15px', borderRadius:14, border:'none',
              cursor: loading ? 'not-allowed':'pointer',
              background: loading ? '#C4B5FD' : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
              color:'white', fontSize:15, fontWeight:600,
              fontFamily:'Plus Jakarta Sans, sans-serif', transition:'all 0.2s',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(124,58,237,0.35)',
              marginTop:4,
            }}>
              {loading ? 'Aguarde...' : mode==='login' ? 'Entrar' : 'Criar conta'}
            </button>
          </div>

          <p style={{textAlign:'center', fontSize:12, color:'#B0ABCC', marginTop:24, marginBottom:0, lineHeight:1.5}}>
            Não substitui acompanhamento psicológico profissional.
          </p>
        </div>
      </div>
    </div>
  )
}