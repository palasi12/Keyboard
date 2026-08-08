import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../lib/catalog';
import { useCart } from '../lib/cart';
import { isCheckoutConfigured, startCheckout } from '../lib/checkout';
import { useAuth } from '../lib/auth';

export default function Cart() {
  const { lines, subtotal, setQuantity, remove } = useCart();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setError(null);
    setBusy(true);
    const result = await startCheckout(
      lines.map((line) => ({ slug: line.slug, quantity: line.quantity })),
      user?.email,
    );
    setBusy(false);
    if (!result.ok) setError(result.error ?? 'Checkout failed.');
  }

  if (lines.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="text-2xl font-bold text-neutral-100">Your basket is empty</h1>
        <p className="mt-3 text-neutral-400">Have a look at what we make.</p>
        <Link to="/shop" className="btn-primary mt-7">
          Shop keyboards
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-5 py-14">
      <h1 className="text-3xl font-heading tracking-heading text-neutral-100">Your basket</h1>

      <div className="mt-10 divide-y-2 divide-divider border-y-2 border-divider">
        {lines.map((line) => (
          <div key={line.slug} className="flex flex-wrap items-center gap-5 py-5">
            <div
              className="h-20 w-20 shrink-0 rounded-none"
              style={{ backgroundColor: line.product.swatch, opacity: 0.85 }}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <Link
                to={`/product/${line.slug}`}
                className="font-semibold text-neutral-100 transition hover:text-accent-500"
              >
                {line.product.name}
              </Link>
              <p className="mt-1 text-sm text-neutral-500">
                {formatPrice(line.product.price)} each
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor={`cart-qty-${line.slug}`} className="sr-only">
                Quantity for {line.product.name}
              </label>
              <input
                id={`cart-qty-${line.slug}`}
                type="number"
                min={1}
                max={10}
                value={line.quantity}
                onChange={(event) => setQuantity(line.slug, Number(event.target.value))}
                className="field w-20 px-2.5 py-1.5 text-sm"
              />
              <span className="w-20 text-right font-semibold text-neutral-100">
                {formatPrice(line.lineTotal)}
              </span>
              <button
                type="button"
                onClick={() => remove(line.slug)}
                className="text-sm text-neutral-500 transition hover:text-rose-400"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-end gap-3">
        <div className="flex w-full max-w-xs items-center justify-between">
          <span className="text-neutral-400">Subtotal</span>
          <span className="text-2xl font-heading text-neutral-100">{formatPrice(subtotal)}</span>
        </div>
        <p className="text-xs text-neutral-600">Shipping and tax calculated at checkout.</p>

        {!isCheckoutConfigured && (
          <div className="mt-2 w-full rounded-none border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
            <p className="font-semibold text-amber-300">Checkout is not connected yet</p>
            <p className="mt-1.5 leading-relaxed text-amber-200/70">
              This site cannot take payments until you build the Stripe endpoint and set{' '}
              <code className="text-amber-200">VITE_CHECKOUT_ENDPOINT</code>. See{' '}
              <code className="text-amber-200">docs/CHECKOUT.md</code>.
            </p>
          </div>
        )}

        {error && (
          <p className="w-full text-right text-sm text-rose-400" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleCheckout}
          disabled={busy}
          className="btn-primary mt-2 w-full py-3 text-base sm:w-auto sm:px-12"
        >
          {busy ? 'Starting checkout…' : 'Checkout'}
        </button>
      </div>
    </section>
  );
}
