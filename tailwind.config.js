/** @type {import('tailwindcss').Config} */
// ───────────────────────────────────────────────────────────────────────
// Claramente — Tailwind config (terracotta & cream)
// Mantém compatível com qualquer uso de Tailwind existente, mas
// substitui as fontes (Plus Jakarta + Lora) por Inter e adiciona os
// tokens de cor da nova paleta. Use `bg-cream`, `text-warm-brown`,
// `bg-terracotta`, etc. nas classes Tailwind se quiser.
// ───────────────────────────────────────────────────────────────────────

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },

      colors: {
        cream:       '#faf6f0',
        surface:     '#fffdf8',
        'surface-2': '#f4ede0',
        'surface-3': '#ede3d2',

        warm: {
          brown:  '#2a1f1a',
          sub:    '#5c4d42',
          muted:  '#8a7a6e',
          border: '#e6dbc6',
          'border-soft': '#efe7d6',
        },

        terracotta: {
          DEFAULT: '#c4836a',
          deep:    '#a06549',
          soft:    '#f4e5dc',
          border:  '#e8c5a8',
          50:  '#fbf3ec',
          100: '#f4e5dc',
          200: '#e8c5a8',
          300: '#dba88c',
          400: '#cf977b',
          500: '#c4836a',
          600: '#a06549',
          700: '#8a5640',
          800: '#6b4030',
          900: '#3a1f14',
        },

        sage:   '#6b8a54',
        danger: '#b8553f',

        // mantém compat com classes antigas se ainda existirem
        brand: {
          50:  '#fbf3ec',
          100: '#f4e5dc',
          200: '#e8c5a8',
          500: '#c4836a',
          600: '#a06549',
          700: '#8a5640',
        },
      },

      boxShadow: {
        warm:        '0 4px 14px rgba(196,131,106,0.33)',
        'warm-lg':   '0 16px 44px rgba(106,64,48,0.10), 0 2px 8px rgba(106,64,48,0.04)',
        'warm-card': '0 1px 0 rgba(255,255,255,0.7) inset, 0 16px 44px rgba(106,64,48,0.10), 0 2px 8px rgba(106,64,48,0.04)',
      },

      borderRadius: {
        '12': '12px',
        '14': '14px',
        '16': '16px',
        '20': '20px',
      },

      animation: {
        'fade-up':   'fadeUp 0.3s ease',
        'bounce-dot': 'bounceDot 1.2s infinite',
        'aura-soft':  'auraSoft 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        'spin-soft':  'spinSoft 1s linear infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        bounceDot: {
          '0%, 60%, 100%': { transform: 'translateY(0)',     opacity: '0.5' },
          '30%':           { transform: 'translateY(-5px)',  opacity: '1'   },
        },
        auraSoft: {
          '0%, 100%': { transform: 'scale(1)',    opacity: '0.85' },
          '50%':      { transform: 'scale(1.08)', opacity: '1'    },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.35' },
        },
        spinSoft: {
          to: { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
