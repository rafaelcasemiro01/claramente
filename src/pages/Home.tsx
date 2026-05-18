import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useChat } from '@/hooks/useChat'
import { audio } from '@/lib/audioEngine'
import { speechEngine } from '@/lib/speechEngine'
import {
  Mic, MicOff, Volume, VolumeOff, Send, Plus, Sparkle,
  BarChart, Person, LogOut, Sun, Moon, Menu, Stop, Crystal,
} from '@/components/Icons'
import type { ConversationItem } from '@/hooks/useChat'

// ─── Waveform JARVIS ────────────────────────────────────────────
function JarvisWaveform({ color = '#8B5CF6', bars = 12 }: { color?: string; bars?: number }) {
  const heights = [0.35, 0.75, 0.55, 1.0, 0.65, 0.9, 0.45, 0.8, 0.5, 0.85, 0.4, 0.6]
  return (
    <div style={{ display: 'flex', gap: 2.5, alignItems: 'center', height: 26, padding: '0 2px' }}>
      {Array.from({ length: bars }).map((_, i) => (
        <div key={i} style={{
          width: 2.5, borderRadius: 2, background: color,
          animation: `wvBar ${0.5 + heights[i % heights.length] * 0.5}s ${i * 0.055}s infinite ease-in-out alternate`,
          height: `${heights[i % heights.length] * 18 + 3}px`,
          opacity: 0.65 + heights[i % heights.length] * 0.35,
        }} />
      ))}
    </div>
  )
}

// ─── Waveform gravação ──────────────────────────────────────────
function RecordWave() {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center', height: 20 }}>
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} style={{
          width: 2, borderRadius: 2, background: '#EF4444',
          animation: `wvBar ${0.3 + (i % 5) * 0.08}s ${i * 0.04}s infinite ease-in-out alternate`,
          height: `${8 + (i % 4) * 5}px`,
          opacity: 0.7,
        }} />
      ))}
    </div>
  )
}

