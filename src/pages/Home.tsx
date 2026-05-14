import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useChat } from '@/hooks/useChat'

function CrystalLogo({ size = 28, color = '#8B5CF6' }: { size?: number; color?: string }) {
  const c = color, cf = `${color}26`, cl = `${color}99`
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <path d="M28 4L50 18V38L28 52L6 38V18Z" fill={cf} stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M28 4L6 18H50Z" fill={cl}/>
      <line x1="6" y1="18" x2="28" y2="30" stroke={cl} strokeWidth="1.2"/>
      <line x1="50" y1="18" x2="28" y2="30" stroke={cl} strokeWidth="1.2"/>
      <circle cx="28" cy="30" r="3" fill={c}/>
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { t, isDark, toggle } = useTheme()
  const { messages, isTyping, isCrisis, sendMessage, resetChat } = useChat()
  const [input, setInput] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
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
    await sendMessage(text)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const firstName = profile?.name?.split(' ')[0] || 'você'

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: t.bg, transition: 'background 0.3s, color 0.3s', fontFamily: "'DM Sans','Plus Jakarta Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box}
        @keyframes bounceDot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:600px){.nav-d{display:none!important}.nav-m{display:flex!important}}
        @media(min-width:601px){.nav-m{display:none!important}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${t.violetBg};border-radius:4px}
        textarea::placeholder{color:${t.placeholder}!important}
      `}</style>

      {/* Header */}
      <header style={{ background: t.header, borderBottom: `1px solid ${t.headerBorder}`, padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, transition: 'background 0.3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CrystalLogo size={30} />
          <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20, color: t.text, letterSpacing: -0.4, transition: 'color 0.3s' }}>Claramente</span>
        </div>

        {/* Desktop */}
        <nav className="nav-d" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={resetChat} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: t.textSub, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>
            Nova conversa
          </button>
          <button onClick={() => navigate('/relatorios')} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: t.violetBg, cursor: 'pointer', fontSize: 13, color: t.violetDark, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>
            ✦ Relatórios
          </button>
          <div style={{ width: 1, height: 20, background: t.headerBorder, margin: '0 8px' }} />

          {/* Toggle tema */}
          <button onClick={toggle} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${t.cardBorder}`, background: t.violetBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.violet, transition: 'all 0.2s' }}
            title={isDark ? 'Modo claro' : 'Modo escuro'}>
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          <div style={{ width: 32, height: 32, borderRadius: '50%', background: t.violetBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: t.violetDark, marginLeft: 4 }}>
            {firstName.charAt(0).toUpperCase()}
          </div>
          <button onClick={signOut} style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${t.cardBorder}`, background: 'none', cursor: 'pointer', fontSize: 13, color: t.textSub, fontFamily: "'DM Sans',sans-serif" }}>
            Sair
          </button>
        </nav>

        {/* Mobile */}
        <div className="nav-m" style={{ display: 'none', alignItems: 'center', gap: 8 }}>
          <button onClick={toggle} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${t.cardBorder}`, background: t.violetBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.violet }}>
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ width: 36, height: 36, borderRadius: '50%', background: t.violetBg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: t.violetDark }}>
            {firstName.charAt(0).toUpperCase()}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ background: t.menu, borderBottom: `1px solid ${t.headerBorder}`, padding: '8px 20px 16px', transition: 'background 0.3s' }}>
          <div style={{ fontSize: 13, color: t.textSub, padding: '10px 0 12px', borderBottom: `1px solid ${t.divider}`, marginBottom: 4 }}>
            Olá, <strong style={{ color: t.text }}>{firstName}</strong>
          </div>
          {[
            { label: 'Nova conversa', icon: '✦', action: () => { resetChat(); setMenuOpen(false) } },
            { label: 'Relatórios', icon: '◆', action: () => { navigate('/relatorios'); setMenuOpen(false) }, highlight: true },
            { label: 'Sair', icon: '→', action: signOut },
          ].map(item => (
            <button key={item.label} onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: item.highlight ? t.violet : t.textSub, fontFamily: "'DM Sans',sans-serif", fontWeight: item.highlight ? 600 : 400 }}>
              <span style={{ fontSize: 11, color: t.violet, width: 16 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Crise */}
      {isCrisis && (
        <div style={{ margin: '12px 16px 0', padding: '14px 18px', borderRadius: 16, background: '#FFF7ED', border: '1px solid #FED7AA', fontSize: 13, color: '#92400E', lineHeight: 1.6 }}>
          🆘 <strong>CVV: 188</strong> (gratuito, 24h) · cvv.org.br
        </div>
      )}

      {/* Mensagens */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px 8px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px 20px', animation: 'fadeUp 0.5s ease' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: t.violetBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', transition: 'background 0.3s' }}>
                <CrystalLogo size={34} />
              </div>
              <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: t.text, marginBottom: 10, fontWeight: 400, transition: 'color 0.3s' }}>
                Olá, {firstName}
              </h2>
              <p style={{ fontSize: 15, color: t.textSub, lineHeight: 1.7, maxWidth: 300, margin: '0 auto', transition: 'color 0.3s' }}>
                Este é seu espaço sagrado. Como você está se sentindo hoje?
              </p>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', animation: 'fadeUp 0.3s ease' }}>
              {msg.role === 'assistant' && (
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: t.violetBg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}>
                  <CrystalLogo size={20} />
                </div>
              )}
              <div style={{
                maxWidth: '72%', padding: '14px 18px', fontSize: 15, lineHeight: 1.7,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word', transition: 'all 0.3s',
                borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                background: msg.role === 'user' ? t.userBubble : t.botBubble,
                color: msg.role === 'user' ? 'white' : t.text,
                boxShadow: msg.role === 'user' ? '0 4px 16px rgba(139,92,246,0.3)' : `0 2px 12px rgba(0,0,0,${isDark ? '0.2' : '0.06'})`,
                border: msg.role === 'assistant' ? `1px solid ${t.botBorder}` : 'none',
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: t.violetBg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CrystalLogo size={20} />
              </div>
              <div style={{ background: t.botBubble, border: `1px solid ${t.botBorder}`, borderRadius: '20px 20px 20px 4px', padding: '16px 20px', display: 'flex', gap: 6, boxShadow: `0 2px 12px rgba(0,0,0,${isDark ? '0.2' : '0.06'})` }}>
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
      <div style={{ background: t.header, borderTop: `1px solid ${t.headerBorder}`, padding: '14px 16px 20px', flexShrink: 0, transition: 'background 0.3s' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: t.input, borderRadius: 20, padding: '8px 8px 8px 18px', border: `1.5px solid ${t.inputBorder}`, transition: 'all 0.2s' }}
            onFocusCapture={e => (e.currentTarget.style.borderColor = t.violet)}
            onBlurCapture={e => (e.currentTarget.style.borderColor = t.inputBorder)}>
            <textarea ref={textareaRef} value={input} onChange={e => { setInput(e.target.value); autoResize() }} onKeyDown={handleKey}
              placeholder="Compartilhe seus pensamentos..." rows={1}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 15, lineHeight: 1.6, resize: 'none', fontFamily: "'DM Sans',sans-serif", color: t.text, maxHeight: 120, padding: '4px 0' }} />
            <button onClick={handleSend} disabled={isTyping || !input.trim()} style={{
              width: 44, height: 44, borderRadius: 14, border: 'none', flexShrink: 0,
              cursor: isTyping || !input.trim() ? 'not-allowed' : 'pointer',
              background: isTyping || !input.trim() ? t.violetBg : t.violet,
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
              boxShadow: isTyping || !input.trim() ? 'none' : '0 4px 12px rgba(139,92,246,0.4)',
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
  )
}