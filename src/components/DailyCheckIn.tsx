// src/components/DailyCheckIn.tsx
// ─────────────────────────────────────────────────────────────────────
// Card de check-in diário de humor.
//   • Estado A: usuário ainda não fez check-in hoje → mostra emojis
//   • Estado B: emoji selecionado → mostra textarea opcional
//   • Estado C: já fez check-in → mostra resumo do que registrou
// ─────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useColors, fontStack } from '@/lib/theme'
import { useDailyCheckin } from '@/hooks/useDailyCheckin'
import type { Mood } from '@/types'

interface MoodOption {
  value: Mood
  emoji: string
  label: string
  /** Prompt natural para iniciar conversa sobre esse humor. */
  promptPt: string
}

export const MOODS: MoodOption[] = [
  { value: 'happy',   emoji: '😊', label: 'Feliz',   promptPt: 'Hoje estou me sentindo bem e queria conversar sobre isso.' },
  { value: 'serene',  emoji: '🌿', label: 'Sereno',  promptPt: 'Hoje estou em paz e queria refletir um pouco.' },
  { value: 'neutral', emoji: '🙂', label: 'Neutro',  promptPt: 'Hoje está sendo um dia comum. Quero pensar sobre o que tenho sentido.' },
  { value: 'anxious', emoji: '😰', label: 'Ansioso', promptPt: 'Hoje estou ansioso e preciso conversar sobre isso.' },
  { value: 'sad',     emoji: '😢', label: 'Triste',  promptPt: 'Hoje estou me sentindo triste. Preciso de companhia.' },
]

interface Props {
  /** Chamado quando o usuário clica em "Conversar sobre isso" após o check-in. */
  onTalkAboutIt?: (firstMessage: string) => void
}

