import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useChat } from '@/hooks/useChat'
import { useProactive } from '@/hooks/useProactive'
import { audio } from '@/lib/audioEngine'
import { speechEngine } from '@/lib/speechEngine'
import { emotionEngine, moodColor, moodGlow } from '@/lib/emotionEngine'
import { JarvisHUD } from '@/components/JarvisHUD'
import { ProactiveCard } from '@/components/ProactiveCard'
import {
  Mic, Volume, VolumeOff, Send, Plus, Sparkle,
  BarChart, Person, LogOut, Sun, Moon, Menu, Stop, Crystal,
} from '@/components/Icons'
import type { ConversationItem } from '@/hooks/useChat'

// ─── NEURAL BACKGROUND ──────────────────────────────────────────
function NeuralBackground({ mood }: { mood: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    let W = c.width = window.innerWidth
    let H = c.height = window.innerHeight
    const nodes = Array.from({ length: 42 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 1.2 + 0.3, p: Math.random() * Math.PI * 2,
    }))
    let frame: number
    function draw() {
      ctx.clearRect(0, 0, W, H)
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy; n.p += 0.016
        if (n.x < 0 || n.x > W) n.vx *= -1
        if (n.y < 0 || n.y > H) n.vy *= -1
      })
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 128) {
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(124,58,237,${(1 - d / 128) * 0.05})`
            ctx.lineWidth = 0.5; ctx.stroke()
          }
        }
      }
      nodes.forEach(n => {
        const pulse = Math.sin(n.p) * 0.5 + 0.5
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * (1 + pulse * 0.4), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(124,58,237,${0.06 + pulse * 0.04})`; ctx.fill()
      })
      frame = requestAnimationFrame(draw)
    }
    draw()
    const onResize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', onResize) }
  }, [])
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.7 }} />
}

// ─── AI ORB ─────────────────────────────────────────────────────
type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking'

