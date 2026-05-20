import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface Props {
  message: string
  action: string
  onAccept: () => void
  onDismiss: () => void
  delay?: number
}

export function ProactiveCard({ message, action, onAccept, onDismiss, delay = 0 }: Props) {
  const { isDark } = useTheme()
  const [visible, setVisible] = useState(delay === 0)

  useEffect(() => {
    if (delay === 0) { setVisible(true); return }
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  const ACCENT = isDark ? '#60A5FA' : '#2563EB'

  return (
    <div style={{
      background:  isDark ? '#1E293B' : '#FFFFFF',
      border:      `1px solid ${isDark ? '#1E40AF' : '#BFDBFE'}`,
      borderLeft:  `3px solid ${ACCENT}`,
      borderRadius: 12,
      padding:     '14px 16px',
      opacity:     visible ? 1 : 0,
      transform:   visible ? 'translateY(0)' : 'translateY(10px)',
      transition:  'all 0.4s cubic-bezier(0.16,1,0.3,1)',
      boxShadow:   isDark
        ? '0 4px 20px rgba(0,0,0,0.35)'
        : '0 4px 20px rgba(37,99,235,0.1)',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, marginBottom: 6, fontFamily: "'Inter',sans-serif", textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {action}
      </p>
      <p style={{ fontSize: 13, color: isDark ? '#CBD5E1' : '#374151', lineHeight: 1.65, marginBottom: 14, fontFamily: "'Inter',sans-serif" }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onAccept} style={{ height: 32, padding: '0 14px', borderRadius: 7, border: 'none', background: ACCENT, color: '#FFF', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif", transition: 'filter 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.12)')}
          onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}>
          Vamos lá
        </button>
        <button onClick={onDismiss} style={{ height: 32, padding: '0 14px', borderRadius: 7, border: `1px solid ${isDark ? '#334155' : '#BFDBFE'}`, background: 'transparent', color: isDark ? '#94A3B8' : '#374151', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
          Agora não
        </button>
      </div>
    </div>
  )
}