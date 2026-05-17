import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useChat } from '@/hooks/useChat'
import type { ConversationItem } from '@/hooks/useChat'

function CrystalLogo({ size = 24, light = false }: { size?: number; light?: boolean }) {
  const c = light ? 'rgba(255,255,255,0.8)' : '#8B5CF6'
  const cf = light ? 'rgba(255,255,255,0.15)' : 'rgba(139,92,246,0.15)'
  const cm = light ? 'rgba(255,255,255,0.35)' : 'rgba(139,92,246,0.35)'
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <path d="M28 4L50 18V38L28 52L6 38V18Z" fill={cf} stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M28 4L6 18H50Z" fill={cm}/>
      <line x1="6" y1="18" x2="28" y2="30" stroke={light ? 'rgba(255,255,255,0.5)' : 'rgba(139,92,246,0.6)'} strokeWidth="1.2"/>
      <line x1="50" y1="18" x2="28" y2="30" stroke={light ? 'rgba(255,255,255,0.5)' : 'rgba(139,92,246,0.6)'} strokeWidth="1.2"/>
      <circle cx="28" cy="30" r="3" fill={c}/>
    </svg>
  )
}

function groupConversations(conversations: ConversationItem[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7)

  const groups: { label: string; items: ConversationItem[] }[] = [
    { label: 'Hoje', items: [] },
    { label: 'Ontem', items: [] },
    { label: 'Esta semana', items: [] },
    { label: 'Mais antigas', items: [] },
  ]

  conversations.forEach(conv => {
    const date = new Date(conv.started_at)
    if (date >= today) groups[0].items.push(conv)
    else if (date >= yesterday) groups[1].items.push(conv)
    else if (date >= weekAgo) groups[2].items.push(conv)
    else groups[3].items.push(conv)
  })

  return groups.filter(g => g.items.length > 0)
}

