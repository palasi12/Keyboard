import { useEffect, useRef, useState, type FormEvent } from 'react';
import { joinWaitlist } from '../lib/waitlist';
import { isSupabaseConfigured } from '../lib/supabase';
import Seo from '../components/Seo';

/**
 * Landing page (V5).
 *
 * The hero board, the range picker and the profile marquee run on the
 * self-contained demo data below — deliberately kept out of `lib/catalog.ts`
 * so the interactive toy here can drift from the real shop listing without
 * touching /shop or /product. The two email forms go through the real
 * `joinWaitlist` RPC; whichever board the visitor picked rides along in the
 * `source` field.
 */

/* --------------------------------- data --------------------------------- */

const LABELS: Record<string, string> = {
  scrub: 'Scrub',
  cut: 'Cut',
  ripple: 'Ripple Del',
  undo: 'Undo',
  redo: 'Redo',
  save: 'Save',
  zoomin: 'Zoom In',
  zoomout: 'Zoom Out',
  play: 'Play',
  mark: 'Mark I/O',
  layer: 'Layer',
  crop: 'Crop',
  bright: 'Exposure',
  contrast: 'Contrast',
  fx: 'Effect',
  vol: 'Volume',
};

interface DemoProduct {
  slug: string;
  name: string;
  model: string;
  tagline: string;
  cols: number;
  keySize: number;
  keys: string[];
  dials: string[];
  description: string;
}

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    slug: 'nano',
    name: 'Taptile Nano',
    model: 'TP-04D1',
    tagline: 'Four keys, one dial.',
    cols: 2,
    keySize: 66,
    keys: ['play', 'cut', 'undo', 'save'],
    dials: ['vol'],
    description:
      'The smallest board. Four mechanical keys for the four things you do a hundred times a day, and one encoder for volume.',
  },
  {
    slug: 'mini',
    name: 'Taptile Mini',
    model: 'TP-09D2',
    tagline: 'Nine keys, two dials.',
    cols: 3,
    keySize: 74,
    keys: ['scrub', 'cut', 'ripple', 'mark', 'undo', 'redo', 'save', 'zoomin', 'play'],
    dials: ['scrub', 'vol'],
    description:
      'A full 3×3 grid with two encoders — scrub and volume out of the box. The one most people should start with.',
  },
  {
    slug: 'pro',
    name: 'Taptile Pro',
    model: 'TP-15D3',
    tagline: 'Fifteen keys, three dials.',
    cols: 5,
    keySize: 66,
    keys: [
      'scrub', 'cut', 'ripple', 'mark', 'play',
      'undo', 'redo', 'save', 'zoomin', 'zoomout',
      'layer', 'fx', 'bright', 'contrast', 'crop',
    ],
    dials: ['scrub', 'vol', 'bright'],
    description:
      'For a timeline you live in. Fifteen keys, three encoders, and enough room to keep a whole edit on the desk.',
  },
];

interface Profile {
  name: string;
  keys: Array<[string, string]>;
  dials: string[];
}

const PROFILES: Profile[] = [
  {
    name: 'Premiere Pro',
    keys: [
      ['Scrub', '⌘←/→'], ['Cut', '⌘K'], ['Ripple Del', '⇧⌦'], ['Mark In/Out', 'I / O'],
      ['Undo', '⌘Z'], ['Redo', '⇧⌘Z'], ['Save', '⌘S'], ['Zoom In', '='], ['Play/Pause', 'Space'],
    ],
    dials: ['Scrub', 'Volume'],
  },
  {
    name: 'Photoshop',
    keys: [
      ['Brush', 'B'], ['Eraser', 'E'], ['Clone', 'S'], ['Lasso', 'L'],
      ['Undo', '⌘Z'], ['New Layer', '⇧⌘N'], ['Save', '⌘S'], ['Fit Screen', '⌘0'], ['Flatten', '⇧⌘E'],
    ],
    dials: ['Brush size', 'Opacity'],
  },
  {
    name: 'Figma',
    keys: [
      ['Frame', 'F'], ['Text', 'T'], ['Pen', 'P'], ['Component', '⌥⌘K'],
      ['Undo', '⌘Z'], ['Duplicate', '⌘D'], ['Group', '⌘G'], ['Zoom Fit', '⇧1'], ['Comment', 'C'],
    ],
    dials: ['Zoom', 'Opacity'],
  },
  {
    name: 'Illustrator',
    keys: [
      ['Selection', 'V'], ['Pen', 'P'], ['Shape', 'M'], ['Pathfinder', '⌘⌥⇧F9'],
      ['Undo', '⌘Z'], ['Group', '⌘G'], ['Save', '⌘S'], ['Zoom Fit', '⌘0'], ['Outline', '⌘Y'],
    ],
    dials: ['Stroke', 'Zoom'],
  },
  {
    name: 'OBS',
    keys: [
      ['Scene 1', 'F1'], ['Scene 2', 'F2'], ['Scene 3', 'F3'], ['Mute Mic', '⌥M'],
      ['Start Rec', '⌥R'], ['Replay', '⌥B'], ['Studio', '⌥S'], ['Transition', 'T'], ['Go Live', '⌥L'],
    ],
    dials: ['Mic gain', 'Desktop'],
  },
];

