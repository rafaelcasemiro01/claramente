import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";
import { ClaramenteLogo } from "@/components/Logo";

type Tab = "login" | "signup" | "forgot";
type Step = "form" | "otp";

const RULES = [
  { label: "Mínimo 8 caracteres", ok: (p: string) => p.length >= 8 },
  { label: "Uma letra maiúscula", ok: (p: string) => /[A-Z]/.test(p) },
  { label: "Um número", ok: (p: string) => /[0-9]/.test(p) },
  {
    label: "Um caractere especial (!@#$%)",
    ok: (p: string) => /[!@#$%^&*]/.test(p),
  },
];

function pwStrength(p: string) {
  const n = RULES.filter((r) => r.ok(p)).length;
  return [
    { score: 0, label: "", color: "#E2E8F0" },
    { score: 1, label: "Muito fraca", color: "#EF4444" },
    { score: 2, label: "Fraca", color: "#F59E0B" },
    { score: 3, label: "Boa", color: "#2563EB" },
    { score: 4, label: "Forte", color: "#22C55E" },
  ][n];
}

function checkEmail(v: string) {
  if (!v) return { ok: false, msg: "" };
  if (!v.includes("@")) return { ok: false, msg: "Deve conter @" };
  const [, d] = v.split("@");
  if (!d?.includes(".")) return { ok: false, msg: "Domínio inválido" };
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
    ? { ok: true, msg: "" }
    : { ok: false, msg: "Formato inválido" };
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function Landing() {
  const { signIn, signUp } = useAuth();
  const { isDark, toggle } = useTheme();

  const ACCENT = isDark ? "#60A5FA" : "#2563EB";

  const C = isDark
    ? {
        bg: "#0F172A",
        surface: "#1E293B",
        border: "#334155",
        text: "#F1F5F9",
        textSub: "#94A3B8",
        textMuted: "#64748B",
        accentBg: "rgba(30,64,175,0.2)",
        accentB: "#1E40AF",
        inputBg: "#1E293B",
        inputB: "#334155",
        tabBg: "#0F172A",
        ph: "#475569",
        errBg: "rgba(239,68,68,0.1)",
        errB: "rgba(239,68,68,0.3)",
        errT: "#FCA5A5",
        okBg: "rgba(34,197,94,0.1)",
        okB: "rgba(34,197,94,0.3)",
        okT: "#86EFAC",
      }
    : {
        bg: "#F0F9FF",
        surface: "#FFFFFF",
        border: "#E0F2FE",
        text: "#0F172A",
        textSub: "#374151",
        textMuted: "#64748B",
        accentBg: "#EFF6FF",
        accentB: "#BFDBFE",
        inputBg: "#FFFFFF",
        inputB: "#E0F2FE",
        tabBg: "#F8FAFC",
        ph: "#94A3B8",
        errBg: "#FFF5F5",
        errB: "#FED7D7",
        errT: "#C53030",
        okBg: "#F0FFF4",
        okB: "#C6F6D5",
        okT: "#276749",
      };

  const [tab, setTab] = useState<Tab>("login");
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpErr, setOtpErr] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [pwFocus, setPwFocus] = useState(false);

  const ev = checkEmail(email);
  const st = pwStrength(pw);

  function reset() {
    setError("");
    setInfo("");
    setPw("");
    setPwFocus(false);
    setShowPw(false);
    setOtp("");
    setOtpErr("");
    setStep("form");
  }
  function switchTab(t: Tab) {
    reset();
    setTab(t);
  }

  async function submit() {
    setError("");
    setInfo("");
    setBusy(true);
    if (!email) {
      setError("Informe seu e-mail.");
      setBusy(false);
      return;
    }
    if (!ev.ok) {
      setError(ev.msg || "E-mail inválido.");
      setBusy(false);
      return;
    }

    try {
      if (tab === "forgot") {
        const { error: e } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (e) setError("Erro ao enviar link.");
        else setInfo("Link enviado! Verifique seu e-mail.");
      } else if (tab === "login") {
        if (!pw) {
          setError("Informe sua senha.");
          setBusy(false);
          return;
        }
        const { error: e } = await signIn(email, pw);
        if (e) setError("E-mail ou senha incorretos.");
      } else {
        if (!name.trim()) {
          setError("Informe seu nome.");
          setBusy(false);
          return;
        }
        const failed = RULES.find((r) => !r.ok(pw));
        if (failed) {
          setError(`Senha inválida: ${failed.label}.`);
          setBusy(false);
          return;
        }
        const { error: e } = await signUp(email, pw, name.trim());
        if (e) {
          const msg = (e as { message?: string }).message ?? "";
          setError(
            msg.toLowerCase().includes("already")
              ? "E-mail já cadastrado."
              : "Erro ao criar conta.",
          );
        } else {
          setStep("otp");
        }
      }
    } catch {
      setError("Erro inesperado. Tente novamente.");
    }
    setBusy(false);
  }

  async function verifyOtp() {
    if (otp.length !== 6) {
      setOtpErr("Digite os 6 dígitos.");
      return;
    }
    setOtpBusy(true);
    setOtpErr("");

    // Tenta 'email' primeiro (Supabase v2+), fallback em 'signup'
    let result = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (result.error) {
      result = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup",
      });
    }

    if (result.error) {
      setOtpErr(
        "Código inválido ou expirado. Verifique seu e-mail e tente novamente.",
      );
    } else {
      setInfo("✓ Conta confirmada! Faça login.");
      switchTab("login");
    }
    setOtpBusy(false);
  }

  async function resendOtp() {
    setOtpErr("");
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) setOtpErr("Erro ao reenviar. Tente novamente.");
    else setInfo("Novo código enviado!");
  }

  const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
    width: "100%",
    height: 42,
    padding: "0 12px",
    border: `1px solid ${C.inputB}`,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "'Inter',sans-serif",
    color: C.text,
    background: C.inputBg,
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    ...extra,
  });
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = ACCENT;
    e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT}22`;
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = C.inputB;
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        fontFamily: "'Inter',sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { -webkit-font-smoothing: antialiased; background: ${C.bg}; }
        @keyframes fIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes footerBeam { 0%{background-position:-200% 50%} 100%{background-position:200% 50%} }
        ::placeholder { color: ${C.ph} !important; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px ${C.inputBg} inset !important; -webkit-text-fill-color: ${C.text} !important; }
        .otp-input { text-align:center; letter-spacing:10px; font-size:24px!important; font-weight:700!important; }
      `}</style>

      {/* Theme toggle */}
      <button
        onClick={toggle}
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          width: 36,
          height: 36,
          borderRadius: 8,
          border: `1px solid ${C.border}`,
          background: C.surface,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
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

      <div
        style={{ width: "100%", maxWidth: 400, animation: "fIn 0.35s ease" }}
      >
        {/* Brand */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: C.accentBg,
              border: `1px solid ${C.accentB}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 24px ${ACCENT}25`,
            }}
          >
            <ClaramenteLogo size={28} accent={ACCENT} />
          </div>
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: C.text,
                letterSpacing: -0.5,
                margin: 0,
              }}
            >
              Claramente
            </p>
            <p style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
              Sua mente em equilíbrio.
            </p>
          </div>
        </div>

        {/* ── OTP step ── */}
        {step === "otp" && (
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 28,
              boxShadow: isDark
                ? "0 4px 24px rgba(0,0,0,0.4)"
                : "0 4px 24px rgba(37,99,235,0.08)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: C.accentBg,
                  border: `1px solid ${C.accentB}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
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
                  <rect x="2" y="4" width="20" height="16" rx="3" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: C.text,
                  marginBottom: 6,
                }}
              >
                Verifique seu e-mail
              </p>
              <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6 }}>
                Enviamos um código de 6 dígitos para
                <br />
                <strong style={{ color: C.text }}>{email}</strong>
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.text,
                    marginBottom: 8,
                    textAlign: "center",
                  }}
                >
                  Código de verificação
                </label>
                <input
                  className="otp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") verifyOtp();
                  }}
                  placeholder="000000"
                  style={{
                    ...inp(),
                    textAlign: "center",
                    letterSpacing: "10px",
                    fontSize: 24,
                    fontWeight: 700,
                    height: 52,
                  }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  autoFocus
                />
              </div>

              {otpErr && (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: C.errBg,
                    border: `1px solid ${C.errB}`,
                    fontSize: 13,
                    color: C.errT,
                  }}
                >
                  {otpErr}
                </div>
              )}
              {info && (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: C.okBg,
                    border: `1px solid ${C.okB}`,
                    fontSize: 13,
                    color: C.okT,
                  }}
                >
                  {info}
                </div>
              )}

              <button
                onClick={verifyOtp}
                disabled={otpBusy || otp.length !== 6}
                style={{
                  width: "100%",
                  height: 42,
                  borderRadius: 8,
                  border: "none",
                  background: otpBusy || otp.length !== 6 ? C.accentBg : ACCENT,
                  color: otpBusy || otp.length !== 6 ? ACCENT : "#FFF",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "'Inter',sans-serif",
                  cursor:
                    otpBusy || otp.length !== 6 ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                }}
              >
                {otpBusy ? "Verificando..." : "Confirmar código"}
              </button>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={resendOtp}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    color: ACCENT,
                    fontFamily: "'Inter',sans-serif",
                    padding: 0,
                  }}
                >
                  Reenviar código
                </button>
                <button
                  onClick={() => {
                    setStep("form");
                    setOtp("");
                    setOtpErr("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    color: C.textMuted,
                    fontFamily: "'Inter',sans-serif",
                    padding: 0,
                  }}
                >
                  ← Voltar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Form step ── */}
        {step === "form" && (
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: isDark
                ? "0 4px 24px rgba(0,0,0,0.4)"
                : "0 4px 24px rgba(37,99,235,0.08)",
            }}
          >
            {/* Tabs */}
            {tab !== "forgot" && (
              <div
                style={{
                  display: "flex",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                {(["login", "signup"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => switchTab(t)}
                    style={{
                      flex: 1,
                      height: 44,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "'Inter',sans-serif",
                      fontSize: 13,
                      fontWeight: tab === t ? 600 : 400,
                      color: tab === t ? ACCENT : C.textMuted,
                      background: tab === t ? C.surface : C.tabBg,
                      borderBottom:
                        tab === t
                          ? `2px solid ${ACCENT}`
                          : "2px solid transparent",
                      transition: "all 0.15s",
                    }}
                  >
                    {t === "login" ? "Entrar" : "Criar conta"}
                  </button>
                ))}
              </div>
            )}

            <div
              style={{
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* Forgot header */}
              {tab === "forgot" && (
                <div>
                  <button
                    onClick={() => switchTab("login")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: C.textMuted,
                      fontSize: 13,
                      fontFamily: "'Inter',sans-serif",
                      marginBottom: 14,
                      padding: 0,
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Voltar
                  </button>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: C.text,
                      marginBottom: 4,
                    }}
                  >
                    Recuperar senha
                  </p>
                  <p
                    style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6 }}
                  >
                    Enviaremos um link de redefinição.
                  </p>
                </div>
              )}

              {/* Name */}
              {tab === "signup" && (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: C.text,
                      marginBottom: 6,
                    }}
                  >
                    Nome
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como quer ser chamado?"
                    style={inp()}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.text,
                    marginBottom: 6,
                  }}
                >
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submit();
                  }}
                  placeholder="seu@email.com"
                  style={inp({
                    borderColor:
                      email.length > 4
                        ? ev.ok
                          ? "#22C55E"
                          : C.inputB
                        : C.inputB,
                  })}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
                {email.length > 4 && !ev.ok && ev.msg && (
                  <p style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>
                    {ev.msg}
                  </p>
                )}
              </div>

              {/* Password */}
              {tab !== "forgot" && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <label
                      style={{ fontSize: 12, fontWeight: 600, color: C.text }}
                    >
                      Senha
                    </label>
                    {tab === "login" && (
                      <button
                        onClick={() => switchTab("forgot")}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 500,
                          color: ACCENT,
                          fontFamily: "'Inter',sans-serif",
                          padding: 0,
                        }}
                      >
                        Esqueceu?
                      </button>
                    )}
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPw ? "text" : "password"}
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                      onFocus={(e) => {
                        onFocus(e);
                        setPwFocus(true);
                      }}
                      onBlur={onBlur}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submit();
                      }}
                      placeholder={
                        tab === "signup" ? "Crie uma senha forte" : "••••••••"
                      }
                      style={inp({ paddingRight: 42 })}
                    />
                    <button
                      onClick={() => setShowPw((p) => !p)}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: C.textMuted,
                        display: "flex",
                        padding: 4,
                        borderRadius: 4,
                      }}
                    >
                      <EyeIcon open={showPw} />
                    </button>
                  </div>

                  {tab === "signup" && pwFocus && pw.length > 0 && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: 12,
                        background: isDark ? "#0F172A" : "#F8FAFC",
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              height: 3,
                              borderRadius: 2,
                              background:
                                i <= st.score
                                  ? st.color
                                  : isDark
                                    ? "#334155"
                                    : "#E2E8F0",
                              transition: "background 0.2s",
                            }}
                          />
                        ))}
                      </div>
                      {st.label && (
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: st.color,
                            marginBottom: 8,
                          }}
                        >
                          {st.label}
                        </p>
                      )}
                      {RULES.map((r) => {
                        const ok = r.ok(pw);
                        return (
                          <div
                            key={r.label}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginBottom: 5,
                            }}
                          >
                            <div
                              style={{
                                width: 15,
                                height: 15,
                                borderRadius: "50%",
                                flexShrink: 0,
                                background: ok
                                  ? "rgba(34,197,94,0.15)"
                                  : isDark
                                    ? "#1E293B"
                                    : "#F4F4F5",
                                border: `1px solid ${ok ? "#22C55E" : C.border}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {ok && (
                                <svg
                                  width="8"
                                  height="8"
                                  viewBox="0 0 12 12"
                                  fill="none"
                                >
                                  <polyline
                                    points="2,6 5,9 10,3"
                                    stroke="#22C55E"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </div>
                            <span
                              style={{
                                fontSize: 11,
                                color: ok ? "#22C55E" : C.textMuted,
                              }}
                            >
                              {r.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: C.errBg,
                    border: `1px solid ${C.errB}`,
                    fontSize: 13,
                    color: C.errT,
                  }}
                >
                  {error}
                </div>
              )}
              {info && (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: C.okBg,
                    border: `1px solid ${C.okB}`,
                    fontSize: 13,
                    color: C.okT,
                  }}
                >
                  {info}
                </div>
              )}

              <button
                onClick={submit}
                disabled={busy}
                style={{
                  width: "100%",
                  height: 42,
                  borderRadius: 8,
                  border: "none",
                  background: busy ? C.accentBg : ACCENT,
                  color: busy ? ACCENT : "#FFF",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "'Inter',sans-serif",
                  cursor: busy ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                  marginTop: 2,
                }}
                onMouseEnter={(e) => {
                  if (!busy) e.currentTarget.style.filter = "brightness(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "brightness(1)";
                }}
              >
                {busy
                  ? "Aguarde..."
                  : tab === "login"
                    ? "Entrar"
                    : tab === "signup"
                      ? "Criar conta"
                      : "Enviar link"}
              </button>

              {tab === "signup" && (
                <p
                  style={{
                    fontSize: 11,
                    color: C.textMuted,
                    textAlign: "center",
                    lineHeight: 1.6,
                  }}
                >
                  Ao criar conta você concorda com o uso dos seus dados conforme
                  a LGPD.
                </p>
              )}
            </div>
          </div>
        )}

        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: C.textMuted,
            marginTop: 20,
          }}
        >
          Não substitui acompanhamento psicológico profissional.
        </p>
      </div>

      {/* Footer beam */}
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
