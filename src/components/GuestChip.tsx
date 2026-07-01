// src/components/GuestChip.tsx
// ─────────────────────────────────────────────────────────────────────
// Selo discreto de "visitante" para o cabeçalho — deixa claro que a
// pessoa está explorando sem conta. Clicável para abrir o soft-gate.
// ─────────────────────────────────────────────────────────────────────

import { useColors, fontStack } from '@/lib/theme'

interface Props {
  onClick?: () => void
}

export default function GuestChip({ onClick }: Props) {
  const t = useColors()
  return (
    <button
      onClick={onClick}
      title="Você está explorando sem conta"
      style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '4px 11px',
        borderRadius: 999, background: t.surface, border: `1px solid ${t.border}`,
        cursor: onClick ? 'pointer' : 'default', fontFamily: fontStack,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: t.textMuted }}/>
      <span style={{ fontSize: 11, fontWeight: 600, color: t.textSub }}>Visitante</span>
    </button>
  )
}
