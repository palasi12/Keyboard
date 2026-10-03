import { createContext, useCallback, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { joinWaitlist } from '../lib/waitlist';
import { isSupabaseConfigured } from '../lib/supabase';

/**
 * Waitlist state shared by every signup form on the page.
 *
 * Signups still go through the same `join_waitlist` RPC and the same
 * `waitlist-confirmation` edge function as before (see lib/waitlist.ts) — this
 * file only changes how the form behaves:
 *
 *  - one shared address, so what you type in the hero is still there at the
 *    bottom of the page, and a signup anywhere confirms everywhere
 *  - a honeypot field: bots fill it, people never see it, and a filled one is
 *    quietly "accepted" without touching the database
 *  - the campaign that brought the visitor (utm_source or ?ref=) rides along in
 *    the source string, e.g. "hero+tiktok:Taptile Dialect", so the admin can
 *    see which post actually fills the list. The part after the colon is still
 *    the board, which the confirmation email reads.
 *  - after joining: copy-link and share buttons, because the cheapest next
 *    signup is a friend of this one.
 */

const INTEREST = 'Taptile Dialect';
const STORE_KEY = 'taptile-waitlist-v1';
const REF_KEY = 'taptile-ref';
const EMAIL_SHAPE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const SITE = 'https://www.trytaptile.com';

interface Saved {
  email: string;
  interest: string;
}

interface WaitlistState {
  email: string;
  setEmail: (value: string) => void;
  error: string | null;
  busy: boolean;
  saved: Saved | null;
  submit: (event: FormEvent, place: string, honeypot: string) => Promise<void>;
  reset: () => void;
}

const Ctx = createContext<WaitlistState | null>(null);

function readRef(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('utm_source') ?? params.get('ref');
    if (fromUrl) {
      const clean = fromUrl.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);
      if (clean) {
        sessionStorage.setItem(REF_KEY, clean);
        return clean;
      }
    }
    return sessionStorage.getItem(REF_KEY) ?? '';
  } catch {
    return '';
  }
}

export function WaitlistProvider({ children }: { children: ReactNode }) {
  const [email, setEmailRaw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [ref, setRef] = useState('');

  useEffect(() => {
    setRef(readRef());
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) setSaved(JSON.parse(raw) as Saved);
    } catch {
      /* unreadable storage — just show the form */
    }
  }, []);

  const setEmail = useCallback((value: string) => {
    setEmailRaw(value);
    setError(null);
  }, []);

  const submit = useCallback(
    async (event: FormEvent, place: string, honeypot: string) => {
      event.preventDefault();
      if (busy) return;
      const trimmed = email.trim();
      setError(null);

      if (!trimmed) return setError('Enter your email address.');
      if (!EMAIL_SHAPE.test(trimmed)) return setError('That does not look like an email address.');

      setBusy(true);
      const record: Saved = { email: trimmed, interest: INTEREST };

      if (honeypot) {
        // A bot filled the hidden field. Look successful, store nothing.
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else if (isSupabaseConfigured) {
        const source = `${place}${ref ? `+${ref}` : ''}:${INTEREST}`;
        const result = await joinWaitlist(trimmed, source);
        if (!result.ok) {
          setError(result.error ?? 'Something went wrong. Please try again.');
          setBusy(false);
          return;
        }
      } else if (import.meta.env.DEV) {
        // Local dev without Supabase keys: pretend, so the form can be designed.
        await new Promise((resolve) => setTimeout(resolve, 400));
      } else {
        // A live build without keys must never fake a signup — the address would be lost.
        setError('Signups are temporarily unavailable. Please try again soon.');
        setBusy(false);
        return;
      }

      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(record));
      } catch {
        /* storage blocked — the signup itself already worked */
      }
      setSaved(record);
      setBusy(false);
    },
    [busy, email, ref],
  );

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
    setSaved(null);
    setEmailRaw('');
    setError(null);
  }, []);

  const value = useMemo(
    () => ({ email, setEmail, error, busy, saved, submit, reset }),
    [email, setEmail, error, busy, saved, submit, reset],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWaitlist(): WaitlistState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useWaitlist must sit inside <WaitlistProvider>');
  return ctx;
}

/** The email form. `place` tags where on the page the signup happened. */
export function WaitlistForm({ place, note = true }: { place: string; note?: boolean }) {
  const { email, setEmail, error, busy, saved, submit, reset } = useWaitlist();
  const [honeypot, setHoneypot] = useState('');
  const [copied, setCopied] = useState(false);
  const id = `wl-${place}`;

  if (saved) {
    const share = async () => {
      const data = {
        title: 'Taptile Dialect',
        text: 'Nine keys, two knobs, underglow. Join the Taptile waitlist:',
        url: SITE,
      };
      try {
        if (navigator.share) {
          await navigator.share(data);
          return;
        }
        await navigator.clipboard.writeText(SITE);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } catch {
        /* share sheet dismissed */
      }
    };

    return (
      <div className="wl-done" role="status" aria-live="polite">
        <span className="wl-tick" aria-hidden="true">✓</span>
        <div>
          <h4>You are on the list.</h4>
          <p>We will email {saved.email} when the first batch is ready to order. Nothing else.</p>
          <div className="wl-actions">
            <button type="button" onClick={share}>{copied ? 'Link copied' : 'Share with a friend'}</button>
            <button type="button" onClick={reset}>Use a different email</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => submit(event, place, honeypot)} noValidate>
      <div className="wl-row">
        <label htmlFor={id} className="sr-only">Email address</label>
        <input
          id={id}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-err` : undefined}
        />
        <input
          className="wl-hp"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          name="company"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
        <button type="submit" className="btn btn-white" disabled={busy}>
          {busy ? 'Joining…' : 'Join the waitlist'}
        </button>
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="wl-err">
          {error}
        </p>
      )}
      {note && !error && <p className="wl-note">No payment. One email when the first batch opens.</p>}
    </form>
  );
}
