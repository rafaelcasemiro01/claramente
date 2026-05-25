// src/hooks/useVoiceInput.ts
// ─────────────────────────────────────────────────────────────────────
// Hook para gravação de voz com transcrição em tempo real
// usando a Web Speech API (SpeechRecognition).
//
// Funciona em Chrome, Edge, Opera (com prefixo webkit) e Safari.
// Firefox ainda não suporta — o hook devolve `isSupported: false`.
//
// Uso:
//   const { isSupported, isListening, transcript, error, start, stop, reset } = useVoiceInput()
//   <button onClick={isListening ? stop : start}>...</button>
//   <p>{transcript}</p>
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from 'react'

// Tipos da Web Speech API (não estão no DOM padrão por padrão)
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

export interface VoiceInputApi {
  /** True se a Web Speech API está disponível no browser atual. */
  isSupported: boolean
  /** True enquanto a gravação está ativa. */
  isListening: boolean
  /** Transcrição acumulada (final + intermediária). */
  transcript: string
  /** Última mensagem de erro, se houve. */
  error: string | null
  /** Inicia a gravação. */
  start: () => void
  /** Encerra a gravação e mantém o transcript. */
  stop: () => void
  /** Limpa o transcript (útil após enviar). */
  reset: () => void
}

export function useVoiceInput(lang = 'pt-BR'): VoiceInputApi {
  const [isListening, setIsListening] = useState(false)
  const [transcript,  setTranscript]  = useState('')
  const [error,       setError]       = useState<string | null>(null)

  const recRef     = useRef<SpeechRecognitionLike | null>(null)
  const finalRef   = useRef<string>('')
  const SRClass    = getSR()
  const isSupported = !!SRClass

  // Cria a instância só uma vez
  useEffect(() => {
    if (!SRClass) return
    const rec = new SRClass()
    rec.lang = lang
    rec.continuous = false       // para automaticamente quando há silêncio
    rec.interimResults = true    // mostra texto em tempo real

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
      if (err === 'no-speech')       setError('Não ouvi nada. Tente falar mais alto.')
      else if (err === 'not-allowed') setError('Permissão de microfone negada.')
      else if (err === 'audio-capture') setError('Microfone não encontrado.')
      else if (err === 'aborted')    {/* silenciosamente ignora — usuário cancelou */}
      else                            setError('Erro de reconhecimento de voz.')
      setIsListening(false)
    }
    rec.onend = () => setIsListening(false)

    recRef.current = rec

    return () => {
      try { rec.abort() } catch { /* ignora */ }
      recRef.current = null
    }
  }, [SRClass, lang])

  const start = useCallback(() => {
    if (!recRef.current || isListening) return
    setError(null)
    finalRef.current = ''
    setTranscript('')
    try {
      recRef.current.start()
      setIsListening(true)
    } catch {
      setError('Não foi possível iniciar a gravação.')
    }
  }, [isListening])

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

  return { isSupported, isListening, transcript, error, start, stop, reset }
}
