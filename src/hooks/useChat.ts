import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { sendToAI, saveMessage, createConversation, generateSmartSummary } from '@/lib/claudeService'
import { supabase } from '@/lib/supabase'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sentiment?: string
  isCrisis?: boolean
  isJournaling?: boolean
}

export interface ConversationItem {
  id: string
  title: string
  started_at: string
  preview?: string
}

export function useChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [isCrisis, setIsCrisis] = useState(false)
  const [isJournalingMode, setIsJournalingMode] = useState(false)
  const [smartSummary, setSmartSummary] = useState<string>('')
  const [loadingSmartSummary, setLoadingSmartSummary] = useState(false)
  const [conversations, setConversations] = useState<ConversationItem[]>([])

  const fetchConversations = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('conversations')
      .select('id, title, started_at')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(30)

    if (data) {
      const withPreview = await Promise.all(
        data.map(async conv => {
          const { data: msgs } = await supabase
            .from('messages')
            .select('content')
            .eq('conversation_id', conv.id)
            .eq('role', 'user')
            .order('created_at', { ascending: true })
            .limit(1)
          return { ...conv, preview: msgs?.[0]?.content || 'Conversa vazia' }
        })
      )
      setConversations(withPreview)
    }
  }, [user])

  useEffect(() => { fetchConversations() }, [fetchConversations])

  const loadSmartSummary = useCallback(async () => {
    if (!user) return
    setLoadingSmartSummary(true)
    const summary = await generateSmartSummary(user.id)
    setSmartSummary(summary)
    setLoadingSmartSummary(false)
  }, [user])

  useEffect(() => { loadSmartSummary() }, [loadSmartSummary])

  const loadConversation = useCallback(async (convId: string) => {
    if (!user) return
    setMessages([])
    setConversationId(convId)
    setIsCrisis(false)
    setIsJournalingMode(false)
    setSmartSummary('')

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data.map(m => ({
        id: m.id, role: m.role as 'user' | 'assistant',
        content: m.content, sentiment: m.sentiment,
      })))
    }
  }, [user])

  const resetChat = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setIsCrisis(false)
    setIsJournalingMode(false)
    loadSmartSummary()
  }, [loadSmartSummary])

  const startJournaling = useCallback(async () => {
    if (!user) return
    setMessages([])
    setConversationId(null)
    setIsCrisis(false)
    setIsJournalingMode(true)
    setSmartSummary('')
    setIsTyping(true)

    const convId = await createConversation(user.id, true)
    setConversationId(convId)

    try {
      const response = await sendToAI(
        'Quero iniciar uma sessão de journaling guiado.',
        [], user.id, true
      )
      await saveMessage(convId, user.id, 'user', 'Quero iniciar uma sessão de journaling guiado.')
      await saveMessage(convId, user.id, 'assistant', response.message, response.sentiment, response.emotions)

      setMessages([
        { id: '0', role: 'user', content: 'Quero iniciar uma sessão de journaling guiado.', isJournaling: true },
        { id: '1', role: 'assistant', content: response.message, isJournaling: true },
      ])
      setTimeout(fetchConversations, 1000)
    } catch {
      setMessages([{ id: '0', role: 'assistant', content: 'Tive um problema ao iniciar. Tente novamente.' }])
    } finally {
      setIsTyping(false)
    }
  }, [user, fetchConversations])

  const sendMessage = useCallback(async (content: string) => {
    // ── MODO VISITANTE (sem conta) ─────────────────────────────
    // Conversa real com a IA, mas SEM persistir nada no Supabase.
    // As mensagens vivem só em memória durante a sessão.
    if (!user) {
      const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content }
      setMessages(prev => [...prev, userMsg])
      setIsTyping(true)
      try {
        const history = messages.map(m => ({ role: m.role, content: m.content }))
        const response = await sendToAI(content, history, undefined, false)
        if (response.isCrisis) setIsCrisis(true)
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(), role: 'assistant',
          content: response.message, sentiment: response.sentiment, isCrisis: response.isCrisis,
        }])
      } catch {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(), role: 'assistant',
          content: 'Tive um problema de conexão. Pode tentar novamente?',
        }])
      } finally {
        setIsTyping(false)
      }
      return
    }

    // ── MODO AUTENTICADO (persiste no Supabase) ────────────────
    let convId = conversationId
    if (!convId) {
      convId = await createConversation(user.id, isJournalingMode)
      setConversationId(convId)
      setTimeout(fetchConversations, 1000)
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(), role: 'user', content,
      isJournaling: isJournalingMode,
    }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)
    setSmartSummary('')

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const response = await sendToAI(content, history, user.id, isJournalingMode)

      if (response.isCrisis) setIsCrisis(true)

      await saveMessage(convId, user.id, 'user', content)
      await saveMessage(convId, user.id, 'assistant', response.message, response.sentiment, response.emotions)

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: response.message, sentiment: response.sentiment,
        isCrisis: response.isCrisis, isJournaling: isJournalingMode,
      }])
      setTimeout(fetchConversations, 500)
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: 'Tive um problema de conexão. Pode tentar novamente?',
      }])
    } finally {
      setIsTyping(false)
    }
  }, [user, conversationId, messages, isJournalingMode, fetchConversations])

  return {
    messages, isTyping, isCrisis, isJournalingMode,
    conversationId, conversations, smartSummary, loadingSmartSummary,
    sendMessage, resetChat, loadConversation, fetchConversations, startJournaling,
  }
}