export function DailyCheckIn({ onTalkAboutIt }: Props) {
  const t = useColors()
  const { todayCheckin, loading, saving, submit } = useDailyCheckin()

  const [picked, setPicked] = useState<Mood | null>(null)
  const [note,   setNote]   = useState('')
  const [step,   setStep]   = useState<'pick' | 'detail'>('pick')

  // ── carregando: skeleton mínimo ─────────────────────────────────
  if (loading) {
    return (
      <div style={cardStyle(t, 'idle')}>
        <div style={{ height: 64, background: t.surface2, borderRadius: 10, opacity: 0.5 }}/>
      </div>
    )
  }

  // ── já fez check-in: mostra resumo ─────────────────────────────
  if (todayCheckin) {
    const m = MOODS.find(m => m.value === todayCheckin.mood)
    return (
      <div style={cardStyle(t, 'done')}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{m?.emoji ?? '🙂'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 11, fontWeight: 600, color: t.textMuted,
              textTransform: 'uppercase', letterSpacing: 0.7, margin: 0,
            }}>Check-in de hoje</p>
            <p style={{ fontSize: 15, fontWeight: 600, color: t.text, margin: '2px 0 0', letterSpacing: -0.2 }}>
              {m?.label ?? 'Registrado'}
            </p>
            {todayCheckin.note && (
              <p style={{
                fontSize: 13, color: t.textSub, lineHeight: 1.6, marginTop: 8, fontStyle: 'italic',
                paddingLeft: 12, borderLeft: `2px solid ${t.accentSoft}`,
              }}>"{todayCheckin.note}"</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── step 1: escolher emoji ──────────────────────────────────────
  if (step === 'pick') {
    return (
      <div style={cardStyle(t, 'idle')}>
        <p style={{
          fontSize: 11, fontWeight: 600, color: t.accentDeep,
          textTransform: 'uppercase', letterSpacing: 1, margin: 0,
        }}>Check-in de hoje</p>
        <p style={{ fontSize: 16, fontWeight: 600, color: t.text, margin: '4px 0 14px', letterSpacing: -0.3 }}>
          Como você está se sentindo?
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {MOODS.map(m => (
            <button
              key={m.value}
              onClick={() => { setPicked(m.value); setStep('detail') }}
              title={m.label}
              style={{
                flex: '1 1 56px', minWidth: 56, height: 64,
                padding: '8px 4px',
                borderRadius: 12, cursor: 'pointer',
                border: `1px solid ${t.borderSoft}`,
                background: t.surface,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                transition: 'all 0.15s',
                fontFamily: fontStack,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background    = t.accentSoft
                e.currentTarget.style.borderColor   = t.accentBorder
                e.currentTarget.style.transform     = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background    = t.surface
                e.currentTarget.style.borderColor   = t.borderSoft
                e.currentTarget.style.transform     = 'translateY(0)'
              }}
            >
              <span style={{ fontSize: 24, lineHeight: 1 }}>{m.emoji}</span>
              <span style={{ fontSize: 10, color: t.textMuted, fontWeight: 500 }}>{m.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── step 2: detalhar e enviar ───────────────────────────────────
  const picked_obj = MOODS.find(m => m.value === picked)!

  async function save(talkAfter: boolean) {
    if (!picked) return
    const saved = await submit(picked, note)
    if (!saved) return
    if (talkAfter && onTalkAboutIt) {
      const first = note.trim()
        ? `${picked_obj.promptPt}\n\n${note.trim()}`
        : picked_obj.promptPt
      onTalkAboutIt(first)
    }
  }

  return (
    <div style={cardStyle(t, 'idle')}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24, lineHeight: 1 }}>{picked_obj.emoji}</span>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, margin: 0 }}>
              Você marcou
            </p>
            <p style={{ fontSize: 15, fontWeight: 600, color: t.text, margin: 0, letterSpacing: -0.2 }}>
              {picked_obj.label}
            </p>
          </div>
        </div>
        <button
          onClick={() => { setStep('pick'); setNote(''); setPicked(null) }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: t.textMuted, fontSize: 12, padding: 4, fontFamily: fontStack,
          }}
          title="Mudar"
        >
          Mudar
        </button>
      </div>

      <textarea
        value={note}
        onChange={e => setNote(e.target.value.slice(0, 240))}
        placeholder="Quer me contar mais? (opcional)"
        rows={2}
        maxLength={240}
        style={{
          width: '100%', padding: '10px 12px',
          border: `1px solid ${t.border}`, borderRadius: 10,
          background: t.surface, color: t.text,
          fontSize: 14, fontFamily: fontStack, lineHeight: 1.5,
          outline: 'none', resize: 'vertical', minHeight: 64,
        }}
      />

      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => save(false)}
          disabled={saving}
          style={{
            flex: '1 1 120px',
            height: 38, padding: '0 16px', borderRadius: 10,
            border: `1px solid ${t.border}`, background: 'transparent',
            color: t.textSub, fontSize: 13, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: fontStack,
          }}
        >
          {saving ? 'Salvando...' : 'Só registrar'}
        </button>
        <button
          onClick={() => save(true)}
          disabled={saving || !onTalkAboutIt}
          style={{
            flex: '2 1 160px',
            height: 38, padding: '0 16px', borderRadius: 10,
            border: 'none',
            background: saving ? t.accentSoft : t.accent,
            color: saving ? t.accent : '#fff',
            fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: fontStack,
            boxShadow: saving ? 'none' : `0 4px 12px ${t.accent}55, inset 0 1px 0 rgba(255,255,255,0.22)`,
          }}
        >
          {saving ? 'Aguarde...' : 'Conversar sobre isso'}
        </button>
      </div>
    </div>
  )
}

// ── styles ──────────────────────────────────────────────────────────
type T = ReturnType<typeof useColors>

function cardStyle(t: T, variant: 'idle' | 'done'): React.CSSProperties {
  return {
    background: variant === 'done' ? t.surface : t.surface,
    border: `1px solid ${variant === 'done' ? t.accentBorder : t.border}`,
    borderLeft: variant === 'done'
      ? `3px solid ${t.accent}`
      : `1px solid ${t.border}`,
    borderRadius: variant === 'done' ? '4px 14px 14px 4px' : 14,
    padding: 18,
    marginBottom: 16,
    fontFamily: fontStack,
    boxShadow: t.bg.startsWith('#1a')
      ? '0 1px 4px rgba(0,0,0,0.25)'
      : '0 1px 3px rgba(106,64,48,0.05)',
  }
}
