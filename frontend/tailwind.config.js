/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        surface: '#1e293b',
        primary: '#3b82f6',
        danger: '#ef4444',
        emerald: '#10b981',
        warning: '#facc15',
        deepslate: '#080c14',
        cyan: '#06b6d4',
        orange: '#f97316',
      },
      animation: {
        'sonar': 'sonar 2s cubic-bezier(0, 0.2, 0.8, 1) infinite',
        'data-pulse': 'data-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fadeIn': 'fadeIn 0.5s ease-in-out forwards',
      },
      keyframes: {
        sonar: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(3)', opacity: '0' },
        },
        'data-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
