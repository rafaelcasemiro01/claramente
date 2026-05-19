import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useChat } from '@/hooks/useChat'
import { useProactive } from '@/hooks/useProactive'
import { audio } from '@/lib/audioEngine'
import { speechEngine } from '@/lib/speechEngine'
import { emotionEngine } from '@/lib/emotionEngine'
import { JarvisHUD } from '@/components/JarvisHUD'
import { ProactiveCard } from '@/components/ProactiveCard'
import {
  Mic, Volume, VolumeOff, Send, Plus, Sparkle,
  BarChart, Person, LogOut, Sun, Moon, Menu, Stop,
} from '@/components/Icons'
import type { ConversationItem } from '@/hooks/useChat'

// ─── Typewriter ────────────────────────────────────────────────
function TypewriterText({ text, speed = 40, onComplete }: { text: string; speed?: number; onComplete?: () => void }) {
  const [shown, setShown] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    setShown(''); setDone(false); let i = 0
    const iv = setInterval(() => {
      if (i < text.length) setShown(text.slice(0, ++i))
      else { clearInterval(iv); setDone(true); onComplete?.() }
    }, speed)
    return () => clearInterval(iv)
  }, [text])
  return <span>{shown}{!done && <span style={{ opacity: 0.3 }}>|</span>}</span>
}

// ─── Group conversations ───────────────────────────────────────
function groupConversations(convs: ConversationItem[]) {
  const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yest = new Date(today); yest.setDate(today.getDate() - 1)
  const week = new Date(today); week.setDate(today.getDate() - 7)
  const g = [
    { label: 'Hoje', items: [] as ConversationItem[] },
    { label: 'Ontem', items: [] as ConversationItem[] },
    { label: 'Esta semana', items: [] as ConversationItem[] },
    { label: 'Mais antigas', items: [] as ConversationItem[] },
  ]
  convs.forEach(c => {
    const d = new Date(c.started_at)
    if (d >= today) g[0].items.push(c)
    else if (d >= yest) g[1].items.push(c)
    else if (d >= week) g[2].items.push(c)
    else g[3].items.push(c)
  })
  return g.filter(x => x.items.length > 0)
}

// ─── Status dot ───────────────────────────────────────────────
function StatusDot({ state }: { state: 'idle' | 'listening' | 'thinking' | 'speaking' }) {
  const colors: Record<string, string> = {
    idle: '#6B7280',
    listening: '#EF4444',
    thinking: '#8B5CF6',
    speaking: '#8B5CF6',
  }
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: colors[state], flexShrink: 0,
      animation: state !== 'idle' ? 'dotPulse 1.4s ease-in-out infinite' : 'none',
    }} />
  )
}

// ─── Thinking dots ────────────────────────────────────────────
function ThinkingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', height: 20 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: '50%', background: 'currentColor', opacity: 0.35,
          animation: `dotBounce 1.1s ${i * 0.18}s ease-in-out infinite`,
        }} />
      ))}
    </span>
  )
}

