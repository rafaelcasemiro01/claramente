// src/pages/Reports.tsx
// ─────────────────────────────────────────────────────────────────────
// Claramente — Relatórios (re-themed)
// Mantém toda a lógica: períodos (Hoje/Semana/Mês/Ano), fetch + análise
// via Anthropic API, upsert na tabela `reports`. Visual migrado.
// ─────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'
import { UserNav } from '@/components/UserNav'
import { MoodHeatmap } from '@/components/MoodHeatmap'
import { useColors, fontStack } from '@/lib/theme'

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

const PERIODS = [
  { key: 'daily',   label: 'Hoje',   sub: 'Resumo do dia' },
  { key: 'weekly',  label: 'Semana', sub: 'Últimos 7 dias' },
  { key: 'monthly', label: 'Mês',    sub: 'Últimos 30 dias' },
  { key: 'annual',  label: 'Ano',    sub: 'Últimos 12 meses' },
]

// Cores quentes para os moods. Mantém o significado, troca a paleta.
const MOOD_LABEL: Record<string, string> = {
  positive:  'Bem-estar',
  negative:  'Cuidado',
  neutral:   'Equilíbrio',
  mixed:     'Complexo',
  anxious:   'Atenção',
}
const MOOD_COLOR: Record<string, string> = {
  positive:  '#6b8a54', // sage
  negative:  '#b8553f', // danger
  neutral:   '#c4836a', // accent
  mixed:     '#d9a05b', // warm amber
  anxious:   '#a06549', // accent deep
}

