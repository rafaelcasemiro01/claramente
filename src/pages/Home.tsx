import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useChat } from '@/hooks/useChat'

const ClaramenteLogo = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path d="M24 4L42 15V33L24 44L6 33V15Z" fill="#7C3AED" fillOpacity="0.15" stroke="#7C3AED" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M24 4L6 15H42L24 4Z" fill="#7C3AED" fillOpacity="0.3"/>
    <path d="M6 15L24 26M42 15L24 26" stroke="#7C3AED" strokeWidth="1.2" strokeOpacity="0.7"/>
    <path d="M24 26L24 44" stroke="#7C3AED" strokeWidth="1.2" strokeOpacity="0.5"/>
    <circle cx="24" cy="26" r="2.5" fill="#7C3AED"/>
  </svg>
)

const BotAvatar = () => (
  <div style={{width:36, height:36, borderRadius:'50%', background:'#EDE9FE', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center'}}>
    <ClaramenteLogo size={22} />
  </div>
)

export default function Home() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { messages, isTyping, isCrisis, sendMessage, resetChat } = useChat()
  const [input, setInput] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  async function handleSend() {
    if (!input.trim() || isTyping) return
    const text = input.trim()
    setInput('')
    await sendMessage(text)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div style={{minHeight:'100vh', display:'flex', flexDirection:'column', background:'#F5F3FF'}}>
      <style>{`
        @keyframes bounceDot {
          0%,60%,100%{transform:translateY(0);opacity:0.4}
          30%{transform:translateY(-5px);opacity:1}
        }
        @media(max-width:640px){
          .desktop-nav{display:none!important}
          .mobile-menu-btn{display:flex!important}
        }
        @media(min-width:641px){
          .mobile-menu-btn{display:none!important}
        }
      `}</style>

      {/* Header */}
      <header style={{
        background:'white', borderBottom:'1px solid #EDE9FE',
        padding:'0 20px', height:60,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        position:'sticky', top:0, zIndex:20,
        boxShadow:'0 1px 12px rgba(109,40,217,0.06)',
      }}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <ClaramenteLogo size={32} />
          <span style={{fontFamily:'Lora, serif', fontSize:19, fontWeight:600, color:'#2D1B69', letterSpacing:-0.3}}>
            Claramente
          </span>
        </div>

        {/* Desktop nav */}
        <div className="desktop-nav" style={{display:'flex', alignItems:'center', gap:8}}>
          <button onClick={resetChat} style={{fontSize:13, color:'#9CA3AF', background:'none', border:'none', cursor:'pointer', padding:'6px 12px', borderRadius:8, fontFamily:'Plus Jakarta Sans, sans-serif'}}>
            Nova conversa
          </button>
          <button onClick={() => navigate('/relatorios')} style={{
            fontSize:13, fontWeight:600, color:'#7C3AED', background:'#EDE9FE',
            border:'none', cursor:'pointer', padding:'7px 16px', borderRadius:20,
            fontFamily:'Plus Jakarta Sans, sans-serif',
          }}>
            ✦ Relatórios
          </button>
          <div style={{width:1, height:18, background:'#EDE9FE', margin:'0 4px'}}/>
          <span style={{fontSize:13, color:'#9CA3AF', fontFamily:'Plus Jakarta Sans, sans-serif'}}>
            {profile?.name?.split(' ')[0] || 'você'}
          </span>
          <button onClick={signOut} style={{fontSize:13, color:'#EF4444', background:'none', border:'none', cursor:'pointer', padding:'6px 12px', borderRadius:8, fontFamily:'Plus Jakarta Sans, sans-serif'}}>
            Sair
          </button>
        </div>

        {/* Mobile menu btn */}
        <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}
          style={{display:'none', background:'none', border:'none', cursor:'pointer', padding:6, alignItems:'center', justifyContent:'center'}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round">
            {menuOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
      </header>

      {/* Menu mobile */}
      {menuOpen && (
        <div style={{background:'white', borderBottom:'1px solid #EDE9FE', padding:'8px 20px 20px', boxShadow:'0 4px 16px rgba(109,40,217,0.08)'}}>
          <div style={{fontSize:13, color:'#9CA3AF', padding:'10px 0 12px', borderBottom:'1px solid #F5F3FF', marginBottom:8}}>
            Olá, <strong style={{color:'#2D1B69'}}>{profile?.name?.split(' ')[0] || 'você'}</strong> 👋
          </div>
          {[
            { icon:'💬', label:'Nova conversa', action:() => { resetChat(); setMenuOpen(false) }, color:'#1E1B2E' },
            { icon:'✦', label:'Relatórios', action:() => { navigate('/relatorios'); setMenuOpen(false) }, color:'#7C3AED' },
            { icon:'🚪', label:'Sair', action:signOut, color:'#EF4444' },
          ].map(item => (
            <button key={item.label} onClick={item.action} style={{
              display:'flex', alignItems:'center', gap:12, width:'100%',
              textAlign:'left', fontSize:14, color:item.color, background:'none',
              border:'none', cursor:'pointer', padding:'11px 0',
              fontFamily:'Plus Jakarta Sans, sans-serif', fontWeight: item.label==='Relatórios' ? 600 : 400,
            }}>
              <span style={{fontSize:18, width:24, textAlign:'center'}}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Crise */}
      {isCrisis && (
        <div style={{margin:'12px 16px 0', padding:'12px 16px', borderRadius:14, background:'#FFF7ED', border:'1px solid #FED7AA', fontSize:13, color:'#92400E', lineHeight:1.5}}>
          🆘 Se você estiver em crise, ligue para o <strong>CVV: 188</strong> (gratuito, 24h) ou acesse <strong>cvv.org.br</strong>
        </div>
      )}

      {/* Mensagens */}
      <div style={{flex:1, overflowY:'auto', padding:'24px 16px'}}>
        <div style={{maxWidth:640, margin:'0 auto', display:'flex', flexDirection:'column', gap:16}}>

          {messages.length === 0 && (
            <div style={{display:'flex', gap:12, alignItems:'flex-end'}}>
              <BotAvatar />
              <div style={{
                background:'white', borderRadius:'18px 18px 18px 4px',
                padding:'14px 18px', maxWidth:'80%', fontSize:14,
                lineHeight:1.7, color:'#2c2c2a',
                boxShadow:'0 2px 12px rgba(109,40,217,0.08)',
                border:'1px solid #EDE9FE',
              }}>
                Olá, {profile?.name?.split(' ')[0] || 'seja bem-vindo'}! 🔮<br/><br/>
                Este é seu espaço seguro de introspecção e autoconhecimento. Como você está se sentindo hoje?
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} style={{display:'flex', gap:12, alignItems:'flex-end', flexDirection: msg.role==='user' ? 'row-reverse':'row'}}>
              {msg.role==='assistant' && <BotAvatar />}
              <div style={{
                borderRadius: msg.role==='user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                padding:'12px 16px', maxWidth:'78%', fontSize:14,
                lineHeight:1.7, whiteSpace:'pre-wrap', wordBreak:'break-word',
                background: msg.role==='user'
                  ? 'linear-gradient(135deg, #7C3AED, #5B21B6)'
                  : 'white',
                color: msg.role==='user' ? 'white' : '#1E1B2E',
                boxShadow: msg.role==='user'
                  ? '0 4px 12px rgba(124,58,237,0.3)'
                  : '0 2px 12px rgba(109,40,217,0.08)',
                border: msg.role==='assistant' ? '1px solid #EDE9FE' : 'none',
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={{display:'flex', gap:12, alignItems:'flex-end'}}>
              <BotAvatar />
              <div style={{background:'white', borderRadius:'18px 18px 18px 4px', padding:'16px 20px', display:'flex', gap:6, boxShadow:'0 2px 12px rgba(109,40,217,0.08)', border:'1px solid #EDE9FE'}}>
                {[0,1,2].map(i => (
                  <div key={i} style={{width:8, height:8, borderRadius:'50%', background:'#A78BFA', animation:`bounceDot 1.2s ${i*0.15}s infinite`}}/>
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>
      </div>

      {/* Input */}
      <div style={{background:'white', borderTop:'1px solid #EDE9FE', padding:'14px 16px 24px', boxShadow:'0 -4px 16px rgba(109,40,217,0.06)'}}>
        <div style={{maxWidth:640, margin:'0 auto', display:'flex', gap:10, alignItems:'flex-end'}}>
          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Compartilhe seus pensamentos..." rows={1}
            style={{
              flex:1, padding:'13px 18px', borderRadius:22,
              border:'1.5px solid #E8E4F5', fontSize:14, resize:'none', outline:'none',
              fontFamily:'Plus Jakarta Sans, sans-serif', background:'#FAFAFA',
              lineHeight:1.5, maxHeight:100, color:'#1E1B2E',
              transition:'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor='#7C3AED'; e.target.style.boxShadow='0 0 0 3px rgba(124,58,237,0.08)' }}
            onBlur={e => { e.target.style.borderColor='#E8E4F5'; e.target.style.boxShadow='none' }}
          />
          <button onClick={handleSend} disabled={isTyping || !input.trim()} style={{
            width:48, height:48, borderRadius:'50%', border:'none',
            cursor: isTyping||!input.trim() ? 'not-allowed':'pointer',
            background: isTyping||!input.trim() ? '#DDD8F0' : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            transition:'all 0.2s',
            boxShadow: isTyping||!input.trim() ? 'none' : '0 4px 14px rgba(124,58,237,0.4)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p style={{textAlign:'center', fontSize:11, color:'#C4B5FD', marginTop:8, marginBottom:0}}>
          Não substitui acompanhamento psicológico profissional · CVV: 188
        </p>
      </div>
    </div>
  )
}