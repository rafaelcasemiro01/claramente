// src/hooks/useVoiceInput.ts
// ─────────────────────────────────────────────────────────────────────
// Hook para gravação de voz com transcrição em tempo real.
//
// v2 — melhorias:
//   • Pede permissão de microfone explicitamente (getUserMedia)
//   • Detecta iOS Safari (que não suporta SpeechRecognition)
//   • Mensagens de erro detalhadas e amigáveis
//   • Lida com auto-stop e timeouts
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from 'react'

// ── Tipos da Web Speech API ─────────────────────────────────────────
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  [index: number]: SpeechRecognitionAlternative
}
interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

type SR = new () => SpeechRecognitionLike

function getSR(): SR | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SR
    webkitSpeechRecognition?: SR
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/** Detecta iOS (incluindo iPad). iOS Safari não suporta SpeechRecognition. */
function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua)
    || (ua.includes('Mac') && 'ontouchend' in document)
}

export interface VoiceInputApi {
  isSupported: boolean
  isListening: boolean
  transcript: string
  error: string | null
  /** Razão específica caso não suporte. */
  unsupportedReason: string | null
  start: () => Promise<void>
  stop: () => void
  reset: () => void
}

export function useVoiceInput(lang = 'pt-BR'): VoiceInputApi {
  const [isListening, setIsListening] = useState(false)
  const [transcript,  setTranscript]  = useState('')
  const [error,       setError]       = useState<string | null>(null)

  const recRef     = useRef<SpeechRecognitionLike | null>(null)
  const finalRef   = useRef<string>('')

  const SRClass    = getSR()
  const isIOSDevice = isIOS()
  const isSupported = !!SRClass && !isIOSDevice
  const unsupportedReason = !SRClass
    ? 'Seu navegador não suporta gravação de voz. Use Chrome ou Edge.'
    : isIOSDevice
      ? 'O iOS (iPhone/iPad) ainda não permite gravação de voz em apps web. Tente em um Android ou no computador.'
      : null

  // Cria a instância só uma vez
  useEffect(() => {
    if (!SRClass || isIOSDevice) return
    const rec = new SRClass()
    rec.lang = lang
    rec.continuous = false
    rec.interimResults = true

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalRef.current += r[0].transcript
        else           interim += r[0].transcript
      }
      setTranscript((finalRef.current + interim).trim())
    }
    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      const err = e.error
      switch (err) {
        case 'no-speech':
          setError('Não consegui ouvir nada. Tente falar mais perto do microfone.')
          break
        case 'not-allowed':
        case 'service-not-allowed':
          setError('Permissão de microfone negada. Habilite nas configurações do navegador.')
          break
        case 'audio-capture':
          setError('Microfone não encontrado ou indisponível.')
          break
        case 'network':
          setError('Sem conexão para reconhecimento de voz.')
          break
        case 'aborted':
          // silencioso — usuário cancelou
          break
        default:
          setError(`Erro de reconhecimento: ${err}`)
      }
      setIsListening(false)
    }
    rec.onend = () => setIsListening(false)

    recRef.current = rec

    return () => {
      try { rec.abort() } catch { /* ignora */ }
      recRef.current = null
    }
  }, [SRClass, lang, isIOSDevice])

  const start = useCallback(async () => {
    if (isIOSDevice) {
      setError('O iOS não permite gravação de voz por web. Tente em um Android ou computador.')
      return
    }
    if (!recRef.current || isListening) return

    setError(null)
    finalRef.current = ''
    setTranscript('')

    // ── Permissão explícita de microfone (mais confiável que esperar o SR pedir) ──
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Para o stream — só queremos a permissão, o SR vai pegar seu próprio handle
        stream.getTracks().forEach(t => t.stop())
      }
    } catch (e) {
      const err = e as { name?: string }
      if (err.name === 'NotAllowedError') {
        setError('Permissão de microfone negada. Habilite nas configurações do site.')
      } else if (err.name === 'NotFoundError') {
        setError('Microfone não encontrado neste dispositivo.')
      } else {
        setError('Não foi possível acessar o microfone.')
      }
      return
    }

    try {
      recRef.current.start()
      setIsListening(true)
    } catch (e) {
      const err = e as { message?: string }
      if (err.message?.includes('already started')) {
        // Caso edge: tenta parar e iniciar de novo
        try { recRef.current.stop() } catch { /* ignora */ }
        setIsListening(false)
      } else {
        setError('Não foi possível iniciar a gravação.')
      }
    }
  }, [isListening, isIOSDevice])

  const stop = useCallback(() => {
    if (!recRef.current) return
    try { recRef.current.stop() } catch { /* ignora */ }
    setIsListening(false)
  }, [])

  const reset = useCallback(() => {
    finalRef.current = ''
    setTranscript('')
    setError(null)
  }, [])

  return {
    isSupported,
    isListening,
    transcript,
    error,
    unsupportedReason,
    start,
    stop,
    reset,
  }
}