export default function Home() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { t, isDark, toggle } = useTheme()
  const { messages, isTyping, isCrisis, conversationId, conversations, sendMessage, resetChat, loadConversation } = useChat()
  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

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
    await sendMessage(text)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  async function handleLoadConversation(id: string) {
    await loadConversation(id)
    setSidebarOpen(false)
  }

  const firstName = profile?.name?.split(' ')[0] || 'você'
  const grouped = groupConversations(conversations)

  const SIDEBAR_BG = '#0D0B1A'
  const SIDEBAR_BORDER = 'rgba(139,92,246,0.12)'
  const SIDEBAR_TEXT = 'rgba(255,255,255,0.75)'
  const SIDEBAR_MUTED = '#4A4268'
  const SIDEBAR_HOVER = 'rgba(139,92,246,0.1)'
  const SIDEBAR_ACTIVE = 'rgba(139,92,246,0.18)'

  const Sidebar = () => (
    <aside style={{
      width: 260, flexShrink: 0, background: SIDEBAR_BG,
      display: 'flex', flexDirection: 'column', height: '100%',
      borderRight: `0.5px solid ${SIDEBAR_BORDER}`,
    }}>
      {/* Logo */}
      <div style={{ padding: '16px 14px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `0.5px solid ${SIDEBAR_BORDER}` }}>
        <CrystalLogo size={22} light />
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: SIDEBAR_TEXT, letterSpacing: -0.3 }}>Claramente</span>
      </div>

      {/* Nova conversa */}
      <div style={{ padding: '10px 10px 6px' }}>
        <button onClick={() => { resetChat(); setSidebarOpen(false) }} style={{
          width: '100%', padding: '9px 12px', background: 'rgba(139,92,246,0.15)',
          border: '0.5px solid rgba(139,92,246,0.25)', borderRadius: 10,
          color: '#A78BFA', fontSize: 13, display: 'flex', alignItems: 'center',
          gap: 8, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.25)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.15)')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nova conversa
        </button>
      </div>

      {/* Lista de conversas */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
        <style>{`::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.2);border-radius:3px}`}</style>

        {grouped.length === 0 && (
          <p style={{ fontSize: 12, color: SIDEBAR_MUTED, textAlign: 'center', padding: '24px 12px', lineHeight: 1.6 }}>
            Nenhuma conversa ainda.<br />Inicie uma nova conversa!
          </p>
        )}

        {grouped.map(group => (
          <div key={group.label}>
            <p style={{ fontSize: 10, color: SIDEBAR_MUTED, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', padding: '10px 8px 5px' }}>
              {group.label}
            </p>
            {group.items.map(conv => (
              <button key={conv.id} onClick={() => handleLoadConversation(conv.id)} style={{
                width: '100%', textAlign: 'left', padding: '8px 10px',
                borderRadius: 8, border: 'none', cursor: 'pointer',
                background: conversationId === conv.id ? SIDEBAR_ACTIVE : 'transparent',
                marginBottom: 2, transition: 'background 0.15s',
                display: 'block',
              }}
                onMouseEnter={e => { if (conversationId !== conv.id) e.currentTarget.style.background = SIDEBAR_HOVER }}
                onMouseLeave={e => { if (conversationId !== conv.id) e.currentTarget.style.background = 'transparent' }}>
                <p style={{ fontSize: 13, color: conversationId === conv.id ? '#E9E4FF' : SIDEBAR_TEXT, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>
                  {conv.title}
                </p>
                <p style={{ fontSize: 11, color: SIDEBAR_MUTED, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>
                  {conv.preview}
                </p>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Rodapé */}
      <div style={{ padding: '10px 12px 14px', borderTop: `0.5px solid ${SIDEBAR_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#A78BFA' }}>
            {firstName.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: 12, color: '#6B6480', fontFamily: "'DM Sans', sans-serif" }}>{firstName}</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={toggle} title={isDark ? 'Modo claro' : 'Modo escuro'} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'rgba(255,255,255,0.05)', color: '#6B6480', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 0.2s' }}>
            {isDark ? '☀️' : '🌙'}
          </button>
          <button onClick={() => navigate('/relatorios')} title="Relatórios" style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'rgba(255,255,255,0.05)', color: '#6B6480', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 0.2s' }}>
            📊
          </button>
          <button onClick={signOut} title="Sair" style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'rgba(255,255,255,0.05)', color: '#6B6480', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, transition: 'all 0.2s' }}>
            →
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div style={{ height: '100dvh', display: 'flex', background: t.bg, fontFamily: "'DM Sans', 'Plus Jakarta Sans', sans-serif", position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box}
        @keyframes bounceDot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}
        textarea::placeholder{color:${t.placeholder}!important}
      `}</style>

      {/* Sidebar — desktop */}
      <div style={{ display: 'none' }} className="sidebar-desktop">
        <Sidebar />
      </div>

      {/* Sidebar — mobile overlay */}
      {sidebarOpen && (
        <>
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, animation: 'slideIn 0.25s ease' }}>
            <Sidebar />
          </div>
        </>
      )}

      {/* Sidebar — desktop inline */}
      <style>{`@media(min-width:700px){.sidebar-desktop{display:flex!important;height:100%}}`}</style>
      <div className="sidebar-desktop" style={{ display: 'none', height: '100%' }}>
        <Sidebar />
      </div>

      {/* Chat principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, transition: 'background 0.3s' }}>

        {/* Header mobile */}
        <header style={{ background: t.header, borderBottom: `0.5px solid ${t.headerBorder}`, padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}
          className="mobile-header">
          <style>{`@media(min-width:700px){.mobile-header{display:none!important}}`}</style>
          <button onClick={() => setSidebarOpen(true)} style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', color: t.violet, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            <CrystalLogo size={22} />
          </button>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: t.text }}>Claramente</span>
          <button onClick={toggle} style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </header>

        {/* Crise */}
        {isCrisis && (
          <div style={{ margin: '10px 16px 0', padding: '12px 16px', borderRadius: 14, background: '#FFF7ED', border: '1px solid #FED7AA', fontSize: 13, color: '#92400E', lineHeight: 1.6 }}>
            🆘 <strong>CVV: 188</strong> (gratuito, 24h) · cvv.org.br
          </div>
        )}

        {/* Mensagens */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 8px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '52px 20px 20px', animation: 'fadeUp 0.5s ease' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: t.violetBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                  <CrystalLogo size={34} />
                </div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: t.text, marginBottom: 10, fontWeight: 400 }}>
                  Olá, {firstName}
                </h2>
                <p style={{ fontSize: 15, color: t.textSub, lineHeight: 1.7, maxWidth: 300, margin: '0 auto' }}>
                  Este é seu espaço sagrado. Como você está se sentindo hoje?
                </p>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', animation: 'fadeUp 0.3s ease' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: t.violetBg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CrystalLogo size={18} />
                  </div>
                )}
                <div style={{
                  maxWidth: '74%', padding: '13px 17px', fontSize: 15, lineHeight: 1.7,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  background: msg.role === 'user' ? t.userBubble : t.botBubble,
                  color: msg.role === 'user' ? 'white' : t.text,
                  boxShadow: msg.role === 'user' ? '0 4px 14px rgba(139,92,246,0.25)' : `0 1px 8px rgba(0,0,0,${isDark ? '0.2' : '0.05'})`,
                  border: msg.role === 'assistant' ? `0.5px solid ${t.botBorder}` : 'none',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: t.violetBg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CrystalLogo size={18} />
                </div>
                <div style={{ background: t.botBubble, border: `0.5px solid ${t.botBorder}`, borderRadius: '20px 20px 20px 4px', padding: '14px 18px', display: 'flex', gap: 5 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: t.dot, animation: `bounceDot 1.2s ${i * 0.15}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div style={{ background: t.header, borderTop: `0.5px solid ${t.headerBorder}`, padding: '12px 16px 18px', flexShrink: 0 }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: t.input, borderRadius: 20, padding: '8px 8px 8px 18px', border: `1.5px solid ${t.inputBorder}`, transition: 'border-color 0.2s' }}
              onFocusCapture={e => (e.currentTarget.style.borderColor = t.violet)}
              onBlurCapture={e => (e.currentTarget.style.borderColor = t.inputBorder)}>
              <textarea ref={textareaRef} value={input} onChange={e => { setInput(e.target.value); autoResize() }} onKeyDown={handleKey}
                placeholder="Compartilhe seus pensamentos..." rows={1}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 15, lineHeight: 1.6, resize: 'none', fontFamily: "'DM Sans', sans-serif", color: t.text, maxHeight: 120, padding: '4px 0' }} />
              <button onClick={handleSend} disabled={isTyping || !input.trim()} style={{
                width: 42, height: 42, borderRadius: 13, border: 'none', flexShrink: 0,
                cursor: isTyping || !input.trim() ? 'not-allowed' : 'pointer',
                background: isTyping || !input.trim() ? t.violetBg : t.violet,
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                boxShadow: isTyping || !input.trim() ? 'none' : '0 4px 12px rgba(139,92,246,0.4)',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <p style={{ textAlign: 'center', fontSize: 11, color: t.textMuted, marginTop: 8 }}>
              Não substitui acompanhamento psicológico profissional · CVV: 188
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}