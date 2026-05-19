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

// ═══════════════════════════════════════════════════════════════
// AMBIENT CANVAS
// ═══════════════════════════════════════════════════════════════
function AmbientCanvas({ isDark }: { isDark: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    let W = c.width = window.innerWidth
    let H = c.height = window.innerHeight
    const dots = Array.from({ length: 20 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .12, vy: (Math.random() - .5) * .12,
      r: Math.random() + .4, p: Math.random() * Math.PI * 2,
    }))
    let raf: number
    const tick = () => {
      ctx.clearRect(0, 0, W, H)
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy; d.p += .01
        if (d.x < 0 || d.x > W) d.vx *= -1
        if (d.y < 0 || d.y > H) d.vy *= -1
      })
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x
          const dy = dots[i].y - dots[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 110) {
            ctx.beginPath()
            ctx.moveTo(dots[i].x, dots[i].y)
            ctx.lineTo(dots[j].x, dots[j].y)
            ctx.strokeStyle = `rgba(124,58,237,${(1 - dist / 110) * (isDark ? .04 : .025)})`
            ctx.lineWidth = .5
            ctx.stroke()
          }
        }
      }
      dots.forEach(d => {
        const a = Math.sin(d.p) * .5 + .5
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r * (1 + a * .3), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(124,58,237,${isDark ? .04 + a * .025 : .025 + a * .015})`
        ctx.fill()
      })
      raf = requestAnimationFrame(tick)
    }
    tick()
    const resize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight }
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [isDark])
  return (
    <canvas ref={ref} style={{
      position: 'fixed', inset: 0, zIndex: 0,
      pointerEvents: 'none', opacity: isDark ? .7 : .45,
    }} />
  )
}

// ═══════════════════════════════════════════════════════════════
// AI ORB — the emotional core
// ═══════════════════════════════════════════════════════════════
type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking'

function AIOrb({
  state = 'idle',
  size = 100,
  color = '#7C3AED',
}: { state?: OrbState; size?: number; color?: string }) {
  const glow = {
    idle:      `${color}1C`,
    listening: 'rgba(99,102,241,.24)',
    thinking:  `${color}2A`,
    speaking:  'rgba(167,139,250,.22)',
  }[state]

  const dur = { idle: '6s', listening: '3s', thinking: '2.2s', speaking: '4s' }[state]

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {/* Atmospheric halo */}
      <div style={{ position: 'absolute', width: size * 3.2, height: size * 3.2, borderRadius: '50%', background: `radial-gradient(circle, ${glow} 0%, transparent 58%)`, animation: `orbB ${dur} ease-in-out infinite`, pointerEvents: 'none' }} />
      {/* Ring 3 */}
      <div style={{ position: 'absolute', width: size * 1.9, height: size * 1.9, borderRadius: '50%', border: `.5px dashed ${color}16`, animation: 'rA 30s linear infinite', pointerEvents: 'none' }} />
      {/* Ring 2 */}
      <div style={{ position: 'absolute', width: size * 1.5, height: size * 1.5, borderRadius: '50%', border: `.5px solid ${color}14`, animation: 'rB 18s linear infinite', pointerEvents: 'none' }} />
      {/* Ring 1 */}
      <div style={{ position: 'absolute', width: size * 1.1, height: size * 1.1, borderRadius: '50%', border: `1px solid ${color}20`, boxShadow: `0 0 22px ${glow}`, animation: `orbB ${dur} ease-in-out infinite 1s`, pointerEvents: 'none' }} />
      {/* Core sphere */}
      <div style={{
        width: size * .7, height: size * .7, borderRadius: '50%',
        background: `radial-gradient(circle at 34% 30%, rgba(255,255,255,.13) 0%, transparent 52%), radial-gradient(circle, ${color}24 0%, ${color}0A 55%, transparent 72%)`,
        border: `1px solid ${color}2C`,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: `orbB ${dur} ease-in-out infinite`,
        boxShadow: `0 0 48px ${glow}, inset 0 1px 0 rgba(255,255,255,.07)`,
      }}>
        <Crystal
          size={size * .27}
          color="rgba(255,255,255,.68)"
          dim="rgba(255,255,255,.06)"
          mid="rgba(255,255,255,.1)"
          line="rgba(255,255,255,.26)"
        />
      </div>
      {/* Speaking visualizer */}
      {state === 'speaking' && (
        <div style={{ position: 'absolute', bottom: size < 50 ? -14 : -24, display: 'flex', gap: 2.5, alignItems: 'flex-end', height: size < 50 ? 12 : 16 }}>
          {[.4,.8,1,.7,.5,.9,.6].map((h, i) => (
            <div key={i} style={{ width: 2.5, borderRadius: 2, background: color, opacity: .6, animation: `wv ${.35 + h * .4}s ${i * .055}s infinite ease-in-out alternate`, height: `${h * (size < 50 ? 10 : 14)}px` }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TYPEWRITER
// ═══════════════════════════════════════════════════════════════
function Typewriter({ text, speed = 32, onDone }: { text: string; speed?: number; onDone?: () => void }) {
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
  return <>{shown}{!done && <span style={{ opacity: .35, animation: 'blink 1s infinite' }}>|</span>}</>
}

// ═══════════════════════════════════════════════════════════════
// WAVEFORMS
// ═══════════════════════════════════════════════════════════════
function Waveform({ color = 'rgba(124,58,237,.72)', bars = 10 }: { color?: string; bars?: number }) {
  const H = [.35,.75,.55,1,.65,.9,.45,.8,.5,.85,.4,.6]
  return (
    <div style={{ display: 'flex', gap: 2.5, alignItems: 'center', height: 20 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <div key={i} style={{ width: 2.5, borderRadius: 2, background: color, height: `${H[i % H.length] * 14 + 3}px`, opacity: .55 + H[i % H.length] * .4, animation: `wv ${.45 + H[i % H.length] * .45}s ${i * .055}s infinite ease-in-out alternate` }} />
      ))}
    </div>
  )
}

function RecordBars() {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center', height: 18 }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} style={{ width: 2, borderRadius: 2, background: '#EF4444', opacity: .65, animation: `wv ${.28 + (i % 5) * .07}s ${i * .04}s infinite ease-in-out alternate`, height: `${7 + (i % 4) * 4}px` }} />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ACTION CARD
// ═══════════════════════════════════════════════════════════════
function ActionCard({
  title, subtitle, Icon, accent = false, accent_color,
  isDark, onClick,
}: {
  title: string; subtitle: string; Icon?: React.ElementType;
  accent?: boolean; accent_color: string; isDark: boolean; onClick: () => void;
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '15px 14px', borderRadius: 20, cursor: 'pointer',
        background: accent
          ? (hov ? `${accent_color}20` : `${accent_color}12`)
          : (hov ? (isDark ? 'rgba(255,255,255,.055)' : 'rgba(124,58,237,.06)') : (isDark ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.85)')),
        border: `0.5px solid ${accent
          ? (hov ? `${accent_color}45` : `${accent_color}28`)
          : (hov ? (isDark ? 'rgba(255,255,255,.1)' : 'rgba(124,58,237,.18)') : (isDark ? 'rgba(255,255,255,.065)' : 'rgba(124,58,237,.12)'))}`,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6,
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hov
          ? (accent ? `0 12px 36px ${accent_color}1C` : (isDark ? '0 10px 28px rgba(0,0,0,.28)' : '0 10px 28px rgba(124,58,237,.1)'))
          : 'none',
        transition: 'all .28s cubic-bezier(.16,1,.3,1)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {Icon && (
        <div style={{ width: 30, height: 30, borderRadius: 9, background: accent ? `${accent_color}18` : (isDark ? 'rgba(255,255,255,.06)' : 'rgba(124,58,237,.07)'), display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
          <Icon size={14} color={accent ? accent_color : (isDark ? 'rgba(255,255,255,.5)' : '#7C3AED')} />
        </div>
      )}
      <p style={{ fontSize: 13, fontWeight: 500, color: accent ? (isDark ? 'rgba(196,181,253,.95)' : '#6D28D9') : (isDark ? 'rgba(255,255,255,.78)' : '#1A1527'), margin: 0, fontFamily: "'DM Sans',sans-serif", letterSpacing: -.1, lineHeight: 1.3 }}>{title}</p>
      <p style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,.3)' : '#9490A6', margin: 0, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.4 }}>{subtitle}</p>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════
// BOOT SEQUENCE
// ═══════════════════════════════════════════════════════════════
function Boot({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0)
  const [pct, setPct]     = useState(0)
  const [lines, setLines] = useState<string[]>([])
  const L = ['SISTEMAS NEURAIS INICIALIZADOS','MEMÓRIA EMOCIONAL CARREGADA','MOTOR DE INTROSPECÇÃO ATIVO','SÍNTESE DE VOZ CALIBRADA','CLARAMENTE v2.0 // PRONTO']
  useEffect(() => {
    audio.init()
    const t1 = setTimeout(() => { setPhase(1); audio.playBoot() }, 200)
    const t2 = setTimeout(() => setPhase(2), 700)
    L.forEach((l, i) => setTimeout(() => setLines(p => [...p, l]), 900 + i * 280))
    let p = 0; const iv = setInterval(() => { p += 2; setPct(p); if (p >= 100) clearInterval(iv) }, 30)
    const t3 = setTimeout(() => setPhase(3), 2800)
    const t4 = setTimeout(onComplete, 3400)
    return () => { [t1,t2,t3,t4].forEach(clearTimeout); clearInterval(iv) }
  }, [])
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: '#050408', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: phase === 3 ? 0 : 1, transition: 'opacity .8s ease', fontFamily: 'monospace' }}>
      {/* Radial glow */}
      <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,.1) 0%, transparent 62%)', pointerEvents: 'none' }} />
      {/* Scan line */}
      <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(124,58,237,.5),transparent)', animation: 'scan 2.2s ease-in-out infinite', pointerEvents: 'none' }} />
      {/* Orb */}
      <div style={{ marginBottom: 44, opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? 'scale(1)' : 'scale(.2)', transition: 'all .9s cubic-bezier(.34,1.56,.64,1)' }}>
        <AIOrb state="idle" size={92} />
      </div>
      {/* Title */}
      <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 'clamp(26px,5vw,38px)', color: 'rgba(255,255,255,.92)', letterSpacing: 13, textTransform: 'uppercase', marginBottom: 8, opacity: phase >= 1 ? 1 : 0, transition: 'opacity .6s .3s', textShadow: '0 0 70px rgba(124,58,237,.55)' }}>
        Claramente
      </h1>
      <p style={{ fontSize: 10, color: 'rgba(124,58,237,.5)', letterSpacing: 5, marginBottom: 44, opacity: phase >= 1 ? .9 : 0, transition: 'opacity .6s .5s', textTransform: 'uppercase' }}>ia terapêutica</p>
      {/* Boot lines */}
      <div style={{ width: 280, maxWidth: '88vw', marginBottom: 28 }}>
        {lines.map((ln, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, animation: 'bIn .3s ease forwards' }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', flexShrink: 0, background: i === lines.length - 1 ? '#7C3AED' : '#22C55E', animation: i === lines.length - 1 ? 'blink 1s infinite' : 'none' }} />
            <span style={{ fontSize: 10, color: i === lines.length - 1 ? 'rgba(167,139,250,.88)' : 'rgba(34,197,94,.55)', letterSpacing: .5 }}>{ln}</span>
          </div>
        ))}
      </div>
      {/* Progress */}
      <div style={{ width: 280, maxWidth: '88vw' }}>
        <div style={{ height: '1.5px', background: 'rgba(124,58,237,.08)', borderRadius: 1, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg,#4C1D95,#A78BFA)', width: `${pct}%`, transition: 'width .04s linear', boxShadow: '0 0 12px rgba(124,58,237,.75)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontSize: 9, color: 'rgba(124,58,237,.22)', letterSpacing: 1.2 }}>INICIALIZANDO</span>
          <span style={{ fontSize: 9, color: 'rgba(124,58,237,.32)' }}>{pct}%</span>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════
function groupConvs(convs: ConversationItem[]) {
  const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
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
    if (d >= today) g[0].items.push(c)
    else if (d >= yest) g[1].items.push(c)
    else if (d >= week) g[2].items.push(c)
    else g[3].items.push(c)
  })
  return g.filter(x => x.items.length > 0)
}

// ═══════════════════════════════════════════════════════════════
// HOME — main component
// ═══════════════════════════════════════════════════════════════
export default function Home() {
  const navigate  = useNavigate()
  const { profile, signOut }  = useAuth()
  const { t, isDark, toggle } = useTheme()
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
  const [uptime, setUptime]             = useState('00:00:00')
  const [greetDone, setGreetDone]       = useState(false)
  const [hudOpen, setHudOpen]           = useState(false)
  const [micOk]                         = useState(speechEngine.isRecordingSupported)
  const [booted, setBooted]             = useState(() => sessionStorage.getItem('cl-booted') === '1')
  const [emotion, setEmotion]           = useState(emotionEngine.get())

  const t0      = useRef(Date.now())
  const bottom  = useRef<HTMLDivElement>(null)
  const ta      = useRef<HTMLTextAreaElement>(null)
  const prevLen = useRef(0)
  const spkIv   = useRef<ReturnType<typeof setInterval> | null>(null)

  const { suggestion, dismiss } = useProactive(messages.length, isTyping)
  const name     = profile?.name?.split(' ')[0] || 'você'
  const grouped  = groupConvs(conversations)
  const mc       = moodColor(emotion.mood)
  const orbState: OrbState = recording ? 'listening' : isTyping ? 'thinking' : speaking ? 'speaking' : 'idle'

  // — uptime
  useEffect(() => {
    const iv = setInterval(() => {
      const s = Math.floor((Date.now() - t0.current) / 1000)
      setUptime(`${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s%3600/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`)
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])
  useEffect(() => emotionEngine.subscribe(setEmotion), [])

  // — welcome speech
  useEffect(() => {
    if (!booted) return
    const t = setTimeout(() => speechEngine.speakWelcome(name), 800)
    return () => clearTimeout(t)
  }, [booted, name])

  // — speak AI replies
  useEffect(() => {
    if (messages.length > prevLen.current) {
      const last = messages.slice(prevLen.current).pop()
      if (last?.role === 'assistant') {
        audio.playAIResponse()
        const s = (last as unknown as { sentiment?: string }).sentiment
        if (s) emotionEngine.updateFromSentiment(s, [])
        setTimeout(() => speechEngine.speak(last.content, { rate: 1.02, pitch: 0.92 }), 280)
      }
    }
    prevLen.current = messages.length
  }, [messages])

  useEffect(() => { if (isTyping) { audio.playAIStart(); speechEngine.stop() } }, [isTyping])
  useEffect(() => {
    spkIv.current = setInterval(() => setSpeaking(speechEngine.isSpeaking()), 200)
    return () => { if (spkIv.current) clearInterval(spkIv.current) }
  }, [])

  // — handlers
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

  function resize() {
    if (!ta.current) return
    ta.current.style.height = 'auto'
    ta.current.style.height = Math.min(ta.current.scrollHeight, 112) + 'px'
  }

  async function send() {
    if (!input.trim() || isTyping) return
    const txt = input.trim(); setInput(''); setRecText('')
    if (recording) { speechEngine.stopRecording(); setRecording(false) }
    if (ta.current) ta.current.style.height = 'auto'
    audio.init(); audio.playMessageSent(); speechEngine.speakAck(name)
    await sendMessage(txt)
  }

  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }
  const go = (id: string) => async () => { audio.playClick(); prevLen.current = 0; await loadConversation(id); setSidebarOpen(false) }
  const newChat = () => { audio.playClick(); prevLen.current = 0; resetChat(); setSidebarOpen(false) }
  const journal = async () => { audio.init(); audio.playJournaling(); speechEngine.speakJournalingStart(); prevLen.current = 0; await startJournaling(); setSidebarOpen(false) }
  const boot = () => { sessionStorage.setItem('cl-booted', '1'); setBooted(true) }

  // — tokens
  const BG   = isDark ? '#05040A' : '#F3F1FC'
  const SBG  = isDark ? 'rgba(7,5,14,.94)' : 'rgba(255,255,255,.95)'
  const SBR  = isDark ? 'rgba(255,255,255,.05)' : 'rgba(124,58,237,.1)'
  const GLS  = isDark ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.88)'
  const GLSB = isDark ? 'rgba(255,255,255,.07)' : 'rgba(124,58,237,.13)'
  const TX   = isDark ? 'rgba(255,255,255,.88)' : '#1A1527'
  const TXS  = isDark ? 'rgba(255,255,255,.48)' : '#5B5175'
  const TXM  = isDark ? 'rgba(255,255,255,.26)' : '#9490A6'
  const VBG  = isDark ? 'rgba(124,58,237,.12)' : 'rgba(124,58,237,.08)'
  const VBH  = isDark ? 'rgba(124,58,237,.22)' : 'rgba(124,58,237,.15)'
  const V    = '#8B5CF6'
  const VD   = '#7C3AED'
  const UB   = isDark ? `${mc}1E` : `${mc}10`
  const BB   = isDark ? 'rgba(255,255,255,.04)' : '#FFFFFF'

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-text-size-adjust: 100%; }
    body { -webkit-font-smoothing: antialiased; }

    @keyframes orbB { 0%,100%{ transform:scale(1); opacity:.8 } 50%{ transform:scale(1.07); opacity:1 } }
    @keyframes rA   { from{ transform:rotate(0) }   to{ transform:rotate(360deg) } }
    @keyframes rB   { from{ transform:rotate(360deg) } to{ transform:rotate(0) } }
    @keyframes wv   { from{ transform:scaleY(.1) } to{ transform:scaleY(1) } }
    @keyframes bIn  { from{ opacity:0; transform:translateX(-8px) } to{ opacity:1; transform:translateX(0) } }
    @keyframes scan { 0%{top:-2px;opacity:0} 5%{opacity:.4} 95%{opacity:.4} 100%{top:100%;opacity:0} }
    @keyframes fU   { from{ opacity:0; transform:translateY(14px) } to{ opacity:1; transform:translateY(0) } }
    @keyframes mIn  { from{ opacity:0; transform:translateY(8px) scale(.98) } to{ opacity:1; transform:translateY(0) scale(1) } }
    @keyframes blink{ 0%,100%{ opacity:1 } 50%{ opacity:0 } }
    @keyframes p    { 0%,100%{ opacity:.4; transform:scale(1) } 50%{ opacity:1; transform:scale(1.18) } }
    @keyframes rPls { 0%,100%{ box-shadow:0 0 0 0 rgba(239,68,68,.35) } 50%{ box-shadow:0 0 0 10px rgba(239,68,68,0) } }
    @keyframes flOr { 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-12px) } }
    @keyframes sIn  { from{ opacity:0; transform:translateX(-22px) } to{ opacity:1; transform:translateX(0) } }

    .sb { display:none!important; height:100%; }
    .mh { display:flex; }
    @media(min-width:768px){ .sb{ display:flex!important } .mh{ display:none!important } }
    ::-webkit-scrollbar { width:2px; }
    ::-webkit-scrollbar-thumb { background:rgba(124,58,237,.16); border-radius:2px; }
    textarea { -webkit-appearance:none; }
    textarea::placeholder { color:${isDark?'rgba(255,255,255,.22)':'#AEABBE'}!important; }
  `

  // ─── SIDEBAR ─────────────────────────────────────────────────
  function Sidebar() {
    return (
      <aside style={{ width: 264, flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column', background: SBG, backdropFilter: 'blur(44px)', WebkitBackdropFilter: 'blur(44px)', borderRight: `0.5px solid ${SBR}`, position: 'relative', overflow: 'hidden' }}>
        {/* Corner ambiance */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${moodGlow(emotion.mood)} 0%, transparent 65%)`, pointerEvents: 'none', animation: 'orbB 7s ease-in-out infinite' }} />

        {/* Brand */}
        <div style={{ height: 60, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `0.5px solid ${SBR}`, position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -7, borderRadius: '50%', background: `radial-gradient(circle, ${moodGlow(emotion.mood)} 0%, transparent 70%)`, animation: 'orbB 4s ease-in-out infinite', pointerEvents: 'none' }} />
            <Crystal size={23} color={isDark ? 'rgba(255,255,255,.7)' : VD} dim={isDark ? 'rgba(255,255,255,.07)' : 'rgba(124,58,237,.09)'} mid={isDark ? 'rgba(255,255,255,.1)' : 'rgba(124,58,237,.17)'} line={isDark ? 'rgba(255,255,255,.26)' : 'rgba(124,58,237,.42)'} />
          </div>
          <div>
            <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: 15, color: TX, margin: 0, letterSpacing: -.4, lineHeight: 1.2 }}>Claramente</p>
            <p style={{ fontSize: 9, color: mc, margin: 0, letterSpacing: 2, fontFamily: 'monospace', textTransform: 'uppercase', opacity: .62 }}>sistema ativo</p>
          </div>
          {speaking && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 1.5, alignItems: 'center', height: 10 }}>
              {[.5,1,.7,.9,.6].map((h,i) => <div key={i} style={{ width: 1.5, borderRadius: 1, background: mc, height: `${h*9}px`, animation: `wv ${.35+h*.3}s ${i*.06}s infinite ease-in-out alternate` }} />)}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div style={{ padding: '12px 12px 8px', display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
          {[
            { label: 'Nova conversa',     icon: <Plus size={13} color={V}/>,      fn: newChat,  hi: false },
            { label: 'Journaling guiado', icon: <Sparkle size={12} color={isDark?'rgba(196,181,253,.8)':VD}/>, fn: journal, hi: true  },
          ].map(b => (
            <button key={b.label} onClick={b.fn} style={{ width: '100%', height: 38, padding: '0 13px', background: b.hi ? (isDark?'rgba(167,139,250,.07)':'rgba(124,58,237,.06)') : VBG, border: `0.5px solid ${b.hi?(isDark?'rgba(167,139,250,.15)':'rgba(124,58,237,.13)'):(isDark?'rgba(124,58,237,.18)':'rgba(124,58,237,.15)')}`, borderRadius: 10, color: b.hi?(isDark?'rgba(196,181,253,.88)':VD):V, fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all .22s cubic-bezier(.16,1,.3,1)', WebkitTapHighlightColor: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(3px)'; e.currentTarget.style.filter = 'brightness(1.14)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.filter = 'brightness(1)' }}>
              {b.icon}{b.label}
            </button>
          ))}
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2px 8px 6px' }}>
          {grouped.length === 0 && (
            <p style={{ fontSize: 12, color: TXM, textAlign: 'center', padding: '32px 16px', lineHeight: 1.8, fontFamily: "'DM Sans',sans-serif" }}>
              Nenhuma sessão ainda.<br/>Inicie uma conversa.
            </p>
          )}
          {grouped.map(g => (
            <div key={g.label}>
              <p style={{ fontSize: 9, color: TXM, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', padding: '12px 10px 5px', fontFamily: "'DM Sans',sans-serif" }}>{g.label}</p>
              {g.items.map(c => (
                <button key={c.id} onClick={go(c.id)} style={{ width: '100%', textAlign: 'left', padding: '9px 11px', borderRadius: 9, border: 'none', cursor: 'pointer', marginBottom: 1, background: conversationId===c.id ? VBG : 'transparent', borderLeft: `2px solid ${conversationId===c.id ? V : 'transparent'}`, transition: 'all .18s cubic-bezier(.16,1,.3,1)', display: 'block', minHeight: 44, WebkitTapHighlightColor: 'transparent' }}
                  onMouseEnter={e => { if (conversationId!==c.id) e.currentTarget.style.background = isDark?'rgba(255,255,255,.03)':'rgba(124,58,237,.04)' }}
                  onMouseLeave={e => { if (conversationId!==c.id) e.currentTarget.style.background = 'transparent' }}>
                  <p style={{ fontSize: 12, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans',sans-serif", fontWeight: conversationId===c.id?500:400, color: conversationId===c.id?TX:TXS }}>{c.title}</p>
                  <p style={{ fontSize: 11, color: TXM, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans',sans-serif" }}>{c.preview}</p>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Emotional HUD */}
        <div style={{ padding: '6px 10px', borderTop: `0.5px solid ${SBR}` }}>
          <button onClick={() => setHudOpen(p => !p)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 9px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: TXM, fontSize: 9, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', WebkitTapHighlightColor: 'transparent' }}>
            <span>Diagnóstico emocional</span>
            <span style={{ fontSize: 9 }}>{hudOpen ? '▲' : '▼'}</span>
          </button>
          {hudOpen && <div style={{ marginTop: 6 }}><JarvisHUD visible /></div>}
        </div>

        {/* Status line */}
        <div style={{ height: 34, padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `0.5px solid ${SBR}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E', animation: 'p 2.5s infinite' }} />
            <span style={{ fontSize: 9, color: isDark?'rgba(34,197,94,.65)':'#16A34A', letterSpacing: 1.2, fontFamily: 'monospace', textTransform: 'uppercase' }}>online</span>
          </div>
          <span style={{ fontSize: 9, color: TXM, fontFamily: 'monospace' }}>UP {uptime}</span>
        </div>

        {/* User footer */}
        <div style={{ height: 56, padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `0.5px solid ${SBR}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${mc}1A`, border: `1px solid ${mc}2E`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: mc, flexShrink: 0 }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 12, color: TXS, fontFamily: "'DM Sans',sans-serif" }}>{name}</span>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {([
              [isDark?Sun:Moon, toggle,                       'Tema'  ],
              [muted?VolumeOff:Volume, handleMute,            'Som'   ],
              [BarChart, ()=>navigate('/relatorios'),          'Relat.'],
              [Person,   ()=>navigate('/perfil'),             'Perfil'],
              [LogOut,   signOut,                             'Sair'  ],
            ] as [React.ElementType, ()=>void, string][]).map(([I,fn,tt]) => (
              <button key={tt} onClick={fn} title={tt} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .18s', WebkitTapHighlightColor: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = VBG)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <I size={14} color={tt==='Som'&&muted?'#EF4444':TXM} />
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
      <AmbientCanvas isDark={isDark} />

      {/* Layered ambient lights */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: isDark
        ? `radial-gradient(ellipse 75% 55% at 15% 0%, rgba(109,40,217,.11) 0%, transparent 58%),
           radial-gradient(ellipse 55% 45% at 85% 100%, rgba(67,56,202,.07) 0%, transparent 52%),
           radial-gradient(ellipse 45% 40% at 50% 40%, rgba(124,58,237,.04) 0%, transparent 65%)`
        : `radial-gradient(ellipse 75% 55% at 15% 0%, rgba(124,58,237,.06) 0%, transparent 58%),
           radial-gradient(ellipse 55% 45% at 85% 100%, rgba(99,102,241,.04) 0%, transparent 52%)`
      }} />

      {!booted && <Boot onComplete={boot} />}

      <div style={{ height: '100dvh', display: 'flex', background: BG, fontFamily: "'DM Sans','Plus Jakarta Sans',sans-serif", position: 'relative', overflow: 'hidden', zIndex: 1, opacity: booted ? 1 : 0, transition: 'opacity .6s ease' }}>
        <style>{CSS}</style>

        {/* Sidebar desktop */}
        <div className="sb"><Sidebar /></div>

        {/* Sidebar mobile overlay */}
        {sidebarOpen && (
          <>
            <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 40, backdropFilter: 'blur(8px)' }} />
            <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, animation: 'sIn .25s ease', maxWidth: '85vw' }}><Sidebar /></div>
          </>
        )}

        {/* ── Main area ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>

          {/* AI processing scan line */}
          {isTyping && <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: `linear-gradient(90deg,transparent,${mc}42,transparent)`, animation: 'scan 1.9s ease-in-out infinite', zIndex: 5, pointerEvents: 'none' }} />}

          {/* Mobile header */}
          <header className="mh" style={{ background: isDark?'rgba(5,4,10,.9)':'rgba(255,255,255,.92)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', borderBottom: `0.5px solid ${SBR}`, height: 52, padding: '0 14px', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, zIndex: 10, position: 'relative' }}>
            <button onClick={() => setSidebarOpen(true)} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 9, WebkitTapHighlightColor: 'transparent' }}>
              <Menu size={18} color={V} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <AIOrb state={orbState} size={22} color={mc} />
              <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: 16, color: TX }}>{isJournalingMode ? 'Journaling' : 'Claramente'}</span>
            </div>
            <button onClick={handleMute} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 9, WebkitTapHighlightColor: 'transparent' }}>
              {muted ? <VolumeOff size={16} color="#EF4444" /> : <Volume size={16} color={TXM} />}
            </button>
          </header>

          {/* Journaling banner */}
          {isJournalingMode && (
            <div style={{ padding: '8px 20px', background: isDark?'rgba(167,139,250,.06)':'rgba(124,58,237,.05)', backdropFilter: 'blur(12px)', borderBottom: `0.5px solid ${isDark?'rgba(167,139,250,.1)':'rgba(124,58,237,.1)'}`, display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: V, zIndex: 10, position: 'relative' }}>
              <Sparkle size={13} color={V} />
              <span style={{ fontWeight: 500 }}>Modo Journaling Guiado</span>
              <span style={{ color: TXM, fontSize: 12 }}>— sessão reflexiva estruturada</span>
            </div>
          )}

          {/* Crisis banner */}
          {isCrisis && (
            <div style={{ margin: '8px 16px 0', padding: '10px 14px', borderRadius: 12, background: isDark?'rgba(239,68,68,.07)':'#FFF7ED', border: `1px solid ${isDark?'rgba(239,68,68,.18)':'#FED7AA'}`, fontSize: 13, color: isDark?'rgba(252,165,165,.88)':'#92400E', lineHeight: 1.6, zIndex: 10, position: 'relative' }}>
              CVV: <strong>188</strong> · Ligação gratuita, 24h · cvv.org.br
            </div>
          )}

          {/* ── Messages ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px 12px', position: 'relative', zIndex: 1 }}>
            <div style={{ maxWidth: 660, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* ══ WELCOME STATE ══ */}
              {messages.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 8px 16px', animation: 'fU .7s ease' }}>

                  {/* Hero orb */}
                  <div style={{ marginBottom: 30, animation: 'flOr 7s ease-in-out infinite' }}>
                    <AIOrb state={orbState} size={152} color={mc} />
                  </div>

                  {/* Greeting */}
                  <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 'clamp(22px,4.5vw,30px)', color: TX, marginBottom: 5, fontWeight: 400, letterSpacing: -.7, textAlign: 'center', lineHeight: 1.2 }}>
                    {booted && !greetDone
                      ? <Typewriter text={`Olá, ${name}`} speed={52} onDone={() => setGreetDone(true)} />
                      : `Olá, ${name}`}
                  </h2>

                  {/* Smart summary */}
                  {loadingSmartSummary && (
                    <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'center' }}>
                      <Waveform color={`${mc}70`} bars={8} />
                    </div>
                  )}

                  {smartSummary && !loadingSmartSummary && (
                    <div style={{ background: GLS, backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)', border: `0.5px solid ${GLSB}`, borderRadius: 18, padding: '13px 18px', marginBottom: 20, width: '100%', maxWidth: 400, position: 'relative', overflow: 'hidden', animation: 'fU .5s ease', boxShadow: isDark?'0 4px 26px rgba(0,0,0,.22)':'0 4px 26px rgba(124,58,237,.08)' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${mc}26,transparent)` }} />
                      <p style={{ fontSize: 13, color: TXS, lineHeight: 1.72, margin: 0, fontStyle: 'italic' }}>{smartSummary}</p>
                    </div>
                  )}

                  {!smartSummary && !loadingSmartSummary && greetDone && (
                    <p style={{ fontSize: 13, color: TXS, lineHeight: 1.8, maxWidth: 255, textAlign: 'center', marginBottom: 4, animation: 'fU .5s ease', fontWeight: 400 }}>
                      Este é seu espaço sagrado.<br />Como você está se sentindo hoje?
                    </p>
                  )}

                  {/* ── Action cards 2×2 ── */}
                  {greetDone && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 20, width: '100%', maxWidth: 380, animation: 'fU .6s ease .15s both' }}>
                      <ActionCard title="Journaling guiado" subtitle="Sessão reflexiva profunda" Icon={Sparkle} accent accent_color={mc} isDark={isDark} onClick={() => { audio.init(); journal() }} />
                      <ActionCard title="Estou ansioso" subtitle="Quero falar sobre isso" accent_color={mc} isDark={isDark} onClick={() => { audio.init(); sendMessage('Estou me sentindo ansioso ultimamente.') }} />
                      <ActionCard title="Quero refletir" subtitle="Momento de introspecção" accent_color={mc} isDark={isDark} onClick={() => { audio.init(); sendMessage('Quero fazer uma reflexão sobre minha vida.') }} />
                      <ActionCard title="Me sinto bem" subtitle="Compartilhar gratidão" accent_color={mc} isDark={isDark} onClick={() => { audio.init(); sendMessage('Estou me sentindo bem hoje!') }} />
                    </div>
                  )}
                </div>
              )}

              {/* Proactive suggestion */}
              {suggestion && (
                <ProactiveCard message={suggestion.message} action={suggestion.action} onAccept={() => { dismiss(); sendMessage(suggestion.prompt) }} onDismiss={dismiss} delay={600} />
              )}

              {/* ── Chat messages ── */}
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', gap: 9, alignItems: 'flex-end', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', animation: 'mIn .3s cubic-bezier(.16,1,.3,1)' }}>
                  {msg.role === 'assistant' && (
                    <div style={{ flexShrink: 0, marginBottom: 3 }}>
                      <AIOrb state={isTyping ? 'thinking' : 'idle'} size={28} color={mc} />
                    </div>
                  )}
                  <div style={{
                    maxWidth: 'min(74%,500px)', padding: '12px 16px',
                    fontSize: 14.5, lineHeight: 1.72, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: msg.role === 'user' ? UB : BB,
                    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                    color: msg.role === 'user' ? (isDark ? 'rgba(233,228,255,.94)' : TX) : TX,
                    border: msg.role === 'user' ? `0.5px solid ${mc}26` : `0.5px solid ${GLSB}`,
                    boxShadow: msg.role === 'user' ? `0 3px 16px ${mc}12` : isDark?'0 2px 16px rgba(0,0,0,.2)':'0 2px 16px rgba(124,58,237,.06)',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {msg.role === 'assistant' && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${mc}16,transparent)` }} />
                    )}
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div style={{ display: 'flex', gap: 9, alignItems: 'flex-end', animation: 'fU .3s ease' }}>
                  <AIOrb state="thinking" size={28} color={mc} />
                  <div style={{ background: BB, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `0.5px solid ${GLSB}`, borderRadius: '18px 18px 18px 4px', padding: '12px 16px', position: 'relative', overflow: 'hidden', boxShadow: isDark?'0 2px 16px rgba(0,0,0,.2)':'0 2px 16px rgba(124,58,237,.06)' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${mc}16,transparent)` }} />
                    <Waveform color={`${mc}99`} bars={9} />
                  </div>
                </div>
              )}

              <div ref={bottom} />
            </div>
          </div>

          {/* ══ COMMAND BAR ══ */}
          <div style={{ padding: '10px 16px', paddingBottom: `max(10px,env(safe-area-inset-bottom,10px))`, flexShrink: 0, position: 'relative', zIndex: 10 }}>
            <div style={{ position: 'absolute', top: 0, left: '8%', right: '8%', height: 1, background: `linear-gradient(90deg,transparent,${mc}1C,transparent)` }} />

            {(recording || muted) && (
              <p style={{ textAlign: 'center', fontSize: 10, color: recording?'#EF4444':TXM, letterSpacing: .8, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 7 }}>
                {recording ? '● GRAVANDO — TOQUE PARA PARAR' : 'SOM DESATIVADO'}
              </p>
            )}

            <div style={{ maxWidth: 660, margin: '0 auto' }}>
              <div
                style={{
                  display: 'flex', gap: 8, alignItems: 'flex-end',
                  background: isDark ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.92)',
                  backdropFilter: 'blur(36px)', WebkitBackdropFilter: 'blur(36px)',
                  borderRadius: 28, padding: '7px',
                  border: `1.5px solid ${recording?'rgba(239,68,68,.38)':isDark?'rgba(255,255,255,.09)':'rgba(124,58,237,.18)'}`,
                  boxShadow: isDark
                    ? '0 8px 44px rgba(0,0,0,.26), inset 0 1px 0 rgba(255,255,255,.04)'
                    : '0 4px 28px rgba(124,58,237,.1), inset 0 1px 0 rgba(255,255,255,.9)',
                  transition: 'border-color .2s, box-shadow .22s',
                }}
                onFocusCapture={e => {
                  e.currentTarget.style.borderColor = mc
                  e.currentTarget.style.boxShadow = isDark
                    ? `0 8px 52px rgba(0,0,0,.3), 0 0 0 3px ${mc}0C`
                    : `0 4px 32px rgba(124,58,237,.15), 0 0 0 3px ${mc}10`
                }}
                onBlurCapture={e => {
                  e.currentTarget.style.borderColor = recording?'rgba(239,68,68,.38)':isDark?'rgba(255,255,255,.09)':'rgba(124,58,237,.18)'
                  e.currentTarget.style.boxShadow = isDark?'0 8px 44px rgba(0,0,0,.26)':'0 4px 28px rgba(124,58,237,.1)'
                }}
              >
                {/* Mic */}
                {micOk && (
                  <button onClick={handleMic} title={recording?'Parar':'Gravar'} style={{ width: 44, height: 44, borderRadius: 21, border: 'none', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: recording?'rgba(239,68,68,.12)':VBG, transition: 'all .22s cubic-bezier(.16,1,.3,1)', animation: recording?'rPls 1.6s infinite':'none', WebkitTapHighlightColor: 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                    {recording ? <Stop size={13} color="#EF4444" /> : <Mic size={16} color={V} />}
                  </button>
                )}

                {/* Input */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {recording && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px 0' }}>
                      <RecordBars />
                      <span style={{ fontSize: 13, color: '#EF4444', fontFamily: "'DM Sans',sans-serif" }}>{recText || 'Ouvindo...'}</span>
                    </div>
                  )}
                  {!recording && (
                    <textarea
                      ref={ta} value={input}
                      onChange={e => { setInput(e.target.value); resize() }}
                      onKeyDown={onKey}
                      placeholder={isJournalingMode ? 'Escreva sua reflexão...' : 'Como você está se sentindo?'}
                      rows={1}
                      style={{ width: '100%', background: 'none', border: 'none', outline: 'none', fontSize: 15, lineHeight: 1.6, resize: 'none', fontFamily: "'DM Sans',sans-serif", color: TX, maxHeight: 112, padding: '9px 4px', display: 'block', WebkitAppearance: 'none' }}
                    />
                  )}
                </div>

                {/* Send */}
                <button onClick={send} disabled={isTyping || (!input.trim() && !recText.trim())} style={{
                  width: 44, height: 44, borderRadius: 21, border: 'none', flexShrink: 0,
                  cursor: isTyping || (!input.trim() && !recText.trim()) ? 'not-allowed' : 'pointer',
                  background: isTyping || (!input.trim() && !recText.trim()) ? VBG : VD,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .22s cubic-bezier(.16,1,.3,1)',
                  boxShadow: isTyping || (!input.trim() && !recText.trim()) ? 'none' : `0 4px 18px ${mc}32`,
                  WebkitTapHighlightColor: 'transparent',
                }}
                  onMouseEnter={e => { if (!isTyping && input.trim()) { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.filter = 'brightness(1.12)' } }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)' }}>
                  <Send size={16} color={isTyping || (!input.trim() && !recText.trim()) ? V : 'white'} />
                </button>
              </div>

              <p style={{ textAlign: 'center', fontSize: 10, color: TXM, marginTop: 7, letterSpacing: .3, fontFamily: "'DM Sans',sans-serif" }}>
                {isJournalingMode ? 'Sessão de journaling guiado ativa' : !micOk ? 'Gravação de voz não suportada neste navegador' : 'Não substitui acompanhamento psicológico · CVV: 188'}
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}