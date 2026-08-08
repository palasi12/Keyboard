/**
 * Tailwind theme derived from the Modernist design system in
 * "Taptile Configuration UI Mockup/_ds/".
 *
 * Two rules from that system's readme drive everything here:
 *   - zero corner radius, anywhere
 *   - 2px dividers, never hairlines
 * Ground and surface come from the mockup's dark override (.tt-root),
 * not the design system's light default.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ground: '#0b0a0a',
        divider: 'color-mix(in srgb, #f8f4f4 14%, transparent)',
        surface: '#1a1918',
        surface2: '#232120',
        neutral: {
          100: '#f8f4f4',
          200: '#eae7e7',
          300: '#d7d3d3',
          400: '#bab6b6',
          500: '#9b9797',
          600: '#7d7979',
          700: '#605d5d',
          800: '#444141',
          900: '#2d2b2b',
        },
        accent: {
          DEFAULT: '#ec3013',
          100: '#fff2ef',
          200: '#ffe0d9',
          300: '#ffc4b8',
          400: '#ff9783',
          500: '#ff563c',
          600: '#dd2b0f',
          700: '#ae1800',
          800: '#7c1405',
          900: '#4d170e',
        },
      },
      fontFamily: {
        sans: ['Archivo', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontWeight: {
        heading: '800',
      },
      borderRadius: {
        none: '0px',
        DEFAULT: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        full: '9999px',
      },
      letterSpacing: {
        heading: '-0.015em',
      },
      maxWidth: {
        shell: '1200px',
      },
    },
  },
  plugins: [],
};
