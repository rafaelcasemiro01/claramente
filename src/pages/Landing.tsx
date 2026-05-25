// src/pages/Landing.tsx
// ─────────────────────────────────────────────────────────────────────
// Claramente — Landing / Auth (re-themed)
//
// All original auth logic preserved: login / signup / forgot / OTP,
// password strength, email validation, Supabase calls, theme toggle.
// Visual treatment: terracotta & cream palette, new ClaramenteLogo,
// editorial header, breathing aura.
// ─────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import type { CSSProperties, FocusEvent } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'
import { ClaramenteLogo } from '@/components/Logo'
import { useColors, fontStack } from '@/lib/theme'

type Tab = 'login' | 'signup' | 'forgot'
type Step = 'form' | 'otp'

const RULES = [
  { label: 'Mínimo 8 caracteres',            ok: (p: string) => p.length >= 8 },
  { label: 'Uma letra maiúscula',            ok: (p: string) => /[A-Z]/.test(p) },
  { label: 'Um número',                      ok: (p: string) => /[0-9]/.test(p) },
  { label: 'Um caractere especial (!@#$%)',  ok: (p: string) => /[!@#$%^&*]/.test(p) },
]

function pwStrength(p: string) {
  const n = RULES.filter(r => r.ok(p)).length
  return [
    { score: 0, label: '',          color: '#E2E8F0' },
    { score: 1, label: 'Muito fraca', color: '#b8553f' },
    { score: 2, label: 'Fraca',     color: '#d9a05b' },
    { score: 3, label: 'Boa',       color: '#c4836a' },
    { score: 4, label: 'Forte',     color: '#6b8a54' },
  ][n]
}

function checkEmail(v: string) {
  if (!v) return { ok: false, msg: '' }
  if (!v.includes('@')) return { ok: false, msg: 'Deve conter @' }
  const [, d] = v.split('@')
  if (!d?.includes('.')) return { ok: false, msg: 'Domínio inválido' }
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
    ? { ok: true, msg: '' }
    : { ok: false, msg: 'Formato inválido' }
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

export default function Landing() {
  const { signIn, signUp } = useAuth()
  const { isDark, toggle } = useTheme()
  const t = useColors()

  const [tab,    setTab]    = useState<Tab>('login')
  const [step,   setStep]   = useState<Step>('form')
  const [name,   setName]   = useState('')
  const [email,  setEmail]  = useState('')
  const [pw,     setPw]     = useState('')
  const [showPw, setShowPw] = useState(false)
  const [otp,    setOtp]    = useState('')
  const [otpErr, setOtpErr] = useState('')
  const [otpBusy,setOtpBusy]= useState(false)
  const [error,  setError]  = useState('')
  const [info,   setInfo]   = useState('')
  const [busy,   setBusy]   = useState(false)
  const [pwFocus,setPwFocus]= useState(false)

  const ev = checkEmail(email)
  const st = pwStrength(pw)

  function reset() {
    setError(''); setInfo(''); setPw(''); setPwFocus(false); setShowPw(false)
    setOtp(''); setOtpErr(''); setStep('form')
  }
  function switchTab(next: Tab) { reset(); setTab(next) }

  async function submit() {
    setError(''); setInfo(''); setBusy(true)
    if (!email)    { setError('Informe seu e-mail.'); setBusy(false); return }
    if (!ev.ok)    { setError(ev.msg || 'E-mail inválido.'); setBusy(false); return }

    try {
      if (tab === 'forgot') {
        const { error: e } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (e) setError('Erro ao enviar link.')
        else   setInfo('Link enviado! Verifique seu e-mail.')
      } else if (tab === 'login') {
        if (!pw) { setError('Informe sua senha.'); setBusy(false); return }
        const { error: e } = await signIn(email, pw)
        if (e) setError('E-mail ou senha incorretos.')
      } else {
        if (!name.trim()) { setError('Informe seu nome.'); setBusy(false); return }
        const failed = RULES.find(r => !r.ok(pw))
        if (failed) { setError(`Senha inválida: ${failed.label}.`); setBusy(false); return }
        const { error: e } = await signUp(email, pw, name.trim())
        if (e) {
          const msg = (e as { message?: string }).message ?? ''
          setError(msg.toLowerCase().includes('already') ? 'E-mail já cadastrado.' : 'Erro ao criar conta.')
        } else {
          setStep('otp')
        }
      }
    } catch {
      setError('Erro inesperado. Tente novamente.')
    }
    setBusy(false)
  }

  async function verifyOtp() {
    if (otp.length < 6) { setOtpErr('Digite o código completo.'); return }
    setOtpBusy(true); setOtpErr('')
    let result = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
    if (result.error) result = await supabase.auth.verifyOtp({ email, token: otp, type: 'signup' })
    if (result.error) setOtpErr('Código inválido ou expirado. Verifique seu e-mail e tente novamente.')
    else { setInfo('✓ Conta confirmada! Faça login.'); switchTab('login') }
    setOtpBusy(false)
  }

  async function resendOtp() {
    setOtpErr('')
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) setOtpErr('Erro ao reenviar. Tente novamente.')
    else setInfo('Novo código enviado!')
  }

  // ── Reusable styles ────────────────────────────────────────────────
  const inputStyle = (extra?: CSSProperties): CSSProperties => ({
    width: '100%', height: 44, padding: '0 14px',
    border: `1px solid ${t.border}`, borderRadius: 12,
    fontSize: 14, fontFamily: fontStack,
    color: t.text, background: isDark ? t.surface2 : '#fffcf6',
    outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
    ...extra,
  })
  const onFocus = (e: FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = t.accent
    e.currentTarget.style.boxShadow = `0 0 0 3px ${t.accent}22`
  }
  const onBlur = (e: FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = t.border
    e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.02)'
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: isDark
          ? `radial-gradient(ellipse 90% 70% at 50% 110%, rgba(212,147,128,0.10) 0%, ${t.bg} 55%)`
          : `radial-gradient(ellipse 90% 70% at 50% 110%, ${t.accentSoft} 0%, ${t.bg} 55%)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '36px 24px', fontFamily: fontStack, position: 'relative', overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes auraSoft { 0%,100% { transform: translateX(-50%) scale(1); opacity: 0.85 } 50% { transform: translateX(-50%) scale(1.08); opacity: 1 } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        input::placeholder { color: ${t.textMuted} !important; opacity: 0.7; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px ${isDark ? t.surface2 : '#fffcf6'} inset !important;
          -webkit-text-fill-color: ${t.text} !important;
        }
        .otp-input { text-align: center; letter-spacing: 8px; font-size: 22px !important; font-weight: 700 !important; }
      `}</style>

      {/* Breathing aura at bottom */}
      <div style={{
        position: 'absolute', bottom: -160, left: '50%', width: 540, height: 320,
        borderRadius: '50%', filter: 'blur(24px)', pointerEvents: 'none',
        background: `radial-gradient(circle, ${t.accent}30 0%, ${t.accent}0d 40%, transparent 70%)`,
        animation: 'auraSoft 6s ease-in-out infinite',
      }}/>

      {/* Theme toggle */}
      <button
        onClick={toggle}
        title="Tema"
        style={{
          position: 'fixed', top: 16, right: 16, width: 38, height: 38, borderRadius: 10,
          border: `1px solid ${t.border}`, background: t.surface, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.textSub} strokeWidth="2" strokeLinecap="round">
          {isDark ? (
            <>
              <circle cx="12" cy="12" r="4"/>
              <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
            </>
          ) : (
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          )}
        </svg>
      </button>

      <div style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1, animation: 'fadeIn 0.4s ease' }}>
        {/* Mascot */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ filter: `drop-shadow(0 8px 16px ${t.accent}44)` }}>
            <ClaramenteLogo size={72} mode={isDark ? 'dark' : 'light'} breathing/>
          </div>
        </div>

        {/* Editorial header */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: t.accentDeep, fontWeight: 600, margin: '0 0 10px' }}>
            Claramente
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: t.text, letterSpacing: -0.8, lineHeight: 1.15, margin: '0 0 10px' }}>
            Um espaço para{' '}
            <span style={{ color: t.accentDeep, fontStyle: 'italic', fontWeight: 500 }}>respirar.</span>
          </h1>
          <p style={{ fontSize: 13.5, color: t.textSub, lineHeight: 1.6, margin: 0 }}>
            Converse, reflita e encontre clareza.<br/>Sem julgamento, no seu tempo.
          </p>
        </div>

        {/* ───────── OTP step ───────── */}
        {step === 'otp' && (
          <div style={cardStyle(t, isDark)}>
            <div style={{ padding: 28, textAlign: 'center' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, margin: '0 auto 16px',
                background: t.accentSoft, border: `1px solid ${t.accentBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="1.5" strokeLinecap="round">
                  <rect x="2" y="4" width="20" height="16" rx="3"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 6 }}>Verifique seu e-mail</p>
              <p style={{ fontSize: 13, color: t.textSub, lineHeight: 1.6, marginBottom: 22 }}>
                Enviamos um código de verificação para<br/>
                <strong style={{ color: t.text }}>{email}</strong>
              </p>

              <input
                className="otp-input"
                type="text" inputMode="numeric" maxLength={8}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                onKeyDown={e => { if (e.key === 'Enter') verifyOtp() }}
                placeholder="00000000"
                style={inputStyle({ height: 52 })}
                onFocus={onFocus} onBlur={onBlur}
                autoFocus
              />

              {otpErr && <Alert kind="error" t={t}>{otpErr}</Alert>}
              {info   && <Alert kind="ok"    t={t}>{info}</Alert>}

              <button
                onClick={verifyOtp}
                disabled={otpBusy || otp.length < 6}
                style={primaryBtn(t, otpBusy || otp.length < 6)}
              >
                {otpBusy ? 'Verificando...' : 'Confirmar código'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                <button onClick={resendOtp} style={textLink(t.accentDeep)}>Reenviar código</button>
                <button onClick={() => { setStep('form'); setOtp(''); setOtpErr('') }} style={textLink(t.textMuted)}>← Voltar</button>
              </div>
            </div>
          </div>
        )}

        {/* ───────── Form step ───────── */}
        {step === 'form' && (
          <div style={cardStyle(t, isDark)}>
            {tab !== 'forgot' && (
              <div style={{ display: 'flex', padding: 6, gap: 4, background: t.surface2, borderBottom: `1px solid ${t.borderSoft}` }}>
                {(['login', 'signup'] as Tab[]).map(k => (
                  <button
                    key={k}
                    onClick={() => switchTab(k)}
                    style={{
                      flex: 1, height: 36, border: 'none', cursor: 'pointer',
                      borderRadius: 10, fontFamily: fontStack, fontSize: 13,
                      fontWeight: tab === k ? 600 : 500,
                      color: tab === k ? t.text : t.textMuted,
                      background: tab === k ? t.surface : 'transparent',
                      boxShadow: tab === k ? (isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(106,64,48,0.08)') : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {k === 'login' ? 'Entrar' : 'Criar conta'}
                  </button>
                ))}
              </div>
            )}

            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {tab === 'forgot' && (
                <div>
                  <button onClick={() => switchTab('login')} style={{ ...textLink(t.textMuted), display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                    </svg>
                    Voltar
                  </button>
                  <p style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 4 }}>Recuperar senha</p>
                  <p style={{ fontSize: 13, color: t.textSub, lineHeight: 1.6 }}>Enviaremos um link de redefinição.</p>
                </div>
              )}

              {tab === 'signup' && (
                <Field label="Nome" t={t}>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Como gostaria de ser chamado?" style={inputStyle()} onFocus={onFocus} onBlur={onBlur}/>
                </Field>
              )}

              <Field label="E-mail" t={t}>
                <input
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submit() }}
                  placeholder="seu@email.com"
                  style={inputStyle({ borderColor: email.length > 4 && ev.ok ? t.success : t.border })}
                  onFocus={onFocus} onBlur={onBlur}
                />
                {email.length > 4 && !ev.ok && ev.msg && (
                  <p style={{ fontSize: 11, color: t.danger, marginTop: 4 }}>{ev.msg}</p>
                )}
              </Field>

              {tab !== 'forgot' && (
                <Field label="Senha" t={t} right={tab === 'login' && (
                  <button onClick={() => switchTab('forgot')} style={textLink(t.accentDeep)}>Esqueceu?</button>
                )}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'} value={pw}
                      onChange={e => setPw(e.target.value)}
                      onFocus={e => { onFocus(e); setPwFocus(true) }}
                      onBlur={onBlur}
                      onKeyDown={e => { if (e.key === 'Enter') submit() }}
                      placeholder={tab === 'signup' ? 'Crie uma senha forte' : '••••••••'}
                      style={inputStyle({ paddingRight: 42 })}
                    />
                    <button
                      onClick={() => setShowPw(p => !p)}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted,
                        display: 'flex', padding: 4, borderRadius: 4,
                      }}
                    >
                      <EyeIcon open={showPw}/>
                    </button>
                  </div>

                  {tab === 'signup' && pwFocus && pw.length > 0 && (
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
                        const ok = r.ok(pw)
                        return (
                          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                            <div style={{
                              width: 15, height: 15, borderRadius: '50%', flexShrink: 0,
                              background: ok ? 'rgba(107,138,84,0.15)' : (isDark ? t.surface3 : '#f4ede0'),
                              border: `1px solid ${ok ? t.success : t.border}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {ok && (
                                <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                                  <polyline points="2,6 5,9 10,3" stroke={t.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            <span style={{ fontSize: 11, color: ok ? t.success : t.textMuted }}>{r.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Field>
              )}

              {error && <Alert kind="error" t={t}>{error}</Alert>}
              {info  && <Alert kind="ok"    t={t}>{info}</Alert>}

              <button
                onClick={submit}
                disabled={busy}
                style={primaryBtn(t, busy)}
                onMouseEnter={e => { if (!busy) e.currentTarget.style.filter = 'brightness(1.08)' }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)' }}
              >
                {busy ? 'Aguarde...' : tab === 'login' ? 'Entrar' : tab === 'signup' ? 'Criar conta' : 'Enviar link'}
              </button>
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: t.textMuted, marginTop: 18, lineHeight: 1.6 }}>
          <span style={{ color: t.textSub, textDecoration: 'underline', textUnderlineOffset: 2 }}>Termos</span>
          {'  ·  '}
          <span style={{ color: t.textSub, textDecoration: 'underline', textUnderlineOffset: 2 }}>Privacidade</span>
        </p>
      </div>
    </div>
  )
}

// ── Small reusable bits ─────────────────────────────────────────────
type T = ReturnType<typeof useColors>

function cardStyle(t: T, isDark: boolean): CSSProperties {
  return {
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: isDark
      ? '0 16px 44px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.2)'
      : '0 1px 0 rgba(255,255,255,0.7) inset, 0 16px 44px rgba(106,64,48,0.10), 0 2px 8px rgba(106,64,48,0.04)',
  }
}

function primaryBtn(t: T, disabled: boolean): CSSProperties {
  return {
    width: '100%', height: 46, borderRadius: 12, border: 'none',
    background: disabled ? t.accentSoft : t.accent,
    color: disabled ? t.accent : '#fff',
    fontSize: 14.5, fontWeight: 600, fontFamily: fontStack, letterSpacing: 0.1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s', marginTop: 4,
    boxShadow: disabled ? 'none' : `0 4px 14px ${t.accent}55, inset 0 1px 0 rgba(255,255,255,0.22)`,
  }
}

function textLink(color: string): CSSProperties {
  return {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: 500, color, fontFamily: fontStack, padding: 0,
  }
}

function Field({ label, children, t, right }: { label: string; children: React.ReactNode; t: T; right?: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: t.text, letterSpacing: 0.1 }}>{label}</label>
        {right}
      </div>
      {children}
    </div>
  )
}

function Alert({ kind, t, children }: { kind: 'error' | 'ok'; t: T; children: React.ReactNode }) {
  const danger = kind === 'error'
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 10,
      background: danger ? 'rgba(184,85,63,0.08)' : 'rgba(107,138,84,0.08)',
      border: `1px solid ${danger ? 'rgba(184,85,63,0.25)' : 'rgba(107,138,84,0.25)'}`,
      fontSize: 13, color: danger ? t.danger : t.success,
    }}>
      {children}
    </div>
  )
}
