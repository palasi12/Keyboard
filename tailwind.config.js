/**
 * Tailwind theme for the Taptile storefront.
 *
 * Colours, type and shape come from the V5 brand handoff: near-black ground,
 * one panel tone, and a single blue→violet→pink gradient carrying every accent.
 * Headings are Archivo 800 with an Instrument Serif italic second line.
 *
 * The gradient is the brand. Use `text-grad` / `bg-grad` / `border-grad`
 * rather than picking one of its stops — a flat purple reads as a mistake
 * next to the real thing.
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
        /* The three stops of the brand gradient. Reach for these only when a
           gradient is impossible (an SVG stroke, a canvas fill). */
        /* Errors and destructive states. Deliberately outside the brand
           gradient — a failed form should not look like a feature. */
        danger: '#ff6b5c',
        accent: {
          DEFAULT: '#8b6bff',
          blue: '#3fa0ff',
          violet: '#8b6bff',
          pink: '#e96bd8',
        },
      },
      fontFamily: {
        sans: ['Archivo', 'system-ui', '-apple-system', 'sans-serif'],
        /* The italic second line of every heading. */
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
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
        glow: '0 3px 10px rgba(255,255,255,.07)',
        lift: '0 5px 14px rgba(255,255,255,.11)',
        nav: '0 10px 30px rgba(0,0,0,.45)',
        panel: '0 20px 60px rgba(0,0,0,.45)',
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
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        pulse: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '.35' },
        },
        keypop: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(.94)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        rise: 'rise .5s cubic-bezier(.2,.8,.3,1) both',
        pop: 'pop 1.8s ease-in-out infinite',
        marquee: 'marquee 26s linear infinite',
        pulse: 'pulse 2.4s ease-in-out infinite',
        keypop: 'keypop .22s ease-out',
      },
    },
  },
  plugins: [],
};
