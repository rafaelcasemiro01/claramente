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

// ─── Ambient Background ────────────────────────────────────────
function AmbientBackground({ isDark, mood }: { isDark: boolean; mood: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    let W = c.width = window.innerWidth
    let H = c.height = window.innerHeight
    const pts = Array.from({ length: 24 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15,
      r: Math.random() * 1.5 + 0.5, p: Math.random() * Math.PI * 2,
    }))
    let frame: number
    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.p += 0.012
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
      })
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y
          const d = Math.sqrt(dx*dx + dy*dy)
          if (d < 100) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y)
            ctx.strokeStyle = `rgba(124,58,237,${(1-d/100)*(isDark?0.045:0.025)})`
            ctx.lineWidth = 0.5; ctx.stroke()
          }
        }
      }
      pts.forEach(p => {
        const pulse = Math.sin(p.p)*0.5+0.5
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r*(1+pulse*0.3), 0, Math.PI*2)
        ctx.fillStyle = `rgba(124,58,237,${isDark?0.05+pulse*0.03:0.03+pulse*0.02})`
        ctx.fill()
      })
      frame = requestAnimationFrame(draw)
    }
    draw()
    const onResize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', onResize) }
  }, [isDark])
  return <canvas ref={ref} style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', opacity: isDark ? 0.8 : 0.5 }} />
}

