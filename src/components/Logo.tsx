export function ClaramenteLogo({
  size = 32,
  accent = '#2563EB',
}: {
  size?: number
  accent?: string
}) {
  const isLightAccent = accent === '#2563EB'

  const c = isLightAccent ? {
    headDark:  '#1E3A8A',
    headBase:  '#1E40AF',
    headMid:   '#2563EB',
    visor:     '#0C1445',
    eyeBg:     '#060D2E',
    eyeBase:   '#1D4ED8',
    eyeMid:    '#3B82F6',
    eyeLight:  '#60A5FA',
    eyeGlow:   '#93C5FD',
    detail:    '#3B82F6',
    detailLow: '#1D4ED8',
    neck:      '#1E3A8A',
  } : {
    headDark:  '#1E40AF',
    headBase:  '#2563EB',
    headMid:   '#3B82F6',
    visor:     '#0F172A',
    eyeBg:     '#0F172A',
    eyeBase:   '#2563EB',
    eyeMid:    '#3B82F6',
    eyeLight:  '#60A5FA',
    eyeGlow:   '#BFDBFE',
    detail:    '#60A5FA',
    detailLow: '#3B82F6',
    neck:      '#1E40AF',
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Pescoço / colar ── */}
      <rect x="14" y="37" width="12" height="7" rx="3.5" fill={c.neck} />
      <rect x="16" y="39.5" width="8" height="1.5" rx="0.75" fill={c.detail} opacity="0.45" />
      <rect x="17" y="41.5" width="6" height="1"   rx="0.5"  fill={c.detail} opacity="0.3"  />

      {/* ── Painéis laterais (orelhas C-3PO) ── */}
      <rect x="3"  y="14" width="6" height="12" rx="3" fill={c.headBase} />
      <rect x="31" y="14" width="6" height="12" rx="3" fill={c.headBase} />
      {/* Linhas de detalhe das orelhas */}
      {[0, 3.5, 7].map((offset, i) => (
        <g key={i}>
          <rect x="4.5"  y={16 + offset} width="3" height="1" rx="0.5" fill={c.detail} opacity="0.5" />
          <rect x="32.5" y={16 + offset} width="3" height="1" rx="0.5" fill={c.detail} opacity="0.5" />
        </g>
      ))}

      {/* ── Cabeça principal — base escura ── */}
      <rect x="8" y="6" width="24" height="32" rx="7" fill={c.headDark} />

      {/* ── Placa frontal superior (testa) — tom médio ── */}
      <rect x="8"  y="6"  width="24" height="14" rx="7" fill={c.headMid} />
      <rect x="8"  y="13" width="24" height="7"         fill={c.headMid} />

      {/* ── Antena central ── */}
      <rect x="17" y="2"   width="6" height="5" rx="2.5" fill={c.headBase} />
      <circle cx="20" cy="2" r="2.2" fill={c.headMid} />
      <circle cx="20" cy="2" r="1.1" fill={c.eyeLight} />
      <circle cx="20" cy="2" r="0.5" fill={c.eyeGlow}  />

      {/* ── Viseira / faixa dos olhos (placa escura interna) ── */}
      <rect x="9" y="13.5" width="22" height="12" rx="2" fill={c.visor} />
      {/* Linha de separação central (costura C-3PO) */}
      <rect x="19.5" y="13.5" width="1" height="12" fill={c.headDark} opacity="0.6" />

      {/* ── Olho esquerdo — camadas concêntricas ── */}
      <circle cx="16" cy="20" r="5"   fill={c.eyeBg}   />
      <circle cx="16" cy="20" r="4.2" fill={c.eyeBase} />
      <circle cx="16" cy="20" r="3"   fill={c.eyeMid}  />
      <circle cx="16" cy="20" r="1.8" fill={c.eyeLight}/>
      <circle cx="16" cy="20" r="0.9" fill={c.eyeGlow} />
      {/* Reflexo */}
      <circle cx="14.8" cy="18.8" r="0.6" fill="white" opacity="0.75" />

      {/* ── Olho direito ── */}
      <circle cx="24" cy="20" r="5"   fill={c.eyeBg}   />
      <circle cx="24" cy="20" r="4.2" fill={c.eyeBase} />
      <circle cx="24" cy="20" r="3"   fill={c.eyeMid}  />
      <circle cx="24" cy="20" r="1.8" fill={c.eyeLight}/>
      <circle cx="24" cy="20" r="0.9" fill={c.eyeGlow} />
      {/* Reflexo */}
      <circle cx="22.8" cy="18.8" r="0.6" fill="white" opacity="0.75" />

      {/* ── Face inferior (placa do queixo) ── */}
      <rect x="10" y="27" width="20" height="11" rx="4" fill={c.headDark} />
      {/* Detalhe interno */}
      <rect x="12" y="29" width="16" height="7" rx="2.5" fill={c.visor} />

      {/* ── Grelha da boca (estilo alto-falante) ── */}
      {[0, 2.5, 5].map((offset, i) => (
        <rect
          key={i}
          x={13 + i * 0.5}
          y={30 + offset}
          width={14 - i}
          height="1"
          rx="0.5"
          fill={c.detail}
          opacity={0.55 - i * 0.1}
        />
      ))}

      {/* ── Sorriso sutil curvo (expressão humana C-3PO) ── */}
      <path
        d="M 14 33.5 Q 20 37 26 33.5"
        stroke={c.eyeLight}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Junções laterais da cabeça ── */}
      <rect x="8"  y="18" width="1.5" height="8" rx="0.75" fill={c.detailLow} opacity="0.7" />
      <rect x="30.5" y="18" width="1.5" height="8" rx="0.75" fill={c.detailLow} opacity="0.7" />
    </svg>
  )
}