// ─── Logo cristal com anéis ─────────────────────────────────────
function CrystalLogo({ size = 24, light = false, spin = false }: { size?: number; light?: boolean; spin?: boolean }) {
  const c  = light ? 'rgba(255,255,255,0.88)' : '#8B5CF6'
  const cf = light ? 'rgba(255,255,255,0.15)'  : 'rgba(139,92,246,0.15)'
  const cm = light ? 'rgba(255,255,255,0.32)'  : 'rgba(139,92,246,0.32)'
  const cl = light ? 'rgba(255,255,255,0.55)'  : 'rgba(139,92,246,0.6)'
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {spin && (
        <>
          <div style={{ position: 'absolute', width: size * 2.7, height: size * 2.7, borderRadius: '50%', border: `0.8px dashed ${light ? 'rgba(255,255,255,0.18)' : 'rgba(139,92,246,0.22)'}`, animation: 'jRing1 14s linear infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: size * 1.9, height: size * 1.9, borderRadius: '50%', border: `0.5px solid ${light ? 'rgba(255,255,255,0.12)' : 'rgba(139,92,246,0.16)'}`, animation: 'jRing2 8s linear infinite', pointerEvents: 'none' }} />
        </>
      )}
      <Crystal size={size} color={c} dim={cf} mid={cm} line={cl} />
    </div>
  )
}

// ─── Boot sequence ──────────────────────────────────────────────
function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase]   = useState(0)
  const [prog, setProg]     = useState(0)
  const [lines, setLines]   = useState<string[]>([])

  const bootLines = [
    'SISTEMA NEURAL INICIALIZADO',
    'MEMÓRIA PERSISTENTE CARREGADA',
    'PROTOCOLOS DE INTROSPECÇÃO ATIVOS',
    'MÓDULO DE ANÁLISE EMOCIONAL ONLINE',
    'SÍNTESE DE VOZ ATIVA',
    'CLARAMENTE v2.0 // PRONTO',
  ]

  useEffect(() => {
    audio.init()
    const t1 = setTimeout(() => { setPhase(1); audio.playBoot() }, 200)
    const t2 = setTimeout(() => setPhase(2), 700)
    bootLines.forEach((line, i) => setTimeout(() => setLines(p => [...p, line]), 950 + i * 260))
    let p = 0
    const iv = setInterval(() => { p += 2; setProg(p); if (p >= 100) clearInterval(iv) }, 32)
    const t3 = setTimeout(() => setPhase(3), 2700)
    const t4 = setTimeout(onComplete, 3300)
    return () => { [t1, t2, t3, t4].forEach(clearTimeout); clearInterval(iv) }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200, background: '#050410',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: phase === 3 ? 0 : 1, transition: phase === 3 ? 'opacity 0.6s ease' : 'none',
      fontFamily: 'monospace',
    }}>
      {/* Grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(139,92,246,0.18) 1px, transparent 1px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
      {/* Scan */}
      <div style={{ position: 'absolute', left: 0, right: 0, height: '1.5px', background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.7), transparent)', animation: 'scanLine 2.2s ease-in-out infinite', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ marginBottom: 36, opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? 'scale(1)' : 'scale(0.5)', transition: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <CrystalLogo size={72} light spin={phase >= 2} />
      </div>

      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(26px,5vw,40px)', color: 'white', letterSpacing: 10, textTransform: 'uppercase', marginBottom: 6, opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.6s 0.3s', textShadow: '0 0 28px rgba(139,92,246,0.9)' }}>
        Claramente
      </h1>
      <p style={{ fontSize: 10, color: '#6B6480', letterSpacing: 4, marginBottom: 36, opacity: phase >= 1 ? 0.8 : 0, transition: 'opacity 0.6s 0.5s' }}>
        SISTEMA DE INTROSPECÇÃO IA
      </p>

      <div style={{ width: 320, maxWidth: '88vw', marginBottom: 24 }}>
        {lines.map((ln, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5, animation: 'bootLn 0.3s ease forwards' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: i === lines.length - 1 ? '#8B5CF6' : '#22C55E', animation: i === lines.length - 1 ? 'pulse 0.9s infinite' : 'none' }} />
            <span style={{ fontSize: 10, color: i === lines.length - 1 ? '#A78BFA' : '#3A8A58', letterSpacing: 0.8 }}>{ln}</span>
          </div>
        ))}
      </div>

      <div style={{ width: 320, maxWidth: '88vw' }}>
        <div style={{ height: '1.5px', background: 'rgba(139,92,246,0.12)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #5B21B6, #A78BFA)', width: `${prog}%`, transition: 'width 0.04s linear', boxShadow: '0 0 8px rgba(139,92,246,0.9)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontSize: 9, color: '#3A3558', letterSpacing: 1 }}>INICIALIZANDO</span>
          <span style={{ fontSize: 9, color: '#4A4268' }}>{prog}%</span>
        </div>
      </div>
    </div>
  )
}

// ─── Agrupa conversas ───────────────────────────────────────────
function groupConversations(convs: ConversationItem[]) {
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
    if (d >= today) g[0].items.push(c)
    else if (d >= yest) g[1].items.push(c)
    else if (d >= week) g[2].items.push(c)
    else g[3].items.push(c)
  })
  return g.filter(x => x.items.length > 0)
}

