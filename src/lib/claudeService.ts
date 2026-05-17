import { supabase } from './supabase'

const SYSTEM_PROMPT = `Você é a Claramente, uma assistente virtual dedicada ao apoio à introspecção e autoconhecimento. Você foi criada como parte de uma pesquisa acadêmica da Fatec Ourinhos sobre o uso ético da IA no bem-estar psicológico.

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

const MEMORY_EXTRACT_PROMPT = `Você é um assistente que extrai informações relevantes de conversas para memória de longo prazo.

Analise a conversa e extraia APENAS fatos concretos e relevantes sobre o usuário que sejam úteis em conversas futuras:
- Situações de vida (trabalho, relacionamentos, família)
- Padrões emocionais identificados
- Temas recorrentes mencionados
- Conquistas ou dificuldades relatadas
- Preferências comunicadas

NÃO inclua: opiniões da IA, perguntas feitas, conteúdo genérico.
NÃO faça diagnósticos.

Retorne APENAS um parágrafo curto em português com os fatos extraídos, ou "nada relevante" se não houver nada concreto.`

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
  } catch {
    return ''
  }
}

async function updateUserMemory(userId: string, newInsight: string): Promise<void> {
  if (!newInsight || newInsight === 'nada relevante') return
  try {
    const current = await getUserMemory(userId)
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
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
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Memória atual do usuário:\n${current || '(nenhuma ainda)'}\n\nNova informação para adicionar:\n${newInsight}\n\nCombine e atualize a memória em um único parágrafo coeso, sem repetições. Máximo 200 palavras.`
        }]
      })
    })
    const data = await response.json()
    const updatedMemory = data.content?.[0]?.text || current
    await supabase.from('user_memories').upsert({ user_id: userId, memories: updatedMemory, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  } catch { /* silencioso */ }
}

export async function sendToAI(
  userMessage: string,
  history: { role: string; content: string }[],
  userId?: string
): Promise<AIResponse> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  if (!apiKey || apiKey === 'coloque_aqui_depois') {
    await new Promise(r => setTimeout(r, 1200))
    return { message: 'Estou em modo de demonstração. Configure a chave da API para ativar a IA completa.\n\nComo você está se sentindo hoje?', sentiment: 'neutral', emotions: [], isCrisis: false }
  }

  // Buscar memória do usuário
  let memoryContext = ''
  if (userId) {
    const memory = await getUserMemory(userId)
    if (memory) {
      memoryContext = `\n\nMEMÓRIA DO USUÁRIO (informações de conversas anteriores):\n${memory}\n\nUse essas informações para personalizar a conversa, mas não mencione diretamente que você "lembra" — aja naturalmente.`
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
        system: SYSTEM_PROMPT + memoryContext,
        messages: [...history, { role: 'user', content: userMessage }]
      })
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Erro API:', err)
      return { message: 'Tive um problema de conexão. Pode tentar novamente?', sentiment: 'neutral', emotions: [], isCrisis: false }
    }

    const data = await response.json()
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

    // Atualizar memória em background se houver insight relevante
    if (userId && keyInsight) {
      updateUserMemory(userId, keyInsight)
    }

    const cleanMessage = rawText.replace(/\[META\].*?\[\/META\]/s, '').replace('[CRISE]', '').trim()
    return { message: cleanMessage, sentiment, emotions, isCrisis: rawText.includes('[CRISE]') }

  } catch (e) {
    console.error('Erro:', e)
    return { message: 'Tive um problema de conexão. Pode tentar novamente?', sentiment: 'neutral', emotions: [], isCrisis: false }
  }
}

export async function saveMessage(conversationId: string, userId: string, role: 'user' | 'assistant', content: string, sentiment?: string, emotions?: string[]) {
  await supabase.from('messages').insert({ conversation_id: conversationId, user_id: userId, role, content, sentiment: sentiment || null, emotions: emotions || [] })
}

export async function createConversation(userId: string): Promise<string> {
  const { data } = await supabase
    .from('conversations')
    .insert({ user_id: userId, title: `Conversa ${new Date().toLocaleDateString('pt-BR')}` })
    .select('id')
    .single()
  return data?.id || ''
}