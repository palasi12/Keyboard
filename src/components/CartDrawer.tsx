import { Link } from 'react-router-dom';
import { formatPrice } from '../lib/catalog';
import { useCart } from '../lib/cart';

export default function CartDrawer() {
  const { lines, subtotal, isOpen, setOpen, setQuantity, remove } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label="Basket">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={() => setOpen(false)}
        aria-label="Close basket"
      />

      <div className="relative flex h-full w-full max-w-sm flex-col border-l-2 border-divider bg-ground">
        <div className="flex items-center justify-between border-b-2 border-divider px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-100">Your basket</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-neutral-500 transition hover:text-neutral-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-sm text-neutral-500">Nothing in here yet.</p>
            <Link to="/shop" onClick={() => setOpen(false)} className="btn-secondary">
              Browse keyboards
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {lines.map((line) => (
                <div key={line.slug} className="flex gap-4">
                  <div
                    className="h-16 w-16 shrink-0 rounded-none"
                    style={{ backgroundColor: line.product.swatch, opacity: 0.85 }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-100">
                      {line.product.name}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {formatPrice(line.product.price)} each
                    </p>

                    <div className="mt-2.5 flex items-center gap-2">
                      <label htmlFor={`qty-${line.slug}`} className="sr-only">
                        Quantity for {line.product.name}
                      </label>
                      <input
                        id={`qty-${line.slug}`}
                        type="number"
                        min={1}
                        max={10}
                        value={line.quantity}
                        onChange={(event) => setQuantity(line.slug, Number(event.target.value))}
                        className="field w-16 px-2 py-1 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => remove(line.slug)}
                        className="text-xs text-neutral-500 transition hover:text-rose-400"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-neutral-100">{formatPrice(line.lineTotal)}</p>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-divider px-5 py-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">Subtotal</span>
                <span className="text-lg font-bold text-neutral-100">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-neutral-600">
                Shipping and tax calculated at checkout.
              </p>
              <Link
                to="/cart"
                onClick={() => setOpen(false)}
                className="btn-primary mt-4 w-full py-2.5"
              >
                Go to basket
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
