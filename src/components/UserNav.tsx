import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  isDark: boolean
}

export function UserNav({ isDark }: Props) {
  const { profile } = useAuth()
  const navigate    = useNavigate()
  const location    = useLocation()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const ACCENT    = isDark ? '#60A5FA' : '#2563EB'
  const firstName = profile?.name?.split(' ')[0] || '?'
  const avatarUrl = (profile as unknown as { avatar_url?: string })?.avatar_url || ''
  const isHome    = location.pathname === '/app'

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
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

      {/* Avatar button */}
      <button
        onClick={() => setOpen(p => !p)}
        title="Menu de navegação"
        style={{
          width: 36, height: 36, borderRadius: '50%',
          border: `2px solid ${open ? ACCENT : `${ACCENT}50`}`,
          padding: 0, cursor: 'pointer',
          overflow: 'hidden',
          background: isDark ? 'rgba(30,64,175,0.25)' : '#EFF6FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: open ? `0 0 0 3px ${ACCENT}20` : 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT}20` }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = `${ACCENT}50`; e.currentTarget.style.boxShadow = 'none' } }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={firstName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={() => {}}
          />
        ) : (
          <span style={{ fontSize: 13, fontWeight: 700, color: ACCENT, fontFamily: "'Inter',sans-serif", userSelect: 'none' }}>
            {firstName.charAt(0).toUpperCase()}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0,
          minWidth: 170, zIndex: 500,
          background: isDark ? '#1E293B' : '#FFFFFF',
          border: `1px solid ${isDark ? '#334155' : '#E0F2FE'}`,
          borderRadius: 12,
          boxShadow: isDark
            ? '0 12px 32px rgba(0,0,0,0.45)'
            : '0 12px 32px rgba(37,99,235,0.12)',
          overflow: 'hidden',
          animation: 'dropIn 0.15s ease',
        }}>

          {/* Cabeçalho do usuário */}
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${isDark ? '#334155' : '#E0F2FE'}` }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#F1F5F9' : '#0F172A', margin: 0, fontFamily: "'Inter',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.name || firstName}
            </p>
            <p style={{ fontSize: 11, color: isDark ? '#475569' : '#94A3B8', margin: 0, fontFamily: "'Inter',sans-serif" }}>
              Claramente
            </p>
          </div>

          {/* Itens */}
          {menuItems.map(item => (
            <button
              key={item.label}
              onClick={item.action}
              style={{
                width: '100%', padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
                background: item.active
                  ? (isDark ? 'rgba(30,64,175,0.2)' : '#EFF6FF')
                  : 'transparent',
                border: 'none', cursor: 'pointer',
                color: item.active ? ACCENT : (isDark ? '#94A3B8' : '#374151'),
                fontSize: 13, fontFamily: "'Inter',sans-serif", fontWeight: item.active ? 600 : 400,
                textAlign: 'left', transition: 'background 0.12s',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={e => { if (!item.active) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : '#F0F9FF' }}
              onMouseLeave={e => { if (!item.active) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ color: item.active ? ACCENT : (isDark ? '#64748B' : '#94A3B8'), display: 'flex' }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes dropIn {
          from { opacity:0; transform:translateY(-6px) }
          to   { opacity:1; transform:translateY(0) }
        }
      `}</style>
    </div>
  )
}