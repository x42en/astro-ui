/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // All values use CSS custom properties from src/styles/theme.css.
        // The `rgb(var(...) / <alpha-value>)` format lets Tailwind's opacity
        // modifier syntax work: e.g. `bg-primary/15` → `rgb(var(--color-primary) / 0.15)`.
        space: {
          bg:           'rgb(var(--color-space-bg)           / <alpha-value>)',
          surface:      'rgb(var(--color-space-surface)      / <alpha-value>)',
          elevated:     'rgb(var(--color-space-elevated)     / <alpha-value>)',
          border:       'rgb(var(--color-space-border)       / <alpha-value>)',
          'border-light': 'rgb(var(--color-space-border-light) / <alpha-value>)',
          // Alias used for hover states on bordered elements.
          'border-hover': 'rgb(var(--color-space-border-light) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--color-primary)       / <alpha-value>)',
          hover:   'rgb(var(--color-primary-hover) / <alpha-value>)',
          muted:   'rgb(var(--color-primary)       / 0.10)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent)       / <alpha-value>)',
          hover:   'rgb(var(--color-accent-hover) / <alpha-value>)',
          muted:   'rgb(var(--color-accent)       / 0.10)',
        },
        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
          muted:   'rgb(var(--color-success) / 0.10)',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
          muted:   'rgb(var(--color-warning) / 0.10)',
        },
        error: {
          DEFAULT: 'rgb(var(--color-error) / <alpha-value>)',
          muted:   'rgb(var(--color-error) / 0.10)',
        },
        text: {
          primary:   'rgb(var(--color-text-primary)   / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          muted:     'rgb(var(--color-text-muted)     / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
        full: '9999px',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px 2px rgb(var(--color-primary) / 0.25)' },
          '50%':       { boxShadow: '0 0 22px 6px rgb(var(--color-primary) / 0.5)' },
        },
        'accent-pulse': {
          '0%, 100%': { boxShadow: '0 0 6px 2px rgb(var(--color-accent) / 0.20)' },
          '50%':       { boxShadow: '0 0 18px 5px rgb(var(--color-accent) / 0.45)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'glow-pulse':      'glow-pulse 2s ease-in-out infinite',
        'accent-pulse':    'accent-pulse 2s ease-in-out infinite',
        'fade-in':         'fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-right':  'slide-in-right 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-up':     'slide-in-up 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        shimmer:           'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};
