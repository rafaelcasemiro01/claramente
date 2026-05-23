// src/components/Logo.tsx
// The new Claramente mascot — a warm, friendly companion droid.
// Props are backwards-compatible:
//   <ClaramenteLogo size={28} />                    // works
//   <ClaramenteLogo size={28} accent={anyColor} />  // accent accepted but ignored
//   <ClaramenteLogo size={28} mode="dark" />        // new — controls inner palette
//   <ClaramenteLogo size={120} breathing />         // new — subtle pulse animation

import { useId } from 'react'

type Props = {
  size?: number
  /** Backwards compat — accepted but ignored. */
  accent?: string
  /** Controls the warm palette. Defaults to 'light'. */
  mode?: 'light' | 'dark'
  /** Enables a subtle eye-highlight + antenna pulse. Use on landing / large sizes. */
  breathing?: boolean
}

export function ClaramenteLogo({ size = 32, mode = 'light', breathing = false }: Props) {
  const reactUid = useId()
  const uid = reactUid.replace(/:/g, '')
  const headGradId   = `friendHeadGrad-${uid}`
  const eyeGradId    = `friendEyeGrad-${uid}`
  const innerLightId = `friendInner-${uid}`

  const c =
    mode === 'dark'
      ? {
          headLight:   '#d49380',
          headMid:     '#b87560',
          headDeep:    '#8a5640',
          headRim:     '#5a3a2b',
          ear:         '#9c6549',
          earDetail:   'rgba(240,212,192,0.5)',
          eyeBg:       '#1a0e08',
          eyeRing:     '#3a1f14',
          eyeGlow:     '#f4d4c0',
          eyeCore:     '#e0a890',
          eyeCenter:   '#c4836a',
          highlight:   '#fff8ee',
          cheek:       'rgba(217,117,96,0.6)',
          smile:       '#3a1f14',
          antenna:     '#d49380',
          antennaCore: '#f4d4c0',
          innerLight:  'rgba(255,248,238,0.18)',
        }
      : {
          headLight:   '#f0d0b8',
          headMid:     '#dba88c',
          headDeep:    '#c4836a',
          headRim:     '#8a5640',
          ear:         '#a86b50',
          earDetail:   'rgba(240,212,192,0.55)',
          eyeBg:       '#2a1408',
          eyeRing:     '#3a1f14',
          eyeGlow:     '#f4d4c0',
          eyeCore:     '#e0a890',
          eyeCenter:   '#c4836a',
          highlight:   '#ffffff',
          cheek:       'rgba(196,98,72,0.42)',
          smile:       '#5a3520',
          antenna:     '#c4836a',
          antennaCore: '#f4d4c0',
          innerLight:  'rgba(255,253,245,0.42)',
        }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={headGradId} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0"    stopColor={c.headLight} />
          <stop offset="0.55" stopColor={c.headMid} />
          <stop offset="1"    stopColor={c.headDeep} />
        </linearGradient>
        <radialGradient id={eyeGradId} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0"    stopColor={c.eyeGlow} />
          <stop offset="0.45" stopColor={c.eyeCore} />
          <stop offset="0.85" stopColor={c.eyeCenter} />
          <stop offset="1"    stopColor={c.eyeBg} />
        </radialGradient>
        <radialGradient id={innerLightId} cx="0.5" cy="0.25" r="0.6">
          <stop offset="0" stopColor={c.innerLight} />
          <stop offset="1" stopColor={c.innerLight} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Antenna */}
      <line x1="24" y1="4.5" x2="24" y2="10" stroke={c.antenna} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="3.6" r="2.2" fill={c.antenna}>
        {breathing && <animate attributeName="r" values="2.2;2.6;2.2" dur="3s" repeatCount="indefinite" />}
      </circle>
      <circle cx="24" cy="3.6" r="1.1" fill={c.antennaCore} />
      <circle cx="23.6" cy="3.2" r="0.4" fill={c.highlight} opacity="0.9" />

      {/* Side speaker panels */}
      <rect x="3.5"  y="24" width="4.5" height="11" rx="2.25" fill={c.ear} />
      <rect x="5"    y="26"   width="1.5" height="1" rx="0.5" fill={c.earDetail} />
      <rect x="5"    y="28.5" width="1.5" height="1" rx="0.5" fill={c.earDetail} />
      <rect x="5"    y="31"   width="1.5" height="1" rx="0.5" fill={c.earDetail} />
      <rect x="40"   y="24" width="4.5" height="11" rx="2.25" fill={c.ear} />
      <rect x="41.5" y="26"   width="1.5" height="1" rx="0.5" fill={c.earDetail} />
      <rect x="41.5" y="28.5" width="1.5" height="1" rx="0.5" fill={c.earDetail} />
      <rect x="41.5" y="31"   width="1.5" height="1" rx="0.5" fill={c.earDetail} />

      {/* Head (soft squircle) */}
      <rect x="9" y="11" width="30" height="34" rx="14" fill={`url(#${headGradId})`} />
      <rect x="11.5" y="13" width="25" height="16" rx="11" fill={`url(#${innerLightId})`} />
      <rect x="9" y="11" width="30" height="34" rx="14" fill="none" stroke={c.headRim} strokeOpacity="0.18" strokeWidth="0.6" />

      {/* Left eye */}
      <circle cx="17.5" cy="25" r="5.6" fill={c.eyeRing} />
      <circle cx="17.5" cy="25" r="4.6" fill={`url(#${eyeGradId})`} />
      <circle cx="17.5" cy="25" r="1.6" fill={c.eyeGlow} />
      <circle cx="16.3" cy="23.5" r="1.1" fill={c.highlight}>
        {breathing && <animate attributeName="opacity" values="0.95;0.55;0.95" dur="4s" repeatCount="indefinite" />}
      </circle>
      <circle cx="19" cy="26.5" r="0.45" fill={c.highlight} opacity="0.5" />

      {/* Right eye */}
      <circle cx="30.5" cy="25" r="5.6" fill={c.eyeRing} />
      <circle cx="30.5" cy="25" r="4.6" fill={`url(#${eyeGradId})`} />
      <circle cx="30.5" cy="25" r="1.6" fill={c.eyeGlow} />
      <circle cx="29.3" cy="23.5" r="1.1" fill={c.highlight}>
        {breathing && <animate attributeName="opacity" values="0.95;0.55;0.95" dur="4s" repeatCount="indefinite" />}
      </circle>
      <circle cx="32" cy="26.5" r="0.45" fill={c.highlight} opacity="0.5" />

      {/* Cheeks */}
      <ellipse cx="13" cy="34" rx="2.2" ry="1.4" fill={c.cheek} />
      <ellipse cx="35" cy="34" rx="2.2" ry="1.4" fill={c.cheek} />

      {/* Smile */}
      <path d="M 19.5 36 Q 24 39.5 28.5 36" stroke={c.smile} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.85" />
    </svg>
  )
}