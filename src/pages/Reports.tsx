import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { generateReport, PERIODS } from '@/lib/reportService'
import type { ReportData, PeriodType } from '@/lib/reportService'

function CrystalLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <path d="M28 4L50 18V38L28 52L6 38V18Z" fill="rgba(139,92,246,0.15)" stroke="#8B5CF6" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M28 4L6 18H50Z" fill="rgba(139,92,246,0.35)"/>
      <line x1="6" y1="18" x2="28" y2="30" stroke="rgba(139,92,246,0.6)" strokeWidth="1.2"/>
      <line x1="50" y1="18" x2="28" y2="30" stroke="rgba(139,92,246,0.6)" strokeWidth="1.2"/>
      <circle cx="28" cy="30" r="3" fill="#8B5CF6"/>
    </svg>
  )
}

export default function Reports() {
  const { user, profile } = useAuth()
  const { t, isDark } = useTheme()
  const navigate = useNavigate()
  const [activePeriod, setActivePeriod] = useState<PeriodType>('weekly')
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  async function handleGenerate() {
    if (!user) return
    setLoading(true); setGenerated(false)
    const result = await generateReport(user.id, activePeriod)
    setReport(result); setGenerated(true); setLoading(false)
  }

  const firstName = profile?.name?.split(' ')[0] || 'você'

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: t.bg, fontFamily: "'DM Sans','Plus Jakarta Sans',sans-serif", transition: 'background 0.3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${t.violetBg};border-radius:4px}
      `}</style>

      {/* Header */}
      <header style={{ background: t.header, borderBottom: `1px solid ${t.headerBorder}`, padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, transition: 'background 0.3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/app')} style={{ width: 36, height: 36, borderRadius: 10, background: t.violetBg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <CrystalLogo size={26} />
          <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: 18, color: t.text, transition: 'color 0.3s' }}>Relatórios</span>
        </div>
        <span style={{ fontSize: 13, color: t.textMuted, fontWeight: 500 }}>{firstName}</span>
      </header>

      <div style={{ flex: 1, maxWidth: 680, margin: '0 auto', width: '100%', padding: '40px 20px' }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 28, color: t.text, marginBottom: 8, fontWeight: 400, transition: 'color 0.3s' }}>
            Sua jornada interior
          </h1>
          <p style={{ fontSize: 14, color: t.textSub, lineHeight: 1.6, transition: 'color 0.3s' }}>
            Padrões emocionais identificados pela IA com base nas suas conversas
          </p>
        </div>

        {/* Períodos */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 40, background: t.card, padding: 6, borderRadius: 16, border: `1px solid ${t.cardBorder}`, boxShadow: `0 2px 8px rgba(0,0,0,${isDark ? '0.2' : '0.04'})`, transition: 'all 0.3s' }}>
          {PERIODS.map(p => (
            <button key={p.type} onClick={() => { setActivePeriod(p.type); setGenerated(false); setReport(null) }} style={{
              flex: 1, padding: '10px 8px', borderRadius: 12, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, transition: 'all 0.2s', fontFamily: "'DM Sans',sans-serif",
              background: activePeriod === p.type ? t.violet : 'none',
              color: activePeriod === p.type ? 'white' : t.textSub,
              boxShadow: activePeriod === p.type ? '0 4px 12px rgba(139,92,246,0.3)' : 'none',
            }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Estado vazio */}
        {!generated && (
          <div style={{ textAlign: 'center', padding: '60px 20px', animation: 'fadeUp 0.4s ease' }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: t.card, border: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 8px 32px rgba(139,92,246,0.1)', transition: 'all 0.3s' }}>
              <CrystalLogo size={52} />
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 24, color: t.text, marginBottom: 12, fontWeight: 400, transition: 'color 0.3s' }}>
              Análise introspectiva
            </h2>
            <p style={{ fontSize: 15, color: t.textSub, lineHeight: 1.7, maxWidth: 340, margin: '0 auto 36px', transition: 'color 0.3s' }}>
              A IA vai revelar seus padrões emocionais, temas recorrentes e oferecer sugestões personalizadas.
            </p>
            <button onClick={handleGenerate} disabled={loading} style={{
              padding: '16px 40px', borderRadius: 16, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? t.violetBg : t.violet, color: loading ? t.violet : 'white',
              fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", transition: 'all 0.2s',
              display: 'inline-flex', alignItems: 'center', gap: 10,
              boxShadow: loading ? 'none' : '0 8px 24px rgba(139,92,246,0.35)',
            }}>
              {loading ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                    <path d="M12 2a10 10 0 0 1 10 10"/>
                  </svg>
                  Analisando...
                </>
              ) : `Gerar análise — ${PERIODS.find(p => p.type === activePeriod)?.label}`}
            </button>
          </div>
        )}

        {/* Resultado */}
        {generated && report && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp 0.5s ease' }}>

            <div style={{ background: isDark ? '#1A1535' : '#1A0F3C', borderRadius: 24, padding: '28px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', pointerEvents: 'none' }} />
              <p style={{ fontSize: 11, color: '#6B6480', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Humor predominante</p>
              <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: 'white', lineHeight: 1.4, marginBottom: 16, fontWeight: 400 }}>
                {report.dominant_mood}
              </p>
              <p style={{ fontSize: 12, color: '#4A4268' }}>
                {report.message_count} mensagem{report.message_count !== 1 ? 's' : ''} · {new Date(report.period_start).toLocaleDateString('pt-BR')} — {new Date(report.period_end).toLocaleDateString('pt-BR')}
              </p>
            </div>

            {report.recurring_themes?.length > 0 && (
              <div style={{ background: t.card, borderRadius: 20, padding: '24px', border: `1px solid ${t.cardBorder}`, transition: 'all 0.3s' }}>
                <p style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Temas recorrentes</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {report.recurring_themes.map((theme, i) => (
                    <span key={i} style={{ background: t.tag, color: t.tagText, padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500, border: `1px solid ${t.tagBorder}`, transition: 'all 0.3s' }}>
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: t.card, borderRadius: 20, padding: '24px', border: `1px solid ${t.cardBorder}`, transition: 'all 0.3s' }}>
              <p style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Observações do período</p>
              <p style={{ fontSize: 15, color: t.textSub, lineHeight: 1.8, transition: 'color 0.3s' }}>{report.progress_notes}</p>
            </div>

            {report.suggestions?.length > 0 && (
              <div style={{ background: isDark ? '#1A1535' : '#1A0F3C', borderRadius: 20, padding: '24px' }}>
                <p style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 20 }}>Sugestões reflexivas</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {report.suggestions.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(139,92,246,0.25)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                        <span style={{ fontSize: 11, color: '#A78BFA', fontWeight: 700 }}>{i + 1}</span>
                      </div>
                      <p style={{ fontSize: 14, color: '#C4B5FD', lineHeight: 1.75, margin: 0 }}>{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => { setGenerated(false); setReport(null) }} style={{
              width: '100%', padding: '14px', borderRadius: 14, fontSize: 14, color: t.textSub,
              border: `1px solid ${t.cardBorder}`, background: t.card, cursor: 'pointer',
              fontFamily: "'DM Sans',sans-serif", transition: 'all 0.3s', fontWeight: 500,
            }}>
              ← Nova análise
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: t.textMuted, paddingBottom: 8, transition: 'color 0.3s' }}>
              Não substitui acompanhamento psicológico profissional · CVV: 188
            </p>
          </div>
        )}
      </div>
    </div>
  )
}