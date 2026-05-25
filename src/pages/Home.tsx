// src/pages/Home.tsx
// ─────────────────────────────────────────────────────────────────────
// Claramente — Home / Chat
// Layout estilo GitHub: top bar fixo com hamburger + avatar (botão home),
// sidebar como drawer (abre só quando clica no hamburger).
// Mantém TODA a lógica: useChat, useProactive, audio, speechEngine,
// emotionEngine, mute, journaling, crisis, ProactiveCard.
// ─────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useChat } from '@/hooks/useChat'
import { useProactive } from '@/hooks/useProactive'
import { audio } from '@/lib/audioEngine'
import { speechEngine } from '@/lib/speechEngine'
import { emotionEngine } from '@/lib/emotionEngine'
import { ProactiveCard } from '@/components/ProactiveCard'
import { ClaramenteLogo } from '@/components/Logo'
import {
  Send, Plus, Sparkle, Volume, VolumeOff,
  BarChart, Person, LogOut, Sun, Moon, Menu, Mic,
} from '@/components/Icons'
import type { ConversationItem } from '@/hooks/useChat'
import { useColors, fontStack } from '@/lib/theme'
import { useVoiceInput } from '@/hooks/useVoiceInput'

// ── Helpers ─────────────────────────────────────────────────────────
function TypingDots({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%', background: color, opacity: 0.5,
          animation: `tdot 1.3s ${i * 0.18}s ease-in-out infinite`,
        }}/>
      ))}
    </div>
  )
}

