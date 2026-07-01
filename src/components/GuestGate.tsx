// src/components/GuestGate.tsx
// ─────────────────────────────────────────────────────────────────────
// Soft-gate de login — bottom sheet não-bloqueante.
// Aparece só quando o visitante tenta guardar algo. Copy contextual por
// motivo. Usa o Supabase Auth (mesma base do Landing) e um botão
// "Agora não" para continuar explorando sem conta.
// ─────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useColors, fontStack } from '@/lib/theme'
import { useTheme } from '@/contexts/ThemeContext'
import { ClaramenteLogo } from '@/components/Logo'
import type { GateReason } from '@/hooks/useGuestSession'

interface Props {
  reason: GateReason
  onClose: () => void
  /** Chamado quando o login/cadastro é concluído com sucesso. */
  onAuthed?: () => void
}

const COPY: Record<GateReason, { kicker: string; title: string; sub: string }> = {
  save: {
    kicker: 'Guardar sua conversa',
    title: 'Crie uma conta para não perder isto.',
    sub: 'Suas reflexões de hoje ficam salvas e você pode retomá-las quando quiser.',
  },
  history: {
    kicker: 'Seu histórico',
    title: 'Suas conversas ficam aqui — com uma conta.',
    sub: 'Crie uma conta gratuita para acompanhar sua jornada ao longo do tempo.',
  },
  reports: {
    kicker: 'Relatórios emocionais',
    title: 'Veja sua evolução ao longo do tempo.',
    sub: 'Os relatórios precisam de um histórico salvo. Crie sua conta para começar.',
  },
  generic: {
    kicker: 'Bem-vindo',
    title: 'Guarde sua jornada no Claramente.',
    sub: 'Sem compromisso — você pode continuar explorando à vontade.',
  },
}

export default function GuestGate({ reason, onClose, onAuthed }: Props) {
  const t = useColors()
  const { isDark } = useTheme()
  const [tab, setTab] = useState<'signup' | 'login'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const copy = COPY[reason]
  const onBtn = isDark ? '#2a1610' : '#ffffff'

  async function submit() {
    setError(null)
    if (!email || !password) { setError('Preencha e-mail e senha.'); return }
    setBusy(true)
    try {
      if (tab === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name || null } },
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
      onAuthed?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível continuar. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  async function google() {
    setError(null)
    setBusy(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/app` },
      })
      if (error) throw error
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível continuar com o Google.')
      setBusy(false)
    }
  }

  const input: React.CSSProperties = {
    width: '100%', height: 46, padding: '0 16px', boxSizing: 'border-box',
    border: `1px solid ${t.border}`, borderRadius: 12, fontSize: 14.5, fontFamily: fontStack,
    color: t.text, background: t.surface, outline: 'none',
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(42,31,26,0.28)',
        backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'gfFade 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460, background: t.bg,
          borderRadius: '22px 22px 0 0', border: `1px solid ${t.border}`, borderBottom: 'none',
          boxShadow: '0 -18px 50px rgba(0,0,0,0.28)',
          padding: '14px 26px 28px', position: 'relative', fontFamily: fontStack,
          animation: 'gfSheet 0.32s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div style={{ width: 38, height: 4, borderRadius: 99, background: t.border, margin: '0 auto 16px' }}/>
        <button onClick={onClose} aria-label="Fechar" style={{
          position: 'absolute', top: 16, right: 16, width: 30, height: 30, borderRadius: 99,
          border: 'none', background: t.surface2, cursor: 'pointer', color: t.textMuted,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
        }}>✕</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <ClaramenteLogo size={26} mode={isDark ? 'dark' : 'light'}/>
          <p style={{ fontSize: 10.5, letterSpacing: 2, textTransform: 'uppercase', color: t.accentDeep, fontWeight: 700, margin: 0 }}>{copy.kicker}</p>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: t.text, letterSpacing: -0.6, lineHeight: 1.15, margin: 0 }}>{copy.title}</h2>
        <p style={{ fontSize: 13.5, color: t.textSub, lineHeight: 1.55, margin: '10px 0 20px', maxWidth: 370 }}>{copy.sub}</p>

        <div style={{ display: 'flex', gap: 22, marginBottom: 18, borderBottom: `1px solid ${t.borderSoft}` }}>
          {([['signup', 'Criar conta'], ['login', 'Já tenho conta']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', fontFamily: fontStack,
              fontSize: 13.5, fontWeight: tab === k ? 700 : 500, color: tab === k ? t.text : t.textMuted,
              borderBottom: `2px solid ${tab === k ? t.accent : 'transparent'}`, marginBottom: -1,
            }}>{l}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tab === 'signup' && (
            <input placeholder="Como podemos te chamar?" value={name} onChange={e => setName(e.target.value)} style={input}/>
          )}
          <input placeholder="seu@email.com" type="email" value={email} onChange={e => setEmail(e.target.value)} style={input}/>
          <div style={{ position: 'relative' }}>
            <input placeholder="Senha" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} style={{ ...input, paddingRight: 46 }}/>
            <button onClick={() => setShowPw(p => !p)} type="button" style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, fontSize: 12, fontWeight: 600, padding: 6,
            }}>{showPw ? 'ocultar' : 'ver'}</button>
          </div>

          {error && <p style={{ fontSize: 12.5, color: t.danger, margin: 0 }}>{error}</p>}

          <button onClick={submit} disabled={busy} style={{
            width: '100%', height: 48, borderRadius: 999, border: 'none', cursor: busy ? 'default' : 'pointer',
            background: t.text, color: t.bg, fontSize: 14.5, fontWeight: 600, fontFamily: fontStack, opacity: busy ? 0.6 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 4,
          }}>
            {busy ? 'Um instante…' : tab === 'signup' ? 'Criar conta e salvar' : 'Entrar e continuar'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '2px 0' }}>
            <div style={{ flex: 1, height: 1, background: t.borderSoft }}/>
            <span style={{ fontSize: 11, color: t.textMuted }}>ou</span>
            <div style={{ flex: 1, height: 1, background: t.borderSoft }}/>
          </div>

          <button onClick={google} disabled={busy} style={{
            width: '100%', height: 46, borderRadius: 999, border: `1px solid ${t.border}`, background: 'transparent',
            cursor: busy ? 'default' : 'pointer', fontSize: 13.5, fontWeight: 500, color: t.text, fontFamily: fontStack,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"/></svg>
            Continuar com Google
          </button>

          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: fontStack,
            fontSize: 13, color: t.textMuted, fontWeight: 500, padding: '8px 0 0', margin: '2px auto 0',
          }}>Agora não — continuar explorando</button>
        </div>

        <style>{`
          @keyframes gfFade  { from { opacity: 0 } to { opacity: 1 } }
          @keyframes gfSheet { from { transform: translateY(100%) } to { transform: translateY(0) } }
        `}</style>
      </div>
    </div>
  )
}
