// src/types/index.ts
// ─────────────────────────────────────────────────────────────────────
// Tipos compartilhados da aplicação Claramente.
// ─────────────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  name: string
  created_at: string

  /** URL da foto de perfil (Supabase Storage). */
  avatar_url?: string | null

  // ── Onboarding inclusivo ──────────────────────────────────────────
  /** Pronome preferido: 'ele/dele', 'ela/dela', 'elu/delu', 'outro', 'nao_dizer'. */
  pronouns?: string | null
  /** Identidade de gênero: 'mulher_cis', 'homem_cis', 'mulher_trans', 'homem_trans', 'nao_binarie', 'genderfluid', 'agenero', 'outro', 'nao_dizer'. */
  gender?: string | null
  /** Orientação sexual: 'heterossexual', 'homossexual', 'bissexual', 'pansexual', 'assexual', 'queer', 'outro', 'nao_dizer'. */
  sexual_orientation?: string | null
  /** Data de nascimento em formato ISO (YYYY-MM-DD). */
  birth_date?: string | null
  /** Telefone (armazenado sem formatação, só dígitos). */
  phone?: string | null
  /** Flag indicando se o usuário já passou pela tela de onboarding. */
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
