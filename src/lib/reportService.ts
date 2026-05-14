import { supabase } from './supabase'

const REPORT_PROMPT = `Você é um assistente especializado em análise introspectiva. Analise as mensagens abaixo de um usuário do app Claramente e gere um relatório de bem-estar emocional.

REGRAS OBRIGATÓRIAS:
- Nunca faça diagnósticos clínicos
- Use linguagem acolhedora e não técnica
- Sugestões devem ser reflexivas, nunca prescritivas
- Se identificar sofrimento intenso, sugira buscar psicólogo
- Responda APENAS com o JSON, sem texto adicional

Retorne EXATAMENTE neste formato JSON:
{
  "dominant_mood": "descrição do humor predominante em uma frase",
  "recurring_themes": ["tema1", "tema2", "tema3"],
  "progress_notes": "parágrafo acolhedor sobre padrões e observações do período",
  "suggestions": [
    "sugestão reflexiva 1",
    "sugestão reflexiva 2",
    "sugestão reflexiva 3"
  ]
}`

export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'annual'

export const PERIODS = [
  { type: 'daily' as PeriodType,   label: 'Hoje',       days: 1   },
  { type: 'weekly' as PeriodType,  label: 'Esta semana', days: 7   },
  { type: 'monthly' as PeriodType, label: 'Este mês',    days: 30  },
  { type: 'annual' as PeriodType,  label: 'Este ano',    days: 365 },
]

export interface ReportData {
  dominant_mood: string
  recurring_themes: string[]
  progress_notes: string
  suggestions: string[]
  message_count: number
  period_start: string
  period_end: string
  created_at?: string
}

async function fetchUserMessages(userId: string, days: number) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const { data } = await supabase
    .from('messages')
    .select('content, created_at')
    .eq('user_id', userId)
    .eq('role', 'user')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true })
  return data || []
}

async function generateWithClaude(messages: { content: string; created_at: string }[], periodLabel: string): Promise<Omit<ReportData, 'message_count' | 'period_start' | 'period_end'>> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!messages.length) {
    return {
      dominant_mood: 'Nenhuma conversa neste período',
      recurring_themes: [],
      progress_notes: 'Você ainda não teve conversas neste período. Que tal iniciar uma reflexão hoje?',
      suggestions: ['Abra o chat e compartilhe como está se sentindo', 'A introspecção diária traz grandes benefícios', 'Cada pequeno passo conta na jornada do autoconhecimento']
    }
  }

  const summary = messages.map((m, i) => `${i + 1}. "${m.content}" (${new Date(m.created_at).toLocaleDateString('pt-BR')})`).join('\n')

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
      messages: [{ role: 'user', content: `${REPORT_PROMPT}\n\nPeríodo: ${periodLabel}\nMensagens do usuário:\n${summary}` }]
    })
  })

  const data = await response.json()
  const raw = data.content?.[0]?.text || '{}'
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    return {
      dominant_mood: 'Não foi possível analisar',
      recurring_themes: [],
      progress_notes: 'Houve um problema ao gerar o relatório. Tente novamente.',
      suggestions: []
    }
  }
}

export async function generateReport(userId: string, periodType: PeriodType): Promise<ReportData | null> {
  const period = PERIODS.find(p => p.type === periodType)!
  const periodEnd = new Date()
  const periodStart = new Date()
  periodStart.setDate(periodStart.getDate() - period.days)

  const messages = await fetchUserMessages(userId, period.days)
  const analysis = await generateWithClaude(messages, period.label)

  const reportData = {
    user_id: userId,
    period_type: periodType,
    period_start: periodStart.toISOString().split('T')[0],
    period_end: periodEnd.toISOString().split('T')[0],
    dominant_mood: analysis.dominant_mood,
    recurring_themes: analysis.recurring_themes,
    progress_notes: analysis.progress_notes,
    suggestions: analysis.suggestions,
    message_count: messages.length,
  }

  await supabase.from('reports').upsert(reportData, { onConflict: 'user_id,period_type,period_start' })

  return {
    ...analysis,
    message_count: messages.length,
    period_start: reportData.period_start,
    period_end: reportData.period_end,
  }
}

export async function getSavedReports(userId: string) {
  const { data } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)
  return data || []
}