// ─── AI Orb ────────────────────────────────────────────────────
type OrbState = 'idle'|'listening'|'thinking'|'speaking'
function AIOrb({ state='idle', size=120, color='#7C3AED' }: { state?: OrbState; size?: number; color?: string }) {
  const configs: Record<OrbState, { glow: string; ring: string; speed: string }> = {
    idle:      { glow: `${color}18`, ring: `${color}16`, speed: '6s' },
    listening: { glow: 'rgba(99,102,241,0.22)', ring: 'rgba(99,102,241,0.18)', speed: '3s' },
    thinking:  { glow: `${color}28`, ring: `${color}22`, speed: '2s' },
    speaking:  { glow: 'rgba(167,139,250,0.22)', ring: 'rgba(167,139,250,0.16)', speed: '4s' },
  }
  const cfg = configs[state]
  return (
    <div style={{ position:'relative', width:size, height:size, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      {/* Atmospheric glow */}
      <div style={{ position:'absolute', width:size*3, height:size*3, borderRadius:'50%', background:`radial-gradient(circle, ${cfg.glow} 0%, transparent 60%)`, animation:`orbBreath ${cfg.speed} ease-in-out infinite`, pointerEvents:'none' }} />
      {/* Outer ring */}
      <div style={{ position:'absolute', width:size*1.85, height:size*1.85, borderRadius:'50%', border:`0.5px dashed ${cfg.ring}`, animation:'jR1 28s linear infinite', pointerEvents:'none' }} />
      {/* Mid ring */}
      <div style={{ position:'absolute', width:size*1.45, height:size*1.45, borderRadius:'50%', border:`0.5px solid ${cfg.ring}`, animation:'jR2 18s linear infinite', pointerEvents:'none' }} />
      {/* Inner glow ring */}
      <div style={{ position:'absolute', width:size*1.08, height:size*1.08, borderRadius:'50%', border:`1px solid ${cfg.ring}`, boxShadow:`0 0 20px ${cfg.glow}, inset 0 0 20px ${cfg.glow}`, animation:`orbBreath ${cfg.speed} ease-in-out infinite 0.8s`, pointerEvents:'none' }} />
      {/* Core */}
      <div style={{ width:size*0.7, height:size*0.7, borderRadius:'50%', background:`radial-gradient(circle at 35% 30%, rgba(255,255,255,0.12) 0%, transparent 55%), radial-gradient(circle, ${color}22 0%, ${color}08 55%, transparent 75%)`, border:`1px solid ${color}30`, backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', display:'flex', alignItems:'center', justifyContent:'center', animation:`orbBreath ${cfg.speed} ease-in-out infinite`, boxShadow:`0 0 40px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.08)` }}>
        <Crystal size={size*0.26} color="rgba(255,255,255,0.65)" dim="rgba(255,255,255,0.06)" mid="rgba(255,255,255,0.1)" line="rgba(255,255,255,0.28)" />
      </div>
      {/* Speaking bars */}
      {state === 'speaking' && (
        <div style={{ position:'absolute', bottom:-22, display:'flex', gap:2.5, alignItems:'flex-end', height:16 }}>
          {[0.4,0.8,1,0.7,0.5,0.9,0.6].map((h,i) => (
            <div key={i} style={{ width:2.5, borderRadius:2, background:color, opacity:0.6, animation:`wvBar ${0.35+h*0.4}s ${i*0.05}s infinite ease-in-out alternate`, height:`${h*14}px` }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Typewriter ────────────────────────────────────────────────
function TypewriterText({ text, speed=30, onComplete }: { text:string; speed?:number; onComplete?:()=>void }) {
  const [shown, setShown] = useState('')
  const [done, setDone]   = useState(false)
  useEffect(() => {
    setShown(''); setDone(false); let i=0
    const iv = setInterval(() => {
      if (i < text.length) setShown(text.slice(0,++i))
      else { clearInterval(iv); setDone(true); onComplete?.() }
    }, speed)
    return () => clearInterval(iv)
  }, [text])
  return <span>{shown}{!done && <span style={{ opacity:0.4, animation:'blink 1s infinite' }}>|</span>}</span>
}

// ─── Waveforms ─────────────────────────────────────────────────
function JarvisWave({ color='rgba(124,58,237,0.7)', n=10 }: { color?:string; n?:number }) {
  const H=[0.35,0.75,0.55,1,0.65,0.9,0.45,0.8,0.5,0.85,0.4,0.6]
  return (
    <div style={{ display:'flex', gap:2.5, alignItems:'center', height:20, padding:'0 2px' }}>
      {Array.from({length:n}).map((_,i) => (
        <div key={i} style={{ width:2.5, borderRadius:2, background:color, height:`${H[i%H.length]*14+3}px`, opacity:0.55+H[i%H.length]*0.4, animation:`wvBar ${0.45+H[i%H.length]*0.45}s ${i*0.055}s infinite ease-in-out alternate` }} />
      ))}
    </div>
  )
}

function RecordWave() {
  return (
    <div style={{ display:'flex', gap:2, alignItems:'center', height:18 }}>
      {Array.from({length:10}).map((_,i) => (
        <div key={i} style={{ width:2, borderRadius:2, background:'#EF4444', opacity:0.65, animation:`wvBar ${0.28+(i%5)*0.07}s ${i*0.04}s infinite ease-in-out alternate`, height:`${7+(i%4)*4}px` }} />
      ))}
    </div>
  )
}

// ─── Action Card ───────────────────────────────────────────────
function ActionCard({ title, desc, icon: Icon, accent=false, color, onClick }: {
  title: string; desc: string; icon?: React.ElementType;
  accent?: boolean; color: string; onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding:'16px', borderRadius:18, border:`0.5px solid ${accent?(hovered?`${color}55`:`${color}30`):(hovered?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.06)')}`,
        background: accent ? (hovered?`${color}1A`:`${color}0E`) : (hovered?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.03)'),
        backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
        cursor:'pointer', textAlign:'left', transition:'all 0.25s cubic-bezier(0.16,1,0.3,1)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? (accent?`0 8px 32px ${color}18`:'0 8px 24px rgba(0,0,0,0.2)') : 'none',
        WebkitTapHighlightColor:'transparent', display:'flex', flexDirection:'column', gap:5,
      }}
    >
      {Icon && (
        <div style={{ width:28, height:28, borderRadius:8, background: accent?`${color}18`:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:2 }}>
          <Icon size={14} color={accent ? color : 'rgba(255,255,255,0.5)'} />
        </div>
      )}
      <p style={{ fontSize:13, fontWeight:500, color: accent?`rgba(196,181,253,0.95)`:'rgba(255,255,255,0.75)', margin:0, fontFamily:"'DM Sans',sans-serif", letterSpacing:-0.1 }}>{title}</p>
      <p style={{ fontSize:11, color:'rgba(255,255,255,0.3)', margin:0, fontFamily:"'DM Sans',sans-serif", lineHeight:1.4 }}>{desc}</p>
    </button>
  )
}

// ─── Boot ──────────────────────────────────────────────────────
function BootSequence({ onComplete }: { onComplete: ()=>void }) {
  const [phase, setPhase] = useState(0)
  const [prog, setProg]   = useState(0)
  const [lines, setLines] = useState<string[]>([])
  const bootLines = ['SISTEMAS NEURAIS INICIALIZADOS','MEMÓRIA EMOCIONAL CARREGADA','MOTOR DE INTROSPECÇÃO ATIVO','SÍNTESE DE VOZ CALIBRADA','CLARAMENTE v2.0 // PRONTO']
  useEffect(() => {
    audio.init()
    const t1 = setTimeout(() => { setPhase(1); audio.playBoot() }, 200)
    const t2 = setTimeout(() => setPhase(2), 700)
    bootLines.forEach((ln,i) => setTimeout(() => setLines(p=>[...p,ln]), 900+i*270))
    let p=0; const iv=setInterval(()=>{ p+=2; setProg(p); if(p>=100) clearInterval(iv) },30)
    const t3 = setTimeout(()=>setPhase(3), 2700)
    const t4 = setTimeout(onComplete, 3300)
    return () => { [t1,t2,t3,t4].forEach(clearTimeout); clearInterval(iv) }
  }, [])
  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'#05040A', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', opacity:phase===3?0:1, transition:'opacity 0.7s ease', fontFamily:'monospace' }}>
      <div style={{ position:'absolute', top:'20%', left:'50%', transform:'translateX(-50%)', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 65%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', left:0, right:0, height:'1px', background:'linear-gradient(90deg,transparent,rgba(124,58,237,0.5),transparent)', animation:'scanLine 2.2s ease-in-out infinite', pointerEvents:'none' }} />
      <div style={{ marginBottom:40, opacity:phase>=1?1:0, transform:phase>=1?'scale(1)':'scale(0.3)', transition:'all 0.8s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <AIOrb state="idle" size={88} />
      </div>
      <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(24px,5vw,36px)', color:'rgba(255,255,255,0.9)', letterSpacing:14, textTransform:'uppercase', marginBottom:8, opacity:phase>=1?1:0, transition:'opacity 0.6s 0.3s', textShadow:'0 0 60px rgba(124,58,237,0.6)' }}>
        Claramente
      </h1>
      <p style={{ fontSize:10, color:'rgba(124,58,237,0.55)', letterSpacing:5, marginBottom:40, opacity:phase>=1?0.9:0, transition:'opacity 0.6s 0.5s', textTransform:'uppercase' }}>
        ia terapêutica
      </p>
      <div style={{ width:280, maxWidth:'88vw', marginBottom:24 }}>
        {lines.map((ln,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, animation:'bootLn 0.3s ease forwards' }}>
            <div style={{ width:4, height:4, borderRadius:'50%', flexShrink:0, background:i===lines.length-1?'#7C3AED':'#22C55E', animation:i===lines.length-1?'blink 1s infinite':'none' }} />
            <span style={{ fontSize:10, color:i===lines.length-1?'rgba(167,139,250,0.85)':'rgba(34,197,94,0.55)', letterSpacing:0.5 }}>{ln}</span>
          </div>
        ))}
      </div>
      <div style={{ width:280, maxWidth:'88vw' }}>
        <div style={{ height:'1.5px', background:'rgba(124,58,237,0.08)', borderRadius:1, overflow:'hidden' }}>
          <div style={{ height:'100%', background:'linear-gradient(90deg,#4C1D95,#A78BFA)', width:`${prog}%`, transition:'width 0.04s linear', boxShadow:'0 0 12px rgba(124,58,237,0.8)' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
          <span style={{ fontSize:9, color:'rgba(124,58,237,0.25)', letterSpacing:1.2 }}>INICIALIZANDO</span>
          <span style={{ fontSize:9, color:'rgba(124,58,237,0.35)' }}>{prog}%</span>
        </div>
      </div>
    </div>
  )
}

function groupConversations(convs: ConversationItem[]) {
  const now=new Date(), today=new Date(now.getFullYear(),now.getMonth(),now.getDate())
  const yest=new Date(today); yest.setDate(today.getDate()-1)
  const week=new Date(today); week.setDate(today.getDate()-7)
  const g=[
    {label:'Hoje',items:[] as ConversationItem[]},{label:'Ontem',items:[] as ConversationItem[]},
    {label:'Esta semana',items:[] as ConversationItem[]},{label:'Mais antigas',items:[] as ConversationItem[]},
  ]
  convs.forEach(c => {
    const d=new Date(c.started_at)
    if(d>=today) g[0].items.push(c)
    else if(d>=yest) g[1].items.push(c)
    else if(d>=week) g[2].items.push(c)
    else g[3].items.push(c)
  })
  return g.filter(x=>x.items.length>0)
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

  const [input, setInput]               = useState('')
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [isMuted, setIsMuted]           = useState(false)
  const [isRecording, setIsRecording]   = useState(false)
  const [recordingText, setRecordingText] = useState('')
  const [isSpeaking, setIsSpeaking]     = useState(false)
  const [uptime, setUptime]             = useState('00:00:00')
  const [welcomeDone, setWelcomeDone]   = useState(false)
  const [showHUD, setShowHUD]           = useState(false)
  const [micSupported]                  = useState(speechEngine.isRecordingSupported)
  const [bootDone, setBootDone]         = useState(()=>sessionStorage.getItem('claramente-booted')==='true')
  const [emotionalProfile, setEmotionalProfile] = useState(emotionEngine.get())

  const startRef    = useRef(Date.now())
  const bottomRef   = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const prevMsgLen  = useRef(0)
  const speakIv     = useRef<ReturnType<typeof setInterval>|null>(null)

  const { suggestion, dismiss } = useProactive(messages.length, isTyping)
  const firstName = profile?.name?.split(' ')[0] || 'você'
  const grouped   = groupConversations(conversations)
  const mood      = emotionalProfile.mood
  const moodCol   = moodColor(mood)
  const orbState: OrbState = isRecording?'listening':isTyping?'thinking':isSpeaking?'speaking':'idle'

  // ─── Effects ────────────────────────────────────────────────
  useEffect(()=>{
    const iv=setInterval(()=>{
      const s=Math.floor((Date.now()-startRef.current)/1000)
      setUptime(`${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`)
    },1000); return ()=>clearInterval(iv)
  },[])
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages,isTyping])
  useEffect(()=>emotionEngine.subscribe(setEmotionalProfile),[])

  useEffect(()=>{
    if(!bootDone) return
    const timer=setTimeout(()=>speechEngine.speakWelcome(firstName),800)
    return ()=>clearTimeout(timer)
  },[bootDone,firstName])

  useEffect(()=>{
    if(messages.length>prevMsgLen.current){
      const last=messages.slice(prevMsgLen.current).pop()
      if(last?.role==='assistant'){
        audio.playAIResponse()
        const s=(last as unknown as {sentiment?:string}).sentiment
        if(s) emotionEngine.updateFromSentiment(s,[])
        setTimeout(()=>speechEngine.speak(last.content,{rate:1.02,pitch:0.92}),300)
      }
    }
    prevMsgLen.current=messages.length
  },[messages])

  useEffect(()=>{ if(isTyping){ audio.playAIStart(); speechEngine.stop() } },[isTyping])
  useEffect(()=>{
    speakIv.current=setInterval(()=>setIsSpeaking(speechEngine.isSpeaking()),200)
    return ()=>{ if(speakIv.current) clearInterval(speakIv.current) }
  },[])

  // ─── Handlers ───────────────────────────────────────────────
  const handleMute = useCallback(()=>{
    const next=!isMuted; setIsMuted(next); speechEngine.setMuted(next)
    if(next) speechEngine.stop(); audio.playClick()
  },[isMuted])

  const handleMicToggle = useCallback(()=>{
    audio.init()
    if(isRecording){
      speechEngine.stopRecording(); setIsRecording(false)
      if(recordingText.trim()){ setInput(recordingText.trim()); setRecordingText('') }
    } else {
      const ok=speechEngine.startRecording(
        (text,isFinal)=>{ setRecordingText(text); if(isFinal){ setInput(p=>(p+' '+text).trim()); setRecordingText('') } },
        ()=>setIsRecording(false)
      )
      if(ok){ setIsRecording(true); audio.playClick() }
    }
  },[isRecording,recordingText])

  function autoResize(){
    const el=textareaRef.current; if(!el) return
    el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,112)+'px'
  }

  async function handleSend(){
    if(!input.trim()||isTyping) return
    const text=input.trim(); setInput(''); setRecordingText('')
    if(isRecording){ speechEngine.stopRecording(); setIsRecording(false) }
    if(textareaRef.current) textareaRef.current.style.height='auto'
    audio.init(); audio.playMessageSent(); speechEngine.speakAck(firstName)
    await sendMessage(text)
  }

  function handleKey(e:React.KeyboardEvent){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); handleSend() } }
  async function handleLoadConv(id:string){ audio.playClick(); prevMsgLen.current=0; await loadConversation(id); setSidebarOpen(false) }
  async function handleNewChat(){ audio.playClick(); prevMsgLen.current=0; resetChat(); setSidebarOpen(false) }
  async function handleJournaling(){ audio.init(); audio.playJournaling(); speechEngine.speakJournalingStart(); prevMsgLen.current=0; await startJournaling(); setSidebarOpen(false) }
  async function handleProactiveAccept(prompt:string){ dismiss(); await sendMessage(prompt) }
  function handleBootComplete(){ sessionStorage.setItem('claramente-booted','true'); setBootDone(true) }

  // ─── Styles ─────────────────────────────────────────────────
  const BG  = isDark ? '#05040A' : '#F2F0FC'
  const SB  = isDark ? 'rgba(8,6,14,0.92)' : 'rgba(255,255,255,0.94)'
  const SBB = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(124,58,237,0.1)'
  const GLASS = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)'
  const GLASS_B = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(124,58,237,0.12)'
  const TXT  = isDark ? 'rgba(255,255,255,0.88)' : '#1A1527'
  const TXTs = isDark ? 'rgba(255,255,255,0.48)' : '#5B5175'
  const TXTm = isDark ? 'rgba(255,255,255,0.26)' : '#9490A6'
  const PH   = isDark ? 'rgba(255,255,255,0.22)' : '#AEABBE'
  const UB   = isDark ? `${moodCol}20` : `${moodCol}12`
  const BB   = isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF'
  const V    = '#8B5CF6'
  const VD   = '#7C3AED'
  const VBG  = isDark ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.08)'

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    html { -webkit-text-size-adjust:100%; }
    body { -webkit-font-smoothing:antialiased; }

    @keyframes orbBreath { 0%,100%{transform:scale(1);opacity:.8} 50%{transform:scale(1.07);opacity:1} }
    @keyframes jR1       { from{transform:rotate(0)}   to{transform:rotate(360deg)} }
    @keyframes jR2       { from{transform:rotate(360deg)} to{transform:rotate(0)} }
    @keyframes wvBar     { from{transform:scaleY(.1)} to{transform:scaleY(1)} }
    @keyframes bootLn    { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
    @keyframes scanLine  { 0%{top:-2px;opacity:0} 5%{opacity:.4} 95%{opacity:.4} 100%{top:100%;opacity:0} }
    @keyframes fadeUp    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes msgIn     { from{opacity:0;transform:translateY(8px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes pulse     { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.15)} }
    @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0} }
    @keyframes recPulse  { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.35)} 50%{box-shadow:0 0 0 9px rgba(239,68,68,0)} }
    @keyframes floatOrb  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes slideInLeft { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }

    .sb-desktop { display:none!important; height:100%; }
    .mob-hdr    { display:flex; }
    @media(min-width:768px){ .sb-desktop{display:flex!important} .mob-hdr{display:none!important} }
    ::-webkit-scrollbar{ width:2px; }
    ::-webkit-scrollbar-thumb{ background:rgba(124,58,237,0.18); border-radius:2px; }
    textarea { -webkit-appearance:none; }
    textarea::placeholder { color:${PH}!important; }
  `

  // ─── SIDEBAR ─────────────────────────────────────────────────
  function Sidebar() {
    return (
      <aside style={{ width:264, flexShrink:0, height:'100%', display:'flex', flexDirection:'column', background:SB, backdropFilter:'blur(40px)', WebkitBackdropFilter:'blur(40px)', borderRight:`0.5px solid ${SBB}`, position:'relative', overflow:'hidden' }}>
        {/* Subtle corner glow */}
        <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:`radial-gradient(circle, ${moodGlow(mood)} 0%, transparent 65%)`, pointerEvents:'none', animation:'orbBreath 6s ease-in-out infinite' }} />

        {/* Brand */}
        <div style={{ height:60, padding:'0 20px', display:'flex', alignItems:'center', gap:12, borderBottom:`0.5px solid ${SBB}`, position:'relative', flexShrink:0 }}>
          <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ position:'absolute', inset:-6, borderRadius:'50%', background:`radial-gradient(circle, ${moodGlow(mood)} 0%, transparent 70%)`, animation:'orbBreath 4s ease-in-out infinite', pointerEvents:'none' }} />
            <Crystal size={24} color={isDark?'rgba(255,255,255,0.7)':VD} dim={isDark?'rgba(255,255,255,0.07)':'rgba(124,58,237,0.09)'} mid={isDark?'rgba(255,255,255,0.11)':'rgba(124,58,237,0.18)'} line={isDark?'rgba(255,255,255,0.28)':'rgba(124,58,237,0.45)'} />
          </div>
          <div>
            <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:15, color:TXT, margin:0, letterSpacing:-0.4, lineHeight:1.2 }}>Claramente</p>
            <p style={{ fontSize:9, color:moodCol, margin:0, letterSpacing:2, fontFamily:'monospace', textTransform:'uppercase', opacity:0.65 }}>sistema ativo</p>
          </div>
          {isSpeaking && (
            <div style={{ marginLeft:'auto', display:'flex', gap:1.5, alignItems:'center', height:10 }}>
              {[.5,1,.7,.9,.6].map((h,i)=>(
                <div key={i} style={{ width:1.5, borderRadius:1, background:moodCol, height:`${h*9}px`, animation:`wvBar ${.35+h*.3}s ${i*.06}s infinite ease-in-out alternate` }} />
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding:'12px 12px 8px', display:'flex', flexDirection:'column', gap:6, position:'relative' }}>
          {[
            { label:'Nova conversa',    icon:<Plus size={13} color={V}/>,      action:handleNewChat,    accent:false },
            { label:'Journaling guiado',icon:<Sparkle size={12} color={isDark?'rgba(196,181,253,.8)':VD}/>, action:handleJournaling, accent:true  },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action} style={{ width:'100%', height:38, padding:'0 14px', background:btn.accent?(isDark?'rgba(167,139,250,.07)':'rgba(124,58,237,.06)'):VBG, border:`0.5px solid ${btn.accent?(isDark?'rgba(167,139,250,.15)':'rgba(124,58,237,.14)'):(isDark?'rgba(124,58,237,.18)':'rgba(124,58,237,.16)')}`, borderRadius:10, color:btn.accent?(isDark?'rgba(196,181,253,.88)':VD):V, fontSize:12, fontWeight:500, display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all .2s cubic-bezier(.16,1,.3,1)', WebkitTapHighlightColor:'transparent' }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateX(3px)'; e.currentTarget.style.filter='brightness(1.15)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateX(0)'; e.currentTarget.style.filter='brightness(1)'}}>
              {btn.icon}{btn.label}
            </button>
          ))}
        </div>

        {/* Conversations */}
        <div style={{ flex:1, overflowY:'auto', padding:'2px 8px 6px', position:'relative' }}>
          {grouped.length===0 && (
            <div style={{ textAlign:'center', padding:'32px 16px' }}>
              <p style={{ fontSize:12, color:TXTm, lineHeight:1.8, fontFamily:"'DM Sans',sans-serif" }}>
                Nenhuma sessão ainda.<br/>Inicie uma conversa.
              </p>
            </div>
          )}
          {grouped.map(group=>(
            <div key={group.label}>
              <p style={{ fontSize:9, color:TXTm, fontWeight:600, letterSpacing:1.2, textTransform:'uppercase', padding:'12px 10px 5px', fontFamily:"'DM Sans',sans-serif" }}>
                {group.label}
              </p>
              {group.items.map(conv=>(
                <button key={conv.id} onClick={()=>handleLoadConv(conv.id)} style={{ width:'100%', textAlign:'left', padding:'9px 11px', borderRadius:9, border:'none', cursor:'pointer', marginBottom:1, background:conversationId===conv.id?VBG:'transparent', borderLeft:`2px solid ${conversationId===conv.id?V:'transparent'}`, transition:'all .18s cubic-bezier(.16,1,.3,1)', display:'block', minHeight:44, WebkitTapHighlightColor:'transparent' }}
                  onMouseEnter={e=>{ if(conversationId!==conv.id) e.currentTarget.style.background=isDark?'rgba(255,255,255,.03)':'rgba(124,58,237,.04)' }}
                  onMouseLeave={e=>{ if(conversationId!==conv.id) e.currentTarget.style.background='transparent' }}>
                  <p style={{ fontSize:12, margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:"'DM Sans',sans-serif", fontWeight:conversationId===conv.id?500:400, color:conversationId===conv.id?TXT:TXTs }}>
                    {conv.title}
                  </p>
                  <p style={{ fontSize:11, color:TXTm, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:"'DM Sans',sans-serif" }}>
                    {conv.preview}
                  </p>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* HUD toggle */}
        <div style={{ padding:'6px 10px', borderTop:`0.5px solid ${SBB}` }}>
          <button onClick={()=>setShowHUD(p=>!p)} style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 9px', borderRadius:8, border:'none', background:'transparent', cursor:'pointer', color:TXTm, fontSize:10, fontFamily:"'DM Sans',sans-serif", fontWeight:500, letterSpacing:.5, textTransform:'uppercase', WebkitTapHighlightColor:'transparent' }}>
            <span>Diagnóstico emocional</span>
            <span style={{ fontSize:9 }}>{showHUD?'▲':'▼'}</span>
          </button>
          {showHUD && <div style={{ marginTop:6 }}><JarvisHUD visible /></div>}
        </div>

        {/* Status */}
        <div style={{ height:34, padding:'0 20px', display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:`0.5px solid ${SBB}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:'#22C55E', animation:'pulse 2.5s infinite' }} />
            <span style={{ fontSize:9, color:isDark?'rgba(34,197,94,.65)':'#16A34A', letterSpacing:1.2, fontFamily:'monospace', textTransform:'uppercase' }}>online</span>
          </div>
          <span style={{ fontSize:9, color:TXTm, fontFamily:'monospace' }}>UP {uptime}</span>
        </div>

        {/* User footer */}
        <div style={{ height:56, padding:'0 14px', display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:`0.5px solid ${SBB}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:`${moodCol}1A`, border:`1px solid ${moodCol}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:moodCol, flexShrink:0 }}>
              {firstName.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize:12, color:TXTs, fontFamily:"'DM Sans',sans-serif", fontWeight:400 }}>{firstName}</span>
          </div>
          <div style={{ display:'flex', gap:2 }}>
            {[
              { I:isDark?Sun:Moon,   action:toggle,                       t_:'Tema'   },
              { I:isMuted?VolumeOff:Volume, action:handleMute,            t_:'Som'    },
              { I:BarChart,          action:()=>navigate('/relatorios'),   t_:'Relat.' },
              { I:Person,            action:()=>navigate('/perfil'),       t_:'Perfil' },
              { I:LogOut,            action:signOut,                       t_:'Sair'   },
            ].map(({I,action,t_})=>(
              <button key={t_} onClick={action} title={t_} style={{ width:28, height:28, borderRadius:7, border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'background .18s', WebkitTapHighlightColor:'transparent' }}
                onMouseEnter={e=>(e.currentTarget.style.background=VBG)}
                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                <I size={14} color={t_==='Som'&&isMuted?'#EF4444':TXTm} />
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
      <AmbientBackground isDark={isDark} mood={mood} />

      {/* Layered ambient gradients */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', background: isDark
        ? `radial-gradient(ellipse 80% 50% at 20% 0%, rgba(109,40,217,0.12) 0%, transparent 60%),
           radial-gradient(ellipse 60% 40% at 80% 100%, rgba(67,56,202,0.08) 0%, transparent 55%),
           radial-gradient(ellipse 50% 50% at 50% 50%, rgba(124,58,237,0.04) 0%, transparent 70%)`
        : `radial-gradient(ellipse 80% 50% at 20% 0%, rgba(124,58,237,0.07) 0%, transparent 60%),
           radial-gradient(ellipse 60% 40% at 80% 100%, rgba(99,102,241,0.05) 0%, transparent 55%)`
      }} />

      {!bootDone && <BootSequence onComplete={handleBootComplete} />}

      <div style={{ height:'100dvh', display:'flex', background:BG, fontFamily:"'DM Sans','Plus Jakarta Sans',sans-serif", position:'relative', overflow:'hidden', zIndex:1, opacity:bootDone?1:0, transition:'opacity 0.6s ease' }}>
        <style>{CSS}</style>

        <div className="sb-desktop"><Sidebar /></div>

        {sidebarOpen && (
          <>
            <div onClick={()=>setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:40, backdropFilter:'blur(8px)' }} />
            <div style={{ position:'fixed', top:0, left:0, bottom:0, zIndex:50, animation:'slideInLeft 0.25s ease', maxWidth:'85vw' }}><Sidebar /></div>
          </>
        )}

        {/* Main */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, position:'relative' }}>

          {/* AI processing line */}
          {isTyping && <div style={{ position:'absolute', left:0, right:0, height:'1px', background:`linear-gradient(90deg,transparent,${moodCol}45,transparent)`, animation:'scanLine 1.8s ease-in-out infinite', zIndex:5, pointerEvents:'none' }} />}

          {/* Mobile header */}
          <header className="mob-hdr" style={{ background:isDark?'rgba(5,4,10,0.92)':'rgba(255,255,255,0.94)', backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)', borderBottom:`0.5px solid ${SBB}`, height:52, padding:'0 14px', alignItems:'center', justifyContent:'space-between', flexShrink:0, zIndex:10, position:'relative' }}>
            <button onClick={()=>setSidebarOpen(true)} style={{ width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', background:'none', border:'none', cursor:'pointer', borderRadius:9, WebkitTapHighlightColor:'transparent' }}>
              <Menu size={18} color={V} />
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <AIOrb state={orbState} size={22} color={moodCol} />
              <span style={{ fontFamily:"'DM Serif Display',serif", fontSize:16, color:TXT }}>
                {isJournalingMode ? 'Journaling' : 'Claramente'}
              </span>
            </div>
            <button onClick={handleMute} style={{ width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', background:'none', border:'none', cursor:'pointer', borderRadius:9, WebkitTapHighlightColor:'transparent' }}>
              {isMuted ? <VolumeOff size={16} color="#EF4444" /> : <Volume size={16} color={TXTm} />}
            </button>
          </header>

          {/* Journaling banner */}
          {isJournalingMode && (
            <div style={{ padding:'8px 20px', background:isDark?'rgba(167,139,250,0.06)':'rgba(124,58,237,0.05)', backdropFilter:'blur(12px)', borderBottom:`0.5px solid ${isDark?'rgba(167,139,250,0.1)':'rgba(124,58,237,0.1)'}`, display:'flex', alignItems:'center', gap:9, fontSize:13, color:V, zIndex:10, position:'relative' }}>
              <Sparkle size={13} color={V} />
              <span style={{ fontWeight:500 }}>Modo Journaling Guiado</span>
              <span style={{ color:TXTm, fontSize:12 }}>— sessão reflexiva estruturada</span>
            </div>
          )}

          {/* Crisis banner */}
          {isCrisis && (
            <div style={{ margin:'8px 16px 0', padding:'10px 14px', borderRadius:12, background:isDark?'rgba(239,68,68,0.07)':'#FFF7ED', border:`1px solid ${isDark?'rgba(239,68,68,0.18)':'#FED7AA'}`, fontSize:13, color:isDark?'rgba(252,165,165,.88)':'#92400E', lineHeight:1.6, zIndex:10, position:'relative' }}>
              CVV: <strong>188</strong> · Ligação gratuita, 24h · cvv.org.br
            </div>
          )}

          {/* Messages area */}
          <div style={{ flex:1, overflowY:'auto', padding:'20px 18px 12px', position:'relative', zIndex:1 }}>
            <div style={{ maxWidth:660, margin:'0 auto', display:'flex', flexDirection:'column', gap:14 }}>

              {/* ── WELCOME ── */}
              {messages.length===0 && (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'28px 12px 16px', animation:'fadeUp 0.7s ease' }}>

                  {/* Large orb — hero element */}
                  <div style={{ marginBottom:28, animation:'floatOrb 7s ease-in-out infinite' }}>
                    <AIOrb state={orbState} size={148} color={moodCol} />
                  </div>

                  {/* Greeting */}
                  <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(22px,4.5vw,30px)', color:TXT, marginBottom:6, fontWeight:400, letterSpacing:-0.7, textAlign:'center', lineHeight:1.2 }}>
                    {bootDone&&!welcomeDone
                      ? <TypewriterText text={`Olá, ${firstName}`} speed={55} onComplete={()=>setWelcomeDone(true)} />
                      : `Olá, ${firstName}`}
                  </h2>

                  {loadingSmartSummary && (
                    <div style={{ marginBottom:18, display:'flex', justifyContent:'center' }}>
                      <JarvisWave color={`${moodCol}70`} n={8} />
                    </div>
                  )}

                  {smartSummary&&!loadingSmartSummary && (
                    <div style={{ background:GLASS, backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:`0.5px solid ${GLASS_B}`, borderRadius:18, padding:'13px 18px', marginBottom:20, width:'100%', maxWidth:400, position:'relative', overflow:'hidden', animation:'fadeUp 0.5s ease', boxShadow:isDark?'0 4px 24px rgba(0,0,0,0.22)':'0 4px 24px rgba(124,58,237,0.08)' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:`linear-gradient(90deg,transparent,${moodCol}28,transparent)` }} />
                      <p style={{ fontSize:13, color:TXTs, lineHeight:1.72, margin:0, fontStyle:'italic' }}>{smartSummary}</p>
                    </div>
                  )}

                  {!smartSummary&&!loadingSmartSummary&&welcomeDone && (
                    <p style={{ fontSize:13, color:TXTs, lineHeight:1.8, maxWidth:260, textAlign:'center', marginBottom:4, animation:'fadeUp 0.5s ease', fontWeight:400 }}>
                      Este é seu espaço sagrado.<br/>Como você está se sentindo hoje?
                    </p>
                  )}

                  {/* Action cards — 2×2 grid */}
                  {welcomeDone && (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:20, width:'100%', maxWidth:380, animation:'fadeUp 0.6s ease 0.15s both' }}>
                      <ActionCard title="Journaling guiado" desc="Sessão reflexiva guiada" icon={Sparkle} accent color={moodCol} onClick={()=>{ audio.init(); handleJournaling() }} />
                      <ActionCard title="Estou ansioso" desc="Quero falar sobre isso" color={moodCol} onClick={()=>{ audio.init(); sendMessage('Estou me sentindo ansioso ultimamente.') }} />
                      <ActionCard title="Quero refletir" desc="Momento de introspecção" color={moodCol} onClick={()=>{ audio.init(); sendMessage('Quero fazer uma reflexão sobre minha vida.') }} />
                      <ActionCard title="Me sinto bem" desc="Compartilhar gratidão" color={moodCol} onClick={()=>{ audio.init(); sendMessage('Estou me sentindo bem hoje!') }} />
                    </div>
                  )}
                </div>
              )}

              {/* Proactive suggestion */}
              {suggestion && (
                <ProactiveCard message={suggestion.message} action={suggestion.action} onAccept={()=>handleProactiveAccept(suggestion.prompt)} onDismiss={dismiss} delay={600} />
              )}

              {/* Chat messages */}
              {messages.map(msg=>(
                <div key={msg.id} style={{ display:'flex', gap:9, alignItems:'flex-end', flexDirection:msg.role==='user'?'row-reverse':'row', animation:'msgIn 0.3s cubic-bezier(.16,1,.3,1)' }}>
                  {msg.role==='assistant' && (
                    <div style={{ flexShrink:0, marginBottom:3 }}>
                      <AIOrb state={isTyping?'thinking':'idle'} size={28} color={moodCol} />
                    </div>
                  )}
                  <div style={{
                    maxWidth:'min(74%,500px)', padding:'12px 16px',
                    fontSize:14.5, lineHeight:1.72, whiteSpace:'pre-wrap', wordBreak:'break-word',
                    borderRadius:msg.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px',
                    background:msg.role==='user'?UB:BB,
                    backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
                    color:msg.role==='user'?(isDark?'rgba(233,228,255,.95)':TXT):TXT,
                    border:msg.role==='user'?`0.5px solid ${moodCol}28`:`0.5px solid ${GLASS_B}`,
                    boxShadow:msg.role==='user'?`0 3px 16px ${moodCol}14`:isDark?'0 2px 16px rgba(0,0,0,.2)':'0 2px 16px rgba(124,58,237,.06)',
                    position:'relative', overflow:'hidden',
                  }}>
                    {msg.role==='assistant' && <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:`linear-gradient(90deg,transparent,${moodCol}18,transparent)` }} />}
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div style={{ display:'flex', gap:9, alignItems:'flex-end', animation:'fadeUp .3s ease' }}>
                  <AIOrb state="thinking" size={28} color={moodCol} />
                  <div style={{ background:BB, backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:`0.5px solid ${GLASS_B}`, borderRadius:'18px 18px 18px 4px', padding:'12px 16px', position:'relative', overflow:'hidden', boxShadow:isDark?'0 2px 16px rgba(0,0,0,.2)':'0 2px 16px rgba(124,58,237,.06)' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:`linear-gradient(90deg,transparent,${moodCol}18,transparent)` }} />
                    <JarvisWave color={`${moodCol}99`} n={9} />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* ── COMMAND BAR (input) ── */}
          <div style={{ padding:'10px 16px', paddingBottom:`max(10px,env(safe-area-inset-bottom,10px))`, flexShrink:0, position:'relative', zIndex:10 }}>

            {/* Top separator with glow */}
            <div style={{ position:'absolute', top:0, left:'8%', right:'8%', height:'1px', background:`linear-gradient(90deg,transparent,${moodCol}20,transparent)` }} />

            {(isRecording||isMuted) && (
              <p style={{ textAlign:'center', fontSize:10, color:isRecording?'#EF4444':TXTm, letterSpacing:.8, fontFamily:'monospace', textTransform:'uppercase', marginBottom:7 }}>
                {isRecording?'● GRAVANDO — TOQUE PARA PARAR':'SOM DESATIVADO'}
              </p>
            )}

            <div style={{ maxWidth:660, margin:'0 auto' }}>
              {/* The command bar */}
              <div style={{
                display:'flex', gap:8, alignItems:'flex-end',
                background:isDark?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.92)',
                backdropFilter:'blur(32px)', WebkitBackdropFilter:'blur(32px)',
                borderRadius:26, padding:'7px',
                border:`1.5px solid ${isRecording?'rgba(239,68,68,.38)':isDark?'rgba(255,255,255,0.09)':'rgba(124,58,237,0.18)'}`,
                boxShadow:isDark
                  ?'0 8px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)'
                  :'0 4px 24px rgba(124,58,237,0.1), inset 0 1px 0 rgba(255,255,255,0.9)',
                transition:'border-color .2s, box-shadow .2s',
              }}
                onFocusCapture={e=>{ e.currentTarget.style.borderColor=moodCol; e.currentTarget.style.boxShadow=isDark?`0 8px 48px rgba(0,0,0,0.32), 0 0 0 3px ${moodCol}0C`:`0 4px 28px rgba(124,58,237,0.16), 0 0 0 3px ${moodCol}10` }}
                onBlurCapture={e=>{ e.currentTarget.style.borderColor=isRecording?'rgba(239,68,68,.38)':isDark?'rgba(255,255,255,0.09)':'rgba(124,58,237,0.18)'; e.currentTarget.style.boxShadow=isDark?'0 8px 40px rgba(0,0,0,0.28)':'0 4px 24px rgba(124,58,237,0.1)' }}>

                {/* Mic button */}
                {micSupported && (
                  <button onClick={handleMicToggle} title={isRecording?'Parar':'Gravar áudio'} style={{ width:44, height:44, borderRadius:20, border:'none', flexShrink:0, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background:isRecording?'rgba(239,68,68,.12)':VBG, transition:'all .22s cubic-bezier(.16,1,.3,1)', animation:isRecording?'recPulse 1.6s infinite':'none', WebkitTapHighlightColor:'transparent' }}
                    onMouseEnter={e=>e.currentTarget.style.transform='scale(1.1)'}
                    onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
                    {isRecording?<Stop size={13} color="#EF4444"/>:<Mic size={16} color={V}/>}
                  </button>
                )}

                {/* Text input */}
                <div style={{ flex:1, minWidth:0 }}>
                  {isRecording && (
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 4px 0' }}>
                      <RecordWave />
                      <span style={{ fontSize:13, color:'#EF4444', fontFamily:"'DM Sans',sans-serif" }}>
                        {recordingText||'Ouvindo...'}
                      </span>
                    </div>
                  )}
                  {!isRecording && (
                    <textarea
                      ref={textareaRef} value={input}
                      onChange={e=>{ setInput(e.target.value); autoResize() }}
                      onKeyDown={handleKey}
                      placeholder={isJournalingMode?'Escreva sua reflexão...':'Como você está se sentindo?'}
                      rows={1}
                      style={{ width:'100%', background:'none', border:'none', outline:'none', fontSize:15, lineHeight:1.6, resize:'none', fontFamily:"'DM Sans',sans-serif", color:TXT, maxHeight:112, padding:'9px 4px', display:'block', WebkitAppearance:'none' }}
                    />
                  )}
                </div>

                {/* Send button */}
                <button onClick={handleSend} disabled={isTyping||(!input.trim()&&!recordingText.trim())} style={{
                  width:44, height:44, borderRadius:20, border:'none', flexShrink:0,
                  cursor:isTyping||(!input.trim()&&!recordingText.trim())?'not-allowed':'pointer',
                  background:isTyping||(!input.trim()&&!recordingText.trim())?VBG:VD,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all .22s cubic-bezier(.16,1,.3,1)',
                  boxShadow:isTyping||(!input.trim()&&!recordingText.trim())?'none':`0 4px 16px ${moodCol}35`,
                  WebkitTapHighlightColor:'transparent',
                }}
                  onMouseEnter={e=>{ if(!isTyping&&input.trim()){ e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.filter='brightness(1.12)' } }}
                  onMouseLeave={e=>{ e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.filter='brightness(1)' }}>
                  <Send size={16} color={isTyping||(!input.trim()&&!recordingText.trim())?V:'white'} />
                </button>
              </div>

              <p style={{ textAlign:'center', fontSize:10, color:TXTm, marginTop:7, letterSpacing:.3, fontFamily:"'DM Sans',sans-serif" }}>
                {isJournalingMode?'Sessão de journaling guiado ativa':!micSupported?'Gravação de voz não suportada neste navegador':'Não substitui acompanhamento psicológico · CVV: 188'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}