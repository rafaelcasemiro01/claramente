import { useState, useEffect, useRef } from 'react'
import { emotionEngine } from '@/lib/emotionEngine'

export interface ProactiveSuggestion {
  id: string
  message: string
  action: string
  prompt: string
}

const SUGGESTIONS = {
  neutral: [
    { message: 'Como você está se sentindo agora? Às vezes uma reflexão rápida pode trazer muito clareza.', action: 'Refletir', prompt: 'Quero fazer uma breve reflexão sobre como estou me sentindo agora.' },
    { message: 'Já praticou gratidão hoje? Pesquisas mostram que 3 itens de gratidão diários transformam o humor.', action: 'Experimentar', prompt: 'Me guia numa prática rápida de gratidão.' },
  ],
  anxious: [
    { message: 'Percebi um padrão de tensão na nossa conversa. Posso te guiar por uma respiração de 2 minutos?', action: 'Respirar', prompt: 'Me guia em um exercício de respiração para reduzir a ansiedade agora.' },
    { message: 'Às vezes nomear o que sentimos reduz sua intensidade. O que está pesando para você agora?', action: 'Nomear', prompt: 'Quero nomear e processar o que estou sentindo agora.' },
  ],
  negative: [
    { message: 'Estou aqui e percebo que este momento é difícil. Você não precisa enfrentá-lo sozinho.', action: 'Conversar', prompt: 'Preciso de apoio emocional agora.' },
    { message: 'Momentos difíceis passam. Quer que eu te ajude a encontrar um ponto de ancoragem?', action: 'Ancorar', prompt: 'Me ajuda a encontrar um ponto de equilíbrio emocional agora.' },
  ],
  positive: [
    { message: 'Que bom te ver bem! É um ótimo momento para registrar essa energia no journaling.', action: 'Registrar', prompt: 'Quero registrar esse momento positivo no meu diário.' },
    { message: 'Você está em um bom estado. Quer usar esse momento para definir uma intenção para o dia?', action: 'Definir', prompt: 'Me ajuda a definir uma intenção poderosa para hoje.' },
  ],
  reflective: [
    { message: 'Sua energia reflexiva está alta. Um journaling guiado agora pode gerar insights profundos.', action: 'Journaling', prompt: 'Quero iniciar uma sessão de journaling guiado agora.' },
  ],
  mixed: [
    { message: 'Emoções complexas merecem espaço. Quer explorar o que está acontecendo internamente?', action: 'Explorar', prompt: 'Quero explorar essas emoções complexas com você.' },
  ],
}

export function useProactive(messageCount: number, isTyping: boolean) {
  const [suggestion, setSuggestion] = useState<ProactiveSuggestion | null>(null)
  const shown     = useRef<Set<string>>(new Set())
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isTyping || messageCount === 0) return
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      const mood    = emotionEngine.get().mood
      const pool    = SUGGESTIONS[mood] || SUGGESTIONS.neutral
      const unseen  = pool.filter(s => !shown.current.has(s.prompt))
      const source  = unseen.length > 0 ? unseen : pool
      const picked  = source[Math.floor(Math.random() * source.length)]
      shown.current.add(picked.prompt)
      setSuggestion({ ...picked, id: Date.now().toString() })
    }, 45000)   // 45 segundos sem interação

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [messageCount, isTyping])

  const dismiss = () => setSuggestion(null)

  return { suggestion, dismiss }
}