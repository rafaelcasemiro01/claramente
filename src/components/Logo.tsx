export function ClaramenteLogo({
  size = 32,
  accent = '#2563EB',
}: {
  size?: number
  accent?: string
}) {
  const s = size
  const small = s <= 28

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 40 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Cabeça (formato robótico arredondado, estilo C-3PO) ── */}
      <rect
        x="8" y="4" width="24" height="30" rx="7"
        fill={`${accent}12`}
        stroke={accent}
        strokeWidth="1.5"
      />

      {/* ── Faixa viseira (traço horizontal C-3PO) ── */}
      <rect x="8" y="14" width="24" height="12" rx="0" fill={`${accent}18`} />

      {/* ── Olho esquerdo ── */}
      <circle cx="15.5" cy="20" r="4.2" fill={`${accent}15`} stroke={accent} strokeWidth="1.2" />
      <circle cx="15.5" cy="20" r="2"   fill={accent} />
      <circle cx="14.4" cy="18.9" r="0.75" fill="white" opacity="0.65" />

      {/* ── Olho direito ── */}
      <circle cx="24.5" cy="20" r="4.2" fill={`${accent}15`} stroke={accent} strokeWidth="1.2" />
      <circle cx="24.5" cy="20" r="2"   fill={accent} />
      <circle cx="23.4" cy="18.9" r="0.75" fill="white" opacity="0.65" />

      {/* ── Sorriso sutil ── */}
      <path
        d="M14 30 Q20 34.5 26 30"
        stroke={accent}
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* ── Linha central do nariz ── */}
      <line
        x1="20" y1="24" x2="20" y2="27.5"
        stroke={accent}
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.4"
      />

      {/* ── Detalhes laterais (painéis auriculares C-3PO) ── */}
      {!small && (
        <>
          <rect x="4"  y="17" width="4" height="6" rx="1.5" fill={accent} opacity="0.18" />
          <rect x="32" y="17" width="4" height="6" rx="1.5" fill={accent} opacity="0.18" />
          {/* traço de separação lateral */}
          <line x1="8"  y1="19" x2="8"  y2="21" stroke={accent} strokeWidth="0.7" opacity="0.35" />
          <line x1="32" y1="19" x2="32" y2="21" stroke={accent} strokeWidth="0.7" opacity="0.35" />
        </>
      )}

      {/* ── Antena/topo ── */}
      {!small && (
        <>
          <circle cx="20" cy="4" r="1.3" fill={accent} opacity="0.45" />
          <line x1="20" y1="2.5" x2="20" y2="4" stroke={accent} strokeWidth="1" strokeLinecap="round" opacity="0.4" />
        </>
      )}

      {/* ── Pescoço / base ── */}
      <rect
        x="15" y="34" width="10" height="6" rx="3"
        fill={`${accent}10`}
        stroke={accent}
        strokeWidth="1.2"
      />
      {/* detalhes pescoço */}
      <line x1="17" y1="37" x2="23" y2="37" stroke={accent} strokeWidth="0.8" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}