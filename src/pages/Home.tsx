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

// ─── Neural Background ─────────────────────────────────────────
function NeuralBackground({ isDark }: { isDark: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    let W = c.width = window.innerWidth
    let H = c.height = window.innerHeight
    const nodes = Array.from({ length: 32 }, () => ({
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
      const alpha = isDark ? 0.055 : 0.04
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y
          const d = Math.sqrt(dx*dx + dy*dy)
          if (d < 120) {
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(124,58,237,${(1 - d / 120) * alpha})`
            ctx.lineWidth = 0.5; ctx.stroke()
          }
        }
      }
      nodes.forEach(n => {
        const pulse = Math.sin(n.p) * 0.5 + 0.5
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * (1 + pulse * 0.4), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(124,58,237,${isDark ? 0.06 + pulse * 0.04 : 0.04 + pulse * 0.02})`
        ctx.fill()
      })
      frame = requestAnimationFrame(draw)
    }
    draw()
    const onResize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', onResize) }
  }, [isDark])
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: isDark ? 0.7 : 0.5 }} />
}

// ─── AI Orb ────────────────────────────────────────────────────
type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking'
function AIOrb({ state = 'idle', size = 96, color = '#7C3AED' }: { state?: OrbState; size?: number; color?: string }) {
  const glow = state === 'listening' ? 'rgba(129,140,248,0.22)' : state === 'thinking' ? 'rgba(91,33,182,0.26)' : `${color}22`
  const ring = state === 'listening' ? 'rgba(129,140,248,0.18)' : `${color}20`
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <div style={{ position: 'absolute', width: size * 2.4, height: size * 2.4, borderRadius: '50%', background: `radial-gradient(circle, ${glow} 0%, transparent 65%)`, animation: 'orbBreath 5s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: size * 1.72, height: size * 1.72, borderRadius: '50%', border: `0.5px dashed ${ring}`, animation: 'jRing1 24s linear infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: size * 1.36, height: size * 1.36, borderRadius: '50%', border: `0.5px solid ${ring}`, animation: 'jRing2 14s linear infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: size * 1.06, height: size * 1.06, borderRadius: '50%', border: `1px solid ${ring}`, boxShadow: `0 0 24px ${glow}`, animation: 'orbBreath 5s ease-in-out infinite 1.5s', pointerEvents: 'none' }} />
      <div style={{ width: size * 0.68, height: size * 0.68, borderRadius: '50%', background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.14) 0%, transparent 50%), radial-gradient(circle, ${color}28 0%, ${color}08 60%, transparent 80%)`, border: `1px solid ${color}38`, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'orbBreath 5s ease-in-out infinite', boxShadow: `0 0 28px ${glow}` }}>
        <Crystal size={size * 0.28} color="rgba(255,255,255,0.72)" dim="rgba(255,255,255,0.07)" mid="rgba(255,255,255,0.11)" line="rgba(255,255,255,0.32)" />
      </div>
      {state === 'speaking' && (
        <div style={{ position: 'absolute', bottom: size < 40 ? -12 : -20, display: 'flex', gap: 2, alignItems: 'flex-end', height: size < 40 ? 10 : 14 }}>
          {[0.4,0.8,1,0.7,0.5,0.9,0.6].map((h, i) => (
            <div key={i} style={{ width: 2, borderRadius: 2, background: color, opacity: 0.65, animation: `wvBar ${0.35+h*0.4}s ${i*0.05}s infinite ease-in-out alternate`, height: `${h*(size < 40 ? 8 : 12)}px` }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Typewriter ────────────────────────────────────────────────
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
  return <span>{shown}{!done && <span style={{ opacity: 0.5, animation: 'blink 0.9s infinite' }}>|</span>}</span>
}

// ─── Waveforms ─────────────────────────────────────────────────
function JarvisWave({ color = 'rgba(124,58,237,0.8)', n = 10 }: { color?: string; n?: number }) {
  const H = [0.35,0.75,0.55,1,0.65,0.9,0.45,0.8,0.5,0.85,0.4,0.6]
  return (
    <div style={{ display: 'flex', gap: 2.5, alignItems: 'center', height: 24, padding: '0 2px' }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{ width: 2.5, borderRadius: 2, background: color, height: `${H[i%H.length]*18+3}px`, opacity: 0.6+H[i%H.length]*0.4, animation: `wvBar ${0.45+H[i%H.length]*0.45}s ${i*0.055}s infinite ease-in-out alternate` }} />
      ))}
    </div>
  )
}

function RecordWave() {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center', height: 20 }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ width: 2, borderRadius: 2, background: '#EF4444', opacity: 0.7, animation: `wvBar ${0.28+(i%5)*0.07}s ${i*0.04}s infinite ease-in-out alternate`, height: `${8+(i%4)*4}px` }} />
      ))}
    </div>
  )
}

// ─── Boot ──────────────────────────────────────────────────────
function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0)
  const [prog,  setProg]  = useState(0)
  const [lines, setLines] = useState<string[]>([])
  const bootLines = ['SISTEMA NEURAL INICIALIZADO','MEMÓRIA PERSISTENTE CARREGADA','MOTOR EMOCIONAL ATIVO','SÍNTESE DE VOZ CALIBRADA','CLARAMENTE v2.0 // PRONTO']
  useEffect(() => {
    audio.init()
    const t1 = setTimeout(() => { setPhase(1); audio.playBoot() }, 200)
    const t2 = setTimeout(() => setPhase(2), 700)
    bootLines.forEach((ln, i) => setTimeout(() => setLines(p => [...p, ln]), 900 + i * 270))
    let p = 0; const iv = setInterval(() => { p += 2; setProg(p); if (p >= 100) clearInterval(iv) }, 30)
    const t3 = setTimeout(() => setPhase(3), 2700)
    const t4 = setTimeout(onComplete, 3300)
    return () => { [t1,t2,t3,t4].forEach(clearTimeout); clearInterval(iv) }
  }, [])
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: '#030208', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: phase === 3 ? 0 : 1, transition: 'opacity 0.7s ease', fontFamily: 'monospace' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(124,58,237,0.15) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(124,58,237,0.6),transparent)', animation: 'scanLine 2s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ marginBottom: 40, opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? 'scale(1)' : 'scale(0.4)', transition: 'all 0.7s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <AIOrb state="idle" size={88} />
      </div>
      <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 'clamp(28px,6vw,40px)', color: 'rgba(255,255,255,0.92)', letterSpacing: 12, textTransform: 'uppercase', marginBottom: 8, opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.6s 0.3s', textShadow: '0 0 40px rgba(124,58,237,0.7)' }}>
        Claramente
      </h1>
      <p style={{ fontSize: 11, color: 'rgba(124,58,237,0.6)', letterSpacing: 4, marginBottom: 40, opacity: phase >= 1 ? 0.9 : 0, transition: 'opacity 0.6s 0.5s', textTransform: 'uppercase' }}>
        ia terapêutica avançada
      </p>
      <div style={{ width: 300, maxWidth: '88vw', marginBottom: 24 }}>
        {lines.map((ln, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, animation: 'bootLn 0.3s ease forwards' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: i === lines.length - 1 ? '#7C3AED' : '#22C55E', animation: i === lines.length - 1 ? 'blink 1s infinite' : 'none' }} />
            <span style={{ fontSize: 11, color: i === lines.length - 1 ? 'rgba(167,139,250,0.9)' : 'rgba(34,197,94,0.6)', letterSpacing: 0.8 }}>{ln}</span>
          </div>
        ))}
      </div>
      <div style={{ width: 300, maxWidth: '88vw' }}>
        <div style={{ height: '2px', background: 'rgba(124,58,237,0.1)', borderRadius: 1, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg,#4C1D95,#A78BFA)', width: `${prog}%`, transition: 'width 0.04s linear', boxShadow: '0 0 10px rgba(124,58,237,0.8)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 10, color: 'rgba(124,58,237,0.3)', letterSpacing: 1 }}>INICIALIZANDO</span>
          <span style={{ fontSize: 10, color: 'rgba(124,58,237,0.4)' }}>{prog}%</span>
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

// ─── HOME ──────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate()
  const { profile, signOut }  = useAuth()
  const { t, isDark, toggle } = useTheme()
  const {
    messages, isTyping, isCrisis, isJournalingMode,
    conversationId, conversations, smartSummary, loadingSmartSummary,
    sendMessage, resetChat, loadConversation, startJournaling,
  } = useChat()

  const [input, setInput]                 = useState('')
  const [sidebarOpen, setSidebarOpen]     = useState(false)
  const [isMuted, setIsMuted]             = useState(false)
  const [isRecording, setIsRecording]     = useState(false)
  const [recordingText, setRecordingText] = useState('')
  const [isSpeaking, setIsSpeaking]       = useState(false)
  const [uptime, setUptime]               = useState('00:00:00')
  const [welcomeDone, setWelcomeDone]     = useState(false)
  const [showHUD, setShowHUD]             = useState(false)
  const [micSupported]                    = useState(speechEngine.isRecordingSupported)
  const [bootDone, setBootDone]           = useState(() => sessionStorage.getItem('claramente-booted') === 'true')
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
  useEffect(() => emotionEngine.subscribe(setEmotionalProfile), [])

  // Boas-vindas narradas (Trecho 1)
  useEffect(() => {
    if (!bootDone) return
    const timer = setTimeout(() => speechEngine.speakWelcome(firstName), 800)
    return () => clearTimeout(timer)
  }, [bootDone, firstName])

  // Falar respostas da IA (Trecho 2)
  useEffect(() => {
    if (messages.length > prevMsgLen.current) {
      const newMsgs = messages.slice(prevMsgLen.current)
      const last    = newMsgs[newMsgs.length - 1]
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
    // Inicializa audio context (necessário em mobile)
    audio.init()
    if (isRecording) {
      speechEngine.stopRecording(); setIsRecording(false)
      if (recordingText.trim()) { setInput(recordingText.trim()); setRecordingText('') }
    } else {
      const ok = speechEngine.startRecording(
        (text, isFinal) => {
          setRecordingText(text)
          if (isFinal) { setInput(p => (p + ' ' + text).trim()); setRecordingText('') }
        },
        () => setIsRecording(false)
      )
      if (ok) { setIsRecording(true); audio.playClick() }
    }
  }, [isRecording, recordingText])

  function autoResize() {
    const el = textareaRef.current; if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 136) + 'px'
  }

  async function handleSend() {
    if (!input.trim() || isTyping) return
    const text = input.trim(); setInput(''); setRecordingText('')
    if (isRecording) { speechEngine.stopRecording(); setIsRecording(false) }
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    // Trecho 3
    audio.init(); audio.playMessageSent()
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

  // Trecho 4
  async function handleJournaling() {
    audio.init(); audio.playJournaling()
    speechEngine.speakJournalingStart()
    prevMsgLen.current = 0
    await startJournaling(); setSidebarOpen(false)
  }

  async function handleProactiveAccept(prompt: string) {
    dismiss(); await sendMessage(prompt)
  }

  function handleBootComplete() {
    sessionStorage.setItem('claramente-booted', 'true'); setBootDone(true)
  }

  // ─── CSS global (8px grid) ───────────────────────────────────
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 16px; -webkit-text-size-adjust: 100%; }
    body { -webkit-font-smoothing: antialiased; }

    @keyframes orbBreath { 0%,100%{transform:scale(1);opacity:0.8} 50%{transform:scale(1.06);opacity:1} }
    @keyframes jRing1    { from{transform:rotate(0deg)}   to{transform:rotate(360deg)} }
    @keyframes jRing2    { from{transform:rotate(360deg)} to{transform:rotate(0deg)} }
    @keyframes wvBar     { from{transform:scaleY(0.12)}   to{transform:scaleY(1)} }
    @keyframes bootLn    { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
    @keyframes scanLine  { 0%{top:-2px;opacity:0} 5%{opacity:0.4} 95%{opacity:0.4} 100%{top:100%;opacity:0} }
    @keyframes fadeUp    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes msgIn     { from{opacity:0;transform:translateY(8px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes pulse     { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.12)} }
    @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0} }
    @keyframes recPulse  { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.35)} 50%{box-shadow:0 0 0 10px rgba(239,68,68,0)} }
    @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

    .sb-desktop { display: none !important; height: 100%; }
    .mob-hdr    { display: flex; }
    @media (min-width: 768px) {
      .sb-desktop { display: flex !important; }
      .mob-hdr    { display: none !important; }
    }

    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.2); border-radius: 3px; }

    textarea { -webkit-appearance: none; }
    textarea::placeholder { color: ${t.placeholder} !important; }
    input::placeholder    { color: ${t.placeholder} !important; }

    /* Smooth color transitions for theme switch */
    * { transition-property: background-color, border-color, color; transition-duration: 200ms; transition-timing-function: ease; }
    /* But NOT layout properties */
    div, span, p, button, textarea { transition-property: background-color, border-color, color, box-shadow, opacity; }
  `

  // ─── SIDEBAR ─────────────────────────────────────────────────
  function Sidebar() {
    return (
      <aside style={{
        width: 272, flexShrink: 0, height: '100%',
        display: 'flex', flexDirection: 'column',
        background: t.sidebar,
        backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
        borderRight: `0.5px solid ${t.sidebarBorder}`,
        position: 'relative',
      }}>

        {/* Grid fundo sutil */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${isDark ? 'rgba(124,58,237,0.09)' : 'rgba(124,58,237,0.05)'} 1px, transparent 1px)`, backgroundSize: '24px 24px', pointerEvents: 'none', opacity: 0.8 }} />

        {/* Logo — 64px (8×8) */}
        <div style={{ height: 64, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `0.5px solid ${t.sidebarBorder}`, position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', background: `radial-gradient(circle, ${moodGlow(mood)} 0%, transparent 70%)`, animation: 'orbBreath 4s ease-in-out infinite', pointerEvents: 'none' }} />
            <Crystal size={26} color={isDark ? 'rgba(255,255,255,0.72)' : t.violetDeep} dim={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(124,58,237,0.1)'} mid={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(124,58,237,0.2)'} line={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(124,58,237,0.5)'} />
          </div>
          <div>
            <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: 16, color: t.text, margin: 0, letterSpacing: -0.4, lineHeight: 1.2 }}>Claramente</p>
            <p style={{ fontSize: 10, color: moodCol, margin: 0, letterSpacing: 1.8, fontFamily: 'monospace', textTransform: 'uppercase', opacity: 0.7 }}>sistema ativo</p>
          </div>
          {isSpeaking && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 2, alignItems: 'center', height: 14 }}>
              {[0.5,1,0.7,0.9,0.6].map((h,i) => (
                <div key={i} style={{ width: 2, borderRadius: 1, background: moodCol, height: `${h*12}px`, animation: `wvBar ${0.35+h*0.3}s ${i*0.06}s infinite ease-in-out alternate` }} />
              ))}
            </div>
          )}
        </div>

        {/* Ações — padding 16px (8×2) */}
        <div style={{ padding: '12px 12px 8px', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
          {/* Nova conversa */}
          <button onClick={handleNewChat} style={{
            width: '100%', height: 48, padding: '0 16px',
            background: t.violetBg, border: `0.5px solid ${isDark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.18)'}`,
            borderRadius: 12, color: t.violet, fontSize: 14, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
            transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = t.violetHover; e.currentTarget.style.transform = 'translateX(3px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = t.violetBg; e.currentTarget.style.transform = 'translateX(0)' }}>
            <Plus size={16} color={t.violet} /> Nova conversa
          </button>

          {/* Journaling */}
          <button onClick={handleJournaling} style={{
            width: '100%', height: 48, padding: '0 16px',
            background: isDark ? 'rgba(167,139,250,0.08)' : 'rgba(124,58,237,0.06)',
            border: `0.5px solid ${isDark ? 'rgba(167,139,250,0.15)' : 'rgba(124,58,237,0.14)'}`,
            borderRadius: 12, color: isDark ? 'rgba(196,181,253,0.88)' : t.violetDeep,
            fontSize: 14, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
            transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(167,139,250,0.16)' : 'rgba(124,58,237,0.12)'; e.currentTarget.style.transform = 'translateX(3px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(167,139,250,0.08)' : 'rgba(124,58,237,0.06)'; e.currentTarget.style.transform = 'translateX(0)' }}>
            <Sparkle size={14} color={isDark ? 'rgba(196,181,253,0.75)' : t.violetDeep} /> Journaling guiado
          </button>
        </div>

        {/* Lista conversas */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 8px', position: 'relative' }}>
          {grouped.length === 0 && (
            <p style={{ fontSize: 13, color: t.textMuted, textAlign: 'center', padding: '32px 16px', lineHeight: 1.8, fontFamily: "'DM Sans',sans-serif" }}>
              Nenhuma sessão ainda.<br/>Inicie uma conversa!
            </p>
          )}
          {grouped.map(group => (
            <div key={group.label}>
              <p style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', padding: '16px 10px 6px', fontFamily: "'DM Sans',sans-serif" }}>
                {group.label}
              </p>
              {group.items.map(conv => (
                <button key={conv.id} onClick={() => handleLoadConv(conv.id)} style={{
                  width: '100%', textAlign: 'left', padding: '10px 12px',
                  borderRadius: 10, border: 'none', cursor: 'pointer', marginBottom: 2,
                  background: conversationId === conv.id ? t.violetBg : 'transparent',
                  borderLeft: `2px solid ${conversationId === conv.id ? t.violet : 'transparent'}`,
                  transition: 'all 0.18s cubic-bezier(0.16,1,0.3,1)', display: 'block',
                  minHeight: 48,
                }}
                  onMouseEnter={e => { if (conversationId !== conv.id) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(124,58,237,0.05)' }}
                  onMouseLeave={e => { if (conversationId !== conv.id) e.currentTarget.style.background = 'transparent' }}>
                  <p style={{ fontSize: 14, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans',sans-serif", fontWeight: conversationId === conv.id ? 500 : 400, color: conversationId === conv.id ? t.text : t.textSub }}>
                    {conv.title}
                  </p>
                  <p style={{ fontSize: 12, color: t.textMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans',sans-serif" }}>
                    {conv.preview}
                  </p>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* HUD diagnóstico */}
        <div style={{ padding: '8px 12px', borderTop: `0.5px solid ${t.sidebarBorder}` }}>
          <button onClick={() => setShowHUD(p => !p)} style={{
            width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 10px', borderRadius: 8, border: 'none',
            background: 'transparent', cursor: 'pointer',
            color: t.textMuted, fontSize: 11, fontFamily: "'DM Sans',sans-serif", fontWeight: 500,
            letterSpacing: 0.5, textTransform: 'uppercase',
          }}>
            <span>Diagnóstico emocional</span>
            <span style={{ fontSize: 10 }}>{showHUD ? '▲' : '▼'}</span>
          </button>
          {showHUD && <div style={{ marginTop: 8 }}><JarvisHUD visible /></div>}
        </div>

        {/* Status — 40px */}
        <div style={{ height: 40, padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `0.5px solid ${t.sidebarBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', animation: 'pulse 2.5s infinite' }} />
            <span style={{ fontSize: 11, color: isDark ? 'rgba(34,197,94,0.7)' : '#16A34A', letterSpacing: 0.8, fontFamily: 'monospace', textTransform: 'uppercase' }}>online</span>
          </div>
          <span style={{ fontSize: 11, color: t.textMuted, fontFamily: 'monospace' }}>UP {uptime}</span>
        </div>

        {/* Rodapé — 64px */}
        <div style={{ height: 64, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `0.5px solid ${t.sidebarBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${moodCol}20`, border: `1px solid ${moodCol}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: moodCol, flexShrink: 0 }}>
              {firstName.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 14, color: t.textSub, fontFamily: "'DM Sans',sans-serif", fontWeight: 400 }}>{firstName}</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { Icon: isDark ? Sun : Moon,            action: toggle,                       title: 'Tema',   col: t.textMuted },
              { Icon: isMuted ? VolumeOff : Volume,   action: handleMute,                   title: 'Som',    col: isMuted ? '#EF4444' : t.textMuted },
              { Icon: BarChart,                       action: () => navigate('/relatorios'), title: 'Relat.', col: t.textMuted },
              { Icon: Person,                         action: () => navigate('/perfil'),    title: 'Perfil', col: t.textMuted },
              { Icon: LogOut,                         action: signOut,                      title: 'Sair',   col: t.textMuted },
            ].map(({ Icon, action, title, col }) => (
              <button key={title} onClick={action} title={title} style={{
                width: 32, height: 32, borderRadius: 8, border: 'none',
                background: 'transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.18s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = t.violetBg)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <Icon size={16} color={col} />
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
      <NeuralBackground isDark={isDark} />

      {/* Atmospheric glows */}
      <div style={{ position: 'fixed', top: '15%', left: '40%', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${moodGlow(mood)} 0%, transparent 65%)`, pointerEvents: 'none', zIndex: 0, animation: 'orbBreath 9s ease-in-out infinite', transition: 'background 3s ease' }} />

      {!bootDone && <BootSequence onComplete={handleBootComplete} />}

      <div style={{
        height: '100dvh', display: 'flex',
        background: t.bg,
        fontFamily: "'DM Sans','Plus Jakarta Sans',sans-serif",
        position: 'relative', overflow: 'hidden', zIndex: 1,
        opacity: bootDone ? 1 : 0, transition: 'opacity 0.6s ease',
      }}>
        <style>{CSS}</style>

        {/* Sidebar desktop */}
        <div className="sb-desktop"><Sidebar /></div>

        {/* Sidebar mobile overlay */}
        {sidebarOpen && (
          <>
            <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, backdropFilter: 'blur(6px)' }} />
            <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, animation: 'fadeUp 0.22s ease', maxWidth: '85vw' }}>
              <Sidebar />
            </div>
          </>
        )}

        {/* Área principal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>

          {/* Scan line */}
          {isTyping && <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: `linear-gradient(90deg,transparent,${t.scanLine},transparent)`, animation: 'scanLine 1.8s ease-in-out infinite', zIndex: 5, pointerEvents: 'none' }} />}

          {/* Header mobile — 56px (8×7) */}
          <header className="mob-hdr" style={{
            background: t.header, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            borderBottom: `0.5px solid ${t.headerBorder}`,
            height: 56, padding: '0 16px',
            alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0, zIndex: 10, position: 'relative',
          }}>
            {/* Menu burger — 44px touch target */}
            <button onClick={() => setSidebarOpen(true)} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 10 }}>
              <Menu size={20} color={t.violet} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AIOrb state={orbState} size={24} color={moodCol} />
              <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: 17, color: t.text }}>
                {isJournalingMode ? 'Journaling' : 'Claramente'}
              </span>
            </div>

            <button onClick={handleMute} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 10 }}>
              {isMuted ? <VolumeOff size={18} color="#EF4444" /> : <Volume size={18} color={t.textSub} />}
            </button>
          </header>

          {/* Banner journaling */}
          {isJournalingMode && (
            <div style={{ padding: '10px 20px', background: isDark ? 'rgba(167,139,250,0.07)' : 'rgba(124,58,237,0.06)', backdropFilter: 'blur(12px)', borderBottom: `0.5px solid ${isDark ? 'rgba(167,139,250,0.12)' : 'rgba(124,58,237,0.1)'}`, display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: t.violet, zIndex: 10, position: 'relative' }}>
              <Sparkle size={14} color={t.violet} />
              <span style={{ fontWeight: 500 }}>Modo Journaling Guiado</span>
              <span style={{ color: t.textMuted, fontSize: 13 }}>— sessão reflexiva estruturada</span>
            </div>
          )}

          {/* Banner crise */}
          {isCrisis && (
            <div style={{ margin: '8px 16px 0', padding: '12px 16px', borderRadius: 12, background: isDark ? 'rgba(239,68,68,0.08)' : '#FFF7ED', border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#FED7AA'}`, fontSize: 14, color: isDark ? 'rgba(252,165,165,0.9)' : '#92400E', lineHeight: 1.6, zIndex: 10, position: 'relative' }}>
              CVV: <strong>188</strong> · Ligação gratuita, 24h · cvv.org.br
            </div>
          )}

          {/* Área de mensagens */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 20px 16px', position: 'relative', zIndex: 1 }}>
            <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Welcome screen */}
              {messages.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px 32px', animation: 'fadeUp 0.7s ease' }}>
                  <div style={{ marginBottom: 40, animation: 'float 7s ease-in-out infinite' }}>
                    <AIOrb state={orbState} size={112} color={moodCol} />
                  </div>

                  <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 'clamp(24px,5vw,32px)', color: t.text, marginBottom: 8, fontWeight: 400, letterSpacing: -0.8, textAlign: 'center' }}>
                    {bootDone && !welcomeDone
                      ? <TypewriterText text={`Olá, ${firstName}`} speed={55} onComplete={() => setWelcomeDone(true)} />
                      : `Olá, ${firstName}`}
                  </h2>

                  {loadingSmartSummary && (
                    <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
                      <JarvisWave color={`${moodCol}80`} n={8} />
                    </div>
                  )}

                  {smartSummary && !loadingSmartSummary && (
                    <div style={{ background: t.card, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `0.5px solid ${t.cardBorder}`, borderRadius: 20, padding: '16px 20px', marginBottom: 24, maxWidth: 440, width: '100%', position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.5s ease', boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.2)' : '0 4px 24px rgba(124,58,237,0.08)' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg,transparent,${moodCol}30,transparent)` }} />
                      <p style={{ fontSize: 15, color: t.textSub, lineHeight: 1.78, margin: 0, fontStyle: 'italic' }}>{smartSummary}</p>
                    </div>
                  )}

                  {!smartSummary && !loadingSmartSummary && welcomeDone && (
                    <p style={{ fontSize: 16, color: t.textSub, lineHeight: 1.85, maxWidth: 320, textAlign: 'center', marginBottom: 8, animation: 'fadeUp 0.5s ease' }}>
                      Este é seu espaço sagrado.<br/>Como você está se sentindo hoje?
                    </p>
                  )}

                  {/* Chips */}
                  {welcomeDone && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 24, animation: 'fadeUp 0.6s ease 0.15s both', maxWidth: 480 }}>
                      {[
                        { label: 'Journaling guiado', Icon: Sparkle, action: handleJournaling, accent: true },
                        { label: 'Estou ansioso',     Icon: null,    action: () => sendMessage('Estou me sentindo ansioso ultimamente.'), accent: false },
                        { label: 'Quero refletir',    Icon: null,    action: () => sendMessage('Quero fazer uma reflexão sobre minha vida.'), accent: false },
                        { label: 'Me sinto bem',      Icon: null,    action: () => sendMessage('Estou me sentindo bem hoje!'), accent: false },
                      ].map(chip => (
                        <button key={chip.label} onClick={() => { audio.init(); chip.action() }} style={{
                          padding: '10px 20px', borderRadius: 24, fontSize: 14, fontWeight: 500,
                          cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                          transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
                          border: chip.accent ? 'none' : `0.5px solid ${t.cardBorder}`,
                          background: chip.accent ? (isDark ? `${moodCol}28` : t.violetBg) : t.card,
                          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                          color: chip.accent ? t.violet : t.textSub,
                          boxShadow: chip.accent ? `0 0 24px ${moodCol}20` : 'none',
                          display: 'flex', alignItems: 'center', gap: 8,
                          minHeight: 44,
                        }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.12)' }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.filter = 'brightness(1)' }}>
                          {chip.Icon && <chip.Icon size={14} color={chip.accent ? t.violet : t.textSub} />}
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
                  delay={600}
                />
              )}

              {/* Mensagens */}
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', animation: 'msgIn 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
                  {msg.role === 'assistant' && (
                    <div style={{ flexShrink: 0, marginBottom: 2 }}>
                      <AIOrb state={isTyping ? 'thinking' : 'idle'} size={32} color={moodCol} />
                    </div>
                  )}
                  <div style={{
                    maxWidth: 'min(74%, 520px)', padding: '14px 18px',
                    fontSize: 16, lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    background: msg.role === 'user' ? t.userBubble : t.botBubble,
                    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                    color: msg.role === 'user' ? (isDark ? t.userText : t.text) : t.text,
                    border: msg.role === 'user' ? `0.5px solid ${t.userBorder}` : `0.5px solid ${t.botBorder}`,
                    boxShadow: msg.role === 'user'
                      ? `0 4px 20px ${moodCol}18`
                      : isDark ? '0 2px 16px rgba(0,0,0,0.24)' : '0 2px 16px rgba(124,58,237,0.06)',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {msg.role === 'assistant' && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg,transparent,${moodCol}22,transparent)` }} />
                    )}
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing */}
              {isTyping && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', animation: 'fadeUp 0.3s ease' }}>
                  <AIOrb state="thinking" size={32} color={moodCol} />
                  <div style={{ background: t.botBubble, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `0.5px solid ${t.botBorder}`, borderRadius: '20px 20px 20px 4px', padding: '14px 18px', position: 'relative', overflow: 'hidden', boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.24)' : '0 2px 16px rgba(124,58,237,0.06)' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg,transparent,${moodCol}22,transparent)` }} />
                    <JarvisWave color={`${moodCol}AA`} n={9} />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* INPUT BAR — 80px mínimo */}
          <div style={{
            background: t.header,
            backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
            borderTop: `0.5px solid ${t.headerBorder}`,
            padding: '12px 16px',
            paddingBottom: `max(12px, env(safe-area-inset-bottom, 12px))`,
            flexShrink: 0, position: 'relative', zIndex: 10,
          }}>
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px', background: `linear-gradient(90deg,transparent,${moodCol}25,transparent)`, transition: 'background 2s ease' }} />

            {/* Status de gravação/mudo */}
            {(isRecording || isMuted) && (
              <p style={{ textAlign: 'center', fontSize: 12, color: isRecording ? '#EF4444' : t.textMuted, letterSpacing: 0.8, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 8 }}>
                {isRecording ? '● GRAVANDO — TOQUE NO MICROFONE PARA PARAR' : 'SOM DESATIVADO'}
              </p>
            )}

            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              <div style={{
                display: 'flex', gap: 8, alignItems: 'flex-end',
                background: t.input,
                backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                borderRadius: 28, padding: '8px',
                border: `1.5px solid ${isRecording ? 'rgba(239,68,68,0.4)' : t.inputBorder}`,
                boxShadow: isDark
                  ? '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)'
                  : '0 4px 24px rgba(124,58,237,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
                onFocusCapture={e => { e.currentTarget.style.borderColor = t.inputFocus; e.currentTarget.style.boxShadow = isDark ? `0 8px 40px rgba(0,0,0,0.3), 0 0 0 3px ${moodCol}10` : `0 4px 24px rgba(124,58,237,0.15), 0 0 0 3px ${moodCol}12` }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = isRecording ? 'rgba(239,68,68,0.4)' : t.inputBorder; e.currentTarget.style.boxShadow = isDark ? '0 8px 32px rgba(0,0,0,0.25)' : '0 4px 24px rgba(124,58,237,0.08)' }}>

                {/* Botão microfone — 48px touch target */}
                {micSupported && (
                  <button onClick={handleMicToggle} title={isRecording ? 'Parar gravação' : 'Gravar áudio'} style={{
                    width: 48, height: 48, borderRadius: 20, border: 'none', flexShrink: 0,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isRecording ? 'rgba(239,68,68,0.12)' : t.violetBg,
                    transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
                    animation: isRecording ? 'recPulse 1.6s infinite' : 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
                    {isRecording ? <Stop size={14} color="#EF4444" /> : <Mic size={18} color={t.violet} />}
                  </button>
                )}

                {/* Área de texto */}
                <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
                  {isRecording && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 4px 0' }}>
                      <RecordWave />
                      <span style={{ fontSize: 15, color: '#EF4444', fontFamily: "'DM Sans',sans-serif" }}>
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
                      style={{
                        width: '100%', background: 'none', border: 'none', outline: 'none',
                        fontSize: 16, lineHeight: 1.6, resize: 'none',
                        fontFamily: "'DM Sans',sans-serif",
                        color: t.text, maxHeight: 136, padding: '10px 4px',
                        display: 'block', WebkitAppearance: 'none',
                      }}
                    />
                  )}
                </div>

                {/* Botão enviar — 48px touch target */}
                <button onClick={handleSend} disabled={isTyping || (!input.trim() && !recordingText.trim())} style={{
                  width: 48, height: 48, borderRadius: 20, border: 'none', flexShrink: 0,
                  cursor: isTyping || (!input.trim() && !recordingText.trim()) ? 'not-allowed' : 'pointer',
                  background: isTyping || (!input.trim() && !recordingText.trim()) ? t.violetBg : t.violetDeep,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
                  boxShadow: isTyping || (!input.trim() && !recordingText.trim()) ? 'none' : `0 4px 16px ${moodCol}40`,
                  WebkitTapHighlightColor: 'transparent',
                }}
                  onMouseEnter={e => { if (!isTyping && input.trim()) e.currentTarget.style.transform = 'scale(1.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
                  <Send size={18} color={isTyping || (!input.trim() && !recordingText.trim()) ? t.violet : 'white'} />
                </button>
              </div>

              {/* Caption */}
              <p style={{ textAlign: 'center', fontSize: 12, color: t.textMuted, marginTop: 8, letterSpacing: 0.3, fontFamily: "'DM Sans',sans-serif" }}>
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
    </>
  )
}