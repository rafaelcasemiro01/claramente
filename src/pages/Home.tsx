import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useChat } from '@/hooks/useChat'
import { audio } from '@/lib/audioEngine'
import type { ConversationItem } from '@/hooks/useChat'

// ─── Logo com anéis JARVIS ─────────────────────────────────────
function CrystalLogo({ size = 24, light = false, animate = false }: { size?: number; light?: boolean; animate?: boolean }) {
  const c  = light ? 'rgba(255,255,255,0.85)' : '#8B5CF6'
  const cf = light ? 'rgba(255,255,255,0.15)'  : 'rgba(139,92,246,0.15)'
  const cm = light ? 'rgba(255,255,255,0.35)'  : 'rgba(139,92,246,0.35)'
  const cl = light ? 'rgba(255,255,255,0.55)'  : 'rgba(139,92,246,0.6)'
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {animate && (
        <>
          <div style={{ position: 'absolute', width: size * 2.6, height: size * 2.6, borderRadius: '50%', border: `1px dashed ${light ? 'rgba(255,255,255,0.2)' : 'rgba(139,92,246,0.25)'}`, animation: 'jarvisR1 12s linear infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: size * 1.9, height: size * 1.9, borderRadius: '50%', border: `0.5px solid ${light ? 'rgba(255,255,255,0.15)' : 'rgba(139,92,246,0.18)'}`, animation: 'jarvisR2 7s linear infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: size * 1.4, height: size * 1.4, borderRadius: '50%', border: `0.5px solid ${light ? 'rgba(255,255,255,0.1)' : 'rgba(167,139,250,0.15)'}`, animation: 'jarvisR1 4s linear infinite reverse', pointerEvents: 'none' }} />
        </>
      )}
      <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
        <path d="M28 4L50 18V38L28 52L6 38V18Z" fill={cf} stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M28 4L6 18H50Z" fill={cm}/>
        <line x1="6"  y1="18" x2="28" y2="30" stroke={cl} strokeWidth="1.2"/>
        <line x1="50" y1="18" x2="28" y2="30" stroke={cl} strokeWidth="1.2"/>
        <line x1="28" y1="30" x2="28" y2="52" stroke={light ? 'rgba(255,255,255,0.25)' : 'rgba(139,92,246,0.3)'} strokeWidth="1"/>
        <circle cx="28" cy="30" r="3" fill={c}/>
      </svg>
    </div>
  )
}

// ─── Waveform JARVIS (substitui os dots) ──────────────────────
function JarvisWaveform({ color = '#8B5CF6' }: { color?: string }) {
  const bars = [0.35, 0.75, 0.55, 1.0, 0.65, 0.9, 0.45, 0.7, 0.5, 0.85, 0.4, 0.6]
  return (
    <div style={{ display: 'flex', gap: 2.5, alignItems: 'center', height: 28, padding: '2px 4px' }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 2, background: color,
          animation: `waveBar ${0.5 + h * 0.5}s ${i * 0.06}s infinite ease-in-out alternate`,
          height: `${h * 20 + 3}px`,
          opacity: 0.7 + h * 0.3,
        }} />
      ))}
    </div>
  )
}

