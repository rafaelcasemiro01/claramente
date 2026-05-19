import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'

interface Report {
  id: string; period_type: string; period_start: string; period_end: string
  dominant_mood: string | null; recurring_themes: string[]; progress_notes: string | null
  suggestions: string[]; message_count: number
}

const PERIODS = [
  { key: 'daily',   label: 'Hoje',    sub: 'Resumo do dia'    },
  { key: 'weekly',  label: 'Semana',  sub: 'Últimos 7 dias'   },
  { key: 'monthly', label: 'Mês',     sub: 'Últimos 30 dias'  },
  { key: 'annual',  label: 'Ano',     sub: 'Últimos 12 meses' },
]

const MOOD_LABELS: Record<string, string>  = { positive:'Bem-estar', negative:'Cuidado', neutral:'Equilíbrio', mixed:'Complexo', anxious:'Atenção' }
const MOOD_COLORS: Record<string, string>  = { positive:'#22C55E', negative:'#EF4444', neutral:'#8B5CF6', mixed:'#F59E0B', anxious:'#6366F1' }

export default function Reports() {
  const navigate    = useNavigate()
  const { user }    = useAuth()
  const { isDark, toggle } = useTheme()

  const C = isDark ? {
    bg: '#111111', surface: '#1A1A1A', border: '#272727', borderHov: '#383838',
    text: '#F5F5F5', textSub: '#A0A0A0', textMuted: '#606060',
    accent: '#8B5CF6', accentBg: '#1E1535',
  } : {
    bg: '#F7F7F8', surface: '#FFFFFF', border: '#E8E8E8', borderHov: '#D0D0D0',
    text: '#0F0F0F', textSub: '#6B6B6B', textMuted: '#9B9B9B',
    accent: '#7C3AED', accentBg: '#F4F0FF',
  }

  const [period, setPeriod]       = useState('weekly')
  const [report, setReport]       = useState<Report | null>(null)
  const [loading, setLoading]     = useState(false)
  const [generating, setGenerating] = useState(false)
  const [msgCount, setMsgCount]   = useState(0)

  useEffect(() => { if (user) fetchReport() }, [period, user])

  async function fetchReport() {
    if (!user) return
    setLoading(true); setReport(null)
    const now = new Date(); let start = new Date()
    if (period === 'daily')   start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (period === 'weekly')  start.setDate(now.getDate() - 7)
    if (period === 'monthly') start.setDate(now.getDate() - 30)
    if (period === 'annual')  start.setFullYear(now.getFullYear() - 1)
    const startStr = start.toISOString().split('T')[0]
    const { data } = await supabase.from('reports').select('*').eq('user_id', user.id).eq('period_type', period).gte('period_start', startStr).order('created_at', { ascending: false }).limit(1).single()
    setReport(data || null)
    const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', start.toISOString())
    setMsgCount(count || 0)
    setLoading(false)
  }

  async function generateReport() {
    if (!user || generating) return
    setGenerating(true)
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey) { setGenerating(false); return }
    const now = new Date(); let start = new Date()
    if (period === 'daily')   start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (period === 'weekly')  start.setDate(now.getDate() - 7)
    if (period === 'monthly') start.setDate(now.getDate() - 30)
    if (period === 'annual')  start.setFullYear(now.getFullYear() - 1)
    const { data: msgs } = await supabase.from('messages').select('role,content,sentiment').eq('user_id', user.id).gte('created_at', start.toISOString()).order('created_at', { ascending: true }).limit(80)
    if (!msgs || msgs.length === 0) { setGenerating(false); return }
    const transcript = msgs.map(m => `[${m.role === 'user' ? 'Usuário' : 'IA'}]: ${m.content.slice(0, 200)}`).join('\n')
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, messages: [{ role: 'user', content: `Analise e gere JSON (sem markdown):\n${transcript}\n\nFormato: {"dominant_mood":"positive|negative|neutral|mixed|anxious","recurring_themes":["tema1","tema2"],"progress_notes":"2-3 frases","suggestions":["s1","s2","s3"]}` }] })
      })
      const data = await res.json()
      const parsed = JSON.parse(data.content?.[0]?.text?.replace(/```json|```/g, '').trim() || '{}')
      await supabase.from('reports').upsert({ user_id: user.id, period_type: period, period_start: start.toISOString().split('T')[0], period_end: now.toISOString().split('T')[0], dominant_mood: parsed.dominant_mood, recurring_themes: parsed.recurring_themes || [], progress_notes: parsed.progress_notes, suggestions: parsed.suggestions || [], message_count: msgs.length }, { onConflict: 'user_id,period_type,period_start' })
      await fetchReport()
    } catch (e) { console.error(e) }
    setGenerating(false)
  }

  const moodColor = report?.dominant_mood ? (MOOD_COLORS[report.dominant_mood] || C.accent) : C.accent
  const moodLabel = report?.dominant_mood ? (MOOD_LABELS[report.dominant_mood] || 'Neutro') : '—'

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }
    body { -webkit-font-smoothing:antialiased; }
    @keyframes fIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes shimmer { from{background-position:-200% 0} to{background-position:200% 0} }
    ::-webkit-scrollbar { width:4px; }
    ::-webkit-scrollbar-thumb { background:${isDark?'#333':'#D4D4D4'}; border-radius:4px; }
  `

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, fontFamily: "'Inter',sans-serif" }}>
      <style>{CSS}</style>

      {/* Header */}
      <header style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, height: 56, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/app')} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.12s' }}
            onMouseEnter={e => (e.currentTarget.style.background = C.accentBg)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: -0.3 }}>Relatórios</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 400, color: C.textMuted }}>
            {msgCount} mensagem{msgCount !== 1 ? 's' : ''}
          </span>
          <button onClick={toggle} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isDark
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.textSub} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.textSub} strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 20px 64px' }}>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)} style={{
              flex: '1 1 auto', minWidth: 70, height: 60, padding: '0 12px',
              borderRadius: 10, cursor: 'pointer', fontFamily: "'Inter',sans-serif",
              background: period === p.key ? C.accentBg : C.surface,
              border: `1px solid ${period === p.key ? C.accent + '50' : C.border}`,
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { if (period !== p.key) e.currentTarget.style.borderColor = C.borderHov }}
              onMouseLeave={e => { if (period !== p.key) e.currentTarget.style.borderColor = C.border }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: period === p.key ? C.accent : C.text, margin: '0 0 2px', fontFamily: "'Inter',sans-serif" }}>{p.label}</p>
              <p style={{ fontSize: 11, fontWeight: 400, color: period === p.key ? C.accent : C.textMuted, margin: 0, opacity: 0.8 }}>{p.sub}</p>
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[100, 80, 140, 180].map((h, i) => (
              <div key={i} style={{ height: h, borderRadius: 12, background: `linear-gradient(90deg, ${C.surface} 0%, ${isDark?'#222':'#EEEEEE'} 50%, ${C.surface} 100%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !report && (
          <div style={{ textAlign: 'center', padding: '60px 24px', animation: 'fIn 0.4s ease' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: C.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8, letterSpacing: -0.3 }}>Sem relatório para este período</h3>
            <p style={{ fontSize: 14, fontWeight: 400, color: C.textSub, lineHeight: 1.7, maxWidth: 320, margin: '0 auto 28px' }}>
              {msgCount > 0 ? `Você tem ${msgCount} mensagem${msgCount !== 1 ? 's' : ''} neste período. Gere sua análise.` : 'Não há conversas suficientes para gerar uma análise.'}
            </p>
            {msgCount > 0 && (
              <button onClick={generateReport} disabled={generating} style={{ height: 40, padding: '0 24px', borderRadius: 8, border: 'none', background: generating ? C.accentBg : C.accent, color: generating ? C.accent : '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer', fontFamily: "'Inter',sans-serif", transition: 'all 0.15s' }}>
                {generating ? 'Analisando...' : 'Gerar relatório com IA'}
              </button>
            )}
          </div>
        )}

        {/* Report content */}
        {!loading && report && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fIn 0.4s ease' }}>

            {/* Mood card */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: moodColor, borderRadius: '12px 12px 0 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>Estado emocional dominante</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: moodColor, flexShrink: 0 }} />
                    <h2 style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: -0.5 }}>{moodLabel}</h2>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 11, fontWeight: 400, color: C.textMuted, marginBottom: 4 }}>{PERIODS.find(p => p.key === period)?.sub}</p>
                  <p style={{ fontSize: 28, fontWeight: 700, color: C.accent }}>{report.message_count}</p>
                  <p style={{ fontSize: 12, fontWeight: 400, color: C.textMuted }}>mensagens</p>
                </div>
              </div>
            </div>

            {/* Themes */}
            {report.recurring_themes?.length > 0 && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 14 }}>Temas recorrentes</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {report.recurring_themes.map((theme, i) => (
                    <span key={i} style={{ padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 500, background: C.accentBg, color: C.accent, border: `1px solid ${C.accent}25` }}>{theme}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Progress */}
            {report.progress_notes && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px', borderLeft: `3px solid ${C.accent}` }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 }}>Análise de progresso</p>
                <p style={{ fontSize: 14, fontWeight: 400, color: C.textSub, lineHeight: 1.75, fontStyle: 'italic' }}>"{report.progress_notes}"</p>
              </div>
            )}

            {/* Suggestions */}
            {report.suggestions?.length > 0 && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 14 }}>Recomendações da IA</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {report.suggestions.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 9, background: isDark ? '#141414' : '#FAFAFA', border: `1px solid ${C.border}` }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: C.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.accent, flexShrink: 0 }}>{i + 1}</span>
                      <p style={{ fontSize: 14, fontWeight: 400, color: C.textSub, lineHeight: 1.7, margin: 0 }}>{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
              <p style={{ fontSize: 12, color: C.textMuted }}>Gerado em {new Date(report.period_end).toLocaleDateString('pt-BR')}</p>
              <button onClick={generateReport} disabled={generating} style={{ height: 34, padding: '0 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSub, fontSize: 13, fontWeight: 500, cursor: generating ? 'not-allowed' : 'pointer', fontFamily: "'Inter',sans-serif", transition: 'all 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSub }}>
                {generating ? 'Atualizando...' : 'Atualizar análise'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}