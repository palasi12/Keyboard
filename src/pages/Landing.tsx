import { useEffect, useState, type FormEvent } from 'react';
import { joinWaitlist } from '../lib/waitlist';
import { isSupabaseConfigured } from '../lib/supabase';
import Seo from '../components/Seo';
import Reveal from '../components/Reveal';
import Dialects from '../components/Dialects';

/**
 * Landing page (V5 brand handoff).
 *
 * Three sections and nothing else: the board, the dialects it ships with, and
 * a way to hear when it is orderable. There is one product and no checkout, so
 * every route the page offers ends at the same place — the waitlist.
 *
 * Both email forms share one piece of state, so an address typed into the hero
 * is still there at the bottom of the page. Signups go through the real
 * `joinWaitlist` RPC; the local copy only exists so a returning visitor keeps
 * the confirmed state instead of being asked twice.
 */

/** One board exists, so there is nothing to choose between. */
const INTEREST = 'Taptile Dialect';
const WAITLIST_KEY = 'taptile-waitlist-v1';
const EMAIL_SHAPE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const PROMISES = [
  'You hear from us when the first batch is ready to order, and not before.',
  'Early access to the board, before the general listing.',
  'Your address is only used for the launch email. Leave the list in one click.',
];

const SPECS = [
  ['Layout', '3x3 + 2'],
  ['Board', 'RP2040'],
  ['Firmware', 'QMK / VIA'],
];

interface Saved {
  email: string;
  interest: string;
}

