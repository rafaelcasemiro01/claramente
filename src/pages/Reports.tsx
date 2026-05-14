import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { generateReport, PERIODS } from '@/lib/reportService'
import type { ReportData, PeriodType } from '@/lib/reportService'

const ClaramenteLogo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path d="M24 4L42 15V33L24 44L6 33V15Z" fill="#7C3AED" fillOpacity="0.15" stroke="#7C3AED" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M24 4L6 15H42L24 4Z" fill="#7C3AED" fillOpacity="0.3"/>
    <path d="M6 15L24 26M42 15L24 26" stroke="#7C3AED" strokeWidth="1.2" strokeOpacity="0.7"/>
    <path d="M24 26L24 44" stroke="#7C3AED" strokeWidth="1.2" strokeOpacity="0.5"/>
    <circle cx="24" cy="26" r="2.5" fill="#7C3AED"/>
  </svg>
)

export default function Reports() {
  const { user, profile } = useAuth()
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

  return (
    <div style={{minHeight:'100vh', display:'flex', flexDirection:'column', background:'#F5F3FF'}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <header style={{background:'white', borderBottom:'1px solid #EDE9FE', padding:'0 20px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:20, boxShadow:'0 1px 12px rgba(109,40,217,0.06)'}}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <button onClick={() => navigate('/app')} style={{background:'#F5F3FF', border:'none', cursor:'pointer', width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <ClaramenteLogo size={28}/>
          <span style={{fontFamily:'Lora, serif', fontSize:18, fontWeight:600, color:'#2D1B69'}}>Relatórios</span>
        </div>
        <span style={{fontSize:13, color:'#B0ABCC', fontFamily:'Plus Jakarta Sans, sans-serif'}}>{profile?.name?.split(' ')[0]}</span>
      </header>

      <div style={{flex:1, maxWidth:640, margin:'0 auto', width:'100%', padding:'32px 16px'}}>

        {/* Período */}
        <div style={{marginBottom:32}}>
          <p style={{fontSize:13, color:'#9B8FCC', marginBottom:12, fontFamily:'Plus Jakarta Sans, sans-serif', fontWeight:500, letterSpacing:0.5, textTransform:'uppercase'}}>
            Período de análise
          </p>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8}}>
            {PERIODS.map(p => (
              <button key={p.type} onClick={() => { setActivePeriod(p.type); setGenerated(false); setReport(null) }}
                style={{
                  padding:'10px 4px', borderRadius:14, border: activePeriod===p.type ? '2px solid #7C3AED' : '1.5px solid #E8E4F5',
                  cursor:'pointer', fontFamily:'Plus Jakarta Sans, sans-serif', fontSize:13, fontWeight:500,
                  background: activePeriod===p.type ? '#EDE9FE' : 'white',
                  color: activePeriod===p.type ? '#6D28D9' : '#9CA3AF',
                  transition:'all 0.2s',
                  boxShadow: activePeriod===p.type ? '0 2px 8px rgba(124,58,237,0.15)' : 'none',
                }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gerar */}
        {!generated && (
          <div style={{textAlign:'center', padding:'40px 20px'}}>
            <div style={{width:88, height:88, borderRadius:'50%', background:'white', border:'2px solid #EDE9FE', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', boxShadow:'0 4px 20px rgba(109,40,217,0.1)'}}>
              <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
                <path d="M24 4L42 15V33L24 44L6 33V15Z" fill="#7C3AED" fillOpacity="0.12" stroke="#7C3AED" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M24 4L6 15H42L24 4Z" fill="#7C3AED" fillOpacity="0.25"/>
                <path d="M6 15L24 26M42 15L24 26" stroke="#7C3AED" strokeWidth="1.2" strokeOpacity="0.7"/>
                <circle cx="24" cy="26" r="2.5" fill="#7C3AED"/>
              </svg>
            </div>
            <h2 style={{fontFamily:'Lora, serif', fontSize:22, color:'#2D1B69', margin:'0 0 10px', fontWeight:600}}>Análise introspectiva</h2>
            <p style={{fontSize:14, color:'#9B8FCC', marginBottom:32, lineHeight:1.6, maxWidth:300, margin:'0 auto 32px'}}>
              A IA analisará suas conversas e revelará padrões emocionais, temas recorrentes e sugestões personalizadas.
            </p>
            <button onClick={handleGenerate} disabled={loading} style={{
              padding:'15px 36px', borderRadius:16, border:'none', cursor: loading ? 'not-allowed':'pointer',
              background: loading ? '#C4B5FD' : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
              color:'white', fontSize:15, fontWeight:600, fontFamily:'Plus Jakarta Sans, sans-serif',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(124,58,237,0.35)',
              transition:'all 0.2s', display:'inline-flex', alignItems:'center', gap:10,
            }}>
              {loading ? (
                <>
                  <svg style={{animation:'spin 1s linear infinite'}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10"/>
                  </svg>
                  Analisando...
                </>
              ) : `Gerar — ${PERIODS.find(p => p.type===activePeriod)?.label}`}
            </button>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Resultado */}
        {generated && report && (
          <div style={{display:'flex', flexDirection:'column', gap:16, animation:'fadeUp 0.4s ease'}}>

            {/* Humor */}
            <div style={{background:'linear-gradient(135deg, #7C3AED, #5B21B6)', borderRadius:20, padding:'24px 22px', color:'white', boxShadow:'0 6px 24px rgba(124,58,237,0.3)'}}>
              <p style={{fontSize:11, textTransform:'uppercase', letterSpacing:1, opacity:0.75, margin:'0 0 12px', fontFamily:'Plus Jakarta Sans, sans-serif', fontWeight:600}}>Humor predominante</p>
              <p style={{fontFamily:'Lora, serif', fontSize:20, margin:'0 0 14px', lineHeight:1.4, fontWeight:600}}>🔮 {report.dominant_mood}</p>
              <p style={{fontSize:12, opacity:0.65, margin:0, fontFamily:'Plus Jakarta Sans, sans-serif'}}>
                Baseado em {report.message_count} mensagem{report.message_count!==1?'s':''} · {new Date(report.period_start).toLocaleDateString('pt-BR')} a {new Date(report.period_end).toLocaleDateString('pt-BR')}
              </p>
            </div>

            {/* Temas */}
            {report.recurring_themes?.length > 0 && (
              <div style={{background:'white', borderRadius:20, padding:'22px', border:'1px solid #EDE9FE', boxShadow:'0 2px 12px rgba(109,40,217,0.06)'}}>
                <p style={{fontSize:11, textTransform:'uppercase', letterSpacing:1, color:'#9B8FCC', margin:'0 0 14px', fontFamily:'Plus Jakarta Sans, sans-serif', fontWeight:600}}>Temas recorrentes</p>
                <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
                  {report.recurring_themes.map((t, i) => (
                    <span key={i} style={{background:'#EDE9FE', color:'#6D28D9', padding:'6px 14px', borderRadius:20, fontSize:13, fontFamily:'Plus Jakarta Sans, sans-serif', fontWeight:500}}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Observações */}
            <div style={{background:'white', borderRadius:20, padding:'22px', border:'1px solid #EDE9FE', boxShadow:'0 2px 12px rgba(109,40,217,0.06)'}}>
              <p style={{fontSize:11, textTransform:'uppercase', letterSpacing:1, color:'#9B8FCC', margin:'0 0 12px', fontFamily:'Plus Jakarta Sans, sans-serif', fontWeight:600}}>Observações do período</p>
              <p style={{fontSize:14, color:'#4A4560', lineHeight:1.75, margin:0, fontFamily:'Plus Jakarta Sans, sans-serif'}}>{report.progress_notes}</p>
            </div>

            {/* Sugestões */}
            {report.suggestions?.length > 0 && (
              <div style={{background:'#F5F3FF', borderRadius:20, padding:'22px', border:'1px solid #DDD6FE'}}>
                <p style={{fontSize:11, textTransform:'uppercase', letterSpacing:1, color:'#7C3AED', margin:'0 0 16px', fontFamily:'Plus Jakarta Sans, sans-serif', fontWeight:600}}>Sugestões reflexivas</p>
                <div style={{display:'flex', flexDirection:'column', gap:12}}>
                  {report.suggestions.map((s, i) => (
                    <div key={i} style={{display:'flex', gap:12, alignItems:'flex-start'}}>
                      <div style={{width:24, height:24, borderRadius:'50%', background:'#EDE9FE', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', marginTop:1}}>
                        <span style={{fontSize:11, color:'#7C3AED', fontWeight:700}}>{i+1}</span>
                      </div>
                      <p style={{fontSize:14, color:'#4A4560', lineHeight:1.65, margin:0, fontFamily:'Plus Jakarta Sans, sans-serif'}}>{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => { setGenerated(false); setReport(null) }} style={{
              width:'100%', padding:'14px', borderRadius:14, fontSize:14, color:'#9B8FCC',
              border:'1.5px solid #E8E4F5', background:'white', cursor:'pointer',
              fontFamily:'Plus Jakarta Sans, sans-serif', transition:'all 0.2s',
            }}>
              ← Gerar novo relatório
            </button>

            <p style={{textAlign:'center', fontSize:11, color:'#C4B5FD', paddingBottom:8, fontFamily:'Plus Jakarta Sans, sans-serif'}}>
              Este relatório é uma reflexão — não substitui acompanhamento psicológico profissional.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}