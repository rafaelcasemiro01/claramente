export function ClaramenteLogo({ size = 32, accent = '#2563EB' }: { size?: number; accent?: string }) {
  const s = accent
  const l = accent + 'BB'
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer glow ring */}
      <circle cx="20" cy="20" r="19.5" stroke={s} strokeWidth="0.5" opacity="0.18"/>
      {/* Main circle */}
      <circle cx="20" cy="20" r="16" stroke={s} strokeWidth="1.5" fill={s + '0D'}/>
      {/* Brain — left lobe */}
      <path d="M 20 10 C 13 10 11 14 11 20" stroke={l} strokeWidth="1.8" strokeLinecap="round"/>
      {/* Brain — right lobe */}
      <path d="M 20 10 C 27 10 29 14 29 20" stroke={s} strokeWidth="1.8" strokeLinecap="round"/>
      {/* Brain — center crease */}
      <line x1="20" y1="10" x2="20" y2="19" stroke={s} strokeWidth="1" strokeLinecap="round" opacity="0.55"/>
      {/* Chat bubble — arc */}
      <path d="M 12 22 Q 12 30 20 30 Q 28 30 28 22" stroke={s} strokeWidth="1.6" strokeLinecap="round"/>
      {/* Chat bubble — tail */}
      <path d="M 17 30 Q 15 33 12 34" stroke={l} strokeWidth="1.5" strokeLinecap="round"/>
      {/* Center node */}
      <circle cx="20" cy="20" r="2.5" fill={s}/>
      <circle cx="20" cy="20" r="1" fill="white" opacity="0.7"/>
    </svg>
  )
}