// ─── Home principal ─────────────────────────────────────────────
export default function Home() {
  const navigate  = useNavigate()
  const { profile, signOut }     = useAuth()
  const { t, isDark, toggle }    = useTheme()
  const {
    messages, isTyping, isCrisis, isJournalingMode,
    conversationId, conversations, smartSummary, loadingSmartSummary,
    sendMessage, resetChat, loadConversation, startJournaling,
  } = useChat()

  const [input, setInput]           = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMuted, setIsMuted]       = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingText, setRecordingText] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [uptime, setUptime]         = useState('00:00:00')
  const [bootDone, setBootDone]     = useState(() =>
    sessionStorage.getItem('claramente-booted') === 'true'
  )

  const startRef   = useRef(Date.now())
  const bottomRef  = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const prevMsgLen = useRef(0)
  const speakTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Uptime
  useEffect(() => {
    const iv = setInterval(() => {
      const s   = Math.floor((Date.now() - startRef.current) / 1000)
      const hh  = String(Math.floor(s / 3600)).padStart(2, '0')
      const mm  = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
      const ss  = String(s % 60).padStart(2, '0')
      setUptime(`${hh}:${mm}:${ss}`)
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  // Scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  // Boas-vindas por voz
  useEffect(() => {
    if (!bootDone) return
    const t = setTimeout(() => {
      const name = profile?.name?.split(' ')[0]
      speechEngine.speak(
        name ? `Bem-vindo de volta, ${name}. Sistema Claramente ativo.`
              : 'Bem-vindo ao Claramente. Sistema ativo e pronto.',
        { priority: true, rate: 0.95 }
      )
    }, 600)
    return () => clearTimeout(t)
  }, [bootDone, profile?.name])

  // Falar respostas da IA
  useEffect(() => {
    if (messages.length > prevMsgLen.current) {
      const newMsgs = messages.slice(prevMsgLen.current)
      const last = newMsgs[newMsgs.length - 1]
      if (last?.role === 'assistant') {
        audio.playAIResponse()
        speechEngine.speak(last.content)
      }
    }
    prevMsgLen.current = messages.length
  }, [messages])

  // Som quando IA começa a digitar
  useEffect(() => {
    if (isTyping) { audio.playAIStart(); speechEngine.stop() }
  }, [isTyping])

  // Monitor speaking state
  useEffect(() => {
    speakTimer.current = setInterval(() => {
      setIsSpeaking(speechEngine.isSpeaking())
    }, 200)
    return () => { if (speakTimer.current) clearInterval(speakTimer.current) }
  }, [])

  const handleMute = useCallback(() => {
    const next = !isMuted
    setIsMuted(next)
    speechEngine.setMuted(next)
    if (next) speechEngine.stop()
    audio.playClick()
  }, [isMuted])

  const handleMicToggle = useCallback(() => {
    if (isRecording) {
      speechEngine.stopRecording()
      setIsRecording(false)
      if (recordingText.trim()) {
        setInput(recordingText.trim())
        setRecordingText('')
      }
    } else {
      const ok = speechEngine.startRecording(
        (text, isFinal) => {
          setRecordingText(text)
          if (isFinal) {
            setInput(prev => (prev + ' ' + text).trim())
            setRecordingText('')
          }
        },
        () => setIsRecording(false)
      )
      if (ok) { setIsRecording(true); audio.playClick() }
    }
  }, [isRecording, recordingText])

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
    setRecordingText('')
    if (isRecording) { speechEngine.stopRecording(); setIsRecording(false) }
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    audio.playMessageSent()
    await sendMessage(text)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  async function handleLoadConv(id: string) {
    audio.playClick()
    prevMsgLen.current = 0
    await loadConversation(id)
    setSidebarOpen(false)
  }

  async function handleNewChat() {
    audio.playClick()
    prevMsgLen.current = 0
    resetChat()
    setSidebarOpen(false)
  }

  async function handleJournaling() {
    audio.playJournaling()
    speechEngine.speak('Iniciando sessão de journaling guiado. Vamos começar com uma pergunta simples.', { rate: 0.95 })
    prevMsgLen.current = 0
    await startJournaling()
    setSidebarOpen(false)
  }

  function handleBootComplete() {
    sessionStorage.setItem('claramente-booted', 'true')
    setBootDone(true)
  }

  const firstName = profile?.name?.split(' ')[0] || 'você'
  const grouped   = groupConversations(conversations)

  const SB = {
    bg:     '#07050F',
    border: 'rgba(139,92,246,0.1)',
    text:   'rgba(255,255,255,0.72)',
    muted:  '#2E2A45',
    hover:  'rgba(139,92,246,0.08)',
    active: 'rgba(139,92,246,0.18)',
  }

  // ─── Sidebar ─────────────────────────────────────────────────
  function Sidebar() {
    return (
      <aside style={{ width: 256, flexShrink: 0, background: SB.bg, display: 'flex', flexDirection: 'column', height: '100%', borderRight: `0.5px solid ${SB.border}`, position: 'relative', overflow: 'hidden' }}>
        {/* Grid fundo */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(139,92,246,0.1) 1px, transparent 1px)', backgroundSize: '22px 22px', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ padding: '16px 16px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `0.5px solid ${SB.border}`, position: 'relative' }}>
          <CrystalLogo size={24} light spin />
          <div>
            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 14, color: SB.text, margin: 0, letterSpacing: -0.2 }}>Claramente</p>
            <p style={{ fontSize: 8, color: '#3A3558', margin: 0, letterSpacing: 1.2, fontFamily: 'monospace' }}>SISTEMA ATIVO</p>
          </div>
          {isSpeaking && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 1.5, alignItems: 'center', height: 14 }}>
              {[0.5, 1, 0.7, 0.9, 0.6].map((h, i) => (
                <div key={i} style={{ width: 2, borderRadius: 1, background: '#8B5CF6', height: `${h * 12}px`, animation: `wvBar ${0.4 + h * 0.3}s ${i * 0.06}s infinite ease-in-out alternate`, opacity: 0.8 }} />
              ))}
            </div>
          )}
        </div>

        {/* Ações */}
        <div style={{ padding: '10px 10px 6px', display: 'flex', flexDirection: 'column', gap: 5, position: 'relative' }}>
          <button onClick={handleNewChat} style={{ width: '100%', padding: '9px 12px', background: 'rgba(139,92,246,0.1)', border: '0.5px solid rgba(139,92,246,0.2)', borderRadius: 10, color: '#A78BFA', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, transition: 'all 0.18s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.1)')}>
            <Plus size={14} color="#A78BFA" /> Nova conversa
          </button>
          <button onClick={handleJournaling} style={{ width: '100%', padding: '9px 12px', background: 'rgba(167,139,250,0.06)', border: '0.5px solid rgba(167,139,250,0.15)', borderRadius: 10, color: '#C4B5FD', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, transition: 'all 0.18s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(167,139,250,0.15)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(167,139,250,0.06)')}>
            <Sparkle size={13} color="#C4B5FD" /> Journaling guiado
          </button>
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2px 8px', position: 'relative' }}>
          <style>{`::-webkit-scrollbar{width:2px}::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.18);border-radius:2px}`}</style>
          {grouped.length === 0 && (
            <p style={{ fontSize: 10, color: SB.muted, textAlign: 'center', padding: '28px 12px', lineHeight: 1.8, fontFamily: 'monospace' }}>
              // NENHUMA SESSÃO<br />// INICIE UMA CONVERSA
            </p>
          )}
          {grouped.map(group => (
            <div key={group.label}>
              <p style={{ fontSize: 8, color: SB.muted, fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase', padding: '10px 8px 4px', fontFamily: 'monospace' }}>
                // {group.label}
              </p>
              {group.items.map(conv => (
                <button key={conv.id} onClick={() => handleLoadConv(conv.id)} style={{
                  width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 8,
                  border: 'none', cursor: 'pointer', marginBottom: 1,
                  background: conversationId === conv.id ? SB.active : 'transparent',
                  borderLeft: `2px solid ${conversationId === conv.id ? '#8B5CF6' : 'transparent'}`,
                  transition: 'all 0.15s', display: 'block',
                }}
                  onMouseEnter={e => { if (conversationId !== conv.id) e.currentTarget.style.background = SB.hover }}
                  onMouseLeave={e => { if (conversationId !== conv.id) e.currentTarget.style.background = 'transparent' }}>
                  <p style={{ fontSize: 12, margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif", color: conversationId === conv.id ? '#E9E4FF' : SB.text }}>
                    {conv.title}
                  </p>
                  <p style={{ fontSize: 9, color: SB.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                    {conv.preview}
                  </p>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Status JARVIS */}
        <div style={{ padding: '8px 16px', borderTop: `0.5px solid ${SB.border}`, borderBottom: `0.5px solid ${SB.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E', animation: 'pulse 2.5s infinite' }} />
            <span style={{ fontSize: 8, color: '#22C55E', letterSpacing: 1, fontFamily: 'monospace' }}>ONLINE</span>
          </div>
          <span style={{ fontSize: 8, color: SB.muted, fontFamily: 'monospace' }}>UP {uptime}</span>
        </div>

        {/* Rodapé */}
        <div style={{ padding: '10px 12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(139,92,246,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#A78BFA' }}>
              {firstName.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 11, color: '#6B6480', fontFamily: "'DM Sans', sans-serif" }}>{firstName}</span>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {[
              { Icon: isDark ? Sun : Moon,       action: toggle,                     title: 'Tema',       color: '#6B6480' },
              { Icon: isMuted ? VolumeOff : Volume, action: handleMute,              title: 'Som',        color: isMuted ? '#EF4444' : '#6B6480' },
              { Icon: BarChart,                   action: () => navigate('/relatorios'), title: 'Relatórios', color: '#6B6480' },
              { Icon: Person,                     action: () => navigate('/perfil'), title: 'Perfil',     color: '#6B6480' },
              { Icon: LogOut,                     action: signOut,                   title: 'Sair',       color: '#6B6480' },
            ].map(({ Icon, action, title, color }) => (
              <button key={title} onClick={action} title={title} style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}>
                <Icon size={15} color={color} />
              </button>
            ))}
          </div>
        </div>
      </aside>
    )
  }

  return (
    <>
      {!bootDone && <BootSequence onComplete={handleBootComplete} />}

      <div style={{ height: '100dvh', display: 'flex', background: t.bg, fontFamily: "'DM Sans', 'Plus Jakarta Sans', sans-serif", position: 'relative', overflow: 'hidden', opacity: bootDone ? 1 : 0, transition: 'opacity 0.5s' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
          * { box-sizing: border-box; }
          @keyframes jRing1  { from{transform:rotate(0deg)}   to{transform:rotate(360deg)} }
          @keyframes jRing2  { from{transform:rotate(360deg)} to{transform:rotate(0deg)} }
          @keyframes wvBar   { from{transform:scaleY(0.15)}   to{transform:scaleY(1)} }
          @keyframes bootLn  { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
          @keyframes scanLine{ 0%{top:-2px;opacity:0} 5%{opacity:0.5} 95%{opacity:0.5} 100%{top:100%;opacity:0} }
          @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
          @keyframes pulse   { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.1)} }
          @keyframes msgIn   { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
          @keyframes recPulse{ 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }
          .sb-desktop { display: none; height: 100%; }
          .mob-header { display: flex; }
          @media(min-width:700px){
            .sb-desktop { display: flex !important; }
            .mob-header { display: none !important; }
          }
          textarea::placeholder { color: ${t.placeholder} !important; }
          ::-webkit-scrollbar { width: 3px; }
          ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.18); border-radius: 3px; }
        `}</style>

        {/* Sidebar desktop */}
        <div className="sb-desktop"><Sidebar /></div>

        {/* Sidebar mobile overlay */}
        {sidebarOpen && (
          <>
            <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 40 }} />
            <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, animation: 'fadeUp 0.22s ease' }}>
              <Sidebar />
            </div>
          </>
        )}

        {/* Área principal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>

          {/* Grid holográfico */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${isDark ? 'rgba(139,92,246,0.055)' : 'rgba(139,92,246,0.035)'} 1px, transparent 1px)`, backgroundSize: '24px 24px', pointerEvents: 'none', zIndex: 0 }} />

          {/* Scan line quando IA pensa */}
          {isTyping && (
            <div style={{ position: 'absolute', left: 0, right: 0, height: '1.5px', background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.55), transparent)', animation: 'scanLine 1.8s ease-in-out infinite', zIndex: 5, pointerEvents: 'none' }} />
          )}

          {/* Header mobile */}
          <header className="mob-header" style={{ background: t.header, borderBottom: `0.5px solid ${t.headerBorder}`, padding: '0 16px', height: 56, alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, zIndex: 10, position: 'relative' }}>
            <button onClick={() => setSidebarOpen(true)} style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
              <Menu size={20} color={t.violet} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CrystalLogo size={20} spin />
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: t.text }}>
                {isJournalingMode ? 'Journaling' : 'Claramente'}
              </span>
            </div>
            <button onClick={handleMute} style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
              {isMuted
                ? <VolumeOff size={18} color="#EF4444" />
                : <Volume    size={18} color={t.textSub} />}
            </button>
          </header>

          {/* Banner journaling */}
          {isJournalingMode && (
            <div style={{ padding: '8px 20px', background: isDark ? 'rgba(167,139,250,0.06)' : '#F5F3FF', borderBottom: `0.5px solid rgba(139,92,246,0.18)`, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: t.violet, zIndex: 10, position: 'relative' }}>
              <Sparkle size={14} color={t.violet} />
              <span style={{ fontWeight: 500 }}>Modo Journaling Guiado</span>
              <span style={{ color: t.textMuted, fontSize: 11 }}>— sessão reflexiva estruturada</span>
            </div>
          )}

          {/* Banner crise */}
          {isCrisis && (
            <div style={{ margin: '10px 16px 0', padding: '12px 16px', borderRadius: 14, background: '#FFF7ED', border: '1px solid #FED7AA', fontSize: 13, color: '#92400E', lineHeight: 1.6, zIndex: 10, position: 'relative' }}>
              CVV: <strong>188</strong> · Ligação gratuita, 24h · cvv.org.br
            </div>
          )}

          {/* Mensagens */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 8px', position: 'relative', zIndex: 1 }}>
            <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '44px 20px 20px', animation: 'fadeUp 0.6s ease' }}>
                  <div style={{ display: 'inline-flex', marginBottom: 20 }}>
                    <CrystalLogo size={52} spin />
                  </div>
                  <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: t.text, marginBottom: 8, fontWeight: 400 }}>
                    Olá, {firstName}
                  </h2>

                  {loadingSmartSummary && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                      <JarvisWaveform color={t.violet} />
                    </div>
                  )}

                  {smartSummary && !loadingSmartSummary && (
                    <div style={{ background: t.card, border: `0.5px solid ${t.cardBorder}`, borderRadius: 16, padding: '14px 18px', marginBottom: 20, maxWidth: 400, margin: '0 auto 20px', animation: 'fadeUp 0.4s ease', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.35), transparent)' }} />
                      <p style={{ fontSize: 13, color: t.textSub, lineHeight: 1.7, margin: 0 }}>
                        {smartSummary}
                      </p>
                    </div>
                  )}

                  {!smartSummary && !loadingSmartSummary && (
                    <p style={{ fontSize: 15, color: t.textSub, lineHeight: 1.7, maxWidth: 300, margin: '0 auto 22px' }}>
                      Este é seu espaço sagrado. Como você está se sentindo hoje?
                    </p>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                    {[
                      { label: 'Journaling guiado', Icon: Sparkle, action: handleJournaling, hi: true },
                      { label: 'Estou ansioso',    Icon: null,    action: () => sendMessage('Estou me sentindo ansioso ultimamente.'), hi: false },
                      { label: 'Quero refletir',   Icon: null,    action: () => sendMessage('Quero fazer uma reflexão sobre minha vida.'), hi: false },
                      { label: 'Me sinto bem',     Icon: null,    action: () => sendMessage('Estou me sentindo bem hoje!'), hi: false },
                    ].map(chip => (
                      <button key={chip.label} onClick={() => { audio.init(); chip.action() }} style={{
                        padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                        cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                        border: chip.hi ? 'none' : `0.5px solid ${t.cardBorder}`,
                        background: chip.hi ? t.violet : t.card,
                        color: chip.hi ? 'white' : t.textSub,
                        boxShadow: chip.hi ? '0 4px 14px rgba(139,92,246,0.35)' : 'none',
                        display: 'flex', alignItems: 'center', gap: 7,
                      }}>
                        {chip.Icon && <chip.Icon size={13} color={chip.hi ? 'white' : t.textSub} />}
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', animation: 'msgIn 0.3s ease' }}>
                  {msg.role === 'assistant' && (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: msg.isJournaling ? 'rgba(167,139,250,0.18)' : t.violetBg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {msg.isJournaling
                        ? <Sparkle size={14} color="#A78BFA" />
                        : <CrystalLogo size={18} spin />}
                    </div>
                  )}
                  <div style={{
                    maxWidth: '74%', padding: '13px 17px', fontSize: 15, lineHeight: 1.72,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    background: msg.role === 'user' ? (msg.isJournaling ? '#5B21B6' : t.userBubble) : t.botBubble,
                    color: msg.role === 'user' ? 'white' : t.text,
                    boxShadow: msg.role === 'user'
                      ? '0 4px 16px rgba(139,92,246,0.28)'
                      : `0 1px 8px rgba(0,0,0,${isDark ? '0.22' : '0.05'})`,
                    border: msg.role === 'assistant' ? `0.5px solid ${msg.isJournaling ? 'rgba(167,139,250,0.25)' : t.botBorder}` : 'none',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {msg.role === 'assistant' && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.28), transparent)' }} />
                    )}
                    {msg.content}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', animation: 'fadeUp 0.3s ease' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: isJournalingMode ? 'rgba(167,139,250,0.18)' : t.violetBg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isJournalingMode ? <Sparkle size={14} color="#A78BFA" /> : <CrystalLogo size={18} spin />}
                  </div>
                  <div style={{ background: t.botBubble, border: `0.5px solid ${t.botBorder}`, borderRadius: '20px 20px 20px 4px', padding: '10px 16px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.28), transparent)' }} />
                    <JarvisWaveform color={t.violet} />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <div style={{ background: t.header, borderTop: `0.5px solid ${t.headerBorder}`, padding: '12px 16px 20px', flexShrink: 0, position: 'relative', zIndex: 10 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.35) 50%, transparent 100%)' }} />
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              <div style={{
                display: 'flex', gap: 8, alignItems: 'flex-end',
                background: t.input, borderRadius: 24,
                padding: '6px 6px 6px 6px',
                border: `1.5px solid ${isRecording ? 'rgba(239,68,68,0.4)' : isJournalingMode ? 'rgba(167,139,250,0.35)' : t.inputBorder}`,
                transition: 'border-color 0.2s',
              }}
                onFocusCapture={e => (e.currentTarget.style.borderColor = isRecording ? 'rgba(239,68,68,0.6)' : t.violet)}
                onBlurCapture={e => (e.currentTarget.style.borderColor = isRecording ? 'rgba(239,68,68,0.4)' : isJournalingMode ? 'rgba(167,139,250,0.35)' : t.inputBorder)}>

                {/* Botão microfone */}
                <button onClick={handleMicToggle} title={isRecording ? 'Parar gravação' : 'Gravar áudio'} style={{
                  width: 40, height: 40, borderRadius: 18, border: 'none', flexShrink: 0,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isRecording ? 'rgba(239,68,68,0.15)' : t.violetBg,
                  transition: 'all 0.2s',
                  animation: isRecording ? 'recPulse 1.5s infinite' : 'none',
                }}>
                  {isRecording
                    ? <Stop size={14} color="#EF4444" />
                    : <Mic  size={16} color={t.violet} />}
                </button>

                {/* Área de texto */}
                <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
                  {isRecording && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px 0' }}>
                      <RecordWave />
                      <span style={{ fontSize: 13, color: '#EF4444', fontFamily: "'DM Sans', sans-serif" }}>
                        {recordingText || 'Ouvindo...'}
                      </span>
                    </div>
                  )}
                  {!isRecording && (
                    <textarea
                      ref={textareaRef} value={input}
                      onChange={e => { setInput(e.target.value); autoResize() }}
                      onKeyDown={handleKey}
                      placeholder={isJournalingMode ? 'Escreva sua reflexão...' : 'Compartilhe seus pensamentos...'}
                      rows={1}
                      style={{ width: '100%', background: 'none', border: 'none', outline: 'none', fontSize: 15, lineHeight: 1.6, resize: 'none', fontFamily: "'DM Sans', sans-serif", color: t.text, maxHeight: 120, padding: '10px 4px', display: 'block' }}
                    />
                  )}
                </div>

                {/* Botão enviar */}
                <button onClick={handleSend} disabled={isTyping || (!input.trim() && !recordingText.trim())} style={{
                  width: 40, height: 40, borderRadius: 18, border: 'none', flexShrink: 0,
                  cursor: isTyping || (!input.trim() && !recordingText.trim()) ? 'not-allowed' : 'pointer',
                  background: isTyping || (!input.trim() && !recordingText.trim()) ? t.violetBg : t.violet,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: isTyping || (!input.trim() && !recordingText.trim()) ? 'none' : '0 4px 14px rgba(139,92,246,0.45)',
                }}>
                  <Send size={17} color="white" />
                </button>
              </div>

              <p style={{ textAlign: 'center', fontSize: 10, color: t.textMuted, marginTop: 7, letterSpacing: 0.3, fontFamily: 'monospace' }}>
                {isRecording
                  ? 'GRAVANDO // TOQUE NO MICROFONE PARA PARAR'
                  : isJournalingMode
                  ? 'SESSÃO DE JOURNALING GUIADO ATIVA'
                  : isMuted
                  ? 'SOM DESATIVADO // TOQUE NO ÍCONE PARA ATIVAR'
                  : 'CLARAMENTE // PROTOCOLO INTROSPECTIVO // CVV 188'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}