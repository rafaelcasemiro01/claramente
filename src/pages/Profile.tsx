import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'
import { ClaramenteLogo } from '@/components/Logo'

const RULES = [
  { label: 'Mínimo 8 caracteres',          ok: (p: string) => p.length >= 8 },
  { label: 'Uma letra maiúscula',           ok: (p: string) => /[A-Z]/.test(p) },
  { label: 'Um número',                     ok: (p: string) => /[0-9]/.test(p) },
  { label: 'Um caractere especial (!@#$%)', ok: (p: string) => /[!@#$%^&*]/.test(p) },
]

function strength(p: string) {
  const n = RULES.filter(r => r.ok(p)).length
  return [
    { score: 0, label: '',            color: '#E2E8F0' },
    { score: 1, label: 'Muito fraca', color: '#EF4444' },
    { score: 2, label: 'Fraca',       color: '#F59E0B' },
    { score: 3, label: 'Boa',         color: '#2563EB' },
    { score: 4, label: 'Forte',       color: '#22C55E' },
  ][n]
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}

function CheckSmall() {
  return (
    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
      <polyline points="2,6 5,9 10,3" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function Section({ title, children, C }: { title: string; children: React.ReactNode; C: Record<string,string> }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 18, fontFamily: "'Inter',sans-serif" }}>
        {title}
      </p>
      {children}
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { profile, user, signOut } = useAuth()
  const { isDark, toggle } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ACCENT = isDark ? '#60A5FA' : '#2563EB'

  const C: Record<string,string> = isDark ? {
    bg: '#0F172A', surface: '#1E293B', border: '#334155',
    text: '#F1F5F9', textSub: '#94A3B8', textMuted: '#475569',
    accent: ACCENT, accentBg: 'rgba(30,64,175,0.2)',
    inputBg: '#1E293B', inputBorder: '#334155', inner: '#0F172A',
  } : {
    bg: '#F0F9FF', surface: '#FFFFFF', border: '#E0F2FE',
    text: '#0F172A', textSub: '#374151', textMuted: '#64748B',
    accent: ACCENT, accentBg: '#EFF6FF',
    inputBg: '#FFFFFF', inputBorder: '#E0F2FE', inner: '#F8FAFC',
  }

  const firstName = profile?.name?.split(' ')[0] || 'você'

  // ── Foto de perfil ───────────────────────────────────────────
  const [avatarUrl,  setAvatarUrl]  = useState<string>(
    (profile as unknown as { avatar_url?: string })?.avatar_url || ''
  )
  const [uploading,  setUploading]  = useState(false)
  const [uploadErr,  setUploadErr]  = useState('')
  const [uploadDone, setUploadDone] = useState(false)

  // ── Informações pessoais ─────────────────────────────────────
  const [name,       setName]       = useState(profile?.name || '')
  const [savingName, setSavingName] = useState(false)
  const [nameDone,   setNameDone]   = useState(false)
  const [nameErr,    setNameErr]    = useState('')

  // ── Alterar senha ────────────────────────────────────────────
  const [newPw,    setNewPw]    = useState('')
  const [cfPw,     setCfPw]     = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [showCf,   setShowCf]   = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [pwDone,   setPwDone]   = useState(false)
  const [pwErr,    setPwErr]    = useState('')
  const [pwFocus,  setPwFocus]  = useState(false)

  // ── Excluir conta ────────────────────────────────────────────
  const [showDel,  setShowDel]  = useState(false)
  const [delText,  setDelText]  = useState('')
  const [deleting, setDeleting] = useState(false)
  const [delErr,   setDelErr]   = useState('')

  const st = strength(newPw)

  const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
    width: '100%', height: 42, padding: '0 12px',
    border: `1px solid ${C.inputBorder}`, borderRadius: 8,
    fontSize: 14, fontFamily: "'Inter',sans-serif",
    color: C.text, background: C.inputBg, outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s', ...extra,
  })

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = ACCENT
    e.currentTarget.style.boxShadow   = `0 0 0 3px ${ACCENT}18`
  }
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = C.inputBorder
    e.currentTarget.style.boxShadow   = 'none'
  }

  const btnPrimary = (disabled: boolean): React.CSSProperties => ({
    alignSelf: 'flex-start', height: 36, padding: '0 18px', borderRadius: 8,
    border: 'none', background: disabled ? C.accentBg : ACCENT,
    color: disabled ? ACCENT : '#FFF', fontSize: 13, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: "'Inter',sans-serif", transition: 'all 0.15s',
  })

  // ── Upload de avatar ─────────────────────────────────────────
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validações
    if (file.size > 5 * 1024 * 1024) {
      setUploadErr('Arquivo muito grande. Máximo 5 MB.'); return
    }
    if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) {
      setUploadErr('Formato inválido. Use JPG, PNG, WebP ou GIF.'); return
    }

    setUploading(true); setUploadErr(''); setUploadDone(false)

    const ext  = file.name.split('.').pop() || 'jpg'
    const path = `${user.id}/avatar.${ext}`

    // Faz upload (sobrescreve se já existe)
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (upErr) {
      setUploadErr('Erro ao enviar imagem. Tente novamente.')
      setUploading(false); return
    }

    // URL pública com cache-busting
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = `${data.publicUrl}?v=${Date.now()}`

    // Atualiza perfil
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
    setAvatarUrl(url)
    setUploadDone(true)
    setTimeout(() => setUploadDone(false), 3000)
    setUploading(false)

    // Reseta input para permitir reenvio do mesmo arquivo
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function removeAvatar() {
    if (!user) return
    setUploading(true)
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id)
    setAvatarUrl('')
    setUploading(false)
  }

  // ── Salvar nome ──────────────────────────────────────────────
  async function saveName() {
    if (!name.trim()) { setNameErr('O nome não pode ser vazio.'); return }
    setSavingName(true); setNameErr('')
    const { error } = await supabase.from('profiles').update({ name: name.trim() }).eq('id', user!.id)
    if (error) setNameErr('Erro ao salvar.')
    else { setNameDone(true); setTimeout(() => setNameDone(false), 3000) }
    setSavingName(false)
  }

  // ── Alterar senha ────────────────────────────────────────────
  async function savePw() {
    setPwErr('')
    const failed = RULES.find(r => !r.ok(newPw))
    if (failed) { setPwErr(`Senha inválida: ${failed.label}.`); return }
    if (newPw !== cfPw) { setPwErr('As senhas não coincidem.'); return }
    setSavingPw(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) setPwErr('Erro ao alterar senha.')
    else {
      setPwDone(true); setNewPw(''); setCfPw('')
      setPwFocus(false); setShowPw(false); setShowCf(false)
      setTimeout(() => setPwDone(false), 4000)
    }
    setSavingPw(false)
  }

  // ── Excluir conta ────────────────────────────────────────────
  async function deleteAccount() {
    if (delText.trim().toUpperCase() !== 'EXCLUIR') return
    setDeleting(true); setDelErr('')
    try {
      const { error } = await supabase.rpc('delete_user_account')
      if (error) throw error
      await supabase.auth.signOut()
      navigate('/')
    } catch {
      setDelErr('Erro ao excluir. Verifique se a função SQL foi criada no Supabase.')
      setDeleting(false)
    }
  }

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { -webkit-font-smoothing: antialiased; background: ${C.bg}; }
    @keyframes fIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin { to{transform:rotate(360deg)} }
    @keyframes footerBeam { 0%{background-position:-200% 50%} 100%{background-position:200% 50%} }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-thumb { background: ${isDark?'#334155':'#BFDBFE'}; border-radius: 4px; }
    input:-webkit-autofill {
      -webkit-box-shadow: 0 0 0 100px ${C.inputBg} inset !important;
      -webkit-text-fill-color: ${C.text} !important;
    }
  `

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, fontFamily: "'Inter',sans-serif" }}>
      <style>{CSS}</style>

      {/* Header */}
      <header style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, height: 56, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/app')} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.background = C.accentBg; e.currentTarget.style.borderColor = `${ACCENT}40` }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.border }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: -0.3 }}>Perfil</span>
        </div>
        <button onClick={toggle} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}
          onMouseEnter={e => (e.currentTarget.style.background = C.accentBg)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.textSub} strokeWidth="2" strokeLinecap="round">
            {isDark
              ? <><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>
              : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>}
          </svg>
        </button>
      </header>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '28px 20px 100px', animation: 'fIn 0.35s ease' }}>

        {/* ── Foto de perfil ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, padding: '20px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14 }}>

          {/* Avatar clicável */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: C.accentBg, border: `2px solid ${ACCENT}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${ACCENT}20` }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Foto de perfil"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={() => setAvatarUrl('')}
                />
              ) : (
                <span style={{ fontSize: 26, fontWeight: 700, color: ACCENT, fontFamily: "'Inter',sans-serif" }}>
                  {firstName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Botão câmera */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', border: `2px solid ${C.surface}`, background: ACCENT, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: uploading ? 'not-allowed' : 'pointer', transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
              onMouseEnter={e => { if (!uploading) e.currentTarget.style.filter = 'brightness(1.15)' }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)' }}
            >
              {uploading
                ? <div style={{ width: 10, height: 10, border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: '#FFF', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <CameraIcon />
              }
            </button>

            {/* Input oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Info + ações */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 3px', letterSpacing: -0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.name || firstName}
            </p>
            <p style={{ fontSize: 12, color: C.textMuted, margin: '0 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ height: 30, padding: '0 12px', borderRadius: 7, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSub, fontSize: 12, fontWeight: 500, cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: "'Inter',sans-serif", transition: 'all 0.12s' }}
                onMouseEnter={e => { if (!uploading) { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSub }}
              >
                {uploading ? 'Enviando...' : avatarUrl ? 'Trocar foto' : 'Adicionar foto'}
              </button>

              {avatarUrl && !uploading && (
                <button
                  onClick={removeAvatar}
                  style={{ height: 30, padding: '0 12px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#EF4444', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter',sans-serif", transition: 'all 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  Remover
                </button>
              )}
            </div>

            {uploadErr  && <p style={{ fontSize: 11, color: '#EF4444', marginTop: 8 }}>{uploadErr}</p>}
            {uploadDone && <p style={{ fontSize: 11, color: '#22C55E', marginTop: 8 }}>✓ Foto atualizada!</p>}

            <p style={{ fontSize: 10, color: C.textMuted, marginTop: 6 }}>
              JPG, PNG, WebP ou GIF · máx. 5 MB
            </p>
          </div>
        </div>

        {/* ── Informações pessoais ── */}
        <Section title="Informações pessoais" C={C}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>Nome</label>
              <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveName() }} style={inp()} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>E-mail</label>
              <input value={user?.email || ''} disabled style={inp({ background: C.inner, color: C.textMuted, cursor: 'not-allowed' })} />
              <p style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>O e-mail não pode ser alterado.</p>
            </div>
            {nameErr  && <p style={{ fontSize: 12, color: '#EF4444' }}>{nameErr}</p>}
            {nameDone && <p style={{ fontSize: 12, color: '#22C55E' }}>✓ Nome salvo!</p>}
            <button onClick={saveName} disabled={savingName} style={btnPrimary(savingName)}
              onMouseEnter={e => { if (!savingName) e.currentTarget.style.filter = 'brightness(1.1)' }}
              onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}>
              {savingName ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </Section>

        {/* ── Alterar senha ── */}
        <Section title="Alterar senha" C={C}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>Nova senha</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Crie uma senha forte"
                  style={inp({ paddingRight: 42 })}
                  onFocus={e => { onFocus(e); setPwFocus(true) }} onBlur={onBlur} />
                <button onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, display: 'flex', padding: 4, borderRadius: 4 }}>
                  <EyeIcon open={showPw} />
                </button>
              </div>

              {pwFocus && newPw.length > 0 && (
                <div style={{ marginTop: 8, padding: 12, background: C.inner, borderRadius: 8, border: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
                    {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= st.score ? st.color : (isDark ? '#334155' : '#E2E8F0'), transition: 'background 0.2s' }} />)}
                  </div>
                  {st.label && <p style={{ fontSize: 11, fontWeight: 500, color: st.color, marginBottom: 8 }}>{st.label}</p>}
                  {RULES.map(r => {
                    const ok = r.ok(newPw)
                    return (
                      <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <div style={{ width: 15, height: 15, borderRadius: '50%', flexShrink: 0, background: ok ? 'rgba(34,197,94,0.15)' : (isDark ? '#1E293B' : '#F4F4F5'), border: `1px solid ${ok ? '#22C55E' : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {ok && <CheckSmall />}
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
              <div style={{ position: 'relative' }}>
                <input type={showCf ? 'text' : 'password'} value={cfPw} onChange={e => setCfPw(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') savePw() }} placeholder="Repita a nova senha"
                  style={inp({ paddingRight: 42, borderColor: cfPw.length > 3 ? (cfPw === newPw ? '#22C55E' : '#EF4444') : C.inputBorder })}
                  onFocus={onFocus} onBlur={onBlur} />
                <button onClick={() => setShowCf(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, display: 'flex', padding: 4, borderRadius: 4 }}>
                  <EyeIcon open={showCf} />
                </button>
              </div>
              {cfPw.length > 3 && (
                <p style={{ fontSize: 11, marginTop: 4, color: cfPw === newPw ? '#22C55E' : '#EF4444' }}>
                  {cfPw === newPw ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
                </p>
              )}
            </div>

            {pwErr  && <p style={{ fontSize: 12, color: '#EF4444' }}>{pwErr}</p>}
            {pwDone && <p style={{ fontSize: 12, color: '#22C55E' }}>✓ Senha alterada com sucesso!</p>}

            <button onClick={savePw} disabled={savingPw} style={btnPrimary(savingPw)}
              onMouseEnter={e => { if (!savingPw) e.currentTarget.style.filter = 'brightness(1.1)' }}
              onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}>
              {savingPw ? 'Salvando...' : 'Alterar senha'}
            </button>
          </div>
        </Section>

        {/* ── LGPD ── */}
        <Section title="Dados e privacidade (LGPD)" C={C}>
          <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.7, marginBottom: 14 }}>
            Conforme a LGPD, você tem direito ao esquecimento. Seus dados podem ser removidos permanentemente a qualquer momento.
          </p>
          <button onClick={() => navigate('/relatorios')} style={{ height: 34, padding: '0 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSub, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter',sans-serif", transition: 'all 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSub }}>
            Ver meus relatórios
          </button>
        </Section>

        {/* ── Zona de perigo ── */}
        <div style={{ background: isDark ? 'rgba(239,68,68,0.05)' : '#FFF5F5', border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#FED7D7'}`, borderRadius: 12, padding: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#EF4444', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 14, fontFamily: "'Inter',sans-serif" }}>
            Zona de perigo
          </p>

          {!showDel ? (
            <>
              <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.7, marginBottom: 14 }}>
                Excluir sua conta remove <strong style={{ color: C.text }}>permanentemente</strong> todas as conversas, relatórios e seu acesso. Esta ação não pode ser desfeita.
              </p>
              <button onClick={() => setShowDel(true)} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)', background: 'transparent', color: '#EF4444', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter',sans-serif", transition: 'all 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.07)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                Excluir minha conta
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: '#EF4444', fontWeight: 500, lineHeight: 1.6 }}>
                Digite <strong>excluir</strong> para confirmar<br/>
                <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 400 }}>(qualquer capitalização)</span>
              </p>

              <input
                value={delText}
                onChange={e => setDelText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') deleteAccount() }}
                placeholder="excluir"
                autoComplete="off"
                style={{
                  ...inp(),
                  borderColor: delText.length > 0
                    ? (delText.trim().toUpperCase() === 'EXCLUIR' ? '#22C55E' : 'rgba(239,68,68,0.5)')
                    : 'rgba(239,68,68,0.4)',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.12)' }}
                onBlur={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = delText.length > 0 ? (delText.trim().toUpperCase() === 'EXCLUIR' ? '#22C55E' : 'rgba(239,68,68,0.5)') : 'rgba(239,68,68,0.4)' }}
              />

              {delText.length > 0 && delText.trim().toUpperCase() === 'EXCLUIR' && (
                <p style={{ fontSize: 11, color: '#22C55E', marginTop: -6 }}>✓ Confirmação válida</p>
              )}

              {delErr && (
                <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 13, color: '#EF4444' }}>
                  {delErr}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowDel(false); setDelText(''); setDelErr('') }} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSub, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                  Cancelar
                </button>
                <button
                  onClick={deleteAccount}
                  disabled={delText.trim().toUpperCase() !== 'EXCLUIR' || deleting}
                  style={{ height: 36, padding: '0 16px', borderRadius: 8, border: 'none', background: delText.trim().toUpperCase() === 'EXCLUIR' && !deleting ? '#EF4444' : 'rgba(239,68,68,0.15)', color: delText.trim().toUpperCase() === 'EXCLUIR' && !deleting ? '#FFF' : '#EF4444', fontSize: 13, fontWeight: 600, cursor: delText.trim().toUpperCase() === 'EXCLUIR' && !deleting ? 'pointer' : 'not-allowed', fontFamily: "'Inter',sans-serif", transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (delText.trim().toUpperCase() === 'EXCLUIR' && !deleting) e.currentTarget.style.filter = 'brightness(1.1)' }}
                  onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}>
                  {deleting ? 'Excluindo...' : 'Confirmar exclusão permanente'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: C.textMuted, marginTop: 24 }}>
          Claramente · Fatec Ourinhos · TG 2026
        </p>
      </div>

      {/* Footer beam */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 2, zIndex: 999, pointerEvents: 'none', background: 'linear-gradient(90deg,transparent 0%,rgba(59,130,246,0) 5%,rgba(96,165,250,0.9) 30%,rgba(147,197,253,1) 50%,rgba(96,165,250,0.9) 70%,rgba(59,130,246,0) 95%,transparent 100%)', backgroundSize: '200% 100%', animation: 'footerBeam 4s linear infinite' }} />
    </div>
  )
}