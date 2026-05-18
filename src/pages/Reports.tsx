import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'
import { Back, BarChart, Crystal } from '@/components/Icons'

// ─── Tipos ──────────────────────────────────────────────────────
interface Report {
  id: string
  period_type: string
  period_start: string
  period_end: string
  dominant_mood: string | null
  recurring_themes: string[]
  progress_notes: string | null
  suggestions: string[]
  message_count: number
}

interface PeriodOption {
  key: string
  label: string
  sublabel: string
}

const PERIODS: PeriodOption[] = [
  { key: 'daily',   label: 'Hoje',       sublabel: 'Resumo do dia'     },
  { key: 'weekly',  label: 'Semana',     sublabel: 'Últimos 7 dias'    },
  { key: 'monthly', label: 'Mês',        sublabel: 'Últimos 30 dias'   },
  { key: 'annual',  label: 'Ano',        sublabel: 'Últimos 12 meses'  },
]

const MOOD_LABELS: Record<string, string> = {
  positive: 'Bem-estar',
  negative: 'Cuidado',
  neutral:  'Equilíbrio',
  mixed:    'Complexo',
  anxious:  'Atenção',
}

const MOOD_COLORS: Record<string, string> = {
  positive: '#22C55E',
  negative: '#EF4444',
  neutral:  '#8B5CF6',
  mixed:    '#F59E0B',
  anxious:  '#6366F1',
}

// ─── Componente de barra ────────────────────────────────────────
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div style={{ height: 4, background: 'rgba(124,58,237,0.1)', borderRadius: 2, overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)', boxShadow: `0 0 6px ${color}60` }} />
    </div>
  )
}

// ─── Reports ────────────────────────────────────────────────────
export default function Reports() {
  const navigate   = useNavigate()
  const { user }   = useAuth()
  const { t, isDark } = useTheme()

  const [period, setPeriod]     = useState('weekly')
  const [report, setReport]     = useState<Report | null>(null)
  const [loading, setLoading]   = useState(false)
  const [generating, setGenerating] = useState(false)
  const [msgCount, setMsgCount] = useState(0)

  useEffect(() => { if (user) fetchReport() }, [period, user])

  async function fetchReport() {
    if (!user) return
    setLoading(true); setReport(null)

    const now   = new Date()
    let start   = new Date()
    if (period === 'daily')   start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (period === 'weekly')  start.setDate(now.getDate() - 7)
    if (period === 'monthly') start.setDate(now.getDate() - 30)
    if (period === 'annual')  start.setFullYear(now.getFullYear() - 1)

    const startStr = start.toISOString().split('T')[0]

    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', user.id)
      .eq('period_type', period)
      .gte('period_start', startStr)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    setReport(data || null)

    // Conta mensagens do período
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString())

    setMsgCount(count || 0)
    setLoading(false)
  }

  async function generateReport() {
    if (!user || generating) return
    setGenerating(true)

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey) { setGenerating(false); return }

    const now   = new Date()
    let start   = new Date()
    if (period === 'daily')   start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (period === 'weekly')  start.setDate(now.getDate() - 7)
    if (period === 'monthly') start.setDate(now.getDate() - 30)
    if (period === 'annual')  start.setFullYear(now.getFullYear() - 1)

    const { data: msgs } = await supabase
      .from('messages')
      .select('role, content, sentiment, created_at')
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: true })
      .limit(80)

    if (!msgs || msgs.length === 0) { setGenerating(false); return }

    const transcript = msgs
      .map(m => `[${m.role === 'user' ? 'Usuário' : 'IA'}]: ${m.content.slice(0, 200)}`)
      .join('\n')

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Analise este histórico de conversas terapêuticas e gere um relatório em JSON. Responda APENAS com JSON válido, sem markdown.

Histórico:
${transcript}

