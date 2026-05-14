/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Lora', 'serif'],
      },
      colors: {
        brand: {
          50:  '#e6f4ed',
          100: '#c3e4d1',
          200: '#9dd4b8',
          500: '#3d8b5a',
          600: '#2d7a4a',
          700: '#1a4a2e',
        }
      },
      animation: {
        'fade-up': 'fadeUp 0.3s ease',
        'bounce-dot': 'bounceDot 1.2s infinite',
      },
      keyframes: {
        fadeUp: {
          'from': { opacity: '0', transform: 'translateY(8px)' },
          'to':   { opacity: '1', transform: 'translateY(0)' },
        },
        bounceDot: {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.5' },
          '30%':            { transform: 'translateY(-5px)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}