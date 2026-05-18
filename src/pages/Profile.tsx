import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'

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

const PASSWORD_RULES = [
  { label: 'Mínimo 8 caracteres',        test: (p: string) => p.length >= 8 },
  { label: 'Uma letra maiúscula (A-Z)',   test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Um número (0-9)',             test: (p: string) => /[0-9]/.test(p) },
  { label: 'Um caractere especial (!@#$%&*)', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
]

function passwordStrength(p: string) {
  const passed = PASSWORD_RULES.filter(r => r.test(p)).length
  if (passed <= 1) return { score: 1, label: 'Muito fraca', color: '#EF4444' }
  if (passed === 2) return { score: 2, label: 'Fraca',      color: '#F59E0B' }
  if (passed === 3) return { score: 3, label: 'Boa',        color: '#8B5CF6' }
  return             { score: 4, label: 'Forte ✓',          color: '#22C55E' }
}

export default function Profile() {
  const navigate = useNavigate()
  const { profile, user, signOut } = useAuth()
  const { t, isDark } = useTheme()

  // Nome
  const [name, setName]       = useState(profile?.name || '')
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [nameError, setNameError] = useState('')

  // Senha
  const [newPass, setNewPass]     = useState('')
  const [confirm, setConfirm]     = useState('')
  const [passSaving, setPassSaving] = useState(false)
  const [passError, setPassError]   = useState('')
  const [passSaved, setPassSaved]   = useState(false)
  const [showRules, setShowRules]   = useState(false)

  // Excluir conta
  const [showDelete, setShowDelete]     = useState(false)
  const [deleteText, setDeleteText]     = useState('')
  const [deleting, setDeleting]         = useState(false)
  const [deleteError, setDeleteError]   = useState('')

  const firstName = profile?.name?.split(' ')[0] || 'você'
  const str = newPass.length > 0 ? passwordStrength(newPass) : null

  // ─── Salvar nome ────────────────────────────────────
  async function handleSaveName() {
    if (!name.trim()) { setNameError('O nome não pode ser vazio.'); return }
    if (!user) return
    setSaving(true); setNameError(''); setSaved(false)
    const { error } = await supabase.from('profiles').update({ name: name.trim() }).eq('id', user.id)
    if (error) {
      setNameError('Erro ao salvar. Tente novamente.')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  // ─── Alterar senha ──────────────────────────────────
  async function handleChangePassword() {
    setPassError(''); setPassSaved(false)
    const failed = PASSWORD_RULES.filter(r => !r.test(newPass))
    if (failed.length > 0) { setPassError(`Senha inválida: ${failed[0].label}.`); return }
    if (newPass !== confirm)  { setPassError('As senhas não coincidem.'); return }
    setPassSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) {
      setPassError('Erro ao alterar senha. Tente novamente.')
    } else {
      setPassSaved(true)
      setNewPass(''); setConfirm(''); setShowRules(false)
      setTimeout(() => setPassSaved(false), 4000)
    }
    setPassSaving(false)
  }

  // ─── Excluir conta ──────────────────────────────────
  async function handleDeleteAccount() {
    if (deleteText !== 'EXCLUIR') return
    setDeleting(true); setDeleteError('')
    try {
      await supabase.from('messages').delete().eq('user_id', user!.id)
      await supabase.from('conversations').delete().eq('user_id', user!.id)
      await supabase.from('reports').delete().eq('user_id', user!.id)
      await supabase.from('user_memories').delete().eq('user_id', user!.id)
      await supabase.from('profiles').delete().eq('id', user!.id)
      await signOut()
    } catch {
      setDeleteError('Erro ao excluir conta. Tente novamente.')
      setDeleting(false)
    }
  }

  // ─── Helpers de estilo ──────────────────────────────
  const inp: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: 12, fontSize: 15,
    background: t.input, border: `1.5px solid ${t.inputBorder}`,
    color: t.text, outline: 'none', fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.2s',
  }

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div style={{
        background: t.card, borderRadius: 20, padding: '24px',
        border: `0.5px solid ${t.cardBorder}`,
        boxShadow: `0 2px 12px rgba(0,0,0,${isDark ? '0.2' : '0.04'})`,
        marginBottom: 16,
      }}>
        <p style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 20 }}>
          {title}
        </p>
        {children}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: t.bg, fontFamily: "'DM Sans', sans-serif", transition: 'background 0.3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @media (max-width: 600px) {
          .profile-content { padding: 24px 16px !important; }
        }
      `}</style>

      {/* Header */}
      <header style={{
        background: t.header, borderBottom: `0.5px solid ${t.headerBorder}`,
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/app')} style={{
            width: 36, height: 36, borderRadius: 10, background: t.violetBg,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <CrystalLogo size={26} />
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: t.text }}>Perfil</span>
        </div>
        <span style={{ fontSize: 13, color: t.textMuted }}>{firstName}</span>
      </header>

      <div className="profile-content" style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px', animation: 'fadeUp 0.4s ease' }}>

        {/* Avatar */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B5CF6, #5B21B6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', boxShadow: '0 8px 24px rgba(139,92,246,0.35)',
            fontSize: 30, fontWeight: 600, color: 'white',
          }}>
            {firstName.charAt(0).toUpperCase()}
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: t.text, marginBottom: 4, fontWeight: 400 }}>
            {profile?.name || 'Meu perfil'}
          </h1>
          <p style={{ fontSize: 13, color: t.textMuted }}>{user?.email}</p>
        </div>

        {/* ── Informações pessoais ── */}
        <Section title="Informações pessoais">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: t.textSub, display: 'block', marginBottom: 8, fontWeight: 500 }}>Nome</label>
              <input type="text" value={name} onChange={e => { setName(e.target.value); setSaved(false) }}
                style={inp}
                onFocus={e => e.target.style.borderColor = '#8B5CF6'}
                onBlur={e => e.target.style.borderColor = t.inputBorder}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: t.textSub, display: 'block', marginBottom: 8, fontWeight: 500 }}>E-mail</label>
              <input type="email" value={user?.email || ''} disabled style={{
                ...inp, background: isDark ? '#0D0B1A' : '#F0EBFF',
                color: t.textMuted, cursor: 'not-allowed',
              }} />
              <p style={{ fontSize: 11, color: t.textMuted, marginTop: 6 }}>O e-mail não pode ser alterado.</p>
            </div>

            {nameError && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FCA5A5' }}>{nameError}</div>}
            {saved    && <div style={{ background: 'rgba(34,197,94,0.08)',  border: '1px solid rgba(34,197,94,0.2)',  borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#86EFAC' }}>✓ Nome salvo com sucesso!</div>}

            <button onClick={handleSaveName} disabled={saving} style={{
              padding: '13px 24px', borderRadius: 12, border: 'none', alignSelf: 'flex-start',
              background: saving ? t.violetBg : '#8B5CF6',
              color: saving ? t.violet : 'white', fontSize: 14, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
              boxShadow: saving ? 'none' : '0 4px 12px rgba(139,92,246,0.35)',
            }}>
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </Section>

        {/* ── Alterar senha ── */}
        <Section title="Alterar senha">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <label style={{ fontSize: 12, color: t.textSub, display: 'block', marginBottom: 8, fontWeight: 500 }}>Nova senha</label>
              <input type="password" value={newPass}
                onChange={e => { setNewPass(e.target.value); setShowRules(true) }}
                onFocus={() => setShowRules(true)}
                placeholder="Crie uma senha forte" style={inp}
                onFocusCapture={e => e.target.style.borderColor = '#8B5CF6'}
                onBlurCapture={e => e.target.style.borderColor = t.inputBorder}
              />

              {/* Checklist de força */}
              {showRules && newPass.length > 0 && (
                <div style={{ marginTop: 10, background: isDark ? 'rgba(139,92,246,0.08)' : '#F8F6FF', borderRadius: 12, padding: '12px 14px', border: `0.5px solid ${t.cardBorder}` }}>
                  {str && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, transition: 'background 0.3s', background: i <= str.score ? str.color : t.cardBorder }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, color: str.color }}>{str.label}</span>
                    </div>
                  )}
                  {PASSWORD_RULES.map(rule => {
                    const ok = rule.test(newPass)
                    return (
                      <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                          background: ok ? 'rgba(34,197,94,0.15)' : t.violetBg,
                          border: `1px solid ${ok ? '#22C55E' : t.cardBorder}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}>
                          {ok && (
                            <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                              <polyline points="2,6 5,9 10,3" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: ok ? '#22C55E' : t.textMuted, transition: 'color 0.2s' }}>
                          {rule.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: 12, color: t.textSub, display: 'block', marginBottom: 8, fontWeight: 500 }}>Confirmar nova senha</label>
              <input type="password" value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repita a nova senha"
                onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                style={{
                  ...inp,
                  borderColor: confirm.length > 3
                    ? (confirm === newPass ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.4)')
                    : t.inputBorder,
                }}
                onFocus={e => e.target.style.borderColor = '#8B5CF6'}
                onBlur={e => e.target.style.borderColor = confirm.length > 3
                  ? (confirm === newPass ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.4)')
                  : t.inputBorder}
              />
              {confirm.length > 3 && (
                <p style={{ fontSize: 11, marginTop: 5, color: confirm === newPass ? '#22C55E' : '#EF4444' }}>
                  {confirm === newPass ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
                </p>
              )}
            </div>

            {passError && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FCA5A5' }}>{passError}</div>}
            {passSaved && <div style={{ background: 'rgba(34,197,94,0.08)',  border: '1px solid rgba(34,197,94,0.2)',  borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#86EFAC' }}>✓ Senha alterada com sucesso!</div>}

            <button onClick={handleChangePassword} disabled={passSaving} style={{
              padding: '13px 24px', borderRadius: 12, border: 'none', alignSelf: 'flex-start',
              background: passSaving ? t.violetBg : '#8B5CF6',
              color: passSaving ? t.violet : 'white', fontSize: 14, fontWeight: 600,
              cursor: passSaving ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
              boxShadow: passSaving ? 'none' : '0 4px 12px rgba(139,92,246,0.35)',
            }}>
              {passSaving ? 'Salvando...' : 'Alterar senha'}
            </button>
          </div>
        </Section>

        {/* ── Dados e privacidade ── */}
        <Section title="Dados e privacidade (LGPD)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 14, color: t.textSub, lineHeight: 1.7 }}>
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito ao esquecimento — seus dados podem ser removidos permanentemente a qualquer momento.
            </p>
            <div style={{ background: isDark ? 'rgba(139,92,246,0.08)' : '#F8F6FF', borderRadius: 12, padding: '14px 16px', border: `0.5px solid ${t.cardBorder}` }}>
              <p style={{ fontSize: 13, color: t.textSub, lineHeight: 1.6, margin: 0 }}>
                📋 <strong style={{ color: t.text }}>Dados armazenados:</strong> nome, e-mail, conversas, mensagens, relatórios e memórias da IA. Nunca compartilhamos seus dados com terceiros.
              </p>
            </div>
            <button onClick={() => navigate('/relatorios')} style={{
              padding: '11px 20px', borderRadius: 12, border: `1px solid ${t.cardBorder}`,
              background: 'none', color: t.violet, fontSize: 14, fontWeight: 500,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", alignSelf: 'flex-start',
            }}>
              📊 Ver meus relatórios
            </button>
          </div>
        </Section>

        {/* ── Zona de perigo ── */}
        <div style={{
          background: isDark ? 'rgba(239,68,68,0.05)' : '#FFF8F8',
          borderRadius: 20, padding: '24px',
          border: '0.5px solid rgba(239,68,68,0.2)',
          marginBottom: 32,
        }}>
          <p style={{ fontSize: 11, color: '#EF4444', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
            Zona de perigo
          </p>

          {!showDelete ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 14, color: t.textSub, lineHeight: 1.7 }}>
                A exclusão da conta remove permanentemente todos os seus dados: conversas, mensagens, relatórios e memórias. Esta ação <strong style={{ color: t.text }}>não pode ser desfeita.</strong>
              </p>
              <button onClick={() => setShowDelete(true)} style={{
                padding: '11px 20px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)',
                background: 'none', color: '#EF4444', fontSize: 14, fontWeight: 500,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", alignSelf: 'flex-start',
              }}>
                Excluir minha conta
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 14, color: '#EF4444', lineHeight: 1.7, fontWeight: 500 }}>
                Para confirmar, digite <strong>EXCLUIR</strong> no campo abaixo:
              </p>
              <input type="text" value={deleteText} onChange={e => setDeleteText(e.target.value)}
                placeholder="Digite EXCLUIR para confirmar"
                style={{ ...inp, border: '1.5px solid rgba(239,68,68,0.3)' }}
              />
              {deleteError && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FCA5A5' }}>{deleteError}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setShowDelete(false); setDeleteText('') }} style={{
                  padding: '11px 20px', borderRadius: 12, border: `1px solid ${t.cardBorder}`,
                  background: 'none', color: t.textSub, fontSize: 14,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}>
                  Cancelar
                </button>
                <button onClick={handleDeleteAccount} disabled={deleteText !== 'EXCLUIR' || deleting} style={{
                  padding: '11px 20px', borderRadius: 12, border: 'none',
                  background: deleteText === 'EXCLUIR' ? '#EF4444' : 'rgba(239,68,68,0.2)',
                  color: deleteText === 'EXCLUIR' ? 'white' : '#EF4444',
                  fontSize: 14, fontWeight: 600,
                  cursor: deleteText === 'EXCLUIR' ? 'pointer' : 'not-allowed',
                  fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                }}>
                  {deleting ? 'Excluindo...' : 'Excluir permanentemente'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: t.textMuted, paddingBottom: 8 }}>
          Claramente · Fatec Ourinhos · TG 2026
        </p>
      </div>
    </div>
  )
}