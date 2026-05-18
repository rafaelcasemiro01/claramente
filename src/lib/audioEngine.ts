class AudioEngine {
  private ctx: AudioContext | null = null

  private get ac(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    if (this.ctx.state === 'suspended') this.ctx.resume()
    return this.ctx
  }

  init() { try { this.ac } catch { /* ignore */ } }

  playBoot() {
    try {
      const ctx = this.ac
      const seq = [
        { freq: 220, t: 0,    d: 0.4 },
        { freq: 330, t: 0.15, d: 0.4 },
        { freq: 440, t: 0.30, d: 0.4 },
        { freq: 550, t: 0.45, d: 0.5 },
        { freq: 660, t: 0.58, d: 0.6 },
        { freq: 880, t: 0.68, d: 1.0 },
      ]
      seq.forEach(({ freq, t, d }) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.value = freq
        const st = ctx.currentTime + t
        gain.gain.setValueAtTime(0, st)
        gain.gain.linearRampToValueAtTime(0.13, st + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, st + d)
        osc.start(st); osc.stop(st + d)
      })
    } catch { /* ignore */ }
  }

  playMessageSent() {
    try {
      const ctx = this.ac
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(900, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.07, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15)
    } catch { /* ignore */ }
  }

  playAIStart() {
    try {
      const ctx = this.ac
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sawtooth'
      osc.frequency.value = 80
      const t = ctx.currentTime
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.025, t + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9)
      osc.start(t); osc.stop(t + 0.9)
    } catch { /* ignore */ }
  }

  playAIResponse() {
    try {
      const ctx = this.ac
      const chord = [
        { freq: 523.3, delay: 0,    dur: 1.5 },
        { freq: 659.3, delay: 0.07, dur: 1.4 },
        { freq: 784.0, delay: 0.14, dur: 1.3 },
        { freq: 1046.5, delay: 0.06, dur: 1.0 },
      ]
      chord.forEach(({ freq, delay, dur }) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.value = freq
        const t = ctx.currentTime + delay
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(0.07, t + 0.06)
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
        osc.start(t); osc.stop(t + dur)
      })
    } catch { /* ignore */ }
  }

  playJournaling() {
    try {
      const ctx = this.ac
      const notes = [261.6, 311.1, 392.0, 493.9, 523.3]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.value = freq
        const t = ctx.currentTime + i * 0.13
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(0.09, t + 0.06)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9)
        osc.start(t); osc.stop(t + 0.9)
      })
    } catch { /* ignore */ }
  }

  playClick() {
    try {
      const ctx = this.ac
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = 1000
      gain.gain.setValueAtTime(0.04, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.06)
    } catch { /* ignore */ }
  }
}

export const audio = new AudioEngine()