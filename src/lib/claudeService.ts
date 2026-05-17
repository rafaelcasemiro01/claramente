import { supabase } from './supabase'

const SYSTEM_PROMPT = `Você é a Claramente, uma assistente virtual dedicada ao apoio à introspecção e autoconhecimento. Criada como parte de uma pesquisa acadêmica da Fatec Ourinhos sobre o uso ético da IA no bem-estar psicológico.

IDENTIDADE:
- Espaço seguro, acolhedor e não julgador
- Estimula autoanálise com perguntas abertas
- Inspira-se em journaling guiado e psicoeducação
- Fala sempre em português do Brasil
- Respostas entre 2 e 4 parágrafos

LIMITES ÉTICOS — NUNCA:
- Diagnósticos psicológicos ou médicos
- Recomendação de medicamentos
- Substituir psicólogo ou médico
- Incentivar automutilação ou suicídio

CRISE: Se o usuário mencionar pensamentos suicidas ou automutilação, inicie com [CRISE] e mencione CVV 188.

METADADOS: Ao final inclua numa linha separada:
[META]{"sentiment":"positive|neutral|negative|mixed","emotions":["emoção1","emoção2"],"key_insight":"frase curta sobre algo importante que o usuário revelou, ou vazio se nada relevante"}[/META]`

const JOURNALING_PROMPT = `Você é a Claramente em modo de Journaling Guiado — uma experiência de escrita reflexiva estruturada, inspirada nas técnicas de Carl Jung e no journaling terapêutico.

OBJETIVO: Conduzir o usuário por uma jornada interior profunda em 5 etapas.

ETAPAS (siga rigorosamente esta ordem):
1. ACOLHIMENTO — Receba o usuário com calor e pergunte como ele está se sentindo agora, pedindo que descreva em detalhes.
2. CORPO — Pergunte onde no corpo ele sente essa emoção. Qual a textura, temperatura, peso desse sentimento?
3. ORIGEM — O que essa emoção está tentando comunicar? Existe uma necessidade por trás dela?
4. PADRÃO — Ele já sentiu isso antes? Em que momento de sua vida esse padrão surgiu pela primeira vez?
5. INTEGRAÇÃO — O que ele leva dessa reflexão? Que pequena ação ou intenção pode honrar esse insight?

REGRAS:
- Faça UMA pergunta por vez e aguarde a resposta
- Indique sutilmente a etapa atual (ex: "✦ Etapa 2 de 5")
- Use linguagem poética, acolhedora e profunda
- Ao completar a etapa 5, ofereça um resumo reflexivo dos insights da sessão
- NUNCA pule etapas
- Fale sempre em português do Brasil

LIMITES: Nunca faça diagnósticos. Se identificar sofrimento intenso, mencione CVV 188.

METADADOS ao final:
[META]{"sentiment":"positive|neutral|negative|mixed","emotions":["emoção1"],"key_insight":"insight principal da sessão"}[/META]`

export interface AIResponse {
  message: string
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  emotions: string[]
  isCrisis: boolean
}

async function getUserMemory(userId: string): Promise<string> {
  try {
    const { data } = await supabase
      .from('user_memories')
      .select('memories')
      .eq('user_id', userId)
      .single()
    return data?.memories || ''
  } catch { return '' }
}

