/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#120f2c',
          dim: '#120f2c',
          bright: '#383654',
          low: '#1b1835',
          DEFAULT2: '#1f1c39',
          high: '#292644',
          highest: '#343150',
          lowest: '#0d0a27',
          variant: '#343150',
        },
        primary: '#c0c1ff',
        'primary-container': '#8083ff',
        secondary: '#bdc2ff',
        'secondary-container': '#2f3aa3',
        tertiary: '#4cd7f6',
        'tertiary-container': '#009eb9',
        outline: '#908fa0',
        'outline-variant': '#464554',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'nocturne': 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.3) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(76,215,246,0.15) 0%, transparent 60%), linear-gradient(180deg, #120f2c 0%, #0d0a27 100%)',
        'nocturne-subtle': 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.2) 0%, transparent 50%), linear-gradient(180deg, #120f2c 0%, #0d0a27 100%)',
        'card-glow-amber': 'radial-gradient(ellipse 100% 80% at 50% 100%, rgba(245,158,11,0.2) 0%, transparent 70%)',
        'card-glow-cyan': 'radial-gradient(ellipse 100% 80% at 50% 100%, rgba(76,215,246,0.2) 0%, transparent 70%)',
        'card-glow-violet': 'radial-gradient(ellipse 100% 80% at 50% 100%, rgba(139,92,246,0.2) 0%, transparent 70%)',
        'card-glow-emerald': 'radial-gradient(ellipse 100% 80% at 50% 100%, rgba(16,185,129,0.2) 0%, transparent 70%)',
        'btn-primary': 'linear-gradient(135deg, #6366f1 0%, #4cd7f6 100%)',
        'btn-primary-hover': 'linear-gradient(135deg, #818cf8 0%, #67e8f9 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glass-hover': '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glow-indigo': '0 0 20px rgba(99,102,241,0.3)',
        'glow-cyan': '0 0 20px rgba(76,215,246,0.3)',
        'glow-amber': '0 0 20px rgba(245,158,11,0.3)',
        'btn': '0 4px 15px rgba(99,102,241,0.4)',
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.4 },
        },
        'fade-in': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        'slide-up': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
