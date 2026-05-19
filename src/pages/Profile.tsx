import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'

const PW_RULES = [
  { label: 'Mínimo 8 caracteres',          test: (p: string) => p.length >= 8 },
  { label: 'Uma letra maiúscula',           test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Um número',                     test: (p: string) => /[0-9]/.test(p) },
  { label: 'Um caractere especial (!@#$%)', test: (p: string) => /[!@#$%^&*(),.?]/.test(p) },
]

function pwStrength(p: string) {
  const n = PW_RULES.filter(r => r.test(p)).length
  if (n <= 1) return { score: 1, label: 'Muito fraca', color: '#EF4444' }
  if (n === 2) return { score: 2, label: 'Fraca',      color: '#F59E0B' }
  if (n === 3) return { score: 3, label: 'Boa',        color: '#8B5CF6' }
  return              { score: 4, label: 'Forte',       color: '#22C55E' }
}

export default function Profile() {
  const navigate  = useNavigate()
  const { profile, user, signOut } = useAuth()
  const { isDark, toggle } = useTheme()

  const C = isDark ? {
    bg: '#111111', surface: '#1A1A1A', border: '#272727',
    text: '#F5F5F5', textSub: '#A0A0A0', textMuted: '#606060',
    accent: '#8B5CF6', accentBg: '#1E1535', inputBg: '#1A1A1A',
    inputBorder: '#2E2E2E',
  } : {
    bg: '#F7F7F8', surface: '#FFFFFF', border: '#E8E8E8',
    text: '#0F0F0F', textSub: '#6B6B6B', textMuted: '#9B9B9B',
    accent: '#7C3AED', accentBg: '#F4F0FF', inputBg: '#FFFFFF',
    inputBorder: '#E2E2E2',
  }

  const firstName = profile?.name?.split(' ')[0] || 'você'

  const [name, setName]       = useState(profile?.name || '')
  const [savingName, setSavingName] = useState(false)
  const [nameSaved, setNameSaved]   = useState(false)
  const [nameError, setNameError]   = useState('')

  const [newPw, setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [savingPw, setSavingPw]   = useState(false)
  const [pwSaved, setPwSaved]     = useState(false)
  const [pwError, setPwError]     = useState('')
  const [showPwRules, setShowPwRules] = useState(false)

  const [showDelete, setShowDelete]   = useState(false)
  const [deleteText, setDeleteText]   = useState('')
  const [deleting, setDeleting]       = useState(false)

  const strength = newPw.length > 0 ? pwStrength(newPw) : null

  async function saveName() {
    if (!name.trim()) { setNameError('O nome não pode ser vazio.'); return }
    setSavingName(true); setNameError('')
    const { error } = await supabase.from('profiles').update({ name: name.trim() }).eq('id', user!.id)
    if (error) setNameError('Erro ao salvar. Tente novamente.')
    else { setNameSaved(true); setTimeout(() => setNameSaved(false), 3000) }
    setSavingName(false)
  }

  async function savePw() {
    setPwError('')
    const failed = PW_RULES.filter(r => !r.test(newPw))
    if (failed.length > 0) { setPwError(`Senha inválida: ${failed[0].label}.`); return }
    if (newPw !== confirmPw) { setPwError('As senhas não coincidem.'); return }
    setSavingPw(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) setPwError('Erro ao alterar senha. Tente novamente.')
    else { setPwSaved(true); setNewPw(''); setConfirmPw(''); setShowPwRules(false); setTimeout(() => setPwSaved(false), 4000) }
    setSavingPw(false)
  }

  async function deleteAccount() {
    if (deleteText !== 'EXCLUIR') return
    setDeleting(true)
    try {
      await supabase.from('messages').delete().eq('user_id', user!.id)
      await supabase.from('conversations').delete().eq('user_id', user!.id)
      await supabase.from('reports').delete().eq('user_id', user!.id)
      await supabase.from('user_memories').delete().eq('user_id', user!.id)
      await supabase.from('profiles').delete().eq('id', user!.id)
      await signOut()
    } catch { setDeleting(false) }
  }

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { -webkit-font-smoothing: antialiased; }
    @keyframes fIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-thumb { background: ${isDark ? '#333' : '#D4D4D4'}; border-radius: 4px; }
  `

  const inp: React.CSSProperties = {
    width: '100%', height: 42, padding: '0 12px', borderRadius: 8,
    border: `1px solid ${C.inputBorder}`, background: C.inputBg, outline: 'none',
    fontSize: 14, fontWeight: 400, fontFamily: "'Inter',sans-serif",
    color: C.text, transition: 'border-color 0.15s, box-shadow 0.15s',
  }

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px', marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 16, fontFamily: "'Inter',sans-serif" }}>{title}</p>
        {children}
      </div>
    )
  }

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
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: -0.3 }}>Perfil</span>
        </div>
        <button onClick={toggle} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isDark
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.textSub} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.textSub} strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          }
        </button>
      </header>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '28px 20px 64px', animation: 'fIn 0.35s ease' }}>

        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: C.accentBg, border: `1px solid ${C.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: C.accent, flexShrink: 0 }}>
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: 0, letterSpacing: -0.3 }}>{profile?.name || firstName}</p>
            <p style={{ fontSize: 13, fontWeight: 400, color: C.textMuted, margin: 0 }}>{user?.email}</p>
          </div>
        </div>

        {/* Informações pessoais */}
        <Section title="Informações pessoais">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>Nome</label>
              <input value={name} onChange={e => setName(e.target.value)} style={inp}
                onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accent}14` }}
                onBlur={e => { e.target.style.borderColor = C.inputBorder; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>E-mail</label>
              <input value={user?.email || ''} disabled style={{ ...inp, background: isDark ? '#141414' : '#F7F7F8', color: C.textMuted, cursor: 'not-allowed' }} />
              <p style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>O e-mail não pode ser alterado.</p>
            </div>
            {nameError && <p style={{ fontSize: 12, color: '#EF4444' }}>{nameError}</p>}
            {nameSaved && <p style={{ fontSize: 12, color: '#22C55E' }}>✓ Nome salvo com sucesso!</p>}
            <button onClick={saveName} disabled={savingName} style={{ alignSelf: 'flex-start', height: 36, padding: '0 18px', borderRadius: 8, border: 'none', background: savingName ? C.accentBg : C.accent, color: savingName ? C.accent : '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: savingName ? 'not-allowed' : 'pointer', fontFamily: "'Inter',sans-serif", transition: 'all 0.15s' }}>
              {savingName ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </Section>

        {/* Alterar senha */}
        <Section title="Alterar senha">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>Nova senha</label>
              <input type="password" value={newPw}
                onChange={e => { setNewPw(e.target.value); setShowPwRules(true) }}
                onFocus={() => setShowPwRules(true)}
                placeholder="Crie uma senha forte" style={inp}
                onFocusCapture={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accent}14` }}
                onBlurCapture={e => { e.target.style.borderColor = C.inputBorder; e.target.style.boxShadow = 'none' }}
              />
              {showPwRules && newPw.length > 0 && strength && (
                <div style={{ marginTop: 8, padding: '10px', background: isDark ? '#141414' : '#FAFAFA', borderRadius: 8, border: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
                    {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength.score ? strength.color : C.border }} />)}
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 500, color: strength.color, marginBottom: 8 }}>{strength.label}</p>
                  {PW_RULES.map(r => {
                    const ok = r.test(newPw)
                    return (
                      <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: ok ? 'rgba(34,197,94,0.12)' : (isDark ? '#222' : '#F4F4F5'), border: `1px solid ${ok ? '#22C55E' : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {ok && <svg width="7" height="7" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <span style={{ fontSize: 11, color: ok ? '#22C55E' : C.textMuted }}>{r.label}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>Confirmar nova senha</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                placeholder="Repita a nova senha"
                style={{ ...inp, borderColor: confirmPw.length > 3 ? (confirmPw === newPw ? '#22C55E' : '#EF4444') : C.inputBorder }}
                onFocusCapture={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accent}14` }}
                onBlurCapture={e => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = confirmPw.length > 3 ? (confirmPw === newPw ? '#22C55E' : '#EF4444') : C.inputBorder }}
              />
              {confirmPw.length > 3 && (
                <p style={{ fontSize: 11, marginTop: 4, color: confirmPw === newPw ? '#22C55E' : '#EF4444' }}>
                  {confirmPw === newPw ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
                </p>
              )}
            </div>
            {pwError  && <p style={{ fontSize: 12, color: '#EF4444' }}>{pwError}</p>}
            {pwSaved  && <p style={{ fontSize: 12, color: '#22C55E' }}>✓ Senha alterada com sucesso!</p>}
            <button onClick={savePw} disabled={savingPw} style={{ alignSelf: 'flex-start', height: 36, padding: '0 18px', borderRadius: 8, border: 'none', background: savingPw ? C.accentBg : C.accent, color: savingPw ? C.accent : '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: savingPw ? 'not-allowed' : 'pointer', fontFamily: "'Inter',sans-serif", transition: 'all 0.15s' }}>
              {savingPw ? 'Salvando...' : 'Alterar senha'}
            </button>
          </div>
        </Section>

        {/* LGPD */}
        <Section title="Dados e privacidade (LGPD)">
          <p style={{ fontSize: 13, fontWeight: 400, color: C.textSub, lineHeight: 1.7, marginBottom: 14 }}>
            Conforme a LGPD, você tem direito ao esquecimento. Seus dados podem ser removidos permanentemente a qualquer momento.
          </p>
          <button onClick={() => navigate('/relatorios')} style={{ height: 34, padding: '0 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSub, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter',sans-serif", transition: 'all 0.12s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = C.accent)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
            Ver meus relatórios
          </button>
        </Section>

        {/* Zona de perigo */}
        <div style={{ background: isDark ? 'rgba(239,68,68,0.05)' : '#FFF5F5', border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#FED7D7'}`, borderRadius: 12, padding: '20px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#EF4444', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 14, fontFamily: "'Inter',sans-serif" }}>Zona de perigo</p>
          {!showDelete ? (
            <>
              <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.7, marginBottom: 14 }}>
                Excluir sua conta remove permanentemente todas as conversas, relatórios e dados. <strong style={{ color: C.text }}>Esta ação não pode ser desfeita.</strong>
              </p>
              <button onClick={() => setShowDelete(true)} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.35)', background: 'transparent', color: '#EF4444', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter',sans-serif", transition: 'all 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                Excluir minha conta
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: '#EF4444', fontWeight: 500, lineHeight: 1.6 }}>
                Digite <strong>EXCLUIR</strong> para confirmar:
              </p>
              <input value={deleteText} onChange={e => setDeleteText(e.target.value)} placeholder="EXCLUIR"
                style={{ ...inp, borderColor: 'rgba(239,68,68,0.35)' }}
                onFocusCapture={e => { e.target.style.borderColor = '#EF4444'; e.target.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.1)' }}
                onBlurCapture={e => { e.target.style.borderColor = 'rgba(239,68,68,0.35)'; e.target.style.boxShadow = 'none' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowDelete(false); setDeleteText('') }} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSub, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                  Cancelar
                </button>
                <button onClick={deleteAccount} disabled={deleteText !== 'EXCLUIR' || deleting} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: 'none', background: deleteText === 'EXCLUIR' ? '#EF4444' : 'rgba(239,68,68,0.15)', color: deleteText === 'EXCLUIR' ? '#FFFFFF' : '#EF4444', fontSize: 13, fontWeight: 600, cursor: deleteText === 'EXCLUIR' ? 'pointer' : 'not-allowed', fontFamily: "'Inter',sans-serif", transition: 'all 0.15s' }}>
                  {deleting ? 'Excluindo...' : 'Confirmar exclusão'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: C.textMuted, marginTop: 24 }}>Claramente · Fatec Ourinhos · TG 2026</p>
      </div>
    </div>
  )
}