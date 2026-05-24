// src/pages/Profile.tsx
// ─────────────────────────────────────────────────────────────────────
// Página de Perfil completa — exibe e permite editar todos os dados
// do cadastro (nome, email) + dados do onboarding (telefone, data de
// nascimento, gênero, orientação, pronomes, razões, estilo da IA).
// ─────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'
import { useColors, fontStack } from '@/lib/theme'
import { ClaramenteLogo } from '@/components/Logo'

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
  { value: 'acolhedor', label: 'Acolhedor', desc: 'Empático e gentil' },
  { value: 'informal',  label: 'Informal',  desc: 'Descontraído, próximo' },
  { value: 'formal',    label: 'Formal',    desc: 'Profissional e direto' },
  { value: 'reflexivo', label: 'Reflexivo', desc: 'Perguntas e introspecção' },
]

interface ProfileData {
  name: string
  phone: string
  birth_date: string
  gender_identity: string
  sexual_orientation: string
  pronouns: string
  reasons: string[]
  ai_style: string
}

export default function Profile() {
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  const { isDark } = useTheme()
  const t = useColors()
  const mode = isDark ? 'dark' : 'light'

  const [data, setData] = useState<ProfileData>({
    name: '', phone: '', birth_date: '',
    gender_identity: '', sexual_orientation: '', pronouns: '',
    reasons: [], ai_style: 'acolhedor',
  })
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState<string | null>(null)

  // Carregar dados do Supabase
  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data: p }) => {
        if (p) setData({
          name:               p.name ?? profile?.name ?? '',
          phone:              p.phone ?? '',
          birth_date:         p.birth_date ?? '',
          gender_identity:    p.gender_identity ?? '',
          sexual_orientation: p.sexual_orientation ?? '',
          pronouns:           p.pronouns ?? '',
          reasons:            p.reasons ?? [],
          ai_style:           p.ai_style ?? 'acolhedor',
        })
        setLoading(false)
      })
  }, [user, profile])

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

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      name:               data.name || null,
      phone:              data.phone || null,
      birth_date:         data.birth_date || null,
      gender_identity:    data.gender_identity || null,
      sexual_orientation: data.sexual_orientation || null,
      pronouns:           data.pronouns || null,
      reasons:            data.reasons.length ? data.reasons : null,
      ai_style:           data.ai_style,
    }).eq('id', user.id)
    setSaving(false)
    setToast(error ? 'Erro ao salvar. Tente novamente.' : 'Salvo com sucesso!')
    setTimeout(() => setToast(null), 3000)
  }

  // ── estilos comuns ──────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: t.surface, border: `1px solid ${t.border}`,
    borderRadius: 16, padding: '20px 22px', marginBottom: 16,
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: t.textSub,
    textTransform: 'uppercase', letterSpacing: '0.8px',
    marginBottom: 6, display: 'block',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 14px', borderRadius: 10,
    border: `1px solid ${t.border}`,
    background: t.bg, color: t.text,
    fontSize: 14, fontFamily: fontStack, outline: 'none',
  }
  const chipBase: React.CSSProperties = {
    padding: '6px 14px', borderRadius: 999,
    border: `1px solid ${t.border}`,
    background: t.surface, color: t.textSub,
    fontSize: 13, cursor: 'pointer',
    transition: 'all 0.15s', fontFamily: fontStack,
  }
  const chipActive: React.CSSProperties = {
    ...chipBase,
    background: t.accentSoft,
    border: `1px solid ${t.accent}`,
    color: t.accentDeep, fontWeight: 600,
  }
  const sectionTitle: React.CSSProperties = {
    fontSize: 17, fontWeight: 600, color: t.text,
    margin: '0 0 16px', letterSpacing: -0.2,
  }

  if (loading) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg }}>
        <p style={{ color: t.textMuted, fontFamily: fontStack }}>Carregando...</p>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh', background: t.bg, color: t.text,
      fontFamily: fontStack, padding: '24px 16px 80px',
    }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Header */}
        <header style={{
          display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28,
        }}>
          <button
            onClick={() => navigate('/app')}
            aria-label="Voltar"
            style={{
              width: 38, height: 38, borderRadius: 10,
              border: `1px solid ${t.border}`, background: t.surface,
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.textSub} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <ClaramenteLogo size={28} mode={mode}/>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: -0.3 }}>
            Meu Perfil
          </h1>
        </header>

        {/* Avatar + nome */}
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: t.accent, color: '#faf6f0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700, flexShrink: 0,
          }}>
            {(data.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 17, fontWeight: 600, color: t.text, margin: 0, lineHeight: 1.3 }}>
              {data.name || 'Sem nome'}
            </p>
            <p style={{ fontSize: 13, color: t.textMuted, margin: 0, lineHeight: 1.3, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </p>
          </div>
        </div>

        {/* ── Dados básicos ── */}
        <div style={cardStyle}>
          <h2 style={sectionTitle}>Dados básicos</h2>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Nome completo</label>
            <input
              type="text" value={data.name}
              onChange={e => update('name', e.target.value)}
              style={inputStyle} placeholder="Seu nome"
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>E-mail</label>
            <input
              type="email" value={user?.email ?? ''} disabled
              style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }}
            />
            <p style={{ fontSize: 11, color: t.textMuted, margin: '4px 0 0' }}>
              O e-mail não pode ser alterado.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Telefone</label>
              <input
                type="tel" value={data.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder="(11) 99999-9999" style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Data de nascimento</label>
              <input
                type="date" value={data.birth_date}
                onChange={e => update('birth_date', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* ── Identidade ── */}
        <div style={cardStyle}>
          <h2 style={sectionTitle}>Identidade</h2>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Identidade de gênero</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {GENDER_OPTIONS.map(g => (
                <button key={g} onClick={() => update('gender_identity', g)}
                  style={data.gender_identity === g ? chipActive : chipBase}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Orientação sexual</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ORIENTATION_OPTIONS.map(o => (
                <button key={o} onClick={() => update('sexual_orientation', o)}
                  style={data.sexual_orientation === o ? chipActive : chipBase}>
                  {o}
                </button>
              ))}
            </div>
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

        {/* ── Preferências ── */}
        <div style={cardStyle}>
          <h2 style={sectionTitle}>Preferências</h2>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>O que te trouxe ao Claramente?</label>
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
                  key={s.value} onClick={() => update('ai_style', s.value)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: 12,
                    border: `1px solid ${data.ai_style === s.value ? t.accent : t.border}`,
                    background: data.ai_style === s.value ? t.accentSoft : t.surface,
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s', fontFamily: fontStack,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: data.ai_style === s.value ? t.accentDeep : t.text }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 12, color: t.textSub }}>{s.desc}</div>
                  </div>
                  {data.ai_style === s.value && <span style={{ fontSize: 18, color: t.accent }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Botão salvar */}
        <button
          onClick={handleSave} disabled={saving}
          style={{
            width: '100%', padding: '14px 24px', borderRadius: 12,
            border: 'none', background: t.accent, color: '#faf6f0',
            fontSize: 15, fontWeight: 600, cursor: saving ? 'wait' : 'pointer',
            fontFamily: fontStack, opacity: saving ? 0.7 : 1,
            transition: 'opacity 0.15s',
            boxShadow: `0 4px 14px ${t.accent}44`,
          }}
        >
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: t.text, color: t.bg, padding: '12px 20px',
          borderRadius: 999, fontSize: 14, fontWeight: 500, fontFamily: fontStack,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 100,
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}