function Typewriter({ text, speed = 35, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [shown, setShown] = useState('')
  const [done, setDone]   = useState(false)
  useEffect(() => {
    setShown(''); setDone(false)
    let i = 0
    const id = setInterval(() => {
      if (i < text.length) setShown(text.slice(0, ++i))
      else { clearInterval(id); setDone(true); onDone?.() }
    }, speed)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])
  return <>{shown}{!done && <span style={{ opacity: 0.3, animation: 'blink 1s infinite' }}>|</span>}</>
}

function groupConvs(convs: ConversationItem[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yest = new Date(today); yest.setDate(today.getDate() - 1)
  const week = new Date(today); week.setDate(today.getDate() - 7)
  const g = [
    { label: 'Hoje',         items: [] as ConversationItem[] },
    { label: 'Ontem',        items: [] as ConversationItem[] },
    { label: 'Esta semana',  items: [] as ConversationItem[] },
    { label: 'Mais antigas', items: [] as ConversationItem[] },
  ]
  convs.forEach(c => {
    const d = new Date(c.started_at)
    if      (d >= today) g[0].items.push(c)
    else if (d >= yest)  g[1].items.push(c)
    else if (d >= week)  g[2].items.push(c)
    else                 g[3].items.push(c)
  })
  return g.filter(x => x.items.length > 0)
}

// ── Page ────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { isDark, toggle }   = useTheme()
  const t = useColors()
  const mode = isDark ? 'dark' : 'light'

  const {
    messages, isTyping, isCrisis, isJournalingMode,
    conversationId, conversations,
    smartSummary, loadingSmartSummary,
    sendMessage, resetChat, loadConversation, startJournaling,
  } = useChat()

  const [input, setInput]             = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [muted, setMuted]             = useState(false)
  const [greetDone, setGreetDone]     = useState(false)
  const [mounted, setMounted]         = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const taRef     = useRef<HTMLTextAreaElement>(null)
  const prevLen   = useRef(0)

  // ── Voice input (Web Speech API) ──────────────────────────
  const voice = useVoiceInput('pt-BR')
  // Sincroniza o transcript com o textarea enquanto grava
  useEffect(() => {
    if (voice.isListening) {
      setInput(voice.transcript)
      if (taRef.current) {
        taRef.current.style.height = 'auto'
        taRef.current.style.height = Math.min(taRef.current.scrollHeight, 120) + 'px'
      }
    }
  }, [voice.transcript, voice.isListening])

  function toggleVoice() {
    speechEngine.unlock() // destrava TTS no mobile no primeiro toque
    if (!voice.isSupported) {
      // Mantém no input.error — será exibido no rodapé
      return
    }
    if (voice.isListening) {
      voice.stop()
    } else {
      audio.init()
      speechEngine.stop()
      voice.reset()
      setInput('')
      voice.start()
    }
  }

  const { suggestion, dismiss } = useProactive(messages.length, isTyping)
  const grouped   = groupConvs(conversations)
  const firstName = profile?.name?.split(' ')[0] || 'você'
  const initial   = (profile?.name || firstName).charAt(0).toUpperCase()
  const avatarUrl = (profile as unknown as { avatar_url?: string })?.avatar_url || ''

  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])
  useEffect(() => emotionEngine.subscribe(() => {}), [])
  useEffect(() => {
    const id = setTimeout(() => speechEngine.speakWelcome(firstName), 600)
    return () => clearTimeout(id)
  }, [firstName])
  useEffect(() => {
    if (messages.length > prevLen.current) {
      const last = messages.slice(prevLen.current).pop()
      if (last?.role === 'assistant') {
        audio.playAIResponse()
        const s = (last as unknown as { sentiment?: string }).sentiment
        if (s) emotionEngine.updateFromSentiment(s, [])
        setTimeout(() => speechEngine.speak(last.content, { rate: 1.02, pitch: 0.94 }), 250)
      }
    }
    prevLen.current = messages.length
  }, [messages])
  useEffect(() => { if (isTyping) { audio.playAIStart(); speechEngine.stop() } }, [isTyping])

  // Close sidebar on Esc
  useEffect(() => {
    if (!sidebarOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSidebarOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sidebarOpen])

  const handleMute = useCallback(() => {
    const n = !muted; setMuted(n); speechEngine.setMuted(n)
    if (n) speechEngine.stop()
    audio.playClick()
  }, [muted])

  function autoResize() {
    if (!taRef.current) return
    taRef.current.style.height = 'auto'
    taRef.current.style.height = Math.min(taRef.current.scrollHeight, 120) + 'px'
  }

  async function handleSend() {
    if (!input.trim() || isTyping) return
    const txt = input.trim(); setInput('')
    if (taRef.current) taRef.current.style.height = 'auto'
    audio.init(); audio.playMessageSent(); speechEngine.speakAck(firstName)
    speechEngine.unlock() // destrava TTS no mobile no primeiro gesto
    await sendMessage(txt)
  }

  const onKey    = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }
  const newChat  = () => { prevLen.current = 0; resetChat(); setSidebarOpen(false) }
  const loadConv = (id: string) => async () => { prevLen.current = 0; await loadConversation(id); setSidebarOpen(false) }
  const journal  = async () => { audio.init(); audio.playJournaling(); speechEngine.speakJournalingStart(); prevLen.current = 0; await startJournaling(); setSidebarOpen(false) }

  // ── Avatar (home button) ──────────────────────────────────────────
  const AvatarHome = () => (
    <button
      onClick={newChat}
      title="Nova conversa"
      style={{
        width: 36, height: 36, borderRadius: '50%',
        border: `2px solid ${t.accent}66`,
        padding: 0, cursor: 'pointer', overflow: 'hidden',
        background: avatarUrl ? t.accentSoft : `linear-gradient(135deg, ${t.accent}, ${t.accentDeep})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s', flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = t.accent
        e.currentTarget.style.boxShadow = `0 0 0 3px ${t.accent}22`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = `${t.accent}66`
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={firstName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={() => {}}/>
      ) : (
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: fontStack }}>{initial}</span>
      )}
    </button>
  )

  // ── Sidebar drawer content ────────────────────────────────────────
  const SidebarContent = () => (
    <aside style={{
      width: 280, height: '100%', display: 'flex', flexDirection: 'column',
      background: t.surface2, borderRight: `1px solid ${t.border}`, fontFamily: fontStack,
    }}>
      {/* Brand */}
      <div style={{ padding: '18px 18px 14px', borderBottom: `1px solid ${t.borderSoft}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <ClaramenteLogo size={32} mode={mode}/>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: t.text, margin: 0, letterSpacing: -0.2, lineHeight: 1.2 }}>Claramente</p>
            <p style={{ fontSize: 11, color: t.accentDeep, margin: 0, fontStyle: 'italic', opacity: 0.85, lineHeight: 1.2, marginTop: 2 }}>
              Sua mente em equilíbrio.
            </p>
          </div>
        </div>

        <button
          onClick={newChat}
          style={{
            width: '100%', height: 38, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: t.accent, color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: fontStack,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: `0 2px 8px ${t.accent}44, inset 0 1px 0 rgba(255,255,255,0.22)`,
            transition: 'filter 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
          onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
        >
          <Plus size={14} color="#fff"/> Nova conversa
        </button>
      </div>

      {/* Conversations list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 8, minHeight: 0 }}>
        {grouped.length === 0 && (
          <p style={{ fontSize: 13, color: t.textMuted, padding: '24px 8px', textAlign: 'center', lineHeight: 1.6 }}>
            Nenhuma conversa ainda.
          </p>
        )}
        {grouped.map(g => (
          <div key={g.label} style={{ marginBottom: 6 }}>
            <p style={{
              fontSize: 10, fontWeight: 600, color: t.textMuted,
              padding: '10px 10px 6px', letterSpacing: 0.7, textTransform: 'uppercase', margin: 0,
            }}>{g.label}</p>
            {g.items.map(c => {
              const active = conversationId === c.id
              return (
                <button
                  key={c.id}
                  onClick={loadConv(c.id)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '8px 10px 8px 11px',
                    borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: 1,
                    background: active ? (isDark ? t.surface3 : '#fff') : 'transparent',
                    boxShadow: active && !isDark ? '0 1px 3px rgba(106,64,48,0.06)' : 'none',
                    borderLeft: active ? `2px solid ${t.accent}` : '2px solid transparent',
                    fontFamily: fontStack,
                  }}
                >
                  <p style={{
                    fontSize: 13, fontWeight: active ? 600 : 500,
                    color: active ? t.text : t.textSub,
                    margin: '0 0 2px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{c.title}</p>
                  <p style={{
                    fontSize: 11.5, color: t.textMuted, margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{c.preview}</p>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Sidebar footer — actions */}
      <div style={{
        padding: 10, borderTop: `1px solid ${t.borderSoft}`,
        display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0,
      }}>
        <button onClick={journal} style={drawerCta(t)}>
          <Sparkle size={14} color={t.accentDeep}/> Journaling guiado
        </button>
        <button onClick={() => { navigate('/relatorios'); setSidebarOpen(false) }} style={drawerLink(t)}>
          <BarChart size={14} color={t.textSub}/> Relatórios
        </button>
        <button onClick={() => { navigate('/perfil'); setSidebarOpen(false) }} style={drawerLink(t)}>
          <Person size={14} color={t.textSub}/> Meu perfil
        </button>
        <button onClick={() => { signOut(); setSidebarOpen(false) }} style={drawerLink(t, t.danger)}>
          <LogOut size={14} color={t.danger}/> Sair
        </button>
      </div>

      {/* User row */}
      <div style={{
        margin: 10, padding: '8px 10px', borderRadius: 10,
        background: isDark ? t.surface : '#fff',
        border: `1px solid ${t.borderSoft}`,
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: avatarUrl ? t.accentSoft : `linear-gradient(135deg, ${t.accent}, ${t.accentDeep})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {avatarUrl
            ? <img src={avatarUrl} alt={firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            : <span style={{ color: '#fff', fontSize: 12.5, fontWeight: 600 }}>{initial}</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: t.text, margin: 0, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile?.name || firstName}
          </p>
          <p style={{ fontSize: 11, color: t.textMuted, margin: 0, lineHeight: 1.2 }}>
            {muted ? 'Som desligado' : 'Som ligado'}
          </p>
        </div>
        <button onClick={toggle} title="Tema" style={iconBtnS(t)}>
          {isDark ? <Sun size={14} color={t.textMuted}/> : <Moon size={14} color={t.textMuted}/>}
        </button>
      </div>
    </aside>
  )

  const CSS = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-text-size-adjust: 100%; }
    body { -webkit-font-smoothing: antialiased; background: ${t.bg}; }
    @keyframes tdot     { 0%,60%,100% { transform: translateY(0); opacity: .4 } 30% { transform: translateY(-4px); opacity: 1 } }
    @keyframes blink    { 0%,100% { opacity: 1 } 50% { opacity: 0 } }
    @keyframes fIn      { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
    @keyframes mIn      { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
    @keyframes sIn      { from { transform: translateX(-100%) } to { transform: translateX(0) } }
    @keyframes auraSoft { 0%,100% { transform: scale(1); opacity: 0.85 } 50% { transform: scale(1.08); opacity: 1 } }
    @keyframes pulseB   { 0%,100% { opacity: 1 } 50% { opacity: 0.35 } }
    @keyframes micPulse { 0%,100% { transform: scale(1); opacity: 0.6 } 50% { transform: scale(1.15); opacity: 0 } }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: ${isDark ? 'rgba(196,131,106,0.22)' : 'rgba(160,101,73,0.18)'}; border-radius: 4px; }
    textarea { -webkit-appearance: none; font-family: 'Inter', sans-serif; }
    textarea::placeholder { color: ${t.textMuted} !important; opacity: 0.7; }

    /* ── Mobile header tweaks ─────────────────────────────────── */
    @media (max-width: 640px) {
      .topbar-logo { display: none !important; }
      .topbar-title { font-size: 13px !important; }
    }
    @media (max-width: 480px) {
      .topbar-title { display: none !important; }
    }
  `

  return (
    <div style={{
      height: '100dvh', minHeight: '100dvh',
      display: 'flex', flexDirection: 'column',
      background: t.bg, fontFamily: fontStack, color: t.text,
      overflow: 'hidden',
      opacity: mounted ? 1 : 0, transition: 'opacity 0.3s ease',
    }}>
      <style>{CSS}</style>

      {/* ─── TOP BAR (GitHub-style) ─────────────────────────────── */}
      <header style={{
        flexShrink: 0,
        height: 56, padding: '0 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: t.surface, borderBottom: `1px solid ${t.border}`,
        gap: 12, zIndex: 20,
      }}>
        {/* Left: hamburger + avatar (home) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            title={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
            style={{
              width: 36, height: 36, borderRadius: 10,
              border: `1px solid ${t.border}`,
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.12s', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = t.surface2; e.currentTarget.style.borderColor = t.accent }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = t.border }}
          >
            <Menu size={16} color={t.textSub}/>
          </button>

          <AvatarHome/>

          <span className="topbar-logo" style={{ display: 'flex' }}>
            <ClaramenteLogo size={24} mode={mode}/>
          </span>
        </div>

        {/* Center: title + status pill */}
        <div className="topbar-center" style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'center', minWidth: 0, paddingLeft: 8, paddingRight: 8 }}>
          <p className="topbar-title" style={{
            fontSize: 14, fontWeight: 600, color: t.text, margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {isJournalingMode ? 'Journaling guiado' : 'Conversa de hoje'}
          </p>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '3px 10px', borderRadius: 999,
            background: t.accentSoft, border: `1px solid ${t.accentBorder}`,
            flexShrink: 0,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.accent, animation: 'pulseB 2.4s ease-in-out infinite' }}/>
            <span style={{ fontSize: 11, fontWeight: 600, color: t.accentDeep, letterSpacing: 0.4 }}>Claramente</span>
          </div>
        </div>

        {/* Right: mute + theme toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={handleMute} style={iconBtnH(t)} title={muted ? 'Som desligado' : 'Som ligado'}>
            {muted ? <VolumeOff size={16} color={t.danger}/> : <Volume size={16} color={t.textMuted}/>}
          </button>
          <button onClick={toggle} style={iconBtnH(t)} title="Tema">
            {isDark ? <Sun size={16} color={t.textMuted}/> : <Moon size={16} color={t.textMuted}/>}
          </button>
        </div>
      </header>

      {/* Journaling banner */}
      {isJournalingMode && (
        <div style={{
          flexShrink: 0,
          padding: '8px 24px', background: t.accentSoft,
          borderBottom: `1px solid ${t.accentBorder}`,
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, fontWeight: 500, color: t.accentDeep,
        }}>
          <Sparkle size={13} color={t.accentDeep}/> Modo Journaling Guiado
          <span style={{ fontWeight: 400, color: t.textMuted, fontSize: 12 }}>— sessão reflexiva</span>
        </div>
      )}

      {/* Crisis banner */}
      {isCrisis && (
        <div style={{
          flexShrink: 0, margin: '12px 24px 0', padding: '10px 14px', borderRadius: 10,
          background: 'transparent', border: `1px dashed ${t.border}`,
          fontSize: 12.5, color: t.textSub, lineHeight: 1.5,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ color: t.accentDeep }}>♡</span>
          Em momentos difíceis, o <strong style={{ color: t.text, fontWeight: 600 }}>CVV (188)</strong> está disponível 24h, gratuitamente · cvv.org.br
        </div>
      )}

      {/* ─── MAIN SCROLL AREA ─────────────────────────────────── */}
      <main style={{
        flex: 1, minHeight: 0, overflowY: 'auto',
        padding: '24px 24px 16px', position: 'relative',
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

          {/* Empty state */}
          {messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0 24px', animation: 'fIn 0.4s ease' }}>
              <div style={{ marginBottom: 18, filter: `drop-shadow(0 8px 24px ${t.accent}55)` }}>
                <ClaramenteLogo size={72} mode={mode} breathing/>
              </div>
              <h2 style={{
                fontSize: 'clamp(22px,4vw,28px)', fontWeight: 600, color: t.text,
                marginBottom: 8, textAlign: 'center', letterSpacing: -0.6,
              }}>
                {!greetDone ? <Typewriter text={`Olá, ${firstName}`} speed={45} onDone={() => setGreetDone(true)}/> : `Olá, ${firstName}`}
              </h2>
              <p style={{ fontSize: 14, color: t.textSub, textAlign: 'center', fontStyle: 'italic' }}>
                Como você está se sentindo hoje?
              </p>

              {loadingSmartSummary && <div style={{ marginTop: 18 }}><TypingDots color={t.accent}/></div>}
              {smartSummary && !loadingSmartSummary && (
                <div style={{
                  background: t.surface, border: `1px solid ${t.border}`,
                  borderLeft: `3px solid ${t.accent}`,
                  borderRadius: '4px 12px 12px 4px',
                  padding: '14px 18px', marginTop: 20, width: '100%', animation: 'fIn 0.4s ease',
                }}>
                  <p style={{ fontSize: 14, color: t.textSub, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
                    {smartSummary}
                  </p>
                </div>
              )}

              {greetDone && (
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10,
                  marginTop: 22, width: '100%', animation: 'fIn 0.4s ease 0.1s both',
                }}>
                  <ActionCard title="Journaling guiado" subtitle="Sessão reflexiva profunda" t={t} accent onClick={() => { audio.init(); journal() }}/>
                  <ActionCard title="Estou ansioso"     subtitle="Preciso conversar sobre isso" t={t}        onClick={() => { audio.init(); sendMessage('Estou me sentindo ansioso ultimamente.') }}/>
                  <ActionCard title="Quero refletir"     subtitle="Momento de introspecção"     t={t}        onClick={() => { audio.init(); sendMessage('Quero fazer uma reflexão sobre minha vida.') }}/>
                  <ActionCard title="Me sinto bem"       subtitle="Compartilhar gratidão"       t={t}        onClick={() => { audio.init(); sendMessage('Estou me sentindo bem hoje!') }}/>
                </div>
              )}
            </div>
          )}

          {suggestion && (
            <div style={{ marginBottom: 16 }}>
              <ProactiveCard
                message={suggestion.message}
                action={suggestion.action}
                onAccept={() => { dismiss(); sendMessage(suggestion.prompt) }}
                onDismiss={dismiss}
                delay={500}
              />
            </div>
          )}

          {/* Messages — prose */}
          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', marginBottom: 24, animation: 'mIn 0.25s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {msg.role === 'assistant' ? (
                  <>
                    <ClaramenteLogo size={18} mode={mode}/>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: t.accentDeep, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      Claramente
                    </span>
                  </>
                ) : (
                  <>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${t.accent}, ${t.accentDeep})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 9, fontWeight: 700,
                    }}>{initial}</div>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: t.textSub, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      Você
                    </span>
                  </>
                )}
              </div>
              <div style={{
                fontSize: msg.role === 'assistant' ? 16 : 15.5,
                lineHeight: msg.role === 'assistant' ? 1.7 : 1.65,
                color: msg.role === 'assistant' ? t.text : t.textSub,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word', letterSpacing: -0.1,
                paddingLeft: 26, marginLeft: 4,
                borderLeft: msg.role === 'assistant' ? `2px solid ${t.accentSoft}` : `2px solid transparent`,
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', animation: 'fIn 0.2s ease' }}>
              <ClaramenteLogo size={18} mode={mode}/>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: t.accentDeep, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Claramente
              </span>
              <TypingDots color={t.accent}/>
            </div>
          )}
          <div ref={bottomRef} style={{ height: 8 }}/>
        </div>
      </main>

      {/* ─── INPUT BAR (fixed in flex bottom) ────────────────── */}
      <div style={{
        flexShrink: 0, position: 'relative',
        padding: '14px 20px',
        paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
        background: t.bg, borderTop: `1px solid ${t.borderSoft}`,
      }}>
        {/* Aura */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 90,
          background: `radial-gradient(ellipse at 50% 100%, ${t.accent}1f 0%, transparent 65%)`,
          filter: 'blur(20px)', pointerEvents: 'none', zIndex: 0,
          animation: 'auraSoft 6s ease-in-out infinite',
        }}/>

        <div style={{ maxWidth: 680, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 6,
            background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 24, padding: 8,
            boxShadow: isDark
              ? '0 8px 24px rgba(0,0,0,0.5)'
              : '0 8px 24px rgba(106,64,48,0.10), 0 2px 4px rgba(106,64,48,0.04)',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
            onFocusCapture={e => {
              e.currentTarget.style.borderColor = t.accent
              e.currentTarget.style.boxShadow = `0 0 0 3px ${t.accent}22, 0 8px 24px rgba(106,64,48,0.10)`
            }}
            onBlurCapture={e => {
              e.currentTarget.style.borderColor = t.border
              e.currentTarget.style.boxShadow = isDark
                ? '0 8px 24px rgba(0,0,0,0.5)'
                : '0 8px 24px rgba(106,64,48,0.10), 0 2px 4px rgba(106,64,48,0.04)'
            }}
          >
            <textarea
              ref={taRef}
              value={input}
              onChange={e => { setInput(e.target.value); autoResize() }}
              onKeyDown={onKey}
              placeholder={
                voice.isListening
                  ? 'Ouvindo... pode falar.'
                  : (isJournalingMode ? 'Escreva sua reflexão...' : 'Como você está se sentindo?')
              }
              rows={1}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontSize: 14.5, lineHeight: 1.6, resize: 'none',
                color: t.text, maxHeight: 120, padding: '10px 12px', display: 'block',
                minWidth: 0,
              }}
            />

            {/* ── Mic button (sempre visível) ────────────────────── */}
            <button
              onClick={toggleVoice}
              disabled={isTyping}
              title={
                !voice.isSupported
                  ? 'Voz não suportada no Opera — use Chrome ou Edge'
                  : voice.isListening ? 'Parar de gravar' : 'Gravar voz'
              }
              style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none', flexShrink: 0,
                cursor: isTyping ? 'not-allowed' : 'pointer',
                background: voice.isListening ? t.danger : (isTyping ? t.surface2 : 'transparent'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
                position: 'relative',
                opacity: voice.isSupported ? 1 : 0.5,
              }}
            >
              <Mic size={16} color={voice.isListening ? '#fff' : t.textMuted}/>
              {voice.isListening && (
                <span style={{
                  position: 'absolute', inset: -4, borderRadius: '50%',
                  border: `2px solid ${t.danger}`, opacity: 0.6,
                  animation: 'micPulse 1.2s ease-in-out infinite',
                  pointerEvents: 'none',
                }}/>
              )}
            </button>

            <button
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
              style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none', flexShrink: 0,
                cursor: isTyping || !input.trim() ? 'not-allowed' : 'pointer',
                background: isTyping || !input.trim() ? t.surface2 : t.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
                boxShadow: isTyping || !input.trim() ? 'none' : `0 2px 8px ${t.accent}66`,
              }}
              onMouseEnter={e => { if (!isTyping && input.trim()) e.currentTarget.style.filter = 'brightness(1.08)' }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)' }}
            >
              <Send size={15} color={isTyping || !input.trim() ? t.textMuted : '#fff'}/>
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: 11, color: voice.error ? t.danger : t.textMuted, marginTop: 8, letterSpacing: 0.2 }}>
            {voice.isListening
              ? 'Pode falar... toque no microfone para parar.'
              : voice.error
                ? voice.error
                : (!voice.isSupported && voice.unsupportedReason)
                  ? voice.unsupportedReason
                  : (isJournalingMode
                    ? 'Sessão de journaling guiado ativa'
                    : 'Claramente não substitui acompanhamento psicológico · CVV: 188')}
          </p>
        </div>
      </div>

      {/* ─── SIDEBAR DRAWER ───────────────────────────────────── */}
      {sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(26,22,18,0.55)',
              backdropFilter: 'blur(4px)', zIndex: 90, animation: 'fIn 0.18s ease',
            }}
          />
          <div style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
            width: 280, maxWidth: '88vw',
            animation: 'sIn 0.24s cubic-bezier(0.16,1,0.3,1)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
          }}>
            <SidebarContent/>
          </div>
        </>
      )}
    </div>
  )
}

