// src/components/ProactiveCard.tsx
// ─────────────────────────────────────────────────────────────────────
// Card de sugestão proativa do assistente. Re-tematizado.
// ─────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useColors, fontStack } from '@/lib/theme'

interface Props {
  message: string
  action: string
  onAccept: () => void
  onDismiss: () => void
  delay?: number
}

export function ProactiveCard({ message, action, onAccept, onDismiss, delay = 0 }: Props) {
  const t = useColors()
  const [visible, setVisible] = useState(delay === 0)

  useEffect(() => {
    if (delay === 0) { setVisible(true); return }
    const tid = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(tid)
  }, [delay])

  const isDark = t.bg.startsWith('#1a')

  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderLeft: `3px solid ${t.accent}`,
      borderRadius: '4px 14px 14px 4px',
      padding: '16px 18px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(10px)',
      transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
      boxShadow: isDark
        ? '0 4px 20px rgba(0,0,0,0.35)'
        : '0 4px 20px rgba(106,64,48,0.08)',
    }}>
      <p style={{
        fontSize: 10.5, fontWeight: 700, color: t.accentDeep,
        marginBottom: 6, fontFamily: fontStack,
        textTransform: 'uppercase', letterSpacing: 1.2,
      }}>
        {action}
      </p>
      <p style={{
        fontSize: 14, color: t.textSub, lineHeight: 1.65, marginBottom: 14,
        fontFamily: fontStack,
      }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onAccept} style={{
          height: 34, padding: '0 16px', borderRadius: 10, border: 'none',
          background: t.accent, color: '#fff', fontSize: 12.5, fontWeight: 600,
          cursor: 'pointer', fontFamily: fontStack,
          boxShadow: `0 2px 8px ${t.accent}44, inset 0 1px 0 rgba(255,255,255,0.22)`,
          transition: 'filter 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
          onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}>
          Vamos lá
        </button>
        <button onClick={onDismiss} style={{
          height: 34, padding: '0 16px', borderRadius: 10,
          border: `1px solid ${t.border}`, background: 'transparent',
          color: t.textSub, fontSize: 12.5, fontWeight: 500,
          cursor: 'pointer', fontFamily: fontStack,
        }}>
          Agora não
        </button>
      </div>
    </div>
  )
}
