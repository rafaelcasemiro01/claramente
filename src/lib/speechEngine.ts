// src/lib/speechEngine.ts
// ─────────────────────────────────────────────────────────────────────
// Síntese de voz do Claramente.
// Personalidade: formal, calorosa e fluida — inspirada em C-3PO mas
// em português brasileiro. Frases inteiras sem cortes, ritmo natural.
//
// API estável (compatível com o restante do app):
//   speechEngine.speak(text, { rate?, pitch?, voice? })
//   speechEngine.speakWelcome(name)
//   speechEngine.speakAck(name)
//   speechEngine.speakJournalingStart()
//   speechEngine.stop()
//   speechEngine.setMuted(muted)
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
  private voiceReady = false
  private voicePromise: Promise<void>

  /** Personalidade C-3PO: pitch ligeiramente elevado, ritmo claro. */
  private readonly basePitch = 1.08
  private readonly baseRate  = 0.97

  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null
    this.voicePromise = this.loadVoices()
  }

  get isSupported(): boolean {
    return !!this.synth
  }

  private async loadVoices(): Promise<void> {
    if (!this.synth) return

    const pickBestVoice = () => {
      const voices = this.synth!.getVoices()
      if (voices.length === 0) return false

      // Prioridade (ordem de qualidade percebida e adequação ao personagem):
      //  1. Microsoft Daniel pt-BR (Windows — masculino, claro)
      //  2. Microsoft Antonio (pt-BR, masculino)
      //  3. Google português do Brasil (geralmente masculino)
      //  4. Qualquer pt-BR masculino
      //  5. Qualquer pt-BR
      //  6. Qualquer pt
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

      this.voiceReady = true
      return true
    }

    if (pickBestVoice()) return

    // Em alguns browsers as vozes carregam de forma assíncrona.
    return new Promise<void>(resolve => {
      const handler = () => {
        if (pickBestVoice()) {
          this.synth!.removeEventListener('voiceschanged', handler)
          resolve()
        }
      }
      this.synth!.addEventListener('voiceschanged', handler)
      // Fallback após 3s
      setTimeout(() => { pickBestVoice(); resolve() }, 3000)
    })
  }

  /** Pre-processa o texto pra fluir melhor: remove emojis, normaliza pausas. */
  private prepareText(text: string): string {
    return text
      // Remove emojis (atrapalham TTS)
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
      // Reduz reticências múltiplas (que viram pausas longas)
      .replace(/\.{3,}/g, '.')
      // Quebras de linha → vírgula (mantém ritmo sem pausa cheia)
      .replace(/\n+/g, ', ')
      // Espaços extras
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Fala um texto em UM ÚNICO bloco (sem chunking).
   * Garante fluidez e ritmo natural sem cortes mecânicos.
   */
  async speak(text: string, opts: SpeakOpts = {}): Promise<void> {
    if (!this.synth || this.muted || !text.trim()) return

    // Espera as vozes carregarem se ainda não carregaram
    if (!this.voiceReady) await this.voicePromise

    // Cancela qualquer fala em andamento
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
      this.synth!.speak(utterance)
    })
  }

  speakWelcome(name: string) {
    return this.speak(`Olá, ${name}. É um prazer ver você por aqui.`)
  }

  speakAck(name: string) {
    // Curto e fluido — só para indicar que ouvimos a mensagem.
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

  /** Cancela qualquer fala em andamento. */
  stop() {
    if (!this.synth) return
    try {
      this.synth.cancel()
    } catch {
      // ignora
    }
    this.currentUtterance = null
  }

  /** Mudo total — pausa o que está tocando e silencia falas futuras. */
  setMuted(muted: boolean) {
    this.muted = muted
    if (muted) this.stop()
  }

  get isMuted() { return this.muted }
}

export const speechEngine = new SpeechEngine()
