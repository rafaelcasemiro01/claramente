// src/components/UserNav.tsx
// ─────────────────────────────────────────────────────────────────────
// Avatar + dropdown de navegação. Re-tematizado para terracotta & cream.
// Lógica idêntica: avatar/iniciais, dropdown, navegação ativa.
// ─────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useColors, fontStack } from '@/lib/theme'

interface Props { isDark: boolean }

export function UserNav({ isDark: _isDark }: Props) {
  const { profile } = useAuth()
  const navigate    = useNavigate()
  const location    = useLocation()
  const t           = useColors()

  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const firstName = profile?.name?.split(' ')[0] || '?'
  const avatarUrl = (profile as unknown as { avatar_url?: string })?.avatar_url || ''
  const isHome    = location.pathname === '/app'

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const menuItems = [
    {
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      label: 'Início',
      action: () => { navigate('/app'); setOpen(false) },
      active: isHome,
    },
    {
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
      label: 'Meu perfil',
      action: () => { navigate('/perfil'); setOpen(false) },
      active: location.pathname === '/perfil',
    },
    {
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6"  y1="20" x2="6"  y2="14"/>
          <line x1="2"  y1="20" x2="22" y2="20"/>
        </svg>
      ),
      label: 'Relatórios',
      action: () => { navigate('/relatorios'); setOpen(false) },
      active: location.pathname === '/relatorios',
    },
  ]

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(p => !p)}
        title="Menu de navegação"
        style={{
          width: 38, height: 38, borderRadius: '50%',
          border: `2px solid ${open ? t.accent : `${t.accent}66`}`,
          padding: 0, cursor: 'pointer', overflow: 'hidden',
          background: avatarUrl ? t.accentSoft : `linear-gradient(135deg, ${t.accent}, ${t.accentDeep})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: open ? `0 0 0 3px ${t.accent}22` : 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = t.accent
          e.currentTarget.style.boxShadow = `0 0 0 3px ${t.accent}22`
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.borderColor = `${t.accent}66`
            e.currentTarget.style.boxShadow = 'none'
          }
        }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={firstName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={() => {}}/>
        ) : (
          <span style={{
            fontSize: 14, fontWeight: 700, color: '#fff',
            fontFamily: fontStack, userSelect: 'none',
          }}>
            {firstName.charAt(0).toUpperCase()}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0,
          minWidth: 180, zIndex: 500,
          background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14,
          boxShadow: t.bg.startsWith('#1a')
            ? '0 12px 32px rgba(0,0,0,0.45)'
            : '0 12px 32px rgba(106,64,48,0.14)',
          overflow: 'hidden', animation: 'dropIn 0.15s ease',
        }}>
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${t.borderSoft}` }}>
            <p style={{
              fontSize: 13, fontWeight: 600, color: t.text, margin: 0,
              fontFamily: fontStack, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{profile?.name || firstName}</p>
            <p style={{ fontSize: 11, color: t.accentDeep, margin: 0, fontStyle: 'italic', fontFamily: fontStack }}>
              Claramente
            </p>
          </div>

          {menuItems.map(item => (
            <button
              key={item.label}
              onClick={item.action}
              style={{
                width: '100%', padding: '11px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
                background: item.active ? t.accentSoft : 'transparent',
                border: 'none', cursor: 'pointer',
                color: item.active ? t.accentDeep : t.textSub,
                fontSize: 13, fontFamily: fontStack, fontWeight: item.active ? 600 : 500,
                textAlign: 'left', transition: 'background 0.12s',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={e => { if (!item.active) e.currentTarget.style.background = t.surface2 }}
              onMouseLeave={e => { if (!item.active) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ color: item.active ? t.accentDeep : t.textMuted, display: 'flex' }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes dropIn { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  )
}
