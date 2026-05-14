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
      if (error) setError('Erro ao criar conta.')
      else setSuccess('Conta criada! Verifique seu e-mail.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf8] px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{background:'#e6f4ed'}}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2d7a4a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </div>
          <h1 style={{fontFamily:'Lora, serif'}} className="text-4xl font-semibold text-gray-800 mb-1">Claramente</h1>
          <p className="text-sm text-gray-500">Seu espaço seguro de introspecção</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">
            {mode === 'login' ? 'Entrar na sua conta' : 'Criar nova conta'}
          </h2>

          {mode === 'signup' && (
            <div>
              <label className="text-sm text-gray-600 block mb-1">Seu nome</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Como podemos te chamar?"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none transition-all"
                style={{}} onFocus={e => e.target.style.borderColor='#3d8b5a'} onBlur={e => e.target.style.borderColor='#e5e7eb'}
              />
            </div>
          )}

          <div>
            <label className="text-sm text-gray-600 block mb-1">E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none transition-all"
              onFocus={e => e.target.style.borderColor='#3d8b5a'} onBlur={e => e.target.style.borderColor='#e5e7eb'}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Mínimo 8 caracteres' : '••••••••'}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none transition-all"
              onFocus={e => e.target.style.borderColor='#3d8b5a'} onBlur={e => e.target.style.borderColor='#e5e7eb'}
            />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
          {success && <p className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg">{success}</p>}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-3 text-white font-medium rounded-xl transition-all disabled:opacity-60"
            style={{background: loading ? '#9dd4b8' : '#2d7a4a'}}
            onMouseEnter={e => { if(!loading) (e.target as HTMLElement).style.background='#1a4a2e' }}
            onMouseLeave={e => { if(!loading) (e.target as HTMLElement).style.background='#2d7a4a' }}
          >
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          {mode === 'login'
            ? <p>Não tem conta?{' '}<button onClick={() => {setMode('signup');setError('')}} className="font-medium hover:underline" style={{color:'#2d7a4a'}}>Criar conta</button></p>
            : <p>Já tem conta?{' '}<button onClick={() => {setMode('login');setError('')}} className="font-medium hover:underline" style={{color:'#2d7a4a'}}>Entrar</button></p>
          }
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          Não substitui acompanhamento psicológico profissional.
        </p>
      </div>
    </div>
  )
}