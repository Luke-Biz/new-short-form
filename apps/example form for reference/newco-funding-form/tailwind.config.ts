import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  important: true,
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Montserrat"', 'sans-serif'],
      },
      colors: {
        brand: 'var(--brand)',
        'brand-hover': 'var(--brand-hover)',
        'brand-light': 'var(--brand-light)',
        'form-bg': 'var(--bg)',
        surface: 'var(--surface)',
        'text-primary': 'var(--text-primary)',
        'text-muted': 'var(--text-muted)',
        'text-tertiary': 'var(--text-tertiary)',
        'form-border': 'var(--border)',
        'error-bg': 'var(--error-bg)',
        'error-text': 'var(--error-text)',
        'success-bg': 'var(--success-bg)',
        'success-text': 'var(--success-text)',
        'success-border': 'var(--success-border)',
        'warning-bg': 'var(--warning-bg)',
        'warning-text': 'var(--warning-text)',
        'warning-border': 'var(--warning-border)',
      },
      borderRadius: {
        'form-sm': 'var(--radius-sm)',
        'form-md': 'var(--radius-md)',
        'form-lg': 'var(--radius-lg)',
      },
      keyframes: {
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'slide-down': 'slideDown 0.22s ease forwards',
        'fade-in': 'fadeIn 0.2s ease forwards',
      },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        '.focus-ring': {
          '&:focus-visible': {
            outline: '2px solid var(--brand)',
            'outline-offset': '2px',
          },
        },
        '.focus-ring-error': {
          '&:focus-visible': {
            outline: '2px solid var(--error-text)',
            'outline-offset': '2px',
          },
        },
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          'white-space': 'nowrap',
          'border-width': '0',
        },
      });
    }),
  ],
};

export default config;
