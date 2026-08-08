/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#08080b',
          900: '#0d0d12',
          850: '#131319',
          800: '#1a1a22',
          700: '#26262f',
          600: '#3a3a46',
          500: '#5a5a68',
        },
        accent: {
          400: '#7c8cff',
          500: '#5b6dff',
          600: '#4453e8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