export default function Landing() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'busy'>('idle');
  const [saved, setSaved] = useState<Saved | null>(null);
  // Keystroke count, so the nine keys on the signup card light under typing.
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WAITLIST_KEY);
      if (raw) setSaved(JSON.parse(raw) as Saved);
    } catch {
      /* ignore unreadable storage */
    }
  }, []);

  async function submit(event: FormEvent, source: string) {
    event.preventDefault();
    const trimmed = email.trim();
    setError(null);

    if (!trimmed) {
      setError('Enter your email address.');
      return;
    }
    if (!EMAIL_SHAPE.test(trimmed)) {
      setError('That does not look like an email address.');
      return;
    }

    setStatus('busy');

    // With Supabase wired up the signup is stored for real. Before that
    // (pre-launch, no keys) confirm the visitor anyway rather than showing them
    // an error for something they did nothing wrong in.
    if (isSupabaseConfigured) {
      const result = await joinWaitlist(trimmed, `${source}:${INTEREST}`);
      if (!result.ok) {
        setError(result.error ?? 'Something went wrong.');
        setStatus('idle');
        return;
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    const record: Saved = { email: trimmed, interest: INTEREST };
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
    setTyped(0);
  }

  function onEmailChange(value: string) {
    setEmail(value);
    setError(null);
    setTyped((count) => count + 1);
  }

  const submitLabel = status === 'busy' ? 'Joining…' : 'Join the list';

  return (
    <>
      <Seo
        title="Taptile — programmable mini keyboards"
        description="The Taptile Dialect: nine programmable mechanical keys and two rotary dials for the shortcuts you use every day. Designed in Auckland, New Zealand. NZ$70."
        path="/"
        image="/og.svg"
      />

      {/* ---------------------------------- hero ---------------------------------- */}
      {/* Runs up under the fixed nav — the pill floats over the artwork. */}
      <section className="relative -mt-[88px] overflow-hidden bg-ground">
        <div className="aurora pointer-events-none absolute inset-0" aria-hidden="true" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-1/5 -top-[30%] h-[170%] w-[70%] animate-sweep blur-[60px]"
          style={{
            background:
              'linear-gradient(100deg, rgba(255,255,255,0), rgba(201,180,255,.05) 46%, rgba(255,255,255,0))',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[24%]"
          style={{
            background:
              'linear-gradient(180deg, rgba(11,10,10,0), rgba(11,10,10,.72) 78%, rgba(11,10,10,.96))',
          }}
        />

        <div
          className="relative z-[3] mx-auto grid min-h-screen max-w-[1200px] items-center gap-8
                     px-5 pb-7 pt-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,470px)] lg:gap-0"
        >
          <div className="animate-rise relative z-[3] w-full max-w-[600px] lg:justify-self-end">
            <h1 className="text-[clamp(26px,3vw,46px)] leading-[1.1] text-neutral-100 sm:whitespace-nowrap">
              Nine keys. Two dials.
              <br />
              <span className="serif text-[clamp(32px,3.8vw,58px)]">
                As many dialects as you need.
              </span>
            </h1>

            <p className="mt-5 max-w-[470px] text-[17.5px] leading-[1.62] text-neutral-400">
              The Dialect is a nine-key macro pad with two clicking dials and a lit acrylic base.
              Map it once in the configurator and the layout lives on the board.
            </p>

            <div className="mt-7 max-w-[470px]">
              {saved ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-[18px] border border-white/[0.16] bg-surface px-[22px] py-5 shadow-panel"
                >
                  <p className="flex items-center gap-2.5 font-heading text-[17px] text-neutral-100">
                    <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-[#3ec95f] text-[13px] text-ground">
                      ✓
                    </span>
                    You are on the list.
                  </p>
                  <p className="mt-2 text-sm text-neutral-400">
                    We will email {saved.email} once the first run opens. We have noted the{' '}
                    {saved.interest}.
                  </p>
                </div>
              ) : (
                <form onSubmit={(event) => submit(event, 'hero')} noValidate>
                  <div className="flex flex-col gap-2.5 sm:flex-row">
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
                      onChange={(event) => onEmailChange(event.target.value)}
                      className="field h-[52px] flex-1 border-white/[0.14] bg-surface/70 px-5 text-[15.5px] backdrop-blur"
                    />
                    <button
                      type="submit"
                      disabled={status === 'busy'}
                      className="btn-primary h-[52px] shrink-0 whitespace-nowrap px-7 text-[15px]"
                    >
                      {submitLabel}
                    </button>
                  </div>

                  {error && (
                    <p role="alert" className="mt-2.5 text-sm text-danger">
                      {error}
                    </p>
                  )}

                  <p className="mt-3 max-w-[440px] text-[13.5px] text-neutral-600">
                    No payment now · one email when the first run opens
                  </p>
                </form>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-[18px] gap-y-2 text-sm text-neutral-500">
              <span>NZ$70</span>
              <span className="h-3 w-px bg-neutral-100/[0.14]" />
              <span>Windows, macOS, Linux</span>
              <span className="h-3 w-px bg-neutral-100/[0.14]" />
              <span>Remapped in the browser</span>
            </div>

            <div
              className="mt-6 h-px w-full max-w-[470px]"
              style={{
                background: 'linear-gradient(90deg, rgba(255,255,255,.16), rgba(255,255,255,0))',
              }}
            />

            <dl className="mt-[18px] grid w-full max-w-[470px] grid-cols-3 gap-[18px]">
              {SPECS.map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <dt className="text-[10px] uppercase tracking-[0.18em] text-neutral-700">
                    {label}
                  </dt>
                  <dd className="font-heading text-sm tracking-heading text-neutral-200">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative z-[1] h-[380px] min-w-0 sm:h-[480px] lg:h-auto lg:self-stretch">
            <div
              className="absolute left-1/2 top-1/2 h-[min(910px,168vh)] w-auto animate-float"
              style={{ aspectRatio: '2200 / 2750' }}
            >
              <div
                aria-hidden="true"
                className="absolute left-[22%] top-[62%] h-[16%] w-[66%] rounded-full opacity-55 blur-[40px]"
                style={{
                  background:
                    'radial-gradient(closest-side, rgba(198,150,255,.9), rgba(139,107,255,0) 78%)',
                }}
              />
              <div
                aria-hidden="true"
                className="absolute left-[20%] top-[56%] w-[74%] animate-breathe rounded-full pb-[74%] blur-[74px]"
                style={{
                  background:
                    'radial-gradient(closest-side at 30% 26%, rgba(63,160,255,.6), rgba(63,160,255,0) 70%), radial-gradient(closest-side at 56% 52%, rgba(139,107,255,.58), rgba(139,107,255,0) 72%), radial-gradient(closest-side at 74% 80%, rgba(233,107,216,.54), rgba(233,107,216,0) 70%)',
                }}
              />
              <div
                aria-hidden="true"
                className="absolute bottom-[12%] left-[18%] h-[7%] w-[66%] rounded-full blur-[26px]"
                style={{
                  background: 'radial-gradient(closest-side, rgba(0,0,0,.66), rgba(0,0,0,0) 76%)',
                }}
              />
              <img
                src="/dialect-hero.png"
                alt="The Taptile Dialect macro pad hanging by its braided cable, over its lit acrylic base"
                className="relative block h-full w-full object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------- dialects -------------------------------- */}
      <Dialects />

      {/* ---------------------------- waitlist (#waitlist) ---------------------------- */}
      <section
        id="waitlist"
        className="relative scroll-mt-[70px] overflow-hidden"
        style={{
          backgroundImage:
            'linear-gradient(180deg, #0b0a0a 0%, rgba(11,10,10,0) 280px), radial-gradient(64% 52% at 22% 24%, rgba(63,160,255,.16), rgba(11,10,10,0) 72%), radial-gradient(58% 54% at 78% 78%, rgba(233,107,216,.16), rgba(11,10,10,0) 74%), radial-gradient(70% 60% at 50% 46%, rgba(139,107,255,.14), rgba(11,10,10,0) 76%)',
        }}
      >
        <Reveal className="mx-auto grid max-w-shell items-start gap-12 px-5 py-24 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="kicker-accent">Early access</p>
            <h2 className="mt-3 text-[clamp(34px,3.6vw,48px)] leading-[1.05] text-neutral-100">
              Want one <span className="serif text-[clamp(40px,4.4vw,58px)]">first?</span>
            </h2>
            <p className="mt-[18px] max-w-[460px] text-[17px] leading-[1.6] text-neutral-400">
              Leave your address and we will email you once the board is ready to order.
            </p>

            <div className="mt-8 flex flex-col gap-3.5">
              {PROMISES.map((promise) => (
                <div key={promise} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full
                               border border-white/[0.16] text-[11px] text-neutral-100"
                  >
                    ✓
                  </span>
                  <p className="text-[15px] text-neutral-400">{promise}</p>
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
                <h3 className="mt-5 text-2xl text-neutral-100">You are on the list.</h3>
                <p className="mt-2.5 text-[15px] leading-[1.6] text-neutral-400">
                  We will email {saved.email} once these are ready to order. Nothing else.
                </p>
                <div className="mt-6 border-t border-white/[0.08] pt-5">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-700">
                    Interested in
                  </p>
                  <p className="mt-1 font-heading text-[22px] text-neutral-100">{saved.interest}</p>
                </div>
                <button
                  type="button"
                  onClick={resetWaitlist}
                  className="mt-5 border-0 bg-none p-0 text-[13px] text-neutral-600 underline"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={(event) => submit(event, 'waitlist')} noValidate>
                {/* Nine keys that light under your typing, like the board does. */}
                <div aria-hidden="true" className="mb-[22px] flex gap-[7px]">
                  {Array.from({ length: 9 }, (_, i) => {
                    const head = (typed - 1) % 9;
                    const back = (head - i + 9) % 9;
                    const heat = typed === 0 ? 0 : Math.max(0, 1 - back / 3.4);
                    const lit = heat > 0.05;
                    return (
                      <span
                        key={i}
                        className="flex-1 rounded-[9px] p-0.5 transition-[transform,box-shadow] duration-[250ms]"
                        style={{
                          aspectRatio: '1',
                          background: 'linear-gradient(180deg,#3a3634,#211f1e)',
                          transform: heat > 0.55 ? 'translateY(1px) scale(.97)' : 'none',
                          boxShadow: lit
                            ? `0 5px 12px rgba(0,0,0,.5), 0 0 ${(6 + 16 * heat).toFixed(0)}px rgba(139,107,255,${(0.5 * heat).toFixed(2)})`
                            : '0 5px 12px rgba(0,0,0,.5)',
                        }}
                      >
                        <span
                          className="block h-full w-full rounded-[7px] transition-[background] duration-[250ms]"
                          style={{
                            background: lit
                              ? `rgba(139,107,255,${(0.16 + 0.72 * heat).toFixed(2)})`
                              : 'linear-gradient(180deg,#211f1e,#171514)',
                          }}
                        />
                      </span>
                    );
                  })}
                </div>

                <label htmlFor="waitlist-email" className="label">
                  Email address
                </label>
                <input
                  id="waitlist-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  className="field border-white/[0.12] bg-keycap px-5 py-3.5 text-[15px]"
                />

                {error && (
                  <p role="alert" className="mt-2.5 text-sm text-danger">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'busy'}
                  className="btn-primary mt-4 w-full py-[15px] text-[15px]"
                >
                  {submitLabel}
                </button>

                <p className="mt-3.5 text-xs leading-[1.5] text-neutral-500">
                  We will only use your address for the launch email.
                </p>
              </form>
            )}
          </div>
        </Reveal>
      </section>
    </>
  );
}
