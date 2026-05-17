import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { sendToAI, saveMessage, createConversation } from '@/lib/claudeService'
import { supabase } from '@/lib/supabase'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sentiment?: string
  isCrisis?: boolean
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
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loadingConversations, setLoadingConversations] = useState(false)

  // Buscar lista de conversas
  const fetchConversations = useCallback(async () => {
    if (!user) return
    setLoadingConversations(true)
    try {
      const { data } = await supabase
        .from('conversations')
        .select('id, title, started_at')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(30)

      if (data) {
        // Buscar preview da primeira mensagem do usuário
        const withPreview = await Promise.all(
          data.map(async (conv) => {
            const { data: msgs } = await supabase
              .from('messages')
              .select('content')
              .eq('conversation_id', conv.id)
              .eq('role', 'user')
              .order('created_at', { ascending: true })
              .limit(1)
            return {
              ...conv,
              preview: msgs?.[0]?.content || 'Conversa vazia',
            }
          })
        )
        setConversations(withPreview)
      }
    } finally {
      setLoadingConversations(false)
    }
  }, [user])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Carregar conversa existente
  const loadConversation = useCallback(async (convId: string) => {
    if (!user) return
    setMessages([])
    setConversationId(convId)
    setIsCrisis(false)

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        sentiment: m.sentiment,
      })))
    }
  }, [user])

  // Nova conversa
  const resetChat = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setIsCrisis(false)
  }, [])

  // Enviar mensagem
  const sendMessage = useCallback(async (content: string) => {
    if (!user) return

    let convId = conversationId
    if (!convId) {
      convId = await createConversation(user.id)
      setConversationId(convId)
      setTimeout(fetchConversations, 1000)
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
    }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const response = await sendToAI(content, history, user.id)

      if (response.isCrisis) setIsCrisis(true)

      await saveMessage(convId, user.id, 'user', content)
      await saveMessage(convId, user.id, 'assistant', response.message, response.sentiment, response.emotions)

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        sentiment: response.sentiment,
        isCrisis: response.isCrisis,
      }
      setMessages(prev => [...prev, aiMsg])
      setTimeout(fetchConversations, 500)

    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Tive um problema de conexão. Pode tentar novamente?',
      }])
    } finally {
      setIsTyping(false)
    }
  }, [user, conversationId, messages, fetchConversations])

  return {
    messages, isTyping, isCrisis,
    conversationId, conversations, loadingConversations,
    sendMessage, resetChat, loadConversation, fetchConversations,
  }
}