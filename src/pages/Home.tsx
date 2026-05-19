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
  BarChart, Person, LogOut, Sun, Moon, Menu, Stop, Crystal,
} from '@/components/Icons'
import type { ConversationItem } from '@/hooks/useChat'

function BotAvatar({ size = 26, accent }: { size?: number; accent: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `${accent}18`, border: `1px solid ${accent}28`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Crystal size={size * 0.52} color={accent} dim={`${accent}22`} mid={`${accent}30`} line={`${accent}60`} />
    </div>
  )
}

function TypingDots({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: color, opacity: 0.5,
          animation: `tdot 1.3s ${i * 0.18}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  )
}

function ActionCard({
  title, subtitle, Icon, accent = false,
  isDark, accentColor, onClick,
}: {
  title: string; subtitle: string; Icon?: React.ElementType;
  accent?: boolean; isDark: boolean; accentColor: string; onClick: () => void;
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        // ── altura igual para todos os cards ──
        height: '100%',
        padding: '16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
        display: 'flex', flexDirection: 'column', gap: 5,
        background: accent
          ? (hov ? `${accentColor}14` : `${accentColor}0C`)
          : (hov ? (isDark ? '#222222' : '#FAFAFA') : (isDark ? '#1A1A1A' : '#FFFFFF')),
        border: `1px solid ${accent
          ? (hov ? `${accentColor}50` : `${accentColor}28`)
          : (hov ? (isDark ? '#383838' : '#D0D0D0') : (isDark ? '#272727' : '#E8E8E8'))}`,
        transition: 'all 0.15s ease',
        transform: hov ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: hov
          ? (isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.07)')
          : 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {Icon && (
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: accent ? `${accentColor}18` : (isDark ? '#272727' : '#F4F4F5'),
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2,
        }}>
          <Icon size={14} color={accent ? accentColor : (isDark ? '#A0A0A0' : '#6B6B6B')} />
        </div>
      )}
      <p style={{
        fontSize: 13, fontWeight: 600, margin: 0,
        color: accent ? accentColor : (isDark ? '#F5F5F5' : '#0F0F0F'),
        fontFamily: "'Inter',sans-serif", lineHeight: 1.3,
      }}>{title}</p>
      <p style={{
        fontSize: 12, fontWeight: 400, margin: 0,
        color: isDark ? '#606060' : '#9B9B9B',
        fontFamily: "'Inter',sans-serif", lineHeight: 1.4,
      }}>{subtitle}</p>
    </button>
  )
}

function Typewriter({ text, speed = 35, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [shown, setShown] = useState('')
  const [done, setDone]   = useState(false)
  useEffect(() => {
    setShown(''); setDone(false); let i = 0
    const t = setInterval(() => {
      if (i < text.length) setShown(text.slice(0, ++i))
      else { clearInterval(t); setDone(true); onDone?.() }
    }, speed)
    return () => clearInterval(t)
  }, [text])
  return <>{shown}{!done && <span style={{ opacity: 0.3, animation: 'blink 1s infinite' }}>|</span>}</>
}

function groupConvs(convs: ConversationItem[]) {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yest  = new Date(today); yest.setDate(today.getDate() - 1)
  const week  = new Date(today); week.setDate(today.getDate() - 7)
  const g = [
    { label: 'Hoje',         items: [] as ConversationItem[] },
    { label: 'Ontem',        items: [] as ConversationItem[] },
    { label: 'Esta semana',  items: [] as ConversationItem[] },
    { label: 'Mais antigas', items: [] as ConversationItem[] },
  ]
  convs.forEach(c => {
    const d = new Date(c.started_at)
    if (d >= today)     g[0].items.push(c)
    else if (d >= yest) g[1].items.push(c)
    else if (d >= week) g[2].items.push(c)
    else                g[3].items.push(c)
  })
  return g.filter(x => x.items.length > 0)
}

export default function Home() {
  const navigate = useNavigate()
  const { profile, signOut }  = useAuth()
  const { isDark, toggle }    = useTheme()
  const {
    messages, isTyping, isCrisis, isJournalingMode,
    conversationId, conversations, smartSummary, loadingSmartSummary,
    sendMessage, resetChat, loadConversation, startJournaling,
  } = useChat()

  const [input, setInput]               = useState('')
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [muted, setMuted]               = useState(false)
  const [recording, setRecording]       = useState(false)
  const [recText, setRecText]           = useState('')
  const [speaking, setSpeaking]         = useState(false)
  const [greetDone, setGreetDone]       = useState(false)
  const [hudOpen, setHudOpen]           = useState(false)
  const [micOk]                         = useState(speechEngine.isRecordingSupported)
  const [emotion, setEmotion]           = useState(emotionEngine.get())
  const [mounted, setMounted]           = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const taRef     = useRef<HTMLTextAreaElement>(null)
  const prevLen   = useRef(0)
  const spkIv     = useRef<ReturnType<typeof setInterval> | null>(null)

  const { suggestion, dismiss } = useProactive(messages.length, isTyping)
  const grouped   = groupConvs(conversations)
  const firstName = profile?.name?.split(' ')[0] || 'você'
  const ACCENT    = isDark ? '#8B5CF6' : '#7C3AED'

  const C = isDark ? {
    bg:          '#111111',
    surface:     '#1A1A1A',
    border:      '#272727',
    borderHov:   '#383838',
    sidebar:     '#161616',
    sidebarB:    '#272727',
    text:        '#F5F5F5',
    textSub:     '#A0A0A0',
    textMuted:   '#606060',
    accentBg:    '#1E1535',
    userBubble:  '#1E1535',
    userBorder:  '#3D2B6B',
    userText:    '#DDD6FE',
    inputBg:     '#1A1A1A',
    inputBorder: '#2E2E2E',
    placeholder: '#404040',
    btnBg:       '#272727',
  } : {
    bg:          '#F7F7F8',
    surface:     '#FFFFFF',
    border:      '#E8E8E8',
    borderHov:   '#C8C8C8',
    sidebar:     '#FFFFFF',
    sidebarB:    '#E8E8E8',
    text:        '#0F0F0F',
    textSub:     '#6B6B6B',
    textMuted:   '#9B9B9B',
    accentBg:    '#F4F0FF',
    userBubble:  '#F4F0FF',
    userBorder:  '#E2D9FF',
    userText:    '#4C1D95',
    inputBg:     '#FFFFFF',
    inputBorder: '#E2E2E2',
    placeholder: '#ACACAC',
    btnBg:       '#F4F4F5',
  }

  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])
  useEffect(() => emotionEngine.subscribe(setEmotion), [])

  useEffect(() => {
    const t = setTimeout(() => speechEngine.speakWelcome(firstName), 600)
    return () => clearTimeout(t)
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

  useEffect(() => {
    spkIv.current = setInterval(() => setSpeaking(speechEngine.isSpeaking()), 200)
    return () => { if (spkIv.current) clearInterval(spkIv.current) }
  }, [])

  const handleMute = useCallback(() => {
    const n = !muted; setMuted(n); speechEngine.setMuted(n)
    if (n) speechEngine.stop(); audio.playClick()
  }, [muted])

  const handleMic = useCallback(() => {
    audio.init()
    if (recording) {
      speechEngine.stopRecording(); setRecording(false)
      if (recText.trim()) { setInput(recText.trim()); setRecText('') }
    } else {
      const ok = speechEngine.startRecording(
        (txt, final) => { setRecText(txt); if (final) { setInput(p => (p + ' ' + txt).trim()); setRecText('') } },
        () => setRecording(false)
      )
      if (ok) { setRecording(true); audio.playClick() }
    }
  }, [recording, recText])

  function autoResize() {
    if (!taRef.current) return
    taRef.current.style.height = 'auto'
    taRef.current.style.height = Math.min(taRef.current.scrollHeight, 120) + 'px'
  }

  async function handleSend() {
    if (!input.trim() || isTyping) return
    const txt = input.trim(); setInput(''); setRecText('')
    if (recording) { speechEngine.stopRecording(); setRecording(false) }
    if (taRef.current) taRef.current.style.height = 'auto'
    audio.init(); audio.playMessageSent(); speechEngine.speakAck(firstName)
    await sendMessage(txt)
  }

  const onKey     = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }
  const newChat   = () => { prevLen.current = 0; resetChat(); setSidebarOpen(false) }
  const loadConv  = (id: string) => async () => { prevLen.current = 0; await loadConversation(id); setSidebarOpen(false) }
  const journal   = async () => { audio.init(); audio.playJournaling(); speechEngine.speakJournalingStart(); prevLen.current = 0; await startJournaling(); setSidebarOpen(false) }

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-text-size-adjust: 100%; font-family: 'Inter', sans-serif; }
    body { -webkit-font-smoothing: antialiased; }
    @keyframes tdot { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-4px);opacity:1} }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
    @keyframes fIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes mIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes sIn  { from{opacity:0;transform:translateX(-100%)} to{opacity:1;transform:translateX(0)} }
    .sb  { display: none !important; height: 100%; }
    .mhd { display: flex; }
    @media (min-width: 768px) { .sb { display: flex !important; } .mhd { display: none !important; } }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-thumb { background: ${isDark ? '#333' : '#D4D4D4'}; border-radius: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    textarea { -webkit-appearance: none; font-family: 'Inter', sans-serif; }
    textarea::placeholder { color: ${C.placeholder} !important; font-family: 'Inter', sans-serif; }
  `

  // ─── SIDEBAR ────────────────────────────────────────────────
  function Sidebar() {
    return (
      <aside style={{
        width: 256, flexShrink: 0, height: '100%',
        display: 'flex', flexDirection: 'column',
        background: C.sidebar, borderRight: `1px solid ${C.sidebarB}`,
      }}>

        {/* Brand */}
        <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Crystal size={16} color={ACCENT} dim={`${ACCENT}22`} mid={`${ACCENT}35`} line={`${ACCENT}60`} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: "'Inter',sans-serif", letterSpacing: -0.3 }}>
              Claramente
            </span>
          </div>
          <button onClick={newChat} style={{ width: '100%', height: 36, borderRadius: 8, border: 'none', background: ACCENT, color: '#FFFFFF', fontSize: 13, fontWeight: 600, fontFamily: "'Inter',sans-serif", cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.15s', WebkitTapHighlightColor: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
            onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}>
            <Plus size={14} color="#FFFFFF" />
            Nova conversa
          </button>
        </div>

        {/* Conversations */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {grouped.length === 0 && (
            <p style={{ fontSize: 13, color: C.textMuted, padding: '24px 8px', textAlign: 'center', fontFamily: "'Inter',sans-serif", lineHeight: 1.6 }}>
              Nenhuma conversa ainda.
            </p>
          )}
          {grouped.map(g => (
            <div key={g.label} style={{ marginBottom: 4 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, padding: '10px 8px 4px', letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: "'Inter',sans-serif" }}>
                {g.label}
              </p>
              {g.items.map(c => {
                const active = conversationId === c.id
                return (
                  <button key={c.id} onClick={loadConv(c.id)} style={{ width: '100%', textAlign: 'left', padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: active ? C.accentBg : 'transparent', display: 'block', marginBottom: 1, transition: 'all 0.12s', WebkitTapHighlightColor: 'transparent', minHeight: 40 }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.surface }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                    <p style={{ fontSize: 13, fontWeight: active ? 600 : 400, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Inter',sans-serif", color: active ? ACCENT : C.text }}>
                      {c.title}
                    </p>
                    <p style={{ fontSize: 12, fontWeight: 400, color: C.textMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Inter',sans-serif" }}>
                      {c.preview}
                    </p>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Journaling + HUD */}
        <div style={{ padding: '8px', borderTop: `1px solid ${C.border}` }}>
          <button onClick={journal} style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: C.textSub, fontSize: 13, fontWeight: 500, fontFamily: "'Inter',sans-serif", transition: 'all 0.12s', WebkitTapHighlightColor: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background = C.accentBg; e.currentTarget.style.color = ACCENT; e.currentTarget.style.borderColor = `${ACCENT}30` }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textSub; e.currentTarget.style.borderColor = C.border }}>
            <Sparkle size={14} color="currentColor" />
            Journaling guiado
          </button>
          <button onClick={() => setHudOpen(p => !p)} style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: C.textMuted, fontSize: 11, fontWeight: 600, fontFamily: "'Inter',sans-serif", letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 2, WebkitTapHighlightColor: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = C.surface)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <span>Diagnóstico</span>
            <span>{hudOpen ? '▲' : '▼'}</span>
          </button>
          {hudOpen && <div style={{ marginTop: 4 }}><JarvisHUD visible /></div>}
        </div>

        {/* User footer */}
        <div style={{ padding: '12px 14px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.accentBg, border: `1px solid ${ACCENT}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: ACCENT, flexShrink: 0, fontFamily: "'Inter',sans-serif" }}>
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0, fontFamily: "'Inter',sans-serif" }}>{firstName}</p>
              <p style={{ fontSize: 11, fontWeight: 400, color: C.textMuted, margin: 0, fontFamily: "'Inter',sans-serif" }}>Plano gratuito</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {([
              [isDark ? Sun : Moon,            toggle,                        'Tema'  ],
              [muted ? VolumeOff : Volume,     handleMute,                    'Som'   ],
              [BarChart, () => navigate('/relatorios'),                        'Relat.'],
              [Person,   () => navigate('/perfil'),                           'Perfil'],
              [LogOut,   signOut,                                             'Sair'  ],
            ] as [React.ElementType, () => void, string][]).map(([Ic, fn, title]) => (
              <button key={title} onClick={fn} title={title} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.12s', WebkitTapHighlightColor: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = C.surface)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <Ic size={15} color={title === 'Som' && muted ? '#EF4444' : C.textMuted} />
              </button>
            ))}
          </div>
        </div>
      </aside>
    )
  }

  // ─── RENDER ─────────────────────────────────────────────────
  return (
    <div style={{ height: '100dvh', display: 'flex', background: C.bg, fontFamily: "'Inter',sans-serif", position: 'relative', overflow: 'hidden', opacity: mounted ? 1 : 0, transition: 'opacity 0.3s ease' }}>
      <style>{CSS}</style>

      <div className="sb"><Sidebar /></div>

      {sidebarOpen && (
        <>
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40, backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, animation: 'sIn 0.22s ease', width: 280, maxWidth: '88vw' }}>
            <Sidebar />
          </div>
        </>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Mobile header */}
        <header className="mhd" style={{ background: C.sidebar, borderBottom: `1px solid ${C.border}`, height: 52, padding: '0 16px', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, zIndex: 10 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, WebkitTapHighlightColor: 'transparent' }}>
            <Menu size={18} color={C.textSub} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BotAvatar size={22} accent={ACCENT} />
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: "'Inter',sans-serif" }}>
              {isJournalingMode ? 'Journaling' : 'Claramente'}
            </span>
          </div>
          <button onClick={handleMute} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, WebkitTapHighlightColor: 'transparent' }}>
            {muted ? <VolumeOff size={16} color="#EF4444" /> : <Volume size={16} color={C.textMuted} />}
          </button>
        </header>

        {/* Journaling banner */}
        {isJournalingMode && (
          <div style={{ padding: '8px 20px', background: C.accentBg, borderBottom: `1px solid ${ACCENT}20`, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: ACCENT, fontFamily: "'Inter',sans-serif" }}>
            <Sparkle size={13} color={ACCENT} />
            Modo Journaling Guiado
            <span style={{ fontWeight: 400, color: C.textMuted, fontSize: 12 }}>— sessão reflexiva estruturada</span>
          </div>
        )}

        {/* Crisis banner */}
        {isCrisis && (
          <div style={{ margin: '8px 16px 0', padding: '10px 14px', borderRadius: 10, background: isDark ? 'rgba(239,68,68,0.1)' : '#FFF7ED', border: `1px solid ${isDark ? 'rgba(239,68,68,0.25)' : '#FED7AA'}`, fontSize: 13, fontWeight: 500, color: isDark ? '#FCA5A5' : '#92400E', fontFamily: "'Inter',sans-serif" }}>
            CVV: <strong>188</strong> · Ligação gratuita, 24h · cvv.org.br
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 12px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

            {/* ── Welcome ── */}
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px 24px', animation: 'fIn 0.4s ease' }}>

                <div style={{ width: 48, height: 48, borderRadius: 14, background: C.accentBg, border: `1px solid ${ACCENT}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Crystal size={26} color={ACCENT} dim={`${ACCENT}25`} mid={`${ACCENT}35`} line={`${ACCENT}60`} />
                </div>

                <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: 'clamp(20px,4vw,26px)', fontWeight: 700, color: C.text, marginBottom: 8, textAlign: 'center', letterSpacing: -0.5, lineHeight: 1.2 }}>
                  {!greetDone
                    ? <Typewriter text={`Olá, ${firstName}`} speed={45} onDone={() => setGreetDone(true)} />
                    : `Olá, ${firstName}`}
                </h2>

                {loadingSmartSummary && (
                  <div style={{ marginBottom: 20 }}><TypingDots color={ACCENT} /></div>
                )}

                {smartSummary && !loadingSmartSummary && (
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 16px', marginBottom: 24, maxWidth: 440, width: '100%', animation: 'fIn 0.4s ease' }}>
                    <p style={{ fontSize: 14, fontWeight: 400, color: C.textSub, lineHeight: 1.7, margin: 0, fontFamily: "'Inter',sans-serif", fontStyle: 'italic' }}>{smartSummary}</p>
                  </div>
                )}

                {!smartSummary && !loadingSmartSummary && greetDone && (
                  <p style={{ fontSize: 14, fontWeight: 400, color: C.textSub, textAlign: 'center', marginBottom: 4, lineHeight: 1.7, fontFamily: "'Inter',sans-serif", maxWidth: 300 }}>
                    Como posso te ajudar hoje?
                  </p>
                )}

                {/* ── Action cards 2×2 com alturas iguais ── */}
                {greetDone && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gridAutoRows: '1fr',        // ← todas as linhas mesma altura
                    gap: 8,
                    marginTop: 20,
                    width: '100%',
                    maxWidth: 440,
                    animation: 'fIn 0.4s ease 0.1s both',
                  }}>
                    <ActionCard title="Journaling guiado"  subtitle="Sessão reflexiva profunda"   Icon={Sparkle} accent accentColor={ACCENT} isDark={isDark} onClick={() => { audio.init(); journal() }} />
                    <ActionCard title="Estou ansioso"       subtitle="Preciso conversar sobre isso"             accentColor={ACCENT} isDark={isDark} onClick={() => { audio.init(); sendMessage('Estou me sentindo ansioso ultimamente.') }} />
                    <ActionCard title="Quero refletir"      subtitle="Momento de introspecção"                  accentColor={ACCENT} isDark={isDark} onClick={() => { audio.init(); sendMessage('Quero fazer uma reflexão sobre minha vida.') }} />
                    <ActionCard title="Me sinto bem"        subtitle="Compartilhar gratidão"                    accentColor={ACCENT} isDark={isDark} onClick={() => { audio.init(); sendMessage('Estou me sentindo bem hoje!') }} />
                  </div>
                )}
              </div>
            )}

            {/* Proactive */}
            {suggestion && (
              <div style={{ marginBottom: 16 }}>
                <ProactiveCard message={suggestion.message} action={suggestion.action} onAccept={() => { dismiss(); sendMessage(suggestion.prompt) }} onDismiss={dismiss} delay={500} />
              </div>
            )}

            {/* Messages list */}
            {messages.map(msg => {
              const isUser = msg.role === 'user'
              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', marginBottom: 4, animation: 'mIn 0.25s ease' }}>
                  {isUser ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 0' }}>
                      <div style={{ maxWidth: 'min(72%,520px)', padding: '10px 14px', borderRadius: '16px 16px 4px 16px', background: C.userBubble, border: `1px solid ${C.userBorder}`, fontSize: 14.5, fontWeight: 400, lineHeight: 1.7, color: C.userText, fontFamily: "'Inter',sans-serif", whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0' }}>
                      <BotAvatar size={28} accent={ACCENT} />
                      <div style={{ flex: 1, minWidth: 0, paddingTop: 4, fontSize: 14.5, fontWeight: 400, lineHeight: 1.75, color: C.text, fontFamily: "'Inter',sans-serif", whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {msg.content}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Typing */}
            {isTyping && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', animation: 'fIn 0.2s ease' }}>
                <BotAvatar size={28} accent={ACCENT} />
                <div style={{ paddingTop: 8 }}><TypingDots color={ACCENT} /></div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* ── Input bar ── */}
        <div style={{ padding: '12px 20px', paddingBottom: `max(12px, env(safe-area-inset-bottom, 12px))`, background: C.bg, borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div
              style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: C.inputBg, borderRadius: 14, padding: '8px', border: `1px solid ${recording ? 'rgba(239,68,68,0.5)' : C.inputBorder}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.06)', transition: 'border-color 0.15s, box-shadow 0.15s' }}
              onFocusCapture={e => { e.currentTarget.style.borderColor = recording ? 'rgba(239,68,68,0.6)' : ACCENT; e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT}12` }}
              onBlurCapture={e => { e.currentTarget.style.borderColor = recording ? 'rgba(239,68,68,0.5)' : C.inputBorder; e.currentTarget.style.boxShadow = isDark ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.06)' }}
            >
              {micOk && (
                <button onClick={handleMic} title={recording ? 'Parar' : 'Gravar áudio'} style={{ width: 36, height: 36, borderRadius: 9, border: 'none', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: recording ? 'rgba(239,68,68,0.1)' : C.btnBg, transition: 'all 0.15s', WebkitTapHighlightColor: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = recording ? 'rgba(239,68,68,0.18)' : (isDark ? '#333' : '#EBEBEB')}
                  onMouseLeave={e => e.currentTarget.style.background = recording ? 'rgba(239,68,68,0.1)' : C.btnBg}>
                  {recording ? <Stop size={13} color="#EF4444" /> : <Mic size={16} color={C.textSub} />}
                </button>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                {recording && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px 0' }}>
                    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} style={{ width: 2, borderRadius: 2, background: '#EF4444', opacity: 0.6, animation: `tdot ${0.5 + (i % 4) * 0.12}s ${i * 0.07}s infinite`, height: `${8 + (i % 4) * 4}px` }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 14, color: '#EF4444', fontFamily: "'Inter',sans-serif" }}>{recText || 'Ouvindo...'}</span>
                  </div>
                )}
                {!recording && (
                  <textarea
                    ref={taRef} value={input}
                    onChange={e => { setInput(e.target.value); autoResize() }}
                    onKeyDown={onKey}
                    placeholder={isJournalingMode ? 'Escreva sua reflexão...' : 'Como você está se sentindo?'}
                    rows={1}
                    style={{ width: '100%', background: 'none', border: 'none', outline: 'none', fontSize: 14.5, fontWeight: 400, lineHeight: 1.6, resize: 'none', fontFamily: "'Inter',sans-serif", color: C.text, maxHeight: 120, padding: '7px 4px', display: 'block', WebkitAppearance: 'none' }}
                  />
                )}
              </div>

              <button onClick={handleSend} disabled={isTyping || (!input.trim() && !recText.trim())} style={{ width: 36, height: 36, borderRadius: 9, border: 'none', flexShrink: 0, cursor: isTyping || (!input.trim() && !recText.trim()) ? 'not-allowed' : 'pointer', background: isTyping || (!input.trim() && !recText.trim()) ? C.btnBg : ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', WebkitTapHighlightColor: 'transparent' }}
                onMouseEnter={e => { if (!isTyping && input.trim()) e.currentTarget.style.filter = 'brightness(1.12)' }}
                onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}>
                <Send size={15} color={isTyping || (!input.trim() && !recText.trim()) ? C.textSub : '#FFFFFF'} />
              </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 400, color: C.textMuted, marginTop: 8, fontFamily: "'Inter',sans-serif" }}>
              {isJournalingMode ? 'Sessão de journaling guiado ativa' : !micOk ? 'Gravação de voz não suportada neste navegador' : 'Não substitui acompanhamento psicológico · CVV: 188'}
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}