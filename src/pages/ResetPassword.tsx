// src/pages/ResetPassword.tsx
// ─────────────────────────────────────────────────────────────────────
// Claramente — Redefinição de senha (re-themed)
// Mantém: detecção de PASSWORD_RECOVERY, força de senha, validações,
// supabase.auth.updateUser. Visual em terracotta + mascote.
// ─────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/contexts/ThemeContext'
import { ClaramenteLogo } from '@/components/Logo'
import { useColors, fontStack } from '@/lib/theme'

const RULES = [
  { label: 'Mínimo 8 caracteres',           ok: (p: string) => p.length >= 8 },
  { label: 'Uma letra maiúscula',           ok: (p: string) => /[A-Z]/.test(p) },
  { label: 'Um número',                     ok: (p: string) => /[0-9]/.test(p) },
  { label: 'Um caractere especial (!@#$%)', ok: (p: string) => /[!@#$%^&*]/.test(p) },
]

function strength(p: string) {
  const n = RULES.filter(r => r.ok(p)).length
  const labels = ['', 'Muito fraca', 'Fraca', 'Boa', 'Forte']
  const cols   = ['#e6dbc6', '#b8553f', '#d9a05b', '#c4836a', '#6b8a54']
  return { score: n, label: labels[n] || '', color: cols[n] || '#e6dbc6' }
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const t = useColors()

  const [ready,    setReady]    = useState(false)
  const [checking, setChecking] = useState(true)
  const [pw,       setPw]       = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [done,     setDone]     = useState(false)
  const [busy,     setBusy]     = useState(false)
  const [pwFocus,  setPwFocus]  = useState(false)

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
    if (e) setError('Erro ao redefinir. O link pode ter expirado.')
    else {
      setDone(true)
      await supabase.auth.signOut()
      setTimeout(() => navigate('/'), 2500)
    }
    setBusy(false)
  }

  const inp: CSSProperties = {
    width: '100%', height: 44, padding: '0 14px',
    border: `1px solid ${t.border}`, borderRadius: 12,
    fontSize: 14, fontFamily: fontStack,
    color: t.text, background: isDark ? t.surface2 : '#fffcf6',
    outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
  }
  const focus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = t.accent
    e.currentTarget.style.boxShadow = `0 0 0 3px ${t.accent}22`
  }
  const blur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = t.border
    e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.02)'
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: isDark
        ? `radial-gradient(ellipse 90% 70% at 50% 110%, rgba(212,147,128,0.10) 0%, ${t.bg} 55%)`
        : `radial-gradient(ellipse 90% 70% at 50% 110%, ${t.accentSoft} 0%, ${t.bg} 55%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '36px 24px', fontFamily: fontStack, position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes auraSoft { 0%,100% { transform: translateX(-50%) scale(1); opacity: 0.85 } 50% { transform: translateX(-50%) scale(1.08); opacity: 1 } }
        @keyframes fIn { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        *, *::before, *::after { box-sizing: border-box; }
        body { -webkit-font-smoothing: antialiased; }
      `}</style>

      <div style={{
        position: 'absolute', bottom: -160, left: '50%', width: 540, height: 320,
        borderRadius: '50%', filter: 'blur(24px)', pointerEvents: 'none',
        background: `radial-gradient(circle, ${t.accent}30 0%, ${t.accent}0d 40%, transparent 70%)`,
        animation: 'auraSoft 6s ease-in-out infinite',
      }}/>

      <div style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1, animation: 'fIn 0.35s ease' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ filter: `drop-shadow(0 8px 16px ${t.accent}44)` }}>
            <ClaramenteLogo size={64} mode={isDark ? 'dark' : 'light'}/>
          </div>
        </div>

        <div style={{
          background: t.surface, border: `1px solid ${t.border}`, borderRadius: 20,
          padding: '28px 24px',
          boxShadow: isDark
            ? '0 16px 44px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.2)'
            : '0 1px 0 rgba(255,255,255,0.7) inset, 0 16px 44px rgba(106,64,48,0.10), 0 2px 8px rgba(106,64,48,0.04)',
        }}>
          <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: t.accentDeep, fontWeight: 600, margin: '0 0 8px' }}>
            Recuperar senha
          </p>
          <p style={{ fontSize: 22, fontWeight: 600, color: t.text, letterSpacing: -0.5, margin: '0 0 6px' }}>Nova senha</p>
          <p style={{ fontSize: 13, color: t.textSub, lineHeight: 1.6, marginBottom: 22 }}>
            Escolha uma senha segura para sua conta.
          </p>

          {checking && (
            <p style={{ textAlign: 'center', color: t.textMuted, fontSize: 13, padding: '20px 0' }}>
              Verificando link...
            </p>
          )}

          {!checking && !ready && (
            <div style={{
              padding: 14, borderRadius: 12,
              background: `${t.danger}10`, border: `1px solid ${t.danger}33`,
              fontSize: 13, color: t.danger, textAlign: 'center',
            }}>
              Link inválido ou expirado.
              <button onClick={() => navigate('/')} style={{
                display: 'block', margin: '12px auto 0',
                height: 40, padding: '0 22px', borderRadius: 12, border: 'none',
                background: t.accent, color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: fontStack,
                boxShadow: `0 4px 14px ${t.accent}55`,
              }}>
                Solicitar novo link
              </button>
            </div>
          )}

          {done && (
            <div style={{
              padding: 14, borderRadius: 12,
              background: `${t.success}10`, border: `1px solid ${t.success}40`,
              fontSize: 13, color: t.success, textAlign: 'center',
            }}>
              ✓ Senha redefinida! Redirecionando...
            </div>
          )}

          {!checking && ready && !done && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>Nova senha</label>
                <input type="password" value={pw}
                  onChange={e => setPw(e.target.value)}
                  onFocus={e => { focus(e); setPwFocus(true) }}
                  onBlur={blur}
                  placeholder="Crie uma senha forte" style={inp}/>
                {pwFocus && pw.length > 0 && (
                  <div style={{
                    marginTop: 10, padding: 12, borderRadius: 10,
                    background: isDark ? t.surface2 : '#fbf6ec',
                    border: `1px solid ${t.borderSoft}`,
                  }}>
                    <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{
                          flex: 1, height: 3, borderRadius: 2,
                          background: i <= st.score ? st.color : (isDark ? t.border : '#e7dac4'),
                          transition: 'background 0.2s',
                        }}/>
                      ))}
                    </div>
                    {st.label && <p style={{ fontSize: 11, fontWeight: 500, color: st.color, marginBottom: 8 }}>{st.label}</p>}
                    {RULES.map(r => {
                      const passed = r.ok(pw)
                      return (
                        <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                          <div style={{
                            width: 15, height: 15, borderRadius: '50%', flexShrink: 0,
                            background: passed ? 'rgba(107,138,84,0.15)' : (isDark ? t.surface3 : '#f4ede0'),
                            border: `1px solid ${passed ? t.success : t.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {passed && (
                              <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                                <polyline points="2,6 5,9 10,3" stroke={t.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <span style={{ fontSize: 11, color: passed ? t.success : t.textMuted }}>{r.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>Confirmar senha</label>
                <input type="password" value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleReset() }}
                  placeholder="Repita a nova senha"
                  style={{
                    ...inp,
                    borderColor: confirm.length > 3 ? (confirm === pw ? t.success : t.danger) : t.border,
                  }}
                  onFocus={focus} onBlur={blur}/>
                {confirm.length > 3 && (
                  <p style={{ fontSize: 11, marginTop: 4, color: confirm === pw ? t.success : t.danger }}>
                    {confirm === pw ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
                  </p>
                )}
              </div>

              {error && (
                <div style={{
                  padding: '10px 12px', borderRadius: 10,
                  background: `${t.danger}10`, border: `1px solid ${t.danger}33`,
                  fontSize: 13, color: t.danger,
                }}>{error}</div>
              )}

              <button onClick={handleReset} disabled={busy} style={{
                width: '100%', height: 46, borderRadius: 12, border: 'none',
                background: busy ? t.accentSoft : t.accent,
                color: busy ? t.accent : '#fff',
                fontSize: 14.5, fontWeight: 600, fontFamily: fontStack,
                cursor: busy ? 'not-allowed' : 'pointer',
                boxShadow: busy ? 'none' : `0 4px 14px ${t.accent}55, inset 0 1px 0 rgba(255,255,255,0.22)`,
                transition: 'all 0.15s',
              }}>
                {busy ? 'Salvando...' : 'Salvar nova senha'}
              </button>

              <button onClick={() => navigate('/')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: t.textMuted, fontSize: 13, fontFamily: fontStack,
                textAlign: 'center', padding: 0,
              }}>
                ← Voltar ao login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
