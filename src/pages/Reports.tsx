import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";
import { UserNav } from "@/components/UserNav";

interface Report {
  id: string;
  period_type: string;
  period_start: string;
  period_end: string;
  dominant_mood: string | null;
  recurring_themes: string[];
  progress_notes: string | null;
  suggestions: string[];
  message_count: number;
}

const PERIODS = [
  { key: "daily", label: "Hoje", sub: "Resumo do dia" },
  { key: "weekly", label: "Semana", sub: "Últimos 7 dias" },
  { key: "monthly", label: "Mês", sub: "Últimos 30 dias" },
  { key: "annual", label: "Ano", sub: "Últimos 12 meses" },
];
const MOOD_LABEL: Record<string, string> = {
  positive: "Bem-estar",
  negative: "Cuidado",
  neutral: "Equilíbrio",
  mixed: "Complexo",
  anxious: "Atenção",
};
const MOOD_COLOR: Record<string, string> = {
  positive: "#22C55E",
  negative: "#EF4444",
  neutral: "#2563EB",
  mixed: "#F59E0B",
  anxious: "#6366F1",
};

export default function Reports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark, toggle } = useTheme();

  const ACCENT = isDark ? "#60A5FA" : "#2563EB";
  const C: Record<string, string> = isDark
    ? {
        bg: "#0F172A",
        surface: "#1E293B",
        border: "#1E293B",
        borderHov: "#334155",
        text: "#F1F5F9",
        textSub: "#94A3B8",
        textMuted: "#475569",
        accent: ACCENT,
        accentBg: "rgba(30,64,175,0.2)",
        inner: "#0F172A",
      }
    : {
        bg: "#F0F9FF",
        surface: "#FFFFFF",
        border: "#E0F2FE",
        borderHov: "#BFDBFE",
        text: "#0F172A",
        textSub: "#374151",
        textMuted: "#64748B",
        accent: ACCENT,
        accentBg: "#EFF6FF",
        inner: "#F8FAFC",
      };

  const [period, setPeriod] = useState("weekly");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [msgCount, setMsgCount] = useState(0);

  useEffect(() => {
    if (user) load();
  }, [period, user]);

  function getRange() {
    const now = new Date();
    const start = new Date();
    if (period === "daily")
      start.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
    if (period === "weekly") start.setDate(now.getDate() - 7);
    if (period === "monthly") start.setDate(now.getDate() - 30);
    if (period === "annual") start.setFullYear(now.getFullYear() - 1);
    return { start, now };
  }

  async function load() {
    if (!user) return;
    setLoading(true);
    setReport(null);
    const { start } = getRange();
    const { data } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", user.id)
      .eq("period_type", period)
      .gte("period_start", start.toISOString().split("T")[0])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    setReport(data || null);
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", start.toISOString());
    setMsgCount(count || 0);
    setLoading(false);
  }

  async function generate() {
    if (!user || generating) return;
    setGenerating(true);
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      setGenerating(false);
      return;
    }
    const { start, now } = getRange();
    const { data: msgs } = await supabase
      .from("messages")
      .select("role,content")
      .eq("user_id", user.id)
      .gte("created_at", start.toISOString())
      .order("created_at", { ascending: true })
      .limit(80);
    if (!msgs || msgs.length === 0) {
      setGenerating(false);
      return;
    }
    const transcript = msgs
      .map(
        (m) =>
          `[${m.role === "user" ? "Usuário" : "IA"}]: ${m.content.slice(0, 200)}`,
      )
      .join("\n");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Analise e responda SOMENTE com JSON válido sem markdown:\n${transcript}\n\nFormato: {"dominant_mood":"positive|negative|neutral|mixed|anxious","recurring_themes":["t1","t2"],"progress_notes":"análise 2-3 frases","suggestions":["s1","s2","s3"]}`,
            },
          ],
        }),
      });
      const data = await res.json();
      const parsed = JSON.parse(
        data.content?.[0]?.text?.replace(/```json|```/g, "").trim() || "{}",
      );
      await supabase.from("reports").upsert(
        {
          user_id: user.id,
          period_type: period,
          period_start: start.toISOString().split("T")[0],
          period_end: now.toISOString().split("T")[0],
          dominant_mood: parsed.dominant_mood,
          recurring_themes: parsed.recurring_themes || [],
          progress_notes: parsed.progress_notes,
          suggestions: parsed.suggestions || [],
          message_count: msgs.length,
        },
        { onConflict: "user_id,period_type,period_start" },
      );
      await load();
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  }

  const moodColor = report?.dominant_mood
    ? MOOD_COLOR[report.dominant_mood] || ACCENT
    : ACCENT;
  const moodLabel = report?.dominant_mood
    ? MOOD_LABEL[report.dominant_mood] || "Neutro"
    : "—";

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: C.bg,
        fontFamily: "'Inter',sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{-webkit-font-smoothing:antialiased;}
        @keyframes fIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{from{background-position:-200% 0}to{background-position:200% 0}}
        @keyframes footerBeam{0%{background-position:-200% 50%}100%{background-position:200% 50%}}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:${isDark ? "#334155" : "#BFDBFE"};border-radius:4px;}
      `}</style>

      <header
        style={{
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          height: 56,
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <UserNav isDark={isDark} />
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: C.text,
              letterSpacing: -0.3,
            }}
          >
            Relatórios
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: C.textMuted }}>
            {msgCount} mensagem{msgCount !== 1 ? "s" : ""}
          </span>
          <button
            onClick={toggle}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = C.accentBg)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke={C.textSub}
              strokeWidth="2"
              strokeLinecap="round"
            >
              {isDark ? (
                <>
                  <circle cx="12" cy="12" r="4" />
                  <line x1="12" y1="2" x2="12" y2="4" />
                  <line x1="12" y1="20" x2="12" y2="22" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="2" y1="12" x2="4" y2="12" />
                  <line x1="20" y1="12" x2="22" y2="12" />
                </>
              ) : (
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              )}
            </svg>
          </button>
        </div>
      </header>
      <div
        style={{ maxWidth: 680, margin: "0 auto", padding: "28px 20px 80px" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 8,
            marginBottom: 24,
          }}
        >
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              style={{
                padding: "12px 8px",
                borderRadius: 10,
                cursor: "pointer",
                fontFamily: "'Inter',sans-serif",
                background: period === p.key ? C.accentBg : C.surface,
                border: `1px solid ${period === p.key ? `${ACCENT}45` : C.border}`,
                transition: "all 0.15s",
                textAlign: "center",
              }}
              onMouseEnter={(e) => {
                if (period !== p.key)
                  e.currentTarget.style.borderColor = C.borderHov;
              }}
              onMouseLeave={(e) => {
                if (period !== p.key)
                  e.currentTarget.style.borderColor = C.border;
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: period === p.key ? ACCENT : C.text,
                  margin: "0 0 2px",
                  fontFamily: "'Inter',sans-serif",
                }}
              >
                {p.label}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: period === p.key ? ACCENT : C.textMuted,
                  margin: 0,
                  opacity: 0.8,
                }}
              >
                {p.sub}
              </p>
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[88, 72, 130, 160].map((h, i) => (
              <div
                key={i}
                style={{
                  height: h,
                  borderRadius: 12,
                  background: `linear-gradient(90deg,${C.surface} 0%,${isDark ? "#334155" : "#DBEAFE"} 50%,${C.surface} 100%)`,
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s infinite",
                }}
              />
            ))}
          </div>
        )}

        {!loading && !report && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 24px",
              animation: "fIn 0.4s ease",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: C.accentBg,
                border: `1px solid ${isDark ? "#1E40AF" : "#BFDBFE"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                boxShadow: `0 0 20px ${ACCENT}20`,
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke={ACCENT}
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
                <line x1="2" y1="20" x2="22" y2="20" />
              </svg>
            </div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: C.text,
                marginBottom: 8,
                letterSpacing: -0.3,
              }}
            >
              Sem relatório para este período
            </h3>
            <p
              style={{
                fontSize: 13,
                color: C.textSub,
                lineHeight: 1.7,
                maxWidth: 300,
                margin: "0 auto 28px",
              }}
            >
              {msgCount > 0
                ? `Você tem ${msgCount} mensagem${msgCount !== 1 ? "s" : ""} neste período. Gere sua análise.`
                : "Sem conversas suficientes neste período."}
            </p>
            {msgCount > 0 && (
              <button
                onClick={generate}
                disabled={generating}
                style={{
                  height: 40,
                  padding: "0 24px",
                  borderRadius: 8,
                  border: "none",
                  background: generating ? C.accentBg : ACCENT,
                  color: generating ? ACCENT : "#FFF",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: generating ? "not-allowed" : "pointer",
                  fontFamily: "'Inter',sans-serif",
                  transition: "all 0.15s",
                }}
              >
                {generating ? "Analisando..." : "Gerar relatório com IA"}
              </button>
            )}
          </div>
        )}

        {!loading && report && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              animation: "fIn 0.4s ease",
            }}
          >
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: 20,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: moodColor,
                  borderRadius: "12px 12px 0 0",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: 0.7,
                      marginBottom: 10,
                    }}
                  >
                    Estado emocional dominante
                  </p>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: moodColor,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: C.text,
                        letterSpacing: -0.4,
                      }}
                    >
                      {moodLabel}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p
                    style={{
                      fontSize: 11,
                      color: C.textMuted,
                      marginBottom: 4,
                    }}
                  >
                    {PERIODS.find((p) => p.key === period)?.sub}
                  </p>
                  <p
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: ACCENT,
                      lineHeight: 1,
                    }}
                  >
                    {report.message_count}
                  </p>
                  <p style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                    mensagens
                  </p>
                </div>
              </div>
            </div>

            {report.recurring_themes?.length > 0 && (
              <div
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 0.7,
                    marginBottom: 14,
                  }}
                >
                  Temas recorrentes
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {report.recurring_themes.map((t, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 500,
                        background: C.accentBg,
                        color: ACCENT,
                        border: `1px solid ${isDark ? "#1E40AF" : "#BFDBFE"}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {report.progress_notes && (
              <div
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderLeft: `3px solid ${ACCENT}`,
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 0.7,
                    marginBottom: 12,
                  }}
                >
                  Análise de progresso
                </p>
                <p
                  style={{
                    fontSize: 14,
                    color: C.textSub,
                    lineHeight: 1.75,
                    fontStyle: "italic",
                  }}
                >
                  "{report.progress_notes}"
                </p>
              </div>
            )}

            {report.suggestions?.length > 0 && (
              <div
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 0.7,
                    marginBottom: 14,
                  }}
                >
                  Recomendações da IA
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {report.suggestions.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: 12,
                        padding: "12px 14px",
                        borderRadius: 9,
                        background: C.inner,
                        border: `1px solid ${C.border}`,
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: C.accentBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          color: ACCENT,
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </span>
                      <p
                        style={{
                          fontSize: 13,
                          color: C.textSub,
                          lineHeight: 1.7,
                          margin: 0,
                        }}
                      >
                        {s}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 4,
              }}
            >
              <p style={{ fontSize: 12, color: C.textMuted }}>
                Gerado em{" "}
                {new Date(report.period_end).toLocaleDateString("pt-BR")}
              </p>
              <button
                onClick={generate}
                disabled={generating}
                style={{
                  height: 34,
                  padding: "0 16px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: "transparent",
                  color: C.textSub,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: generating ? "not-allowed" : "pointer",
                  fontFamily: "'Inter',sans-serif",
                  transition: "all 0.12s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = ACCENT;
                  e.currentTarget.style.color = ACCENT;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.color = C.textSub;
                }}
              >
                {generating ? "Atualizando..." : "Atualizar análise"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          zIndex: 999,
          pointerEvents: "none",
          background:
            "linear-gradient(90deg,transparent 0%,rgba(59,130,246,0) 5%,rgba(96,165,250,0.9) 30%,rgba(147,197,253,1) 50%,rgba(96,165,250,0.9) 70%,rgba(59,130,246,0) 95%,transparent 100%)",
          backgroundSize: "200% 100%",
          animation: "footerBeam 4s linear infinite",
        }}
      />
    </div>
  );
}
