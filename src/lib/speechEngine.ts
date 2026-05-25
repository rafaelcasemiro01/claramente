// src/lib/speechEngine.ts
// ─────────────────────────────────────────────────────────────────────
// Síntese de voz do Claramente — v2 com suporte mobile.
//
// Mudanças:
//   • Inicialização lazy (no primeiro speak), pra contornar restrições
//     de autoplay no iOS/Android
//   • `unlock()` exposto pra inicializar via gesto do usuário
//   • Recarrega vozes se mudar de browser/SO
//
// API estável:
//   speechEngine.speak(text, { rate?, pitch?, voice? })
//   speechEngine.speakWelcome(name)
//   speechEngine.speakAck(name)
//   speechEngine.speakJournalingStart()
//   speechEngine.stop()
//   speechEngine.setMuted(muted)
//   speechEngine.unlock()         ← NOVO: chame no primeiro toque do usuário
//   speechEngine.isSupported
// ─────────────────────────────────────────────────────────────────────

interface SpeakOpts {
  rate?: number
  pitch?: number
  volume?: number
  voice?: SpeechSynthesisVoice
}

class SpeechEngine {
  private synth: SpeechSynthesis | null
  private voice: SpeechSynthesisVoice | null = null
  private muted = false
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private voicesLoaded = false
  private unlocked = false

  private readonly basePitch = 1.08
  private readonly baseRate  = 0.97

  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null
  }

  get isSupported(): boolean {
    return !!this.synth
  }

  /**
   * Inicializa o sistema de voz. CHAME ESSE MÉTODO no primeiro gesto
   * do usuário (clique/toque) — destrava o TTS em mobile (iOS/Android).
   */
  unlock(): void {
    if (this.unlocked || !this.synth) return
    this.unlocked = true
    this.loadVoices()
    // Truque pra "acordar" o motor no iOS:
    try {
      const u = new SpeechSynthesisUtterance('')
      u.volume = 0
      this.synth.speak(u)
    } catch {
      // ignora
    }
  }

  private loadVoices(): void {
    if (!this.synth) return
    const pickBestVoice = () => {
      const voices = this.synth!.getVoices()
      if (voices.length === 0) return false

      const ptBr = voices.filter(v => v.lang === 'pt-BR' || v.lang.startsWith('pt-BR'))
      const pt   = voices.filter(v => v.lang.startsWith('pt'))

      const malePreferred = [
        /daniel/i, /antonio/i, /ricardo/i, /felipe/i, /paulo/i, /joão/i,
        /male/i, /masculin/i,
      ]
      const isMale = (v: SpeechSynthesisVoice) =>
        malePreferred.some(rx => rx.test(v.name))

      this.voice =
        ptBr.find(isMale)
        || pt.find(isMale)
        || ptBr.find(v => /google/i.test(v.name))
        || ptBr[0]
        || pt[0]
        || voices[0]
        || null

      this.voicesLoaded = true
      return true
    }

    if (pickBestVoice()) return

    // Em alguns browsers as vozes carregam de forma assíncrona.
    const handler = () => {
      if (pickBestVoice()) {
        this.synth!.removeEventListener('voiceschanged', handler)
      }
    }
    this.synth.addEventListener('voiceschanged', handler)
    // Tenta de novo após 1.5s (Android demora)
    setTimeout(() => pickBestVoice(), 1500)
  }

  private prepareText(text: string): string {
    return text
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '') // emojis
      .replace(/\.{3,}/g, '.')
      .replace(/\n+/g, ', ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  async speak(text: string, opts: SpeakOpts = {}): Promise<void> {
    if (!this.synth || this.muted || !text.trim()) return

    // Carrega vozes se ainda não carregou (pode acontecer em mobile)
    if (!this.voicesLoaded) this.loadVoices()

    this.stop()

    const utterance = new SpeechSynthesisUtterance(this.prepareText(text))
    utterance.lang   = 'pt-BR'
    utterance.voice  = opts.voice ?? this.voice ?? null
    utterance.rate   = opts.rate   ?? this.baseRate
    utterance.pitch  = opts.pitch  ?? this.basePitch
    utterance.volume = opts.volume ?? 1

    this.currentUtterance = utterance

    return new Promise(resolve => {
      utterance.onend   = () => { this.currentUtterance = null; resolve() }
      utterance.onerror = () => { this.currentUtterance = null; resolve() }
      try {
        this.synth!.speak(utterance)
      } catch {
        resolve()
      }
    })
  }

  speakWelcome(name: string) {
    return this.speak(`Olá, ${name}. É um prazer ver você por aqui.`)
  }

  speakAck(name: string) {
    const variants = [
      `Estou ouvindo, ${name}.`,
      `Entendi, ${name}.`,
      `Pode continuar, ${name}.`,
    ]
    return this.speak(variants[Math.floor(Math.random() * variants.length)])
  }

  speakJournalingStart() {
    return this.speak(
      'Vamos começar uma sessão de journaling. Respire fundo e me conte o que está no seu coração agora.'
    )
  }

  stop() {
    if (!this.synth) return
    try { this.synth.cancel() } catch { /* ignora */ }
    this.currentUtterance = null
  }

  setMuted(muted: boolean) {
    this.muted = muted
    if (muted) this.stop()
  }

  get isMuted() { return this.muted }
}

export const speechEngine = new SpeechEngine()
