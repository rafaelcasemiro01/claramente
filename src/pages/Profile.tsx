// src/pages/Profile.tsx
// ─────────────────────────────────────────────────────────────────────
// Claramente — Perfil (re-themed)
// Mantém toda a lógica original: upload + crop circular de avatar,
// nome, senha (com regras + força), LGPD, exclusão de conta.
// Apresentação migrada para terracotta & cream.
// ─────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import type { CSSProperties, FocusEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'
import { UserNav } from '@/components/UserNav'
import { useColors, fontStack } from '@/lib/theme'

const RULES = [
  { label: 'Mínimo 8 caracteres',           ok: (p: string) => p.length >= 8 },
  { label: 'Uma letra maiúscula',           ok: (p: string) => /[A-Z]/.test(p) },
  { label: 'Um número',                     ok: (p: string) => /[0-9]/.test(p) },
  { label: 'Um caractere especial (!@#$%)', ok: (p: string) => /[!@#$%^&*]/.test(p) },
]

// ── Opções inclusivas (mesma lista do Onboarding) ─────────────────────
const PRONOUNS = [
  { value: 'ele/dele',   label: 'Ele / Dele' },
  { value: 'ela/dela',   label: 'Ela / Dela' },
  { value: 'elu/delu',   label: 'Elu / Delu' },
  { value: 'outro',      label: 'Outro' },
  { value: 'nao_dizer',  label: 'Prefiro não dizer' },
]
const GENDERS = [
  { value: 'mulher_cis',     label: 'Mulher cisgênero' },
  { value: 'homem_cis',      label: 'Homem cisgênero' },
  { value: 'mulher_trans',   label: 'Mulher trans' },
  { value: 'homem_trans',    label: 'Homem trans' },
  { value: 'nao_binarie',    label: 'Não-binárie' },
  { value: 'genderfluid',    label: 'Gênero fluido' },
  { value: 'agenero',        label: 'Agênero' },
  { value: 'outro',          label: 'Outro' },
  { value: 'nao_dizer',      label: 'Prefiro não dizer' },
]
const ORIENTATIONS = [
  { value: 'heterossexual', label: 'Heterossexual' },
  { value: 'homossexual',   label: 'Homossexual' },
  { value: 'bissexual',     label: 'Bissexual' },
  { value: 'pansexual',     label: 'Pansexual' },
  { value: 'assexual',      label: 'Assexual' },
  { value: 'queer',         label: 'Queer' },
  { value: 'outro',         label: 'Outro' },
  { value: 'nao_dizer',     label: 'Prefiro não dizer' },
]

function formatPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2)  return d
  if (d.length <= 7)  return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
function phoneFromDb(v: string | null | undefined): string {
  return formatPhone(v || '')
}

function pwStrength(p: string) {
  const n = RULES.filter(r => r.ok(p)).length
  return [
    { score: 0, label: '',           color: '#e6dbc6' },
    { score: 1, label: 'Muito fraca', color: '#b8553f' },
    { score: 2, label: 'Fraca',      color: '#d9a05b' },
    { score: 3, label: 'Boa',        color: '#c4836a' },
    { score: 4, label: 'Forte',      color: '#6b8a54' },
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

type T = ReturnType<typeof useColors>

function Section({ title, children, t }: { title: string; children: React.ReactNode; t: T }) {
  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: 14, padding: 22, marginBottom: 12,
    }}>
      <p style={{
        fontSize: 11, fontWeight: 600, color: t.textMuted,
        textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 18,
      }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  const { isDark, toggle } = useTheme()
  const t = useColors()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cropCanvasRef = useRef<HTMLCanvasElement>(null)
  const cropImgRef    = useRef<HTMLImageElement | null>(null)
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, ox: 0, oy: 0 })

  const CROP_SIZE = 210

  const firstName = profile?.name?.split(' ')[0] || 'você'

  const [avatarUrl,  setAvatarUrl]  = useState<string>(
    (profile as unknown as { avatar_url?: string })?.avatar_url || ''
  )
  const [uploading,  setUploading]  = useState(false)
  const [uploadErr,  setUploadErr]  = useState('')
  const [uploadDone, setUploadDone] = useState(false)

  const [cropFile,  setCropFile]  = useState<File | null>(null)
  const [cropScale, setCropScale] = useState(1)
  const [cropX,     setCropX]     = useState(0)
  const [cropY,     setCropY]     = useState(0)

  const [name,       setName]       = useState(profile?.name || '')
  const [savingName, setSavingName] = useState(false)
  const [nameDone,   setNameDone]   = useState(false)
  const [nameErr,    setNameErr]    = useState('')

  // ── "Sobre você" (campos do onboarding, editáveis no perfil) ─────
  const p2 = profile as unknown as {
    pronouns?: string; gender?: string; sexual_orientation?: string;
    birth_date?: string; phone?: string;
  } | null
  const [pronouns,    setPronouns]    = useState<string>(p2?.pronouns ?? '')
  const [gender,      setGender]      = useState<string>(p2?.gender ?? '')
  const [orientation, setOrientation] = useState<string>(p2?.sexual_orientation ?? '')
  const [birthDate,   setBirthDate]   = useState<string>(p2?.birth_date ?? '')
  const [phone,       setPhone]       = useState<string>(phoneFromDb(p2?.phone))
  const [savingAbout, setSavingAbout] = useState(false)
  const [aboutDone,   setAboutDone]   = useState(false)
  const [aboutErr,    setAboutErr]    = useState('')

  const [newPw,    setNewPw]    = useState('')
  const [cfPw,     setCfPw]     = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [showCf,   setShowCf]   = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [pwDone,   setPwDone]   = useState(false)
  const [pwErr,    setPwErr]    = useState('')
  const [pwFocus,  setPwFocus]  = useState(false)

  const [showDel,  setShowDel]  = useState(false)
  const [delText,  setDelText]  = useState('')
  const [deleting, setDeleting] = useState(false)
  const [delErr,   setDelErr]   = useState('')

  const st = pwStrength(newPw)

  // ── input helpers ────────────────────────────────────────────────
  const inp = (extra?: CSSProperties): CSSProperties => ({
    width: '100%', height: 44, padding: '0 14px',
    border: `1px solid ${t.border}`, borderRadius: 12,
    fontSize: 14, fontFamily: fontStack,
    color: t.text, background: isDark ? t.surface2 : '#fffcf6',
    outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
    ...extra,
  })
  const onFocusInp = (e: FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = t.accent
    e.currentTarget.style.boxShadow = `0 0 0 3px ${t.accent}22`
  }
  const onBlurInp = (e: FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = t.border
    e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.02)'
  }

  const btnPrimary = (disabled: boolean): CSSProperties => ({
    alignSelf: 'flex-start', height: 40, padding: '0 22px', borderRadius: 12, border: 'none',
    background: disabled ? t.accentSoft : t.accent,
    color: disabled ? t.accent : '#fff',
    fontSize: 13.5, fontWeight: 600, fontFamily: fontStack,
    cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
    boxShadow: disabled ? 'none' : `0 4px 14px ${t.accent}55, inset 0 1px 0 rgba(255,255,255,0.22)`,
  })

  // ── cropper ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!cropFile) return
    const url = URL.createObjectURL(cropFile)
    const img = new Image()
    img.onload = () => {
      cropImgRef.current = img
      URL.revokeObjectURL(url)
      const minScale = Math.max(CROP_SIZE / img.width, CROP_SIZE / img.height)
      setCropScale(minScale); setCropX(0); setCropY(0)
    }
    img.src = url
  }, [cropFile])

  useEffect(() => { drawCrop() }, [cropScale, cropX, cropY, cropFile])

  function drawCrop() {
    const canvas = cropCanvasRef.current
    const img = cropImgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')!
    canvas.width = CROP_SIZE; canvas.height = CROP_SIZE
    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE)
    ctx.save()
    ctx.beginPath()
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2)
    ctx.clip()
    const w = img.width * cropScale
    const h = img.height * cropScale
    const x = (CROP_SIZE - w) / 2 + cropX
    const y = (CROP_SIZE - h) / 2 + cropY
    ctx.drawImage(img, x, y, w, h)
    ctx.restore()
  }

  function onCropDown(clientX: number, clientY: number) {
    dragRef.current = { dragging: true, startX: clientX, startY: clientY, ox: cropX, oy: cropY }
  }
  function onCropMove(clientX: number, clientY: number) {
    if (!dragRef.current.dragging) return
    setCropX(dragRef.current.ox + (clientX - dragRef.current.startX))
    setCropY(dragRef.current.oy + (clientY - dragRef.current.startY))
  }
  function onCropUp() { dragRef.current.dragging = false }

  async function getCroppedBlob(): Promise<Blob> {
    const OUT = 320
    const factor = OUT / CROP_SIZE
    const out = document.createElement('canvas')
    out.width = OUT; out.height = OUT
    const ctx = out.getContext('2d')!
    const img = cropImgRef.current!
    ctx.beginPath()
    ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2)
    ctx.clip()
    const w = img.width * cropScale * factor
    const h = img.height * cropScale * factor
    const x = (OUT - w) / 2 + cropX * factor
    const y = (OUT - h) / 2 + cropY * factor
    ctx.drawImage(img, x, y, w, h)
    return new Promise(res => out.toBlob(b => res(b!), 'image/jpeg', 0.92))
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setUploadErr('Máximo 5 MB.'); return }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setUploadErr('Use JPG, PNG, WebP ou GIF.'); return
    }
    setUploadErr('')
    cropImgRef.current = null
    setCropX(0); setCropY(0); setCropFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function confirmCrop() {
    if (!user || !cropFile) return
    setUploading(true); setUploadErr('')
    const blob = await getCroppedBlob()
    const path = `${user.id}/avatar.jpg`
    const { error } = await supabase.storage
      .from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
    if (error) { setUploadErr('Erro ao enviar. Verifique o bucket "avatars".'); setUploading(false); return }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = `${data.publicUrl}?v=${Date.now()}`
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
    setAvatarUrl(url); setCropFile(null); cropImgRef.current = null
    setUploadDone(true); setTimeout(() => setUploadDone(false), 3000)
    setUploading(false)
  }

  async function removeAvatar() {
    if (!user) return
    setUploading(true)
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id)
    setAvatarUrl(''); setUploading(false)
  }

  async function saveName() {
    if (!name.trim()) { setNameErr('O nome não pode ser vazio.'); return }
    setSavingName(true); setNameErr('')
    const { error } = await supabase.from('profiles').update({ name: name.trim() }).eq('id', user!.id)
    if (error) setNameErr('Erro ao salvar.')
    else { setNameDone(true); setTimeout(() => setNameDone(false), 3000) }
    setSavingName(false)
  }

  async function saveAbout() {
    if (!user) return
    setSavingAbout(true); setAboutErr('')
    const payload: Record<string, unknown> = {
      pronouns:           pronouns    || null,
      gender:             gender      || null,
      sexual_orientation: orientation || null,
      birth_date:         birthDate   || null,
      phone:              phone ? phone.replace(/\D/g, '') : null,
    }
    const { error } = await supabase.from('profiles').update(payload).eq('id', user.id)
    if (error) {
      setAboutErr('Erro ao salvar. Verifique se as colunas foram criadas no Supabase (supabase-migration.sql).')
    } else {
      setAboutDone(true)
      setTimeout(() => setAboutDone(false), 3000)
    }
    setSavingAbout(false)
  }

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
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { -webkit-font-smoothing: antialiased; background: ${t.bg}; }
    @keyframes fIn  { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
    @keyframes spinSoft { to { transform: rotate(360deg) } }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: ${isDark ? 'rgba(196,131,106,0.22)' : 'rgba(160,101,73,0.18)'}; border-radius: 4px; }
    input:-webkit-autofill {
      -webkit-box-shadow: 0 0 0 100px ${isDark ? t.surface2 : '#fffcf6'} inset !important;
      -webkit-text-fill-color: ${t.text} !important;
    }
    input[type=range] {
      -webkit-appearance: none; width: 100%; height: 4px;
      background: ${t.borderSoft}; border-radius: 2px; outline: none;
    }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none; width: 18px; height: 18px;
      border-radius: 50%; background: ${t.accent}; cursor: pointer;
      box-shadow: 0 0 4px ${t.accent}55;
    }
  `

  const initial = (profile?.name || firstName).charAt(0).toUpperCase()

  return (
    <div style={{ minHeight: '100dvh', background: t.bg, fontFamily: fontStack }}>
      <style>{CSS}</style>

      <header style={{
        background: t.surface, borderBottom: `1px solid ${t.border}`,
        height: 56, padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <UserNav isDark={isDark}/>
          <span style={{ fontSize: 15, fontWeight: 700, color: t.text, letterSpacing: -0.3 }}>Perfil</span>
        </div>
        <button
          onClick={toggle}
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: `1px solid ${t.border}`, background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.12s',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.textSub} strokeWidth="2" strokeLinecap="round">
            {isDark
              ? <><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/></>
              : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>}
          </svg>
        </button>
      </header>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '28px 20px 100px', animation: 'fIn 0.35s ease' }}>

        {/* Avatar card */}
        <div style={{
          background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16,
          padding: 22, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 20,
        }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 76, height: 76, borderRadius: '50%',
              overflow: 'hidden',
              background: avatarUrl ? t.accentSoft : `linear-gradient(135deg, ${t.accent}, ${t.accentDeep})`,
              border: `2px solid ${t.accentBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 24px ${t.accent}33`,
            }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Foto de perfil"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={() => setAvatarUrl('')}/>
              ) : (
                <span style={{ fontSize: 30, fontWeight: 700, color: '#fff' }}>{initial}</span>
              )}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%',
                border: `2px solid ${t.surface}`, background: t.accent, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: uploading ? 'not-allowed' : 'pointer',
                boxShadow: `0 2px 6px ${t.accent}55`, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!uploading) e.currentTarget.style.filter = 'brightness(1.12)' }}
              onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              {uploading
                ? <div style={{ width: 10, height: 10, border: '1.5px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spinSoft 0.7s linear infinite' }}/>
                : <CameraIcon/>
              }
            </button>

            <input ref={fileInputRef} type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarChange} style={{ display: 'none' }}/>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: t.text, margin: '0 0 3px', letterSpacing: -0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.name || firstName}
            </p>
            <p style={{ fontSize: 12, color: t.textMuted, margin: '0 0 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                style={ghostBtn(t)}>
                {uploading ? 'Enviando...' : avatarUrl ? 'Trocar foto' : 'Adicionar foto'}
              </button>
              {avatarUrl && !uploading && (
                <button onClick={removeAvatar} style={dangerGhostBtn(t)}>Remover</button>
              )}
            </div>
            {uploadErr  && <p style={{ fontSize: 11, color: t.danger, marginTop: 8 }}>{uploadErr}</p>}
            {uploadDone && <p style={{ fontSize: 11, color: t.success, marginTop: 8 }}>✓ Foto atualizada!</p>}
            <p style={{ fontSize: 10, color: t.textMuted, marginTop: 6 }}>JPG, PNG, WebP ou GIF · máx. 5 MB</p>
          </div>
        </div>

        {/* Personal info */}
        <Section title="Informações pessoais" t={t}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>Nome</label>
            <input value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveName() }}
              style={inp()} onFocus={onFocusInp} onBlur={onBlurInp}/>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>E-mail</label>
            <input value={user?.email || ''} disabled
              style={inp({ background: isDark ? t.surface3 : t.surface2, color: t.textMuted, cursor: 'not-allowed' })}/>
            <p style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>O e-mail não pode ser alterado.</p>
          </div>
          {nameErr  && <p style={{ fontSize: 12, color: t.danger }}>{nameErr}</p>}
          {nameDone && <p style={{ fontSize: 12, color: t.success }}>✓ Nome salvo com sucesso!</p>}
          <button onClick={saveName} disabled={savingName}
            style={btnPrimary(savingName)}
            onMouseEnter={e => { if (!savingName) e.currentTarget.style.filter = 'brightness(1.08)' }}
            onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}>
            {savingName ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </Section>

        {/* ── Sobre você ─────────────────────────────────────────── */}
        <Section title="Sobre você" t={t}>
          <p style={{ fontSize: 12.5, color: t.textMuted, lineHeight: 1.6, marginTop: -6, marginBottom: 4 }}>
            Essas informações ajudam o Claramente a te acolher de forma mais respeitosa e inclusiva. Tudo é opcional.
          </p>

          {/* Pronome — segmented */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 8 }}>Pronome</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 6 }}>
              {PRONOUNS.map(p => {
                const active = pronouns === p.value
                return (
                  <button key={p.value} type="button" onClick={() => setPronouns(active ? '' : p.value)}
                    style={{
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                      background: active ? t.accentSoft : 'transparent',
                      border: `1px solid ${active ? t.accent : t.border}`,
                      color: active ? t.accentDeep : t.textSub,
                      fontSize: 13, fontWeight: active ? 600 : 500, fontFamily: fontStack,
                      transition: 'all 0.12s',
                    }}>
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Gênero */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>Gênero</label>
            <select value={gender} onChange={e => setGender(e.target.value)}
              style={{...inp(), appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a7a6e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 36}}>
              <option value="">Selecione...</option>
              {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>

          {/* Orientação */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>Orientação sexual</label>
            <select value={orientation} onChange={e => setOrientation(e.target.value)}
              style={{...inp(), appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a7a6e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 36}}>
              <option value="">Selecione...</option>
              {ORIENTATIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Data de nascimento */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>Data de nascimento</label>
            <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
              style={inp()} onFocus={onFocusInp} onBlur={onBlurInp}/>
          </div>

          {/* Telefone */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>Telefone</label>
            <input type="tel" value={phone}
              onChange={e => setPhone(formatPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              style={inp()} onFocus={onFocusInp} onBlur={onBlurInp}/>
            <p style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>
              Útil para emergências. Nunca compartilhamos com terceiros.
            </p>
          </div>

          {aboutErr  && <p style={{ fontSize: 12, color: t.danger }}>{aboutErr}</p>}
          {aboutDone && <p style={{ fontSize: 12, color: t.success }}>✓ Informações atualizadas!</p>}

          <button onClick={saveAbout} disabled={savingAbout}
            style={btnPrimary(savingAbout)}
            onMouseEnter={e => { if (!savingAbout) e.currentTarget.style.filter = 'brightness(1.08)' }}
            onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}>
            {savingAbout ? 'Salvando...' : 'Salvar informações'}
          </button>
        </Section>

        {/* Password */}
        <Section title="Alterar senha" t={t}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>Nova senha</label>
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="Crie uma senha forte"
                style={inp({ paddingRight: 42 })}
                onFocus={e => { onFocusInp(e); setPwFocus(true) }}
                onBlur={onBlurInp}/>
              <button onClick={() => setShowPw(p => !p)} style={eyeBtn(t)}><EyeIcon open={showPw}/></button>
            </div>

            {pwFocus && newPw.length > 0 && (
              <div style={{
                marginTop: 10, padding: 12, borderRadius: 10,
                background: isDark ? t.surface2 : '#fbf6ec', border: `1px solid ${t.borderSoft}`,
              }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i <= st.score ? st.color : (isDark ? t.border : '#e7dac4'),
                      transition: 'background 0.2s',
                    }}/>
                  ))}
                </div>
                {st.label && <p style={{ fontSize: 11, fontWeight: 500, color: st.color, marginBottom: 8 }}>{st.label}</p>}
                {RULES.map(r => {
                  const ok = r.ok(newPw)
                  return (
                    <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <div style={{
                        width: 15, height: 15, borderRadius: '50%', flexShrink: 0,
                        background: ok ? 'rgba(107,138,84,0.15)' : (isDark ? t.surface3 : '#f4ede0'),
                        border: `1px solid ${ok ? t.success : t.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {ok && (
                          <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                            <polyline points="2,6 5,9 10,3" stroke={t.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: ok ? t.success : t.textMuted }}>{r.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>Confirmar nova senha</label>
            <div style={{ position: 'relative' }}>
              <input type={showCf ? 'text' : 'password'} value={cfPw}
                onChange={e => setCfPw(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') savePw() }}
                placeholder="Repita a nova senha"
                style={inp({
                  paddingRight: 42,
                  borderColor: cfPw.length > 3 ? (cfPw === newPw ? t.success : t.danger) : t.border,
                })}
                onFocus={onFocusInp} onBlur={onBlurInp}/>
              <button onClick={() => setShowCf(p => !p)} style={eyeBtn(t)}><EyeIcon open={showCf}/></button>
            </div>
            {cfPw.length > 3 && (
              <p style={{ fontSize: 11, marginTop: 4, color: cfPw === newPw ? t.success : t.danger }}>
                {cfPw === newPw ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
              </p>
            )}
          </div>

          {pwErr  && <p style={{ fontSize: 12, color: t.danger }}>{pwErr}</p>}
          {pwDone && <p style={{ fontSize: 12, color: t.success }}>✓ Senha alterada com sucesso!</p>}

          <button onClick={savePw} disabled={savingPw}
            style={btnPrimary(savingPw)}
            onMouseEnter={e => { if (!savingPw) e.currentTarget.style.filter = 'brightness(1.08)' }}
            onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}>
            {savingPw ? 'Salvando...' : 'Alterar senha'}
          </button>
        </Section>

        {/* LGPD */}
        <Section title="Dados e privacidade (LGPD)" t={t}>
          <p style={{ fontSize: 13, color: t.textSub, lineHeight: 1.7 }}>
            Conforme a LGPD, você tem direito ao esquecimento. Seus dados podem ser removidos permanentemente a qualquer momento.
          </p>
          <button onClick={() => navigate('/relatorios')} style={ghostBtn(t)}>Ver meus relatórios</button>
        </Section>

        {/* Danger zone */}
        <div style={{
          background: isDark ? 'rgba(217,117,96,0.06)' : 'rgba(184,85,63,0.04)',
          border: `1px solid ${isDark ? 'rgba(217,117,96,0.25)' : 'rgba(184,85,63,0.2)'}`,
          borderRadius: 14, padding: 22,
        }}>
          <p style={{
            fontSize: 11, fontWeight: 600, color: t.danger,
            textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 14,
          }}>Zona de perigo</p>

          {!showDel ? (
            <>
              <p style={{ fontSize: 13, color: t.textSub, lineHeight: 1.7, marginBottom: 14 }}>
                Excluir sua conta remove <strong style={{ color: t.text }}>permanentemente</strong> todas as conversas, relatórios e seu acesso. Esta ação não pode ser desfeita.
              </p>
              <button onClick={() => setShowDel(true)} style={{
                height: 36, padding: '0 14px', borderRadius: 10,
                border: `1px solid ${t.danger}66`, background: 'transparent', color: t.danger,
                fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: fontStack,
                transition: 'all 0.12s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = `${t.danger}10`)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                Excluir minha conta
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: t.danger, fontWeight: 500, lineHeight: 1.6 }}>
                Digite <strong>excluir</strong> para confirmar
                <br/><span style={{ fontSize: 11, color: t.textMuted, fontWeight: 400 }}>(qualquer capitalização é aceita)</span>
              </p>
              <input
                value={delText}
                onChange={e => setDelText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') deleteAccount() }}
                placeholder="excluir" autoComplete="off"
                style={inp({
                  borderColor: delText.length > 0
                    ? (delText.trim().toUpperCase() === 'EXCLUIR' ? t.success : `${t.danger}80`)
                    : `${t.danger}40`,
                })}
                onFocus={e => { e.currentTarget.style.borderColor = t.danger; e.currentTarget.style.boxShadow = `0 0 0 3px ${t.danger}22` }}
                onBlur={onBlurInp}/>
              {delText.length > 0 && delText.trim().toUpperCase() === 'EXCLUIR' && (
                <p style={{ fontSize: 11, color: t.success, marginTop: -6 }}>✓ Confirmação válida</p>
              )}
              {delErr && (
                <div style={{
                  padding: '10px 12px', borderRadius: 10,
                  background: `${t.danger}10`, border: `1px solid ${t.danger}33`,
                  fontSize: 13, color: t.danger,
                }}>{delErr}</div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowDel(false); setDelText(''); setDelErr('') }} style={ghostBtn(t)}>
                  Cancelar
                </button>
                <button
                  onClick={deleteAccount}
                  disabled={delText.trim().toUpperCase() !== 'EXCLUIR' || deleting}
                  style={{
                    height: 36, padding: '0 16px', borderRadius: 10, border: 'none',
                    background: (delText.trim().toUpperCase() === 'EXCLUIR' && !deleting) ? t.danger : `${t.danger}30`,
                    color: (delText.trim().toUpperCase() === 'EXCLUIR' && !deleting) ? '#fff' : t.danger,
                    fontSize: 13, fontWeight: 600, fontFamily: fontStack,
                    cursor: (delText.trim().toUpperCase() === 'EXCLUIR' && !deleting) ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s',
                  }}>
                  {deleting ? 'Excluindo...' : 'Confirmar exclusão permanente'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: t.textMuted, marginTop: 24 }}>
          Claramente · Fatec Ourinhos · TG 2026
        </p>
      </div>

      {/* Cropper modal */}
      {cropFile && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(26,22,18,0.78)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: t.surface, borderRadius: 20, padding: 24, maxWidth: 320, width: '100%',
            boxShadow: '0 28px 72px rgba(0,0,0,0.5)',
          }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 4 }}>Ajustar foto</p>
            <p style={{ fontSize: 12, color: t.textMuted, marginBottom: 18 }}>Arraste para reposicionar · deslize para zoom</p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
              <canvas
                ref={cropCanvasRef}
                width={CROP_SIZE} height={CROP_SIZE}
                style={{
                  width: CROP_SIZE, height: CROP_SIZE,
                  borderRadius: '50%', cursor: 'grab',
                  border: `3px solid ${t.accent}66`,
                  maxWidth: '100%', touchAction: 'none',
                  boxShadow: `0 0 28px ${t.accent}33`,
                }}
                onMouseDown={e => onCropDown(e.clientX, e.clientY)}
                onMouseMove={e => onCropMove(e.clientX, e.clientY)}
                onMouseUp={onCropUp}
                onMouseLeave={onCropUp}
                onTouchStart={e => { e.preventDefault(); const t = e.touches[0]; onCropDown(t.clientX, t.clientY) }}
                onTouchMove={e => { e.preventDefault(); const t = e.touches[0]; onCropMove(t.clientX, t.clientY) }}
                onTouchEnd={onCropUp}/>
            </div>

            <div style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: t.textSub }}>Zoom</span>
                <span style={{ fontSize: 12, color: t.textMuted }}>{Math.round(cropScale * 100)}%</span>
              </div>
              <input type="range" min={0.3} max={5} step={0.01} value={cropScale}
                onChange={e => setCropScale(Number(e.target.value))}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 10, color: t.textMuted }}>Menos zoom</span>
                <span style={{ fontSize: 10, color: t.textMuted }}>Mais zoom</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setCropFile(null); cropImgRef.current = null }}
                style={{
                  flex: 1, height: 42, borderRadius: 12,
                  border: `1px solid ${t.border}`, background: 'transparent',
                  color: t.textSub, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: fontStack,
                }}>Cancelar</button>
              <button
                onClick={confirmCrop} disabled={uploading}
                style={{
                  flex: 1, height: 42, borderRadius: 12, border: 'none',
                  background: uploading ? t.accentSoft : t.accent,
                  color: uploading ? t.accent : '#fff',
                  fontSize: 13, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: fontStack,
                  boxShadow: uploading ? 'none' : `0 4px 14px ${t.accent}55`,
                }}>
                {uploading ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ghostBtn(t: T): CSSProperties {
  return {
    height: 32, padding: '0 14px', borderRadius: 10,
    border: `1px solid ${t.border}`, background: 'transparent',
    color: t.textSub, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: fontStack,
    transition: 'all 0.12s',
  }
}
function dangerGhostBtn(t: T): CSSProperties {
  return {
    height: 32, padding: '0 14px', borderRadius: 10,
    border: `1px solid ${t.danger}40`, background: 'transparent',
    color: t.danger, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: fontStack,
  }
}
function eyeBtn(t: T): CSSProperties {
  return {
    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    color: t.textMuted, display: 'flex', padding: 4, borderRadius: 4,
  }
}
