// src/types/index.ts
// ─────────────────────────────────────────────────────────────────────
// Tipos compartilhados da aplicação Claramente.
// ─────────────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  name: string
  created_at: string

  avatar_url?: string | null

  // ── Onboarding inclusivo ──
  pronouns?: string | null
  gender?: string | null
  sexual_orientation?: string | null
  birth_date?: string | null
  phone?: string | null
  onboarding_completed?: boolean

  updated_at?: string
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

// ── Check-in diário ────────────────────────────────────────────────
export type Mood = 'happy' | 'serene' | 'neutral' | 'anxious' | 'sad'

export interface DailyCheckin {
  id: string
  user_id: string
  mood: Mood
  note?: string | null
  /** Data do check-in no formato YYYY-MM-DD. */
  checkin_date: string
  created_at: string
}
