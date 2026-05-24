// src/pages/Home.tsx
// ─────────────────────────────────────────────────────────────────────
// Claramente — Home / Chat (re-themed)
//
// All original hooks and behaviors preserved (useChat, useProactive,
// audio + speechEngine + emotionEngine, mute, journaling, crisis,
// sidebar groups). Visual treatment changed to:
//   • Prose-led messages (no bubbles), with role labels
//   • Soft paper-feel sidebar with active item highlighted by a left bar
//   • Ambient terracotta aura behind the input
//   • New ClaramenteLogo mascot throughout
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
import { UserNav } from '@/components/UserNav'
import { OnboardingModal } from '@/components/OnboardingModal'
import {
  Send, Plus, Sparkle, Volume, VolumeOff,
  BarChart, Person, LogOut, Sun, Moon, Menu,
} from '@/components/Icons'
import type { ConversationItem } from '@/hooks/useChat'
import { useColors, fontStack } from '@/lib/theme'

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

  const { suggestion, dismiss } = useProactive(messages.length, isTyping)
  const grouped   = groupConvs(conversations)
  const firstName = profile?.name?.split(' ')[0] || 'você'

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
    await sendMessage(txt)
  }

  const onKey    = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }
  const newChat  = () => { prevLen.current = 0; resetChat(); setSidebarOpen(false) }
  const loadConv = (id: string) => async () => { prevLen.current = 0; await loadConversation(id); setSidebarOpen(false) }
  const journal  = async () => { audio.init(); audio.playJournaling(); speechEngine.speakJournalingStart(); prevLen.current = 0; await startJournaling(); setSidebarOpen(false) }

  const CSS = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-text-size-adjust: 100%; }
    body { -webkit-font-smoothing: antialiased; background: ${t.bg}; }
    @keyframes tdot     { 0%,60%,100% { transform: translateY(0); opacity: .4 } 30% { transform: translateY(-4px); opacity: 1 } }
    @keyframes blink    { 0%,100% { opacity: 1 } 50% { opacity: 0 } }
    @keyframes fIn      { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
    @keyframes mIn      { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
    @keyframes sIn      { from { opacity: 0; transform: translateX(-100%) } to { opacity: 1; transform: translateX(0) } }
    @keyframes auraSoft { 0%,100% { transform: scale(1); opacity: 0.85 } 50% { transform: scale(1.08); opacity: 1 } }
    @keyframes pulseB   { 0%,100% { opacity: 1 } 50% { opacity: 0.35 } }
    .sb { display: none !important; height: 100%; }
    .mhd { display: flex; }
    @media (min-width: 768px) { .sb { display: flex !important } .mhd { display: none !important } }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: ${isDark ? 'rgba(196,131,106,0.22)' : 'rgba(160,101,73,0.18)'}; border-radius: 4px; }
    textarea { -webkit-appearance: none; font-family: 'Inter', sans-serif; }
    textarea::placeholder { color: ${t.textMuted} !important; opacity: 0.7; }
  `

  // ── Sidebar ───────────────────────────────────────────────────────
  function Sidebar() {
    return (
      <aside style={{
        width: 264, flexShrink: 0, height: '100%',
        display: 'flex', flexDirection: 'column',
        background: t.surface2, borderRight: `1px solid ${t.border}`,
      }}>
        {/* Top bar minimalista: ☰ + avatar (estilo GitHub) */}
        <div style={{
          height: 52, padding: '0 12px', flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 8,
          borderBottom: `1px solid ${t.borderSoft}`,
        }}>
          <button style={iconBtn(t)} title="Menu" aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.textSub} strokeWidth="1.8" strokeLinecap="round">
              <line x1="3" y1="6"  x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <button
            onClick={() => navigate('/perfil')}
            title={profile?.name || 'Meu perfil'}
            aria-label="Meu perfil"
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: t.accent,
              border: `1.5px solid ${t.accentBorder}`,
              cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#faf6f0', fontSize: 12, fontWeight: 700,
              transition: 'transform 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.borderColor = t.accent }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = t.accentBorder }}
          >
            {firstName.charAt(0).toUpperCase()}
          </button>
        </div>

        {/* Nova conversa */}
        <div style={{ padding: '12px 14px', borderBottom: `1px solid ${t.borderSoft}`, flexShrink: 0 }}>
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

        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
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
                      transition: 'background 0.12s',
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

        {/* Journaling + Reports */}
        <div style={{ padding: 10, borderTop: `1px solid ${t.borderSoft}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            onClick={journal}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: `1px dashed ${t.accentBorder}`, background: t.accentSoft,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9,
              color: t.accentDeep, fontSize: 12.5, fontWeight: 600, fontFamily: fontStack,
            }}
          >
            <Sparkle size={14} color={t.accentDeep}/> Journaling guiado
          </button>
          <button
            onClick={() => navigate('/relatorios')}
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 10,
              border: 'none', background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 9,
              color: t.textSub, fontSize: 12.5, fontWeight: 500, fontFamily: fontStack,
            }}
          >
            <BarChart size={14} color={t.textSub}/> Relatórios
          </button>
          <button
            onClick={() => navigate('/perfil')}
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 10,
              border: 'none', background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 9,
              color: t.textSub, fontSize: 12.5, fontWeight: 500, fontFamily: fontStack,
            }}
          >
            <Person size={14} color={t.textSub}/> Perfil
          </button>
        </div>

        {/* Ações rápidas no rodapé: tema, som, sair */}
        <div style={{
          padding: '8px 12px',
          borderTop: `1px solid ${t.borderSoft}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          flexShrink: 0,
        }}>
          <button onClick={toggle} title="Tema" style={iconBtn(t)}>
            {isDark ? <Sun size={16} color={t.textMuted}/> : <Moon size={16} color={t.textMuted}/>}
          </button>
          <button onClick={handleMute} title="Som" style={iconBtn(t)}>
            {muted ? <VolumeOff size={16} color={t.danger}/> : <Volume size={16} color={t.textMuted}/>}
          </button>
          <button onClick={signOut} title="Sair" style={iconBtn(t)}>
            <LogOut size={16} color={t.textMuted}/>
          </button>
        </div>
      </aside>
    )
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div style={{
      height: '100dvh', display: 'flex', background: t.bg, fontFamily: fontStack,
      overflow: 'hidden', opacity: mounted ? 1 : 0, transition: 'opacity 0.3s ease',
      color: t.text,
    }}>
      <style>{CSS}</style>

      <div className="sb"><Sidebar/></div>

      {sidebarOpen && (
        <>
          <div onClick={() => setSidebarOpen(false)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
            zIndex: 40, backdropFilter: 'blur(4px)',
          }}/>
          <div style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
            animation: 'sIn 0.22s ease', width: 280, maxWidth: '88vw',
          }}><Sidebar/></div>
        </>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>

        {/* Mobile header */}
        <header className="mhd" style={{
          background: t.bg, borderBottom: `1px solid ${t.borderSoft}`,
          height: 52, padding: '0 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <button onClick={() => navigate('/perfil')} aria-label="Ir para o perfil" style={{
              width: 34, height: 34, borderRadius: '50%', background: t.accent,
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
              color: '#faf6f0', fontSize: 12, fontWeight: 600,
            }}>
            {profile?.name ? profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClaramenteLogo size={24} mode={mode}/>
            <span style={{ fontSize: 15, fontWeight: 700, color: t.text }}>
              {isJournalingMode ? 'Journaling' : 'Claramente'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={handleMute} style={iconBtn(t)}>
              {muted ? <VolumeOff size={16} color={t.danger}/> : <Volume size={16} color={t.textMuted}/>}
            </button>
            <button onClick={() => setSidebarOpen(true)} style={iconBtn(t)}>
              <Menu size={18} color={t.textSub}/>
            </button>
          </div>
        </header>

        {/* Desktop header */}
        <header style={{
          height: 56, padding: '0 28px',
          display: 'none', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, borderBottom: `1px solid ${t.borderSoft}`, background: t.bg,
        }} className="dhd">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: t.text, margin: 0 }}>
              {isJournalingMode ? 'Journaling guiado' : 'Conversa de hoje'}
            </p>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '3px 10px', borderRadius: 999,
              background: t.accentSoft, border: `1px solid ${t.accentBorder}`,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.accent, animation: 'pulseB 2.4s ease-in-out infinite' }}/>
              <span style={{ fontSize: 11, fontWeight: 600, color: t.accentDeep, letterSpacing: 0.4 }}>sereno</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={handleMute} style={iconBtn(t)}>
              {muted ? <VolumeOff size={15} color={t.danger}/> : <Volume size={15} color={t.textMuted}/>}
            </button>
            <button aria-label="Mais opções" style={iconBtn(t)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
            </button>
          </div>
        </header>
        <style>{`@media (min-width: 768px) { .dhd { display: flex !important } }`}</style>

        {/* Journaling banner */}
        {isJournalingMode && (
          <div style={{
            padding: '8px 24px', background: t.accentSoft,
            borderBottom: `1px solid ${t.accentBorder}`,
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, fontWeight: 500, color: t.accentDeep,
          }}>
            <Sparkle size={13} color={t.accentDeep}/> Modo Journaling Guiado
            <span style={{ fontWeight: 400, color: t.textMuted, fontSize: 12 }}>— sessão reflexiva</span>
          </div>
        )}

        {/* Crisis banner — quiet, dashed border, restrained */}
        {isCrisis && (
          <div style={{
            margin: '12px 24px 0', padding: '10px 14px', borderRadius: 10,
            background: 'transparent', border: `1px dashed ${t.border}`,
            fontSize: 12.5, color: t.textSub, lineHeight: 1.5,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ color: t.accentDeep }}>♡</span>
            Em momentos difíceis, o <strong style={{ color: t.text, fontWeight: 600 }}>CVV (188)</strong> está disponível 24h, gratuitamente · cvv.org.br
          </div>
        )}

        {/* Scroll area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 140px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

            {/* Empty state */}
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0 24px', animation: 'fIn 0.4s ease' }}>
                <div style={{ marginBottom: 20, filter: `drop-shadow(0 8px 24px ${t.accent}55)` }}>
                  <ClaramenteLogo size={80} mode={mode} breathing/>
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

                {loadingSmartSummary && <div style={{ marginTop: 20 }}><TypingDots color={t.accent}/></div>}
                {smartSummary && !loadingSmartSummary && (
                  <div style={{
                    background: t.surface, border: `1px solid ${t.border}`,
                    borderLeft: `3px solid ${t.accent}`,
                    borderRadius: '4px 12px 12px 4px',
                    padding: '14px 18px', marginTop: 22, width: '100%', animation: 'fIn 0.4s ease',
                  }}>
                    <p style={{ fontSize: 14, color: t.textSub, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
                      {smartSummary}
                    </p>
                  </div>
                )}

                {greetDone && (
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
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

            {/* Timestamp divider */}
            {messages.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, opacity: 0.5 }}>
                <div style={{ flex: 1, height: '1px', background: t.border }}/>
                <span style={{ fontSize: 11, color: t.textMuted, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                  HOJE · {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div style={{ flex: 1, height: '1px', background: t.border }}/>
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
                        width: 28, height: 28, borderRadius: '50%',
                        background: t.accent,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
                      }}>{firstName.charAt(0).toUpperCase()}</div>
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
                  paddingLeft: msg.role === 'assistant' ? 30 : 38,
                  marginLeft: msg.role === 'assistant' ? 4 : 0,
                  borderLeft: msg.role === 'assistant' ? `2px solid ${t.accentSoft}` : 'none',
                }}>
                  {msg.content}
                </div>
                {msg.role === 'assistant' && (
                  <div style={{ display: 'flex', gap: 4, paddingLeft: 36, marginTop: 8 }}>
                    <MsgActionBtn label="Copiar"    onClick={() => navigator.clipboard.writeText(msg.content)} t={t}
                      icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
                    />
                    <MsgActionBtn label="Ouvir"     onClick={() => speechEngine.speak(msg.content, { rate: 1.02, pitch: 0.94 })} t={t}
                      icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>}
                    />
                    <MsgActionBtn label="Continuar" onClick={() => sendMessage('Continue, por favor.')} t={t}
                      icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
                    />
                  </div>
                )}
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
            <div ref={bottomRef}/>
          </div>
        </div>

        {/* Input with ambient aura */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '20px 24px', paddingBottom: 'max(18px, env(safe-area-inset-bottom, 18px))',
          background: `linear-gradient(to top, ${t.bg} 75%, ${t.bg}00)`,
          pointerEvents: 'none',
        }}>
          {/* Aura */}
          <div style={{
            position: 'absolute', bottom: -50, left: 0, right: 0, height: 140,
            background: `radial-gradient(ellipse at 50% 100%, ${t.accent}22 0%, transparent 65%)`,
            filter: 'blur(20px)', pointerEvents: 'none',
            animation: 'auraSoft 6s ease-in-out infinite',
          }}/>
          <div style={{ maxWidth: 680, margin: '0 auto', position: 'relative', pointerEvents: 'auto' }}>
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
                placeholder={isJournalingMode ? 'Escreva sua reflexão...' : 'Como você está se sentindo?'}
                rows={1}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontSize: 14.5, lineHeight: 1.6, resize: 'none',
                  color: t.text, maxHeight: 120, padding: '10px 12px', display: 'block',
                  minWidth: 0,
                }}
              />
              <button aria-label="Microfone" style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none', flexShrink: 0,
                cursor: 'pointer', background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted,
              }}
                onMouseEnter={e => (e.currentTarget.style.color = t.accent)}
                onMouseLeave={e => (e.currentTarget.style.color = t.textMuted)}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="2" width="6" height="11" rx="3"/>
                  <path d="M5 10a7 7 0 0 0 14 0"/>
                  <line x1="12" y1="19" x2="12" y2="22"/>
                  <line x1="8" y1="22" x2="16" y2="22"/>
                </svg>
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
            <p style={{ textAlign: 'center', fontSize: 11, color: t.textMuted, marginTop: 10, letterSpacing: 0.2 }}>
              {isJournalingMode ? 'Sessão de journaling guiado ativa' : 'Claramente não substitui acompanhamento psicológico · CVV: 188'}
            </p>
          </div>
        </div>
      </div>
      <OnboardingModal/>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────
type T = ReturnType<typeof useColors>

function iconBtn(t: T): React.CSSProperties {
  return {
    width: 34, height: 34, borderRadius: 8,
    border: 'none', background: 'transparent', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    WebkitTapHighlightColor: 'transparent',
  }
}

function MsgActionBtn({ label, onClick, t, icon }: {
  label: string; onClick: () => void; t: T; icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 999,
        border: `1px solid ${t.borderSoft}`,
        background: t.surface, color: t.textMuted,
        fontSize: 11.5, cursor: 'pointer', fontFamily: fontStack,
        transition: 'all 0.12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.color = t.accentDeep }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = t.borderSoft; e.currentTarget.style.color = t.textMuted }}
    >
      {icon} {label}
    </button>
  )
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