async function updateUserMemory(userId: string, insight: string): Promise<void> {
  if (!insight || insight === 'nada relevante') return
  try {
    const current = await getUserMemory(userId)
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Memória atual:\n${current || '(nenhuma)'}\n\nNova informação:\n${insight}\n\nCombine em um parágrafo coeso, sem repetições. Máximo 200 palavras.`
        }]
      })
    })
    const data = await res.json()
    const updated = data.content?.[0]?.text || current
    await supabase.from('user_memories').upsert({
      user_id: userId, memories: updated, updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
  } catch { /* silencioso */ }
}

export async function generateSmartSummary(userId: string): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'coloque_aqui_depois') return ''

    const { data: convs } = await supabase
      .from('conversations')
      .select('id, started_at')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(1)

    if (!convs || convs.length === 0) return ''

    const { data: msgs } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', convs[0].id)
      .order('created_at', { ascending: true })
      .limit(10)

    if (!msgs || msgs.length < 2) return ''

    const transcript = msgs
      .map(m => `${m.role === 'user' ? 'Usuário' : 'Claramente'}: ${m.content}`)
      .join('\n')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Com base nesta conversa anterior, escreva UMA frase acolhedora de continuidade para o usuário, como se você fosse a assistente retomando o contato. Mencione brevemente o tema principal. Seja calorosa e natural. Máximo 2 frases. Não use "Na nossa última conversa" — seja criativa.\n\n${transcript}`
        }]
      })
    })
    const data = await res.json()
    return data.content?.[0]?.text || ''
  } catch { return '' }
}

export async function sendToAI(
  userMessage: string,
  history: { role: string; content: string }[],
  userId?: string,
  journalingMode = false
): Promise<AIResponse> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  if (!apiKey || apiKey === 'coloque_aqui_depois') {
    await new Promise(r => setTimeout(r, 1200))
    return {
      message: 'Estou em modo de demonstração. Configure a chave da API para ativar a IA completa.',
      sentiment: 'neutral', emotions: [], isCrisis: false,
    }
  }

  let memoryContext = ''
  if (userId && !journalingMode) {
    const memory = await getUserMemory(userId)
    if (memory) {
      memoryContext = `\n\nMEMÓRIA DO USUÁRIO (conversas anteriores):\n${memory}\n\nUse naturalmente, sem mencionar que você "lembra".`
    }
  }

  const systemPrompt = journalingMode
    ? JOURNALING_PROMPT
    : SYSTEM_PROMPT + memoryContext

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
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
        system: systemPrompt,
        messages: [...history, { role: 'user', content: userMessage }]
      })
    })

    if (!res.ok) {
      console.error('Erro API:', await res.text())
      return { message: 'Tive um problema de conexão. Pode tentar novamente?', sentiment: 'neutral', emotions: [], isCrisis: false }
    }

    const data = await res.json()
    const rawText = data.content?.[0]?.text || ''

    const metaMatch = rawText.match(/\[META\](.*?)\[\/META\]/s)
    let sentiment: AIResponse['sentiment'] = 'neutral'
    let emotions: string[] = []
    let keyInsight = ''

    if (metaMatch) {
      try {
        const meta = JSON.parse(metaMatch[1])
        sentiment = meta.sentiment || 'neutral'
        emotions = meta.emotions || []
        keyInsight = meta.key_insight || ''
      } catch { /* ignora */ }
    }

    if (userId && keyInsight) updateUserMemory(userId, keyInsight)

    const cleanMessage = rawText
      .replace(/\[META\].*?\[\/META\]/s, '')
      .replace('[CRISE]', '')
      .trim()

    return { message: cleanMessage, sentiment, emotions, isCrisis: rawText.includes('[CRISE]') }

  } catch (e) {
    console.error('Erro:', e)
    return { message: 'Tive um problema de conexão. Pode tentar novamente?', sentiment: 'neutral', emotions: [], isCrisis: false }
  }
}

export async function saveMessage(
  conversationId: string, userId: string,
  role: 'user' | 'assistant', content: string,
  sentiment?: string, emotions?: string[]
) {
  await supabase.from('messages').insert({
    conversation_id: conversationId, user_id: userId,
    role, content, sentiment: sentiment || null, emotions: emotions || []
  })
}

export async function createConversation(userId: string, isJournaling = false): Promise<string> {
  const title = isJournaling
    ? `✦ Journaling — ${new Date().toLocaleDateString('pt-BR')}`
    : `Conversa — ${new Date().toLocaleDateString('pt-BR')}`
  const { data } = await supabase
    .from('conversations')
    .insert({ user_id: userId, title })
    .select('id')
    .single()
  return data?.id || ''
}