import { useEffect, useState } from 'react'

interface ProactiveCardProps {
  message: string
  action?: string
  onAccept: () => void
  onDismiss: () => void
  delay?: number
}

export function ProactiveCard({ message, action = 'Explorar', onAccept, onDismiss, delay = 0 }: ProactiveCardProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  if (!visible) return null

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '0.5px solid rgba(124,58,237,0.2)',
      borderRadius: 16, padding: '14px 16px',
      display: 'flex', alignItems: 'flex-start', gap: 12,
      animation: 'proactiveIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
    }}>
      <style>{`@keyframes proactiveIn{from{opacity:0;transform:translateY(10px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(124,58,237,0.3),transparent)' }} />

      {/* Orb pequeno */}
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(124,58,237,0.12)', border: '0.5px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: 'proactivePulse 3s ease-in-out infinite' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.8)" strokeWidth="1.5" strokeLinecap="round">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
          <path d="M12 8v4l3 3"/>
        </svg>
        <style>{`@keyframes proactivePulse{0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,0.2)}50%{box-shadow:0 0 0 6px rgba(124,58,237,0)}}`}</style>
      </div>

      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: '0 0 10px', fontFamily: "'DM Sans',sans-serif" }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onAccept} style={{ padding: '5px 14px', borderRadius: 20, border: 'none', background: 'rgba(124,58,237,0.2)', color: 'rgba(167,139,250,0.9)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all 0.18s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.35)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.2)')}>
            {action}
          </button>
          <button onClick={onDismiss} style={{ padding: '5px 10px', borderRadius: 20, border: '0.5px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all 0.18s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
            Dispensar
          </button>
        </div>
      </div>
    </div>
  )
}