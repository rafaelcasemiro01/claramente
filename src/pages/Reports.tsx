import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { generateReport, PERIODS, ReportData, PeriodType } from '@/lib/reportService'

export default function Reports() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [activePeriod, setActivePeriod] = useState<PeriodType>('weekly')
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  async function handleGenerate() {
    if (!user) return
    setLoading(true)
    setGenerated(false)
    const result = await generateReport(user.id, activePeriod)
    setReport(result)
    setGenerated(true)
    setLoading(false)
  }

  const moodEmoji: Record<string, string> = {
    positive: '😊', negative: '😔', neutral: '😌', mixed: '🌤️'
  }

  return (
    <div className="min-h-screen flex flex-col" style={{background:'#fafaf8'}}>
      {/* Header */}
      <header className="border-b border-gray-100 bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/app')} className="text-gray-400 hover:text-gray-600 transition-colors mr-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background:'#e6f4ed'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2d7a4a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </div>
          <span style={{fontFamily:'Lora,serif', fontSize:'1.2rem', color:'#2c2c2a', fontWeight:600}}>Relatórios</span>
        </div>
        <span className="text-sm text-gray-500">{profile?.name || 'você'}</span>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">

        {/* Seletor de período */}
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-3">Selecione o período de análise:</p>
          <div className="grid grid-cols-4 gap-2">
            {PERIODS.map(p => (
              <button
                key={p.type}
                onClick={() => { setActivePeriod(p.type); setGenerated(false); setReport(null) }}
                className="py-2 px-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: activePeriod === p.type ? '#2d7a4a' : 'white',
                  color: activePeriod === p.type ? 'white' : '#5f5e5a',
                  border: `1px solid ${activePeriod === p.type ? '#2d7a4a' : '#e5e7eb'}`
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Botão gerar */}
        {!generated && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{background:'#e6f4ed'}}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2d7a4a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <h2 style={{fontFamily:'Lora,serif'}} className="text-2xl text-gray-700 mb-2">Análise introspectiva</h2>
            <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
              A IA vai analisar suas conversas e identificar padrões emocionais, temas recorrentes e gerar sugestões personalizadas.
            </p>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-8 py-3 rounded-2xl text-white font-medium transition-all disabled:opacity-60"
              style={{background:'#2d7a4a'}}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/>
                  </svg>
                  Analisando conversas...
                </span>
              ) : `Gerar relatório — ${PERIODS.find(p => p.type === activePeriod)?.label}`}
            </button>
          </div>
        )}

        {/* Relatório gerado */}
        {generated && report && (
          <div className="space-y-4 animate-fade-up">

            {/* Humor predominante */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Humor predominante</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🌿</span>
                <p style={{fontFamily:'Lora,serif'}} className="text-xl text-gray-700">{report.dominant_mood}</p>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Baseado em {report.message_count} mensagem{report.message_count !== 1 ? 's' : ''} · {new Date(report.period_start).toLocaleDateString('pt-BR')} a {new Date(report.period_end).toLocaleDateString('pt-BR')}
              </p>
            </div>

            {/* Temas recorrentes */}
            {report.recurring_themes?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Temas recorrentes</p>
                <div className="flex flex-wrap gap-2">
                  {report.recurring_themes.map((t, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-sm" style={{background:'#e6f4ed', color:'#2d7a4a'}}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Observações */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Observações do período</p>
              <p className="text-gray-600 text-sm leading-relaxed">{report.progress_notes}</p>
            </div>

            {/* Sugestões */}
            {report.suggestions?.length > 0 && (
              <div className="rounded-2xl p-6" style={{background:'#e6f4ed'}}>
                <p className="text-xs uppercase tracking-wide mb-3" style={{color:'#2d7a4a'}}>Sugestões reflexivas</p>
                <ul className="space-y-3">
                  {report.suggestions.map((s, i) => (
                    <li key={i} className="flex gap-3 text-sm" style={{color:'#1a4a2e'}}>
                      <span className="flex-shrink-0 mt-0.5">🌱</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gerar novo */}
            <button
              onClick={() => { setGenerated(false); setReport(null) }}
              className="w-full py-3 rounded-2xl text-sm text-gray-500 border border-gray-200 hover:border-gray-300 transition-all bg-white"
            >
              ← Gerar outro relatório
            </button>

            <p className="text-center text-xs text-gray-400 pb-4">
              Este relatório é apenas uma reflexão — não substitui acompanhamento psicológico profissional.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}