type ResultCallback = (text: string, isFinal: boolean) => void
/* eslint-disable @typescript-eslint/no-explicit-any */

const isMobile = typeof navigator !== 'undefined' &&
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

class SpeechEngine {
  private synth: SpeechSynthesis | null = null
  private recog: any = null
  private muted   = false
  private voice:  SpeechSynthesisVoice | null = null
  private queue:  { text: string; rate: number; pitch: number }[] = []
  private busy    = false
  private shouldRestart = false
  private currentOnEnd:  (() => void) | null = null
  private currentOnResult: ResultCallback | null = null

  constructor() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    this.synth = window.speechSynthesis
    const load = () => {
      const voices = this.synth!.getVoices()
      this.voice =
        voices.find(v => v.lang === 'pt-BR' && v.name.toLowerCase().includes('google')) ||
        voices.find(v => v.lang === 'pt-BR' && !v.localService) ||
        voices.find(v => v.lang === 'pt-BR') ||
        voices.find(v => v.lang.startsWith('pt')) ||
        voices.find(v => v.default) || voices[0] || null
    }
    load()
    this.synth.onvoiceschanged = load
  }

  setMuted(v: boolean) { this.muted = v; if (v) this.stopAll() }
  isMuted()    { return this.muted }
  isSpeaking() { return this.busy || (this.synth?.speaking ?? false) }

  private stopAll() {
    this.synth?.cancel(); this.queue = []; this.busy = false
  }
  stop() { this.stopAll() }

  private clean(text: string): string {
    return text
      .replace(/\[META\].*?\[\/META\]/gs, '')
      .replace(/\[CRISE\]/g, '')
      .replace(/[*_#`✦]/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ', ')
      .replace(/\s{2,}/g, ' ')
      .trim()
  }

  private sentences(text: string): string[] {
    return text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 2)
  }

  private utterance(text: string, rate: number, pitch: number): SpeechSynthesisUtterance {
    const u = new SpeechSynthesisUtterance(text.slice(0, 300))
    if (this.voice) u.voice = this.voice
    u.lang = 'pt-BR'; u.rate = rate; u.pitch = pitch; u.volume = 0.9
    return u
  }

  private processQueue() {
    if (this.muted || !this.synth || this.queue.length === 0) { this.busy = false; return }
    this.busy = true
    const { text, rate, pitch } = this.queue.shift()!
    const u = this.utterance(text, rate, pitch)
    u.onend   = () => setTimeout(() => this.processQueue(), 80)
    u.onerror = () => setTimeout(() => this.processQueue(), 80)
    // iOS workaround: resume if suspended
    if (this.synth.paused) this.synth.resume()
    this.synth.speak(u)
  }

  speak(text: string, opts: { priority?: boolean; rate?: number; pitch?: number } = {}) {
    if (this.muted || !this.synth) return
    if (opts.priority) this.stopAll()
    const cleaned = this.clean(text); if (cleaned.length < 2) return
    const rate = opts.rate ?? 1.05, pitch = opts.pitch ?? 0.92
    this.sentences(cleaned).forEach(s => this.queue.push({ text: s, rate, pitch }))
    if (!this.busy) this.processQueue()
  }

  speakWelcome(name?: string) {
    this.speak(
      name ? `Bem-vindo de volta, ${name}. Sistemas de introspecção online. Como posso ajudá-lo hoje?`
           : 'Bem-vindo ao Claramente. Todos os sistemas estão operacionais.',
      { priority: true, rate: 0.95, pitch: 0.92 }
    )
  }

  speakAck(name?: string) {
    const opts = ['Processando.', 'Entendido.', 'Compreendo.', name ? `Certo, ${name}.` : 'Certo.']
    if (!this.busy && !this.synth?.speaking) {
      this.speak(opts[Math.floor(Math.random() * opts.length)], { rate: 1.08, pitch: 0.92 })
    }
  }

  speakJournalingStart() {
    this.speak('Iniciando sessão de journaling guiado. Vou conduzir você por uma jornada interior.', { priority: true, rate: 0.94, pitch: 0.90 })
  }

  // ── Mobile-compatible recording ──────────────────────────────
  get isRecordingSupported(): boolean {
    return typeof window !== 'undefined' &&
      !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  }

  startRecording(onResult: ResultCallback, onEnd: () => void): boolean {
    if (typeof window === 'undefined') return false
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return false

    this.stopAll()
    this.shouldRestart     = true
    this.currentOnEnd      = onEnd
    this.currentOnResult   = onResult

    this.recog = new SR()
    this.recog.lang             = 'pt-BR'
    this.recog.continuous       = !isMobile   // iOS doesn't support continuous
    this.recog.interimResults   = true
    this.recog.maxAlternatives  = 1

    this.recog.onresult = (e: any) => {
      let interim = '', final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript
        if (e.results[i].isFinal) final += txt
        else interim += txt
      }
      onResult(final || interim, !!final)
      // On mobile: auto-restart after final result
      if (isMobile && final) {
        try { this.recog?.stop() } catch { /* ignore */ }
      }
    }

    this.recog.onerror = (e: any) => {
      if (e.error === 'no-speech' && isMobile && this.shouldRestart) {
        // Restart on mobile for no-speech
        try { setTimeout(() => this.recog?.start(), 100) } catch { /* ignore */ }
        return
      }
      this.shouldRestart = false; onEnd()
    }

    this.recog.onend = () => {
      if (this.shouldRestart && isMobile) {
        try { setTimeout(() => this.recog?.start(), 150) } catch { onEnd() }
      } else {
        onEnd()
      }
    }

    try { this.recog.start(); return true }
    catch { this.shouldRestart = false; return false }
  }

  stopRecording() {
    this.shouldRestart = false
    try { this.recog?.stop() } catch { /* ignore */ }
    this.recog = null
  }
}

export const speechEngine = new SpeechEngine()