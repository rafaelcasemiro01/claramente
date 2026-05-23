import { useState, useEffect } from 'react'
import { emotionEngine, moodColor, moodGlow, moodLabel } from '@/lib/emotionEngine'
import type { EmotionalProfile } from '@/lib/emotionEngine'

function Bar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, fontFamily: 'monospace', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{value}%</span>
      </div>
      <div style={{ height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 1, transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)', boxShadow: `0 0 6px ${color}` }} />
      </div>
    </div>
  )
}

export function JarvisHUD({ visible = true }: { visible?: boolean }) {
  const [profile, setProfile] = useState<EmotionalProfile>(emotionEngine.get())
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const unsub = emotionEngine.subscribe(setProfile)
    const iv    = setInterval(() => setTime(new Date()), 1000)
    return () => { unsub(); clearInterval(iv) }
  }, [])

  if (!visible) return null

  const c    = moodColor(profile.mood)
  const glow = moodGlow(profile.mood)

  return (
    <div style={{
      background: 'rgba(5,4,16,0.85)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      border: '0.5px solid rgba(255,255,255,0.06)',
      borderRadius: 16, padding: '16px 18px',
      boxShadow: `0 0 32px ${glow}, 0 8px 32px rgba(0,0,0,0.3)`,
      transition: 'box-shadow 1.5s ease',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg,transparent,${c}40,transparent)` }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: c, boxShadow: `0 0 8px ${c}`, animation: 'hudPulse 2.5s infinite' }} />
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, fontFamily: 'monospace', textTransform: 'uppercase' }}>Estado emocional</span>
        </div>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
          {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Mood badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '8px 12px', background: `${c}12`, border: `0.5px solid ${c}30`, borderRadius: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${c}20`, border: `1px solid ${c}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
            {profile.mood === 'positive'   && <><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></>}
            {profile.mood === 'neutral'    && <><circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></>}
            {profile.mood === 'negative'   && <><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></>}
            {profile.mood === 'anxious'    && <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}
            {profile.mood === 'reflective' && <><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></>}
            {profile.mood === 'mixed'      && <><circle cx="12" cy="12" r="10"/><path d="M8 15h8"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></>}
          </svg>
        </div>
        <div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: 0, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>{moodLabel(profile.mood)}</p>
          {profile.insight && <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0', fontFamily: "'DM Sans',sans-serif", lineHeight: 1.4 }}>{profile.insight.slice(0, 52)}{profile.insight.length > 52 ? '...' : ''}</p>}
        </div>
      </div>

      {/* Barras */}
      <Bar value={profile.energy} color="#7C3AED" label="Energia"  />
      <Bar value={Math.max(0, 100 - profile.stress)} color="#4338CA" label="Calma"  />
      <Bar value={profile.focus}  color="#5B21B6" label="Foco"    />

      <style>{`@keyframes hudPulse{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  )
}