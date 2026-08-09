/**
 * Tailwind theme for the Taptile storefront.
 *
 * Colours and type come from the Modernist system; the shape language comes
 * from the Taptile configurator (rounded keycaps, pill controls, soft depth)
 * so the site and the software read as one product.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ground: '#0b0a0a',
        divider: 'color-mix(in srgb, #f8f4f4 14%, transparent)',
        hairline: 'rgba(255,255,255,.08)',
        surface: '#1a1918',
        surface2: '#232120',
        keycap: '#131111',
        bezel: '#2a2725',
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
        DEFAULT: '10px',
        sm: '7px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
        full: '9999px',
      },
      boxShadow: {
        cap: '0 4px 10px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.05)',
        shell: '0 24px 60px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.05)',
        glow: '0 8px 24px rgba(255,255,255,.18)',
      },
      letterSpacing: {
        heading: '-0.015em',
      },
      maxWidth: {
        shell: '1200px',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'none' },
        },
        pop: {
          '0%,70%,100%': { background: '#2a2725', transform: 'scale(1)', boxShadow: 'none' },
          '35%': {
            background: '#f8f4f4',
            transform: 'scale(1.1)',
            boxShadow: '0 0 18px rgba(255,255,255,.5)',
          },
        },
      },
      animation: {
        rise: 'rise .5s cubic-bezier(.2,.8,.3,1) both',
        pop: 'pop 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
