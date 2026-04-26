/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#409EFF',
          50: '#ecf5ff',
          100: '#d9ecff',
          200: '#b3d8ff',
          300: '#8cc5ff',
          400: '#66b1ff',
          500: '#409EFF',
          600: '#3a8ee6',
          700: '#337ecc',
          800: '#2d6eb3',
          900: '#1a4d8f'
        },
        sidebar: '#2a3042',
        'sidebar-hover': '#1a1f2e',
        surface: 'var(--color-surface)',
        elevated: 'var(--color-elevated)',
        'theme-border': 'var(--color-border)',
        'theme-text': 'var(--color-text)',
        'theme-text-secondary': 'var(--color-text-secondary)',
        'theme-primary': 'var(--color-primary)',
        'hover-overlay': 'var(--color-hover-overlay)',
        'accent-glow': 'var(--color-accent-glow)',
        titlebar: 'var(--color-titlebar)',
        'theme-bg': 'var(--color-bg)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    }
  },
  plugins: []
}
