import type { Config } from 'tailwindcss';

export default {
  // Class-based dark mode so the manual toggle (.dark on <html>) can override
  // the OS preference instead of relying on the (removed) media query.
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,md,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'var(--font-inter)', 'sans-serif']
      },
      colors: {
        aurora: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d'
        },
        sunrise: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f'
        },
        ink: 'rgb(var(--ink) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        'surface-3': 'rgb(var(--surface-3) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        overlay: 'rgb(var(--overlay) / <alpha-value>)',
        'on-accent': 'rgb(var(--on-accent) / <alpha-value>)'
      },
      backgroundImage: {
        'aurora-hero':
          'linear-gradient(135deg, #fff7ed 0%, #fef3c7 25%, #dcfce7 60%, #bbf7d0 100%)',
        'aurora-hero-dark':
          'linear-gradient(135deg, #1c1917 0%, #422006 25%, #052e16 60%, #022c22 100%)',
        'aurora-glow':
          'radial-gradient(ellipse at top, rgba(251,191,36,0.25) 0%, rgba(74,222,128,0.25) 45%, transparent 70%)'
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,23,42,0.06), 0 8px 24px rgba(15,23,42,0.05)',
        'card-hover': '0 4px 12px rgba(15,23,42,0.08), 0 16px 40px rgba(15,23,42,0.1)'
      },
      keyframes: {
        'aurora-drift': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(3%, 2%) scale(1.05)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' }
        }
      },
      animation: {
        'aurora-drift': 'aurora-drift 12s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite'
      }
    }
  },
  plugins: []
} satisfies Config;
