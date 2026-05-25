// src/pages/Onboarding.tsx
// ─────────────────────────────────────────────────────────────────────
// Tela pós-cadastro. Coleta informações para a IA acolher cada pessoa
// de forma respeitosa e inclusiva. Tudo opcional, sempre com a opção
// "Prefiro não dizer".
//
// Pré-requisito: rode `migration/supabase-migration.sql` no Supabase
// para adicionar as colunas em `profiles`.
// ─────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'
import { ClaramenteLogo } from '@/components/Logo'
import { useColors, fontStack } from '@/lib/theme'

// ── Opções inclusivas ─────────────────────────────────────────────────
const PRONOUNS = [
  { value: 'ele/dele',   label: 'Ele / Dele' },
  { value: 'ela/dela',   label: 'Ela / Dela' },
  { value: 'elu/delu',   label: 'Elu / Delu' },
  { value: 'outro',      label: 'Outro' },
  { value: 'nao_dizer',  label: 'Prefiro não dizer' },
]

const GENDERS = [
  { value: 'mulher_cis',     label: 'Mulher cisgênero' },
  { value: 'homem_cis',      label: 'Homem cisgênero' },
  { value: 'mulher_trans',   label: 'Mulher trans' },
  { value: 'homem_trans',    label: 'Homem trans' },
  { value: 'nao_binarie',    label: 'Não-binárie' },
  { value: 'genderfluid',    label: 'Gênero fluido' },
  { value: 'agenero',        label: 'Agênero' },
  { value: 'outro',          label: 'Outro' },
  { value: 'nao_dizer',      label: 'Prefiro não dizer' },
]

