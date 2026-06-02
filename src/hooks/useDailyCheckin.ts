// src/hooks/useDailyCheckin.ts
// ─────────────────────────────────────────────────────────────────────
// Hook que gerencia o check-in diário de humor do usuário.
//   • Carrega o check-in de hoje (se existir)
//   • Permite criar/atualizar o check-in
//   • Permite carregar histórico para o heatmap
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { DailyCheckin, Mood } from '@/types'

/** Data de hoje no fuso local em YYYY-MM-DD. */
export function todayLocal(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function useDailyCheckin() {
  const { user } = useAuth()
  const [todayCheckin, setTodayCheckin] = useState<DailyCheckin | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user.id)
      .eq('checkin_date', todayLocal())
      .maybeSingle()
    setTodayCheckin((data as DailyCheckin) || null)
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  /** Cria ou atualiza o check-in de hoje. */
  const submit = useCallback(async (mood: Mood, note?: string) => {
    if (!user) return null
    setSaving(true)
    const payload = {
      user_id: user.id,
      mood,
      note: note?.trim() || null,
      checkin_date: todayLocal(),
    }
    const { data, error } = await supabase
      .from('daily_checkins')
      .upsert(payload, { onConflict: 'user_id,checkin_date' })
      .select()
      .single()
    setSaving(false)
    if (error) {
      console.error('Erro ao salvar check-in:', error)
      return null
    }
    setTodayCheckin(data as DailyCheckin)
    return data as DailyCheckin
  }, [user])

  /** Carrega histórico dos últimos N dias para o heatmap. */
  const loadHistory = useCallback(async (days = 35): Promise<DailyCheckin[]> => {
    if (!user) return []
    const since = new Date()
    since.setDate(since.getDate() - days)
    const sinceStr = since.toISOString().split('T')[0]
    const { data } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user.id)
      .gte('checkin_date', sinceStr)
      .order('checkin_date', { ascending: true })
    return (data || []) as DailyCheckin[]
  }, [user])

  return { todayCheckin, loading, saving, submit, loadHistory, reload: load }
}