// ─── Sequência de Boot ─────────────────────────────────────────
function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0)
  const [progress, setProgress] = useState(0)
  const [lines, setLines] = useState<string[]>([])

  const bootLines = [
    'SISTEMA NEURAL INICIALIZADO',
    'MEMÓRIA PERSISTENTE CARREGADA',
    'PROTOCOLOS DE INTROSPECÇÃO ATIVOS',
    'MÓDULO DE ANÁLISE EMOCIONAL ONLINE',
    'CLARAMENTE v2.0 // PRONTO',
  ]

  useEffect(() => {
    audio.init()
    const t1 = setTimeout(() => { setPhase(1); audio.playBoot() }, 200)
    const t2 = setTimeout(() => setPhase(2), 700)

    // Boot lines aparecem sequencialmente
    bootLines.forEach((line, i) => {
      setTimeout(() => setLines(prev => [...prev, line]), 900 + i * 280)
    })

    // Progress bar
    let p = 0
    const prog = setInterval(() => {
      p += 2
      setProgress(p)
      if (p >= 100) clearInterval(prog)
    }, 35)

    const t3 = setTimeout(() => setPhase(3), 2600)
    const t4 = setTimeout(() => onComplete(), 3300)

    return () => { [t1, t2, t3, t4].forEach(clearTimeout); clearInterval(prog) }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: '#050410',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      transition: phase === 3 ? 'opacity 0.7s ease' : 'none',
      opacity: phase === 3 ? 0 : 1,
      fontFamily: "'DM Sans', monospace",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes jarvisR1 { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes jarvisR2 { from{transform:rotate(360deg)} to{transform:rotate(0deg)} }
        @keyframes waveBar  { from{transform:scaleY(0.2)} to{transform:scaleY(1)} }
        @keyframes bootLine { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        @keyframes scanLine { 0%{transform:translateY(-100%);opacity:0} 5%{opacity:0.6} 95%{opacity:0.6} 100%{transform:translateY(100vh);opacity:0} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse    { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes glitch   { 0%,100%{clip-path:none} 8%{clip-path:inset(20% 0 60% 0)} 16%{clip-path:inset(80% 0 5% 0)} 24%{clip-path:none} }
        @keyframes dotGrid  { from{background-position:0 0} to{background-position:24px 24px} }
        @keyframes msgIn    { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Grid de fundo */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.15,
        backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.6) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      {/* Scan line */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.8), transparent)',
        animation: 'scanLine 2.5s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Logo central com anéis */}
      <div style={{
        marginBottom: 40,
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 0.5s, transform 0.5s',
        transform: phase >= 1 ? 'scale(1)' : 'scale(0.6)',
      }}>
        <CrystalLogo size={64} light animate={phase >= 2} />
      </div>

      {/* Título */}
      <h1 style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: 'clamp(28px, 6vw, 42px)',
        color: 'white', letterSpacing: 8,
        marginBottom: 6, textTransform: 'uppercase',
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 0.6s 0.3s',
        textShadow: '0 0 30px rgba(139,92,246,0.8)',
      }}>
        Claramente
      </h1>
      <p style={{ fontSize: 11, color: '#8B5CF6', letterSpacing: 4, marginBottom: 36, opacity: phase >= 1 ? 0.8 : 0, transition: 'opacity 0.6s 0.5s' }}>
        SISTEMA DE INTROSPECÇÃO IA
      </p>

      {/* Boot lines */}
      <div style={{ width: 340, maxWidth: '90vw', marginBottom: 28 }}>
        {lines.map((line, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 6, animation: 'bootLine 0.3s ease forwards',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: i === lines.length - 1 ? '#8B5CF6' : '#22C55E', flexShrink: 0, animation: i === lines.length - 1 ? 'pulse 0.8s infinite' : 'none' }} />
            <span style={{ fontSize: 11, color: i === lines.length - 1 ? '#A78BFA' : '#4A9960', letterSpacing: 1, fontFamily: 'monospace' }}>
              {line}
            </span>
          </div>
        ))}
      </div>

      {/* Barra de progresso */}
      <div style={{ width: 340, maxWidth: '90vw' }}>
        <div style={{ height: 2, background: 'rgba(139,92,246,0.15)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #6D28D9, #A78BFA)', borderRadius: 2, width: `${progress}%`, transition: 'width 0.05s linear', boxShadow: '0 0 8px rgba(139,92,246,0.8)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 10, color: '#4A4268', letterSpacing: 1, fontFamily: 'monospace' }}>INICIALIZANDO</span>
          <span style={{ fontSize: 10, color: '#6B6480', fontFamily: 'monospace' }}>{progress}%</span>
        </div>
      </div>
    </div>
  )
}

// ─── Agrupa conversas por data ─────────────────────────────────
function groupConversations(conversations: ConversationItem[]) {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yest  = new Date(today); yest.setDate(today.getDate() - 1)
  const week  = new Date(today); week.setDate(today.getDate() - 7)

  const groups: { label: string; items: ConversationItem[] }[] = [
    { label: 'Hoje', items: [] },
    { label: 'Ontem', items: [] },
    { label: 'Esta semana', items: [] },
    { label: 'Mais antigas', items: [] },
  ]
  conversations.forEach(c => {
    const d = new Date(c.started_at)
    if (d >= today) groups[0].items.push(c)
    else if (d >= yest) groups[1].items.push(c)
    else if (d >= week) groups[2].items.push(c)
    else groups[3].items.push(c)
  })
  return groups.filter(g => g.items.length > 0)
}

// ─── Componente principal ──────────────────────────────────────
export default function Home() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { t, isDark, toggle } = useTheme()
  const {
    messages, isTyping, isCrisis, isJournalingMode,
    conversationId, conversations, smartSummary, loadingSmartSummary,
    sendMessage, resetChat, loadConversation, startJournaling,
  } = useChat()

  const [input, setInput]           = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [jarvisMode, setJarvisMode]   = useState(true)
  const [bootDone, setBootDone]       = useState(() =>
    sessionStorage.getItem('claramente-booted') === 'true'
  )
  const [uptime, setUptime] = useState('00:00:00')
  const startTime = useRef(Date.now())
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Uptime counter
  useEffect(() => {
    const iv = setInterval(() => {
      const s = Math.floor((Date.now() - startTime.current) / 1000)
      const h = String(Math.floor(s / 3600)).padStart(2, '0')
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
      const sec = String(s % 60).padStart(2, '0')
      setUptime(`${h}:${m}:${sec}`)
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (isTyping && jarvisMode) audio.playAIStart()
    if (!isTyping && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && jarvisMode) {
      audio.playAIResponse()
    }
  }, [isTyping])

  function autoResize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  async function handleSend() {
    if (!input.trim() || isTyping) return
    const text = input.trim()
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setSidebarOpen(false)
    if (jarvisMode) audio.playMessageSent()
    await sendMessage(text)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  async function handleLoadConversation(id: string) {
    if (jarvisMode) audio.playClick()
    await loadConversation(id)
    setSidebarOpen(false)
  }

  function handleBootComplete() {
    sessionStorage.setItem('claramente-booted', 'true')
    setBootDone(true)
  }

  async function handleStartJournaling() {
    if (jarvisMode) audio.playJournaling()
    await startJournaling()
    setSidebarOpen(false)
  }

  async function handleResetChat() {
    if (jarvisMode) audio.playClick()
    resetChat()
    setSidebarOpen(false)
  }

  const firstName = profile?.name?.split(' ')[0] || 'você'
  const grouped   = groupConversations(conversations)

  const SB = {
    bg: '#0A0818', border: 'rgba(139,92,246,0.12)',
    text: 'rgba(255,255,255,0.75)', muted: '#3A3558',
    hover: 'rgba(139,92,246,0.1)', active: 'rgba(139,92,246,0.2)',
  }

  function Sidebar() {
    return (
      <aside style={{ width: 260, flexShrink: 0, background: SB.bg, display: 'flex', flexDirection: 'column', height: '100%', borderRight: `0.5px solid ${SB.border}`, position: 'relative', overflow: 'hidden' }}>

        {/* Grid de fundo sutil */}
        {jarvisMode && (
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.12) 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none', opacity: 0.6 }} />
        )}

        {/* Logo */}
        <div style={{ padding: '14px 14px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `0.5px solid ${SB.border}`, position: 'relative' }}>
          <CrystalLogo size={22} light animate={jarvisMode} />
          <div>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 14, color: SB.text, letterSpacing: -0.2, display: 'block' }}>Claramente</span>
            {jarvisMode && <span style={{ fontSize: 9, color: '#4A4268', letterSpacing: 1, fontFamily: 'monospace' }}>SISTEMA ATIVO</span>}
          </div>
        </div>

        {/* Botões principais */}
        <div style={{ padding: '10px 10px 6px', display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
          <button onClick={handleResetChat} style={{
            width: '100%', padding: '9px 12px', background: 'rgba(139,92,246,0.12)',
            border: '0.5px solid rgba(139,92,246,0.22)', borderRadius: 10,
            color: '#A78BFA', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, transition: 'all 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.22)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.12)')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nova conversa
          </button>

          <button onClick={handleStartJournaling} style={{
            width: '100%', padding: '9px 12px', background: 'rgba(167,139,250,0.07)',
            border: '0.5px solid rgba(167,139,250,0.18)', borderRadius: 10,
            color: '#C4B5FD', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, transition: 'all 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(167,139,250,0.16)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(167,139,250,0.07)')}>
            ✦ Journaling guiado
          </button>
        </div>

        {/* Lista de conversas */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px', position: 'relative' }}>
          <style>{`::-webkit-scrollbar{width:2px}::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.2);border-radius:2px}`}</style>
          {grouped.length === 0 && (
            <p style={{ fontSize: 11, color: SB.muted, textAlign: 'center', padding: '24px 12px', lineHeight: 1.7, fontFamily: 'monospace' }}>
              // NENHUMA SESSÃO<br/>// INICIE UMA CONVERSA
            </p>
          )}
          {grouped.map(group => (
            <div key={group.label}>
              <p style={{ fontSize: 9, color: SB.muted, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', padding: '10px 8px 5px', fontFamily: 'monospace' }}>
                // {group.label}
              </p>
              {group.items.map(conv => (
                <button key={conv.id} onClick={() => handleLoadConversation(conv.id)} style={{
                  width: '100%', textAlign: 'left', padding: '8px 10px',
                  borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: conversationId === conv.id ? SB.active : 'transparent',
                  marginBottom: 2, transition: 'background 0.15s', display: 'block',
                  borderLeft: conversationId === conv.id ? '2px solid #8B5CF6' : '2px solid transparent',
                }}
                  onMouseEnter={e => { if (conversationId !== conv.id) e.currentTarget.style.background = SB.hover }}
                  onMouseLeave={e => { if (conversationId !== conv.id) e.currentTarget.style.background = 'transparent' }}>
                  <p style={{ fontSize: 12, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif", color: conversationId === conv.id ? '#E9E4FF' : SB.text }}>
                    {conv.title}
                  </p>
                  <p style={{ fontSize: 10, color: SB.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                    {conv.preview}
                  </p>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Status JARVIS */}
        {jarvisMode && (
          <div style={{ padding: '8px 14px', borderTop: `0.5px solid ${SB.border}`, borderBottom: `0.5px solid ${SB.border}`, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 9, color: '#22C55E', letterSpacing: 0.8, fontFamily: 'monospace' }}>ONLINE</span>
              </div>
              <span style={{ fontSize: 9, color: SB.muted, fontFamily: 'monospace' }}>UP {uptime}</span>
            </div>
          </div>
        )}

        {/* Rodapé */}
        <div style={{ padding: '10px 12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#A78BFA' }}>
              {firstName.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 11, color: '#6B6480', fontFamily: "'DM Sans', sans-serif" }}>{firstName}</span>
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {[
              { icon: isDark ? '☀️' : '🌙', action: toggle,                        title: 'Tema' },
              { icon: jarvisMode ? '🔊' : '🔇', action: () => { setJarvisMode(!jarvisMode); if (!jarvisMode) audio.init() }, title: 'Sons' },
              { icon: '📊', action: () => navigate('/relatorios'),                  title: 'Relatórios' },
              { icon: '👤', action: () => navigate('/perfil'),                      title: 'Perfil' },
              { icon: '→',  action: signOut,                                        title: 'Sair' },
            ].map(btn => (
              <button key={btn.title} onClick={btn.action} title={btn.title} style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.04)', color: '#6B6480', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, transition: 'all 0.2s' }}>
                {btn.icon}
              </button>
            ))}
          </div>
        </div>
      </aside>
    )
  }

  return (
    <>
      {/* Boot sequence */}
      {!bootDone && <BootSequence onComplete={handleBootComplete} />}

      <div style={{ height: '100dvh', display: 'flex', background: t.bg, fontFamily: "'DM Sans', 'Plus Jakarta Sans', sans-serif", position: 'relative', overflow: 'hidden', opacity: bootDone ? 1 : 0, transition: 'opacity 0.5s' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
          * { box-sizing: border-box; }
          @keyframes jarvisR1  { from{transform:rotate(0deg)}   to{transform:rotate(360deg)} }
          @keyframes jarvisR2  { from{transform:rotate(360deg)} to{transform:rotate(0deg)} }
          @keyframes waveBar   { from{transform:scaleY(0.15)}   to{transform:scaleY(1)} }
          @keyframes bootLine  { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
          @keyframes scanLine  { 0%{top:-2px;opacity:0} 5%{opacity:0.5} 95%{opacity:0.5} 100%{top:100%;opacity:0} }
          @keyframes fadeUp    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
          @keyframes pulse     { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
          @keyframes msgIn     { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
          @keyframes dotGrid   { from{background-position:0 0} to{background-position:24px 24px} }
          .sb-desktop { display: none; height: 100%; }
          .mobile-hdr { display: flex; }
          @media (min-width: 700px) {
            .sb-desktop { display: flex !important; }
            .mobile-hdr { display: none !important; }
          }
          textarea::placeholder { color: ${t.placeholder} !important; }
          ::-webkit-scrollbar { width: 3px; }
          ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.2); border-radius: 3px; }
        `}</style>

        {/* Sidebar desktop */}
        <div className="sb-desktop"><Sidebar /></div>

        {/* Sidebar mobile overlay */}
        {sidebarOpen && (
          <>
            <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }} />
            <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, animation: 'fadeUp 0.25s ease' }}>
              <Sidebar />
            </div>
          </>
        )}

        {/* Área principal do chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>

          {/* Grid JARVIS no fundo */}
          {jarvisMode && (
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.04)'} 1px, transparent 1px)`, backgroundSize: '24px 24px', pointerEvents: 'none', zIndex: 0 }} />
          )}

          {/* Scan line JARVIS */}
          {jarvisMode && isTyping && (
            <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.6) 50%, transparent 100%)', animation: 'scanLine 2s ease-in-out infinite', zIndex: 5, pointerEvents: 'none' }} />
          )}

          {/* Header mobile */}
          <header className="mobile-hdr" style={{ background: t.header, borderBottom: `0.5px solid ${t.headerBorder}`, padding: '0 16px', height: 56, alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, zIndex: 10, position: 'relative' }}>
            <button onClick={() => setSidebarOpen(true)} style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', color: t.violet, display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CrystalLogo size={20} animate={jarvisMode} />
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: t.text }}>
                {isJournalingMode ? '✦ Journaling' : 'Claramente'}
              </span>
            </div>
            <button onClick={toggle} style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
              {isDark ? '☀️' : '🌙'}
            </button>
          </header>

          {/* Banner journaling */}
          {isJournalingMode && (
            <div style={{ padding: '8px 20px', background: isDark ? 'rgba(167,139,250,0.07)' : '#F5F3FF', borderBottom: `0.5px solid rgba(139,92,246,0.2)`, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: t.violet, zIndex: 10, position: 'relative' }}>
              <span style={{ animation: 'pulse 2s infinite', fontSize: 14 }}>✦</span>
              <span style={{ fontWeight: 500 }}>Modo Journaling Guiado</span>
              <span style={{ color: t.textMuted }}>— sessão reflexiva estruturada</span>
            </div>
          )}

          {/* Banner crise */}
          {isCrisis && (
            <div style={{ margin: '10px 16px 0', padding: '12px 16px', borderRadius: 14, background: '#FFF7ED', border: '1px solid #FED7AA', fontSize: 13, color: '#92400E', lineHeight: 1.6, zIndex: 10, position: 'relative' }}>
              🆘 <strong>CVV: 188</strong> (gratuito, 24h) · cvv.org.br
            </div>
          )}

          {/* Mensagens */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 8px', position: 'relative', zIndex: 1 }}>
            <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Boas-vindas */}
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px 20px', animation: 'fadeUp 0.6s ease' }}>
                  <div style={{ display: 'inline-flex', marginBottom: 20 }}>
                    <CrystalLogo size={52} animate={jarvisMode} />
                  </div>
                  <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: t.text, marginBottom: 8, fontWeight: 400 }}>
                    Olá, {firstName}
                  </h2>

                  {loadingSmartSummary && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: t.textMuted, fontSize: 13, marginBottom: 16 }}>
                      {jarvisMode ? <JarvisWaveform color={t.violet} /> : <span>Carregando...</span>}
                    </div>
                  )}

                  {smartSummary && !loadingSmartSummary && (
                    <div style={{ background: t.card, border: `0.5px solid ${t.cardBorder}`, borderRadius: 16, padding: '14px 18px', marginBottom: 20, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto', animation: 'fadeUp 0.4s ease', position: 'relative', overflow: 'hidden' }}>
                      {jarvisMode && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.4), transparent)' }} />}
                      <p style={{ fontSize: 13, color: t.textSub, lineHeight: 1.7, margin: 0 }}>✦ {smartSummary}</p>
                    </div>
                  )}

                  {!smartSummary && !loadingSmartSummary && (
                    <p style={{ fontSize: 15, color: t.textSub, lineHeight: 1.7, maxWidth: 300, margin: '0 auto 20px' }}>
                      Este é seu espaço sagrado. Como você está se sentindo hoje?
                    </p>
                  )}

                  {/* Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                    {[
                      { label: '✦ Journaling guiado', action: handleStartJournaling, highlight: true },
                      { label: 'Estou ansioso', action: () => sendMessage('Estou me sentindo ansioso ultimamente.') },
                      { label: 'Quero refletir',  action: () => sendMessage('Quero fazer uma reflexão sobre minha vida.') },
                      { label: 'Me sinto bem',    action: () => sendMessage('Estou me sentindo bem hoje!') },
                    ].map(chip => (
                      <button key={chip.label} onClick={() => { audio.init(); chip.action() }} style={{
                        padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                        cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                        border: chip.highlight ? 'none' : `0.5px solid ${t.cardBorder}`,
                        background: chip.highlight ? t.violet : t.card,
                        color: chip.highlight ? 'white' : t.textSub,
                        boxShadow: chip.highlight ? '0 4px 14px rgba(139,92,246,0.35)' : 'none',
                      }}>
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Histórico */}
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', animation: 'msgIn 0.35s ease' }}>
                  {msg.role === 'assistant' && (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: msg.isJournaling ? 'rgba(167,139,250,0.2)' : t.violetBg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {msg.isJournaling
                        ? <span style={{ fontSize: 14, animation: 'pulse 2s infinite' }}>✦</span>
                        : <CrystalLogo size={18} />}
                    </div>
                  )}
                  <div style={{
                    maxWidth: '74%', padding: '13px 17px', fontSize: 15, lineHeight: 1.7,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    background: msg.role === 'user' ? (msg.isJournaling ? '#6D28D9' : t.userBubble) : t.botBubble,
                    color: msg.role === 'user' ? 'white' : t.text,
                    boxShadow: msg.role === 'user'
                      ? '0 4px 16px rgba(139,92,246,0.28)'
                      : `0 1px 8px rgba(0,0,0,${isDark ? '0.25' : '0.06'})`,
                    border: msg.role === 'assistant' ? `0.5px solid ${msg.isJournaling ? 'rgba(167,139,250,0.3)' : t.botBorder}` : 'none',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {/* Linha de topo holográfica nos msgs do bot */}
                    {jarvisMode && msg.role === 'assistant' && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)' }} />
                    )}
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Digitando — JARVIS waveform */}
              {isTyping && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', animation: 'fadeUp 0.3s ease' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: isJournalingMode ? 'rgba(167,139,250,0.2)' : t.violetBg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isJournalingMode
                      ? <span style={{ fontSize: 14, animation: 'pulse 1s infinite' }}>✦</span>
                      : <CrystalLogo size={18} animate={jarvisMode} />}
                  </div>
                  <div style={{ background: t.botBubble, border: `0.5px solid ${t.botBorder}`, borderRadius: '20px 20px 20px 4px', padding: jarvisMode ? '8px 14px' : '14px 18px', display: 'flex', gap: 5, alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                    {jarvisMode && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)' }} />}
                    {jarvisMode
                      ? <JarvisWaveform color={t.violet} />
                      : [0, 1, 2].map(i => (
                          <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: t.dot, animation: `waveBar 1.2s ${i * 0.15}s infinite` }} />
                        ))
                    }
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <div style={{ background: t.header, borderTop: `0.5px solid ${t.headerBorder}`, padding: '12px 16px 18px', flexShrink: 0, position: 'relative', zIndex: 10 }}>
            {jarvisMode && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.4) 50%, transparent 100%)' }} />}
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              <div style={{
                display: 'flex', gap: 10, alignItems: 'flex-end',
                background: t.input, borderRadius: 20,
                padding: '8px 8px 8px 18px',
                border: `1.5px solid ${isJournalingMode ? 'rgba(167,139,250,0.4)' : t.inputBorder}`,
                transition: 'border-color 0.2s', position: 'relative', overflow: 'hidden',
              }}
                onFocusCapture={e => (e.currentTarget.style.borderColor = t.violet)}
                onBlurCapture={e => (e.currentTarget.style.borderColor = isJournalingMode ? 'rgba(167,139,250,0.4)' : t.inputBorder)}>
                <textarea
                  ref={textareaRef} value={input}
                  onChange={e => { setInput(e.target.value); autoResize() }}
                  onKeyDown={handleKey}
                  placeholder={isJournalingMode ? 'Escreva sua reflexão...' : 'Compartilhe seus pensamentos...'}
                  rows={1}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 15, lineHeight: 1.6, resize: 'none', fontFamily: "'DM Sans', sans-serif", color: t.text, maxHeight: 120, padding: '4px 0' }}
                />
                <button onClick={handleSend} disabled={isTyping || !input.trim()} style={{
                  width: 42, height: 42, borderRadius: 13, border: 'none', flexShrink: 0,
                  cursor: isTyping || !input.trim() ? 'not-allowed' : 'pointer',
                  background: isTyping || !input.trim() ? t.violetBg : t.violet,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                  boxShadow: isTyping || !input.trim() ? 'none' : '0 4px 14px rgba(139,92,246,0.45)',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
              <p style={{ textAlign: 'center', fontSize: 11, color: t.textMuted, marginTop: 7 }}>
                {isJournalingMode
                  ? '✦ Sessão de journaling guiado — espaço sagrado de reflexão'
                  : jarvisMode
                  ? 'CLARAMENTE // PROTOCOLO INTROSPECTIVO ATIVO // CVV: 188'
                  : 'Não substitui acompanhamento psicológico profissional · CVV: 188'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}