function AIOrb({ state = 'idle', size = 96, mood = '#7C3AED' }: { state?: OrbState; size?: number; mood?: string }) {
  const glow = state === 'listening' ? 'rgba(129,140,248,0.2)' : state === 'thinking' ? 'rgba(91,33,182,0.25)' : `${mood}22`
  const ring = state === 'listening' ? 'rgba(129,140,248,0.15)' : `${mood}18`
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <div style={{ position: 'absolute', width: size * 2.5, height: size * 2.5, borderRadius: '50%', background: `radial-gradient(circle, ${glow} 0%, transparent 65%)`, animation: 'orbBreath 5s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: size * 1.75, height: size * 1.75, borderRadius: '50%', border: `0.5px dashed ${ring}`, animation: 'jRing1 24s linear infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: size * 1.36, height: size * 1.36, borderRadius: '50%', border: `0.5px solid ${ring}`, animation: 'jRing2 14s linear infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: size * 1.06, height: size * 1.06, borderRadius: '50%', border: `1px solid ${ring}`, boxShadow: `0 0 24px ${glow}, inset 0 0 24px ${glow}`, animation: 'orbBreath 5s ease-in-out infinite 1.5s', pointerEvents: 'none' }} />
      <div style={{ width: size * 0.68, height: size * 0.68, borderRadius: '50%', background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.12) 0%, transparent 50%), radial-gradient(circle, ${mood}28 0%, ${mood}08 60%, transparent 80%)`, border: `1px solid ${mood}38`, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'orbBreath 5s ease-in-out infinite', boxShadow: `0 0 28px ${glow}, inset 0 1px 0 rgba(255,255,255,0.08)` }}>
        <Crystal size={size * 0.28} color="rgba(255,255,255,0.7)" dim="rgba(255,255,255,0.07)" mid="rgba(255,255,255,0.1)" line="rgba(255,255,255,0.3)" />
      </div>
      {state === 'speaking' && (
        <div style={{ position: 'absolute', bottom: -20, display: 'flex', gap: 2, alignItems: 'flex-end', height: 14 }}>
          {[0.4,0.8,1,0.7,0.5,0.9,0.6].map((h, i) => (
            <div key={i} style={{ width: 2, borderRadius: 2, background: mood, opacity: 0.65, animation: `wvBar ${0.35+h*0.4}s ${i*0.05}s infinite ease-in-out alternate`, height: `${h*12}px` }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── TYPEWRITER ──────────────────────────────────────────────────
function TypewriterText({ text, speed = 28, onComplete }: { text: string; speed?: number; onComplete?: () => void }) {
  const [shown, setShown] = useState('')
  const [done, setDone]   = useState(false)
  useEffect(() => {
    setShown(''); setDone(false); let i = 0
    const iv = setInterval(() => {
      if (i < text.length) setShown(text.slice(0, ++i))
      else { clearInterval(iv); setDone(true); onComplete?.() }
    }, speed)
    return () => clearInterval(iv)
  }, [text])
  return <span>{shown}{!done && <span style={{ animation: 'blink 0.9s infinite', opacity: 0.5 }}>|</span>}</span>
}

// ─── WAVEFORMS ──────────────────────────────────────────────────
function JarvisWave({ color = 'rgba(124,58,237,0.8)', n = 10 }: { color?: string; n?: number }) {
  const H = [0.35,0.75,0.55,1,0.65,0.9,0.45,0.8,0.5,0.85,0.4,0.6]
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center', height: 22, padding: '0 2px' }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{ width: 2, borderRadius: 2, background: color, height: `${H[i%H.length]*16+3}px`, opacity: 0.6+H[i%H.length]*0.4, animation: `wvBar ${0.45+H[i%H.length]*0.45}s ${i*0.055}s infinite ease-in-out alternate` }} />
      ))}
    </div>
  )
}

function RecordWave() {
  return (
    <div style={{ display: 'flex', gap: 1.5, alignItems: 'center', height: 18 }}>
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} style={{ width: 1.5, borderRadius: 2, background: '#EF4444', opacity: 0.65, animation: `wvBar ${0.28+(i%5)*0.07}s ${i*0.035}s infinite ease-in-out alternate`, height: `${7+(i%4)*4}px` }} />
      ))}
    </div>
  )
}

// ─── BOOT ────────────────────────────────────────────────────────
function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0)
  const [prog,  setProg]  = useState(0)
  const [lines, setLines] = useState<string[]>([])
  const bootLines = ['SISTEMA NEURAL INICIALIZADO','MEMÓRIA PERSISTENTE CARREGADA','MOTOR EMOCIONAL ATIVO','SÍNTESE DE VOZ CALIBRADA','PROTOCOLOS TERAPÊUTICOS ONLINE','CLARAMENTE v2.0 // PRONTO']
  useEffect(() => {
    audio.init()
    const t1 = setTimeout(() => { setPhase(1); audio.playBoot() }, 200)
    const t2 = setTimeout(() => setPhase(2), 700)
    bootLines.forEach((ln, i) => setTimeout(() => setLines(p => [...p, ln]), 900 + i * 260))
    let p = 0; const iv = setInterval(() => { p += 2; setProg(p); if (p >= 100) clearInterval(iv) }, 30)
    const t3 = setTimeout(() => setPhase(3), 2700)
    const t4 = setTimeout(onComplete, 3300)
    return () => { [t1,t2,t3,t4].forEach(clearTimeout); clearInterval(iv) }
  }, [])
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: '#030208', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: phase === 3 ? 0 : 1, transition: 'opacity 0.7s ease', fontFamily: 'monospace' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(124,58,237,0.14) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(124,58,237,0.6),transparent)', animation: 'scanLine 2s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ marginBottom: 40, opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? 'scale(1)' : 'scale(0.4)', transition: 'all 0.7s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <AIOrb state="idle" size={80} />
      </div>
      <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 'clamp(24px,5vw,38px)', color: 'rgba(255,255,255,0.9)', letterSpacing: 12, textTransform: 'uppercase', marginBottom: 6, opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.6s 0.3s', textShadow: '0 0 40px rgba(124,58,237,0.7)' }}>
        Claramente
      </h1>
      <p style={{ fontSize: 9, color: 'rgba(124,58,237,0.6)', letterSpacing: 4, marginBottom: 36, opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.6s 0.5s', textTransform: 'uppercase' }}>
        ia terapêutica avançada
      </p>
      <div style={{ width: 300, maxWidth: '86vw', marginBottom: 24 }}>
        {lines.map((ln, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5, animation: 'bootLn 0.3s ease forwards' }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', flexShrink: 0, background: i === lines.length - 1 ? '#7C3AED' : '#22C55E', animation: i === lines.length - 1 ? 'blink 1s infinite' : 'none' }} />
            <span style={{ fontSize: 9, color: i === lines.length - 1 ? 'rgba(167,139,250,0.9)' : 'rgba(34,197,94,0.55)', letterSpacing: 0.8 }}>{ln}</span>
          </div>
        ))}
      </div>
      <div style={{ width: 300, maxWidth: '86vw' }}>
        <div style={{ height: '1px', background: 'rgba(124,58,237,0.1)', borderRadius: 1, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg,#4C1D95,#A78BFA)', width: `${prog}%`, transition: 'width 0.04s linear', boxShadow: '0 0 10px rgba(124,58,237,0.8)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontSize: 8, color: 'rgba(124,58,237,0.3)', letterSpacing: 1 }}>INICIALIZANDO</span>
          <span style={{ fontSize: 8, color: 'rgba(124,58,237,0.35)' }}>{prog}%</span>
        </div>
      </div>
    </div>
  )
}

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

// ─── HOME ────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate()
  const { profile, signOut }  = useAuth()
  const { t, isDark, toggle } = useTheme()
  const {
    messages, isTyping, isCrisis, isJournalingMode,
    conversationId, conversations, smartSummary, loadingSmartSummary,
    sendMessage, resetChat, loadConversation, startJournaling,
  } = useChat()

  const [input, setInput]                   = useState('')
  const [sidebarOpen, setSidebarOpen]       = useState(false)
  const [isMuted, setIsMuted]               = useState(false)
  const [isRecording, setIsRecording]       = useState(false)
  const [recordingText, setRecordingText]   = useState('')
  const [isSpeaking, setIsSpeaking]         = useState(false)
  const [uptime, setUptime]                 = useState('00:00:00')
  const [welcomeDone, setWelcomeDone]       = useState(false)
  const [showHUD, setShowHUD]               = useState(true)
  const [bootDone, setBootDone]             = useState(() => sessionStorage.getItem('claramente-booted') === 'true')
  const [emotionalProfile, setEmotionalProfile] = useState(emotionEngine.get())

  const startRef    = useRef(Date.now())
  const bottomRef   = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const prevMsgLen  = useRef(0)
  const speakIv     = useRef<ReturnType<typeof setInterval> | null>(null)

  const { suggestion, dismiss } = useProactive(messages.length, isTyping)
  const firstName  = profile?.name?.split(' ')[0] || 'você'
  const grouped    = groupConversations(conversations)
  const mood       = emotionalProfile.mood
  const moodCol    = moodColor(mood)
  const orbState: OrbState = isRecording ? 'listening' : isTyping ? 'thinking' : isSpeaking ? 'speaking' : 'idle'

  // Uptime
  useEffect(() => {
    const iv = setInterval(() => {
      const s = Math.floor((Date.now() - startRef.current) / 1000)
      setUptime(`${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`)
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  // Emotion engine
  useEffect(() => emotionEngine.subscribe(setEmotionalProfile), [])

  // TRECHO 1 — Boas-vindas narradas
  useEffect(() => {
    if (!bootDone) return
    const t = setTimeout(() => speechEngine.speakWelcome(firstName), 700)
    return () => clearTimeout(t)
  }, [bootDone, firstName])

  // TRECHO 2 — Fala respostas + atualiza emoção
  useEffect(() => {
    if (messages.length > prevMsgLen.current) {
      const newMsgs = messages.slice(prevMsgLen.current)
      const last = newMsgs[newMsgs.length - 1]
      if (last?.role === 'assistant') {
        audio.playAIResponse()
        const sentiment = (last as unknown as { sentiment?: string }).sentiment
        if (sentiment) emotionEngine.updateFromSentiment(sentiment, [])
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

  const handleMute = useCallback(() => {
    const next = !isMuted; setIsMuted(next)
    speechEngine.setMuted(next); if (next) speechEngine.stop()
    audio.playClick()
  }, [isMuted])

  const handleMicToggle = useCallback(() => {
    if (isRecording) {
      speechEngine.stopRecording(); setIsRecording(false)
      if (recordingText.trim()) { setInput(recordingText.trim()); setRecordingText('') }
    } else {
      const ok = speechEngine.startRecording(
        (text, isFinal) => { setRecordingText(text); if (isFinal) { setInput(p => (p+' '+text).trim()); setRecordingText('') } },
        () => setIsRecording(false)
      )
      if (ok) { setIsRecording(true); audio.playClick() }
    }
  }, [isRecording, recordingText])

  function autoResize() {
    const el = textareaRef.current; if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  async function handleSend() {
    if (!input.trim() || isTyping) return
    const text = input.trim(); setInput(''); setRecordingText('')
    if (isRecording) { speechEngine.stopRecording(); setIsRecording(false) }
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    // TRECHO 3
    audio.playMessageSent()
    speechEngine.speakAck(firstName)
    await sendMessage(text)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  async function handleLoadConv(id: string) {
    audio.playClick(); prevMsgLen.current = 0
    await loadConversation(id); setSidebarOpen(false)
  }

  async function handleNewChat() {
    audio.playClick(); prevMsgLen.current = 0
    resetChat(); setSidebarOpen(false)
  }

  // TRECHO 4
  async function handleJournaling() {
    audio.playJournaling()
    speechEngine.speakJournalingStart()
    prevMsgLen.current = 0
    await startJournaling(); setSidebarOpen(false)
  }

  function handleBootComplete() {
    sessionStorage.setItem('claramente-booted', 'true'); setBootDone(true)
  }

  async function handleProactiveAccept(prompt: string) {
    dismiss()
    await sendMessage(prompt)
  }

  // ─── SIDEBAR ─────────────────────────────────────────────────
  function Sidebar() {
    return (
      <aside style={{ width: 256, flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(5,4,16,0.88)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', borderRight: '0.5px solid rgba(255,255,255,0.04)', position: 'relative' }}>
        {/* Logo */}
        <div style={{ padding: '18px 18px 14px', display: 'flex', alignItems: 'center', gap: 11, borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', background: `radial-gradient(circle, ${moodGlow(mood)} 0%, transparent 70%)`, animation: 'orbBreath 4s ease-in-out infinite', pointerEvents: 'none' }} />
            <Crystal size={22} color="rgba(255,255,255,0.7)" dim="rgba(255,255,255,0.07)" mid="rgba(255,255,255,0.1)" line="rgba(255,255,255,0.28)" />
          </div>
          <div>
            <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: 14, color: 'rgba(255,255,255,0.82)', margin: 0, letterSpacing: -0.3 }}>Claramente</p>
            <p style={{ fontSize: 8, color: `${moodCol}80`, margin: 0, letterSpacing: 1.5, fontFamily: 'monospace', textTransform: 'uppercase' }}>sistema ativo</p>
          </div>
          {isSpeaking && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 1.5, alignItems: 'center', height: 12 }}>
              {[0.5,1,0.7,0.9,0.6].map((h,i) => (
                <div key={i} style={{ width: 1.5, borderRadius: 1, background: `${moodCol}AA`, height: `${h*10}px`, animation: `wvBar ${0.35+h*0.3}s ${i*0.06}s infinite ease-in-out alternate` }} />
              ))}
            </div>
          )}
        </div>

        {/* Ações */}
        <div style={{ padding: '12px 12px 6px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            { icon: <Plus size={13} color={`${moodCol}CC`} />, label: 'Nova conversa',    action: handleNewChat,    hi: false },
            { icon: <Sparkle size={12} color="rgba(196,181,253,0.8)" />, label: 'Journaling guiado', action: handleJournaling, hi: true  },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action} style={{
              width: '100%', padding: '9px 13px',
              background: btn.hi ? 'rgba(167,139,250,0.07)' : 'rgba(124,58,237,0.08)',
              border: `0.5px solid ${btn.hi ? 'rgba(167,139,250,0.14)' : 'rgba(124,58,237,0.16)'}`,
              borderRadius: 11, color: btn.hi ? 'rgba(196,181,253,0.85)' : `${moodCol}CC`,
              fontSize: 12, display: 'flex', alignItems: 'center', gap: 9,
              cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 500, transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = btn.hi ? 'rgba(167,139,250,0.15)' : 'rgba(124,58,237,0.16)'; e.currentTarget.style.transform = 'translateX(2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = btn.hi ? 'rgba(167,139,250,0.07)' : 'rgba(124,58,237,0.08)'; e.currentTarget.style.transform = 'translateX(0)' }}>
              {btn.icon}{btn.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 10px' }}>
          <style>{`::-webkit-scrollbar{width:2px}::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.12);border-radius:2px}`}</style>
          {grouped.length === 0 && (
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.14)', textAlign: 'center', padding: '28px 12px', lineHeight: 1.9, fontFamily: 'monospace' }}>
              // NENHUMA SESSÃO<br/>// INICIE UMA CONVERSA
            </p>
          )}
          {grouped.map(group => (
            <div key={group.label}>
              <p style={{ fontSize: 8, color: 'rgba(124,58,237,0.35)', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', padding: '10px 8px 4px', fontFamily: 'monospace' }}>// {group.label}</p>
              {group.items.map(conv => (
                <button key={conv.id} onClick={() => handleLoadConv(conv.id)} style={{
                  width: '100%', textAlign: 'left', padding: '8px 11px', borderRadius: 9, border: 'none', cursor: 'pointer', marginBottom: 1, display: 'block',
                  background: conversationId === conv.id ? `${moodCol}18` : 'transparent',
                  borderLeft: `2px solid ${conversationId === conv.id ? moodCol+'80' : 'transparent'}`,
                  transition: 'all 0.18s cubic-bezier(0.16,1,0.3,1)',
                }}
                  onMouseEnter={e => { if (conversationId !== conv.id) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateX(2px)' } }}
                  onMouseLeave={e => { if (conversationId !== conv.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)' } }}>
                  <p style={{ fontSize: 12, margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans',sans-serif", color: conversationId === conv.id ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.45)' }}>{conv.title}</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{conv.preview}</p>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* HUD emocional na sidebar */}
        <div style={{ padding: '10px 12px', borderTop: '0.5px solid rgba(255,255,255,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: 1, fontFamily: 'monospace', textTransform: 'uppercase' }}>diagnóstico</span>
            <button onClick={() => setShowHUD(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
              {showHUD ? '▲' : '▼'}
            </button>
          </div>
          {showHUD && <JarvisHUD visible={showHUD} />}
        </div>

        {/* Status */}
        <div style={{ padding: '8px 18px', borderTop: '0.5px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E', animation: 'pulse 2.5s infinite' }} />
            <span style={{ fontSize: 8, color: 'rgba(34,197,94,0.65)', letterSpacing: 1.2, fontFamily: 'monospace', textTransform: 'uppercase' }}>online</span>
          </div>
          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.16)', fontFamily: 'monospace' }}>UP {uptime}</span>
        </div>

        {/* Rodapé */}
        <div style={{ padding: '10px 14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${moodCol}20`, border: `0.5px solid ${moodCol}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: `${moodCol}CC`, transition: 'all 0.5s ease' }}>
              {firstName.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'DM Sans',sans-serif" }}>{firstName}</span>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {[
              { Icon: isDark ? Sun : Moon,          action: toggle,                       title: 'Tema' },
              { Icon: isMuted ? VolumeOff : Volume, action: handleMute,                   title: 'Som'  },
              { Icon: BarChart,                     action: () => navigate('/relatorios'), title: 'Relat' },
              { Icon: Person,                       action: () => navigate('/perfil'),    title: 'Perfil' },
              { Icon: LogOut,                       action: signOut,                      title: 'Sair'  },
            ].map(({ Icon, action, title }) => (
              <button key={title} onClick={action} title={title} style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <Icon size={14} color={title === 'Som' && isMuted ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.28)'} />
              </button>
            ))}
          </div>
        </div>
      </aside>
    )
  }

  // ─── RENDER ──────────────────────────────────────────────────
  return (
    <>
      <NeuralBackground mood={mood} />

      {/* Atmospheric glows — reativos ao humor */}
      <div style={{ position: 'fixed', top: '12%', left: '38%', width: 700, height: 700, borderRadius: '50%', background: `radial-gradient(circle, ${moodGlow(mood)} 0%, transparent 65%)`, pointerEvents: 'none', zIndex: 0, animation: 'orbBreath 9s ease-in-out infinite', transition: 'background 3s ease' }} />
      <div style={{ position: 'fixed', bottom: '8%',  right: '15%', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, rgba(67,56,202,0.03) 0%, transparent 65%)`, pointerEvents: 'none', zIndex: 0, animation: 'orbBreath 12s ease-in-out infinite 4s' }} />

      {!bootDone && <BootSequence onComplete={handleBootComplete} />}

      <div style={{ height: '100dvh', display: 'flex', background: 'rgba(3,2,8,0.97)', fontFamily: "'DM Sans','Plus Jakarta Sans',sans-serif", position: 'relative', overflow: 'hidden', zIndex: 1, opacity: bootDone ? 1 : 0, transition: 'opacity 0.6s ease' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
          * { box-sizing: border-box; }
          @keyframes orbBreath { 0%,100%{transform:scale(1);opacity:0.8} 50%{transform:scale(1.06);opacity:1} }
          @keyframes jRing1    { from{transform:rotate(0deg)}   to{transform:rotate(360deg)} }
          @keyframes jRing2    { from{transform:rotate(360deg)} to{transform:rotate(0deg)} }
          @keyframes wvBar     { from{transform:scaleY(0.12)}   to{transform:scaleY(1)} }
          @keyframes bootLn    { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
          @keyframes scanLine  { 0%{top:-2px;opacity:0} 5%{opacity:0.4} 95%{opacity:0.4} 100%{top:100%;opacity:0} }
          @keyframes fadeUp    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
          @keyframes msgIn     { from{opacity:0;transform:translateY(6px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
          @keyframes pulse     { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.12)} }
          @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0} }
          @keyframes recPulse  { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.35)} 50%{box-shadow:0 0 0 9px rgba(239,68,68,0)} }
          @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
          .sb-desktop{display:none;height:100%}
          .mob-hdr{display:flex}
          @media(min-width:700px){.sb-desktop{display:flex!important}.mob-hdr{display:none!important}}
          ::-webkit-scrollbar{width:2px}::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.12);border-radius:2px}
          textarea::placeholder{color:rgba(255,255,255,0.18)!important}
        `}</style>

        <div className="sb-desktop"><Sidebar /></div>
        {sidebarOpen && (
          <>
            <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 40, backdropFilter: 'blur(6px)' }} />
            <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, animation: 'fadeUp 0.22s ease' }}><Sidebar /></div>
          </>
        )}

        {/* Área principal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>

          {isTyping && <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: `linear-gradient(90deg,transparent,${moodCol}50,transparent)`, animation: 'scanLine 1.8s ease-in-out infinite', zIndex: 5, pointerEvents: 'none' }} />}

          {/* Header mobile */}
          <header className="mob-hdr" style={{ background: 'rgba(5,4,16,0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: '0.5px solid rgba(255,255,255,0.04)', padding: '0 16px', height: 54, alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, zIndex: 10, position: 'relative' }}>
            <button onClick={() => setSidebarOpen(true)} style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
              <Menu size={18} color="rgba(255,255,255,0.45)" />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AIOrb state={orbState} size={22} mood={moodCol} />
              <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: 15, color: 'rgba(255,255,255,0.78)' }}>
                {isJournalingMode ? 'Journaling' : 'Claramente'}
              </span>
            </div>
            <button onClick={handleMute} style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
              {isMuted ? <VolumeOff size={16} color="rgba(239,68,68,0.75)" /> : <Volume size={16} color="rgba(255,255,255,0.35)" />}
            </button>
          </header>

          {isJournalingMode && (
            <div style={{ padding: '8px 20px', background: 'rgba(167,139,250,0.05)', backdropFilter: 'blur(12px)', borderBottom: '0.5px solid rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'rgba(196,181,253,0.75)', zIndex: 10, position: 'relative' }}>
              <Sparkle size={12} color="rgba(196,181,253,0.6)" />
              <span style={{ fontWeight: 500, letterSpacing: 0.3 }}>Modo Journaling Guiado</span>
              <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 10 }}>— sessão reflexiva estruturada</span>
            </div>
          )}

          {isCrisis && (
            <div style={{ margin: '10px 16px 0', padding: '11px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.07)', border: '0.5px solid rgba(239,68,68,0.18)', fontSize: 13, color: 'rgba(252,165,165,0.85)', lineHeight: 1.6, zIndex: 10, position: 'relative' }}>
              CVV: <strong>188</strong> · Ligação gratuita, 24h · cvv.org.br
            </div>
          )}

          {/* Mensagens */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 20px 12px', position: 'relative', zIndex: 1 }}>
            <div style={{ maxWidth: 660, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Welcome */}
              {messages.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px 24px', animation: 'fadeUp 0.8s ease' }}>
                  <div style={{ marginBottom: 40, animation: 'float 7s ease-in-out infinite' }}>
                    <AIOrb state={orbState} size={108} mood={moodCol} />
                  </div>
                  <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 26, color: 'rgba(255,255,255,0.82)', marginBottom: 8, fontWeight: 400, letterSpacing: -0.8, textAlign: 'center' }}>
                    {bootDone && !welcomeDone
                      ? <TypewriterText text={`Olá, ${firstName}`} speed={55} onComplete={() => setWelcomeDone(true)} />
                      : `Olá, ${firstName}`}
                  </h2>

                  {loadingSmartSummary && <div style={{ marginBottom: 18 }}><JarvisWave color={`${moodCol}70`} n={8} /></div>}

                  {smartSummary && !loadingSmartSummary && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '0.5px solid rgba(255,255,255,0.05)', borderRadius: 18, padding: '14px 20px', marginBottom: 22, maxWidth: 420, position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.5s ease' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg,transparent,${moodCol}30,transparent)` }} />
                      <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.78, margin: 0, fontStyle: 'italic' }}>{smartSummary}</p>
                    </div>
                  )}

                  {!smartSummary && !loadingSmartSummary && welcomeDone && (
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', lineHeight: 1.85, maxWidth: 300, textAlign: 'center', marginBottom: 6, animation: 'fadeUp 0.5s ease' }}>
                      Este é seu espaço sagrado.<br/>Como você está se sentindo hoje?
                    </p>
                  )}

                  {welcomeDone && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 18, animation: 'fadeUp 0.6s ease 0.15s both' }}>
                      {[
                        { label: 'Journaling guiado', Icon: Sparkle, action: handleJournaling, accent: true },
                        { label: 'Estou ansioso',     Icon: null,    action: () => sendMessage('Estou me sentindo ansioso ultimamente.'), accent: false },
                        { label: 'Quero refletir',    Icon: null,    action: () => sendMessage('Quero fazer uma reflexão sobre minha vida.'), accent: false },
                        { label: 'Me sinto bem',      Icon: null,    action: () => sendMessage('Estou me sentindo bem hoje!'), accent: false },
                      ].map(chip => (
                        <button key={chip.label} onClick={() => { audio.init(); chip.action() }} style={{
                          padding: '9px 18px', borderRadius: 22, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                          fontFamily: "'DM Sans',sans-serif", transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
                          border: chip.accent ? 'none' : '0.5px solid rgba(255,255,255,0.07)',
                          background: chip.accent ? `${moodCol}28` : 'rgba(255,255,255,0.04)',
                          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                          color: chip.accent ? 'rgba(196,181,253,0.9)' : 'rgba(255,255,255,0.4)',
                          boxShadow: chip.accent ? `0 0 28px ${moodCol}22, inset 0 1px 0 rgba(255,255,255,0.06)` : 'none',
                          display: 'flex', alignItems: 'center', gap: 7,
                        }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.18)' }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.filter = 'brightness(1)' }}>
                          {chip.Icon && <chip.Icon size={12} color={chip.accent ? 'rgba(196,181,253,0.75)' : 'rgba(255,255,255,0.3)'} />}
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sugestão proativa */}
              {suggestion && (
                <ProactiveCard
                  message={suggestion.message}
                  action={suggestion.action}
                  onAccept={() => handleProactiveAccept(suggestion.prompt)}
                  onDismiss={dismiss}
                  delay={800}
                />
              )}

              {/* Mensagens */}
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', animation: 'msgIn 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
                  {msg.role === 'assistant' && (
                    <div style={{ flexShrink: 0 }}>
                      <AIOrb state={isTyping ? 'thinking' : 'idle'} size={28} mood={moodCol} />
                    </div>
                  )}
                  <div style={{
                    maxWidth: '74%', padding: '13px 17px', fontSize: 14.5, lineHeight: 1.77,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    background: msg.role === 'user' ? `${moodCol}22` : 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                    color: msg.role === 'user' ? 'rgba(233,228,255,0.92)' : 'rgba(255,255,255,0.78)',
                    border: msg.role === 'user' ? `0.5px solid ${moodCol}35` : '0.5px solid rgba(255,255,255,0.06)',
                    boxShadow: msg.role === 'user'
                      ? `0 4px 20px ${moodCol}18, inset 0 1px 0 rgba(255,255,255,0.05)`
                      : '0 2px 16px rgba(0,0,0,0.22)',
                    position: 'relative', overflow: 'hidden',
                    transition: 'border-color 1.5s ease, box-shadow 1.5s ease',
                  }}>
                    {msg.role === 'assistant' && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg,transparent,${moodCol}22,transparent)` }} />}
                    {msg.content}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', animation: 'fadeUp 0.3s ease' }}>
                  <AIOrb state="thinking" size={28} mood={moodCol} />
                  <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '20px 20px 20px 4px', padding: '12px 16px', position: 'relative', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.22)' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg,transparent,${moodCol}22,transparent)` }} />
                    <JarvisWave color={`${moodCol}AA`} n={9} />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* INPUT BAR */}
          <div style={{ padding: '10px 16px 22px', flexShrink: 0, position: 'relative', zIndex: 10 }}>
            <div style={{ position: 'absolute', top: 0, left: '5%', right: '5%', height: '1px', background: `linear-gradient(90deg,transparent,${moodCol}25,transparent)`, transition: 'background 2s ease' }} />

            {(isRecording || isMuted) && (
              <div style={{ textAlign: 'center', marginBottom: 7 }}>
                <span style={{ fontSize: 9, color: `${moodCol}60`, letterSpacing: 1.2, fontFamily: 'monospace', textTransform: 'uppercase' }}>
                  {isRecording ? '● GRAVANDO // TOQUE PARA PARAR' : 'SOM DESATIVADO'}
                </span>
              </div>
            )}

            <div style={{ maxWidth: 660, margin: '0 auto' }}>
              <div style={{
                display: 'flex', gap: 8, alignItems: 'flex-end',
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
                borderRadius: 26, padding: '7px',
                border: `0.5px solid ${isRecording ? 'rgba(239,68,68,0.28)' : 'rgba(255,255,255,0.07)'}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
                transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
              }}
                onFocusCapture={e => { e.currentTarget.style.border = `0.5px solid ${moodCol}45`; e.currentTarget.style.boxShadow = `0 8px 40px rgba(0,0,0,0.3), 0 0 0 3px ${moodCol}08, inset 0 1px 0 rgba(255,255,255,0.04)` }}
                onBlurCapture={e => { e.currentTarget.style.border = `0.5px solid ${isRecording ? 'rgba(239,68,68,0.28)' : 'rgba(255,255,255,0.07)'}`; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)' }}>

                <button onClick={handleMicToggle} title={isRecording ? 'Parar gravação' : 'Gravar áudio'} style={{
                  width: 42, height: 42, borderRadius: 19, border: 'none', flexShrink: 0, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
                  background: isRecording ? 'rgba(239,68,68,0.1)' : `${moodCol}12`,
                  animation: isRecording ? 'recPulse 1.6s infinite' : 'none',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = isRecording ? 'rgba(239,68,68,0.2)' : `${moodCol}20` }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = isRecording ? 'rgba(239,68,68,0.1)' : `${moodCol}12` }}>
                  {isRecording ? <Stop size={13} color="rgba(239,68,68,0.85)" /> : <Mic size={16} color={`${moodCol}CC`} />}
                </button>

                <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
                  {isRecording && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 4px 0' }}>
                      <RecordWave />
                      <span style={{ fontSize: 13, color: 'rgba(239,68,68,0.75)', fontFamily: "'DM Sans',sans-serif" }}>
                        {recordingText || 'Ouvindo...'}
                      </span>
                    </div>
                  )}
                  {!isRecording && (
                    <textarea
                      ref={textareaRef} value={input}
                      onChange={e => { setInput(e.target.value); autoResize() }}
                      onKeyDown={handleKey}
                      placeholder={isJournalingMode ? 'Escreva sua reflexão...' : 'Como você está se sentindo?'}
                      rows={1}
                      style={{ width: '100%', background: 'none', border: 'none', outline: 'none', fontSize: 14.5, lineHeight: 1.6, resize: 'none', fontFamily: "'DM Sans',sans-serif", color: 'rgba(255,255,255,0.78)', maxHeight: 120, padding: '10px 4px', display: 'block' }}
                    />
                  )}
                </div>

                <button onClick={handleSend} disabled={isTyping || (!input.trim() && !recordingText.trim())} style={{
                  width: 42, height: 42, borderRadius: 19, border: 'none', flexShrink: 0,
                  cursor: isTyping || (!input.trim() && !recordingText.trim()) ? 'not-allowed' : 'pointer',
                  background: isTyping || (!input.trim() && !recordingText.trim()) ? `${moodCol}0A` : `${moodCol}BB`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
                  boxShadow: isTyping || (!input.trim() && !recordingText.trim()) ? 'none' : `0 4px 18px ${moodCol}35`,
                }}
                  onMouseEnter={e => { if (!isTyping && input.trim()) { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = `${moodCol}DD` } }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = isTyping || (!input.trim() && !recordingText.trim()) ? `${moodCol}0A` : `${moodCol}BB` }}>
                  <Send size={16} color={isTyping || (!input.trim() && !recordingText.trim()) ? `${moodCol}40` : 'rgba(255,255,255,0.88)'} />
                </button>
              </div>

              <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.1)', marginTop: 8, letterSpacing: 0.5, fontFamily: 'monospace' }}>
                claramente // protocolo introspectivo ativo // cvv 188
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}