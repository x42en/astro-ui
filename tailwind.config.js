/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        space: {
          bg: '#080808',
          surface: '#111111',
          elevated: '#1a1a1a',
          border: '#252525',
          'border-light': '#333333',
        },
        primary: {
          DEFAULT: '#6366f1',
          hover: '#818cf8',
          muted: 'rgba(99,102,241,0.10)',
        },
        accent: {
          DEFAULT: '#22d3ee',
          hover: '#67e8f9',
          muted: 'rgba(34,211,238,0.10)',
        },
        success: {
          DEFAULT: '#10b981',
          muted: 'rgba(16,185,129,0.10)',
        },
        warning: {
          DEFAULT: '#f59e0b',
          muted: 'rgba(245,158,11,0.10)',
        },
        error: {
          DEFAULT: '#ef4444',
          muted: 'rgba(239,68,68,0.10)',
        },
        text: {
          primary: '#efefef',
          secondary: '#888888',
          muted: '#555555',
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
          '0%, 100%': { boxShadow: '0 0 8px 2px rgba(99,102,241,0.25)' },
          '50%': { boxShadow: '0 0 22px 6px rgba(99,102,241,0.5)' },
        },
        'accent-pulse': {
          '0%, 100%': { boxShadow: '0 0 6px 2px rgba(34,211,238,0.2)' },
          '50%': { boxShadow: '0 0 18px 5px rgba(34,211,238,0.45)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'accent-pulse': 'accent-pulse 2s ease-in-out infinite',
        'fade-in': 'fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-right': 'slide-in-right 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-up': 'slide-in-up 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};
