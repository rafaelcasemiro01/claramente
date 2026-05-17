import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { sendToAI, saveMessage, createConversation } from '@/lib/claudeService'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sentiment?: string
  isCrisis?: boolean
}

export function useChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [isCrisis, setIsCrisis] = useState(false)

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !content.trim()) return

    // Criar conversa se não existir
    let convId = conversationId
    if (!convId) {
      convId = await createConversation(user.id)
      setConversationId(convId)
    }

    // Adicionar mensagem do usuário
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content
    }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const response = await sendToAI(content, history, user.id)

      if (response.isCrisis) setIsCrisis(true)

      // Salvar no banco
      await saveMessage(convId, user.id, 'user', content)
      await saveMessage(convId, user.id, 'assistant', response.message, response.sentiment, response.emotions)

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        sentiment: response.sentiment,
        isCrisis: response.isCrisis
      }
      setMessages(prev => [...prev, aiMsg])

    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Tive um problema. Pode tentar novamente?'
      }])
    } finally {
      setIsTyping(false)
    }
  }, [user, conversationId, messages])

  const resetChat = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setIsCrisis(false)
  }, [])

  return { messages, isTyping, isCrisis, sendMessage, resetChat }
}