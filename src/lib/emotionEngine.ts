export type MoodState = 'positive' | 'neutral' | 'negative' | 'mixed' | 'anxious' | 'reflective'

export interface EmotionalProfile {
  mood: MoodState
  energy: number      // 0–100
  stress: number      // 0–100
  focus: number       // 0–100
  insight?: string
  lastUpdated: Date
}

const DEFAULTS: EmotionalProfile = {
  mood: 'neutral', energy: 60, stress: 30, focus: 70, lastUpdated: new Date()
}

class EmotionEngine {
  private profile: EmotionalProfile = { ...DEFAULTS }
  private listeners: Array<(p: EmotionalProfile) => void> = []

  get() { return { ...this.profile } }

  subscribe(fn: (p: EmotionalProfile) => void) {
    this.listeners.push(fn)
    return () => { this.listeners = this.listeners.filter(l => l !== fn) }
  }

  private emit() { this.listeners.forEach(l => l({ ...this.profile })) }

  updateFromSentiment(sentiment: string, emotions: string[]) {
    const moodMap: Record<string, MoodState> = {
      positive: 'positive', negative: 'negative',
      mixed: 'mixed', neutral: 'neutral',
    }
    this.profile.mood = moodMap[sentiment] || 'neutral'

    const anxious = emotions.some(e => ['ansiedade', 'medo', 'preocupação', 'stress'].includes(e.toLowerCase()))
    const reflective = emotions.some(e => ['reflexão', 'pensamento', 'introspecção', 'contemplação'].includes(e.toLowerCase()))
    if (anxious)    { this.profile.mood = 'anxious';    this.profile.stress = Math.min(100, this.profile.stress + 15) }
    if (reflective) { this.profile.mood = 'reflective'; this.profile.focus  = Math.min(100, this.profile.focus  + 10) }

    if (sentiment === 'positive') { this.profile.energy = Math.min(100, this.profile.energy + 5);  this.profile.stress = Math.max(0, this.profile.stress - 5) }
    if (sentiment === 'negative') { this.profile.energy = Math.max(10,  this.profile.energy - 5);  this.profile.stress = Math.min(100, this.profile.stress + 8) }

    this.profile.lastUpdated = new Date()
    this.emit()
  }

  setInsight(insight: string) {
    this.profile.insight = insight
    this.emit()
  }

  reset() { this.profile = { ...DEFAULTS, lastUpdated: new Date() }; this.emit() }
}

export const emotionEngine = new EmotionEngine()

export function moodColor(mood: MoodState): string {
  return {
    positive:   '#7C3AED',
    neutral:    '#6D28D9',
    negative:   '#4C1D95',
    mixed:      '#5B21B6',
    anxious:    '#6D28D9',
    reflective: '#4338CA',
  }[mood]
}

export function moodGlow(mood: MoodState): string {
  return {
    positive:   'rgba(124,58,237,0.22)',
    neutral:    'rgba(109,40,217,0.16)',
    negative:   'rgba(76,29,149,0.2)',
    mixed:      'rgba(91,33,182,0.18)',
    anxious:    'rgba(109,40,217,0.2)',
    reflective: 'rgba(67,56,202,0.18)',
  }[mood]
}

export function moodLabel(mood: MoodState): string {
  return {
    positive:   'Bem-estar',
    neutral:    'Equilíbrio',
    negative:   'Cuidado',
    mixed:      'Complexo',
    anxious:    'Atenção',
    reflective: 'Reflexivo',
  }[mood]
}