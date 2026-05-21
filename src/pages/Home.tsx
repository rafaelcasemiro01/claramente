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
import {
  Send, Plus, Sparkle, Volume, VolumeOff,
  BarChart, Person, LogOut, Sun, Moon, Menu,
} from '@/components/Icons'
import type { ConversationItem } from '@/hooks/useChat'

function FooterAura() {
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, height:110, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(37,99,235,0.22) 0%, rgba(59,130,246,0.13) 35%, rgba(96,165,250,0.05) 65%, transparent 100%)' }} />
      <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', width:'120%', height:70, background:'radial-gradient(ellipse at 50% 100%, rgba(96,165,250,0.28) 0%, rgba(59,130,246,0.12) 45%, transparent 70%)', animation:'auraBreath 5s ease-in-out infinite' }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:3, background:'linear-gradient(90deg,transparent 0%,rgba(59,130,246,0) 5%,rgba(96,165,250,1) 30%,rgba(147,197,253,1) 50%,rgba(96,165,250,1) 70%,rgba(59,130,246,0) 95%,transparent 100%)', backgroundSize:'200% 100%', animation:'footerBeam 4s linear infinite', boxShadow:'0 0 18px rgba(96,165,250,0.7),0 0 36px rgba(59,130,246,0.35)' }} />
    </div>
  )
}

function BotAvatar({ size = 30, accent }: { size?: number; accent: string }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:`${accent}14`, border:`1px solid ${accent}28`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden', boxShadow:`0 0 10px ${accent}1E` }}>
      <ClaramenteLogo size={size * 0.82} accent={accent} />
    </div>
  )
}

function TypingDots({ color }: { color: string }) {
  return (
    <div style={{ display:'flex', gap:4, alignItems:'center', padding:'4px 0' }}>
      {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:color, opacity:0.5, animation:`tdot 1.3s ${i*0.18}s ease-in-out infinite` }} />)}
    </div>
  )
}

function ActionCard({ title, subtitle, Icon, accent=false, isDark, accentColor, onClick }: {
  title:string; subtitle:string; Icon?: React.ElementType;
  accent?: boolean; isDark:boolean; accentColor:string; onClick:()=>void;
}) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{ height:'100%', width:'100%', padding:'14px 16px', borderRadius:12, cursor:'pointer', textAlign:'left', display:'flex', flexDirection:'column', justifyContent:'center', gap:4, background:accent?(hov?`${accentColor}1A`:`${accentColor}0E`):(hov?(isDark?'#1E293B':'#F0F9FF'):(isDark?'#1E293B':'#FFFFFF')), border:`1px solid ${accent?(hov?`${accentColor}55`:`${accentColor}30`):(hov?(isDark?'#334155':'#BFDBFE'):(isDark?'#1E293B':'#E0F2FE'))}`, transition:'all 0.15s ease', transform:hov?'translateY(-1px)':'translateY(0)', boxShadow:hov?(accent?`0 4px 16px ${accentColor}22`:(isDark?'0 4px 16px rgba(0,0,0,0.3)':'0 4px 16px rgba(37,99,235,0.1)')):'none', WebkitTapHighlightColor:'transparent' }}>
      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
        {Icon && <Icon size={14} color={accent?accentColor:(isDark?'#60A5FA':'#2563EB')} />}
        <p style={{ fontSize:13, fontWeight:600, margin:0, color:accent?accentColor:(isDark?'#F1F5F9':'#0F172A'), fontFamily:"'Inter',sans-serif", lineHeight:1.3 }}>{title}</p>
      </div>
      <p style={{ fontSize:12, margin:0, color:'#64748B', fontFamily:"'Inter',sans-serif", lineHeight:1.4, paddingLeft:Icon?21:0 }}>{subtitle}</p>
    </button>
  )
}

function Typewriter({ text, speed=35, onDone }: { text:string; speed?:number; onDone?:()=>void }) {
  const [shown, setShown] = useState(''); const [done, setDone] = useState(false)
  useEffect(() => {
    setShown(''); setDone(false); let i=0
    const t = setInterval(()=>{ if(i<text.length) setShown(text.slice(0,++i)); else{clearInterval(t);setDone(true);onDone?.()} },speed)
    return ()=>clearInterval(t)
  },[text])
  return <>{shown}{!done&&<span style={{opacity:0.3,animation:'blink 1s infinite'}}>|</span>}</>
}