const MARQUEE_EXTRA = ['Lightroom', 'DaVinci Resolve', 'After Effects', 'Ableton'];
const MARQUEE = (() => {
  const one = [...PROFILES.map((p) => p.name), ...MARQUEE_EXTRA];
  return [...one, ...one];
})();

const INTERESTS = ['Taptile Nano', 'Taptile Mini', 'Taptile Pro', 'Not sure yet'];

const WAITLIST_KEY = 'taptile-waitlist-v1';
const EMAIL_SHAPE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const STEPS = [
  { title: 'Plug it in', body: 'USB-C into any computer. No drivers, no install, no account needed to use it.' },
  {
    title: 'Assign your keys',
    body: 'Open the configurator and tell each key what to do — a shortcut, a macro, a whole sequence.',
  },
  {
    title: 'Stop hunting for shortcuts',
    body: 'The things you do fifty times a day become one press. That is the entire pitch.',
  },
];

const PROMISES = [
  'You hear from us when the first batch is ready to order, and not before.',
  'Early access to the board you picked, before the general listing.',
  'Your address is only used for the launch email. Leave the list in one click.',
];

const FAQ = [
  {
    q: 'What can I actually program the keys to do?',
    a: 'Keyboard shortcuts, text snippets, media controls, and multi-step macros with timing between steps. Anything your keyboard can already do, on one key.',
  },
  {
    q: 'Does it work with my computer?',
    a: 'Yes — Windows, macOS and Linux. The board stores your layout on itself, so it behaves the same on any machine you plug it into.',
  },
  {
    q: 'Do I need to solder anything?',
    a: 'No. Switches are hot-swappable, so you can pull them out and try different ones by hand.',
  },
  {
    q: 'When can I buy one?',
    a: 'When the first batch is finished. The list gets the email before anything is listed publicly, so joining is the only way to hear about it early.',
  },
  {
    q: 'Which board should I pick?',
    a: 'Nano if you want a handful of shortcuts on the desk, Mini if you are not sure, Pro if you already know nine keys will not be enough. You can change your mind before the batch opens.',
  },
];

/* ------------------------------- component ------------------------------- */

/**
 * The configurator demo (the standalone `Taptile.dc.html` mockup in
 * `public/software-demo/`). It is authored for a 1280px+ desktop window, so we
 * render it at a fixed 1440×905 and scale that down to whatever width the
 * section gets — the frame height follows the scale so nothing clips.
 */
const DEMO_W = 1440;
const DEMO_H = 905;

