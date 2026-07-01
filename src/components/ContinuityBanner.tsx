// src/components/ContinuityBanner.tsx
// ─────────────────────────────────────────────────────────────────────
// Aviso gentil de continuidade para visitantes: lembra que a conversa
// some ao sair e convida (sem bloquear) a criar conta.
// Renderize dentro do fluxo de mensagens quando `showBanner` for true.
// ─────────────────────────────────────────────────────────────────────

import { useColors, fontStack } from '@/lib/theme'

/** Coração inline — evita depender de um ícone novo em Icons.tsx. */
function HeartGlyph({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/>
    </svg>
  )
}

interface Props {
  onSave: () => void
  onDismiss: () => void
}

export default function ContinuityBanner({ onSave, onDismiss }: Props) {
  const t = useColors()

  return (
    <div style={{
      margin: '6px 0 0', padding: '14px 16px', borderRadius: 14,
      background: t.accentSoft, border: `1px solid ${t.accentBorder}`,
      display: 'flex', alignItems: 'center', gap: 14, fontFamily: fontStack,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10, background: t.bg,
        border: `1px solid ${t.accentBorder}`, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <HeartGlyph size={16} color={t.accentDeep}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: t.text, margin: '0 0 1px' }}>Gostando da conversa?</p>
        <p style={{ fontSize: 12, color: t.accentDeep, margin: 0, lineHeight: 1.45 }}>
          Sem uma conta, ela some quando você sair. Guarde para retomar depois.
        </p>
      </div>
      <button onClick={onSave} style={{
        padding: '9px 15px', borderRadius: 999, border: 'none', cursor: 'pointer',
        background: t.text, color: t.bg, fontSize: 12.5, fontWeight: 700, fontFamily: fontStack,
        flexShrink: 0, whiteSpace: 'nowrap',
      }}>Salvar</button>
      <button onClick={onDismiss} aria-label="Dispensar" style={{
        background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted,
        fontSize: 16, padding: 4, flexShrink: 0,
      }}>✕</button>
    </div>
  )
}
