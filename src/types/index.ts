export interface Profile {
  id: string
  name: string
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed'
  emotions?: string[]
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  started_at: string
  message_count: number
}

export interface Report {
  id: string
  user_id: string
  period_type: 'daily' | 'weekly' | 'monthly' | 'annual'
  period_start: string
  period_end: string
  dominant_mood?: string
  recurring_themes?: string[]
  progress_notes?: string
  suggestions?: string[]
  message_count: number
  created_at: string
}