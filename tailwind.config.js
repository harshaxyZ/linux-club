/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-main)',
        surface: 'var(--bg-surface)',
        subsurface: 'var(--bg-subsurface)',
        border: 'var(--border-color)',
        borderHover: 'var(--border-hover)',
        ink: {
          DEFAULT: 'var(--text-ink)',
          muted: 'var(--text-muted)',
          dark: 'var(--text-subtle)',
        },
        accent: {
          DEFAULT: '#E11D48',
          hover: '#F43F5E',
          glow: 'rgba(225, 29, 72, 0.35)',
          terminal: '#10B981',
        },
        brand: {
          red: '#E11D48',
          'red-dark': '#BE123C',
          'red-crimson': '#9F1239',
          'red-glow': 'rgba(225, 29, 72, 0.35)',
        },
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'marquee': 'marquee 30s linear infinite',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
