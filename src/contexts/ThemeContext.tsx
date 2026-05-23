import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface Theme {
  bg: string; surface: string; card: string; cardBorder: string
  text: string; textSub: string; textMuted: string; placeholder: string
  violet: string; violetDeep: string; violetBg: string; violetHover: string
  header: string; headerBorder: string
  sidebar: string; sidebarBorder: string; sidebarText: string; sidebarMuted: string
  input: string; inputBorder: string; inputFocus: string
  userBubble: string; userBorder: string; userText: string
  botBubble: string; botBorder: string
  dot: string; scanLine: string
}

export const DARK: Theme = {
  bg:           '#050410',
  surface:      '#0D0B1A',
  card:         'rgba(255,255,255,0.04)',
  cardBorder:   'rgba(255,255,255,0.07)',
  text:         'rgba(255,255,255,0.88)',
  textSub:      'rgba(255,255,255,0.55)',
  textMuted:    'rgba(255,255,255,0.32)',
  placeholder:  'rgba(255,255,255,0.24)',
  violet:       '#8B5CF6',
  violetDeep:   '#7C3AED',
  violetBg:     'rgba(124,58,237,0.14)',
  violetHover:  'rgba(124,58,237,0.24)',
  header:       'rgba(5,4,16,0.92)',
  headerBorder: 'rgba(255,255,255,0.05)',
  sidebar:      'rgba(5,4,16,0.94)',
  sidebarBorder:'rgba(255,255,255,0.05)',
  sidebarText:  'rgba(255,255,255,0.72)',
  sidebarMuted: 'rgba(255,255,255,0.24)',
  input:        'rgba(255,255,255,0.05)',
  inputBorder:  'rgba(255,255,255,0.09)',
  inputFocus:   'rgba(139,92,246,0.55)',
  userBubble:   'rgba(124,58,237,0.22)',
  userBorder:   'rgba(124,58,237,0.38)',
  userText:     'rgba(233,228,255,0.95)',
  botBubble:    'rgba(255,255,255,0.05)',
  botBorder:    'rgba(255,255,255,0.08)',
  dot:          'rgba(139,92,246,0.7)',
  scanLine:     'rgba(124,58,237,0.45)',
}

export const LIGHT: Theme = {
  bg:           '#F4F2FF',
  surface:      '#FFFFFF',
  card:         'rgba(255,255,255,0.92)',
  cardBorder:   'rgba(124,58,237,0.12)',
  text:         '#1A1527',
  textSub:      '#4A4268',
  textMuted:    '#8B87A0',
  placeholder:  '#AEABBE',
  violet:       '#7C3AED',
  violetDeep:   '#6D28D9',
  violetBg:     'rgba(124,58,237,0.09)',
  violetHover:  'rgba(124,58,237,0.16)',
  header:       'rgba(255,255,255,0.96)',
  headerBorder: 'rgba(124,58,237,0.1)',
  sidebar:      'rgba(255,255,255,0.96)',
  sidebarBorder:'rgba(124,58,237,0.1)',
  sidebarText:  '#2D2440',
  sidebarMuted: '#9490A6',
  input:        'rgba(255,255,255,0.96)',
  inputBorder:  'rgba(124,58,237,0.18)',
  inputFocus:   '#7C3AED',
  userBubble:   'rgba(124,58,237,0.14)',
  userBorder:   'rgba(124,58,237,0.25)',
  userText:     '#1A1527',
  botBubble:    '#FFFFFF',
  botBorder:    'rgba(124,58,237,0.12)',
  dot:          'rgba(124,58,237,0.6)',
  scanLine:     'rgba(124,58,237,0.3)',
}

interface ThemeCtx {
  t: Theme
  isDark: boolean
  toggle: () => void
}

const Ctx = createContext<ThemeCtx>({ t: DARK, isDark: true, toggle: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('claramente-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    localStorage.setItem('claramente-theme', isDark ? 'dark' : 'light')
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
  }, [isDark])

  return (
    <Ctx.Provider value={{ t: isDark ? DARK : LIGHT, isDark, toggle: () => setIsDark(p => !p) }}>
      {children}
    </Ctx.Provider>
  )
}

export const useTheme = () => useContext(Ctx)