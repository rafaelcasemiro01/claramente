// src/components/MoodHeatmap.tsx
// ─────────────────────────────────────────────────────────────────────
// Heatmap estilo "GitHub contributions" para o humor diário.
// Mostra os últimos N dias em um grid (7 linhas × M colunas).
// Cada célula colorida pelo humor desse dia, ou cinza se sem check-in.
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react'
import { useColors, fontStack } from '@/lib/theme'
import { useDailyCheckin } from '@/hooks/useDailyCheckin'
import type { DailyCheckin, Mood } from '@/types'
import { MOODS } from '@/components/DailyCheckIn'

const MOOD_HEATMAP_COLOR: Record<Mood, string> = {
  happy:   '#d9a05b', // amber dourado
  serene:  '#6b8a54', // sage verde
  neutral: '#c4836a', // terracotta accent
  anxious: '#a06549', // accent deep
  sad:     '#8a7d6e', // muted brown
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] // dom..sáb

interface Props {
  /** Número de dias a exibir (padrão: 35, ou seja, 5 semanas). */
  days?: number
}

interface Cell {
  date: Date
  dateStr: string
  checkin?: DailyCheckin
}

function toYMD(d: Date): string {
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
}

export function MoodHeatmap({ days = 35 }: Props) {
  const t = useColors()
  const { loadHistory } = useDailyCheckin()

  const [history, setHistory] = useState<DailyCheckin[]>([])
  const [loading, setLoading] = useState(true)
  const [hover,   setHover]   = useState<Cell | null>(null)

  useEffect(() => {
    let cancel = false
    setLoading(true)
    loadHistory(days).then(data => {
      if (!cancel) { setHistory(data); setLoading(false) }
    })
    return () => { cancel = true }
  }, [loadHistory, days])

  // Gera as células do grid (data por data, ordem cronológica)
  const cells = useMemo<Cell[]>(() => {
    const map: Record<string, DailyCheckin> = {}
    history.forEach(c => { map[c.checkin_date] = c })

    const result: Cell[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Alinha ao começo da semana (domingo) que cobre o intervalo
    const start = new Date(today)
    start.setDate(today.getDate() - (days - 1))
    const offset = start.getDay() // 0..6
    start.setDate(start.getDate() - offset)

    // Total de células até alinhar ao fim da semana de hoje
    const todayOffset = 6 - today.getDay()
    const total = days + offset + todayOffset

    for (let i = 0; i < total; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const dateStr = toYMD(d)
      result.push({ date: d, dateStr, checkin: map[dateStr] })
    }
    return result
  }, [history, days])

  // Organiza por colunas (semanas) e linhas (dias da semana)
  const weeks = useMemo<Cell[][]>(() => {
    const w: Cell[][] = []
    for (let i = 0; i < cells.length; i += 7) {
      w.push(cells.slice(i, i + 7))
    }
    return w
  }, [cells])

  // Detecta mudanças de mês para legendas
  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = []
    let lastMonth = -1
    weeks.forEach((w, i) => {
      const firstDay = w[0]?.date
      if (!firstDay) return
      const m = firstDay.getMonth()
      if (m !== lastMonth) {
        labels.push({ col: i, label: monthLabel(firstDay) })
        lastMonth = m
      }
    })
    return labels
  }, [weeks])

  const today = useMemo(() => toYMD(new Date()), [])
  const todayWithinRange = cells.some(c => c.dateStr === today)

  const cellSize = 14
  const cellGap  = 3

  if (loading) {
    return (
      <div style={{
        background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14,
        padding: 22, marginBottom: 10, fontFamily: fontStack, minHeight: 200,
      }}>
        <p style={kicker(t)}>Seu humor nos últimos dias</p>
        <div style={{ height: 140, background: t.surface2, opacity: 0.4, borderRadius: 8 }}/>
      </div>
    )
  }

  const hasAny = history.length > 0
  if (!hasAny) {
    return (
      <div style={{
        background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14,
        padding: 22, marginBottom: 10, fontFamily: fontStack,
      }}>
        <p style={kicker(t)}>Seu humor nos últimos dias</p>
        <p style={{ fontSize: 13, color: t.textSub, lineHeight: 1.6 }}>
          Você ainda não fez check-ins. Comece a registrar como está se sentindo todos os dias para ver a evolução aqui.
        </p>
      </div>
    )
  }

  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14,
      padding: 22, marginBottom: 10, fontFamily: fontStack,
    }}>
      <p style={kicker(t)}>Seu humor nos últimos {days} dias</p>

      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ display: 'inline-block', minWidth: 'min-content' }}>

          {/* Month labels */}
          <div style={{
            display: 'grid', marginBottom: 4, marginLeft: 18,
            gridTemplateColumns: `repeat(${weeks.length}, ${cellSize}px)`,
            columnGap: cellGap,
            fontSize: 10, color: t.textMuted, fontWeight: 500,
          }}>
            {weeks.map((_, i) => {
              const found = monthLabels.find(l => l.col === i)
              return (
                <div key={i} style={{ textAlign: 'left', minHeight: 12 }}>
                  {found ? found.label : ''}
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: cellGap }}>
            {/* Weekday labels */}
            <div style={{
              display: 'grid', gridTemplateRows: `repeat(7, ${cellSize}px)`,
              gap: cellGap, marginRight: 4,
              fontSize: 9, color: t.textMuted, fontWeight: 500,
            }}>
              {WEEKDAY_LABELS.map((w, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                  width: 10, opacity: i % 2 === 0 ? 1 : 0.4,
                }}>{w}</div>
              ))}
            </div>

            {/* Grid */}
            <div style={{
              display: 'grid', gridAutoFlow: 'column',
              gridTemplateRows: `repeat(7, ${cellSize}px)`,
              gridAutoColumns: `${cellSize}px`,
              gap: cellGap,
            }}>
              {cells.map((c, i) => {
                const isFuture = c.date.getTime() > Date.now()
                const isToday  = c.dateStr === today
                const color = c.checkin ? MOOD_HEATMAP_COLOR[c.checkin.mood] : 'transparent'
                return (
                  <div
                    key={i}
                    onMouseEnter={() => setHover(c)}
                    onMouseLeave={() => setHover(prev => prev === c ? null : prev)}
                    style={{
                      width: cellSize, height: cellSize, borderRadius: 3,
                      background: c.checkin ? color : (isFuture ? 'transparent' : t.surface2),
                      border: isToday ? `1.5px solid ${t.accent}` : `1px solid ${t.borderSoft}`,
                      opacity: isFuture ? 0.15 : 1,
                      cursor: c.checkin ? 'help' : 'default',
                      transition: 'transform 0.12s',
                      transform: hover === c ? 'scale(1.25)' : 'scale(1)',
                    }}
                  />
                )
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Hover detail / legend */}
      <div style={{
        marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        {hover && hover.checkin ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: t.textSub }}>
            <span style={{ fontSize: 18 }}>{MOODS.find(m => m.value === hover.checkin!.mood)?.emoji}</span>
            <span style={{ fontWeight: 600, color: t.text }}>
              {MOODS.find(m => m.value === hover.checkin!.mood)?.label}
            </span>
            <span style={{ color: t.textMuted }}>·</span>
            <span>{hover.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
            {hover.checkin.note && (
              <span style={{ color: t.textMuted, fontStyle: 'italic', marginLeft: 4 }}>
                "{hover.checkin.note.length > 50 ? hover.checkin.note.slice(0, 50) + '...' : hover.checkin.note}"
              </span>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: t.textMuted }}>
            <span>Menos</span>
            {MOODS.map(m => (
              <span key={m.value}
                title={m.label}
                style={{
                  display: 'inline-block', width: 11, height: 11, borderRadius: 3,
                  background: MOOD_HEATMAP_COLOR[m.value], opacity: 0.85,
                }}
              />
            ))}
            <span>Mais</span>
          </div>
        )}

        <div style={{ fontSize: 11, color: t.textMuted }}>
          {history.length} check-in{history.length !== 1 ? 's' : ''} no período
        </div>
      </div>

      {todayWithinRange && (
        <p style={{ fontSize: 11, color: t.textMuted, marginTop: 8 }}>
          A borda terracotta marca o dia de hoje.
        </p>
      )}
    </div>
  )
}

function kicker(t: ReturnType<typeof useColors>): React.CSSProperties {
  return {
    fontSize: 11, fontWeight: 600, color: t.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.7, margin: '0 0 14px',
  }
}
