import { supabase } from './supabase'

const SYSTEM_PROMPT = `Você é a Claramente, uma assistente virtual acolhedora especializada em apoio emocional, introspecção e autoconhecimento. Você foi criada como parte de uma pesquisa acadêmica da Fatec Ourinhos.

PRINCÍPIOS:
- Seja empática, acolhedora e respeitosa em todas as respostas.
- Fale sempre em português do Brasil.
- Incentive o autoconhecimento e a autorreflexão.
- Faça perguntas abertas para convidar à reflexão.
- Valide os sentimentos sem julgamento.
- Respostas entre 2 e 4 parágrafos.

LIMITES — NUNCA:
- Forneça diagnósticos psicológicos ou médicos.
- Recomende medicamentos.
- Incentive automutilação ou suicídio.

CRISE: Se o usuário mencionar pensamentos suicidas ou automutilação, inicie com [CRISE] e mencione o CVV (188).

METADADOS: Ao final inclua numa linha separada:
[META]{"sentiment":"positive|neutral|negative|mixed","emotions":["emoção1"]}[/META]`

export interface AIResponse {
  message: string
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  emotions: string[]
  isCrisis: boolean
}

export async function sendToAI(
  userMessage: string,
  history: { role: string; content: string }[]
): Promise<AIResponse> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  if (!apiKey || apiKey === 'coloque_aqui_depois') {
    await new Promise(r => setTimeout(r, 1200))
    return {
      message: 'Olá! Estou em modo de demonstração. Configure a chave da API para ativar a IA completa.\n\nComo você está se sentindo hoje?',
      sentiment: 'neutral',
      emotions: ['reflexão'],
      isCrisis: false
    }
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [...history, { role: 'user', content: userMessage }]
      })
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Erro API:', err)
      return {
        message: 'Tive um problema de conexão. Pode tentar novamente?',
        sentiment: 'neutral',
        emotions: [],
        isCrisis: false
      }
    }

    const data = await response.json()
    const rawText = data.content?.[0]?.text || ''

    const metaMatch = rawText.match(/\[META\](.*?)\[\/META\]/s)
    let sentiment: AIResponse['sentiment'] = 'neutral'
    let emotions: string[] = []
    if (metaMatch) {
      try {
        const meta = JSON.parse(metaMatch[1])
        sentiment = meta.sentiment || 'neutral'
        emotions = meta.emotions || []
      } catch { /* ignora */ }
    }

    const cleanMessage = rawText
      .replace(/\[META\].*?\[\/META\]/s, '')
      .replace('[CRISE]', '')
      .trim()

    return {
      message: cleanMessage,
      sentiment,
      emotions,
      isCrisis: rawText.includes('[CRISE]')
    }

  } catch (e) {
    console.error('Erro:', e)
    return {
      message: 'Tive um problema de conexão. Pode tentar novamente?',
      sentiment: 'neutral',
      emotions: [],
      isCrisis: false
    }
  }
}

export async function saveMessage(
  conversationId: string,
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  sentiment?: string,
  emotions?: string[]
) {
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    user_id: userId,
    role,
    content,
    sentiment: sentiment || null,
    emotions: emotions || []
  })
}

export async function createConversation(userId: string): Promise<string> {
  const { data } = await supabase
    .from('conversations')
    .insert({ user_id: userId, title: `Conversa ${new Date().toLocaleDateString('pt-BR')}` })
    .select('id')
    .single()
  return data?.id || ''
}