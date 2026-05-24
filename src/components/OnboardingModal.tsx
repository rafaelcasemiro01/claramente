// src/components/OnboardingModal.tsx
// ─────────────────────────────────────────────────────────────────────
// Modal de onboarding pós-login (3 etapas).
// Aparece uma única vez: quando profiles.onboarding_complete = false.
//
// Como usar em Home.tsx:
//   import { OnboardingModal } from '@/components/OnboardingModal'
//   // no JSX, adicione dentro do return, no final:
//   <OnboardingModal />
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { useColors } from '@/lib/theme'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

// ── tipos ─────────────────────────────────────────────────────────────
interface ProfileData {
  phone: string
  birth_date: string
  gender_identity: string
  gender_custom: string
  sexual_orientation: string
  orientation_custom: string
  pronouns: string
  reasons: string[]
  ai_style: string
}

const GENDER_OPTIONS = [
  'Homem cis', 'Mulher cis', 'Homem trans', 'Mulher trans',
  'Não-binário', 'Gênero fluido', 'Prefiro não informar', 'Outro',
]
const ORIENTATION_OPTIONS = [
  'Heterossexual', 'Homossexual', 'Bissexual', 'Pansexual',
  'Assexual', 'Prefiro não informar', 'Outro',
]
const PRONOUN_OPTIONS = ['ele/dele', 'ela/dela', 'elu/delu', 'Prefiro não informar']
const REASON_OPTIONS = [
  'Ansiedade', 'Depressão', 'Autoconhecimento', 'Luto',
  'Relacionamentos', 'Trabalho/estresse', 'Sono', 'Outro',
]
const AI_STYLES = [
  { value: 'acolhedor',  label: 'Acolhedor',  desc: 'Empático e gentil'     },
  { value: 'informal',   label: 'Informal',   desc: 'Descontraído, próximo'  },
  { value: 'formal',     label: 'Formal',     desc: 'Profissional e direto'  },
  { value: 'reflexivo',  label: 'Reflexivo',  desc: 'Perguntas e introspecção' },
]

const STEPS = ['Sobre você', 'Identidade', 'Preferências']