function SoftwareDemo() {
  const frameRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0);
  const [blockedMsg, setBlockedMsg] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);

  // Scale the fixed 1440×905 demo down to fit the section width.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / DEMO_W));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Demo lock: keep visitors on the sign-in → Test mode → Key Mapping path.
  // The other left-rail sections (Dial Sensitivity, RGB Lighting, Advanced
  // Keys, Firmware) and the Settings gear are dimmed and click-blocked, with an
  // "Unavailable in demo mode" note. Applied from here because the iframe is
  // same-origin; the demo file itself is left untouched.
  useEffect(() => {
    function flashBlocked() {
      setBlockedMsg(true);
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setBlockedMsg(false), 1900);
    }

    function applyLock() {
      const iframe = iframeRef.current;
      if (!iframe) return;
      let doc: Document | null = null;
      try {
        doc = iframe.contentDocument;
      } catch {
        return; // cross-origin — shouldn't happen for a same-origin file
      }
      if (!doc || !doc.head) return;

      if (!doc.getElementById('tt-demo-lock')) {
        const style = doc.createElement('style');
        style.id = 'tt-demo-lock';
        style.textContent =
          '.tt-navrow[data-nav]:not([data-nav="0"]){opacity:.4 !important;cursor:not-allowed !important}' +
          '.tt-navrow[data-nav]:not([data-nav="0"]):hover{background:transparent !important}' +
          '[title="Settings"]{opacity:.4 !important;cursor:not-allowed !important}';
        doc.head.appendChild(style);
      }

      const marked = doc as Document & { __ttLocked?: boolean };
      if (!marked.__ttLocked) {
        marked.__ttLocked = true;
        const guard = (event: Event) => {
          const target = event.target as HTMLElement | null;
          if (!target || !target.closest) return;
          const navrow = target.closest('.tt-navrow');
          const lockedNav = !!navrow && navrow.getAttribute('data-nav') !== '0';
          const gear = target.closest('[title="Settings"]');
          if (lockedNav || gear) {
            event.preventDefault();
            event.stopPropagation();
            flashBlocked();
          }
        };
        doc.addEventListener('mousedown', guard, true);
        doc.addEventListener('click', guard, true);
      }
    }

    // The demo renders asynchronously via support.js, so retry for a few seconds.
    applyLock();
    let tries = 0;
    const id = window.setInterval(() => {
      applyLock();
      if (++tries > 24) window.clearInterval(id);
    }, 250);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(toastTimer.current);
    };
  }, []);

  return (
    <div className="mt-11 overflow-hidden rounded-2xl border border-white/10 bg-keycap shadow-[0_40px_90px_rgba(0,0,0,.6)]">
      <div className="flex items-center gap-3.5 border-b border-hairline bg-white/[0.02] px-4 py-3">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#3d3a3a]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3d3a3a]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3d3a3a]" />
        </span>
        <span className="text-[11.5px] uppercase tracking-[0.1em] text-neutral-600">Taptile — Configurator</span>
        <span className="ml-auto text-[11px] uppercase tracking-[0.14em] text-neutral-700">Demo mode</span>
      </div>
      <div
        ref={frameRef}
        className="relative w-full overflow-hidden bg-ground"
        style={{ height: scale ? DEMO_H * scale : 560 }}
      >
        <iframe
          ref={iframeRef}
          src="/software-demo/Taptile.dc.html"
          title="Taptile configurator demo — sign in, then the key-mapping page"
          loading="lazy"
          style={{
            width: DEMO_W,
            height: DEMO_H,
            border: 0,
            transformOrigin: 'top left',
            transform: `scale(${scale || 0.01})`,
          }}
        />

        {blockedMsg && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
            <span className="rounded-full border border-white/15 bg-black/80 px-4 py-2 text-[13px] text-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,.5)] backdrop-blur">
              Unavailable in demo mode
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface Saved {
  email: string;
  interest: string;
}

export default function Landing() {
  // Hero board demo — which app profile is showing and which key is lit.
  const [profile, setProfile] = useState(0);
  const [pressed, setPressed] = useState(4);
  const [pressTick, setPressTick] = useState(0);

  // Range picker — which hardware variant is selected.
  const [rangeIndex, setRangeIndex] = useState(1);

  // Waitlist — shared across both forms, exactly like the mockup.
  const [email, setEmail] = useState('');
  const [interest, setInterest] = useState('Not sure yet');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'busy'>('idle');
  const [saved, setSaved] = useState<Saved | null>(null);

  // Remember a signup across reloads so returning visitors keep the confirmed
  // state — the same thing the design mockup did.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WAITLIST_KEY);
      if (raw) setSaved(JSON.parse(raw) as Saved);
    } catch {
      /* ignore unreadable storage */
    }
  }, []);

  const active = PROFILES[profile]!;
  const pressedKey = active.keys[pressed] ?? active.keys[0]!;
  const range = DEMO_PRODUCTS[rangeIndex]!;
  const rangeChosen = interest === range.name;

  async function submit(event: FormEvent, source: string) {
    event.preventDefault();
    const trimmed = email.trim();
    setError(null);

    if (!EMAIL_SHAPE.test(trimmed)) {
      setError('That does not look like a valid email address.');
      return;
    }

    setStatus('busy');

    // When Supabase is wired up the signup is stored for real. Until then
    // (pre-launch, no keys) we still confirm the visitor and keep their pick
    // locally, so the form works instead of showing a "not connected" error.
    if (isSupabaseConfigured) {
      const result = await joinWaitlist(trimmed, source);
      if (!result.ok) {
        setError(result.error ?? 'Something went wrong.');
        setStatus('idle');
        return;
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    const record: Saved = { email: trimmed, interest };
    try {
      localStorage.setItem(WAITLIST_KEY, JSON.stringify(record));
    } catch {
      /* ignore unwritable storage */
    }
    setSaved(record);
    setStatus('idle');
  }

  function resetWaitlist() {
    try {
      localStorage.removeItem(WAITLIST_KEY);
    } catch {
      /* ignore */
    }
    setSaved(null);
    setEmail('');
    setError(null);
    setInterest('Not sure yet');
  }

  function chooseRange(index: number) {
    setRangeIndex(index);
    setInterest(DEMO_PRODUCTS[index]!.name);
  }

  function jumpToWaitlist() {
    setInterest(range.name);
    const el = document.getElementById('waitlist');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' });
  }

  const submitLabel = status === 'busy' ? 'Joining…' : 'Join the list';

  return (
    <>
      <Seo
        title="Taptile — programmable mini keyboards"
        description="Programmable mini keyboards for the shortcuts you use every day. Hot-swappable, USB-C, Windows and macOS. Nano, Mini or Pro."
        path="/"
        image="/og.svg"
      />

      {/* ---------------------------------- hero ---------------------------------- */}
      <section className="stage border-b-2 border-divider">
        <div className="mx-auto grid max-w-shell items-center gap-16 px-5 py-20 lg:grid-cols-[1.05fr_.95fr] lg:py-[104px]">
          {/* left: pitch + inline waitlist */}
          <div className="animate-rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-hairline bg-white/[0.03] px-3.5 py-1.5 text-[11px] tracking-[0.06em] text-neutral-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              Not shipping yet — first batch opens to the list
            </p>

            <h1 className="mt-6 text-5xl font-heading leading-[1.03] tracking-heading text-neutral-100 sm:text-6xl lg:text-7xl">
              Your shortcuts,
              <br />
              on real keys.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-neutral-400">
              A programmable mini keyboard for the things you do a hundred times a day.
              Mute, switch scenes, paste the thing, run the macro. One press.
            </p>

            <div className="mt-9 max-w-lg">
              {saved ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-xl border border-white/[0.16] bg-surface px-6 py-5 shadow-[0_10px_30px_rgba(0,0,0,.35)]"
                >
                  <p className="flex items-center gap-2.5 font-heading text-base text-neutral-100">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[#3ec95f] text-[13px] text-ground">
                      ✓
                    </span>
                    You&apos;re on the list.
                  </p>
                  <p className="mt-2 text-sm text-neutral-400">
                    We&apos;ll email {saved.email} once these are ready to order. Nothing else.
                  </p>
                  {saved.interest !== 'Not sure yet' && (
                    <p className="mt-2 text-[13px] text-neutral-600">
                      We&apos;ve noted the {saved.interest}.
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={(e) => submit(e, `landing-hero:${interest}`)} noValidate>
                  <div className="flex gap-2.5">
                    <label htmlFor="hero-email" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="hero-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      className="field flex-1"
                      disabled={status === 'busy'}
                    />
                    <button type="submit" className="btn-primary shrink-0 px-6 py-3.5 text-base" disabled={status === 'busy'}>
                      {submitLabel}
                    </button>
                  </div>
                  {error && (
                    <p role="alert" className="mt-2.5 text-sm text-accent-400">
                      {error}
                    </p>
                  )}
                  <p className="mt-3 text-[13px] text-neutral-600">
                    We&apos;ll email you when the first batch is ready to order.
                  </p>
                </form>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-500">
              <span>Windows, macOS, Linux</span>
              <span className="h-3 w-px bg-divider" />
              <span>Hot-swappable switches</span>
              <span className="h-3 w-px bg-divider" />
              <span>Layout stored on the board</span>
            </div>
          </div>

          {/* right: interactive board demo */}
          <div id="try" className="animate-rise scroll-mt-24">
            <div className="mb-3.5 flex items-center gap-2.5">
              <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Try a profile</span>
              <span className="h-0.5 flex-1 bg-divider" />
            </div>

            <div className="mb-4 flex flex-wrap gap-1.5">
              {PROFILES.map((p, i) => {
                const on = i === profile;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setProfile(i)}
                    aria-pressed={on}
                    className="rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition"
                    style={{
                      borderColor: on ? '#f8f4f4' : 'rgba(255,255,255,.12)',
                      background: on ? '#f8f4f4' : 'rgba(255,255,255,.02)',
                      color: on ? '#131111' : '#bab6b6',
                    }}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>

            <div className="stage-soft flex justify-center rounded-xl p-7">
              <div className="overflow-hidden rounded-xl border border-hairline bg-surface shadow-shell">
                <div className="flex items-center gap-2.5 border-b border-hairline bg-white/[0.02] px-4 py-2.5">
                  <span className="h-2 w-4 rounded-[3px] border border-neutral-900 bg-bezel" />
                  <span className="text-[9px] font-heading uppercase tracking-[0.18em] text-neutral-400">
                    Taptile Mini
                  </span>
                  <span className="ml-auto text-[8.5px] tracking-[0.14em] text-neutral-700">TP-09D2</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3ec95f]" />
                </div>

                <div className="px-6 pb-6 pt-5">
                  <div className="grid grid-cols-3 gap-2.5" style={{ gridAutoRows: '78px', gridTemplateColumns: 'repeat(3, 78px)' }}>
                    {active.keys.map((k, i) => {
                      const on = i === pressed;
                      return (
                        <button
                          key={on ? `k${i}-${pressTick}` : `k${i}`}
                          type="button"
                          onClick={() => {
                            setPressed(i);
                            setPressTick((t) => t + 1);
                          }}
                          aria-label={`Key ${i + 1}, ${k[0]}`}
                          className="rounded-md p-[3px] shadow-cap"
                          style={{
                            background: '#2a2725',
                            border: `1px solid ${on ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.06)'}`,
                            animation: on ? 'keypop .22s ease-out' : 'none',
                          }}
                        >
                          <span
                            className="relative flex h-full w-full flex-col items-center justify-center gap-1 rounded-sm"
                            style={{ background: on ? '#f8f4f4' : '#131111' }}
                          >
                            <span
                              className="absolute left-1.5 top-1 text-[8px] font-heading tracking-[0.1em]"
                              style={{ color: on ? 'rgba(19,17,17,.5)' : '#605d5d' }}
                            >
                              K{i + 1}
                            </span>
                            <span
                              className="px-1 text-center text-[9.5px] leading-tight"
                              style={{ color: on ? 'rgba(19,17,17,.75)' : '#9b9797' }}
                            >
                              {k[0]}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="my-4 flex items-center gap-2.5">
                    <span className="text-[9.5px] uppercase tracking-[0.16em] text-neutral-500">Rotary</span>
                    <span className="h-0.5 flex-1 bg-divider" />
                  </div>

                  <div className="flex justify-center gap-8">
                    {active.dials.map((label, i) => (
                      <span key={label} className="flex flex-col items-center gap-1.5">
                        <span className="grid h-[78px] w-[78px] place-items-center rounded-full border-2 border-bezel bg-bezel p-1 shadow-cap">
                          <span className="grid h-full w-full place-items-center rounded-full bg-keycap text-[9px] text-neutral-500">
                            {label}
                          </span>
                        </span>
                        <span className="text-[8px] font-heading tracking-[0.14em] text-neutral-700">D{i + 1}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3.5 flex items-center gap-3 rounded-lg border border-hairline bg-white/[0.02] px-4 py-3">
              <span className="text-[9.5px] uppercase tracking-[0.16em] text-neutral-600">Fires</span>
              <span className="font-mono text-sm text-neutral-100">{pressedKey[1]}</span>
              <span className="ml-auto text-[13px] text-neutral-500">
                {pressedKey[0]} · {active.name}
              </span>
            </div>
            <p className="mt-2.5 text-xs text-neutral-700">
              Press a key. Switch profiles to see the same board in another app.
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------------- marquee --------------------------------- */}
      <section className="overflow-hidden border-b-2 border-divider">
        <div className="mx-auto flex max-w-shell items-center gap-6 px-5 py-[18px]">
          <p className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-neutral-500">Profiles for</p>
          <div
            className="relative flex-1 overflow-hidden"
            style={{ maskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)' }}
          >
            <div className="flex w-max animate-marquee gap-10 hover:[animation-play-state:paused]">
              {MARQUEE.map((app, i) => (
                <span key={`${app}-${i}`} className="whitespace-nowrap text-sm text-neutral-600">
                  {app}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------- range (#boards) ---------------------------- */}
      <section id="boards" className="scroll-mt-20 py-[88px]">
        <div className="mx-auto max-w-shell px-5">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div>
              <p className="kicker-accent">01 — Range</p>
              <h2 className="mt-3 text-3xl font-heading tracking-heading text-neutral-100 sm:text-4xl">
                Pick your size
              </h2>
              <p className="mt-4 max-w-lg text-neutral-400">
                Four, nine or fifteen keys. All three run the same configurator and store the layout
                on the board — you just decide how much desk you want to give it.
              </p>
            </div>
            <p className="max-w-[260px] text-[13px] text-neutral-600">
              Nothing is on sale yet. Tell us which one you want and you&apos;ll hear about that batch first.
            </p>
          </div>

          <div className="mt-12 grid items-start gap-12 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">
            {/* left column: picker + active details */}
            <div className="flex flex-col">
              <div className="flex flex-wrap gap-[18px]">
                {DEMO_PRODUCTS.map((p, i) => {
                  const on = i === rangeIndex;
                  return (
                    <button
                      key={p.slug}
                      type="button"
                      onClick={() => chooseRange(i)}
                      aria-pressed={on}
                      className="flex flex-col items-center gap-3"
                    >
                      <span
                        className="relative grid h-[104px] w-[104px] place-items-center rounded-full border transition-all duration-200"
                        style={{
                          borderColor: on ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.12)',
                          background: on
                            ? 'linear-gradient(150deg, rgba(255,255,255,.16), rgba(255,255,255,.05))'
                            : 'linear-gradient(150deg, rgba(255,255,255,.06), rgba(255,255,255,.02))',
                          boxShadow: on
                            ? '0 18px 40px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.3)'
                            : '0 8px 20px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.12)',
                          transform: on ? 'scale(1.06)' : 'scale(1)',
                        }}
                      >
                        <span
                          className="pointer-events-none absolute inset-px rounded-full"
                          style={{ background: 'linear-gradient(160deg, rgba(255,255,255,.16), rgba(255,255,255,0) 46%)' }}
                        />
                        <span className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${p.cols}, 7px)` }}>
                          {p.keys.map((k, di) => (
                            <span
                              key={`${k}-${di}`}
                              className="h-[7px] w-[7px] rounded-[2px]"
                              style={{
                                background: on
                                  ? di === 0
                                    ? '#f8f4f4'
                                    : 'rgba(248,244,244,.62)'
                                  : 'rgba(248,244,244,.3)',
                              }}
                            />
                          ))}
                        </span>
                      </span>
                      <span className="flex flex-col items-center gap-0.5">
                        <span
                          className="text-sm font-heading"
                          style={{ color: on ? '#f8f4f4' : '#7d7979' }}
                        >
                          {p.name.replace('Taptile ', '')}
                        </span>
                        <span
                          className="text-[11px] tracking-[0.02em]"
                          style={{ color: on ? '#9b9797' : '#605d5d' }}
                        >
                          {p.keys.length} keys · {p.dials.length} dial{p.dials.length > 1 ? 's' : ''}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex items-baseline gap-3 border-t border-white/10 pt-5">
                <h3 className="text-2xl font-heading tracking-heading text-neutral-100">{range.name}</h3>
                <span className="ml-auto text-[11px] tracking-[0.12em] text-neutral-700">{range.model}</span>
              </div>

              <p className="mt-3.5 text-sm leading-relaxed text-neutral-500">{range.description}</p>

              <button
                type="button"
                onClick={jumpToWaitlist}
                className="mt-[22px] inline-flex w-full items-center justify-center gap-2 rounded-full border px-[18px] py-3.5 text-sm font-heading transition"
                style={{
                  borderColor: rangeChosen ? '#f8f4f4' : 'rgba(255,255,255,.12)',
                  background: rangeChosen ? '#f8f4f4' : 'rgba(255,255,255,.02)',
                  color: rangeChosen ? '#131111' : '#f8f4f4',
                }}
              >
                {rangeChosen ? 'On your list ✓' : `Tell me about the ${range.name.replace('Taptile ', '')}`}
              </button>
            </div>

            {/* right column: board preview */}
            <div className="stage-soft flex min-h-[520px] items-center justify-center overflow-x-auto rounded-2xl border border-white/[0.07] bg-[#121110] px-6 py-10">
              <div className="relative max-w-full rounded-2xl border border-white/[0.09] bg-surface p-5 shadow-[0_40px_90px_rgba(0,0,0,.7),inset_0_1px_0_rgba(255,255,255,.06)]">
                <div className="flex items-center gap-2.5 px-0.5 pb-4">
                  <span className="h-2.5 w-[18px] shrink-0 rounded-[3px] border border-neutral-900 bg-bezel" />
                  <span className="whitespace-nowrap text-[10px] font-heading uppercase tracking-[0.16em] text-neutral-400">
                    {range.name}
                  </span>
                  <span className="ml-auto whitespace-nowrap text-[9.5px] tracking-[0.12em] text-neutral-700">
                    {range.model}
                  </span>
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#3ec95f]" />
                </div>

                <div
                  className="grid justify-center gap-2.5"
                  style={{
                    gridTemplateColumns: `repeat(${range.cols}, ${range.keySize}px)`,
                    gridAutoRows: `${range.keySize}px`,
                  }}
                >
                  {range.keys.map((k, i) => (
                    <div
                      key={`${k}-${i}`}
                      className="rounded-lg border border-white/[0.07] bg-bezel p-[3px] shadow-[0_6px_14px_rgba(0,0,0,.5),inset_0_1px_0_rgba(255,255,255,.06)]"
                    >
                      <div className="relative grid h-full w-full place-items-center rounded-md bg-keycap">
                        <span className="absolute left-1.5 top-1.5 text-[8.5px] font-heading tracking-[0.1em] text-[#3d3a3a]">
                          K{i + 1}
                        </span>
                        <span className="px-1.5 text-center text-[10.5px] leading-tight text-neutral-400">
                          {LABELS[k] ?? k}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="my-5 mb-3.5 flex items-center gap-2.5">
                  <span className="text-[9.5px] uppercase tracking-[0.16em] text-neutral-700">Rotary</span>
                  <span className="h-px flex-1 bg-white/[0.08]" />
                </div>

                <div className="flex flex-wrap justify-center gap-[26px]">
                  {range.dials.map((d, i) => (
                    <div key={`${d}-${i}`} className="flex flex-col items-center gap-1.5">
                      <span
                        className="grid h-[74px] w-[74px] place-items-center rounded-full border-2 border-bezel bg-bezel p-1 shadow-[0_6px_14px_rgba(0,0,0,.5),inset_0_1px_0_rgba(255,255,255,.06)]"
                      >
                        <span
                          className="grid h-full w-full place-items-center rounded-full bg-keycap text-[10px] text-neutral-400"
                          style={{
                            backgroundImage:
                              'repeating-conic-gradient(from 0deg, rgba(255,255,255,.07) 0deg 3deg, transparent 3deg 9deg)',
                          }}
                        >
                          {LABELS[d] ?? d}
                        </span>
                      </span>
                      <span className="text-[8.5px] font-heading tracking-[0.14em] text-neutral-700">D{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------- software (#software) --------------------------- */}
      <section id="software" className="scroll-mt-20 border-t-2 border-divider py-[88px]">
        <div className="mx-auto max-w-shell px-5">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div>
              <p className="kicker-accent">02 — Software</p>
              <h2 className="mt-3 text-3xl font-heading tracking-heading text-neutral-100 sm:text-4xl">
                The app comes with it
              </h2>
              <p className="mt-4 max-w-lg text-neutral-400">
                Taptile ships with the configurator — no subscription, no account required. Map a
                key, name it, pick an icon, set the light. It writes straight to the board.
              </p>
            </div>
            <p className="max-w-[260px] text-[13px] text-neutral-600">
              The real app, running right here. Hit <span className="text-neutral-300">Test mode</span> on
              the sign-in screen to jump straight to the key-mapping page.
            </p>
          </div>

          <SoftwareDemo />
        </div>
      </section>

      {/* ------------------------------- how (#how) ------------------------------- */}
      <section id="how" className="scroll-mt-20 border-t-2 border-divider py-[88px]">
        <div className="mx-auto max-w-shell px-5">
          <p className="kicker-accent">03 — Setup</p>
          <h2 className="mt-3 text-3xl font-heading tracking-heading text-neutral-100 sm:text-4xl">
            How it works
          </h2>
          <div className="mt-11 grid border-t-2 border-divider sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="border-hairline pr-7 pt-8 pb-8 sm:border-r sm:last:border-r-0">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-neutral-100 font-heading text-[15px] text-keycap shadow-glow">
                  {index + 1}
                </span>
                <h3 className="mt-[22px] text-lg font-heading text-neutral-100">{step.title}</h3>
                <p className="mt-2.5 max-w-xs text-[15px] leading-relaxed text-neutral-400">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------ poster statement ------------------------------ */}
      <section className="border-t-2 border-divider py-[88px]">
        <div className="mx-auto max-w-shell px-5">
          <div className="overflow-hidden rounded-2xl bg-neutral-100 px-14 py-16 shadow-glow">
            <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-700">Taptile Mini · TP-09D2</p>
            <h2 className="mt-3.5 max-w-3xl text-4xl font-heading leading-[1.02] tracking-heading text-ground sm:text-5xl">
              Nine keys. Two dials.
              <br />
              Every shortcut you own.
            </h2>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <button
                type="button"
                onClick={jumpToWaitlist}
                className="inline-flex items-center rounded-full bg-ground px-6 py-3.5 font-heading text-base text-neutral-100 transition hover:bg-neutral-900"
              >
                Get told when it ships
              </button>
              <span className="text-sm text-neutral-700">
                Or the Nano and the Pro, if nine is the wrong number.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------- waitlist (#waitlist) ---------------------------- */}
      <section
        id="waitlist"
        className="scroll-mt-20 border-t-2 border-divider"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 0%, rgba(236,48,19,.16), transparent 58%), linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 32px 32px, 32px 32px',
        }}
      >
        <div className="mx-auto grid max-w-shell items-start gap-16 px-5 py-24 lg:grid-cols-2">
          <div>
            <p className="kicker-accent">04 — Early access</p>
            <h2 className="mt-3 text-4xl font-heading leading-[1.05] tracking-heading text-neutral-100 sm:text-5xl">
              Want one first?
            </h2>
            <p className="mt-[18px] max-w-md text-lg leading-relaxed text-neutral-400">
              Tell us which board you want and we&apos;ll email you once it&apos;s ready to order.
            </p>

            <div className="mt-8 flex flex-col gap-3.5">
              {PROMISES.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-white/[0.16] text-[11px] text-neutral-100">
                    ✓
                  </span>
                  <p className="text-[15px] text-neutral-400">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.12] bg-surface p-8 shadow-shell">
            {saved ? (
              <div role="status" aria-live="polite">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#3ec95f] text-[22px] text-ground">
                  ✓
                </span>
                <h3 className="mt-5 text-2xl font-heading tracking-heading text-neutral-100">
                  You&apos;re on the list.
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-neutral-400">
                  We&apos;ll email {saved.email} once these are ready to order. Nothing else.
                </p>
                <div className="mt-6 border-t border-hairline pt-5">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-700">Interested in</p>
                  <p className="mt-1 text-[22px] font-heading text-neutral-100">{saved.interest}</p>
                </div>
                <button
                  type="button"
                  onClick={resetWaitlist}
                  className="mt-[22px] text-[13px] text-neutral-600 underline"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => submit(e, `landing:${interest}`)} noValidate>
                <p className="mb-2.5 text-xs text-neutral-500">Which board do you want?</p>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((label) => {
                    const on = interest === label;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          setInterest(label);
                          setError(null);
                        }}
                        aria-pressed={on}
                        className="rounded-full border px-4 py-2.5 text-[13px] font-semibold transition"
                        style={{
                          borderColor: on ? '#f8f4f4' : 'rgba(255,255,255,.12)',
                          background: on ? '#f8f4f4' : 'rgba(255,255,255,.02)',
                          color: on ? '#131111' : '#bab6b6',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <label htmlFor="waitlist-email" className="mb-2 mt-6 block text-xs text-neutral-500">
                  Email address
                </label>
                <input
                  id="waitlist-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className="field"
                  disabled={status === 'busy'}
                />

                {error && (
                  <p role="alert" className="mt-2.5 text-sm text-accent-400">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-primary mt-4 w-full py-3.5"
                  disabled={status === 'busy'}
                >
                  {submitLabel}
                </button>

                <p className="mt-3.5 text-xs leading-relaxed text-neutral-500">
                  We&apos;ll only use your address for the launch email.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------- faq (#faq) ------------------------------- */}
      <section id="faq" className="scroll-mt-20 border-t-2 border-divider py-[88px]">
        <div className="mx-auto max-w-[820px] px-5">
          <p className="kicker-accent">05 — Questions</p>
          <h2 className="mt-3 text-3xl font-heading tracking-heading text-neutral-100 sm:text-4xl">
            Questions
          </h2>
          <div className="mt-9 border-t border-hairline">
            {FAQ.map((item) => (
              <details key={item.q} className="group border-b border-hairline px-1 py-[22px]">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-[17px] font-medium text-neutral-100 marker:content-['']">
                  {item.q}
                  <span className="shrink-0 text-xl text-neutral-500 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3.5 max-w-[640px] text-[15px] leading-relaxed text-neutral-400">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
