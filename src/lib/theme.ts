// src/lib/theme.ts
// Claramente — color tokens (terracotta & cream)
// Single source of truth. Use `useColors()` in any component.

import { useTheme } from '@/contexts/ThemeContext'

export type Mode = 'light' | 'dark'

export interface Palette {
  bg: string
  surface: string
  surface2: string
  surface3: string
  border: string
  borderSoft: string
  text: string
  textSub: string
  textMuted: string
  accent: string
  accentDeep: string
  accentSoft: string
  accentBorder: string
  danger: string
  success: string
}

export const palettes: Record<Mode, Palette> = {
  light: {
    bg:           '#faf6f0',
    surface:      '#fffdf8',
    surface2:     '#f4ede0',
    surface3:     '#ede3d2',
    border:       '#e6dbc6',
    borderSoft:   '#efe7d6',
    text:         '#2a1f1a',
    textSub:      '#5c4d42',
    textMuted:    '#8a7a6e',
    accent:       '#c4836a',
    accentDeep:   '#a06549',
    accentSoft:   '#f4e5dc',
    accentBorder: '#e8c5a8',
    danger:       '#b8553f',
    success:      '#6b8a54',
  },
  dark: {
    bg:           '#1a1612',
    surface:      '#221d18',
    surface2:     '#1f1a15',
    surface3:     '#2a241e',
    border:       '#3a3128',
    borderSoft:   '#2e2820',
    text:         '#f0e8dc',
    textSub:      '#c4b6a4',
    textMuted:    '#8a7d6e',
    accent:       '#d49380',
    accentDeep:   '#c4836a',
    accentSoft:   'rgba(212,147,128,0.12)',
    accentBorder: 'rgba(212,147,128,0.32)',
    danger:       '#d97560',
    success:      '#94b07a',
  },
}

/** Convenience hook — picks the right palette for the current theme. */
export function useColors(): Palette {
  const { isDark } = useTheme()
  return palettes[isDark ? 'dark' : 'light']
}

/** Shared font stack — keep Inter, fall back to system. */
export const fontStack = "'Inter', system-ui, -apple-system, sans-serif"