function groupConvs(convs: ConversationItem[]) {
  const now=new Date(), today=new Date(now.getFullYear(),now.getMonth(),now.getDate())
  const yest=new Date(today); yest.setDate(today.getDate()-1)
  const week=new Date(today); week.setDate(today.getDate()-7)
  const g=[
    {label:'Hoje',         items:[] as ConversationItem[]},
    {label:'Ontem',        items:[] as ConversationItem[]},
    {label:'Esta semana',  items:[] as ConversationItem[]},
    {label:'Mais antigas', items:[] as ConversationItem[]},
  ]
  convs.forEach(c=>{
    const d=new Date(c.started_at)
    if(d>=today) g[0].items.push(c)
    else if(d>=yest) g[1].items.push(c)
    else if(d>=week) g[2].items.push(c)
    else g[3].items.push(c)
  })
  return g.filter(x=>x.items.length>0)
}

export default function Home() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { isDark, toggle }   = useTheme()
  const { messages, isTyping, isCrisis, isJournalingMode, conversationId, conversations, smartSummary, loadingSmartSummary, sendMessage, resetChat, loadConversation, startJournaling } = useChat()

  const [input,       setInput]       = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [muted,       setMuted]       = useState(false)
  const [greetDone,   setGreetDone]   = useState(false)
  const [mounted,     setMounted]     = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const taRef     = useRef<HTMLTextAreaElement>(null)
  const prevLen   = useRef(0)

  const { suggestion, dismiss } = useProactive(messages.length, isTyping)
  const grouped   = groupConvs(conversations)
  const firstName = profile?.name?.split(' ')[0] || 'você'
  const ACCENT    = isDark ? '#60A5FA' : '#2563EB'

  const C = isDark ? {
    bg:'#0F172A', surface:'#1E293B', border:'#334155', sidebar:'#0F172A', sidebarB:'#1E293B',
    text:'#F1F5F9', textSub:'#94A3B8', textMuted:'#475569', accentBg:'rgba(30,64,175,0.2)',
    userBubble:'rgba(30,64,175,0.2)', userBorder:'#1E40AF', userText:'#BFDBFE',
    inputBg:'#1E293B', inputBorder:'#334155', placeholder:'#475569', btnBg:'#1E293B',
  } : {
    bg:'#F0F9FF', surface:'#FFFFFF', border:'#E0F2FE', sidebar:'#FFFFFF', sidebarB:'#E0F2FE',
    text:'#0F172A', textSub:'#374151', textMuted:'#64748B', accentBg:'#EFF6FF',
    userBubble:'#EFF6FF', userBorder:'#BFDBFE', userText:'#1E40AF',
    inputBg:'#FFFFFF', inputBorder:'#E0F2FE', placeholder:'#94A3B8', btnBg:'#F0F9FF',
  }

  useEffect(()=>{ setTimeout(()=>setMounted(true),50) },[])
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages,isTyping])
  useEffect(()=>emotionEngine.subscribe(()=>{}),[])
  useEffect(()=>{ const t=setTimeout(()=>speechEngine.speakWelcome(firstName),600); return()=>clearTimeout(t) },[firstName])
  useEffect(()=>{
    if(messages.length>prevLen.current){
      const last=messages.slice(prevLen.current).pop()
      if(last?.role==='assistant'){
        audio.playAIResponse()
        const s=(last as unknown as{sentiment?:string}).sentiment
        if(s) emotionEngine.updateFromSentiment(s,[])
        setTimeout(()=>speechEngine.speak(last.content,{rate:1.02,pitch:0.94}),250)
      }
    }
    prevLen.current=messages.length
  },[messages])
  useEffect(()=>{ if(isTyping){audio.playAIStart();speechEngine.stop()} },[isTyping])

  const handleMute = useCallback(()=>{
    const n=!muted; setMuted(n); speechEngine.setMuted(n)
    if(n) speechEngine.stop(); audio.playClick()
  },[muted])

  function autoResize(){
    if(!taRef.current) return
    taRef.current.style.height='auto'
    taRef.current.style.height=Math.min(taRef.current.scrollHeight,120)+'px'
  }

  async function handleSend(){
    if(!input.trim()||isTyping) return
    const txt=input.trim(); setInput('')
    if(taRef.current) taRef.current.style.height='auto'
    audio.init(); audio.playMessageSent(); speechEngine.speakAck(firstName)
    await sendMessage(txt)
  }

  const onKey    = (e:React.KeyboardEvent)=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend()} }
  const newChat  = ()=>{ prevLen.current=0; resetChat(); setSidebarOpen(false) }
  const loadConv = (id:string)=>async()=>{ prevLen.current=0; await loadConversation(id); setSidebarOpen(false) }
  const journal  = async()=>{ audio.init(); audio.playJournaling(); speechEngine.speakJournalingStart(); prevLen.current=0; await startJournaling(); setSidebarOpen(false) }

  const sidebarIcons = [
    { I:isDark?Sun:Moon,          fn:toggle,                       tip:'Tema'       },
    { I:muted?VolumeOff:Volume,   fn:handleMute,                   tip:'Som'        },
    { I:BarChart,                 fn:()=>navigate('/relatorios'),  tip:'Relatórios' },
    { I:Person,                   fn:()=>navigate('/perfil'),      tip:'Perfil'     },
    { I:LogOut,                   fn:signOut,                      tip:'Sair'       },
  ] as const

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html{-webkit-text-size-adjust:100%;}
    body{-webkit-font-smoothing:antialiased;background:${C.bg};}
    @keyframes tdot      {0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}
    @keyframes blink     {0%,100%{opacity:1}50%{opacity:0}}
    @keyframes fIn       {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes mIn       {from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes sIn       {from{opacity:0;transform:translateX(-100%)}to{opacity:1;transform:translateX(0)}}
    @keyframes footerBeam{0%{background-position:-200% 50%}100%{background-position:200% 50%}}
    @keyframes auraBreath{0%,100%{opacity:.75;transform:translateX(-50%) scaleX(1)}50%{opacity:1;transform:translateX(-50%) scaleX(1.06)}}
    .sb{display:none!important;height:100%;}
    .mhd{display:flex;}
    @media(min-width:768px){.sb{display:flex!important}.mhd{display:none!important}}
    ::-webkit-scrollbar{width:4px;}
    ::-webkit-scrollbar-thumb{background:${isDark?'#334155':'#BFDBFE'};border-radius:4px;}
    textarea{-webkit-appearance:none;font-family:'Inter',sans-serif;}
    textarea::placeholder{color:${C.placeholder}!important;}
  `

  function Sidebar() {
    return (
      <aside style={{width:256,flexShrink:0,height:'100%',display:'flex',flexDirection:'column',background:C.sidebar,borderRight:`1px solid ${C.sidebarB}`}}>
        <div style={{padding:'16px 16px 12px',borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <div style={{width:32,height:32,borderRadius:9,background:C.accentBg,border:`1px solid ${isDark?'#1E40AF':'#BFDBFE'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:`0 0 14px ${ACCENT}22`}}>
              <ClaramenteLogo size={20} accent={ACCENT} />
            </div>
            <div>
              <p style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:"'Inter',sans-serif",letterSpacing:-0.4,margin:0,lineHeight:1.2}}>Claramente</p>
              <p style={{fontSize:10,color:ACCENT,margin:0,fontFamily:"'Inter',sans-serif",opacity:0.7}}>Sua mente em equilíbrio.</p>
            </div>
          </div>
          <button onClick={newChat} style={{width:'100%',height:36,borderRadius:8,border:'none',background:ACCENT,color:'#FFF',fontSize:13,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7,transition:'filter 0.15s',WebkitTapHighlightColor:'transparent'}}
            onMouseEnter={e=>(e.currentTarget.style.filter='brightness(1.1)')}
            onMouseLeave={e=>(e.currentTarget.style.filter='brightness(1)')}>
            <Plus size={14} color="#FFF"/> Nova conversa
          </button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'8px'}}>
          {grouped.length===0&&<p style={{fontSize:13,color:C.textMuted,padding:'24px 8px',textAlign:'center',fontFamily:"'Inter',sans-serif",lineHeight:1.6}}>Nenhuma conversa ainda.</p>}
          {grouped.map(g=>(
            <div key={g.label} style={{marginBottom:4}}>
              <p style={{fontSize:11,fontWeight:600,color:C.textMuted,padding:'10px 8px 4px',letterSpacing:0.6,textTransform:'uppercase',fontFamily:"'Inter',sans-serif"}}>{g.label}</p>
              {g.items.map(c=>{
                const active=conversationId===c.id
                return (
                  <button key={c.id} onClick={loadConv(c.id)} style={{width:'100%',textAlign:'left',padding:'9px 10px',borderRadius:8,border:'none',cursor:'pointer',background:active?C.accentBg:'transparent',display:'block',marginBottom:1,transition:'all 0.12s',WebkitTapHighlightColor:'transparent',minHeight:40}}
                    onMouseEnter={e=>{if(!active)e.currentTarget.style.background=isDark?'#1E293B':'#F0F9FF'}}
                    onMouseLeave={e=>{if(!active)e.currentTarget.style.background='transparent'}}>
                    <p style={{fontSize:13,fontWeight:active?600:400,margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:"'Inter',sans-serif",color:active?ACCENT:C.text}}>{c.title}</p>
                    <p style={{fontSize:12,color:C.textMuted,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:"'Inter',sans-serif"}}>{c.preview}</p>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div style={{padding:'8px',borderTop:`1px solid ${C.border}`}}>
          <button onClick={journal} style={{width:'100%',padding:'9px 10px',borderRadius:8,border:`1px solid ${C.border}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',gap:8,color:C.textSub,fontSize:13,fontWeight:500,fontFamily:"'Inter',sans-serif",transition:'all 0.12s',WebkitTapHighlightColor:'transparent'}}
            onMouseEnter={e=>{e.currentTarget.style.background=C.accentBg;e.currentTarget.style.color=ACCENT;e.currentTarget.style.borderColor=`${ACCENT}40`}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=C.textSub;e.currentTarget.style.borderColor=C.border}}>
            <Sparkle size={14} color="currentColor"/> Journaling guiado
          </button>
        </div>

        <div style={{height:56,padding:'0 12px',borderTop:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-around'}}>
          {sidebarIcons.map(({I,fn,tip})=>(
            <button key={tip} onClick={fn} title={tip} style={{width:36,height:36,borderRadius:8,border:`1px solid ${C.border}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s',WebkitTapHighlightColor:'transparent'}}
              onMouseEnter={e=>{e.currentTarget.style.background=C.accentBg;e.currentTarget.style.borderColor=`${ACCENT}40`}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor=C.border}}>
              <I size={16} color={tip==='Som'&&muted?'#EF4444':C.textMuted}/>
            </button>
          ))}
        </div>
      </aside>
    )
  }

  return (
    <div style={{height:'100dvh',display:'flex',background:C.bg,fontFamily:"'Inter',sans-serif",overflow:'hidden',opacity:mounted?1:0,transition:'opacity 0.3s ease'}}>
      <style>{CSS}</style>
      <FooterAura />
      <div className="sb"><Sidebar /></div>

      {sidebarOpen&&(
        <>
          <div onClick={()=>setSidebarOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:40,backdropFilter:'blur(4px)'}}/>
          <div style={{position:'fixed',top:0,left:0,bottom:0,zIndex:50,animation:'sIn 0.22s ease',width:280,maxWidth:'88vw'}}><Sidebar /></div>
        </>
      )}

      <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}>

        {/* Header mobile com UserNav no canto esquerdo */}
        <header className="mhd" style={{background:C.sidebar,borderBottom:`1px solid ${C.border}`,height:52,padding:'0 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>

          {/* Esquerda: UserNav (foto/inicial + dropdown) */}
          <UserNav isDark={isDark} />

          {/* Centro: logo + nome */}
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <ClaramenteLogo size={24} accent={ACCENT}/>
            <span style={{fontSize:15,fontWeight:700,color:C.text,fontFamily:"'Inter',sans-serif"}}>
              {isJournalingMode?'Journaling':'Claramente'}
            </span>
          </div>

          {/* Direita: mute + menu */}
          <div style={{display:'flex',alignItems:'center',gap:4}}>
            <button onClick={handleMute} style={{width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',background:'none',border:'none',cursor:'pointer',borderRadius:8,WebkitTapHighlightColor:'transparent'}}>
              {muted?<VolumeOff size={16} color="#EF4444"/>:<Volume size={16} color={C.textMuted}/>}
            </button>
            <button onClick={()=>setSidebarOpen(true)} style={{width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',background:'none',border:'none',cursor:'pointer',borderRadius:8,WebkitTapHighlightColor:'transparent'}}>
              <Menu size={18} color={C.textSub}/>
            </button>
          </div>
        </header>

        {isJournalingMode&&(
          <div style={{padding:'8px 20px',background:C.accentBg,borderBottom:`1px solid ${ACCENT}20`,display:'flex',alignItems:'center',gap:8,fontSize:13,fontWeight:500,color:ACCENT,fontFamily:"'Inter',sans-serif"}}>
            <Sparkle size={13} color={ACCENT}/> Modo Journaling Guiado
            <span style={{fontWeight:400,color:C.textMuted,fontSize:12}}>— sessão reflexiva</span>
          </div>
        )}

        {isCrisis&&(
          <div style={{margin:'8px 16px 0',padding:'10px 14px',borderRadius:10,background:isDark?'rgba(239,68,68,0.1)':'#FFF7ED',border:`1px solid ${isDark?'rgba(239,68,68,0.25)':'#FED7AA'}`,fontSize:13,fontWeight:500,color:isDark?'#FCA5A5':'#92400E',fontFamily:"'Inter',sans-serif"}}>
            CVV: <strong>188</strong> · Ligação gratuita, 24h · cvv.org.br
          </div>
        )}

        <div style={{flex:1,overflowY:'auto',padding:'24px 20px 130px'}}>
          <div style={{maxWidth:680,margin:'0 auto',display:'flex',flexDirection:'column'}}>

            {messages.length===0&&(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'40px 0 24px',animation:'fIn 0.4s ease'}}>

                <div style={{marginBottom:20,filter:`drop-shadow(0 0 20px ${ACCENT}45)`}}>
                  <ClaramenteLogo size={70} accent={ACCENT}/>
                </div>

                <h2 style={{fontFamily:"'Inter',sans-serif",fontSize:'clamp(20px,4vw,26px)',fontWeight:700,color:C.text,marginBottom:6,textAlign:'center',letterSpacing:-0.5}}>
                  {!greetDone?<Typewriter text={`Olá, ${firstName}`} speed={45} onDone={()=>setGreetDone(true)}/>:`Olá, ${firstName}`}
                </h2>
                <p style={{fontSize:13,color:C.textMuted,textAlign:'center',fontFamily:"'Inter',sans-serif"}}>Sua mente em equilíbrio.</p>

                {loadingSmartSummary&&<div style={{marginTop:20}}><TypingDots color={ACCENT}/></div>}
                {smartSummary&&!loadingSmartSummary&&(
                  <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:'12px 16px',marginTop:20,width:'100%',animation:'fIn 0.4s ease'}}>
                    <p style={{fontSize:14,color:C.textSub,lineHeight:1.7,margin:0,fontFamily:"'Inter',sans-serif",fontStyle:'italic'}}>{smartSummary}</p>
                  </div>
                )}

                {greetDone&&(
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gridAutoRows:'1fr',gap:10,marginTop:20,width:'100%',animation:'fIn 0.4s ease 0.1s both'}}>
                    <ActionCard title="Journaling guiado" subtitle="Sessão reflexiva profunda" Icon={Sparkle} accent accentColor={ACCENT} isDark={isDark} onClick={()=>{audio.init();journal()}}/>
                    <ActionCard title="Estou ansioso" subtitle="Preciso conversar sobre isso" accentColor={ACCENT} isDark={isDark} onClick={()=>{audio.init();sendMessage('Estou me sentindo ansioso ultimamente.')}}/>
                    <ActionCard title="Quero refletir" subtitle="Momento de introspecção" accentColor={ACCENT} isDark={isDark} onClick={()=>{audio.init();sendMessage('Quero fazer uma reflexão sobre minha vida.')}}/>
                    <ActionCard title="Me sinto bem" subtitle="Compartilhar gratidão" accentColor={ACCENT} isDark={isDark} onClick={()=>{audio.init();sendMessage('Estou me sentindo bem hoje!')}}/>
                  </div>
                )}
              </div>
            )}

            {suggestion&&(
              <div style={{marginBottom:16}}>
                <ProactiveCard message={suggestion.message} action={suggestion.action} onAccept={()=>{dismiss();sendMessage(suggestion.prompt)}} onDismiss={dismiss} delay={500}/>
              </div>
            )}

            {messages.map(msg=>(
              <div key={msg.id} style={{display:'flex',flexDirection:'column',marginBottom:4,animation:'mIn 0.25s ease'}}>
                {msg.role==='user'?(
                  <div style={{display:'flex',justifyContent:'flex-end',padding:'4px 0'}}>
                    <div style={{maxWidth:'min(72%,520px)',padding:'10px 14px',borderRadius:'16px 16px 4px 16px',background:C.userBubble,border:`1px solid ${C.userBorder}`,fontSize:14.5,lineHeight:1.7,color:C.userText,fontFamily:"'Inter',sans-serif",whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
                      {msg.content}
                    </div>
                  </div>
                ):(
                  <div style={{display:'flex',gap:10,alignItems:'flex-start',padding:'6px 0'}}>
                    <BotAvatar size={30} accent={ACCENT}/>
                    <div style={{flex:1,minWidth:0,paddingTop:4,fontSize:14.5,lineHeight:1.75,color:C.text,fontFamily:"'Inter',sans-serif",whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
                      {msg.content}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isTyping&&(
              <div style={{display:'flex',gap:10,alignItems:'flex-start',padding:'6px 0',animation:'fIn 0.2s ease'}}>
                <BotAvatar size={30} accent={ACCENT}/>
                <div style={{paddingTop:8}}><TypingDots color={ACCENT}/></div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>
        </div>

        <div style={{padding:'12px 20px',paddingBottom:'max(12px,env(safe-area-inset-bottom,12px))',background:C.bg,borderTop:`1px solid ${C.border}`,flexShrink:0,position:'relative',zIndex:1}}>
          <div style={{maxWidth:680,margin:'0 auto'}}>
            <div style={{display:'flex',gap:8,alignItems:'flex-end',background:C.inputBg,borderRadius:14,padding:'8px',border:`1px solid ${C.inputBorder}`,boxShadow:isDark?'0 1px 4px rgba(0,0,0,0.3)':'0 1px 4px rgba(37,99,235,0.06)',transition:'border-color 0.15s,box-shadow 0.15s'}}
              onFocusCapture={e=>{e.currentTarget.style.borderColor=ACCENT;e.currentTarget.style.boxShadow=`0 0 0 3px ${ACCENT}18`}}
              onBlurCapture={e=>{e.currentTarget.style.borderColor=C.inputBorder;e.currentTarget.style.boxShadow=isDark?'0 1px 4px rgba(0,0,0,0.3)':'0 1px 4px rgba(37,99,235,0.06)'}}>
              <textarea ref={taRef} value={input} onChange={e=>{setInput(e.target.value);autoResize()}} onKeyDown={onKey}
                placeholder={isJournalingMode?'Escreva sua reflexão...':'Como você está se sentindo?'} rows={1}
                style={{flex:1,background:'none',border:'none',outline:'none',fontSize:14.5,lineHeight:1.6,resize:'none',fontFamily:"'Inter',sans-serif",color:C.text,maxHeight:120,padding:'7px 8px',display:'block',WebkitAppearance:'none',minWidth:0}}/>
              <button onClick={handleSend} disabled={isTyping||!input.trim()} style={{width:38,height:38,borderRadius:10,border:'none',flexShrink:0,cursor:isTyping||!input.trim()?'not-allowed':'pointer',background:isTyping||!input.trim()?C.btnBg:ACCENT,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s',WebkitTapHighlightColor:'transparent'}}
                onMouseEnter={e=>{if(!isTyping&&input.trim())e.currentTarget.style.filter='brightness(1.12)'}}
                onMouseLeave={e=>(e.currentTarget.style.filter='brightness(1)')}>
                <Send size={15} color={isTyping||!input.trim()?C.textSub:'#FFF'}/>
              </button>
            </div>
            <p style={{textAlign:'center',fontSize:11,color:C.textMuted,marginTop:8,fontFamily:"'Inter',sans-serif"}}>
              {isJournalingMode?'Sessão de journaling guiado ativa':'Não substitui acompanhamento psicológico · CVV: 188'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}