Formato exato:
{
  "dominant_mood": "positive|negative|neutral|mixed|anxious",
  "recurring_themes": ["tema1", "tema2", "tema3"],
  "progress_notes": "Observação sobre o progresso emocional em 2-3 frases.",
  "suggestions": ["Sugestão prática 1", "Sugestão prática 2", "Sugestão prática 3"]
}`
          }]
        })
      })

      const data = await res.json()
      const text = data.content?.[0]?.text || '{}'
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())

      const startStr = start.toISOString().split('T')[0]
      const endStr   = now.toISOString().split('T')[0]

      await supabase.from('reports').upsert({
        user_id:          user.id,
        period_type:      period,
        period_start:     startStr,
        period_end:       endStr,
        dominant_mood:    parsed.dominant_mood,
        recurring_themes: parsed.recurring_themes || [],
        progress_notes:   parsed.progress_notes,
        suggestions:      parsed.suggestions || [],
        message_count:    msgs.length,
      }, { onConflict: 'user_id,period_type,period_start' })

      await fetchReport()
    } catch (e) {
      console.error('Erro ao gerar relatório:', e)
    }
    setGenerating(false)
  }

  const moodColor = report?.dominant_mood ? (MOOD_COLORS[report.dominant_mood] || t.violet) : t.violet
  const moodLabel = report?.dominant_mood ? (MOOD_LABELS[report.dominant_mood] || 'Neutro') : '—'

  // ─── Layout ─────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', background: t.bg, fontFamily: "'DM Sans','Plus Jakarta Sans',sans-serif", transition: 'background 0.2s ease' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse   { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes shimmer { from{background-position:-200% 0} to{background-position:200% 0} }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.2); border-radius: 3px; }
      `}</style>

      {/* Header */}
      <header style={{
        background: t.header,
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: `0.5px solid ${t.headerBorder}`,
        position: 'sticky', top: 0, zIndex: 20,
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/app')} style={{
            width: 40, height: 40, borderRadius: 10, border: 'none',
            background: t.violetBg, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.18s', WebkitTapHighlightColor: 'transparent',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = t.violetHover)}
            onMouseLeave={e => (e.currentTarget.style.background = t.violetBg)}>
            <Back size={18} color={t.violet} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Crystal size={24} color={isDark ? 'rgba(255,255,255,0.7)' : t.violetDeep} dim={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(124,58,237,0.1)'} mid={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(124,58,237,0.2)'} line={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(124,58,237,0.5)'} />
            <div>
              <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: 18, color: t.text, margin: 0, lineHeight: 1.2 }}>Relatórios</p>
              <p style={{ fontSize: 11, color: t.textMuted, margin: 0, letterSpacing: 0.5 }}>Análise emocional com IA</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart size={18} color={t.textMuted} />
          <span style={{ fontSize: 14, color: t.textSub, fontWeight: 500 }}>
            {msgCount} mensagem{msgCount !== 1 ? 's' : ''}
          </span>
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 64px' }}>

        {/* Seletor de período */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)} style={{
              flex: '1 1 auto', minWidth: 80, padding: '12px 16px',
              borderRadius: 14, border: `0.5px solid ${period === p.key ? t.violet : t.cardBorder}`,
              background: period === p.key ? t.violetBg : t.card,
              cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              boxShadow: period === p.key ? `0 0 20px ${isDark ? 'rgba(124,58,237,0.18)' : 'rgba(124,58,237,0.1)'}` : 'none',
              WebkitTapHighlightColor: 'transparent',
            }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: period === p.key ? t.violet : t.text, margin: '0 0 2px', fontFamily: "'DM Sans',sans-serif", lineHeight: 1.2 }}>
                {p.label}
              </p>
              <p style={{ fontSize: 12, color: period === p.key ? t.violet : t.textMuted, margin: 0, fontFamily: "'DM Sans',sans-serif", opacity: 0.8 }}>
                {p.sublabel}
              </p>
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[120, 88, 160, 200].map((h, i) => (
              <div key={i} style={{ height: h, borderRadius: 20, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(124,58,237,0.04)', backgroundImage: `linear-gradient(90deg, transparent 0%, ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(124,58,237,0.06)'} 50%, transparent 100%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
            ))}
          </div>
        )}

        {/* Sem relatório */}
        {!loading && !report && (
          <div style={{ textAlign: 'center', padding: '64px 24px', animation: 'fadeUp 0.5s ease' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: t.violetBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <BarChart size={36} color={t.violet} />
            </div>
            <h3 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 24, color: t.text, marginBottom: 12, fontWeight: 400 }}>
              Sem relatório para este período
            </h3>
            <p style={{ fontSize: 16, color: t.textSub, lineHeight: 1.7, maxWidth: 340, margin: '0 auto 32px' }}>
              {msgCount > 0
                ? `Você tem ${msgCount} mensagem${msgCount !== 1 ? 's' : ''} neste período. Gere sua análise agora.`
                : 'Não há conversas suficientes neste período para gerar uma análise.'}
            </p>
            {msgCount > 0 && (
              <button onClick={generateReport} disabled={generating} style={{
                padding: '14px 32px', borderRadius: 16, border: 'none',
                background: generating ? t.violetBg : t.violetDeep,
                color: generating ? t.violet : 'white',
                fontSize: 16, fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans',sans-serif", transition: 'all 0.2s',
                boxShadow: generating ? 'none' : `0 8px 24px ${isDark ? 'rgba(124,58,237,0.4)' : 'rgba(124,58,237,0.25)'}`,
                WebkitTapHighlightColor: 'transparent',
              }}>
                {generating ? 'Analisando conversas...' : 'Gerar relatório com IA'}
              </button>
            )}
          </div>
        )}

        {/* Relatório */}
        {!loading && report && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp 0.5s ease' }}>

            {/* Card principal — estado emocional */}
            <div style={{ background: t.card, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `0.5px solid ${t.cardBorder}`, borderRadius: 24, padding: '28px 24px', position: 'relative', overflow: 'hidden', boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.2)' : '0 4px 24px rgba(124,58,237,0.06)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${moodColor}, transparent)` }} />
              <div style={{ position: 'absolute', top: -60, right: -60, width: 160, height: 160, borderRadius: '50%', background: `radial-gradient(circle, ${moodColor}18 0%, transparent 70%)`, pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: 12, color: t.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600, marginBottom: 8, fontFamily: "'DM Sans',sans-serif" }}>
                    Estado emocional dominante
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: moodColor, boxShadow: `0 0 10px ${moodColor}`, animation: 'pulse 2s infinite' }} />
                    <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 32, color: t.text, margin: 0, fontWeight: 400, letterSpacing: -0.8 }}>
                      {moodLabel}
                    </h2>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 12, color: t.textMuted, letterSpacing: 0.5, marginBottom: 4, fontFamily: "'DM Sans',sans-serif" }}>
                    {PERIODS.find(p => p.key === period)?.sublabel}
                  </p>
                  <p style={{ fontSize: 28, fontWeight: 700, color: t.violet, margin: 0, fontFamily: "'DM Sans',sans-serif" }}>
                    {report.message_count}
                  </p>
                  <p style={{ fontSize: 13, color: t.textMuted, margin: 0, fontFamily: "'DM Sans',sans-serif" }}>mensagens</p>
                </div>
              </div>

              {/* Barra de humor */}
              <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: t.textMuted, fontFamily: "'DM Sans',sans-serif", minWidth: 56 }}>Humor</span>
                <MiniBar value={report.message_count} max={Math.max(report.message_count, 20)} color={moodColor} />
                <span style={{ fontSize: 13, color: moodColor, fontFamily: "'DM Sans',sans-serif", fontWeight: 500, minWidth: 40 }}>{moodLabel}</span>
              </div>
            </div>

            {/* Temas recorrentes */}
            {report.recurring_themes && report.recurring_themes.length > 0 && (
              <div style={{ background: t.card, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `0.5px solid ${t.cardBorder}`, borderRadius: 24, padding: '24px', boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.15)' : '0 4px 24px rgba(124,58,237,0.05)' }}>
                <p style={{ fontSize: 12, color: t.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600, marginBottom: 16, fontFamily: "'DM Sans',sans-serif" }}>
                  Temas recorrentes
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {report.recurring_themes.map((theme, i) => (
                    <span key={i} style={{
                      padding: '8px 16px', borderRadius: 20, fontSize: 14, fontWeight: 500,
                      background: t.violetBg, border: `0.5px solid ${t.cardBorder}`,
                      color: t.violet, fontFamily: "'DM Sans',sans-serif",
                    }}>
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Progresso */}
            {report.progress_notes && (
              <div style={{ background: t.card, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `0.5px solid ${t.cardBorder}`, borderRadius: 24, padding: '24px', boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.15)' : '0 4px 24px rgba(124,58,237,0.05)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '3px', background: `linear-gradient(to bottom, ${t.violet}, transparent)`, borderRadius: '24px 0 0 24px' }} />
                <p style={{ fontSize: 12, color: t.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600, marginBottom: 12, fontFamily: "'DM Sans',sans-serif" }}>
                  Análise de progresso
                </p>
                <p style={{ fontSize: 16, color: t.textSub, lineHeight: 1.8, margin: 0, fontFamily: "'DM Serif Display',serif", fontStyle: 'italic' }}>
                  "{report.progress_notes}"
                </p>
              </div>
            )}

            {/* Sugestões */}
            {report.suggestions && report.suggestions.length > 0 && (
              <div style={{ background: t.card, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `0.5px solid ${t.cardBorder}`, borderRadius: 24, padding: '24px', boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.15)' : '0 4px 24px rgba(124,58,237,0.05)' }}>
                <p style={{ fontSize: 12, color: t.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600, marginBottom: 16, fontFamily: "'DM Sans',sans-serif" }}>
                  Recomendações da IA
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {report.suggestions.map((sug, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px', borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(124,58,237,0.04)', border: `0.5px solid ${t.cardBorder}` }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: t.violetBg, border: `0.5px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700, color: t.violet }}>
                        {i + 1}
                      </div>
                      <p style={{ fontSize: 15, color: t.textSub, lineHeight: 1.7, margin: 0, fontFamily: "'DM Sans',sans-serif" }}>
                        {sug}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rodapé — gerar novamente */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8 }}>
              <p style={{ fontSize: 13, color: t.textMuted, margin: 0, alignSelf: 'center', fontFamily: "'DM Sans',sans-serif" }}>
                Gerado em {new Date(report.period_end).toLocaleDateString('pt-BR')}
              </p>
              <button onClick={generateReport} disabled={generating} style={{
                padding: '12px 24px', borderRadius: 14, border: `0.5px solid ${t.cardBorder}`,
                background: t.violetBg, color: t.violet,
                fontSize: 14, fontWeight: 500, cursor: generating ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans',sans-serif", transition: 'all 0.18s',
                WebkitTapHighlightColor: 'transparent',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = t.violetHover)}
                onMouseLeave={e => (e.currentTarget.style.background = t.violetBg)}>
                {generating ? 'Atualizando...' : 'Atualizar análise'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}