// ─── HOME ──────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { isDark, toggle } = useTheme()
  const {
    messages, isTyping, isCrisis, isJournalingMode,
    conversationId, conversations, smartSummary, loadingSmartSummary,
    sendMessage, resetChat, loadConversation, startJournaling,
  } = useChat()

  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingText, setRecordingText] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [welcomeDone, setWelcomeDone] = useState(false)
  const [showHUD, setShowHUD] = useState(false)
  const [micSupported] = useState(speechEngine.isRecordingSupported)
  const [emotionalProfile, setEmotionalProfile] = useState(emotionEngine.get())

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const prevMsgLen = useRef(0)
  const speakIv = useRef<ReturnType<typeof setInterval> | null>(null)

  const { suggestion, dismiss } = useProactive(messages.length, isTyping)
  const firstName = profile?.name?.split(' ')[0] || 'você'
  const grouped = groupConversations(conversations)
  const orbState: 'idle' | 'listening' | 'thinking' | 'speaking' =
    isRecording ? 'listening' : isTyping ? 'thinking' : isSpeaking ? 'speaking' : 'idle'

  // ─── Effects ─────────────────────────────────────────────────
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])
  useEffect(() => emotionEngine.subscribe(setEmotionalProfile), [])

  useEffect(() => {
    const timer = setTimeout(() => speechEngine.speakWelcome(firstName), 800)
    return () => clearTimeout(timer)
  }, [firstName])

  useEffect(() => {
    if (messages.length > prevMsgLen.current) {
      const last = messages.slice(prevMsgLen.current).pop()
      if (last?.role === 'assistant') {
        audio.playAIResponse()
        const s = (last as unknown as { sentiment?: string }).sentiment
        if (s) emotionEngine.updateFromSentiment(s, [])
        setTimeout(() => speechEngine.speak(last.content, { rate: 1.02, pitch: 0.92 }), 300)
      }
    }
    prevMsgLen.current = messages.length
  }, [messages])

  useEffect(() => { if (isTyping) { audio.playAIStart(); speechEngine.stop() } }, [isTyping])
  useEffect(() => {
    speakIv.current = setInterval(() => setIsSpeaking(speechEngine.isSpeaking()), 200)
    return () => { if (speakIv.current) clearInterval(speakIv.current) }
  }, [])

  // ─── Handlers ─────────────────────────────────────────────────
  const handleMute = useCallback(() => {
    const next = !isMuted; setIsMuted(next); speechEngine.setMuted(next)
    if (next) speechEngine.stop(); audio.playClick()
  }, [isMuted])

  const handleMicToggle = useCallback(() => {
    audio.init()
    if (isRecording) {
      speechEngine.stopRecording(); setIsRecording(false)
      if (recordingText.trim()) { setInput(recordingText.trim()); setRecordingText('') }
    } else {
      const ok = speechEngine.startRecording(
        (text, isFinal) => { setRecordingText(text); if (isFinal) { setInput(p => (p + ' ' + text).trim()); setRecordingText('') } },
        () => setIsRecording(false)
      )
      if (ok) { setIsRecording(true); audio.playClick() }
    }
  }, [isRecording, recordingText])

  function autoResize() {
    const el = textareaRef.current; if (!el) return
    el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 112) + 'px'
  }

  async function handleSend() {
    if (!input.trim() || isTyping) return
    const text = input.trim(); setInput(''); setRecordingText('')
    if (isRecording) { speechEngine.stopRecording(); setIsRecording(false) }
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    audio.init(); audio.playMessageSent(); speechEngine.speakAck(firstName)
    await sendMessage(text)
  }

  function handleKey(e: React.KeyboardEvent) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }
  async function handleLoadConv(id: string) { audio.playClick(); prevMsgLen.current = 0; await loadConversation(id); setSidebarOpen(false) }
  async function handleNewChat() { audio.playClick(); prevMsgLen.current = 0; resetChat(); setSidebarOpen(false) }
  async function handleJournaling() { audio.init(); audio.playJournaling(); speechEngine.speakJournalingStart(); prevMsgLen.current = 0; await startJournaling(); setSidebarOpen(false) }
  async function handleProactiveAccept(prompt: string) { dismiss(); await sendMessage(prompt) }

  // ─── Design tokens ────────────────────────────────────────────
  const D = {
    bg:       isDark ? '#0C0B09' : '#F7F6F3',
    sbBg:     isDark ? '#100F0D' : '#FFFFFF',
    sbBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
    surface:  isDark ? '#181614' : '#FFFFFF',
    surfB:    isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    input:    isDark ? '#1A1815' : '#FFFFFF',
    inputB:   isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    txt:      isDark ? '#EAE7E1' : '#1A1714',
    txtS:     isDark ? 'rgba(234,231,225,0.45)' : 'rgba(26,23,20,0.45)',
    txtM:     isDark ? 'rgba(234,231,225,0.25)' : 'rgba(26,23,20,0.28)',
    accent:   '#8B5CF6',
    accentS:  isDark ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.08)',
    accentB:  isDark ? 'rgba(139,92,246,0.2)'  : 'rgba(139,92,246,0.15)',
    userBg:   isDark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.07)',
    userB:    isDark ? 'rgba(139,92,246,0.18)' : 'rgba(139,92,246,0.13)',
    aiBg:     isDark ? '#1A1815' : '#FFFFFF',
    aiB:      isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
  }

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&family=Geist:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-text-size-adjust: 100%; }
    body { -webkit-font-smoothing: antialiased; }

    @keyframes dotPulse  { 0%,100%{opacity:.8;transform:scale(1)} 50%{opacity:.3;transform:scale(.7)} }
    @keyframes dotBounce { 0%,100%{transform:translateY(0);opacity:.35} 50%{transform:translateY(-4px);opacity:.9} }
    @keyframes fadeUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes msgIn     { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes slideLeft { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
    @keyframes recBlink  { 0%,100%{opacity:1} 50%{opacity:.3} }

    .sb-desktop { display: none !important; }
    .mob-hdr    { display: flex; }
    @media (min-width: 768px) {
      .sb-desktop { display: flex !important; }
      .mob-hdr    { display: none !important; }
    }
    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.15); border-radius: 2px; }
    textarea { -webkit-appearance: none; }
    textarea::placeholder { color: ${D.txtM} !important; }

    .conv-item:hover { background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} !important; }
    .icon-btn:hover { background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'} !important; }
    .quick-btn:hover { background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'} !important; border-color: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} !important; }
    .new-chat-btn:hover { background: ${D.accentB} !important; }
  `

  // ─── SIDEBAR ──────────────────────────────────────────────────
  function Sidebar() {
    return (
      <aside style={{
        width: 260, flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column',
        background: D.sbBg, borderRight: `1px solid ${D.sbBorder}`,
        fontFamily: "'Geist', sans-serif",
      }}>
        {/* Brand */}
        <div style={{
          height: 58, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 10,
          borderBottom: `1px solid ${D.sbBorder}`,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: D.accentS,
            border: `1px solid ${D.accentB}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L14.5 8.5L21 9.3L16.5 13.6L17.6 20L12 17L6.4 20L7.5 13.6L3 9.3L9.5 8.5L12 3Z" stroke={D.accent} strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: D.txt, letterSpacing: -0.3, fontFamily: "'Lora', serif" }}>Claramente</p>
            <p style={{ fontSize: 10, color: D.txtM, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 1 }}>
              {isJournalingMode ? 'journaling ativo' : 'sistema ativo'}
            </p>
          </div>
        </div>

        {/* New chat + Journaling */}
        <div style={{ padding: '12px 10px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button className="new-chat-btn" onClick={handleNewChat} style={{
            width: '100%', height: 36, display: 'flex', alignItems: 'center', gap: 8,
            padding: '0 12px', borderRadius: 9, border: `1px solid ${D.accentB}`,
            background: D.accentS, color: D.accent, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: "'Geist', sans-serif",
            transition: 'all 0.15s ease', WebkitTapHighlightColor: 'transparent',
          }}>
            <Plus size={14} color={D.accent} />
            Nova conversa
          </button>
          <button onClick={handleJournaling} className="quick-btn" style={{
            width: '100%', height: 34, display: 'flex', alignItems: 'center', gap: 8,
            padding: '0 12px', borderRadius: 9,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
            background: 'transparent', color: D.txtS, fontSize: 13,
            cursor: 'pointer', fontFamily: "'Geist', sans-serif",
            transition: 'all 0.15s ease', WebkitTapHighlightColor: 'transparent',
          }}>
            <Sparkle size={13} color={D.txtS} />
            Journaling guiado
          </button>
        </div>

        {/* Conversations */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 6px' }}>
          {grouped.length === 0 && (
            <p style={{ fontSize: 12, color: D.txtM, textAlign: 'center', padding: '28px 16px', lineHeight: 1.7 }}>
              Nenhuma conversa ainda.<br />Comece agora.
            </p>
          )}
          {grouped.map(group => (
            <div key={group.label}>
              <p style={{
                fontSize: 10, color: D.txtM, fontWeight: 500, letterSpacing: 0.8,
                textTransform: 'uppercase', padding: '12px 10px 4px',
              }}>
                {group.label}
              </p>
              {group.items.map(conv => (
                <button key={conv.id} className="conv-item" onClick={() => handleLoadConv(conv.id)} style={{
                  width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8,
                  border: 'none', cursor: 'pointer', marginBottom: 1,
                  background: conversationId === conv.id ? D.accentS : 'transparent',
                  borderLeft: `2px solid ${conversationId === conv.id ? D.accent : 'transparent'}`,
                  transition: 'all 0.12s ease', display: 'block',
                  WebkitTapHighlightColor: 'transparent',
                }}>
                  <p style={{
                    fontSize: 12.5, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    fontWeight: conversationId === conv.id ? 500 : 400,
                    color: conversationId === conv.id ? D.txt : D.txtS,
                  }}>
                    {conv.title}
                  </p>
                  <p style={{ fontSize: 11, color: D.txtM, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.preview}
                  </p>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Emotional HUD toggle */}
        <div style={{ padding: '6px 10px', borderTop: `1px solid ${D.sbBorder}` }}>
          <button onClick={() => setShowHUD(p => !p)} style={{
            width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '7px 10px', borderRadius: 8, border: 'none', background: 'transparent',
            cursor: 'pointer', color: D.txtM, fontSize: 10, letterSpacing: 0.6,
            textTransform: 'uppercase', fontFamily: "'Geist', sans-serif",
            WebkitTapHighlightColor: 'transparent',
          }}>
            <span>Diagnóstico emocional</span>
            <span>{showHUD ? '▲' : '▼'}</span>
          </button>
          {showHUD && <div style={{ marginTop: 6 }}><JarvisHUD visible /></div>}
        </div>

        {/* Status bar */}
        <div style={{
          height: 32, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 6,
          borderTop: `1px solid ${D.sbBorder}`,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: D.txtM, letterSpacing: 0.5 }}>Online</span>
        </div>

        {/* User footer */}
        <div style={{
          height: 54, padding: '0 12px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', borderTop: `1px solid ${D.sbBorder}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', background: D.accentS,
              border: `1px solid ${D.accentB}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 600, color: D.accent,
            }}>
              {firstName.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 12.5, color: D.txtS, fontWeight: 400 }}>{firstName}</span>
          </div>
          <div style={{ display: 'flex', gap: 1 }}>
            {[
              { icon: isDark ? Sun : Moon, action: toggle, label: 'Tema' },
              { icon: isMuted ? VolumeOff : Volume, action: handleMute, label: 'Som' },
              { icon: BarChart, action: () => navigate('/relatorios'), label: 'Relatórios' },
              { icon: Person, action: () => navigate('/perfil'), label: 'Perfil' },
              { icon: LogOut, action: signOut, label: 'Sair' },
            ].map(({ icon: I, action, label }) => (
              <button key={label} className="icon-btn" onClick={action} title={label} style={{
                width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.12s', WebkitTapHighlightColor: 'transparent',
              }}>
                <I size={14} color={label === 'Som' && isMuted ? '#EF4444' : D.txtM} />
              </button>
            ))}
          </div>
        </div>
      </aside>
    )
  }

  // ─── RENDER ───────────────────────────────────────────────────
  return (
    <div style={{ height: '100dvh', display: 'flex', background: D.bg, fontFamily: "'Geist', sans-serif", position: 'relative', overflow: 'hidden' }}>
      <style>{CSS}</style>

      {/* Desktop sidebar */}
      <div className="sb-desktop" style={{ height: '100%' }}><Sidebar /></div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, animation: 'slideLeft 0.2s ease', maxWidth: '82vw' }}>
            <Sidebar />
          </div>
        </>
      )}

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Mobile header */}
        <header className="mob-hdr" style={{
          background: D.sbBg, borderBottom: `1px solid ${D.sbBorder}`,
          height: 52, padding: '0 14px', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, zIndex: 10,
        }}>
          <button onClick={() => setSidebarOpen(true)} className="icon-btn" style={{
            width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer', borderRadius: 9, WebkitTapHighlightColor: 'transparent',
          }}>
            <Menu size={18} color={D.txtS} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusDot state={orbState} />
            <span style={{ fontFamily: "'Lora', serif", fontSize: 16, color: D.txt }}>
              {isJournalingMode ? 'Journaling' : 'Claramente'}
            </span>
          </div>

          <button onClick={handleMute} className="icon-btn" style={{
            width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer', borderRadius: 9, WebkitTapHighlightColor: 'transparent',
          }}>
            {isMuted ? <VolumeOff size={16} color="#EF4444" /> : <Volume size={16} color={D.txtS} />}
          </button>
        </header>

        {/* Journaling banner */}
        {isJournalingMode && (
          <div style={{
            padding: '7px 20px', background: D.accentS, borderBottom: `1px solid ${D.accentB}`,
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: D.accent,
          }}>
            <Sparkle size={12} color={D.accent} />
            <span style={{ fontWeight: 500 }}>Modo Journaling Guiado</span>
            <span style={{ color: D.txtM }}>— sessão reflexiva estruturada</span>
          </div>
        )}

        {/* Crisis banner */}
        {isCrisis && (
          <div style={{
            margin: '8px 16px 0', padding: '10px 14px', borderRadius: 10,
            background: isDark ? 'rgba(239,68,68,0.07)' : '#FFF7ED',
            border: `1px solid ${isDark ? 'rgba(239,68,68,0.18)' : '#FED7AA'}`,
            fontSize: 13, color: isDark ? 'rgba(252,165,165,.9)' : '#92400E', lineHeight: 1.6,
          }}>
            CVV: <strong>188</strong> · Ligação gratuita, 24h · cvv.org.br
          </div>
        )}

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 16px', position: 'relative' }}>
          <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Welcome screen */}
            {messages.length === 0 && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '48px 16px 24px', animation: 'fadeUp 0.5s ease',
              }}>
                {/* Logo mark */}
                <div style={{
                  width: 52, height: 52, borderRadius: 16, background: D.accentS,
                  border: `1px solid ${D.accentB}`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', marginBottom: 24,
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3L14.5 8.5L21 9.3L16.5 13.6L17.6 20L12 17L6.4 20L7.5 13.6L3 9.3L9.5 8.5L12 3Z" stroke={D.accent} strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Greeting */}
                <h2 style={{
                  fontFamily: "'Lora', serif", fontSize: 'clamp(22px, 4vw, 28px)',
                  color: D.txt, marginBottom: 8, fontWeight: 400, letterSpacing: -0.5, textAlign: 'center',
                }}>
                  {!welcomeDone
                    ? <TypewriterText text={`Olá, ${firstName}`} speed={50} onComplete={() => setWelcomeDone(true)} />
                    : `Olá, ${firstName}`}
                </h2>

                {/* Smart summary or default tagline */}
                {loadingSmartSummary && (
                  <p style={{ fontSize: 13, color: D.txtM, marginBottom: 20 }}>
                    <ThinkingDots />
                  </p>
                )}

                {smartSummary && !loadingSmartSummary && (
                  <div style={{
                    background: D.surface, border: `1px solid ${D.surfB}`, borderRadius: 12,
                    padding: '12px 18px', marginBottom: 28, maxWidth: 400, width: '100%',
                    animation: 'fadeUp 0.4s ease',
                  }}>
                    <p style={{ fontSize: 13, color: D.txtS, lineHeight: 1.75, margin: 0, fontStyle: 'italic', fontFamily: "'Lora', serif" }}>
                      {smartSummary}
                    </p>
                  </div>
                )}

                {!smartSummary && !loadingSmartSummary && welcomeDone && (
                  <p style={{
                    fontSize: 14, color: D.txtS, lineHeight: 1.8, maxWidth: 280,
                    textAlign: 'center', marginBottom: 28, fontFamily: "'Lora', serif", fontStyle: 'italic',
                  }}>
                    Este é seu espaço sagrado.<br />Como você está se sentindo hoje?
                  </p>
                )}

                {/* Quick actions */}
                {welcomeDone && (
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
                    width: '100%', maxWidth: 400, animation: 'fadeUp 0.5s ease 0.1s both',
                  }}>
                    {[
                      { label: 'Journaling guiado', desc: 'Sessão reflexiva guiada', action: () => { audio.init(); handleJournaling() }, accent: true },
                      { label: 'Estou ansioso', desc: 'Quero falar sobre isso', action: () => { audio.init(); sendMessage('Estou me sentindo ansioso ultimamente.') } },
                      { label: 'Quero refletir', desc: 'Momento de introspecção', action: () => { audio.init(); sendMessage('Quero fazer uma reflexão sobre minha vida.') } },
                      { label: 'Me sinto bem', desc: 'Compartilhar gratidão', action: () => { audio.init(); sendMessage('Estou me sentindo bem hoje!') } },
                    ].map(card => (
                      <button key={card.label} className="quick-btn" onClick={card.action} style={{
                        padding: '14px 15px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                        background: card.accent ? D.accentS : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
                        border: `1px solid ${card.accent ? D.accentB : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
                        transition: 'all 0.15s ease', WebkitTapHighlightColor: 'transparent',
                        display: 'flex', flexDirection: 'column', gap: 4,
                      }}>
                        {card.accent && <div style={{ marginBottom: 2 }}><Sparkle size={13} color={D.accent} /></div>}
                        <p style={{ fontSize: 12.5, fontWeight: 500, color: card.accent ? D.accent : D.txt, margin: 0 }}>
                          {card.label}
                        </p>
                        <p style={{ fontSize: 11, color: D.txtM, margin: 0, lineHeight: 1.4 }}>
                          {card.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Proactive card */}
            {suggestion && (
              <ProactiveCard
                message={suggestion.message}
                action={suggestion.action}
                onAccept={() => handleProactiveAccept(suggestion.prompt)}
                onDismiss={dismiss}
                delay={500}
              />
            )}

            {/* Chat messages */}
            {messages.map(msg => (
              <div key={msg.id} style={{
                display: 'flex', gap: 10, alignItems: 'flex-end',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                animation: 'msgIn 0.25s ease',
              }}>
                {msg.role === 'assistant' && (
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginBottom: 2,
                    background: D.accentS, border: `1px solid ${D.accentB}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <StatusDot state={isTyping ? 'thinking' : 'idle'} />
                  </div>
                )}
                <div style={{
                  maxWidth: 'min(72%, 500px)', padding: '11px 15px',
                  fontSize: 14.5, lineHeight: 1.72, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? D.userBg : D.aiBg,
                  color: D.txt,
                  border: `1px solid ${msg.role === 'user' ? D.userB : D.aiB}`,
                  fontFamily: "'Geist', sans-serif",
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', animation: 'fadeUp 0.25s ease' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: D.accentS, border: `1px solid ${D.accentB}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <StatusDot state="thinking" />
                </div>
                <div style={{
                  padding: '12px 16px', borderRadius: '16px 16px 16px 4px',
                  background: D.aiBg, border: `1px solid ${D.aiB}`, color: D.txtS,
                }}>
                  <ThinkingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input area */}
        <div style={{
          padding: '10px 20px', paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
          flexShrink: 0, borderTop: `1px solid ${D.sbBorder}`, background: D.bg,
        }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>

            {/* Recording / muted status */}
            {(isRecording || isMuted) && (
              <p style={{
                textAlign: 'center', fontSize: 10, color: isRecording ? '#EF4444' : D.txtM,
                letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 7,
                animation: isRecording ? 'recBlink 1.2s infinite' : 'none',
              }}>
                {isRecording ? '● Gravando — toque para parar' : 'Som desativado'}
              </p>
            )}

            {/* Command bar */}
            <div style={{
              display: 'flex', gap: 6, alignItems: 'flex-end',
              background: D.input, border: `1px solid ${isRecording ? 'rgba(239,68,68,0.35)' : D.inputB}`,
              borderRadius: 16, padding: '6px',
              boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.07)',
              transition: 'border-color 0.15s ease',
            }}
              onFocusCapture={e => { e.currentTarget.style.borderColor = D.accentB }}
              onBlurCapture={e => { e.currentTarget.style.borderColor = isRecording ? 'rgba(239,68,68,0.35)' : D.inputB }}
            >
              {/* Mic */}
              {micSupported && (
                <button onClick={handleMicToggle} className="icon-btn" style={{
                  width: 38, height: 38, borderRadius: 11, border: 'none', flexShrink: 0,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isRecording ? 'rgba(239,68,68,0.1)' : 'transparent',
                  transition: 'all 0.15s ease', WebkitTapHighlightColor: 'transparent',
                }}>
                  {isRecording ? <Stop size={13} color="#EF4444" /> : <Mic size={15} color={D.txtM} />}
                </button>
              )}

              {/* Text / recording display */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {isRecording ? (
                  <div style={{ padding: '9px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13.5, color: '#EF4444' }}>{recordingText || 'Ouvindo...'}</span>
                  </div>
                ) : (
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => { setInput(e.target.value); autoResize() }}
                    onKeyDown={handleKey}
                    placeholder={isJournalingMode ? 'Escreva sua reflexão...' : 'Como você está se sentindo?'}
                    rows={1}
                    style={{
                      width: '100%', background: 'none', border: 'none', outline: 'none',
                      fontSize: 14.5, lineHeight: 1.6, resize: 'none',
                      fontFamily: "'Geist', sans-serif", color: D.txt,
                      maxHeight: 112, padding: '9px 4px', display: 'block',
                    }}
                  />
                )}
              </div>

              {/* Send */}
              <button onClick={handleSend}
                disabled={isTyping || (!input.trim() && !recordingText.trim())}
                style={{
                  width: 38, height: 38, borderRadius: 11, border: 'none', flexShrink: 0,
                  cursor: isTyping || (!input.trim() && !recordingText.trim()) ? 'not-allowed' : 'pointer',
                  background: isTyping || (!input.trim() && !recordingText.trim())
                    ? isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
                    : D.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s ease', WebkitTapHighlightColor: 'transparent',
                }}>
                <Send size={15} color={
                  isTyping || (!input.trim() && !recordingText.trim()) ? D.txtM : 'white'
                } />
              </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: 10.5, color: D.txtM, marginTop: 8, letterSpacing: 0.2 }}>
              {isJournalingMode
                ? 'Sessão de journaling guiado ativa'
                : !micSupported
                  ? 'Gravação de voz não suportada neste navegador'
                  : 'Não substitui acompanhamento psicológico · CVV: 188'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}