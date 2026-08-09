import { useId, useState, type FormEvent } from 'react';
import { joinWaitlist } from '../lib/waitlist';

/**
 * Email capture. Success is deliberately identical whether the address was new
 * or already on the list — see lib/waitlist.ts for why.
 */
export default function WaitlistForm({ source = 'landing' }: { source?: string }) {
  const inputId = useId();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setStatus('busy');

    const result = await joinWaitlist(email, source);

    if (!result.ok) {
      setError(result.error ?? 'Something went wrong.');
      setStatus('idle');
      return;
    }
    setStatus('done');
  }

  if (status === 'done') {
    return (
      <div
        className="rounded-xl border border-hairline bg-surface px-5 py-4"
        role="status"
        aria-live="polite"
      >
        <p className="font-semibold text-neutral-100">You&apos;re on the list.</p>
        <p className="mt-1 text-sm text-neutral-400">
          We&apos;ll email {email} once these are ready to order. Nothing else.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        <input
          id={inputId}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="field flex-1"
          disabled={status === 'busy'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          aria-invalid={error ? true : undefined}
        />
        <button type="submit" className="btn-primary shrink-0 px-6" disabled={status === 'busy'}>
          {status === 'busy' ? 'Joining…' : 'Join the list'}
        </button>
      </div>

      {error && (
        <p id={`${inputId}-error`} className="mt-2.5 text-sm text-accent-400" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