// ── componente principal ──────────────────────────────────────────────
export function OnboardingModal() {
  const c = useColors()
  const { user } = useAuth()
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<ProfileData>({
    phone: '', birth_date: '',
    gender_identity: '', gender_custom: '',
    sexual_orientation: '', orientation_custom: '',
    pronouns: '',
    reasons: [],
    ai_style: 'acolhedor',
  })

  // Verificar se onboarding já foi feito
  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single()
      .then(({ data: profile }) => {
        if (profile && !profile.onboarding_complete) setVisible(true)
      })
  }, [user])

  const update = (field: keyof ProfileData, value: string | string[]) =>
    setData(prev => ({ ...prev, [field]: value }))

  const toggleReason = (r: string) => {
    setData(prev => ({
      ...prev,
      reasons: prev.reasons.includes(r)
        ? prev.reasons.filter(x => x !== r)
        : [...prev.reasons, r],
    }))
  }

  const handleSave = async (skip = false) => {
    if (!user) return
    setSaving(true)
    const payload = skip ? { onboarding_complete: true } : {
      phone:              data.phone || null,
      birth_date:         data.birth_date || null,
      gender_identity:    data.gender_identity === 'Outro' ? data.gender_custom : data.gender_identity || null,
      sexual_orientation: data.sexual_orientation === 'Outro' ? data.orientation_custom : data.sexual_orientation || null,
      pronouns:           data.pronouns || null,
      reasons:            data.reasons.length ? data.reasons : null,
      ai_style:           data.ai_style,
      onboarding_complete: true,
    }
    await supabase.from('profiles').update(payload).eq('id', user.id)
    setSaving(false)
    setVisible(false)
  }

  if (!visible) return null

  // ── estilos base ──────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 14px', borderRadius: 12,
    border: `1px solid ${c.border}`,
    background: c.surface, color: c.text,
    fontSize: 14, fontFamily: 'inherit',
    outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: c.textSub,
    textTransform: 'uppercase', letterSpacing: '0.8px',
    marginBottom: 6, display: 'block',
  }
  const chipBase: React.CSSProperties = {
    padding: '6px 14px', borderRadius: 999,
    border: `1px solid ${c.border}`,
    background: c.surface, color: c.textSub,
    fontSize: 13, cursor: 'pointer',
    transition: 'all 0.15s',
  }
  const chipActive: React.CSSProperties = {
    ...chipBase,
    background: c.accentSoft,
    border: `1px solid ${c.accent}`,
    color: c.accentDeep,
    fontWeight: 600,
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Complete seu perfil"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(42,31,26,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{
        background: c.bg, borderRadius: 24,
        width: '100%', maxWidth: 480,
        maxHeight: '90vh', overflowY: 'auto',
        padding: '32px 28px 24px',
        boxShadow: '0 24px 60px rgba(42,31,26,0.25)',
      }}>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0, gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: i <= step ? c.accent : c.surface2,
                color: i <= step ? '#faf6f0' : c.textMuted,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600, flexShrink: 0,
                transition: 'all 0.2s',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 12, color: i === step ? c.text : c.textMuted, fontWeight: i === step ? 600 : 400 }}>
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: i < step ? c.accent : c.border }}/>
              )}
            </div>
          ))}
        </div>

        {/* ── Etapa 1: Sobre você ── */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: c.text, margin: '0 0 4px' }}>
                Olá! Vamos nos conhecer?
              </h2>
              <p style={{ fontSize: 14, color: c.textSub, margin: 0, lineHeight: 1.6 }}>
                Esses dados ajudam o Claramente a conversar com você da forma certa.
                Tudo é opcional e privado.
              </p>
            </div>

            <div>
              <label style={labelStyle}>Telefone</label>
              <input
                type="tel"
                placeholder="(11) 99999-9999"
                value={data.phone}
                onChange={e => update('phone', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Data de nascimento</label>
              <input
                type="date"
                value={data.birth_date}
                onChange={e => update('birth_date', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        )}

        {/* ── Etapa 2: Identidade ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: c.text, margin: '0 0 4px' }}>
                Sua identidade
              </h2>
              <p style={{ fontSize: 14, color: c.textSub, margin: 0, lineHeight: 1.6 }}>
                Essas informações ajudam a IA a usar os pronomes e a linguagem certa com você.
              </p>
            </div>

            <div>
              <label style={labelStyle}>Identidade de gênero</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {GENDER_OPTIONS.map(g => (
                  <button key={g} onClick={() => update('gender_identity', g)}
                    style={data.gender_identity === g ? chipActive : chipBase}>
                    {g}
                  </button>
                ))}
              </div>
              {data.gender_identity === 'Outro' && (
                <input
                  placeholder="Descreva sua identidade"
                  value={data.gender_custom}
                  onChange={e => update('gender_custom', e.target.value)}
                  style={{ ...inputStyle, marginTop: 8 }}
                />
              )}
            </div>

            <div>
              <label style={labelStyle}>Orientação sexual</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ORIENTATION_OPTIONS.map(o => (
                  <button key={o} onClick={() => update('sexual_orientation', o)}
                    style={data.sexual_orientation === o ? chipActive : chipBase}>
                    {o}
                  </button>
                ))}
              </div>
              {data.sexual_orientation === 'Outro' && (
                <input
                  placeholder="Descreva sua orientação"
                  value={data.orientation_custom}
                  onChange={e => update('orientation_custom', e.target.value)}
                  style={{ ...inputStyle, marginTop: 8 }}
                />
              )}
            </div>

            <div>
              <label style={labelStyle}>Pronomes</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PRONOUN_OPTIONS.map(p => (
                  <button key={p} onClick={() => update('pronouns', p)}
                    style={data.pronouns === p ? chipActive : chipBase}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Etapa 3: Preferências ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: c.text, margin: '0 0 4px' }}>
                Como posso te ajudar?
              </h2>
              <p style={{ fontSize: 14, color: c.textSub, margin: 0, lineHeight: 1.6 }}>
                Escolha o que trouxe você aqui e como prefere que eu me comunique.
              </p>
            </div>

            <div>
              <label style={labelStyle}>O que te trouxe ao Claramente? (múltiplos)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {REASON_OPTIONS.map(r => (
                  <button key={r} onClick={() => toggleReason(r)}
                    style={data.reasons.includes(r) ? chipActive : chipBase}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Como prefere que eu me comunique?</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {AI_STYLES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => update('ai_style', s.value)}
                    style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px', borderRadius: 14,
                      border: `1px solid ${data.ai_style === s.value ? c.accent : c.border}`,
                      background: data.ai_style === s.value ? c.accentSoft : c.surface,
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: data.ai_style === s.value ? c.accentDeep : c.text }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: 12, color: c.textSub }}>{s.desc}</div>
                    </div>
                    {data.ai_style === s.value && (
                      <span style={{ fontSize: 16, color: c.accent }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Botões de navegação */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, gap: 12 }}>
          <button
            onClick={() => handleSave(true)}
            style={{
              background: 'none', border: 'none',
              color: c.textMuted, fontSize: 13,
              cursor: 'pointer', padding: '8px 0',
            }}
          >
            Pular por agora
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{
                  padding: '10px 20px', borderRadius: 12,
                  border: `1px solid ${c.border}`,
                  background: c.surface, color: c.text,
                  fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Voltar
              </button>
            )}
            <button
              onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : handleSave(false)}
              disabled={saving}
              style={{
                padding: '10px 24px', borderRadius: 12,
                border: 'none',
                background: c.accent, color: '#faf6f0',
                fontSize: 14, fontWeight: 600,
                cursor: saving ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                opacity: saving ? 0.7 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {saving ? 'Salvando…' : step < STEPS.length - 1 ? 'Continuar →' : 'Concluir ✓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