export default function Reports() {
  useNavigate() // mantido p/ paridade
  const { user } = useAuth()
  const { isDark, toggle } = useTheme()
  const t = useColors()

  const [period,     setPeriod]     = useState('weekly')
  const [report,     setReport]     = useState<Report | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [generating, setGenerating] = useState(false)
  const [msgCount,   setMsgCount]   = useState(0)

  useEffect(() => { if (user) load() }, [period, user])

  /** Exporta o relatório atual como PDF via diálogo de impressão do navegador. */
  function exportPDF() {
    window.print()
  }

  function getRange() {
    const now = new Date()
    const start = new Date()
    if (period === 'daily')   start.setFullYear(now.getFullYear(), now.getMonth(), now.getDate())
    if (period === 'weekly')  start.setDate(now.getDate() - 7)
    if (period === 'monthly') start.setDate(now.getDate() - 30)
    if (period === 'annual')  start.setFullYear(now.getFullYear() - 1)
    return { start, now }
  }

  async function load() {
    if (!user) return
    setLoading(true); setReport(null)
    const { start } = getRange()
    const { data } = await supabase
      .from('reports').select('*')
      .eq('user_id', user.id).eq('period_type', period)
      .gte('period_start', start.toISOString().split('T')[0])
      .order('created_at', { ascending: false })
      .limit(1).single()
    setReport(data || null)
    const { count } = await supabase
      .from('messages').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('created_at', start.toISOString())
    setMsgCount(count || 0)
    setLoading(false)
  }

  async function generate() {
    if (!user || generating) return
    setGenerating(true)
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey) { setGenerating(false); return }
    const { start, now } = getRange()
    const { data: msgs } = await supabase
      .from('messages').select('role,content')
      .eq('user_id', user.id).gte('created_at', start.toISOString())
      .order('created_at', { ascending: true }).limit(80)
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
            content: `Analise e responda SOMENTE com JSON válido sem markdown:\n${transcript}\n\nFormato: {"dominant_mood":"positive|negative|neutral|mixed|anxious","recurring_themes":["t1","t2"],"progress_notes":"análise 2-3 frases","suggestions":["s1","s2","s3"]}`,
          }],
        }),
      })
      const data = await res.json()
      const parsed = JSON.parse(
        data.content?.[0]?.text?.replace(/```json|```/g, '').trim() || '{}'
      )
      await supabase.from('reports').upsert({
        user_id: user.id,
        period_type: period,
        period_start: start.toISOString().split('T')[0],
        period_end: now.toISOString().split('T')[0],
        dominant_mood: parsed.dominant_mood,
        recurring_themes: parsed.recurring_themes || [],
        progress_notes: parsed.progress_notes,
        suggestions: parsed.suggestions || [],
        message_count: msgs.length,
      }, { onConflict: 'user_id,period_type,period_start' })
      await load()
    } catch (e) {
      console.error(e)
    }
    setGenerating(false)
  }

  const moodColor = report?.dominant_mood ? MOOD_COLOR[report.dominant_mood] || t.accent : t.accent
  const moodLabel = report?.dominant_mood ? MOOD_LABEL[report.dominant_mood] || 'Neutro' : '—'

  const card: React.CSSProperties = {
    background: t.surface, border: `1px solid ${t.border}`,
    borderRadius: 14, padding: 22, marginBottom: 10,
  }
  const kicker: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: t.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.7, margin: '0 0 14px',
  }

  return (
    <div style={{ minHeight: '100dvh', background: t.bg, fontFamily: fontStack }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{-webkit-font-smoothing:antialiased;}
        @keyframes fIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{from{background-position:-200% 0}to{background-position:200% 0}}
        ::-webkit-scrollbar{width:6px;}
        ::-webkit-scrollbar-thumb{background:${isDark ? 'rgba(196,131,106,0.22)' : 'rgba(160,101,73,0.18)'};border-radius:4px;}
        @media print {
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          header { position: static !important; border: none !important; }
          @page { size: A4; margin: 1.2cm; }
        }
      `}</style>

      <header style={{
        background: t.surface, borderBottom: `1px solid ${t.border}`,
        height: 56, padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <UserNav isDark={isDark}/>
          <span style={{ fontSize: 15, fontWeight: 700, color: t.text, letterSpacing: -0.3 }}>Relatórios</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="no-print">
          <span style={{ fontSize: 12.5, color: t.textMuted }}>
            {msgCount} mensage{msgCount !== 1 ? 'ns' : 'm'}
          </span>
          <button onClick={exportPDF} title="Exportar como PDF" style={{
            height: 36, padding: '0 14px', borderRadius: 10,
            border: `1px solid ${t.border}`, background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 7,
            color: t.textSub, fontSize: 12.5, fontWeight: 600, fontFamily: fontStack,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6M9 15l3 3 3-3"/>
            </svg>
            PDF
          </button>
          <button onClick={toggle} style={{
            width: 36, height: 36, borderRadius: 10,
            border: `1px solid ${t.border}`, background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.textSub} strokeWidth="2" strokeLinecap="round">
              {isDark
                ? <><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/></>
                : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>}
            </svg>
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 20px 80px' }}>
        {/* Period tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 22 }}>
          {PERIODS.map(p => {
            const active = period === p.key
            return (
              <button key={p.key} onClick={() => setPeriod(p.key)} style={{
                padding: '12px 8px', borderRadius: 12, cursor: 'pointer', fontFamily: fontStack,
                background: active ? t.accentSoft : t.surface,
                border: `1px solid ${active ? t.accentBorder : t.borderSoft}`,
                textAlign: 'center', transition: 'all 0.15s',
              }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: active ? t.accentDeep : t.text, margin: '0 0 2px' }}>{p.label}</p>
                <p style={{ fontSize: 11, color: active ? t.accentDeep : t.textMuted, margin: 0, opacity: 0.85 }}>{p.sub}</p>
              </button>
            )
          })}
        </div>

        {/* Heatmap de humor — sempre visível, usa os check-ins diários */}
        <MoodHeatmap days={35}/>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[88, 72, 130, 160].map((h, i) => (
              <div key={i} style={{
                height: h, borderRadius: 14,
                background: `linear-gradient(90deg, ${t.surface} 0%, ${isDark ? t.surface3 : t.surface2} 50%, ${t.surface} 100%)`,
                backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
              }}/>
            ))}
          </div>
        )}

        {!loading && !report && (
          <div style={{ textAlign: 'center', padding: '60px 24px', animation: 'fIn 0.4s ease' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: t.accentSoft, border: `1px solid ${t.accentBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', boxShadow: `0 0 24px ${t.accent}33`,
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={t.accentDeep} strokeWidth="1.5" strokeLinecap="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
                <line x1="2" y1="20" x2="22" y2="20"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 8, letterSpacing: -0.3 }}>
              Sem relatório para este período
            </h3>
            <p style={{ fontSize: 13.5, color: t.textSub, lineHeight: 1.7, maxWidth: 320, margin: '0 auto 28px' }}>
              {msgCount > 0
                ? `Você tem ${msgCount} mensage${msgCount !== 1 ? 'ns' : 'm'} neste período. Gere sua análise.`
                : 'Sem conversas suficientes neste período.'}
            </p>
            {msgCount > 0 && (
              <button onClick={generate} disabled={generating} style={{
                height: 44, padding: '0 24px', borderRadius: 12, border: 'none',
                background: generating ? t.accentSoft : t.accent,
                color: generating ? t.accent : '#fff',
                fontSize: 14, fontWeight: 600, fontFamily: fontStack,
                cursor: generating ? 'not-allowed' : 'pointer',
                boxShadow: generating ? 'none' : `0 4px 14px ${t.accent}55, inset 0 1px 0 rgba(255,255,255,0.22)`,
                transition: 'all 0.15s',
              }}>
                {generating ? 'Analisando...' : 'Gerar relatório com IA'}
              </button>
            )}
          </div>
        )}

        {!loading && report && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fIn 0.4s ease' }}>

            {/* Mood card */}
            <div style={{ ...card, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: moodColor }}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <p style={kicker}>Estado emocional dominante</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: moodColor, boxShadow: `0 0 8px ${moodColor}`, flexShrink: 0 }}/>
                    <span style={{ fontSize: 24, fontWeight: 700, color: t.text, letterSpacing: -0.4 }}>{moodLabel}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 11, color: t.textMuted, marginBottom: 4 }}>
                    {PERIODS.find(p => p.key === period)?.sub}
                  </p>
                  <p style={{ fontSize: 32, fontWeight: 700, color: t.accentDeep, lineHeight: 1, letterSpacing: -1 }}>
                    {report.message_count}
                  </p>
                  <p style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>mensagens</p>
                </div>
              </div>
            </div>

            {/* Themes */}
            {report.recurring_themes?.length > 0 && (
              <div style={card}>
                <p style={kicker}>Temas recorrentes</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {report.recurring_themes.map((tag, i) => (
                    <span key={i} style={{
                      padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500,
                      background: t.accentSoft, color: t.accentDeep, border: `1px solid ${t.accentBorder}`,
                    }}>{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Progress notes */}
            {report.progress_notes && (
              <div style={{ ...card, borderLeft: `3px solid ${t.accent}`, borderRadius: '4px 14px 14px 4px' }}>
                <p style={kicker}>Análise de progresso</p>
                <p style={{ fontSize: 14.5, color: t.textSub, lineHeight: 1.75, fontStyle: 'italic' }}>
                  "{report.progress_notes}"
                </p>
              </div>
            )}

            {/* Suggestions */}
            {report.suggestions?.length > 0 && (
              <div style={card}>
                <p style={kicker}>Recomendações</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {report.suggestions.map((s, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 10,
                      background: isDark ? t.surface3 : t.surface2,
                      border: `1px solid ${t.borderSoft}`, alignItems: 'flex-start',
                    }}>
                      <span style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: t.accentSoft, color: t.accentDeep,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, flexShrink: 0,
                      }}>{i + 1}</span>
                      <p style={{ fontSize: 13.5, color: t.textSub, lineHeight: 1.7, margin: 0 }}>{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
              <p style={{ fontSize: 12, color: t.textMuted }}>
                Gerado em {new Date(report.period_end).toLocaleDateString('pt-BR')}
              </p>
              <button onClick={generate} disabled={generating} style={{
                height: 34, padding: '0 16px', borderRadius: 10,
                border: `1px solid ${t.border}`, background: 'transparent',
                color: t.textSub, fontSize: 13, fontWeight: 500, cursor: generating ? 'not-allowed' : 'pointer',
                fontFamily: fontStack, transition: 'all 0.12s',
              }}
                onMouseEnter={e => { if (!generating) { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.color = t.accentDeep } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textSub }}>
                {generating ? 'Atualizando...' : 'Atualizar análise'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
