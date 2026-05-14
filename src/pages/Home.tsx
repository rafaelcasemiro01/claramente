import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useChat } from '@/hooks/useChat'

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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div style={{minHeight:'100vh', display:'flex', flexDirection:'column', background:'#f7f5f0'}}>

      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #ede9e3',
        padding: '0 20px',
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
      }}>
        {/* Logo */}
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <div style={{width: 34, height: 34, borderRadius: '50%', background: '#e6f4ed', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2d7a4a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5"/>
              <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5"/>
            </svg>
          </div>
          <span style={{fontFamily:'Lora, serif', fontSize: 18, fontWeight: 600, color: '#1a2e1a'}}>Claramente</span>
        </div>

        {/* Ações desktop */}
        <div className="hidden-mobile" style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <button onClick={resetChat} style={{fontSize: 13, color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 8}}>
            Nova conversa
          </button>
          <button onClick={() => navigate('/relatorios')} style={{
            fontSize: 13, fontWeight: 600, color: '#2d7a4a', background: '#e6f4ed',
            border: 'none', cursor: 'pointer', padding: '7px 14px', borderRadius: 20,
          }}>
            📊 Relatórios
          </button>
          <div style={{width: 1, height: 20, background: '#ede9e3'}}/>
          <span style={{fontSize: 13, color: '#888'}}>Olá, {profile?.name?.split(' ')[0] || 'você'}</span>
          <button onClick={signOut} style={{fontSize: 13, color: '#cf4040', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 8}}>
            Sair
          </button>
        </div>

        {/* Hambúrguer mobile */}
        <button onClick={() => setMenuOpen(!menuOpen)}
          style={{display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 6}}
          className="show-mobile">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round">
            {menuOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
      </header>

      {/* Menu mobile dropdown */}
      {menuOpen && (
        <div style={{
          background: 'white', borderBottom: '1px solid #ede9e3',
          padding: '8px 20px 16px', display: 'flex', flexDirection: 'column', gap: 4,
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        }}>
          <div style={{fontSize: 13, color: '#888', padding: '8px 0', borderBottom: '1px solid #f5f5f5', marginBottom: 4}}>
            Olá, <strong style={{color: '#1a2e1a'}}>{profile?.name?.split(' ')[0] || 'você'}</strong> 👋
          </div>
          <button onClick={() => { resetChat(); setMenuOpen(false) }}
            style={{textAlign:'left', fontSize: 14, color: '#444', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0', display: 'flex', alignItems: 'center', gap: 10}}>
            <span style={{fontSize: 18}}>💬</span> Nova conversa
          </button>
          <button onClick={() => { navigate('/relatorios'); setMenuOpen(false) }}
            style={{textAlign:'left', fontSize: 14, color: '#2d7a4a', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600}}>
            <span style={{fontSize: 18}}>📊</span> Relatórios
          </button>
          <button onClick={signOut}
            style={{textAlign:'left', fontSize: 14, color: '#cf4040', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0', display: 'flex', alignItems: 'center', gap: 10}}>
            <span style={{fontSize: 18}}>🚪</span> Sair da conta
          </button>
        </div>
      )}

      {/* Banner crise */}
      {isCrisis && (
        <div style={{margin: '12px 16px 0', padding: '12px 16px', borderRadius: 14, background: '#fff7ed', border: '1px solid #fec89a', fontSize: 13, color: '#92400e', lineHeight: 1.5}}>
          🆘 Se você estiver em crise, ligue para o <strong>CVV: 188</strong> (gratuito, 24h) ou acesse <strong>cvv.org.br</strong>
        </div>
      )}

      {/* Mensagens */}
      <div style={{flex: 1, overflowY: 'auto', padding: '20px 16px'}}>
        <div style={{maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16}}>

          {messages.length === 0 && (
            <div style={{display:'flex', gap: 12, alignItems:'flex-end'}}>
              <div style={{width: 36, height: 36, borderRadius: '50%', background: '#e6f4ed', flexShrink: 0, display:'flex', alignItems:'center', justifyContent:'center'}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2d7a4a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5"/>
                  <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5"/>
                </svg>
              </div>
              <div style={{background:'white', borderRadius:'18px 18px 18px 4px', padding:'14px 18px', maxWidth:'80%', fontSize:14, lineHeight:1.65, color:'#2c2c2a', boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
                Olá, {profile?.name?.split(' ')[0] || 'seja bem-vindo'}! 🌿<br/><br/>
                Este é seu espaço seguro de introspecção. Como você está se sentindo hoje?
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} style={{display:'flex', gap: 12, alignItems:'flex-end', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'}}>
              {msg.role === 'assistant' && (
                <div style={{width:36, height:36, borderRadius:'50%', background:'#e6f4ed', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center'}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2d7a4a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                    <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5"/>
                    <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5"/>
                  </svg>
                </div>
              )}
              <div style={{
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                padding: '12px 16px', maxWidth: '75%', fontSize: 14, lineHeight: 1.65,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                background: msg.role === 'user' ? 'linear-gradient(135deg, #2d7a4a, #1a4a2e)' : 'white',
                color: msg.role === 'user' ? 'white' : '#2c2c2a',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={{display:'flex', gap:12, alignItems:'flex-end'}}>
              <div style={{width:36, height:36, borderRadius:'50%', background:'#e6f4ed', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center'}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2d7a4a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5"/>
                  <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5"/>
                </svg>
              </div>
              <div style={{background:'white', borderRadius:'18px 18px 18px 4px', padding:'14px 18px', display:'flex', gap:5, boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
                {[0,1,2].map(i => (
                  <div key={i} style={{width:8, height:8, borderRadius:'50%', background:'#3d8b5a', animation:`bounceDot 1.2s ${i*0.15}s infinite`}}/>
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>
      </div>

      {/* Input */}
      <div style={{background:'white', borderTop:'1px solid #ede9e3', padding:'12px 16px 20px', boxShadow:'0 -2px 12px rgba(0,0,0,0.04)'}}>
        <div style={{maxWidth:640, margin:'0 auto', display:'flex', gap:10, alignItems:'flex-end'}}>
          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Compartilhe seus pensamentos..."
            rows={1}
            style={{
              flex:1, padding:'12px 16px', borderRadius:20, border:'1.5px solid #e8e5e0',
              fontSize:14, resize:'none', outline:'none', fontFamily:'Plus Jakarta Sans, sans-serif',
              background:'#fafaf8', lineHeight:1.5, maxHeight:100, transition:'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor='#2d7a4a'}
            onBlur={e => e.target.style.borderColor='#e8e5e0'}
          />
          <button onClick={handleSend} disabled={isTyping || !input.trim()}
            style={{
              width:46, height:46, borderRadius:'50%', border:'none', cursor: isTyping || !input.trim() ? 'not-allowed':'pointer',
              background: isTyping || !input.trim() ? '#c8ddd0' : 'linear-gradient(135deg, #2d7a4a, #1a4a2e)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              transition:'all 0.2s',
              boxShadow: isTyping || !input.trim() ? 'none' : '0 4px 12px rgba(45,122,74,0.35)',
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p style={{textAlign:'center', fontSize:11, color:'#bbb', marginTop:8, marginBottom:0}}>
          Não substitui acompanhamento psicológico profissional · CVV: 188
        </p>
      </div>

      {/* CSS responsivo */}
      <style>{`
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 641px) {
          .show-mobile { display: none !important; }
        }
        @keyframes bounceDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}