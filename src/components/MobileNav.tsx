// src/components/MobileNav.tsx
// ─────────────────────────────────────────────────────────────────────
// Navegação mobile: top bar (avatar + logo + sino) + bottom nav
// Aparece apenas em telas < 768px (md breakpoint).
// Importe em Home.tsx, Reports.tsx e Profile.tsx no topo do JSX.
// ─────────────────────────────────────────────────────────────────────

import { useNavigate, useLocation } from 'react-router-dom'
import { useColors } from '@/lib/theme'
import { useAuth } from '@/contexts/AuthContext'

// ── ícones SVG inline (sem dependência extra) ────────────────────────
function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/>
      <polyline points="9 21 9 12 15 12 15 21"/>
    </svg>
  )
}
function IconJournal({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}/>
    </svg>
  )
}
function IconChart({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="12" width="4" height="9" rx="1" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0}/>
      <rect x="10" y="7" width="4" height="14" rx="1" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0}/>
      <rect x="17" y="3" width="4" height="18" rx="1" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0}/>
    </svg>
  )
}
function IconUser({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}
function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

const TABS = [
  { path: '/app',        label: 'Início',     Icon: IconHome    },
  { path: '/app',        label: 'Journal',    Icon: IconJournal, query: '?journal=true' },
  { path: '/relatorios', label: 'Relatórios', Icon: IconChart   },
  { path: '/perfil',     label: 'Perfil',     Icon: IconUser    },
]

// ── Top Bar (mobile) ─────────────────────────────────────────────────
export function MobileTopBar({ title }: { title?: string }) {
  const c = useColors()
  const navigate = useNavigate()
  const { user } = useAuth()

  const initials = user?.user_metadata?.name
    ? user.user_metadata.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email?.[0] ?? 'U').toUpperCase()

  const avatarUrl = user?.user_metadata?.avatar_url

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 16px',
      background: c.surface,
      borderBottom: `1px solid ${c.border}`,
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      {/* Avatar → vai para perfil */}
      <button
        onClick={() => navigate('/perfil')}
        aria-label="Ir para o perfil"
        style={{
          width: 36, height: 36, borderRadius: '50%',
          background: avatarUrl ? 'transparent' : c.accent,
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
          color: '#faf6f0', fontSize: 13, fontWeight: 600,
        }}
      >
        {avatarUrl
          ? <img src={avatarUrl} alt="Foto de perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          : initials}
      </button>

      {/* Título / logo */}
      <span style={{
        flex: 1, textAlign: 'center',
        fontSize: 15, fontWeight: 600,
        color: c.text, letterSpacing: '-0.3px',
        fontStyle: 'italic',
      }}>
        {title ?? 'Claramente'}
      </span>

      {/* Sino */}
      <button
        aria-label="Notificações"
        style={{
          width: 36, height: 36, borderRadius: 10,
          background: c.surface2, border: `1px solid ${c.border}`,
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: c.textSub,
        }}
      >
        <IconBell/>
      </button>
    </header>
  )
}

// ── Bottom Navigation (mobile) ────────────────────────────────────────
export function MobileBottomNav() {
  const c = useColors()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav
      aria-label="Navegação principal"
      style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        display: 'flex',
        background: c.surface,
        borderTop: `1px solid ${c.border}`,
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map(({ path, label, Icon }) => {
        const active = location.pathname === path ||
          (path !== '/app' && location.pathname.startsWith(path))
        return (
          <button
            key={label}
            onClick={() => navigate(path)}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 3,
              padding: '10px 0',
              background: 'none', border: 'none',
              cursor: 'pointer',
              color: active ? c.accent : c.textMuted,
              transition: 'color 0.15s',
            }}
          >
            <Icon active={active}/>
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
