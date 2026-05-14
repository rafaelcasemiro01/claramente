import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

type ThemeType = 'light' | 'dark'

export const LIGHT = {
  bg: '#F8F6FF', card: '#ffffff', cardBorder: '#F0EBFF',
  header: '#ffffff', headerBorder: '#F0EBFF',
  text: '#1A0F3C', textSub: '#9B8FCC', textMuted: '#C4B5FD',
  violet: '#8B5CF6', violetBg: '#EDE9FE', violetDark: '#6D28D9',
  input: '#F8F6FF', inputBorder: '#EDE9FE', inputFocus: '#8B5CF6',
  botBubble: '#ffffff', botBorder: '#F0EBFF',
  userBubble: '#8B5CF6',
  dot: '#C4B5FD', menu: '#ffffff',
  tag: '#F5F3FF', tagText: '#6D28D9', tagBorder: '#EDE9FE',
  darkCard: '#1A0F3C', darkCardText: 'white', darkCardSub: '#9B8FCC',
  suggCard: '#1A0F3C', suggText: '#C4B5FD', suggNum: '#A78BFA',
  divider: '#F0EBFF', placeholder: '#C4B5FD',
}

export const DARK = {
  bg: '#0D0B1A', card: '#1A1535', cardBorder: 'rgba(139,92,246,0.15)',
  header: '#13102A', headerBorder: 'rgba(139,92,246,0.15)',
  text: '#F5F3FF', textSub: '#9B8FCC', textMuted: '#6B6480',
  violet: '#8B5CF6', violetBg: 'rgba(139,92,246,0.2)', violetDark: '#6D28D9',
  input: '#1E1840', inputBorder: 'rgba(139,92,246,0.2)', inputFocus: '#8B5CF6',
  botBubble: '#1A1535', botBorder: 'rgba(139,92,246,0.15)',
  userBubble: '#6D28D9',
  dot: '#A78BFA', menu: '#13102A',
  tag: 'rgba(139,92,246,0.15)', tagText: '#C4B5FD', tagBorder: 'rgba(139,92,246,0.2)',
  darkCard: '#1A1535', darkCardText: '#F5F3FF', darkCardSub: '#6B6480',
  suggCard: '#1A1535', suggText: '#C4B5FD', suggNum: '#A78BFA',
  divider: 'rgba(139,92,246,0.1)', placeholder: '#4A4268',
}

const ThemeContext = createContext<{
  theme: ThemeType
  t: typeof LIGHT
  isDark: boolean
  toggle: () => void
}>({ theme: 'light', t: LIGHT, isDark: false, toggle: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>(() =>
    (localStorage.getItem('claramente-theme') as ThemeType) || 'light'
  )

  const isDark = theme === 'dark'
  const t = isDark ? DARK : LIGHT

  useEffect(() => {
    localStorage.setItem('claramente-theme', theme)
    document.body.style.background = t.bg
  }, [theme, t.bg])

  function toggle() {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, t, isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}