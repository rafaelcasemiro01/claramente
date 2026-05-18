type ResultCallback = (text: string, isFinal: boolean) => void

/* eslint-disable @typescript-eslint/no-explicit-any */
class SpeechEngine {
  private synth: SpeechSynthesis | null = null
  private recog: any = null
  private voice: SpeechSynthesisVoice | null = null
  private muted = false
  private queue: { text: string; rate: number; pitch: number }[] = []
  private busy  = false

  constructor() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    this.synth = window.speechSynthesis
    this.loadVoice()
    this.synth.onvoiceschanged = () => this.loadVoice()
  }

  private loadVoice() {
    const voices = this.synth!.getVoices()
    this.voice =
      voices.find(v => v.lang === 'pt-BR' && v.name.toLowerCase().includes('google')) ||
      voices.find(v => v.lang === 'pt-BR' && !v.localService)                         ||
      voices.find(v => v.lang === 'pt-BR')                                             ||
      voices.find(v => v.lang.startsWith('pt'))                                        ||
      voices.find(v => v.default)                                                      ||
      voices[0] || null
  }

  // ─── controles ────────────────────────────────────────────────
  setMuted(v: boolean) { this.muted = v; if (v) this.stopAll() }
  isMuted()    { return this.muted }
  isSpeaking() { return this.busy || (this.synth?.speaking ?? false) }

  stopAll() {
    this.synth?.cancel()
    this.queue = []
    this.busy  = false
  }
  stop() { this.stopAll() }

  // ─── pré-processamento de texto ───────────────────────────────
  private clean(text: string): string {
    return text
      .replace(/\[META\].*?\[\/META\]/gs, '')
      .replace(/\[CRISE\]/g, '')
      .replace(/[*_#`✦]/g, '')
      .replace(/---+/g, '.')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ', ')
      .replace(/[[\](){}]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
  }

  // Divide em frases para entrega mais natural
  private sentences(text: string): string[] {
    return text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 2)
  }

  // ─── núcleo TTS com fila de frases ────────────────────────────
  private utterance(text: string, rate: number, pitch: number): SpeechSynthesisUtterance {
    const u = new SpeechSynthesisUtterance(text)
    if (this.voice) u.voice = this.voice
    u.lang   = 'pt-BR'
    u.rate   = rate
    u.pitch  = pitch
    u.volume = 0.9
    return u
  }

  private processQueue() {
    if (this.muted || !this.synth || this.queue.length === 0) {
      this.busy = false
      return
    }
    this.busy = true
    const { text, rate, pitch } = this.queue.shift()!
    const u = this.utterance(text, rate, pitch)
    u.onend   = () => setTimeout(() => this.processQueue(), 80)
    u.onerror = () => setTimeout(() => this.processQueue(), 80)
    this.synth.speak(u)
  }

  // ─── API pública ──────────────────────────────────────────────

  /** Fala qualquer texto — frase por frase, de forma natural */
  speak(
    text: string,
    opts: { priority?: boolean; rate?: number; pitch?: number } = {}
  ) {
    if (this.muted || !this.synth) return
    if (opts.priority) this.stopAll()

    const cleaned = this.clean(text)
    if (cleaned.length < 2) return

    const frases = this.sentences(cleaned)
    const rate   = opts.rate  ?? 1.05
    const pitch  = opts.pitch ?? 0.92   // Mais grave = mais JARVIS

    frases.forEach(f => this.queue.push({ text: f, rate, pitch }))
    if (!this.busy) this.processQueue()
  }

  /** Boas-vindas personalizadas estilo JARVIS */
  speakWelcome(name?: string) {
    const text = name
      ? `Bem-vindo de volta, ${name}. Sistemas de introspecção online. Como posso ajudá-lo hoje?`
      : 'Bem-vindo ao Claramente. Todos os sistemas estão operacionais. Como posso ajudá-lo?'
    this.speak(text, { priority: true, rate: 0.94, pitch: 0.90 })
  }

  /** Acknowledgment estilo JARVIS antes de processar */
  speakAck(name?: string) {
    const options = [
      'Processando.',
      'Entendido.',
      'Compreendo.',
      'Analisando.',
      name ? `Certo, ${name}.` : 'Certo.',
    ]
    const text = options[Math.floor(Math.random() * options.length)]
    if (!this.busy && !this.synth?.speaking) {
      this.speak(text, { rate: 1.08, pitch: 0.90 })
    }
  }

  /** Anuncia que o journaling está começando */
  speakJournalingStart() {
    this.speak(
      'Iniciando sessão de journaling guiado. Vou conduzir você por uma jornada interior. Vamos começar.',
      { priority: true, rate: 0.93, pitch: 0.90 }
    )
  }

  // ─── Reconhecimento de voz ────────────────────────────────────
  startRecording(onResult: ResultCallback, onEnd: () => void): boolean {
    if (typeof window === 'undefined') return false
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return false

    this.stopAll() // Para a fala antes de ouvir

    this.recog = new SR()
    this.recog.lang             = 'pt-BR'
    this.recog.continuous       = true
    this.recog.interimResults   = true
    this.recog.maxAlternatives  = 1

    this.recog.onresult = (e: any) => {
      let interim = '', final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      onResult(final || interim, !!final)
    }
    this.recog.onerror = onEnd
    this.recog.onend   = onEnd

    try { this.recog.start(); return true }
    catch { return false }
  }

  stopRecording() {
    try { this.recog?.stop() } catch { /* ignore */ }
    this.recog = null
  }
}

export const speechEngine = new SpeechEngine()