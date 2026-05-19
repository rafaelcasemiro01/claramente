import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { validateEmail } from "@/lib/emailValidator";

type Mode = "login" | "signup" | "forgot";

const PW_RULES = [
  { label: "Mínimo 8 caracteres", test: (p: string) => p.length >= 8 },
  { label: "Uma letra maiúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Um número", test: (p: string) => /[0-9]/.test(p) },
  {
    label: "Um caractere especial (!@#$%)",
    test: (p: string) => /[!@#$%^&*(),.?]/.test(p),
  },
];

function pwStrength(p: string) {
  const n = PW_RULES.filter((r) => r.test(p)).length;
  if (n <= 1) return { score: 1, label: "Muito fraca", color: "#EF4444" };
  if (n === 2) return { score: 2, label: "Fraca", color: "#F59E0B" };
  if (n === 3) return { score: 3, label: "Boa", color: "#8B5CF6" };
  return { score: 4, label: "Forte", color: "#22C55E" };
}

export default function Landing() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailVal, setEmailVal] = useState<{ message: string; type: string }>({
    message: "",
    type: "idle",
  });
  const [showPwRules, setShowPwRules] = useState(false);

  const strength = pw.length > 0 ? pwStrength(pw) : null;

  function switchMode(m: Mode) {
    setMode(m);
    setError("");
    setSuccess("");
    setPw("");
    setEmailVal({ message: "", type: "idle" });
    setShowPwRules(false);
  }

  function onEmailChange(v: string) {
    setEmail(v);
    if (v.length > 4) setEmailVal(validateEmail(v));
    else setEmailVal({ message: "", type: "idle" });
  }

  async function handleSubmit() {
    setError("");
    setSuccess("");
    setLoading(true);
    const ec = validateEmail(email);
    if (!ec.valid) {
      setEmailVal(ec);
      setError("Informe um e-mail válido.");
      setLoading(false);
      return;
    }

    if (mode === "login") {
      const { error } = await signIn(email, pw);
      if (error) setError("E-mail ou senha incorretos.");
    } else if (mode === "signup") {
      if (!name.trim()) {
        setError("Informe seu nome.");
        setLoading(false);
        return;
      }
      const failed = PW_RULES.filter((r) => !r.test(pw));
      if (failed.length > 0) {
        setError(`Senha inválida: ${failed[0].label}.`);
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, pw, name);
      if (error) {
        const msg = (error as { message?: string })?.message || "";
        setError(
          msg.includes("already")
            ? "E-mail já cadastrado. Tente fazer login."
            : "Erro ao criar conta.",
        );
      } else {
        setSuccess("Conta criada! Faça login para entrar.");
        setMode("login");
        setName("");
        setPw("");
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setError("Erro ao enviar e-mail. Verifique o endereço.");
      else setSuccess("Link enviado! Verifique sua caixa de entrada.");
    }
    setLoading(false);
  }

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-text-size-adjust: 100%; }
    body { -webkit-font-smoothing: antialiased; }
    input:-webkit-autofill {
      -webkit-box-shadow: 0 0 0 100px #FFFFFF inset !important;
      -webkit-text-fill-color: #0F0F0F !important;
    }
    ::placeholder { color: #ACACAC !important; font-family: 'Inter',sans-serif; }
    @keyframes fIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pwIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
  `;

  const inp: React.CSSProperties = {
    width: "100%",
    height: 42,
    padding: "0 12px",
    borderRadius: 8,
    border: "1px solid #E2E2E2",
    background: "#FFFFFF",
    outline: "none",
    fontSize: 14,
    fontWeight: 400,
    fontFamily: "'Inter',sans-serif",
    color: "#0F0F0F",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#F7F7F8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        fontFamily: "'Inter',sans-serif",
      }}
    >
      <style>{CSS}</style>

      <div
        style={{ width: "100%", maxWidth: 400, animation: "fIn 0.35s ease" }}
      >
        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#F4F0FF",
              border: "1px solid #E2D9FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 56 56" fill="none">
              <path
                d="M28 4L50 18V38L28 52L6 38V18Z"
                fill="rgba(124,58,237,0.15)"
                stroke="#7C3AED"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path d="M28 4L6 18H50Z" fill="rgba(124,58,237,0.3)" />
              <line
                x1="6"
                y1="18"
                x2="28"
                y2="30"
                stroke="rgba(124,58,237,0.6)"
                strokeWidth="1.2"
              />
              <line
                x1="50"
                y1="18"
                x2="28"
                y2="30"
                stroke="rgba(124,58,237,0.6)"
                strokeWidth="1.2"
              />
              <circle cx="28" cy="30" r="3" fill="#7C3AED" />
            </svg>
          </div>
          <span
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "#0F0F0F",
              letterSpacing: -0.4,
            }}
          >
            Claramente
          </span>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8E8E8",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          {/* Tabs */}
          {mode !== "forgot" && (
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid #E8E8E8",
                background: "#FAFAFA",
              }}
            >
              {(["login", "signup"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  style={{
                    flex: 1,
                    height: 44,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 13,
                    fontWeight: mode === m ? 600 : 400,
                    color: mode === m ? "#7C3AED" : "#6B6B6B",
                    background: mode === m ? "#FFFFFF" : "transparent",
                    borderBottom:
                      mode === m
                        ? "2px solid #7C3AED"
                        : "2px solid transparent",
                    transition: "all 0.15s",
                  }}
                >
                  {m === "login" ? "Entrar" : "Criar conta"}
                </button>
              ))}
            </div>
          )}

          <div style={{ padding: "24px" }}>
            {/* Forgot header */}
            {mode === "forgot" && (
              <div style={{ marginBottom: 20 }}>
                <button
                  onClick={() => switchMode("login")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#6B6B6B",
                    fontSize: 13,
                    fontFamily: "'Inter',sans-serif",
                    marginBottom: 16,
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
                  Voltar ao login
                </button>
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#0F0F0F",
                    marginBottom: 4,
                  }}
                >
                  Recuperar senha
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 400,
                    color: "#6B6B6B",
                    lineHeight: 1.6,
                  }}
                >
                  Enviaremos um link para criar uma nova senha.
                </p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Name */}
              {mode === "signup" && (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#0F0F0F",
                      marginBottom: 6,
                    }}
                  >
                    Nome
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como você quer ser chamado?"
                    style={inp}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#7C3AED";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(124,58,237,0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#E2E2E2";
                      e.target.style.boxShadow = "none";
                    }}
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
                    color: "#0F0F0F",
                    marginBottom: 6,
                  }}
                >
                  E-mail
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    onBlur={() =>
                      email.length > 0 && setEmailVal(validateEmail(email))
                    }
                    placeholder="seu@email.com"
                    style={{
                      ...inp,
                      paddingRight: emailVal.type !== "idle" ? 36 : 12,
                      borderColor:
                        emailVal.type === "valid"
                          ? "#22C55E"
                          : emailVal.type === "error"
                            ? "#EF4444"
                            : "#E2E2E2",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#7C3AED";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(124,58,237,0.1)";
                    }}
                    onBlurCapture={(e) => {
                      e.target.style.borderColor =
                        emailVal.type === "valid"
                          ? "#22C55E"
                          : emailVal.type === "error"
                            ? "#EF4444"
                            : "#E2E2E2";
                      e.target.style.boxShadow = "none";
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  />
                  {emailVal.type !== "idle" && (
                    <span
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: 13,
                        color:
                          emailVal.type === "valid" ? "#22C55E" : "#EF4444",
                      }}
                    >
                      {emailVal.type === "valid" ? "✓" : "✗"}
                    </span>
                  )}
                </div>
                {emailVal.message && (
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 400,
                      color: emailVal.type === "valid" ? "#22C55E" : "#EF4444",
                      marginTop: 4,
                    }}
                  >
                    {emailVal.message}
                  </p>
                )}
              </div>

              {/* Password */}
              {mode !== "forgot" && (
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
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#0F0F0F",
                      }}
                    >
                      Senha
                    </label>
                    {mode === "login" && (
                      <button
                        onClick={() => switchMode("forgot")}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#7C3AED",
                          fontFamily: "'Inter',sans-serif",
                        }}
                      >
                        Esqueceu?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={pw}
                    onChange={(e) => {
                      setPw(e.target.value);
                      if (mode === "signup") setShowPwRules(true);
                    }}
                    onFocus={() => {
                      if (mode === "signup") setShowPwRules(true);
                    }}
                    placeholder={
                      mode === "signup" ? "Crie uma senha forte" : "••••••••"
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    style={inp}
                    onFocusCapture={(e) => {
                      e.target.style.borderColor = "#7C3AED";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(124,58,237,0.1)";
                    }}
                    onBlurCapture={(e) => {
                      e.target.style.borderColor = "#E2E2E2";
                      e.target.style.boxShadow = "none";
                    }}
                  />

                  {/* Password rules */}
                  {mode === "signup" && showPwRules && pw.length > 0 && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: "12px",
                        background: "#FAFAFA",
                        borderRadius: 8,
                        border: "1px solid #E8E8E8",
                        animation: "pwIn 0.2s ease",
                      }}
                    >
                      {strength && (
                        <div style={{ marginBottom: 10 }}>
                          <div
                            style={{ display: "flex", gap: 3, marginBottom: 4 }}
                          >
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                style={{
                                  flex: 1,
                                  height: 3,
                                  borderRadius: 2,
                                  background:
                                    i <= strength.score
                                      ? strength.color
                                      : "#E8E8E8",
                                  transition: "background 0.2s",
                                }}
                              />
                            ))}
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 500,
                              color: strength.color,
                            }}
                          >
                            {strength.label}
                          </span>
                        </div>
                      )}
                      {PW_RULES.map((r) => {
                        const ok = r.test(pw);
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
                                width: 16,
                                height: 16,
                                borderRadius: "50%",
                                background: ok
                                  ? "rgba(34,197,94,0.12)"
                                  : "#F4F4F5",
                                border: `1px solid ${ok ? "#22C55E" : "#E2E2E2"}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                transition: "all 0.2s",
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
                                fontWeight: 400,
                                color: ok ? "#22C55E" : "#9B9B9B",
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

              {/* Feedback */}
              {error && (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "#FFF5F5",
                    border: "1px solid #FED7D7",
                    fontSize: 13,
                    fontWeight: 400,
                    color: "#C53030",
                  }}
                >
                  {error}
                </div>
              )}
              {success && (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "#F0FFF4",
                    border: "1px solid #C6F6D5",
                    fontSize: 13,
                    fontWeight: 400,
                    color: "#276749",
                  }}
                >
                  {success}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  width: "100%",
                  height: 42,
                  borderRadius: 8,
                  border: "none",
                  marginTop: 2,
                  background: loading ? "#C4B5FD" : "#7C3AED",
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "'Inter',sans-serif",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = "#6D28D9";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = "#7C3AED";
                }}
              >
                {loading
                  ? "Aguarde..."
                  : mode === "login"
                    ? "Entrar"
                    : mode === "signup"
                      ? "Criar conta"
                      : "Enviar link"}
              </button>

              {mode === "signup" && (
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 400,
                    color: "#9B9B9B",
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
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            fontWeight: 400,
            color: "#9B9B9B",
            marginTop: 20,
          }}
        >
          Não substitui acompanhamento psicológico profissional.
        </p>
      </div>
    </div>
  );
}
