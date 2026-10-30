/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7C6FE0',
          50: '#F7F6FE',
          100: '#EFEAFD',
          200: '#DFD8FB',
          300: '#C5B7F7',
          400: '#A490F0',
          500: '#7C6FE0',
          600: '#6553D4',
          700: '#5342BE',
          800: '#45379D',
          900: '#3B2F7E',
        },
        mint: {
          DEFAULT: '#5CC8A8',
          light: '#EAF7F4',
          dark: '#3DA989',
        },
        peach: {
          DEFAULT: '#FFB48A',
          light: '#FFF3ED',
          dark: '#F0905D',
        },
        sky: {
          DEFAULT: '#6EC1F2',
          light: '#EFF8FE',
          dark: '#45A5DF',
        },
        rose: {
          DEFAULT: '#F58FA6',
          light: '#FDF0F3',
          dark: '#DE6884',
        },
        verdict: {
          green: '#4CBF8F',
          amber: '#F2B84B',
          red: '#EE6B6B',
        },
        pastel: {
          lavender: '#F4F1FF',
          mint: '#EAF7F4',
          border: 'rgba(124, 111, 224, 0.14)',
          card: 'rgba(255, 255, 255, 0.72)',
          cardHover: 'rgba(255, 255, 255, 0.85)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'pastel-sm': '0 2px 8px -1px rgba(124, 111, 224, 0.08), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
        pastel: '0 8px 24px -4px rgba(124, 111, 224, 0.10), 0 2px 8px -2px rgba(0, 0, 0, 0.04)',
        'pastel-lg':
          '0 16px 36px -6px rgba(124, 111, 224, 0.14), 0 4px 14px -3px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