const ORIENTATIONS = [
  { value: 'heterossexual', label: 'Heterossexual' },
  { value: 'homossexual',   label: 'Homossexual' },
  { value: 'bissexual',     label: 'Bissexual' },
  { value: 'pansexual',     label: 'Pansexual' },
  { value: 'assexual',      label: 'Assexual' },
  { value: 'queer',         label: 'Queer' },
  { value: 'outro',         label: 'Outro' },
  { value: 'nao_dizer',     label: 'Prefiro não dizer' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth() as ReturnType<typeof useAuth> & { refreshProfile?: () => Promise<void> }
  const { isDark, toggle } = useTheme()
  const t = useColors()

  const [pronouns,    setPronouns]    = useState<string>('')
  const [gender,      setGender]      = useState<string>('')
  const [orientation, setOrientation] = useState<string>('')
  const [birthDate,   setBirthDate]   = useState<string>('')
  const [phone,       setPhone]       = useState<string>('')

  const [busy,  setBusy]  = useState(false)
  const [error, setError] = useState('')

  const firstName = profile?.name?.split(' ')[0] || 'você'

  async function handleSubmit() {
    if (!user) return
    setBusy(true); setError('')
    const payload: Record<string, unknown> = {
      onboarding_completed: true,
    }
    if (pronouns)    payload.pronouns           = pronouns
    if (gender)      payload.gender             = gender
    if (orientation) payload.sexual_orientation = orientation
    if (birthDate)   payload.birth_date         = birthDate
    if (phone)       payload.phone              = phone.replace(/\D/g, '')

    const { error: e } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)

    if (e) {
      setError('Erro ao salvar. Verifique se as colunas foram criadas no Supabase (veja supabase-migration.sql).')
      setBusy(false)
      return
    }

    await refreshProfile?.()
    navigate('/app', { replace: true })
  }

  async function handleSkip() {
    if (!user) return
    setBusy(true)
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id)
    await refreshProfile?.()
    navigate('/app', { replace: true })
  }

  // ── styles ──────────────────────────────────────────────────────────
  const inp: CSSProperties = {
    width: '100%', height: 44, padding: '0 14px',
    border: `1px solid ${t.border}`, borderRadius: 12,
    fontSize: 14, fontFamily: fontStack,
    color: t.text, background: isDark ? t.surface2 : '#fffcf6',
    outline: 'none',
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: isDark
        ? `radial-gradient(ellipse 90% 70% at 50% 110%, rgba(212,147,128,0.10) 0%, ${t.bg} 55%)`
        : `radial-gradient(ellipse 90% 70% at 50% 110%, ${t.accentSoft} 0%, ${t.bg} 55%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '36px 20px', fontFamily: fontStack, position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes auraSoft { 0%,100% { transform: translateX(-50%) scale(1); opacity: 0.85 } 50% { transform: translateX(-50%) scale(1.08); opacity: 1 } }
        @keyframes fIn { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        *, *::before, *::after { box-sizing: border-box; }
        body { -webkit-font-smoothing: antialiased; }
        select { -webkit-appearance: none; -moz-appearance: none; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a7a6e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px !important; }
      `}</style>

      <div style={{
        position: 'absolute', bottom: -160, left: '50%', width: 540, height: 320,
        borderRadius: '50%', filter: 'blur(24px)', pointerEvents: 'none',
        background: `radial-gradient(circle, ${t.accent}30 0%, ${t.accent}0d 40%, transparent 70%)`,
        animation: 'auraSoft 6s ease-in-out infinite',
      }}/>

      <button onClick={toggle} title="Tema" style={{
        position: 'fixed', top: 16, right: 16, width: 38, height: 38, borderRadius: 10,
        border: `1px solid ${t.border}`, background: t.surface, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.textSub} strokeWidth="2" strokeLinecap="round">
          {isDark
            ? <><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/></>
            : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>}
        </svg>
      </button>

      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1, animation: 'fIn 0.4s ease' }}>
        {/* Mascot + Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 26 }}>
          <div style={{ filter: `drop-shadow(0 8px 16px ${t.accent}44)`, marginBottom: 16 }}>
            <ClaramenteLogo size={68} mode={isDark ? 'dark' : 'light'} breathing/>
          </div>
          <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: t.accentDeep, fontWeight: 600, margin: '0 0 8px' }}>
            Bem-vinde
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: t.text, letterSpacing: -0.7, margin: '0 0 10px', textAlign: 'center' }}>
            Olá, {firstName}.{' '}
            <span style={{ color: t.accentDeep, fontStyle: 'italic', fontWeight: 500 }}>Vamos nos conhecer?</span>
          </h1>
          <p style={{ fontSize: 13.5, color: t.textSub, lineHeight: 1.6, textAlign: 'center', maxWidth: 380 }}>
            Essas informações ajudam o Claramente a te acolher com mais cuidado e respeito. Tudo aqui é opcional e seguro.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: t.surface, border: `1px solid ${t.border}`, borderRadius: 20,
          padding: 24,
          boxShadow: isDark
            ? '0 16px 44px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.2)'
            : '0 1px 0 rgba(255,255,255,0.7) inset, 0 16px 44px rgba(106,64,48,0.10), 0 2px 8px rgba(106,64,48,0.04)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Pronome — segmented */}
            <div>
              <label style={labelStyle(t)}>Pronome</label>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 6,
              }}>
                {PRONOUNS.map(p => {
                  const active = pronouns === p.value
                  return (
                    <button key={p.value} type="button" onClick={() => setPronouns(active ? '' : p.value)}
                      style={{
                        padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                        background: active ? t.accentSoft : 'transparent',
                        border: `1px solid ${active ? t.accent : t.border}`,
                        color: active ? t.accentDeep : t.textSub,
                        fontSize: 13, fontWeight: active ? 600 : 500, fontFamily: fontStack,
                        transition: 'all 0.12s',
                      }}>
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Gênero — select */}
            <div>
              <label style={labelStyle(t)}>Gênero</label>
              <select value={gender} onChange={e => setGender(e.target.value)} style={inp}>
                <option value="">Selecione...</option>
                {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>

            {/* Orientação — select */}
            <div>
              <label style={labelStyle(t)}>Orientação sexual</label>
              <select value={orientation} onChange={e => setOrientation(e.target.value)} style={inp}>
                <option value="">Selecione...</option>
                {ORIENTATIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Data de nascimento */}
            <div>
              <label style={labelStyle(t)}>Data de nascimento</label>
              <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} style={inp}/>
            </div>

            {/* Telefone */}
            <div>
              <label style={labelStyle(t)}>Telefone (opcional)</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                style={inp}
              />
              <p style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>
                Útil para emergências. Nunca compartilhamos com terceiros.
              </p>
            </div>

            {error && (
              <div style={{
                padding: '10px 12px', borderRadius: 10,
                background: 'rgba(184,85,63,0.08)', border: '1px solid rgba(184,85,63,0.25)',
                fontSize: 13, color: t.danger,
              }}>{error}</div>
            )}

            <button onClick={handleSubmit} disabled={busy} style={{
              width: '100%', height: 46, borderRadius: 12, border: 'none', marginTop: 4,
              background: busy ? t.accentSoft : t.accent,
              color: busy ? t.accent : '#fff',
              fontSize: 14.5, fontWeight: 600, fontFamily: fontStack,
              cursor: busy ? 'not-allowed' : 'pointer',
              boxShadow: busy ? 'none' : `0 4px 14px ${t.accent}55, inset 0 1px 0 rgba(255,255,255,0.22)`,
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { if (!busy) e.currentTarget.style.filter = 'brightness(1.08)' }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)' }}>
              {busy ? 'Salvando...' : 'Continuar'}
            </button>

            <button onClick={handleSkip} disabled={busy} style={{
              background: 'none', border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
              color: t.textMuted, fontSize: 13, fontFamily: fontStack, padding: 4,
            }}>
              Pular por enquanto
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: t.textMuted, marginTop: 18, lineHeight: 1.6 }}>
          Você pode atualizar tudo isso depois no seu perfil.
        </p>
      </div>
    </div>
  )
}

function labelStyle(t: ReturnType<typeof useColors>): CSSProperties {
  return {
    display: 'block', fontSize: 12, fontWeight: 600, color: t.text,
    marginBottom: 8, letterSpacing: 0.1, fontFamily: fontStack,
  }
}

function formatPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2)  return d
  if (d.length <= 7)  return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
