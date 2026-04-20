/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50:  '#FAFAF7',
          100: '#F5F0E8',
          200: '#EDE5D4',
          300: '#E0D5C0',
        },
        pablo: {
          red:   '#CC1111',
          gold:  '#A07840',
          brown: '#6B4F2A',
          black: '#1A1A1A',
          gray:  '#6B6B6B',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        display: ['Oswald', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
