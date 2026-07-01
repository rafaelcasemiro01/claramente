// src/hooks/useGuestSession.ts
// ─────────────────────────────────────────────────────────────────────
// Fluxo "guest-first": deixa a pessoa usar o Claramente sem conta e só
// oferece o login quando ela tenta GUARDAR algo (salvar conversa, abrir
// histórico ou relatórios).
//
// - isGuest       → true quando não há usuário autenticado
// - guestMessages → mensagens da sessão de visitante (memória + sessionStorage)
// - gateReason    → motivo do soft-gate aberto (null = fechado)
// - openGate(r)   → abre o soft-gate com um motivo
// - showBanner    → true quando vale sugerir a criação de conta (após 2 msgs)
//
// As mensagens de visitante NÃO vão para o Supabase — vivem só na sessão
// do navegador e somem ao criar conta (quando passam a ser persistidas).
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export type GuestRole = 'user' | 'assistant'

export interface GuestMessage {
  id: string
  role: GuestRole
  content: string
}

/** Motivos possíveis para o soft-gate de login. */
export type GateReason = 'save' | 'history' | 'reports' | 'generic'

const STORAGE_KEY = 'claramente_guest_session'

function loadStored(): GuestMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as GuestMessage[]) : []
  } catch {
    return []
  }
}

export function useGuestSession() {
  const { user } = useAuth()
  const isGuest = !user

  const [guestMessages, setGuestMessages] = useState<GuestMessage[]>(loadStored)
  const [gateReason, setGateReason] = useState<GateReason | null>(null)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  // Persiste as mensagens do visitante na sessão (sobrevive a refresh).
  useEffect(() => {
    if (!isGuest) return
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(guestMessages))
    } catch {
      /* storage cheio / indisponível — segue em memória */
    }
  }, [guestMessages, isGuest])

  // Ao autenticar, a sessão de visitante deixa de ser necessária.
  useEffect(() => {
    if (!isGuest) {
      try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* noop */ }
    }
  }, [isGuest])

  const addGuestMessage = useCallback((role: GuestRole, content: string) => {
    setGuestMessages(prev => [
      ...prev,
      { id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, role, content },
    ])
  }, [])

  const resetGuest = useCallback(() => {
    setGuestMessages([])
    setBannerDismissed(false)
  }, [])

  const openGate = useCallback((reason: GateReason = 'generic') => setGateReason(reason), [])
  const closeGate = useCallback(() => setGateReason(null), [])
  const dismissBanner = useCallback(() => setBannerDismissed(true), [])

  const userMsgCount = useMemo(
    () => guestMessages.filter(m => m.role === 'user').length,
    [guestMessages],
  )

  /** Sugere criar conta depois de um mínimo de troca — sem ser intrusivo. */
  const showBanner = isGuest && userMsgCount >= 2 && !bannerDismissed && gateReason === null

  /**
   * Envolve uma ação que exige persistência. Se for visitante, abre o
   * soft-gate e devolve false (a ação não segue). Se estiver logado,
   * devolve true (a ação pode prosseguir normalmente).
   *
   *   if (!requireAccount('reports')) return
   *   navigate('/relatorios')
   */
  const requireAccount = useCallback(
    (reason: GateReason = 'generic') => {
      if (isGuest) { setGateReason(reason); return false }
      return true
    },
    [isGuest],
  )

  return {
    isGuest,
    guestMessages,
    addGuestMessage,
    resetGuest,
    gateReason,
    openGate,
    closeGate,
    requireAccount,
    userMsgCount,
    showBanner,
    dismissBanner,
  }
}
