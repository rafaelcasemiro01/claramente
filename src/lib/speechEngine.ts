type ResultCallback = (text: string, isFinal: boolean) => void

/* eslint-disable @typescript-eslint/no-explicit-any */
class SpeechEngine {
  private synth: SpeechSynthesis | null = null
  private recog: any = null
  private muted  = false
  private voice: SpeechSynthesisVoice | null = null

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
        voices.find(v => v.default) ||
        voices[0] || null
    }
    load()
    this.synth.onvoiceschanged = load
  }

  setMuted(v: boolean) {
    this.muted = v
    if (v) this.synth?.cancel()
  }

  isMuted()    { return this.muted }
  isSpeaking() { return this.synth?.speaking ?? false }

  speak(text: string, opts: { priority?: boolean; rate?: number } = {}) {
    if (this.muted || !this.synth) return
    if (opts.priority) this.synth.cancel()

    const clean = text
      .replace(/\[META\].*?\[\/META\]/gs, '')
      .replace(/\[CRISE\]/g, '')
      .replace(/[*#✦]/g, '')
      .replace(/\n+/g, '. ')
      .trim()
      .slice(0, 280)

    if (clean.length < 2) return

    const u = new SpeechSynthesisUtterance(clean)
    if (this.voice) u.voice = this.voice
    u.lang   = 'pt-BR'
    u.rate   = opts.rate ?? 1.05
    u.pitch  = 1.0
    u.volume = 0.88
    this.synth.speak(u)
  }

  stop() { this.synth?.cancel() }

  startRecording(onResult: ResultCallback, onEnd: () => void): boolean {
    if (typeof window === 'undefined') return false

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return false

    this.stop()
    this.recog = new SR()
    this.recog.lang = 'pt-BR'
    this.recog.continuous = true
    this.recog.interimResults = true

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