// ── Reusable bits ───────────────────────────────────────────────────
type T = ReturnType<typeof useColors>

function iconBtnH(t: T): React.CSSProperties {
  return {
    width: 36, height: 36, borderRadius: 10,
    border: `1px solid ${t.border}`, background: 'transparent', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.12s', flexShrink: 0,
  }
}
function iconBtnS(t: T): React.CSSProperties {
  return {
    width: 30, height: 30, borderRadius: 8,
    border: 'none', background: 'transparent', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
}
function drawerCta(t: T): React.CSSProperties {
  return {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: `1px dashed ${t.accentBorder}`, background: t.accentSoft,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9,
    color: t.accentDeep, fontSize: 12.5, fontWeight: 600, fontFamily: fontStack,
  }
}
function drawerLink(t: T, color?: string): React.CSSProperties {
  return {
    width: '100%', padding: '9px 12px', borderRadius: 10,
    border: 'none', background: 'transparent', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 9,
    color: color || t.textSub, fontSize: 12.5, fontWeight: 500, fontFamily: fontStack,
    textAlign: 'left',
  }
}

function ActionCard({ title, subtitle, t, accent = false, onClick }: {
  title: string; subtitle: string; t: T; accent?: boolean; onClick: () => void
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        height: '100%', width: '100%',
        padding: '14px 16px', borderRadius: 12,
        cursor: 'pointer', textAlign: 'left',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
        background: accent
          ? (hov ? `${t.accent}1A` : t.accentSoft)
          : (hov ? t.surface3 : t.surface),
        border: `1px solid ${accent ? (hov ? t.accent : t.accentBorder) : (hov ? t.border : t.borderSoft)}`,
        transition: 'all 0.15s ease',
        transform: hov ? 'translateY(-1px)' : 'translateY(0)',
        fontFamily: fontStack,
      }}
    >
      <p style={{
        fontSize: 13, fontWeight: 600, margin: 0,
        color: accent ? t.accentDeep : t.text,
        lineHeight: 1.3,
      }}>{title}</p>
      <p style={{ fontSize: 12, margin: 0, color: t.textMuted, lineHeight: 1.4 }}>{subtitle}</p>
    </button>
  )
}
