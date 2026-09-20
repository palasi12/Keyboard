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

      /* ---------------------------------------------------------------
         Admin dashboard tokens (TAPTILE Dialect dashboard handoff).
         Scoped to /admin. Three handoff names are renamed because the
         storefront already owns them and redefining them would restyle
         the public site:
             handoff `ground`  -> `deck`   (storefront ground is #0b0a0a)
             handoff `surface` -> `panel`  (storefront surface is #1a1918)
             handoff `danger`  -> `alert`  (storefront danger is #ff6b5c)
         Everything else matches the handoff verbatim. No hex literals
         belong in dashboard components — add them here instead.
      --------------------------------------------------------------- */
      deck: '#111214',
      rail: '#0f1013',
      panel: { DEFAULT: '#1e2126', top: '#23272d', bot: '#1c1f24' },
      tile: { DEFAULT: '#262a30', top: '#2e323a', track: '#282f35' },
      line: { DEFAULT: '#2a2f35', strong: '#343a43', row: '#252a31', rail: '#22262c' },

      /* UI accent. Marks exactly one thing per view. */
      lime: {
        DEFAULT: '#b6ff56',
        light: '#d3ff8d',
        mid: '#8ade33',
        deep: '#4f9a00',
        drop: '#96e63c',
        ink: '#08120a',
      },
      /* Ambient glow and chart fills only. Never a UI accent. */
      emerald: { DEFAULT: '#03d16d', light: '#42dc93', dark: '#06512b', mid: '#4ade80' },

      ink: {
        1: '#e8eaed',
        2: '#c5cad2',
        3: '#98a0aa',
        4: '#858d97',
        5: '#5a616a',
        nav: '#aeb5bf',
      },
      status: { lime: '#b6ff56', blue: '#7dd3fc', rose: '#f0abfc', grey: '#aeb5bf' },
      /* Off-state of a Toggle. Deliberately outside the ink scale — it is a
         control surface, not text. */
      toggle: { track: '#30363d', knob: '#8a919b' },
      /* Rose border a short stock card wears. */
      short: '#4a3340',
      alert: {
        surface: '#2b1f24',
        bot: '#201619',
        line: '#45323a',
        text: '#f0b6c4',
        muted: '#b8949c',
        ink: '#2a0b13',
      },
      chart: {
        1: '#b6ff56', 2: '#4ade80', 3: '#16a34a',
        4: '#d9f99d', 5: '#03d16d', 6: '#86efac',
        track: '#282f35',
        grid: 'rgba(255,255,255,0.045)',
      },
      },
      fontFamily: {
        sans: ['Archivo', 'system-ui', '-apple-system', 'sans-serif'],
        /* The italic second line of every heading. */
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        /* Admin dashboard only. The storefront stays on Archivo. */
        dash: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
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
        /* Dashboard geometry. */
        chip: '9px',
        tile: '11px',
        card: '16px',
        pill: '20px',
      },
      boxShadow: {
        cap: '0 4px 10px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.05)',
        shell: '0 24px 60px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.05)',
        glow: '0 3px 10px rgba(255,255,255,.07)',
        lift: '0 5px 14px rgba(255,255,255,.11)',
        nav: '0 10px 30px rgba(0,0,0,.45)',
        panel: '0 20px 60px rgba(0,0,0,.45)',
        /* Dashboard elevation. */
        card: 'inset 0 1px 0 rgba(255,255,255,0.055), 0 12px 32px rgba(0,0,0,0.5)',
        'card-sm': 'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 20px rgba(0,0,0,0.45)',
        tile: 'inset 0 1px 0 rgba(255,255,255,0.045)',
        track: 'inset 0 1px 2px rgba(0,0,0,0.4)',
        lime: '0 6px 20px rgba(182,255,86,0.28), inset 0 1px 0 rgba(255,255,255,0.35)',
        'lime-sm': '0 5px 14px rgba(182,255,86,0.22)',
        'lime-bar': '0 0 12px rgba(182,255,86,0.22)',
      },
      backgroundImage: {
        'lime-grad': 'linear-gradient(135deg,#d3ff8d 0%,#b6ff56 48%,#96e63c 100%)',
        'panel-grad': 'linear-gradient(168deg,#23272d 0%,#1e2126 55%,#1c1f24 100%)',
        'tile-grad': 'linear-gradient(170deg,#2e323a 0%,#262a30 100%)',
        'rail-grad': 'linear-gradient(180deg,rgba(3,209,109,0.08) 0%,rgba(0,0,0,0) 32%)',
        'alert-grad': 'linear-gradient(168deg,#2b1f24 0%,#201619 100%)',
        'alert-btn': 'linear-gradient(135deg,#f0779a 0%,#d63f68 100%)',
      },
      /* The dashboard motion table (§9) uses 120ms and 140ms, neither of
         which is a Tailwind default — without these the classes emit nothing. */
      transitionDuration: {
        120: '120ms',
        140: '140ms',
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
        /* The hero board hangs by its cable, so it never sits quite still. */
        float: {
          '0%,100%': { transform: 'translate(-50%, calc(-59% - 5px))' },
          '50%': { transform: 'translate(-50%, calc(-59% + 5px))' },
        },
        /* A slow band of light crossing the hero, well under the artwork. */
        sweep: {
          '0%': { transform: 'translate3d(-40%,-20%,0) rotate(8deg)', opacity: '0' },
          '22%': { opacity: '.45' },
          '60%': { opacity: '.24' },
          '100%': { transform: 'translate3d(60%,30%,0) rotate(8deg)', opacity: '0' },
        },
        /* The colour wash behind the board and the orb. */
        breathe: {
          '0%,100%': { opacity: '.82', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
      },
      animation: {
        rise: 'rise .5s cubic-bezier(.2,.8,.3,1) both',
        pop: 'pop 1.8s ease-in-out infinite',
        marquee: 'marquee 26s linear infinite',
        pulse: 'pulse 2.4s ease-in-out infinite',
        keypop: 'keypop .22s ease-out',
        float: 'float 13s ease-in-out infinite',
        sweep: 'sweep 24s linear infinite',
        breathe: 'breathe 11s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
