import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useChat } from '@/hooks/useChat'

export default function Home() {
  const { profile, signOut } = useAuth()
  const { messages, isTyping, isCrisis, sendMessage, resetChat } = useChat()
  const [input, setInput] = useState('')
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
    <div className="min-h-screen flex flex-col" style={{background:'#fafaf8'}}>
      {/* Header */}
      <header className="border-b border-gray-100 bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background:'#e6f4ed'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2d7a4a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </div>
          <span style={{fontFamily:'Lora,serif', fontSize:'1.2rem', color:'#2c2c2a', fontWeight:600}}>Claramente</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={resetChat} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Nova conversa</button>
          <span className="text-sm text-gray-500">Olá, {profile?.name || 'você'} 👋</span>
          <button onClick={signOut} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Sair</button>
        </div>
      </header>

      {/* Banner de crise */}
      {isCrisis && (
        <div className="mx-4 mt-4 p-3 rounded-xl text-sm" style={{background:'#fff6f0', border:'1px solid #f5c4b3', color:'#993c1d'}}>
          🆘 Se você estiver em crise, ligue para o <strong>CVV: 188</strong> (24h, gratuito) ou acesse <strong>cvv.org.br</strong>
        </div>
      )}

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Boas-vindas */}
          {messages.length === 0 && (
            <div className="flex gap-3 items-end animate-fade-up">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{background:'#e6f4ed'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2d7a4a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </div>
              <div className="rounded-2xl rounded-bl-sm px-4 py-3 max-w-sm text-sm leading-relaxed" style={{background:'#f1efe8', color:'#2c2c2a'}}>
                Olá, {profile?.name || 'seja bem-vindo'}! 🌿<br/><br/>
                Este é seu espaço seguro de introspecção. Como você está se sentindo hoje?
              </div>
            </div>
          )}

          {/* Histórico */}
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 items-end animate-fade-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{background:'#e6f4ed'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2d7a4a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                </div>
              )}
              <div
                className="rounded-2xl px-4 py-3 max-w-sm text-sm leading-relaxed whitespace-pre-wrap"
                style={msg.role === 'user'
                  ? {background:'#e6f4ed', color:'#1a4a2e', borderBottomRightRadius:4}
                  : {background:'#f1efe8', color:'#2c2c2a', borderBottomLeftRadius:4}
                }
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Digitando */}
          {isTyping && (
            <div className="flex gap-3 items-end">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{background:'#e6f4ed'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2d7a4a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </div>
              <div className="rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1" style={{background:'#f1efe8'}}>
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full" style={{background:'#3d8b5a', animation:`bounceDot 1.2s ${i*0.15}s infinite`}}></div>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 bg-white px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-3 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Compartilhe seus pensamentos..."
            rows={2}
            className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-sm resize-none outline-none transition-all"
            style={{fontFamily:'Plus Jakarta Sans, sans-serif'}}
            onFocus={e => e.target.style.borderColor='#3d8b5a'}
            onBlur={e => e.target.style.borderColor='#e5e7eb'}
          />
          <button
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-50"
            style={{background:'#2d7a4a'}}
            onMouseEnter={e => { if(!isTyping) e.currentTarget.style.background='#1a4a2e' }}
            onMouseLeave={e => e.currentTarget.style.background='#2d7a4a'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          Não substitui acompanhamento psicológico profissional · CVV: 188
        </p>
      </div>
    </div>
  )
}